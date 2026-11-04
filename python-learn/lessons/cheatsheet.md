## 🟢 基礎語法

### 變數與型別

```py
x = 10            # int
pi = 3.14         # float
name = "小明"      # str
ok = True         # bool
nothing = None
type(x)           # 查看型別
int("42"), float("3.5"), str(42), bool(0)
```

### 運算子

```py
7 / 2    # 3.5   除法
7 // 2   # 3     整數除法
7 % 2    # 1     餘數
2 ** 10  # 1024  次方
x += 1             # 複合賦值
a == b, a != b     # 比較
and, or, not       # 邏輯
```

### 字串

```py
s = "Hello Python"
s[0], s[-1], s[0:5], s[::-1]
s.upper(), s.lower(), s.strip()
s.split(" "), "-".join(["a", "b"])
s.replace("H", "J"), "Py" in s
f"{name} 有 {x:,} 元，{pi:.2f}"
```

### 條件

```py
if score >= 90:
    grade = "A"
elif score >= 60:
    grade = "B"
else:
    grade = "C"
kind = "偶" if n % 2 == 0 else "奇"
```

### 迴圈

```py
for i in range(5):         # 0~4
for i in range(1, 10, 2):  # 1,3,5,7,9
for i, v in enumerate(items):
for a, b in zip(xs, ys):
while cond:
    break / continue
```

### 輸入輸出

```py
name = input("名字：")
n = int(input())
print("a", "b", sep="-", end="")
```

## 📦 資料結構

### list 串列

```py
a = [3, 1, 2]
a.append(4); a.insert(0, 9)
a.pop(); a.remove(1)
a.sort(); sorted(a, reverse=True)
len(a), sum(a), min(a), max(a)
b = a.copy()        # 不是 b = a
```

### tuple、set

```py
t = (1, 2)          # 不能修改
x, y = t            # 解包
first, *rest = [1, 2, 3]
s = {1, 2, 3}
s.add(4)
a | b, a & b, a - b  # 聯集 交集 差集
```

### dict 字典

```py
d = {"a": 1, "b": 2}
d["c"] = 3
d.get("z", 0)
"a" in d
for k, v in d.items():
d.keys(), d.values()
{k: v * 2 for k, v in d.items()}
```

### 推導式

```py
[x * 2 for x in nums if x > 0]
{w: len(w) for w in words}
{x % 3 for x in nums}
sum(x * x for x in nums)
```

## 🔧 函式與例外

### 函式

```py
def area(w, h=1, *args, **kwargs):
    """說明文件"""
    return w * h

square = lambda x: x ** 2
sorted(people, key=lambda p: p["age"])
```

### 例外處理

```py
try:
    n = int(text)
except ValueError as e:
    print("錯誤：", e)
else:
    print("成功")
finally:
    print("一定會執行")
raise ValueError("錯誤訊息")
```

### 檔案

```py
with open("a.txt", "w", encoding="utf-8") as f:
    f.write("hello\n")
with open("a.txt", encoding="utf-8") as f:
    lines = f.read().splitlines()

import json
json.dumps(data, ensure_ascii=False)
json.loads(text)
```

### 模組

```py
import math
from random import randint
import datetime as dt
from collections import Counter, defaultdict

if __name__ == "__main__":
    main()
```

## 🟣 物件導向

### class

```py
class Dog(Animal):
    species = "犬"                # 類別屬性

    def __init__(self, name):
        super().__init__(name)
        self.name = name          # 實例屬性

    def speak(self):
        return "汪"

    def __repr__(self):
        return f"Dog({self.name!r})"
```

### property 與方法

```py
class Temp:
    @property
    def f(self):
        return self.c * 9 / 5 + 32

    @f.setter
    def f(self, v):
        self.c = (v - 32) * 5 / 9

    @classmethod
    def from_f(cls, f): ...

    @staticmethod
    def helper(x): ...
```

### dataclass

```py
from dataclasses import dataclass, field

@dataclass
class Item:
    name: str
    price: int = 0
    tags: list = field(default_factory=list)
```

## 🔴 進階技巧

### 產生器與裝飾器

```py
def gen(n):
    for i in range(n):
        yield i * i

from functools import wraps
def timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

### with 與型別提示

```py
from contextlib import contextmanager

@contextmanager
def opened():
    try:
        yield "資源"
    finally:
        print("釋放")

def f(xs: list[int], k: int | None = None) -> float: ...
```

### async

```py
import asyncio

async def fetch(i):
    await asyncio.sleep(1)
    return i

async def main():
    return await asyncio.gather(*(fetch(i) for i in range(5)))

asyncio.run(main())
```

### 正規表示式

```py
import re
re.findall(r"\d+", s)
re.search(r"(\d{4})-(\d{2})", s).group(1)
re.sub(r"\s+", " ", s)
re.fullmatch(r"09\d{8}", phone)
```

## 📊 NumPy、pandas

### NumPy

```py
import numpy as np
a = np.array([[1, 2], [3, 4]])
a.shape, a.T, a.reshape(-1)
a.mean(axis=0), a.sum(axis=1)
a[a > 2]                       # 布林篩選
np.where(a > 2, "大", "小")
A @ B                          # 矩陣乘法
```

### pandas 讀取與篩選

```py
import pandas as pd
df = pd.read_csv("data.csv")
df.head(), df.info(), df.describe()
df["col"], df[["a", "b"]]
df[(df.price > 100) & (df.city == "台北")]
df.loc[列, 欄], df.iloc[0, 1]
df.sort_values("price", ascending=False)
```

### pandas 分析

```py
df.groupby("city")["sales"].sum()
df.groupby("cat").agg(n=("id", "count"), avg=("price", "mean"))
df.pivot_table(index="a", columns="b", values="v", aggfunc="sum")
pd.merge(a, b, on="id", how="left")
df.isna().sum(); df.dropna(); df.fillna(0)
df["col"].value_counts()
```

### Matplotlib

```py
import matplotlib.pyplot as plt
fig, ax = plt.subplots(figsize=(8, 4))
ax.plot(x, y, marker="o", label="線")
ax.bar(names, values)
ax.set(title="標題", xlabel="x", ylabel="y")
ax.legend()
plt.show()
```

## 🤖 機器學習（scikit-learn）

### 標準流程

```py
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=0, stratify=y)
model = RandomForestClassifier().fit(X_train, y_train)
model.predict(X_test)
model.score(X_test, y_test)
```

### Pipeline

```py
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

prep = ColumnTransformer([
    ("num", StandardScaler(), num_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
])
model = Pipeline([("prep", prep), ("clf", clf)])
```

### 評估與調參

```py
from sklearn.metrics import classification_report
from sklearn.model_selection import cross_val_score, GridSearchCV

print(classification_report(y_test, pred))
cross_val_score(model, X, y, cv=5).mean()
grid = GridSearchCV(model, {"clf__max_depth": [3, 5]}, cv=5)
grid.fit(X, y); grid.best_params_
```

## 🧠 深度學習（PyTorch）

### 模型

```py
import torch
from torch import nn

model = nn.Sequential(
    nn.Linear(4, 32), nn.ReLU(),
    nn.Linear(32, 3),
)
loss_fn = nn.CrossEntropyLoss()
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
```

### 訓練迴圈

```py
for xb, yb in loader:
    pred = model(xb)
    loss = loss_fn(pred, yb)
    opt.zero_grad()
    loss.backward()
    opt.step()

model.eval()
with torch.no_grad():
    model(x_test).argmax(dim=1)
```

## ✨ AI 應用

### Claude API

```py
import anthropic
client = anthropic.Anthropic()   # 讀取 ANTHROPIC_API_KEY
r = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    system="你是…",
    messages=[{"role": "user", "content": "你好"}],
)
print(r.content[0].text)
```

### Hugging Face

```py
from transformers import pipeline
clf = pipeline("sentiment-analysis")
clf("I love Python!")
```

## 🌐 Web

### FastAPI

```py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: int

@app.post("/items")
def create(item: Item):
    return item
# fastapi dev main.py
```

### Flask

```py
from flask import Flask, render_template, request

app = Flask(__name__)

@app.route("/hello/<name>")
def hello(name):
    q = request.args.get("q")
    return render_template("hello.html", name=name)
# python app.py
```

### 終端機常用指令

```bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install 套件名稱
pip freeze > requirements.txt
pip install -r requirements.txt
pytest
```
