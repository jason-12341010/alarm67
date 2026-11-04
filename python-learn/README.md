# 🐍 Python 學習路線

在瀏覽器裡直接學 Python 的網站：從基礎語法、物件導向、進階技巧，到 Web 框架、資料分析、機器學習、深度學習和 AI 應用。

- 每一課都有說明、**可以直接執行的範例**，以及**自動檢查答案**的練習題
- Python 透過 [Pyodide](https://pyodide.org/) 在瀏覽器裡執行，不用安裝任何東西
- 學習進度存在瀏覽器的 localStorage，不需要帳號

## 目前進度

| 階段 | 狀態 |
|---|---|
| 1. 入門基礎（14 課） | ✅ 完成 |
| 2. 中級語法（12 課） | ✅ 完成 |
| 3. 物件導向 | 🚧 製作中 |
| 4. 進階技巧 | 🚧 |
| 5. 工程實務與演算法 | 🚧 |
| 6. Web 框架與自動化 | 🚧 |
| 7. 資料分析 | 🚧 |
| 8. 機器學習 | 🚧 |
| 9. 深度學習 | 🚧 |
| 10. AI 應用與大型語言模型 | 🚧 |

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
├── index.html          首頁：整體進度、技能地圖、所有階段
├── lesson.html         課程頁
├── playground.html     自由練習場
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
│   ├── s1/01.md …      第 1 階段的課程
│   └── s2/01.md …      第 2 階段的課程
└── tools/
    └── check_lessons.py   檢查所有課程的解答和範例
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

3. 執行檢查（每個解答都要通過、起始程式不能直接通過）：

```bash
python3 tools/check_lessons.py        # 全部
python3 tools/check_lessons.py s2     # 只檢查第 2 階段
```
