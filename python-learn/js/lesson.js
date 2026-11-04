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
    <div class="lesson-tags" id="lesson-tags"></div>
    <article class="prose" id="prose"><p class="muted">載入課程中…</p></article>
    <div class="lesson-footer">
      <div class="done-wrap">
        <button class="btn ${Store.isDone(id) ? "done" : "primary"}" id="done-btn"></button>
        <span class="muted small" id="ex-progress"></span>
      </div>
      <div class="pager">
        ${prevId ? `<a class="btn ghost" href="lesson.html?id=${prevId}">← 上一課</a>` : ""}
        ${nextId ? `<a class="btn ghost" id="next-btn" href="lesson.html?id=${nextId}">下一課 →</a>` : `<a class="btn ghost" id="next-btn" href="index.html">回到課程地圖 🎉</a>`}
      </div>
    </div>`;

  const doneBtn = document.getElementById("done-btn");
  const paintDone = () => {
    const d = Store.isDone(id);
    doneBtn.textContent = d ? "✅ 已完成（點一下取消）" : "標記本課為完成";
    doneBtn.className = "btn " + (d ? "done" : "primary");
    document.getElementById("next-btn")?.classList.toggle("primary", d);   // 完成後，下一課變成主要按鈕
    renderSidebar(stage, id);
  };
  doneBtn.addEventListener("click", () => {
    Store.setDone(id, !Store.isDone(id));
    paintDone();
    if (Store.isDone(id)) Badges.announce();
  });
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
  const paintExProgress = () => {
    const el = document.getElementById("ex-progress");
    if (!exercises.length) return;
    const n = exercises.filter((_, i) => Store.exPassed(`${id}#${i}`)).length;
    el.textContent = n === exercises.length ? `練習 ${n}/${n} 全部通過 🎉` : `練習 ${n}/${exercises.length} 通過，全部通過會自動完成本課`;
  };
  paintExProgress();
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
          paintExProgress();
          if (allPassed() && !Store.isDone(id)) {
            Store.setDone(id);
            paintDone();
            toast("🎉 本課的練習全部通過，已自動標記為完成！");
          }
          Badges.announce();
        },
      },
    });
  });

  // 標題下的標籤：讓學生一眼知道這課能不能在網頁上完成
  const runnable = prose.querySelectorAll(".code-block .cb-run").length;
  const local = prose.querySelectorAll(".code-block:not(:has(.cb-run)), pre.terminal").length;
  const tags = [];
  if (runnable) tags.push(`<span class="tag ok">🐍 可以在網頁上執行</span>`);
  if (local) tags.push(`<span class="tag local">💻 部分程式要在自己的電腦或 Colab 執行</span>`);
  if (exercises.length) tags.push(`<span class="tag ex">✏️ ${exercises.length} 題練習</span>`);
  if (info.title.startsWith("🎯")) tags.push(`<span class="tag boss">⚔️ 專案關卡</span>`);
  document.getElementById("lesson-tags").innerHTML = tags.join("");

  if (runnable) PyRunner.start();     // 有可執行的程式才預先載入 Python
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

document.getElementById("side-toggle")?.addEventListener("click", (e) => {
  const open = document.body.classList.toggle("side-open");
  e.currentTarget.textContent = open ? "✕ 關閉列表" : "☰ 課程列表";
});
initLesson();
