-- Таблица: несколько фотографий на точку маршрута (id_точки_маршрута).
-- Аудио для маршрута 5: скрипт update_route5_audio.sql.
SET NOCOUNT ON;

IF OBJECT_ID(N'[фотография_точки_маршрута]', N'U') IS NULL
BEGIN
  CREATE TABLE [фотография_точки_маршрута] (
    [id_фотографии] INT IDENTITY(1, 1) NOT NULL,
    [id_точки_маршрута] INT NOT NULL,
    [url_изображения] NVARCHAR(2048) NOT NULL,
    [порядок_сортировки] INT NOT NULL CONSTRAINT [DF_фото_точки_порядок] DEFAULT (0),
    CONSTRAINT [PK_фотография_точки_маршрута] PRIMARY KEY CLUSTERED ([id_фотографии]),
    CONSTRAINT [FK_фото_точки_точка_маршрута] FOREIGN KEY ([id_точки_маршрута])
      REFERENCES [точка_маршрута]([id_точки_маршрута]) ON DELETE CASCADE
  );
  CREATE NONCLUSTERED INDEX [IX_фото_точки_id_точки]
    ON [фотография_точки_маршрута]([id_точки_маршрута], [порядок_сортировки]);
  PRINT N'Таблица [фотография_точки_маршрута] создана.';
END
ELSE
  PRINT N'Таблица [фотография_точки_маршрута] уже существует.';

-- Перенос ссылок из [достопримечательность].[url_изображения] — ПРОПУЩЕН.
-- Столбец [url_изображения] удалён из таблицы [достопримечательность].
-- Все фото теперь хранятся только в [фотография_точки_маршрута].

-- Доп. фото для маршрута «Променад по линиям Васильевского острова» (точки 1–3), если файлы есть в public.
DECLARE @r5 INT = (SELECT [id_маршрута] FROM [маршрут] WHERE [название] = N'Променад по линиям Васильевского острова');

IF @r5 IS NOT NULL
BEGIN
  INSERT INTO [фотография_точки_маршрута] ([id_точки_маршрута], [url_изображения], [порядок_сортировки])
  SELECT p.[id_точки_маршрута], N'/images/routes/promenade-vasilyevsky/01-naval-2.jpg', 1
  FROM [точка_маршрута] p WHERE p.[id_маршрута] = @r5 AND p.[порядок_следования] = 1
    AND NOT EXISTS (SELECT 1 FROM [фотография_точки_маршрута] ph WHERE ph.[id_точки_маршрута] = p.[id_точки_маршрута] AND ph.[url_изображения] = N'/images/routes/promenade-vasilyevsky/01-naval-2.jpg');
  INSERT INTO [фотография_точки_маршрута] ([id_точки_маршрута], [url_изображения], [порядок_сортировки])
  SELECT p.[id_точки_маршрута], N'/images/routes/promenade-vasilyevsky/01-naval-3.jpg', 2
  FROM [точка_маршрута] p WHERE p.[id_маршрута] = @r5 AND p.[порядок_следования] = 1
    AND NOT EXISTS (SELECT 1 FROM [фотография_точки_маршрута] ph WHERE ph.[id_точки_маршрута] = p.[id_точки_маршрута] AND ph.[url_изображения] = N'/images/routes/promenade-vasilyevsky/01-naval-3.jpg');
  INSERT INTO [фотография_точки_маршрута] ([id_точки_маршрута], [url_изображения], [порядок_сортировки])
  SELECT p.[id_точки_маршрута], N'/images/routes/promenade-vasilyevsky/02-rumyantsev-2.jpg', 1
  FROM [точка_маршрута] p WHERE p.[id_маршрута] = @r5 AND p.[порядок_следования] = 2
    AND NOT EXISTS (SELECT 1 FROM [фотография_точки_маршрута] ph WHERE ph.[id_точки_маршрута] = p.[id_точки_маршрута] AND ph.[url_изображения] = N'/images/routes/promenade-vasilyevsky/02-rumyantsev-2.jpg');
  INSERT INTO [фотография_точки_маршрута] ([id_точки_маршрута], [url_изображения], [порядок_сортировки])
  SELECT p.[id_точки_маршрута], N'/images/routes/promenade-vasilyevsky/02-rumyantsev-3.jpg', 2
  FROM [точка_маршрута] p WHERE p.[id_маршрута] = @r5 AND p.[порядок_следования] = 2
    AND NOT EXISTS (SELECT 1 FROM [фотография_точки_маршрута] ph WHERE ph.[id_точки_маршрута] = p.[id_точки_маршрута] AND ph.[url_изображения] = N'/images/routes/promenade-vasilyevsky/02-rumyantsev-3.jpg');
  INSERT INTO [фотография_точки_маршрута] ([id_точки_маршрута], [url_изображения], [порядок_сортировки])
  SELECT p.[id_точки_маршрута], N'/images/routes/promenade-vasilyevsky/03-pavlov-2.jpg', 1
  FROM [точка_маршрута] p WHERE p.[id_маршрута] = @r5 AND p.[порядок_следования] = 3
    AND NOT EXISTS (SELECT 1 FROM [фотография_точки_маршрута] ph WHERE ph.[id_точки_маршрута] = p.[id_точки_маршрута] AND ph.[url_изображения] = N'/images/routes/promenade-vasilyevsky/03-pavlov-2.jpg');
  INSERT INTO [фотография_точки_маршрута] ([id_точки_маршрута], [url_изображения], [порядок_сортировки])
  SELECT p.[id_точки_маршрута], N'/images/routes/promenade-vasilyevsky/03-pavlov-3.jpg', 2
  FROM [точка_маршрута] p WHERE p.[id_маршрута] = @r5 AND p.[порядок_следования] = 3
    AND NOT EXISTS (SELECT 1 FROM [фотография_точки_маршрута] ph WHERE ph.[id_точки_маршрута] = p.[id_точки_маршрута] AND ph.[url_изображения] = N'/images/routes/promenade-vasilyevsky/03-pavlov-3.jpg');

  PRINT N'Доп. фото для маршрута 5 добавлены (по 2 шт. к точкам 1–3, если ещё не было).';
END
