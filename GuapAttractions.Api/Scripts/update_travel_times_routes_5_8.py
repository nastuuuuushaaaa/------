# -*- coding: utf-8 -*-
"""Обновляет время_для_точки_мин (минуты перехода) для маршрутов 5–8."""
import pyodbc

UPDATES = {
    # Маршрут 5: Променад по линиям Васильевского острова
    47: 5,
    48: 4,
    49: 10,
    50: 3,
    51: 3,
    52: 6,
    53: 3,
    54: 3,
    55: 2,
    56: 3,
    # Маршрут 6: к стрелке Васильевского острова
    57: 7,
    58: 11,
    59: 2,
    60: 3,
    61: 3,
    62: 3,
    63: 3,
    64: 2,
    65: 4,
    66: 4,
    # Маршрут 7: Парадный Петербург
    67: 5,
    68: 5,
    69: 3,
    70: 3,
    71: 2,
    72: 6,
    73: 2,
    74: 6,
    75: 3,
    76: 1,
    87: 4,
    # Маршрут 8: Путешествие по набережной Мойки
    77: 5,
    78: 1,
    79: 2,
    81: 6,
    82: 4,
    83: 5,
    84: 6,
    85: 2,
    86: 5,
    88: 4,
    89: 2,
}

conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=NASTUSHKINS\\SQLEXPRESS;"
    "DATABASE=guap_routes_db;"
    "Trusted_Connection=yes;"
)
cur = conn.cursor()

for point_id, minutes in UPDATES.items():
    cur.execute(
        "UPDATE [точка_маршрута] SET [время_для_точки_мин] = ? WHERE [id_точки_маршрута] = ?",
        minutes,
        point_id,
    )
    if cur.rowcount != 1:
        print(f"WARNING: point {point_id} -> {cur.rowcount} rows")

conn.commit()

cur.execute("""
SELECT m.id_маршрута, p.порядок_следования, a.название, p.время_для_точки_мин
FROM точка_маршрута p
JOIN маршрут m ON m.id_маршрута = p.id_маршрута
JOIN достопримечательность a ON a.id_достопримечательности = p.id_достопримечательности
WHERE m.id_маршрута IN (5, 6, 7, 8)
ORDER BY m.id_маршрута, p.порядок_следования
""")
out = r"C:\Users\vdoni\OneDrive\Рабочий стол\диплом\GuapAttractions.Api\Scripts\_verify_5_8.txt"
with open(out, "w", encoding="utf-8") as f:
    for r in cur.fetchall():
        f.write(f"route {r[0]} | order {r[1]} | {r[2]} | {r[3]} min\n")

conn.close()
print(f"Updated {len(UPDATES)} points. See {out}")
