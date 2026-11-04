# 🐍 Python 學習路線

在瀏覽器裡直接學 Python 的網站：從基礎語法、物件導向、進階技巧，到 Web 框架、資料分析、機器學習、深度學習和 AI 應用。

- 每一課都有說明、**可以直接執行的範例**，以及**自動檢查答案**的練習題
- Python 透過 [Pyodide](https://pyodide.org/) 在瀏覽器裡執行，不用安裝任何東西
- 學習進度存在瀏覽器的 localStorage，不需要帳號

## 課程內容（10 個階段、114 課）

| 階段 | 課數 | 內容 |
|---|---|---|
| 1. 入門基礎 | 14 | print、變數、運算子、字串、條件、迴圈、list / tuple / set / dict、🎯 猜數字遊戲 |
| 2. 中級語法 | 12 | 函式、作用域、lambda、推導式、例外、檔案 / CSV / JSON、模組、match、🎯 記帳本 |
| 3. 物件導向 | 10 | class、繼承、多型、property、魔術方法、抽象類別、dataclass、🎯 文字 RPG |
| 4. 進階技巧 | 13 | 產生器、閉包、裝飾器、with、型別提示、collections、itertools、regex、async、多執行緒、描述器、效能、🎯 非同步爬蟲 |
| 5. 工程實務與演算法 | 12 | 安裝環境、venv / uv、logging、pytest、打包、Big-O、排序、搜尋、遞迴、堆疊佇列、樹與圖、動態規劃 |
| 6. Web 框架與自動化 | 12 | HTTP、Flask、FastAPI、Pydantic、Django、SQLAlchemy、部署、爬蟲、Excel 自動化、🎯 待辦事項 API |
| 7. 資料分析 | 12 | NumPy、pandas、資料清理、Matplotlib、Seaborn、統計、機率、相關性、🎯 商業分析報告 |
| 8. 機器學習 | 12 | 迴歸、分類、評估指標、過擬合、決策樹與森林、KNN、K-Means、Pipeline、調參、🎯 鐵達尼號、🎯 房價預測 |
| 9. 深度學習 | 9 | 神經網路、NumPy 手寫反向傳播、PyTorch、自動微分、CNN、Transformer、🎯 手寫數字辨識 |
| 10. AI 應用 | 8 | Hugging Face、LLM API、提示詞、Embeddings、RAG、AI Agent、Gradio / Streamlit、🎯 PDF 問答機器人 |

需要開伺服器或 GPU 的內容（Flask、Django、PyTorch、呼叫 LLM API…）會標示「💻 部分程式要在自己的電腦或 Colab 執行」，並附上一步一步的操作說明；概念練習一樣可以在網頁上完成。

## 網站功能

- 🐍 **瀏覽器內執行 Python**：Pyodide（Python 3.12），支援 NumPy、pandas、Matplotlib、scikit-learn、SciPy、SQLAlchemy、Pydantic、BeautifulSoup 等；seaborn、openpyxl 會自動從 PyPI 安裝
- 📊 圖表直接顯示（已內建中文字型）、`display(df)` 顯示成表格、`input()` 用輸入框、`asyncio.run()` 可用
- ✏️ 練習題自動檢查、提示、參考解答；全部通過自動完成本課
- 🩺 錯誤訊息中文說明，並標出出錯的那一行；無窮迴圈 30 秒自動停止（也可以按停止）
- 🗺️ 技能地圖、📈 學習進度、🏆 徽章、🔍 全文搜尋（按 `/`）、📝 速查表、🧪 練習場
- 🌙 深色模式、📱 手機版面、⬇️ 進度備份與還原

## 怎麼打開網站

### 方法一：在自己的電腦上

網站需要透過網頁伺服器開啟（直接雙擊 HTML 檔，課程會載入失敗）。在這個資料夾裡執行：

```bash
python -m http.server 8000
```

然後用瀏覽器打開 <http://localhost:8000>。

### 方法二：GitHub Pages（免費上線）

1. 到 GitHub repo 的 **Settings → Pages**
2. Source 選 **Deploy from a branch**，選擇分支和 `/ (root)` 資料夾
3. 儲存後，網址會是 `https://<你的帳號>.github.io/<repo 名稱>/python-learn/`

## 資料夾結構

```
python-learn/
├── index.html          首頁：整體進度、技能地圖、所有階段、徽章
├── lesson.html         課程頁
├── playground.html     自由練習場
├── cheatsheet.html     速查表（內容在 lessons/cheatsheet.md）
├── css/style.css       樣式（淺色 / 深色主題）
├── js/
│   ├── catalog.js      課程目錄（所有階段和課程標題）
│   ├── common.js       進度儲存、主題、頁首
│   ├── runner.js       Python 執行器、程式編輯區塊、錯誤訊息中文說明
│   ├── py-worker.js    在背景執行緒跑 Pyodide（無窮迴圈不會卡住網頁）
│   ├── harness.py      執行學生程式、模擬 input()、自動檢查
│   ├── lesson.js       讀取並顯示課程
│   └── home.js         首頁
├── lessons/
│   ├── s1/01.md …      第 1～10 階段的課程
│   └── cheatsheet.md   速查表
├── data/
│   ├── *.csv           練習用資料集（titanic.csv 是公開的真實資料，其他是模擬資料）
│   ├── search-index.json  搜尋索引
│   └── fonts/          圖表用的中文字型（Noto Sans TC 精簡版，SIL OFL 授權）
└── tools/
    ├── check_lessons.py   檢查所有課程的解答和範例
    ├── build_search.py    重新產生搜尋索引
    └── make_data.py       重新產生模擬資料集
```

## 新增課程

1. 在 `js/catalog.js` 對應階段的 `lessons` 加上標題；整個階段完成後把 `ready` 改成 `true`
2. 建立 `lessons/<階段>/<兩位數編號>.md`，格式如下：

````markdown
說明文字（Markdown）

```python
print("可以執行、可以修改的範例")
```

```stdin
（選用）緊接在範例後面：這個範例 input() 的預設輸入
```

```py
# 只能看、不能執行的範例（例如會開伺服器的程式）
```

```bash
pip install 套件名稱   # 終端機指令，會附「複製」按鈕
```

:::exercise 練習標題
題目說明（Markdown）
@@starter
# 一開始給學生的程式
@@check
# 檢查用的 Python。可以用的變數：
#   output（輸出的字串）、lines（輸出的每一行）、ns（學生程式裡的變數）、code（學生的原始碼）
assert ns["answer"] == 42, "答錯時顯示的訊息"
@@stdin
（選用）檢查時給 input() 的固定輸入
@@hint
（選用）提示
@@solution
（選用）參考解答
:::
````

3. 執行檢查（每個解答都要通過、起始程式不能直接通過），並更新搜尋索引：

```bash
python3 tools/check_lessons.py        # 全部
python3 tools/check_lessons.py s2     # 只檢查第 2 階段
python3 tools/build_search.py         # 更新搜尋索引
```

> 本機的 Python 套件版本可能和瀏覽器裡的 Pyodide 不同，最終以瀏覽器實際執行的結果為準。
