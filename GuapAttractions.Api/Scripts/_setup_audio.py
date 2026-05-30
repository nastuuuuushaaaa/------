# -*- coding: utf-8 -*-
"""
Копирует аудиофайлы маршрута «Навстречу Балтике» в public/audio/routes/navstrechu-baltike/
и обновляет поле url_аудиофайла в таблице достопримечательность.
"""

import os
import shutil
import pyodbc

# ── пути ──────────────────────────────────────────────────────────────────────
SOURCE_DIR = r"C:\Users\vdoni\OneDrive\Рабочий стол\аудиозаписи"
TARGET_DIR = (
    r"C:\Users\vdoni\OneDrive\Рабочий стол\диплом"
    r"\guap-attractions-web\public\audio\routes\navstrechu-baltike"
)
AUDIO_URL_BASE = "/audio/routes/navstrechu-baltike"

# ── маппинг: имя_файла_источника → (id_достопримечательности, имя_файла_цели) ─
# Имена целевых файлов — латиница, без пробелов, URL-безопасны.
MAPPING = [
    ("Петербургский художник.m4a",     14, "peterburgskiy-hudozhnik.m4a"),
    ("Мариинский театр 2.m4a",         15, "mariinskiy-teatr-2.m4a"),
    ("Хроники огненной истории.m4a",   16, "hroniki-ognennoj-istorii.m4a"),
    ("Пикалов мост.m4a",               17, "pikalov-most.m4a"),
    ("Место смерти Суворова.m4a",      18, "mesto-smerti-suvorova.m4a"),
    ("Египетский мост.m4a",            19, "egipetskiy-most.m4a"),
    ("Троицкий собор.m4a",             20, "troickiy-sobor.m4a"),
    ("Сад Валентина Пикуля.m4a",       21, "sad-valentina-pikul.m4a"),
    ("Воскресенская церковь.m4a",      22, "voskresenskaya-cerkov.m4a"),
    ("Музей арт и факты.m4a",          23, "muzey-art-i-fakty.m4a"),
    ("Балтийский вокзал.m4a",          24, "baltiyskiy-vokzal.m4a"),
]

# ── 1. Создать папку и скопировать файлы ─────────────────────────────────────
os.makedirs(TARGET_DIR, exist_ok=True)
print(f"Целевая папка: {TARGET_DIR}\n")

for src_name, attr_id, dst_name in MAPPING:
    src_path = os.path.join(SOURCE_DIR, src_name)
    dst_path = os.path.join(TARGET_DIR, dst_name)

    if not os.path.exists(src_path):
        print(f"  [ПРОПУЩЕН] Файл не найден: {src_path}")
        continue

    shutil.copy2(src_path, dst_path)
    size_kb = os.path.getsize(dst_path) // 1024
    print(f"  [OK] {src_name} -> {dst_name}  ({size_kb} KB)")

# ── 2. Обновить URL в БД ──────────────────────────────────────────────────────
print("\nОбновляю url_аудиофайла в базе данных...")

conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=NASTUSHKINS\\SQLEXPRESS;"
    "DATABASE=guap_routes_db;"
    "Trusted_Connection=yes;"
)
cursor = conn.cursor()

for src_name, attr_id, dst_name in MAPPING:
    audio_url = f"{AUDIO_URL_BASE}/{dst_name}"
    cursor.execute(
        "UPDATE [достопримечательность] "
        "SET [url_аудиофайла] = ? "
        "WHERE [id_достопримечательности] = ?",
        audio_url, attr_id
    )
    print(f"  ID={attr_id}: url_аудиофайла = {audio_url}")

conn.commit()
conn.close()
print("\nГотово! Все URL обновлены в базе данных.")
