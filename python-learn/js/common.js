// 各頁面共用：學習進度（存在瀏覽器 localStorage）、深淺色主題、頁首。

const Store = {
  key: "pylearn-v1",
  data: null,
  load() {
    if (this.data) return this.data;
    try {
      this.data = JSON.parse(localStorage.getItem(this.key)) || {};
    } catch (_) {
      this.data = {};
    }
    this.data.done ??= {};   // 已完成的課 { "s1-01": 時間戳 }
    this.data.ex ??= {};     // 已通過的練習 { "s1-01#0": true }
    this.data.code ??= {};   // 練習草稿 { "s1-01#0": "print(...)" }
    return this.data;
  },
  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch (_) { /* 無痕模式等情況存不了，就算了 */ }
  },
  isDone(id) { return !!this.load().done[id]; },
  setDone(id, v = true) {
    const d = this.load();
    if (v) d.done[id] = Date.now(); else delete d.done[id];
    this.save();
  },
  exPassed(key) { return !!this.load().ex[key]; },
  setExPassed(key) { this.load().ex[key] = true; this.save(); },
  getCode(key) { return this.load().code[key]; },
  setCode(key, code) { this.load().code[key] = code; this.save(); },
  clearCode(key) { delete this.load().code[key]; this.save(); },
  stageProgress(stage) {
    const total = stage.lessons.length;
    let done = 0;
    stage.lessons.forEach((_, i) => { if (this.isDone(lessonId(stage, i))) done++; });
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  },
  // 下一堂還沒完成的課（只看已上線的階段）
  nextLesson() {
    for (const stage of CATALOG) {
      if (!stage.ready) continue;
      for (let i = 0; i < stage.lessons.length; i++) {
        const id = lessonId(stage, i);
        if (!this.isDone(id)) return id;
      }
    }
    return null;
  },
};

const Theme = {
  key: "pylearn-theme",
  init() {
    let t = null;
    try { t = localStorage.getItem(this.key); } catch (_) {}
    if (t) document.documentElement.dataset.theme = t;
  },
  current() {
    const t = document.documentElement.dataset.theme;
    if (t) return t;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  },
  toggle() {
    const next = this.current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(this.key, next); } catch (_) {}
    document.querySelectorAll(".theme-btn").forEach((b) => (b.textContent = next === "dark" ? "☀️" : "🌙"));
  },
};
Theme.init();

function renderHeader(active) {
  const el = document.getElementById("site-header");
  if (!el) return;
  const link = (href, label, key) =>
    `<a href="${href}" class="${active === key ? "active" : ""}">${label}</a>`;
  el.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="index.html"><span class="brand-logo">🐍</span><span>Python 學習路線</span></a>
      <nav>
        ${link("index.html", "課程地圖", "home")}
        ${link("playground.html", "練習場", "playground")}
      </nav>
      <span class="py-status" id="py-status" title="瀏覽器裡的 Python 狀態"></span>
      <button class="theme-btn icon-btn" aria-label="切換深淺色">${Theme.current() === "dark" ? "☀️" : "🌙"}</button>
    </div>`;
  el.querySelector(".theme-btn").addEventListener("click", () => Theme.toggle());
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
