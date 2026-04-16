import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import express from 'express';
import fs from 'node:fs';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3000);
const sessionSecret = process.env.SESSION_SECRET || 'dev-only-secret';

const DELIVERY_OPTIONS = {
  tomsk_delivery: { name: 'Доставка по Томску', price: 150 },
  seversk_delivery: { name: 'Доставка по Северску', price: 200 },
  pickup: { name: 'Самовывоз', price: 0, address: 'г. Томск, ул. Мира, 48' }
};

const GOOGLE_SHEET_TITLE = process.env.GOOGLE_SHEETS_TAB || 'Orders';
const GOOGLE_SHEET_TIME_ZONE = process.env.GOOGLE_SHEETS_TIME_ZONE || 'Asia/Tomsk';
const GOOGLE_SHEET_HEADERS = [
  'Дата создания заказа',
  'Время создания заказа',
  'Имя',
  'Телефон',
  'Комментарий',
  'Названия товаров',
  'Сумма',
  'Доставка/самовывоз',
  'Цена с доставкой'
];

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype));
  }
});

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));
app.use(express.static(__dirname));

function sign(value) {
  return crypto.createHmac('sha256', sessionSecret).update(value).digest('hex');
}

function readCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const index = part.indexOf('=');
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function createSessionCookie() {
  const payload = JSON.stringify({ admin: true, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const token = Buffer.from(payload).toString('base64url');
  return `${token}.${sign(token)}`;
}

function requireAdmin(req, res, next) {
  const token = readCookies(req).admin_session;
  if (!token) return res.status(401).json({ error: 'Требуется вход в админ-панель' });

  const [payload, signature] = token.split('.');
  if (!payload || signature !== sign(payload)) {
    return res.status(401).json({ error: 'Сессия недействительна' });
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!session.admin || session.exp < Date.now()) throw new Error('expired');
    next();
  } catch {
    res.status(401).json({ error: 'Сессия истекла' });
  }
}

function productDto(row) {
  return {
    id: Number(row.id),
    category: row.category,
    title: row.title,
    price: Number(row.price),
    description: row.description,
    image: row.image,
    stock: Number(row.stock),
    isActive: row.is_active
  };
}

function normalizeProduct(input) {
  return {
    category: String(input.category || 'Без категории').trim() || 'Без категории',
    title: String(input.title || '').trim(),
    price: Math.max(0, Number.parseInt(input.price, 10) || 0),
    description: String(input.description || '').trim(),
    image: String(input.image || '').trim(),
    stock: Math.max(0, Number.parseInt(input.stock, 10) || 0),
    isActive: input.isActive !== false
  };
}

function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return google.sheets({ version: 'v4', auth });
}

function sheetRange(range) {
  const title = GOOGLE_SHEET_TITLE.replaceAll("'", "''");
  return `'${title}'!${range}`;
}

function formatOrderDateTime(value) {
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat('ru-RU', {
      timeZone: GOOGLE_SHEET_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date),
    time: new Intl.DateTimeFormat('ru-RU', {
      timeZone: GOOGLE_SHEET_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  };
}

let sheetReadyPromise;

async function ensureOrdersSheet(sheets) {
  if (sheetReadyPromise) return sheetReadyPromise;

  sheetReadyPromise = (async () => {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID
    });
    const sheetExists = spreadsheet.data.sheets?.some(sheet => sheet.properties?.title === GOOGLE_SHEET_TITLE);

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: GOOGLE_SHEET_TITLE,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: GOOGLE_SHEET_HEADERS.length
                }
              }
            }
          }]
        }
      });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: sheetRange(`A1:${String.fromCharCode(64 + GOOGLE_SHEET_HEADERS.length)}1`),
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [GOOGLE_SHEET_HEADERS]
      }
    });

    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: sheetRange('J:O')
    });
  })();

  return sheetReadyPromise;
}

async function appendOrderToSheet(order, items) {
  if (!process.env.GOOGLE_SHEETS_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return;
  }

  const sheets = getSheetsClient();
  await ensureOrdersSheet(sheets);

  const orderDateTime = formatOrderDateTime(order.created_at);
  const orderItemsText = items
    .map(item => `${item.title} x ${item.quantity}`)
    .join('\n');

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: sheetRange('A:I'),
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        orderDateTime.date,
        orderDateTime.time,
        order.customer_name,
        order.customer_phone,
        order.comment,
        orderItemsText,
        order.subtotal,
        order.delivery_name,
        order.total
      ]]
    }
  });
}

app.post('/api/admin/login', async (req, res) => {
  const password = String(req.body.password || '');
  const configured = process.env.ADMIN_PASSWORD || '';
  const ok = configured.startsWith('$2')
    ? await bcrypt.compare(password, configured)
    : configured && password === configured;

  if (!ok) return res.status(401).json({ error: 'Неверный пароль' });

  res.setHeader('Set-Cookie', `admin_session=${createSessionCookie()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
  res.json({ ok: true });
});

app.post('/api/admin/logout', requireAdmin, (_req, res) => {
  res.setHeader('Set-Cookie', 'admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get('/api/products', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM products WHERE is_active = TRUE ORDER BY id ASC'
    );
    res.json(rows.map(productDto));
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/products', requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY id ASC');
    res.json(rows.map(productDto));
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/products', requireAdmin, async (req, res, next) => {
  try {
    const product = normalizeProduct(req.body);
    const { rows } = await pool.query(
      `INSERT INTO products (category, title, price, description, image, stock, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [product.category, product.title, product.price, product.description, product.image, product.stock, product.isActive]
    );
    res.status(201).json(productDto(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res, next) => {
  try {
    const product = normalizeProduct(req.body);
    const { rows } = await pool.query(
      `UPDATE products
       SET category = $1, title = $2, price = $3, description = $4, image = $5, stock = $6, is_active = $7
       WHERE id = $8
       RETURNING *`,
      [product.category, product.title, product.price, product.description, product.image, product.stock, product.isActive, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Товар не найден' });
    res.json(productDto(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res, next) => {
  try {
    await pool.query('UPDATE products SET is_active = FALSE WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/uploads', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Загрузите изображение' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

app.get('/api/admin/orders', requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*,
        COALESCE(json_agg(json_build_object(
          'title', oi.title,
          'price', oi.price,
          'quantity', oi.quantity,
          'lineTotal', oi.line_total
        ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/orders', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const comment = String(req.body.comment || '').trim();
    const deliveryCode = String(req.body.delivery || 'tomsk_delivery');
    const delivery = DELIVERY_OPTIONS[deliveryCode];
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (!name || !phone) return res.status(400).json({ error: 'Заполните имя и телефон' });
    if (!delivery) return res.status(400).json({ error: 'Некорректный способ получения' });
    if (!items.length) return res.status(400).json({ error: 'Корзина пуста' });

    await client.query('BEGIN');

    const itemQuantities = new Map();
    for (const item of items) {
      const id = Number(item.id);
      const quantity = Math.max(0, Number.parseInt(item.qty, 10) || 0);
      if (!Number.isInteger(id) || quantity < 1) {
        throw Object.assign(new Error('Некорректный товар в корзине'), { status: 400 });
      }
      itemQuantities.set(id, (itemQuantities.get(id) || 0) + quantity);
    }

    const productIds = [...itemQuantities.keys()];
    const { rows: products } = await client.query(
      'SELECT * FROM products WHERE id = ANY($1::bigint[]) AND is_active = TRUE FOR UPDATE',
      [productIds]
    );
    const productsById = new Map(products.map(product => [Number(product.id), product]));

    const orderItems = [];
    let subtotal = 0;

    for (const [id, quantity] of itemQuantities) {
      const product = productsById.get(id);

      if (!product) {
        throw Object.assign(new Error('Некорректный товар в корзине'), { status: 400 });
      }
      if (Number(product.stock) < quantity) {
        throw Object.assign(new Error(`Недостаточно товара: ${product.title}`), { status: 409 });
      }

      const price = Number(product.price);
      const lineTotal = price * quantity;
      subtotal += lineTotal;
      orderItems.push({
        product_id: Number(product.id),
        title: product.title,
        price,
        quantity,
        line_total: lineTotal
      });
    }

    const total = subtotal + delivery.price;
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
       (customer_name, customer_phone, comment, delivery_code, delivery_name, delivery_price, subtotal, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, phone, comment, deliveryCode, delivery.name, delivery.price, subtotal, total]
    );
    const order = orderRows[0];

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, title, price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.product_id, item.title, item.price, item.quantity, item.line_total]
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product_id]);
    }

    await client.query('COMMIT');

    try {
      await appendOrderToSheet(order, orderItems);
    } catch (error) {
      console.error('Google Sheets append failed:', error);
      return res.status(502).json({
        error: 'Заказ сохранён, но не удалось записать его в Google Sheets. Свяжитесь с продавцом.'
      });
    }

    res.status(201).json({ id: Number(order.id), total });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || 'Ошибка сервера' });
});

app.listen(port, () => {
  console.log(`Shop server is running at http://localhost:${port}`);
});
