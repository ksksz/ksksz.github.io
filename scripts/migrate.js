import 'dotenv/config';
import fs from 'node:fs/promises';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

try {
  const sql = await fs.readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);
  console.log('Database migration completed');
} finally {
  await pool.end();
}
