# Fish & Berry shop

Небольшой интернет-магазин с каталогом, корзиной, админ-панелью, Postgres и записью заказов в Google Sheets.

## Что изменилось

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

Заказы добавляются в Google Таблицу. Для этого:

1. Создайте Google Sheet с листом `Orders`.
2. Создайте service account в Google Cloud и включите Google Sheets API.
3. Дайте email service account доступ на редактирование этой таблицы.
4. Заполните в `.env`:

```env
GOOGLE_SHEETS_ID=...
GOOGLE_SHEETS_TAB=Orders
GOOGLE_SHEETS_TIME_ZONE=Asia/Tomsk
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Подготовить лист и заголовки можно командой:

```bash
npm run sheets:setup
```

Сервер будет добавлять строку в `Orders!A:I` после создания заказа. Если листа `Orders` нет, сервер создаст его сам.

Рекомендуемые заголовки первой строки:

```text
Дата создания заказа | Время создания заказа | Имя | Телефон | Комментарий | Названия товаров | Сумма | Доставка/самовывоз | Цена с доставкой
```

Если Google Sheets временно недоступен, заказ всё равно останется в Postgres, а ошибка появится в логах сервера.

## Деплой

Такой вариант нельзя полноценно разместить только на GitHub Pages, потому что нужен сервер и Postgres. Статические файлы сервер раздаёт сам, поэтому отдельный фронтенд-хостинг не обязателен.

В проект добавлен `render.yaml`, поэтому самый простой вариант - Render:

1. Загрузить проект в GitHub.
2. Создать Render Blueprint из репозитория.
3. В Render добавить env vars из `.env`: `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `GOOGLE_SHEETS_ID`, `GOOGLE_SHEETS_TAB`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`.
4. Выполнить миграцию локально командой `npm run db:migrate` или через Render Shell.
5. Проверить `/api/health`, `/admin.html` и тестовый заказ.
