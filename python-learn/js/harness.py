# 在 Pyodide 裡執行學生程式的外殼：攔截輸出、模擬 input()、整理錯誤訊息、執行自動檢查。
import sys, io, json, traceback, builtins

_FILENAME = "<你的程式>"


def _clean_tb(exc):
    tb = traceback.TracebackException.from_exception(exc)
    # 只保留學生自己程式的那幾行，把外殼的堆疊藏起來
    tb.stack = traceback.StackSummary.from_list(
        [f for f in tb.stack if f.filename == _FILENAME]
    )
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
    out = io.StringIO()
    lines = iter(stdin_text.splitlines())

    def fake_input(prompt=""):
        out.write(str(prompt))
        try:
            value = next(lines)
        except StopIteration:
            raise EOFError("沒有更多輸入資料了，請在「輸入」框裡多填一行") from None
        out.write(value + "\n")  # 像終端機一樣把輸入的內容顯示出來
        return value

    ns = {"__name__": "__main__", "__builtins__": builtins, "input": fake_input}
    result = {"output": "", "error": None, "error_type": None, "line": None, "check": None}
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = out
    try:
        exec(compile(code, _FILENAME, "exec"), ns)
    except SystemExit:
        pass
    except BaseException as e:
        result["error"] = _clean_tb(e)
        result["error_type"] = type(e).__name__
        result["line"] = _line_of(e)
    finally:
        sys.stdout, sys.stderr = old_out, old_err
    result["output"] = out.getvalue()

    if check_code:
        if result["error"]:
            result["check"] = {"ok": False, "msg": "程式執行時發生錯誤，先把錯誤修好再檢查一次。"}
        else:
            cns = {"output": result["output"], "ns": ns, "code": code,
                   "lines": [l.rstrip() for l in result["output"].strip().splitlines()]}
            silent = io.StringIO()
            sys.stdout = silent
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
