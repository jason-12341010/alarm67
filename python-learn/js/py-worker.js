// 在背景執行緒跑 Python，這樣無窮迴圈不會卡住整個網頁（主畫面可以直接把 worker 停掉）。
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

const ready = (async () => {
  const py = await loadPyodide();
  const harness = await (await fetch("harness.py")).text();
  py.runPython(harness);
  return py;
})();

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
  try {
    await py.loadPackagesFromImports(code + "\n" + (check || ""));
  } catch (_) {
    /* 找不到的套件交給 Python 自己報 ModuleNotFoundError */
  }
  try {
    const res = py.globals.get("_run")(code, stdin || "", check || "");
    postMessage({ id, type: "result", ...JSON.parse(res) });
  } catch (err) {
    postMessage({ id, type: "result", output: "", error: String(err), error_type: "InternalError", check: null });
  }
};
