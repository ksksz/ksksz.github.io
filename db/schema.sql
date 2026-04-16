CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_idx ON categories(name);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'Без категории',
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  delivery_code TEXT NOT NULL,
  delivery_name TEXT NOT NULL,
  delivery_price INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS products_active_idx ON products(is_active);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Без категории';

ALTER TABLE products
ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL;

UPDATE products
SET category = CASE
  WHEN title ILIKE '%ягод%' OR title ILIKE '%клубник%' OR title ILIKE '%малин%' OR title ILIKE '%голубик%' OR title ILIKE '%ежевик%' THEN 'Ягоды'
  WHEN title ILIKE '%рыб%' OR title ILIKE '%лосос%' OR title ILIKE '%икр%' THEN 'Рыба'
  WHEN title ILIKE '%консерв%' OR title ILIKE '%банк%' OR title ILIKE '%варень%' OR title ILIKE '%джем%' THEN 'Консервы'
  ELSE 'Десерты'
END
WHERE category IS NULL OR category = '' OR category = 'Без категории';

INSERT INTO categories (name, description, image, sort_order, is_active)
VALUES
  ('Рыба', 'Свежая рыба и деликатесы для повседневного и праздничного стола.', 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?auto=format&fit=crop&w=1200&q=80', 10, TRUE),
  ('Ягоды', 'Свежие ягоды, сезонные наборы и подарочные ягодные композиции.', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80', 20, TRUE),
  ('Консервы', 'Домашние заготовки, варенья и продукты длительного хранения.', 'https://images.unsplash.com/photo-1584263347416-85a696b4eda7?auto=format&fit=crop&w=1200&q=80', 30, TRUE),
  ('Десерты', 'Тарты, шоколадные букеты и десерты для подарка и витрины.', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80', 40, TRUE),
  ('Подарочные наборы', 'Готовые наборы для подарка и праздничной подачи.', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0ff?auto=format&fit=crop&w=1200&q=80', 50, TRUE),
  ('Соусы и закуски', 'Соусы, намазки и гастрономические дополнения к заказу.', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80', 60, TRUE),
  ('Без категории', 'Товары без назначенной категории.', 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80', 999, TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, sort_order, is_active)
SELECT DISTINCT category, 900, TRUE
FROM products
WHERE category IS NOT NULL AND category <> ''
ON CONFLICT (name) DO NOTHING;

UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.category = c.name
  AND (p.category_id IS NULL OR p.category_id <> c.id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_set_updated_at ON products;
CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS categories_set_updated_at ON categories;
CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO products (id, category, title, price, description, image, stock, is_active)
VALUES
  (1, 'Ягоды', 'Клубника в бельгийском шоколаде', 1990, 'Свежая отборная клубника в премиальном бельгийском шоколаде', 'https://via.placeholder.com/400x300/FF6B9D/FFFFFF?text=Клубника+в+шоколаде', 1, TRUE),
  (2, 'Ягоды', 'Набор свежих ягод (1 кг)', 2990, 'Клубника, малина, голубика, ежевика - свежий микс', 'https://via.placeholder.com/400x300/A08CFF/FFFFFF?text=Набор+ягод', 1, TRUE),
  (3, 'Десерты', 'Шоколадный букет «Роза»', 3500, 'Эксклюзивный букет из шоколадных роз', 'https://via.placeholder.com/400x300/7B61FF/FFFFFF?text=Шоколадный+букет', 1, TRUE),
  (4, 'Десерты', 'Малиновый тарт', 2200, 'Нежный тарт с малиной и кремом', 'https://via.placeholder.com/400x300/FF6B9D/FFFFFF?text=Малиновый+тарт', 0, TRUE)
ON CONFLICT (id) DO NOTHING;

UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.category = c.name
  AND (p.category_id IS NULL OR p.category_id <> c.id);

SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1));
