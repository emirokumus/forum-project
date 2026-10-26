import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/', async (req, res) => {
  const orderBy =
    req.query.sort === 'top' ? 'score DESC, posts.created_at DESC' : 'posts.created_at DESC';

  const result = await pool.query(
    `SELECT posts.id, posts.title, posts.created_at, users.username,
       (SELECT COALESCE(SUM(value), 0) FROM post_votes WHERE post_id = posts.id) AS score,
       (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comment_count
     FROM posts
     JOIN users ON users.id = posts.user_id
     ORDER BY ${orderBy}
     LIMIT 50`,
  );
  res.json({ posts: result.rows });
});

router.get('/mine', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT posts.id, posts.title, posts.created_at,
       (SELECT COALESCE(SUM(value), 0) FROM post_votes WHERE post_id = posts.id) AS score,
       (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comment_count
     FROM posts
     WHERE posts.user_id = $1
     ORDER BY posts.created_at DESC`,
    [req.session.userId],
  );
  res.json({ posts: result.rows });
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: 'Gönderi bulunamadı' });
  }

  const postResult = await pool.query(
    `SELECT posts.id, posts.title, posts.body, posts.created_at, posts.updated_at, users.username,
       (SELECT COALESCE(SUM(value), 0) FROM post_votes WHERE post_id = posts.id) AS score
     FROM posts
     JOIN users ON users.id = posts.user_id
     WHERE posts.id = $1`,
    [id],
  );
  const post = postResult.rows[0];
  if (!post) {
    return res.status(404).json({ error: 'Gönderi bulunamadı' });
  }

  const commentsResult = await pool.query(
    `SELECT comments.id, comments.body, comments.created_at, comments.updated_at, users.username,
       (SELECT COALESCE(SUM(value), 0) FROM comment_votes WHERE comment_id = comments.id) AS score
     FROM comments
     JOIN users ON users.id = comments.user_id
     WHERE comments.post_id = $1
     ORDER BY score DESC, comments.created_at`,
    [id],
  );

  res.json({ post, comments: commentsResult.rows });
});

router.post('/', requireAuth, async (req, res) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Başlık ve içerik zorunludur' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO posts (user_id, title, body) VALUES ($1, $2, $3) RETURNING id, title, body, created_at',
      [req.session.userId, title, body],
    );
    res.status(201).json({ post: result.rows[0] });
  } catch (err) {
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Başlık ve içerik boş olamaz, içerik en fazla 30.000 karakter olabilir' });
    }
    throw err;
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: 'Gönderi bulunamadı' });
  }

  const result = await pool.query(
    `DELETE FROM posts
     WHERE id = $1
       AND (user_id = $2 OR (SELECT role FROM users WHERE id = $2) = 'admin')`,
    [id, req.session.userId],
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Gönderi bulunamadı veya silme yetkiniz yok' });
  }

  res.json({ message: 'Gönderi silindi' });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: 'Gönderi bulunamadı' });
  }

  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Başlık ve içerik zorunludur' });
  }

  try {
    const result = await pool.query(
      `UPDATE posts SET title = $1, body = $2, updated_at = now()
       WHERE id = $3 AND user_id = $4`,
      [title, body, id, req.session.userId],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Gönderi bulunamadı veya düzenleme yetkiniz yok' });
    }
    res.json({ message: 'Gönderi güncellendi' });
  } catch (err) {
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Başlık ve içerik boş olamaz, içerik en fazla 30.000 karakter olabilir' });
    }
    throw err;
  }
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: 'Gönderi bulunamadı' });
  }

  const { body } = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Yorum boş olamaz' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO comments (post_id, user_id, body) VALUES ($1, $2, $3) RETURNING id, body, created_at',
      [id, req.session.userId, body],
    );
    res.status(201).json({ comment: result.rows[0] });
  } catch (err) {
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Yorum boş olamaz, en fazla 30.000 karakter olabilir' });
    }
    if (err.code === '23503') {
      return res.status(404).json({ error: 'Gönderi bulunamadı' });
    }
    throw err;
  }
});

router.post('/:id/vote', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: 'Gönderi bulunamadı' });
  }

  const { value } = req.body;
  if (value !== 1 && value !== -1) {
    return res.status(400).json({ error: 'Oy değeri 1 veya -1 olmalı' });
  }

  try {
    await pool.query(
      `INSERT INTO post_votes (user_id, post_id, value) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, post_id) DO UPDATE SET value = $3`,
      [req.session.userId, id, value],
    );
  } catch (err) {
    if (err.code === '23503') {
      return res.status(404).json({ error: 'Gönderi bulunamadı' });
    }
    throw err;
  }

  const result = await pool.query(
    'SELECT COALESCE(SUM(value), 0) AS score FROM post_votes WHERE post_id = $1',
    [id],
  );
  res.json({ score: Number(result.rows[0].score) });
});

export default router;
