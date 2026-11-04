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
    this.data.badges ??= {}; // 已獲得的徽章 { "first": 時間戳 }
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
      <a class="brand" href="index.html"><span class="brand-logo">🐍</span><span class="brand-text">Python 學習路線</span></a>
      <nav>
        ${link("index.html", "課程地圖", "home")}
        ${link("playground.html", "練習場", "playground")}
        ${link("cheatsheet.html", "速查表", "cheatsheet")}
      </nav>
      <div class="search" role="search">
        <input type="search" id="search-input" placeholder="搜尋課程…" aria-label="搜尋課程" autocomplete="off">
        <kbd class="search-key">/</kbd>
        <div class="search-results" id="search-results" hidden></div>
      </div>
      <span class="py-status" id="py-status" title="瀏覽器裡的 Python 狀態"></span>
      <button class="theme-btn icon-btn" aria-label="切換深淺色">${Theme.current() === "dark" ? "☀️" : "🌙"}</button>
    </div>`;
  el.querySelector(".theme-btn").addEventListener("click", () => Theme.toggle());
  Search.init();
}

// ---------- 搜尋 ----------
const Search = {
  index: null,
  async load() {
    if (this.index) return this.index;
    try {
      const r = await fetch("data/search-index.json");
      const extra = await r.json();
      const byId = Object.fromEntries(extra.map((e) => [e.id, e]));
      this.index = [];
      for (const stage of CATALOG) {
        stage.lessons.forEach((title, i) => {
          const id = lessonId(stage, i);
          const e = byId[id] || { headings: [], text: "" };
          this.index.push({ id, stage, title, headings: e.headings, text: e.text });
        });
      }
    } catch (_) {
      this.index = [];
    }
    return this.index;
  },
  query(q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const results = [];
    for (const e of this.index) {
      const title = e.title.toLowerCase();
      const heads = e.headings.join(" ").toLowerCase();
      const text = e.text.toLowerCase();
      let score = 0;
      let hit = 0;
      for (const t of terms) {
        const s = (title.includes(t) ? 10 : 0) + (heads.includes(t) ? 4 : 0) + Math.min(3, text.split(t).length - 1);
        if (s) hit++;
        score += s;
      }
      if (hit) results.push({ e, score, hit });
    }
    // 符合越多個關鍵字的排越前面，其次看分數
    return results.sort((a, b) => b.hit - a.hit || b.score - a.score).slice(0, 8).map((r) => r.e);
  },
  snippet(e, q) {
    const t = q.toLowerCase().split(/\s+/).filter(Boolean)[0] || "";
    const text = e.text;
    const i = text.toLowerCase().indexOf(t);
    if (i < 0) return escapeHtml(e.headings.slice(0, 3).join("・"));
    const start = Math.max(0, i - 24);
    const raw = (start > 0 ? "…" : "") + text.slice(start, i + t.length + 40) + "…";
    return escapeHtml(raw).replace(new RegExp(escapeRegExp(escapeHtml(t)), "ig"), (m) => `<mark>${m}</mark>`);
  },
  init() {
    const input = document.getElementById("search-input");
    const box = document.getElementById("search-results");
    if (!input) return;
    let active = -1;
    const render = async () => {
      await this.load();
      const q = input.value.trim();
      if (!q) { box.hidden = true; return; }
      const res = this.query(q);
      active = res.length ? 0 : -1;
      box.innerHTML = res.length
        ? res.map((e, i) => `<a href="lesson.html?id=${e.id}" class="${i === 0 ? "active" : ""}">
            <span class="sr-stage">${e.stage.icon} 第 ${e.stage.num} 階段</span>
            <span class="sr-title">${escapeHtml(e.title)}${Store.isDone(e.id) ? " ✓" : ""}</span>
            <span class="sr-snippet">${this.snippet(e, q)}</span></a>`).join("")
        : `<div class="sr-empty">找不到「${escapeHtml(q)}」相關的課程</div>`;
      box.hidden = false;
    };
    const move = (d) => {
      const items = box.querySelectorAll("a");
      if (!items.length) return;
      active = (active + d + items.length) % items.length;
      items.forEach((a, i) => a.classList.toggle("active", i === active));
      items[active].scrollIntoView({ block: "nearest" });
    };
    input.addEventListener("input", render);
    input.addEventListener("focus", () => { this.load(); if (input.value.trim()) render(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") {
        const a = box.querySelectorAll("a")[active];
        if (a) location.href = a.href;
      } else if (e.key === "Escape") { box.hidden = true; input.blur(); }
    });
    document.addEventListener("click", (e) => { if (!e.target.closest(".search")) box.hidden = true; });
    document.addEventListener("keydown", (e) => {
      const typing = e.target.closest("input, textarea, .CodeMirror");
      if (e.key === "/" && !typing) { e.preventDefault(); input.focus(); }
    });
  },
};

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- 徽章 ----------
const Badges = {
  list() {
    const stageBadges = CATALOG.map((st) => ({
      id: `stage-${st.id}`, icon: st.icon, name: `${st.title}畢業`,
      desc: `完成第 ${st.num} 階段的所有課程`,
      test: () => Store.stageProgress(st).done === st.lessons.length,
    }));
    const doneCount = () => Object.keys(Store.load().done).length;
    const exCount = () => Object.keys(Store.load().ex).length;
    const total = CATALOG.reduce((n, s) => n + s.lessons.length, 0);
    const projects = [];
    CATALOG.forEach((st) => st.lessons.forEach((t, i) => { if (t.startsWith("🎯")) projects.push(lessonId(st, i)); }));
    return [
      { id: "first", icon: "🌱", name: "第一步", desc: "完成第一堂課", test: () => doneCount() >= 1 },
      { id: "ten", icon: "🔟", name: "漸入佳境", desc: "完成 10 堂課", test: () => doneCount() >= 10 },
      { id: "ex30", icon: "💪", name: "練習達人", desc: "通過 30 題練習", test: () => exCount() >= 30 },
      { id: "boss3", icon: "⚔️", name: "Boss 獵人", desc: "完成 3 個 🎯 專案", test: () => projects.filter((p) => Store.isDone(p)).length >= 3 },
      { id: "half", icon: "🚀", name: "半程達成", desc: `完成 ${Math.ceil(total / 2)} 堂課`, test: () => doneCount() >= Math.ceil(total / 2) },
      ...stageBadges,
      { id: "all", icon: "👑", name: "Python 大師", desc: "完成全部課程", test: () => doneCount() >= total },
    ];
  },
  // 檢查是否有新的徽章，回傳新獲得的
  check() {
    const d = Store.load();
    const fresh = [];
    for (const b of this.list()) {
      if (!d.badges[b.id] && b.test()) {
        d.badges[b.id] = Date.now();
        fresh.push(b);
      }
    }
    if (fresh.length) Store.save();
    return fresh;
  },
  announce() {
    this.check().forEach((b, i) => setTimeout(() => toast(`🏆 獲得徽章：${b.icon} ${b.name}`), 600 + i * 1800));
  },
};

function toast(msg, ms = 3500) {
  let box = document.getElementById("toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "toasts";
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, ms);
}

// ---------- 進度備份 ----------
const Backup = {
  export() {
    const blob = new Blob([JSON.stringify(Store.load(), null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `python-學習進度-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  import(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data.done !== "object") throw new Error("格式不對");
        const cur = Store.load();
        for (const k of ["done", "ex", "code", "badges"]) Object.assign(cur[k], data[k] || {});
        Store.save();
        toast("✅ 已匯入學習進度");
        setTimeout(() => location.reload(), 800);
      } catch (e) {
        toast("⚠️ 匯入失敗：檔案格式不正確");
      }
    };
    reader.readAsText(file);
  },
  reset() {
    if (!confirm("確定要清除所有學習進度、練習紀錄和徽章嗎？這個動作無法復原。")) return;
    try { localStorage.removeItem(Store.key); } catch (_) {}
    location.reload();
  },
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
