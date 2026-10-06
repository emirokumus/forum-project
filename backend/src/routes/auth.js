import { Router } from 'express';
import argon2 from 'argon2';
import { pool } from '../db.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Şifre en az 8 karakter olmalı' });
  }

  const passwordHash = await argon2.hash(password);

  try {
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username',
      [username, email, passwordHash],
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Bu kullanıcı adı veya e-posta zaten kullanımda' });
    }
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Kullanıcı adı 3-30 karakter olmalı; sadece harf, rakam ve _ içerebilir' });
    }
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre zorunludur' });
  }

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user || !(await argon2.verify(user.password_hash, password))) {
    return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
  }

  req.session.userId = user.id;
  res.json({ user: { id: user.id, username: user.username } });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Çıkış yapıldı' });
  });
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Giriş yapılmamış' });
  }

  const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [req.session.userId]);
  res.json({ user: result.rows[0] });
});

export default router;
