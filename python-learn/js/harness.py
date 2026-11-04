# 在 Pyodide 裡執行學生程式的外殼：攔截輸出、模擬 input()、顯示圖表與表格、整理錯誤訊息、執行自動檢查。
import sys, io, os, json, base64, traceback, builtins, warnings

os.environ.setdefault("MPLBACKEND", "AGG")
warnings.filterwarnings("ignore", message=".*non-interactive.*")
warnings.filterwarnings("ignore", category=DeprecationWarning)

_FILENAME = "<你的程式>"


class _Out(io.TextIOBase):
    """把輸出記錄成一段一段：文字、HTML 表格、圖片，保持出現的順序。"""

    def __init__(self):
        self.chunks = []

    def write(self, s):
        s = str(s)
        if not s:
            return 0
        if self.chunks and self.chunks[-1][0] == "text":
            self.chunks[-1][1] += s
        else:
            self.chunks.append(["text", s])
        return len(s)

    def add(self, kind, data):
        self.chunks.append([kind, data])

    def text(self):
        return "".join(c[1] for c in self.chunks if c[0] == "text")


_current = None


def _grab_figures():
    plt = sys.modules.get("matplotlib.pyplot")
    if plt is None or _current is None:
        return
    for num in plt.get_fignums():
        fig = plt.figure(num)
        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=110, bbox_inches="tight")
        _current.add("img", base64.b64encode(buf.getvalue()).decode())
    plt.close("all")


def _show(*args, **kwargs):
    _grab_figures()


def display(*objs):
    """像 Jupyter 一樣漂亮地顯示物件（例如 pandas 的 DataFrame 會變成表格）。"""
    for obj in objs:
        html = getattr(obj, "_repr_html_", None)
        if callable(html) and _current is not None:
            try:
                h = html()
            except Exception:
                h = None
            if h:
                _current.add("html", h)
                continue
        print(repr(obj))


def _prepare_matplotlib(code):
    if "matplotlib" not in code and "pandas" not in code and "seaborn" not in code:
        return
    try:
        import matplotlib
        matplotlib.use("AGG")
        import matplotlib.pyplot as plt
        plt.show = _show
        plt.close("all")
    except ImportError:
        pass


def _make_sync_asyncio_run():
    """瀏覽器版 Python 已經有一個事件迴圈在跑，asyncio.run() 不能用。
    這裡用一個「同步」的小事件迴圈代替，讓學生的程式跟在自己電腦上的寫法一樣。"""
    import asyncio, time
    from asyncio import events

    class _Selector:
        def select(self, timeout=None):
            if timeout:
                time.sleep(timeout)
            return []

        def close(self):
            pass

    class _SyncLoop(asyncio.BaseEventLoop):
        def __init__(self):
            super().__init__()
            self._selector = _Selector()

        def _process_events(self, event_list):
            pass

        def _write_to_self(self):
            pass

    def run(main, *, debug=None):
        previous = events._get_running_loop()
        events._set_running_loop(None)
        loop = _SyncLoop()
        try:
            return loop.run_until_complete(main)
        finally:
            try:
                loop.run_until_complete(loop.shutdown_asyncgens())
            finally:
                loop.close()
                events._set_running_loop(previous)

    return run


def _prepare_asyncio(code):
    if "asyncio" not in code or sys.platform != "emscripten":
        return
    import asyncio
    if not getattr(asyncio.run, "_pylearn", False):
        run = _make_sync_asyncio_run()
        run._pylearn = True
        asyncio.run = run


def _clean_tb(exc):
    tb = traceback.TracebackException.from_exception(exc)
    tb.stack = traceback.StackSummary.from_list([f for f in tb.stack if f.filename == _FILENAME])
    return "".join(tb.format())


def _line_of(exc):
    if isinstance(exc, SyntaxError) and exc.filename == _FILENAME:
        return exc.lineno
    line = None
    tb = exc.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == _FILENAME:
            line = tb.tb_lineno
        tb = tb.tb_next
    return line


def _run(code, stdin_text, check_code):
    global _current
    out = _Out()
    _current = out
    lines = iter(stdin_text.splitlines())

    def fake_input(prompt=""):
        out.write(str(prompt))
        try:
            value = next(lines)
        except StopIteration:
            raise EOFError("沒有更多輸入資料了，請在「輸入」框裡多填一行") from None
        out.write(value + "\n")
        return value

    ns = {"__name__": "__main__", "__builtins__": builtins, "input": fake_input, "display": display}
    result = {"output": "", "chunks": [], "error": None, "error_type": None, "line": None, "check": None}
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = out
    try:
        _prepare_matplotlib(code)
        _prepare_asyncio(code)
        exec(compile(code, _FILENAME, "exec"), ns)
        _grab_figures()
    except SystemExit:
        pass
    except BaseException as e:
        result["error"] = _clean_tb(e)
        result["error_type"] = type(e).__name__
        result["line"] = _line_of(e)
        try:
            _grab_figures()
        except Exception:
            pass
    finally:
        sys.stdout, sys.stderr = old_out, old_err
        _current = None
    result["output"] = out.text()
    result["chunks"] = out.chunks

    if check_code:
        if result["error"]:
            result["check"] = {"ok": False, "msg": "程式執行時發生錯誤，先把錯誤修好再檢查一次。"}
        else:
            cns = {"output": result["output"], "ns": ns, "code": code,
                   "lines": [l.rstrip() for l in result["output"].strip().splitlines()]}
            sys.stdout = io.StringIO()
            try:
                exec(check_code, cns)
                result["check"] = {"ok": True, "msg": ""}
            except AssertionError as e:
                result["check"] = {"ok": False, "msg": str(e) or "答案還不對，再試試看！"}
            except Exception as e:
                result["check"] = {"ok": False, "msg": f"檢查時出錯：{type(e).__name__}: {e}"}
            finally:
                sys.stdout = old_out
    return json.dumps(result, ensure_ascii=False)
