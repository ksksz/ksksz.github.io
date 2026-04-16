CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'Без категории',
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

UPDATE products
SET category = CASE
  WHEN title ILIKE '%ягод%' OR title ILIKE '%клубник%' OR title ILIKE '%малин%' OR title ILIKE '%голубик%' OR title ILIKE '%ежевик%' THEN 'Ягоды'
  WHEN title ILIKE '%рыб%' OR title ILIKE '%лосос%' OR title ILIKE '%икр%' THEN 'Рыба'
  WHEN title ILIKE '%консерв%' OR title ILIKE '%банк%' OR title ILIKE '%варень%' OR title ILIKE '%джем%' THEN 'Консервы'
  ELSE 'Десерты'
END
WHERE category IS NULL OR category = '' OR category = 'Без категории';

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

INSERT INTO products (id, category, title, price, description, image, stock, is_active)
VALUES
  (1, 'Ягоды', 'Клубника в бельгийском шоколаде', 1990, 'Свежая отборная клубника в премиальном бельгийском шоколаде', 'https://via.placeholder.com/400x300/FF6B9D/FFFFFF?text=Клубника+в+шоколаде', 1, TRUE),
  (2, 'Ягоды', 'Набор свежих ягод (1 кг)', 2990, 'Клубника, малина, голубика, ежевика - свежий микс', 'https://via.placeholder.com/400x300/A08CFF/FFFFFF?text=Набор+ягод', 1, TRUE),
  (3, 'Десерты', 'Шоколадный букет «Роза»', 3500, 'Эксклюзивный букет из шоколадных роз', 'https://via.placeholder.com/400x300/7B61FF/FFFFFF?text=Шоколадный+букет', 1, TRUE),
  (4, 'Десерты', 'Малиновый тарт', 2200, 'Нежный тарт с малиной и кремом', 'https://via.placeholder.com/400x300/FF6B9D/FFFFFF?text=Малиновый+тарт', 0, TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1));
