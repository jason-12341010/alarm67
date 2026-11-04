// 首頁：整體進度、技能地圖、階段卡片。
renderHeader("home");

const totalLessons = CATALOG.reduce((n, s) => n + s.lessons.length, 0);
const doneLessons = CATALOG.reduce((n, s) => n + Store.stageProgress(s).done, 0);
const next = Store.nextLesson();
const nextInfo = next && findLesson(next);

if (doneLessons > 0 && next) {
  const btn = document.getElementById("continue-btn");
  btn.textContent = "繼續學習 →";
  btn.href = `lesson.html?id=${next}`;
}

document.getElementById("overall").innerHTML = `
  <div class="overall-card">
    <div>
      <div class="muted small">整體進度</div>
      <div class="overall-num">${doneLessons} <span>/ ${totalLessons} 課</span></div>
    </div>
    <div class="bar big"><span style="width:${Math.round((doneLessons / totalLessons) * 100)}%"></span></div>
    ${nextInfo ? `<a class="next-up" href="lesson.html?id=${next}"><span class="muted small">下一課</span><b>${nextInfo.stage.icon} ${escapeHtml(nextInfo.title)}</b></a>` : ""}
  </div>`;

function node(stage) {
  const p = Store.stageProgress(stage);
  const state = !stage.ready ? "soon" : p.done === p.total ? "complete" : p.done > 0 ? "doing" : "open";
  const first = lessonId(stage, 0);
  return `<a class="map-node ${state}" href="lesson.html?id=${first}" style="--pct:${p.pct}%">
      <span class="map-icon">${stage.icon}</span>
      <span class="map-num">${stage.num}</span>
      <span class="map-title">${stage.title}</span>
      <span class="map-meta">${stage.ready ? `${p.done}/${p.total}` : "製作中"}</span>
    </a>`;
}
const byPart = (p) => CATALOG.filter((s) => s.part === p);
document.getElementById("skill-map").innerHTML = `
  <div class="map-row">
    <div class="map-part">${PARTS.A}</div>
    <div class="map-chain">${byPart("A").map(node).join('<span class="map-arrow">→</span>')}</div>
  </div>
  <div class="map-fork"><span>選擇路線 ↓</span></div>
  <div class="map-branches">
    <div class="map-row branch web">
      <div class="map-part">${PARTS.B}</div>
      <div class="map-chain">${byPart("B").map(node).join('<span class="map-arrow">→</span>')}</div>
    </div>
    <div class="map-row branch ai">
      <div class="map-part">${PARTS.C}</div>
      <div class="map-chain">${byPart("C").map(node).join('<span class="map-arrow">→</span>')}</div>
    </div>
  </div>`;

document.getElementById("stage-grid").innerHTML = CATALOG.map((stage) => {
  const p = Store.stageProgress(stage);
  return `<article class="stage-card ${stage.ready ? "" : "soon"}">
    <div class="stage-top">
      <span class="stage-icon">${stage.icon}</span>
      <span class="stage-num">第 ${stage.num} 階段</span>
      ${stage.ready ? "" : `<span class="pill">製作中</span>`}
    </div>
    <h3>${stage.title}</h3>
    <p class="muted">${stage.desc}</p>
    <div class="bar"><span style="width:${p.pct}%"></span></div>
    <details>
      <summary>${stage.lessons.length} 堂課・已完成 ${p.done}</summary>
      <ol>${stage.lessons.map((t, i) => {
        const id = lessonId(stage, i);
        return `<li class="${Store.isDone(id) ? "done" : ""}">${stage.ready ? `<a href="lesson.html?id=${id}">${escapeHtml(t)}</a>` : escapeHtml(t)}</li>`;
      }).join("")}</ol>
    </details>
  </article>`;
}).join("");
