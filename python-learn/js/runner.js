// 瀏覽器內的 Python 執行器（Pyodide + Web Worker）與程式編輯區塊。

const ERROR_HELP = {
  SyntaxError: ["語法錯誤", "Python 看不懂這行的寫法。常見原因：少了冒號 :、括號或引號沒有成對、把 = 和 == 搞混。"],
  IndentationError: ["縮排錯誤", "Python 用縮排區分程式區塊。檢查 if、for、def 下面的程式是否都縮排 4 個空白，而且同一層的縮排要對齊。"],
  TabError: ["Tab 與空白混用", "同一個區塊裡混用了 Tab 和空白。建議統一只用 4 個空白。"],
  NameError: ["找不到這個名稱", "使用了還沒定義的變數或函式。檢查拼字和大小寫，以及是否在使用前就先定義了。字串記得加引號。"],
  TypeError: ["型別錯誤", "對不適合的型別做了操作，例如把字串和數字相加（\"3\" + 1），或是呼叫函式時參數數量不對。"],
  ValueError: ["值錯誤", "型別對了，但值不合理，例如 int(\"abc\")：\"abc\" 沒辦法轉成整數。"],
  IndexError: ["索引超出範圍", "要取的位置不存在。長度 3 的串列，索引只有 0、1、2（或 -1 到 -3）。"],
  KeyError: ["找不到這個鍵", "字典裡沒有這個 key。可以先用 `key in d` 檢查，或改用 d.get(key) 取值。"],
  ZeroDivisionError: ["除以零", "數學上不能除以 0。先檢查除數是不是 0。"],
  AttributeError: ["沒有這個屬性或方法", "這個物件沒有你呼叫的方法，例如 list 沒有 .push()（應該用 .append()）。檢查拼字和型別。"],
  ModuleNotFoundError: ["找不到模組", "要 import 的套件不存在，或瀏覽器版 Python 沒有內建。檢查名稱拼字。"],
  ImportError: ["匯入錯誤", "模組存在，但裡面找不到你要匯入的名稱。"],
  UnboundLocalError: ["區域變數還沒賦值", "函式裡面對某個變數賦值，Python 會把它當成區域變數。如果要修改外面的變數，需要用 global 或 nonlocal。"],
  RecursionError: ["遞迴太深", "函式一直呼叫自己停不下來。檢查有沒有寫終止條件。"],
  EOFError: ["沒有輸入資料", "程式呼叫了 input()，可是「輸入」框裡沒有足夠的行數。一行對應一次 input()。"],
  FileNotFoundError: ["找不到檔案", "要開啟的檔案不存在。檢查檔名，或先用 \"w\" 模式建立它。"],
  StopIteration: ["迭代結束", "對已經沒有元素的迭代器呼叫了 next()。"],
  AssertionError: ["斷言失敗", "assert 後面的條件是 False。"],
  OverflowError: ["數值溢位", "數字太大，超過能表示的範圍。"],
  MemoryError: ["記憶體不足", "程式用了太多記憶體，可能是串列無限增長。"],
};

const PyRunner = {
  worker: null,
  state: "idle", // idle | loading | ready | running | error
  seq: 0,
  waiting: null,   // { id, resolve, timer }
  queue: Promise.resolve(),
  readyPromise: null,
  TIMEOUT: 15000,
  LOAD_TIMEOUT: 180000,

  start() {
    if (this.worker) return this.readyPromise;
    this.setState("loading");
    this.worker = new Worker("js/py-worker.js");
    this.worker.onmessage = (e) => this.onMessage(e.data);
    this.worker.onerror = () => this.setState("error");
    this.readyPromise = new Promise((resolve) => {
      this._resolveReady = resolve;
    });
    this.worker.postMessage({ id: 0, type: "warmup" });
    return this.readyPromise;
  },

  onMessage(msg) {
    if (msg.type === "ready") {
      this.setState("ready");
      this._resolveReady();
      return;
    }
    if (msg.type === "fatal") {
      this.setState("error");
      return;
    }
    if (this.waiting && msg.id === this.waiting.id && msg.type === "status") {
      this.waiting.onStatus && this.waiting.onStatus(msg.text);
      return;
    }
    if (this.waiting && msg.id === this.waiting.id && msg.type === "started") {
      // 套件下載完、真正開始執行，才開始計算逾時
      clearTimeout(this.waiting.timer);
      this.waiting.timer = setTimeout(this.waiting.onTimeout, this.TIMEOUT);
      return;
    }
    if (this.waiting && msg.id === this.waiting.id) {
      clearTimeout(this.waiting.timer);
      const w = this.waiting;
      this.waiting = null;
      this.setState("ready");
      w.resolve(msg);
    }
  },

  setState(s) {
    this.state = s;
    const el = document.getElementById("py-status");
    if (!el) return;
    const label = {
      idle: "", loading: "⏳ Python 載入中…", ready: "● Python 就緒",
      running: "▶ 執行中…", error: "⚠ Python 載入失敗",
    }[s];
    el.textContent = label;
    el.className = "py-status " + s;
  },

  // 把程式排進佇列，一次只跑一個；超過時間就整個重開 worker（處理無窮迴圈）
  run(code, stdin = "", check = "", onStatus = null) {
    const job = this.queue.then(async () => {
      await this.start();
      if (this.state === "error") {
        return { output: "", error: "Python 無法載入，請檢查網路連線後重新整理頁面。", error_type: "LoadError" };
      }
      return new Promise((resolve) => {
        const id = ++this.seq;
        this.setState("running");
        const onTimeout = (loading) => {
          this.waiting = null;
          this.restart();
          resolve({
            output: "", error_type: "Timeout",
            error: loading
              ? "下載套件花了太久時間，請檢查網路連線後再試一次。"
              : `執行超過 ${this.TIMEOUT / 1000} 秒被強制停止。很可能是無窮迴圈：檢查 while 的條件最後會不會變成 False。`,
          });
        };
        const timer = setTimeout(() => onTimeout(true), this.LOAD_TIMEOUT);
        this.waiting = { id, resolve, timer, onStatus, onTimeout: () => onTimeout(false) };
        this.worker.postMessage({ id, type: "run", code, stdin, check });
      });
    });
    this.queue = job.catch(() => {});
    return job;
  },

  stop() {
    if (!this.waiting) return;
    clearTimeout(this.waiting.timer);
    const w = this.waiting;
    this.waiting = null;
    this.restart();
    w.resolve({ output: "", error: "已手動停止執行。", error_type: "Stopped" });
  },

  restart() {
    if (this.worker) this.worker.terminate();
    this.worker = null;
    this.start();
  },
};

// ---------- 程式區塊 ----------
// opts: { code, readOnly, exercise: { check, stdin, hint, solution, key, onPass }, storeKey, tall }
function createCodeBlock(container, opts) {
  const ex = opts.exercise;
  const initial = (ex && Store.getCode(ex.key)) || opts.code;
  const wrap = document.createElement("div");
  wrap.className = "code-block" + (ex ? " is-exercise" : "") + (opts.tall ? " tall" : "");
  wrap.innerHTML = `
    <div class="cb-toolbar">
      <span class="cb-label">${ex ? "✏️ 你的答案" : opts.readOnly ? (opts.label || "📄 程式碼（在自己的電腦上執行）") : "🐍 可以修改後執行"}</span>
      <span class="cb-spacer"></span>
      ${ex && ex.hint ? `<button class="btn ghost small cb-hint">💡 提示</button>` : ""}
      ${ex && ex.solution ? `<button class="btn ghost small cb-sol">👀 看解答</button>` : ""}
      ${opts.readOnly ? `<button class="btn ghost small cb-copy" title="複製程式碼">📋 複製</button>` : `<button class="btn ghost small cb-reset" title="恢復原本的程式">↺ 重設</button>`}
      ${opts.readOnly ? "" : `<button class="btn primary small cb-run" title="Ctrl + Enter">▶ ${ex ? "執行並檢查" : "執行"}</button>`}
    </div>
    <div class="cb-editor"></div>
    <div class="cb-stdin" hidden>
      <label>⌨️ 輸入（給 input() 用，一行對應一次 input()）${ex && ex.stdin != null ? "<span class='muted'>：檢查時使用固定輸入</span>" : ""}</label>
      <textarea rows="2" spellcheck="false"></textarea>
    </div>
    <div class="cb-extra"></div>
    <div class="cb-output" hidden></div>`;
  container.replaceWith(wrap);

  const cm = CodeMirror(wrap.querySelector(".cb-editor"), {
    value: initial.replace(/\n$/, ""),
    mode: "python",
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    readOnly: opts.readOnly ? "nocursor" : false,
    matchBrackets: true,
    autoCloseBrackets: true,
    viewportMargin: Infinity,
    extraKeys: {
      Tab: (c) => (c.somethingSelected() ? c.indentSelection("add") : c.replaceSelection("    ")),
      "Shift-Tab": (c) => c.indentSelection("subtract"),
      "Ctrl-Enter": () => !opts.readOnly && run(),
      "Cmd-Enter": () => !opts.readOnly && run(),
    },
  });

  const stdinBox = wrap.querySelector(".cb-stdin");
  const stdinArea = stdinBox.querySelector("textarea");
  if (ex && ex.stdin != null) {
    stdinArea.value = ex.stdin;
    stdinArea.readOnly = true;
  } else if (opts.stdin) {
    stdinArea.value = opts.stdin;
  }
  const syncStdin = () => {
    stdinBox.hidden = !/\binput\s*\(/.test(cm.getValue());
  };
  syncStdin();

  let saveTimer;
  cm.on("change", () => {
    syncStdin();
    if (ex) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => Store.setCode(ex.key, cm.getValue()), 400);
    }
  });

  const out = wrap.querySelector(".cb-output");
  const extra = wrap.querySelector(".cb-extra");
  const runBtn = wrap.querySelector(".cb-run");
  let running = false;
  let errLine = null;

  async function run() {
    if (running) {
      PyRunner.stop();
      return;
    }
    running = true;
    runBtn.textContent = "■ 停止";
    runBtn.classList.add("danger");
    if (errLine) { cm.removeLineClass(errLine, "background", "cm-error-line"); errLine = null; }
    out.hidden = false;
    out.className = "cb-output";
    out.innerHTML = `<div class="muted">${PyRunner.state === "ready" ? "執行中…" : "⏳ 第一次執行要先下載 Python（約 5～15 秒），之後就很快了…"}</div>`;
    const res = await PyRunner.run(cm.getValue(), stdinArea.value, ex ? ex.check : "", (text) => {
      out.innerHTML = `<div class="muted">${escapeHtml(text)}</div>`;
    });
    running = false;
    runBtn.textContent = ex ? "▶ 執行並檢查" : "▶ 執行";
    runBtn.classList.remove("danger");
    showResult(res);
  }

  function showResult(res) {
    let html = "";
    const chunks = res.chunks || (res.output ? [["text", res.output]] : []);
    for (const [kind, data] of chunks) {
      if (kind === "text") html += `<pre class="out-text">${escapeHtml(data)}</pre>`;
      else if (kind === "img") html += `<img class="out-img" alt="程式畫出的圖表" src="data:image/png;base64,${data}">`;
      else if (kind === "html") html += `<div class="out-html">${data}</div>`;
    }
    if (res.error) {
      html += `<pre class="out-error">${escapeHtml(res.error.trimEnd())}</pre>`;
      const help = ERROR_HELP[res.error_type];
      if (help) {
        html += `<div class="err-help"><b>🩺 ${res.error_type}：${help[0]}</b>${res.line ? `（第 ${res.line} 行）` : ""}<br>${escapeHtml(help[1]).replace(/`([^`]+)`/g, "<code>$1</code>")}</div>`;
      }
      if (res.line) {
        errLine = cm.getLineHandle(res.line - 1);
        if (errLine) cm.addLineClass(errLine, "background", "cm-error-line");
      }
    }
    if (!chunks.length && !res.error) html += `<div class="muted">（程式執行完畢，沒有輸出任何內容）</div>`;
    if (ex && res.check) {
      if (res.check.ok) {
        html += `<div class="check ok">✅ 答對了！做得好。</div>`;
        Store.setExPassed(ex.key);
        wrap.classList.add("passed");
        ex.onPass && ex.onPass();
      } else {
        html += `<div class="check bad">❌ ${escapeHtml(res.check.msg)}</div>`;
      }
    }
    out.innerHTML = html;
  }

  runBtn?.addEventListener("click", run);
  wrap.querySelector(".cb-copy")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    try { await navigator.clipboard.writeText(cm.getValue()); btn.textContent = "✓ 已複製"; }
    catch (_) { btn.textContent = "請手動選取"; }
    setTimeout(() => (btn.textContent = "📋 複製"), 1500);
  });
  wrap.querySelector(".cb-reset")?.addEventListener("click", () => {
    cm.setValue(opts.code.replace(/\n$/, ""));
    if (ex) Store.clearCode(ex.key);
    out.hidden = true;
  });
  wrap.querySelector(".cb-hint")?.addEventListener("click", () => {
    extra.innerHTML = `<div class="hint-box">💡 ${marked_inline(ex.hint)}</div>`;
  });
  wrap.querySelector(".cb-sol")?.addEventListener("click", () => {
    if (!confirm("確定要看解答嗎？先自己試試看，學得會更扎實喔！")) return;
    extra.innerHTML = `<div class="hint-box"><b>參考解答</b>（可以按「套用」把它放進編輯器）<pre class="sol">${escapeHtml(ex.solution)}</pre><button class="btn ghost small sol-apply">套用解答</button></div>`;
    extra.querySelector(".sol-apply").addEventListener("click", () => cm.setValue(ex.solution.replace(/\n$/, "")));
  });
  if (ex && Store.exPassed(ex.key)) wrap.classList.add("passed");
  return { cm, run };
}

function marked_inline(md) {
  return window.marked ? window.marked.parseInline(md) : escapeHtml(md);
}
