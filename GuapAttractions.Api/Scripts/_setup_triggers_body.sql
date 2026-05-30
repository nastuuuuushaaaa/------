-- Триггеры guap_routes_db, префикс TR_
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID(N'[аудит_действий]', N'U') IS NULL
BEGIN
    CREATE TABLE [аудит_действий] (
        [id_записи]       INT IDENTITY(1,1) NOT NULL,
        [дата_время]      DATETIME2(0) NOT NULL CONSTRAINT [DF_аудит_дата] DEFAULT (SYSUTCDATETIME()),
        [тип_действия]    NVARCHAR(60)  NOT NULL,
        [описание]        NVARCHAR(500) NOT NULL,
        [id_пользователя] INT           NULL,
        CONSTRAINT [PK_аудит_действий] PRIMARY KEY CLUSTERED ([id_записи])
    );
    CREATE NONCLUSTERED INDEX [IX_аудит_тип_дата]
        ON [аудит_действий] ([тип_действия], [дата_время] DESC);
    CREATE NONCLUSTERED INDEX [IX_аудит_пользователь]
        ON [аудит_действий] ([id_пользователя])
        WHERE [id_пользователя] IS NOT NULL;
END;
GO

CREATE OR ALTER TRIGGER [dbo].[TR_пользователь_after_insert]
ON [пользователь]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE u
    SET [email] = LOWER(i.[email])
    FROM [пользователь] u
    INNER JOIN inserted i ON i.[id_пользователя] = u.[id_пользователя]
    WHERE u.[email] <> LOWER(i.[email]);
    INSERT INTO [аудит_действий] ([тип_действия], [описание], [id_пользователя])
    SELECT N'РЕГИСТРАЦИЯ', CONCAT(N'Зарегистрирован пользователь ', LOWER(i.[email])), i.[id_пользователя]
    FROM inserted i;
END;
GO

CREATE OR ALTER TRIGGER [dbo].[TR_пользователь_after_update_email]
ON [пользователь]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE([email]) RETURN;
    UPDATE u
    SET [email] = LOWER(i.[email])
    FROM [пользователь] u
    INNER JOIN inserted i ON i.[id_пользователя] = u.[id_пользователя]
    WHERE u.[email] <> LOWER(i.[email]);
END;
GO

CREATE OR ALTER TRIGGER [dbo].[TR_вопрос_викторины_validate]
ON [вопрос_викторины]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted WHERE [индекс_правильного_ответа] < 0 OR [индекс_правильного_ответа] > 3)
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50020, N'индекс_правильного_ответа должен быть в диапазоне [0..3].', 1;
        RETURN;
    END
    IF EXISTS (
        SELECT 1 FROM inserted
        WHERE LEN(LTRIM(RTRIM([вариант_ответа_1]))) = 0 OR LEN(LTRIM(RTRIM([вариант_ответа_2]))) = 0
           OR LEN(LTRIM(RTRIM([вариант_ответа_3]))) = 0 OR LEN(LTRIM(RTRIM([вариант_ответа_4]))) = 0
           OR LEN(LTRIM(RTRIM([текст_вопроса]))) = 0
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50021, N'Текст вопроса и все четыре варианта ответа должны быть непустыми.', 1;
        RETURN;
    END
END;
GO

CREATE OR ALTER TRIGGER [dbo].[TR_прогресс_маршрута_validate]
ON [прогресс_маршрута]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE i.[id_последней_пройденной_точки] IS NOT NULL
          AND NOT EXISTS (
                SELECT 1 FROM [точка_маршрута] tp
                WHERE tp.[id_точки_маршрута] = i.[id_последней_пройденной_точки]
                  AND tp.[id_маршрута] = i.[id_маршрута]
          )
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50030, N'id_последней_пройденной_точки не принадлежит указанному маршруту.', 1;
        RETURN;
    END
END;
GO

CREATE OR ALTER TRIGGER [dbo].[TR_результат_викторины_validate]
ON [результат_викторины]
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.[количество_правильных_ответов] < 0)
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50040, N'количество_правильных_ответов не может быть отрицательным.', 1;
        RETURN;
    END
    IF EXISTS (
        SELECT 1 FROM inserted i
        CROSS APPLY (SELECT COUNT(*) AS cnt FROM [вопрос_викторины] q WHERE q.[id_викторины] = i.[id_викторины]) c
        WHERE i.[количество_правильных_ответов] > c.cnt
    )
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50041, N'количество_правильных_ответов больше числа вопросов в викторине.', 1;
        RETURN;
    END
END;
GO

CREATE OR ALTER TRIGGER [dbo].[TR_прогресс_маршрута_аудит_завершения]
ON [прогресс_маршрута]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE([завершен]) RETURN;
    INSERT INTO [аудит_действий] ([тип_действия], [описание], [id_пользователя])
    SELECT N'МАРШРУТ_ЗАВЕРШЁН',
        CONCAT(N'Пользователь ', i.[id_пользователя], N' завершил маршрут ', i.[id_маршрута]),
        i.[id_пользователя]
    FROM inserted i
    INNER JOIN deleted d ON d.[id_пользователя] = i.[id_пользователя] AND d.[id_маршрута] = i.[id_маршрута]
    WHERE ISNULL(d.[завершен], 0) = 0 AND i.[завершен] = 1;
END;
GO

CREATE OR ALTER TRIGGER [dbo].[TR_результат_викторины_аудит]
ON [результат_викторины]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO [аудит_действий] ([тип_действия], [описание], [id_пользователя])
    SELECT N'ВИКТОРИНА_СДАНА',
        CONCAT(N'Пользователь ', i.[id_пользователя], N' прошёл викторину ', i.[id_викторины],
               N' с результатом ', i.[количество_правильных_ответов], N' правильных ответов'),
        i.[id_пользователя]
    FROM inserted i;
END;
GO

PRINT N'=== Триггеры TR_ применены ===';
GO
