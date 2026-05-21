-- Добавляет по 3 фотографии к каждой точке маршрута 2 «Навстречу Балтике».
-- Файлы лежат в guap-attractions-web/public/images/routes/towards-baltic/<file>.jpg
-- Скрипт идемпотентный: повторный запуск не создаст дубликатов (защита через NOT EXISTS).
SET NOCOUNT ON;

DECLARE @r2 INT = (SELECT [id_маршрута] FROM [маршрут] WHERE [название] = N'Навстречу Балтике');

IF @r2 IS NULL
BEGIN
  PRINT N'ОШИБКА: маршрут «Навстречу Балтике» не найден. Скрипт остановлен.';
  RETURN;
END

DECLARE @photos TABLE (
  [order_idx] INT NOT NULL,    -- порядок_следования точки маршрута
  [sort_idx]  INT NOT NULL,    -- порядок_сортировки фотографии в карточке
  [url]       NVARCHAR(2048) NOT NULL
);

INSERT INTO @photos ([order_idx], [sort_idx], [url]) VALUES
  -- 1. Петербургский художник
  (1, 1, N'/images/routes/towards-baltic/01-artist-1.jpg'),
  (1, 2, N'/images/routes/towards-baltic/01-artist-2.jpg'),
  (1, 3, N'/images/routes/towards-baltic/01-artist-3.jpg'),
  -- 2. Мариинский театр 2
  (2, 1, N'/images/routes/towards-baltic/02-mariinsky-2-1.jpg'),
  (2, 2, N'/images/routes/towards-baltic/02-mariinsky-2-2.jpg'),
  (2, 3, N'/images/routes/towards-baltic/02-mariinsky-2-3.jpg'),
  -- 3. Хроники огненной истории
  (3, 1, N'/images/routes/towards-baltic/03-fire-museum-1.jpg'),
  (3, 2, N'/images/routes/towards-baltic/03-fire-museum-2.jpg'),
  (3, 3, N'/images/routes/towards-baltic/03-fire-museum-3.jpg'),
  -- 4. Семимостье (Пикалов мост)
  (4, 1, N'/images/routes/towards-baltic/04-semimostie-1.jpg'),
  (4, 2, N'/images/routes/towards-baltic/04-semimostie-2.jpg'),
  (4, 3, N'/images/routes/towards-baltic/04-semimostie-3.jpg'),
  -- 5. Место смерти Суворова
  (5, 1, N'/images/routes/towards-baltic/05-suvorov-1.jpg'),
  (5, 2, N'/images/routes/towards-baltic/05-suvorov-2.jpg'),
  (5, 3, N'/images/routes/towards-baltic/05-suvorov-3.jpg'),
  -- 6. Египетский мост
  (6, 1, N'/images/routes/towards-baltic/06-egyptian-bridge-1.jpg'),
  (6, 2, N'/images/routes/towards-baltic/06-egyptian-bridge-2.jpg'),
  (6, 3, N'/images/routes/towards-baltic/06-egyptian-bridge-3.jpg'),
  -- 7. Троицкий собор и Колонна славы
  (7, 1, N'/images/routes/towards-baltic/07-trinity-cathedral-1.jpg'),
  (7, 2, N'/images/routes/towards-baltic/07-trinity-cathedral-2.jpg'),
  (7, 3, N'/images/routes/towards-baltic/07-trinity-cathedral-3.jpg'),
  -- 8. Сад Валентина Пикуля
  (8, 1, N'/images/routes/towards-baltic/08-pikul-garden-1.jpg'),
  (8, 2, N'/images/routes/towards-baltic/08-pikul-garden-2.jpg'),
  (8, 3, N'/images/routes/towards-baltic/08-pikul-garden-3.jpg'),
  -- 9. Воскресенская церковь
  (9, 1, N'/images/routes/towards-baltic/09-resurrection-church-1.jpg'),
  (9, 2, N'/images/routes/towards-baltic/09-resurrection-church-2.jpg'),
  (9, 3, N'/images/routes/towards-baltic/09-resurrection-church-3.jpg'),
  -- 10. Музей Арт и Факты
  (10, 1, N'/images/routes/towards-baltic/10-artfacts-1.jpg'),
  (10, 2, N'/images/routes/towards-baltic/10-artfacts-2.jpg'),
  (10, 3, N'/images/routes/towards-baltic/10-artfacts-3.jpg'),
  -- 11. Балтийский вокзал и Музей железных дорог России
  (11, 1, N'/images/routes/towards-baltic/11-baltic-station-1.jpg'),
  (11, 2, N'/images/routes/towards-baltic/11-baltic-station-2.jpg'),
  (11, 3, N'/images/routes/towards-baltic/11-baltic-station-3.jpg');

INSERT INTO [фотография_точки_маршрута] ([id_точки_маршрута], [url_изображения], [порядок_сортировки])
SELECT
  p.[id_точки_маршрута],
  ph.[url],
  ph.[sort_idx]
FROM @photos ph
INNER JOIN [точка_маршрута] p
  ON p.[id_маршрута] = @r2
 AND p.[порядок_следования] = ph.[order_idx]
WHERE NOT EXISTS (
  SELECT 1
  FROM [фотография_точки_маршрута] ex
  WHERE ex.[id_точки_маршрута] = p.[id_точки_маршрута]
    AND ex.[url_изображения]   = ph.[url]
);

DECLARE @added INT = @@ROWCOUNT;
PRINT N'Маршрут «Навстречу Балтике»: добавлено фотографий — ' + CAST(@added AS NVARCHAR(20));
