# -*- coding: utf-8 -*-
"""Добавляет длительность_аудио_мин и заполняет из m4a в public/audio."""
import math
import os
import subprocess
import sys

try:
    from mutagen.mp4 import MP4
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "mutagen", "-q"])
    from mutagen.mp4 import MP4

import pyodbc

WEB_PUBLIC = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "guap-attractions-web",
    "public",
)

conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=NASTUSHKINS\\SQLEXPRESS;"
    "DATABASE=guap_routes_db;"
    "Trusted_Connection=yes;"
)
cursor = conn.cursor()

cursor.execute("""
IF COL_LENGTH('достопримечательность', 'длительность_аудио_мин') IS NULL
BEGIN
    ALTER TABLE [достопримечательность]
    ADD [длительность_аудио_мин] INT NULL;
END
""")
conn.commit()

cursor.execute("""
SELECT [id_достопримечательности], [url_аудиофайла]
FROM [достопримечательность]
WHERE [url_аудиофайла] IS NOT NULL AND LEN(RTRIM([url_аудиофайла])) > 0
""")

updated = 0
for row in cursor.fetchall():
    attr_id, url = row[0], row[1]
    rel = url.lstrip("/").replace("/", os.sep)
    path = os.path.join(WEB_PUBLIC, rel)
    minutes = 0
    if os.path.isfile(path):
        audio = MP4(path)
        length = audio.info.length if audio.info and audio.info.length else 0
        minutes = max(0, int(math.ceil(length / 60.0))) if length > 0 else 0
    else:
        print(f"  missing file: {path}")

    cursor.execute(
        "UPDATE [достопримечательность] SET [длительность_аудио_мин] = ? WHERE [id_достопримечательности] = ?",
        minutes,
        attr_id,
    )
    updated += 1
    print(f"  id={attr_id}: {minutes} min ({url})")

conn.commit()
conn.close()
print(f"Updated {updated} attractions")
