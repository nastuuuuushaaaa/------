# -*- coding: utf-8 -*-
"""
Копирует аудио для маршрутов 1, 3, 4 в public/audio/routes/
и обновляет url_аудиофайла в достопримечательность.
"""

import os
import shutil
import pyodbc

SOURCE_DIR = r"C:\Users\vdoni\OneDrive\Рабочий стол\аудиозаписи"
WEB_ROOT = (
    r"C:\Users\vdoni\OneDrive\Рабочий стол\диплом"
    r"\guap-attractions-web\public\audio\routes"
)

# (slug, audio_url_base, [(src_filename, attr_id, dst_filename), ...])
ROUTES = [
    (
        "okrestnosti-sennoy",
        "/audio/routes/okrestnosti-sennoy",
        [
            ("Юсуповский дворец.m4a", 1, "yusupovskiy-dvorets.m4a"),
            ("Пальма.m4a", 2, "palma.m4a"),
            ("Львиный мостик.m4a", 3, "lvinyy-most.m4a"),
            ("Музей искусств 20-21 веков.m4a", 4, "muzey-iskusstv-xx-xxi.m4a"),
            ("Екатерининское_общественное_собрание.m4a", 5, "ekaterininskoe-sobranie.m4a"),
            ("Монплезир.m4a", 6, "monplezir.m4a"),
            ("Нос майора Ковалева.m4a", 7, "nos-mayora-kovaleva.m4a"),
            ("Юсуповский сад.m4a", 8, "yusupovskiy-sad.m4a"),
            ("Центральный_музей_жд_транспорта_РФ.m4a", 9, "muzey-zhd-transporta.m4a"),
            ("Сенная площадь.m4a", 10, "sennaya-ploshchad.m4a"),
            ("Театр на садовой.m4a", 11, "teatr-na-sadovoy.m4a"),
            ("Воронцовский дворец.m4a", 12, "vorontsovskiy-dvorets.m4a"),
            ("Гостиный двор.m4a", 13, "gostinyy-dvor.m4a"),
        ],
    ),
    (
        "put-k-tehnologicheskomu-institutu",
        "/audio/routes/put-k-tehnologicheskomu-institutu",
        [
            ("Консерватория.m4a", 26, "konservatoriya.m4a"),
            ("Мариинка.m4a", 25, "mariinskiy-teatr.m4a"),
            ("Лендок.m4a", 27, "lendok.m4a"),
            ("Дом Веге.m4a", 28, "dom-vege.m4a"),
            ("Никольский Собор.m4a", 29, "nikolskiy-sobor.m4a"),
            ("Никольские ряды.m4a", 30, "nikolskie-ryady.m4a"),
            ("Координата.m4a", 31, "koordinata.m4a"),
            ("Музей усадьба Державина.m4a", 32, "muzey-derzhavina.m4a"),
            ("Молодежный театр на фонтанке.m4a", 33, "molodezhnyy-teatr-fontanke.m4a"),
            ("Метрологический музей.m4a", 34, "metrologicheskiy-muzey.m4a"),
        ],
    ),
    (
        "tainstvennaya-kolomna",
        "/audio/routes/tainstvennaya-kolomna",
        [
            ("Мойка 104.m4a", 35, "moyka-104.m4a"),
            ("дворец_великой_княгини_Ксении_Александровны.m4a", 36, "dvorets-ksenii.m4a"),
            ("Новая Голландия.m4a", 37, "novaya-gollandiya.m4a"),
            ("Дворец_великого_князя_Алексея_Александровича.m4a", 38, "dvorets-alekseya.m4a"),
            ("Музей-квартира Блока.m4a", 39, "muzey-bloka.m4a"),
            ("Лютеранская_церковь_святого_Иоанна.m4a", 40, "lyuteranskaya-cerkov.m4a"),
            ("Концертный_зал_Мариинского_театра.m4a", 41, "koncertnyy-zal-mariinki.m4a"),
            ("Большая Хоральная Синагога.m4a", 42, "horalnaya-sinagoga.m4a"),
            ("Исидоровская церковь.m4a", 43, "isidorovskaya-cerkov.m4a"),
            ("Особняк Серебрякова.m4a", 44, "osobnyak-serebryakova.m4a"),
            ("Дом, в котором жил Пушкин.m4a", 45, "dom-pushkina.m4a"),
        ],
    ),
]


def main():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=NASTUSHKINS\\SQLEXPRESS;"
        "DATABASE=guap_routes_db;"
        "Trusted_Connection=yes;"
    )
    cursor = conn.cursor()
    ok = skipped = 0

    for slug, url_base, mapping in ROUTES:
        target_dir = os.path.join(WEB_ROOT, slug)
        os.makedirs(target_dir, exist_ok=True)
        print(f"\n=== {slug} ===")

        for src_name, attr_id, dst_name in mapping:
            src_path = os.path.join(SOURCE_DIR, src_name)
            dst_path = os.path.join(target_dir, dst_name)

            if not os.path.isfile(src_path):
                print(f"  [ПРОПУЩЕН] нет файла: {src_name}")
                skipped += 1
                continue

            shutil.copy2(src_path, dst_path)
            audio_url = f"{url_base}/{dst_name}"
            cursor.execute(
                "UPDATE [достопримечательность] SET [url_аудиофайла] = ? "
                "WHERE [id_достопримечательности] = ?",
                audio_url,
                attr_id,
            )
            size_kb = os.path.getsize(dst_path) // 1024
            print(f"  [OK] id={attr_id} {src_name} -> {dst_name} ({size_kb} KB)")
            ok += 1

    conn.commit()
    conn.close()
    print(f"\nГотово: {ok} файлов, пропущено {skipped}.")


if __name__ == "__main__":
    main()
