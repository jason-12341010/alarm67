"""產生搜尋用的索引 data/search-index.json。

新增或修改課程之後執行：python3 tools/build_search.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
catalog_js = (ROOT / "js" / "catalog.js").read_text(encoding="utf-8")

index = []
for stage_dir in sorted((ROOT / "lessons").glob("s*"), key=lambda p: int(p.name[1:])):
    for f in sorted(stage_dir.glob("*.md")):
        md = f.read_text(encoding="utf-8")
        headings = re.findall(r"^#{2,3}\s+(.+)$", md, flags=re.M)
        text = re.sub(r"```[\s\S]*?```", " ", md)                    # 拿掉程式碼
        text = re.sub(r"^:::exercise\s*(.*)$", r"練習：\1", text, flags=re.M)
        text = re.sub(r"^@@\w+[\s\S]*?(?=^:::|\Z)", " ", text, flags=re.M)
        text = re.sub(r"[#*`>|_\[\]()-]+", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        index.append({
            "id": f"{stage_dir.name}-{f.stem}",
            "headings": headings,
            "text": text[:4000],
        })

out = ROOT / "data" / "search-index.json"
out.write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{len(index)} 課，{out.stat().st_size // 1024} KB → {out.relative_to(ROOT)}")
