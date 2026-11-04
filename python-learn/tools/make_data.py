"""產生課程用的練習資料集（模擬資料，固定亂數種子，每次產生的結果都一樣）。

用法：python3 tools/make_data.py   （在 python-learn 資料夾裡執行）

titanic.csv 不是這裡產生的，是公開的鐵達尼號乘客資料（Kaggle / Stanford CS109 版本）。
"""
from pathlib import Path

import numpy as np
import pandas as pd

OUT = Path(__file__).resolve().parent.parent / "data"
rng = np.random.default_rng(2026)


def shop_orders(n=600):
    cities = ["台北", "新北", "桃園", "台中", "台南", "高雄"]
    city_w = [0.28, 0.22, 0.12, 0.16, 0.10, 0.12]
    catalog = {
        "3C": [("藍牙耳機", 1290), ("行動電源", 690), ("機械鍵盤", 2490), ("無線滑鼠", 590), ("USB-C 線", 290)],
        "服飾": [("T恤", 390), ("牛仔褲", 990), ("帽子", 450), ("外套", 1690)],
        "食品": [("咖啡豆", 520), ("堅果禮盒", 680), ("手工餅乾", 260), ("茶葉", 450)],
        "書籍": [("Python 入門", 580), ("機器學習實戰", 750), ("小說", 320), ("漫畫", 140)],
        "居家": [("保溫瓶", 790), ("香氛蠟燭", 420), ("收納箱", 350), ("檯燈", 1190)],
    }
    cat_names = list(catalog)
    dates = pd.to_datetime("2025-01-01") + pd.to_timedelta(rng.integers(0, 365, n), unit="D")
    rows = []
    for i in range(n):
        d = dates[i]
        # 11 月雙 11、12 月年底，3C 和居家賣得比較好
        boost = 1.8 if d.month in (11, 12) else 1.0
        cat_w = np.array([0.26 * boost, 0.2, 0.2, 0.14, 0.2 * boost])
        cat = rng.choice(cat_names, p=cat_w / cat_w.sum())
        product, price = catalog[cat][rng.integers(len(catalog[cat]))]
        qty = int(rng.choice([1, 1, 1, 2, 2, 3, 4]))
        rows.append({
            "order_id": f"A{10001 + i}",
            "date": d.strftime("%Y-%m-%d"),
            "customer": f"C{rng.integers(1, 181):03d}",
            "city": rng.choice(cities, p=city_w),
            "category": cat,
            "product": product,
            "price": price,
            "qty": qty,
        })
    df = pd.DataFrame(rows).sort_values("date").reset_index(drop=True)
    df.to_csv(OUT / "shop_orders.csv", index=False)


def taipei_weather():
    days = pd.date_range("2025-01-01", "2025-12-31")
    doy = days.dayofyear.to_numpy()
    season = np.sin((doy - 110) / 365 * 2 * np.pi)            # 夏天高、冬天低
    t_avg = 23.5 + 6.5 * season + rng.normal(0, 1.6, len(days))
    t_max = t_avg + rng.uniform(3, 6, len(days))
    t_min = t_avg - rng.uniform(2.5, 5, len(days))
    wet = np.isin(days.month, [5, 6, 8, 9])                  # 梅雨、颱風季
    rain_prob = np.where(wet, 0.55, 0.32)
    rain = np.where(rng.random(len(days)) < rain_prob, rng.gamma(1.4, 9 if True else 1, len(days)), 0.0)
    rain = np.where(wet, rain * 1.8, rain)
    humidity = np.clip(72 + rain * 0.6 + rng.normal(0, 6, len(days)), 45, 100)
    df = pd.DataFrame({
        "date": days.strftime("%Y-%m-%d"),
        "temp_avg": t_avg.round(1),
        "temp_max": t_max.round(1),
        "temp_min": t_min.round(1),
        "rain_mm": rain.round(1),
        "humidity": humidity.round(0).astype(int),
    })
    df.to_csv(OUT / "taipei_weather.csv", index=False)


def house_prices(n=600):
    districts = {"大安區": 95, "信義區": 90, "中山區": 78, "內湖區": 68, "文山區": 58, "北投區": 55, "板橋區": 60, "新莊區": 48}
    names = list(districts)
    d = rng.choice(names, n)
    area = np.clip(rng.normal(32, 13, n), 10, 90).round(1)          # 坪
    age = rng.integers(0, 46, n)
    rooms = np.clip((area / 12 + rng.normal(0, 0.7, n)).round(), 1, 5).astype(int)
    floor = rng.integers(1, 26, n)
    mrt = rng.random(n) < 0.6
    unit = np.array([districts[x] for x in d])                         # 每坪單價（萬）
    unit = unit * (1 - age * 0.007) * np.where(mrt, 1.12, 1.0) * (1 + (floor - 8) * 0.004)
    price = area * unit * rng.normal(1, 0.08, n)
    df = pd.DataFrame({
        "district": d, "area": area, "age": age, "rooms": rooms, "floor": floor,
        "near_mrt": mrt.astype(int), "price": price.round(0).astype(int),
    })
    df.to_csv(OUT / "house_prices.csv", index=False)


def students(n=300):
    hours = np.clip(rng.normal(10, 4, n), 0, 25).round(1)              # 每週讀書時數
    sleep = np.clip(rng.normal(7, 1.1, n), 4, 10).round(1)
    attend = np.clip(rng.normal(88, 9, n), 40, 100).round(0).astype(int)
    prev = np.clip(rng.normal(68, 13, n), 20, 100).round(0).astype(int)
    phone = np.clip(rng.normal(3.5, 1.5, n), 0.5, 9).round(1)          # 每天滑手機時數
    score = -4 + 2.0 * hours + 2.0 * sleep + 0.18 * attend + 0.38 * prev - 2.2 * phone + rng.normal(0, 6, n)
    score = np.clip(score, 0, 100).round(0).astype(int)
    df = pd.DataFrame({
        "student_id": [f"S{i:03d}" for i in range(1, n + 1)],
        "gender": rng.choice(["F", "M"], n),
        "study_hours": hours, "sleep_hours": sleep, "attendance": attend,
        "prev_score": prev, "phone_hours": phone, "final_score": score,
        "passed": (score >= 60).astype(int),
    })
    df.to_csv(OUT / "students.csv", index=False)


def messy_customers():
    """故意弄髒的資料，給「資料清理」那一課用"""
    rows = [
        ("C001", " 王小明", "0912-345-678", "台北市", "28", "2024/01/15", "VIP"),
        ("C002", "李美麗", "0922333444", "臺北市", "35", "2024-02-03", "一般"),
        ("C003", "陳大華 ", "", "新北市", "", "2024-02-20", "一般"),
        ("C004", "林小芳", "0933-111-222", "台中市", "-5", "2024-03-01", "vip"),
        ("C002", "李美麗", "0922333444", "臺北市", "35", "2024-02-03", "一般"),
        ("C005", "張志明", "0955 666 777", "高雄市", "42", "2024/03/18", "一般"),
        ("C006", "黃淑芬", "0966777888", "台南市", "200", "2024-04-02", "VIP "),
        ("C007", "吳建宏", "0977-888-999", "台北市", "31", "not a date", "一般"),
        ("C008", "", "0988999000", "桃園市", "26", "2024-05-11", "一般"),
        ("C009", "周雅婷", "0911222333", "台中市", "29", "2024-05-30", None),
        ("C010", "鄭家豪", "0900-123-456", "臺中市", "38", "2024-06-08", "一般"),
    ]
    df = pd.DataFrame(rows, columns=["id", "name", "phone", "city", "age", "joined", "level"])
    df.to_csv(OUT / "messy_customers.csv", index=False)


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    shop_orders()
    taipei_weather()
    house_prices()
    students()
    messy_customers()
    for f in sorted(OUT.glob("*.csv")):
        print(f"{f.name:<22}{f.stat().st_size // 1024:>4} KB")
