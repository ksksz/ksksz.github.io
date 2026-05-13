# Fish & Berry shop

Небольшой интернет-магазин с каталогом, корзиной, админ-панелью, Postgres и записью заказов в Google Sheets.


- Товары хранятся в Postgres.
- Админ-панель `/admin.html` умеет добавлять и редактировать товары, описание, цену, остаток и фото.
- Заказы создаются через серверный endpoint `/api/orders`.
- Заказы сохраняются в таблицы `orders` и `order_items`.
- Каждый заказ дублируется в Google Sheets, если заполнены настройки Google API.

## Запуск локально

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env` из примера:

```bash
cp .env.example .env
```

3. Заполнить `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`.

4. Создать таблицы:

```bash
npm run db:migrate
```

5. Запустить сервер:

```bash
npm run dev
```

Сайт будет доступен на `http://localhost:3000`, админ-панель - на `http://localhost:3000/admin.html`.

## Google Sheets

Заказы добавляются в Google Таблицу. 
