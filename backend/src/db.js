import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL tanımlı değil');
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

pool.on('error', (err) => {
  console.error('Beklenmeyen veritabanı hatası', err);
});
