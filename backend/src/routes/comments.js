import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

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
