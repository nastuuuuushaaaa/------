-- Ссылки на аудиогид в [достопримечательность].[url_аудиофайла] (файлы во фронте: public/audio/routes/promenade-vasilyevsky/*.m4a).
-- Запуск из cmd (кириллица в именах таблиц — нужен UTF-8):
--   sqlcmd -S "NASTUSHKINS\SQLEXPRESS" -d guap_routes_db -E -C -f 65001 -i "...\update_route5_audio.sql"
SET NOCOUNT ON;

DECLARE @r5 INT = (SELECT [id_маршрута] FROM [маршрут] WHERE [название] = N'Променад по линиям Васильевского острова');

IF @r5 IS NULL
BEGIN
  RAISERROR(N'Маршрут «Променад по линиям Васильевского острова» не найден.', 16, 1);
  RETURN;
END

UPDATE [достопримечательность]
SET [url_аудиофайла] = N'/audio/routes/promenade-vasilyevsky/01-naval.m4a'
WHERE [название] = N'Центральный военно-морской музей имени императора Петра Великого';

UPDATE [достопримечательность]
SET [url_аудиофайла] = N'/audio/routes/promenade-vasilyevsky/02-rumyantsev.m4a'
WHERE [название] = N'Особняк Румянцева';

UPDATE [достопримечательность]
SET [url_аудиофайла] = N'/audio/routes/promenade-vasilyevsky/03-pavlov.m4a'
WHERE [название] = N'Музей-квартира И.П. Павлова';

PRINT N'Обновлены url_аудиофайла для первых трёх точек маршрута «Променад по линиям Васильевского острова».';
