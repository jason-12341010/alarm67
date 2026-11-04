// 課程頁：讀取 lessons/<stage>/<編號>.md，轉成 HTML，把 Python 範例變成可執行的編輯器。
//
// 課程檔格式（Markdown）：
//   ```python   → 可以修改、執行的範例
//   ```py       → 只能看、不能執行的範例（例如會開伺服器的程式）
//   ```stdin    → 緊接在 ```python 後面時，作為該範例 input() 的預設輸入
//   ```bash     → 終端機指令，附「複製」按鈕
//   :::exercise 練習標題
//   題目說明（Markdown）
//   @@starter   → 一開始給的程式
//   @@check     → 檢查用的 Python，可用 output（輸出字串）、lines（輸出每一行）、ns（學生程式的變數）、code（原始碼）
//   @@stdin     → （選用）檢查時給 input() 的固定輸入
//   @@hint      → （選用）提示
//   @@solution  → （選用）參考解答
//   :::

function parseExercises(md) {
  const exercises = [];
  const out = md.replace(/^:::exercise[ \t]*(.*)\r?\n([\s\S]*?)\r?\n:::[ \t]*$/gm, (_, title, body) => {
    const parts = body.split(/^@@(\w+)[ \t]*\r?\n/m);
    const ex = { title: title.trim(), desc: parts[0].trim(), starter: "", check: "", stdin: null, hint: "", solution: "" };
    for (let i = 1; i < parts.length; i += 2) {
      const val = parts[i + 1].replace(/\s+$/, "") + "\n";
      if (parts[i] === "stdin") ex.stdin = val.replace(/\n$/, "");
      else ex[parts[i]] = parts[i] === "hint" ? val.trim() : val;
    }
    exercises.push(ex);
    return `\n<div class="ex-slot" data-i="${exercises.length - 1}"></div>\n`;
  });
  return { md: out, exercises };
}

async function initLesson() {
  renderHeader("lesson");
  const id = new URLSearchParams(location.search).get("id") || "s1-01";
  const info = findLesson(id);
  const main = document.getElementById("lesson-main");
  if (!info) {
    main.innerHTML = `<h1>找不到這堂課</h1><p><a href="index.html">回到課程地圖</a></p>`;
    return;
  }
  const { stage, index } = info;
  document.title = `${info.title}｜Python 學習路線`;
  renderSidebar(stage, id);

  const prevId = index > 0 ? lessonId(stage, index - 1) : null;
  const nextStage = CATALOG[CATALOG.indexOf(stage) + 1];
  const nextId = index < stage.lessons.length - 1 ? lessonId(stage, index + 1)
    : nextStage && nextStage.ready ? lessonId(nextStage, 0) : null;

  main.innerHTML = `
    <div class="lesson-crumb"><a href="index.html">課程地圖</a> › ${stage.icon} 第 ${stage.num} 階段：${stage.title} › 第 ${index + 1} 課</div>
    <h1 class="lesson-title">${escapeHtml(info.title)}</h1>
    <article class="prose" id="prose"><p class="muted">載入課程中…</p></article>
    <div class="lesson-footer">
      <button class="btn ${Store.isDone(id) ? "done" : "primary"}" id="done-btn"></button>
      <div class="pager">
        ${prevId ? `<a class="btn ghost" href="lesson.html?id=${prevId}">← 上一課</a>` : ""}
        ${nextId ? `<a class="btn ghost" href="lesson.html?id=${nextId}">下一課 →</a>` : `<a class="btn ghost" href="index.html">回到課程地圖</a>`}
      </div>
    </div>`;

  const doneBtn = document.getElementById("done-btn");
  const paintDone = () => {
    const d = Store.isDone(id);
    doneBtn.textContent = d ? "✅ 已完成（點一下取消）" : "標記本課為完成";
    doneBtn.className = "btn " + (d ? "done" : "primary");
    renderSidebar(stage, id);
  };
  doneBtn.addEventListener("click", () => { Store.setDone(id, !Store.isDone(id)); paintDone(); });
  paintDone();

  if (!stage.ready) {
    document.getElementById("prose").innerHTML = `<div class="callout">🚧 這個階段的課程還在製作中，敬請期待！</div>`;
    doneBtn.hidden = true;
    return;
  }

  const file = `lessons/${stage.id}/${String(index + 1).padStart(2, "0")}.md`;
  let md;
  try {
    const r = await fetch(file);
    if (!r.ok) throw new Error(r.status);
    md = await r.text();
  } catch (e) {
    document.getElementById("prose").innerHTML = `<div class="callout">⚠️ 課程檔案載入失敗（${escapeHtml(file)}）。如果你是直接雙擊打開 HTML 檔，請改用本機伺服器開啟，說明在 README。</div>`;
    return;
  }

  const { md: body, exercises } = parseExercises(md);
  const prose = document.getElementById("prose");
  prose.innerHTML = marked.parse(body);

  // 可執行範例
  // 緊接在範例後面的 ```stdin 區塊 = 這個範例的預設輸入
  prose.querySelectorAll("pre > code.language-python").forEach((code) => {
    const pre = code.parentElement;
    const next = pre.nextElementSibling;
    let stdin = "";
    if (next && next.matches("pre") && next.querySelector("code.language-stdin")) {
      stdin = next.textContent.replace(/\n$/, "");
      next.remove();
    }
    createCodeBlock(pre, { code: code.textContent, stdin });
  });
  // 唯讀範例
  prose.querySelectorAll("pre > code.language-py").forEach((code) => {
    createCodeBlock(code.parentElement, { code: code.textContent, readOnly: true });
  });
  // 終端機指令：加上複製按鈕
  prose.querySelectorAll("pre > code.language-bash, pre > code.language-shell").forEach((code) => {
    const pre = code.parentElement;
    pre.classList.add("terminal");
    const btn = document.createElement("button");
    btn.className = "btn ghost small copy-btn";
    btn.textContent = "複製";
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(code.textContent.trim()); btn.textContent = "已複製 ✓"; }
      catch (_) { btn.textContent = "請手動選取"; }
      setTimeout(() => (btn.textContent = "複製"), 1500);
    });
    pre.appendChild(btn);
  });

  // 練習題
  const allPassed = () => exercises.every((_, i) => Store.exPassed(`${id}#${i}`));
  prose.querySelectorAll(".ex-slot").forEach((slot) => {
    const i = +slot.dataset.i;
    const ex = exercises[i];
    const box = document.createElement("section");
    box.className = "exercise";
    box.innerHTML = `
      <div class="ex-head"><span class="ex-tag">練習 ${i + 1}</span><h3>${escapeHtml(ex.title)}</h3><span class="ex-status"></span></div>
      <div class="ex-desc">${marked.parse(ex.desc)}</div>
      <div class="ex-editor"></div>`;
    slot.replaceWith(box);
    const status = box.querySelector(".ex-status");
    const paint = () => (status.textContent = Store.exPassed(`${id}#${i}`) ? "✅ 已通過" : "");
    paint();
    createCodeBlock(box.querySelector(".ex-editor"), {
      code: ex.starter,
      exercise: {
        key: `${id}#${i}`, check: ex.check, stdin: ex.stdin, hint: ex.hint, solution: ex.solution,
        onPass: () => {
          paint();
          if (allPassed() && !Store.isDone(id)) {
            Store.setDone(id);
            paintDone();
            toast("🎉 本課的練習全部通過，已自動標記為完成！");
          }
        },
      },
    });
  });

  PyRunner.start();
}

function renderSidebar(stage, currentId) {
  const side = document.getElementById("lesson-side");
  const p = Store.stageProgress(stage);
  side.innerHTML = `
    <div class="side-head">
      <div class="side-stage">${stage.icon} 第 ${stage.num} 階段</div>
      <div class="side-title">${stage.title}</div>
      <div class="bar"><span style="width:${p.pct}%"></span></div>
      <div class="muted small">${p.done} / ${p.total} 課完成</div>
    </div>
    <ol class="side-list">
      ${stage.lessons.map((t, i) => {
        const lid = lessonId(stage, i);
        return `<li class="${lid === currentId ? "current" : ""} ${Store.isDone(lid) ? "done" : ""}">
          <a href="lesson.html?id=${lid}"><span class="num">${Store.isDone(lid) ? "✓" : i + 1}</span><span>${escapeHtml(t)}</span></a></li>`;
      }).join("")}
    </ol>`;
}

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 3500);
}

document.getElementById("side-toggle")?.addEventListener("click", () => document.body.classList.toggle("side-open"));
initLesson();
