// 全部課程目錄。ready: true 的階段已經有課程內容（lessons/<stage>/<編號>.md）。
// 要新增課程：在對應階段的 lessons 加一行標題，並建立 lessons/<stage>/<兩位數編號>.md。
window.CATALOG = [
  {
    id: "s1", num: 1, part: "A", icon: "🟢", title: "入門基礎", ready: true,
    desc: "print、變數、型別、條件、迴圈、串列和字典。快速打好基礎。",
    lessons: [
      "第一個程式：print 與註解",
      "變數與資料型別",
      "運算子",
      "字串操作與切片",
      "f-string 格式化",
      "input 與型別轉換",
      "if / elif / else 條件判斷",
      "while 迴圈",
      "for 迴圈與 range",
      "break、continue、pass",
      "list 串列",
      "tuple 與 set",
      "dict 字典",
      "🎯 專案：猜數字遊戲",
    ],
  },
  {
    id: "s2", num: 2, part: "A", icon: "🔵", title: "中級語法", ready: true,
    desc: "函式、推導式、例外處理、檔案、模組，寫出結構清楚的程式。",
    lessons: [
      "函式基礎",
      "參數進階：預設值、*args、**kwargs",
      "作用域：區域、全域與 nonlocal",
      "lambda 與高階函式",
      "推導式（Comprehension）",
      "好用的內建函式",
      "例外處理 try / except",
      "檔案讀寫",
      "模組與 import",
      "字串方法與文字處理",
      "match 模式比對",
      "🎯 專案：記帳本",
    ],
  },
  {
    id: "s3", num: 3, part: "A", icon: "🟣", title: "物件導向", ready: true,
    desc: "class、繼承、多型、魔術方法、dataclass。",
    lessons: [
      "class 與物件", "__init__ 與 self", "繼承", "多型與鴨子型別", "封裝與 property",
      "魔術方法", "類別方法與靜態方法", "抽象類別", "dataclass", "🎯 專案：文字 RPG",
    ],
  },
  {
    id: "s4", num: 4, part: "A", icon: "🔴", title: "進階技巧", ready: true,
    desc: "產生器、裝飾器、async、型別提示、metaclass。",
    lessons: [
      "迭代器與產生器", "閉包", "裝飾器", "上下文管理器 with", "型別提示 typing",
      "collections", "itertools 與 functools", "正規表示式 re", "async / await 非同步",
      "多執行緒與多行程", "描述器與 metaclass", "效能：GIL、__slots__、profiling",
      "🎯 專案：非同步爬蟲模擬器",
    ],
  },
  {
    id: "s5", num: 5, part: "A", icon: "🧰", title: "工程實務與演算法", ready: true,
    desc: "在自己電腦建立開發環境、測試、套件管理，以及常見演算法。",
    lessons: [
      "在自己電腦安裝 Python 與 VS Code", "虛擬環境 venv 與 pip / uv", "logging 日誌", "pytest 測試",
      "打包與發佈", "時間複雜度 Big-O", "排序演算法", "搜尋與二分搜尋", "遞迴",
      "堆疊與佇列", "樹與圖", "動態規劃入門",
    ],
  },
  {
    id: "s6", num: 6, part: "B", icon: "🌐", title: "Web 框架與自動化", ready: false,
    desc: "Flask、FastAPI、Django，加上爬蟲和 Excel 自動化（在自己電腦上實作）。",
    lessons: [
      "HTTP 與 Web 基礎", "Flask：路由與模板", "Flask：表單與資料庫", "FastAPI：建立 API",
      "FastAPI：Pydantic 資料驗證", "Django：專案與 MVT 架構", "Django：ORM 與後台",
      "SQLAlchemy 與 SQLite", "Streamlit 快速做介面", "requests 與 BeautifulSoup 爬蟲",
      "Excel 自動化 openpyxl", "🎯 專案：待辦事項 API",
    ],
  },
  {
    id: "s7", num: 7, part: "C", icon: "📊", title: "資料分析", ready: true,
    desc: "NumPy、Pandas、Matplotlib、統計基礎。AI 的地基。",
    lessons: [
      "NumPy 陣列", "向量化運算與廣播", "Pandas：Series 與 DataFrame", "讀取與篩選資料",
      "分組與合併", "資料清理", "Matplotlib 繪圖", "Seaborn 統計圖表", "統計基礎",
      "機率分布", "相關性", "🎯 專案：分析真實資料集",
    ],
  },
  {
    id: "s8", num: 8, part: "C", icon: "🤖", title: "機器學習", ready: true,
    desc: "scikit-learn：迴歸、分類、分群、模型評估。",
    lessons: [
      "機器學習是什麼", "線性迴歸", "邏輯迴歸與分類", "評估指標與混淆矩陣",
      "訓練集、測試集與過擬合", "決策樹與隨機森林", "KNN 與特徵縮放", "K-Means 分群",
      "特徵工程與 Pipeline", "交叉驗證與調參", "🎯 專案：鐵達尼號生還預測", "🎯 專案：房價預測",
    ],
  },
  {
    id: "s9", num: 9, part: "C", icon: "🧠", title: "深度學習", ready: false,
    desc: "從 NumPy 手寫神經網路，到 PyTorch 影像辨識。",
    lessons: [
      "神經網路原理", "用 NumPy 手寫神經網路", "PyTorch 張量", "自動微分", "訓練迴圈",
      "CNN 卷積神經網路", "RNN 與 Transformer 概念", "TensorFlow / Keras 介紹",
      "🎯 專案：手寫數字辨識",
    ],
  },
  {
    id: "s10", num: 10, part: "C", icon: "✨", title: "AI 應用與大型語言模型", ready: false,
    desc: "Hugging Face、LLM API、Embeddings、RAG、AI Agent。",
    lessons: [
      "Hugging Face 現成模型", "呼叫 LLM API", "提示詞設計", "Embeddings 與語意搜尋",
      "RAG：讓 AI 讀你的文件", "AI Agent 與工具呼叫", "Gradio / Streamlit AI 介面",
      "🎯 專案：PDF 問答機器人",
    ],
  },
];

window.PARTS = {
  A: "Python 本身",
  B: "🌐 Web 開發路線",
  C: "🤖 AI 與數據路線",
};

// 小工具：課程 id 是 "s1-03" 這種格式
window.lessonId = (stage, i) => `${stage.id}-${String(i + 1).padStart(2, "0")}`;
window.findLesson = (id) => {
  for (const stage of window.CATALOG) {
    for (let i = 0; i < stage.lessons.length; i++) {
      if (window.lessonId(stage, i) === id) return { stage, index: i, title: stage.lessons[i] };
    }
  }
  return null;
};
