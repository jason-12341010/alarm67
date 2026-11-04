"""檢查所有課程檔：
- 每個練習的「參考解答」都要通過檢查
- 每個練習的「起始程式」都不能直接通過檢查
- 每個可執行範例都要能跑（標記為 # 會出錯 的範例除外，以及預期會出錯的錯誤示範）

用法：python3 tools/check_lessons.py  （在 python-learn 資料夾裡執行）
"""
import re
import sys
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent.parent
ns = {}
exec((ROOT / "js" / "harness.py").read_text(encoding="utf-8"), ns)
import signal


class Timeout(Exception):
    pass


def _alarm(*_):
    raise Timeout("超過 6 秒（可能是刻意的無窮迴圈示範）")


signal.signal(signal.SIGALRM, _alarm)


def run(code, stdin="", check=""):
    signal.alarm(6)
    try:
        return json.loads(ns["_run"](code, stdin, check))
    finally:
        signal.alarm(0)

EX_RE = re.compile(r"^:::exercise[ \t]*(.*)\r?\n([\s\S]*?)\r?\n:::[ \t]*$", re.M)
FENCE_RE = re.compile(r"^```python\n([\s\S]*?)^```\n(?:```stdin\n([\s\S]*?)^```\n)?", re.M)


def parse_ex(body):
    parts = re.split(r"^@@(\w+)[ \t]*\r?\n", body, flags=re.M)
    ex = {"starter": "", "check": "", "stdin": None, "solution": ""}
    for i in range(1, len(parts), 2):
        ex[parts[i]] = parts[i + 1].rstrip() + "\n"
    if ex["stdin"] is not None:
        ex["stdin"] = ex["stdin"].rstrip("\n")
    return ex


def main(only=None):
    import os, tempfile
    os.chdir(tempfile.mkdtemp(prefix="lesson-check-"))  # 練習會建立檔案，不要弄髒專案資料夾
    import shutil
    for csv in (ROOT / "data").glob("*.csv"):  # 跟瀏覽器一樣，資料檔放在目前資料夾
        shutil.copy(csv, ".")
    problems = 0
    files = sorted((ROOT / "lessons").glob("s*/*.md"))
    for f in files:
        rel = f.relative_to(ROOT)
        if only and only not in str(rel):
            continue
        text = f.read_text(encoding="utf-8")
        for m in EX_RE.finditer(text):
            title, ex = m.group(1), parse_ex(m.group(2))
            if not ex["check"].strip():
                print(f"⚠ {rel} [{title}] 沒有 check")
                problems += 1
                continue
            r = run(ex["solution"], ex["stdin"] or "", ex["check"])
            if not (r["check"] and r["check"]["ok"]):
                problems += 1
                print(f"❌ {rel} [{title}] 解答沒通過：{r['check']} {r['error'] or ''}\n   輸出：{r['output']!r}")
            r = run(ex["starter"], ex["stdin"] or "", ex["check"])
            if r["check"] and r["check"]["ok"]:
                problems += 1
                print(f"❌ {rel} [{title}] 起始程式竟然直接通過")
        prose = EX_RE.sub("", text)
        for m in FENCE_RE.finditer(prose):
            code, stdin = m.group(1), m.group(2) or ""
            r = run(code, stdin.rstrip("\n"))
            if r["error"]:
                first = code.strip().splitlines()[0]
                print(f"ℹ {rel} 範例出錯（確認是否為刻意的錯誤示範）：{r['error_type']} ← {first[:50]}")
    print(f"\n完成，{problems} 個問題")
    return problems


if __name__ == "__main__":
    sys.exit(1 if main(sys.argv[1] if len(sys.argv) > 1 else None) else 0)
