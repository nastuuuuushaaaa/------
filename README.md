# GUAP Attractions — маршруты по достопримечательностям

Дипломный проект: веб-приложение для пешеходных маршрутов по Санкт-Петербургу.

## Состав репозитория

- **GuapAttractions.Api** — ASP.NET Core Web API (SQL Server)
- **guap-attractions-web** — фронтенд Next.js

## Быстрый старт

### API

1. Скопируйте `GuapAttractions.Api/appsettings.example.json` → `appsettings.json` и укажите строку подключения к SQL Server и SMTP.
2. Примените скрипты БД (при необходимости): `GuapAttractions.Api/Scripts/setup_apply_all.sql`
3. Запуск:

```bash
cd GuapAttractions.Api
dotnet run
```

### Web

```bash
cd guap-attractions-web
npm install
npm run dev
```

## Важно

Файл `appsettings.json` с паролями **не** попадает в git (см. `.gitignore`). Используйте `appsettings.example.json` как шаблон.
