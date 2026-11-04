// 在背景執行緒跑 Python，這樣無窮迴圈不會卡住整個網頁（主畫面可以直接把 worker 停掉）。
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

// Pyodide 沒有內建、要從 PyPI 安裝的純 Python 套件：import 名稱 → 套件名稱
const MICROPIP = { seaborn: "seaborn", openpyxl: "openpyxl" };
const installed = new Set();
const HEAVY = ["numpy", "pandas", "matplotlib", "sklearn", "scipy", "statsmodels", "pydantic", "sqlalchemy", "bs4", "lxml", "networkx", "sympy", "PIL", "cv2", "pytest", "seaborn", "openpyxl"];
const loadedOnce = new Set();

const ready = (async () => {
  const py = await loadPyodide();
  const harness = await (await fetch("harness.py")).text();
  py.runPython(harness);
  return py;
})();

function status(id, text) {
  postMessage({ id, type: "status", text });
}

// 程式裡提到 data/ 資料夾裡有的檔案（例如 "titanic.csv"），就先放進虛擬檔案系統
async function mountDataFiles(py, code) {
  const names = new Set([...code.matchAll(/["']([\w.-]+\.(?:csv|json|txt))["']/g)].map((m) => m[1]));
  for (const name of names) {
    try {
      if (py.FS.analyzePath(name).exists) continue;
      const r = await fetch(`../data/${name}`);
      if (!r.ok) continue;
      py.FS.writeFile(name, new Uint8Array(await r.arrayBuffer()));
    } catch (_) { /* 不是我們提供的資料檔，略過 */ }
  }
}

// 瀏覽器版 matplotlib 沒有中文字型：第一次畫圖時載入精簡版的 Noto Sans TC
let fontMounted = false;
async function mountFont(py) {
  if (fontMounted) return;
  try {
    const r = await fetch("../data/fonts/NotoSansTC-subset.ttf");
    if (!r.ok) return;
    py.FS.mkdirTree("/fonts");
    py.FS.writeFile("/fonts/NotoSansTC.ttf", new Uint8Array(await r.arrayBuffer()));
    fontMounted = true;
  } catch (_) { /* 沒有字型就用預設字型 */ }
}

self.onmessage = async (e) => {
  const { id, type, code, stdin, check } = e.data;
  let py;
  try {
    py = await ready;
  } catch (err) {
    postMessage({ id, type: "fatal", message: String(err) });
    return;
  }
  if (type === "warmup") {
    postMessage({ id, type: "ready" });
    return;
  }
  const all = code + "\n" + (check || "");
  try {
    const wanted = py.pyodide_py.code.find_imports(all).toJs();
    const missing = wanted.filter((m) => HEAVY.includes(m) && !loadedOnce.has(m));
    missing.forEach((m) => loadedOnce.add(m));
    if (missing.length) status(id, `📦 第一次使用，正在下載套件：${missing.join("、")}（可能要十幾秒）…`);
    await py.loadPackagesFromImports(all);
    // pandas 的 to_excel / read_excel 在背後需要 openpyxl，程式裡不一定有 import
    if (/\.to_excel\(|read_excel\(|ExcelWriter|ExcelFile/.test(all)) wanted.push("openpyxl");
    const pip = [...new Set(wanted)].filter((m) => MICROPIP[m] && !installed.has(m));
    if (pip.length) {
      status(id, `📦 正在從 PyPI 安裝：${pip.join("、")}…`);
      await py.loadPackage("micropip");
      const micropip = py.pyimport("micropip");
      for (const m of pip) {
        await micropip.install(MICROPIP[m]);
        installed.add(m);
      }
    }
    await mountDataFiles(py, all);
    if (/matplotlib|pandas|seaborn/.test(all)) await mountFont(py);
  } catch (err) {
    /* 找不到的套件交給 Python 自己報 ModuleNotFoundError */
    console.warn("套件載入失敗", err);
  }
  postMessage({ id, type: "started" });
  try {
    const res = py.globals.get("_run")(code, stdin || "", check || "");
    postMessage({ id, type: "result", ...JSON.parse(res) });
  } catch (err) {
    postMessage({ id, type: "result", output: "", error: String(err), error_type: "InternalError", check: null });
  }
};
