import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/mine', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT comments.id, comments.body, comments.created_at, comments.post_id,
       posts.title AS post_title,
       (SELECT COALESCE(SUM(value), 0) FROM comment_votes WHERE comment_id = comments.id) AS score
     FROM comments
     JOIN posts ON posts.id = comments.post_id
     WHERE comments.user_id = $1
     ORDER BY comments.created_at DESC`,
    [req.session.userId],
  );
  res.json({ comments: result.rows });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: 'Yorum bulunamadı' });
  }

  const result = await pool.query(
    `DELETE FROM comments
     WHERE id = $1
       AND (user_id = $2 OR (SELECT role FROM users WHERE id = $2) = 'admin')`,
    [id, req.session.userId],
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Yorum bulunamadı veya silme yetkiniz yok' });
  }

  res.json({ message: 'Yorum silindi' });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: 'Yorum bulunamadı' });
  }

  const { body } = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Yorum boş olamaz' });
  }

  try {
    const result = await pool.query(
      'UPDATE comments SET body = $1, updated_at = now() WHERE id = $2 AND user_id = $3',
      [body, id, req.session.userId],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Yorum bulunamadı veya düzenleme yetkiniz yok' });
    }
    res.json({ message: 'Yorum güncellendi' });
  } catch (err) {
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Yorum boş olamaz' });
    }
    throw err;
  }
});

router.post('/:id/vote', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: 'Yorum bulunamadı' });
  }

  const { value } = req.body;
  if (value !== 1 && value !== -1) {
    return res.status(400).json({ error: 'Oy değeri 1 veya -1 olmalı' });
  }

  try {
    await pool.query(
      `INSERT INTO comment_votes (user_id, comment_id, value) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, comment_id) DO UPDATE SET value = $3`,
      [req.session.userId, id, value],
    );
  } catch (err) {
    if (err.code === '23503') {
      return res.status(404).json({ error: 'Yorum bulunamadı' });
    }
    throw err;
  }

  const result = await pool.query(
    'SELECT COALESCE(SUM(value), 0) AS score FROM comment_votes WHERE comment_id = $1',
    [id],
  );
  res.json({ score: Number(result.rows[0].score) });
});

export default router;
