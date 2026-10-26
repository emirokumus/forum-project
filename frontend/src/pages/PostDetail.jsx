import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import MarkdownEditor from '../components/MarkdownEditor.jsx'
import TrashIcon from '../components/TrashIcon.jsx'
import PencilIcon from '../components/PencilIcon.jsx'

function formatDate(item) {
  const date = new Date(item.created_at).toLocaleString('tr-TR')
  const edited = new Date(item.updated_at) - new Date(item.created_at) > 1000
  return edited ? `${date} (düzenlendi)` : date
}

function PostDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editingPost, setEditingPost] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editComment, setEditComment] = useState('')

  const isAdmin = user && user.role === 'admin'

  function isOwner(username) {
    return user && user.username === username
  }

  function loadPost() {
    fetch(`/api/posts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          return
        }
        setPost(data.post)
        setComments(data.comments)
      })
  }

  useEffect(() => {
    loadPost()
  }, [id])

  async function vote(url, value) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
    if (res.ok) {
      setError('')
      loadPost()
    } else {
      const data = await res.json()
      setError(data.error)
    }
  }

  async function addComment(e) {
    e.preventDefault()
    const res = await fetch(`/api/posts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newComment }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setNewComment('')
    setError('')
    loadPost()
  }

  function startEditPost() {
    setEditTitle(post.title)
    setEditBody(post.body)
    setEditingPost(true)
  }

  async function savePost(e) {
    e.preventDefault()
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, body: editBody }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setEditingPost(false)
    setError('')
    loadPost()
  }

  function startEditComment(comment) {
    setEditComment(comment.body)
    setEditingCommentId(comment.id)
  }

  async function saveComment(e) {
    e.preventDefault()
    const res = await fetch(`/api/comments/${editingCommentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: editComment }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setEditingCommentId(null)
    setError('')
    loadPost()
  }

  async function confirmDelete() {
    const url =
      deleteTarget.type === 'post' ? `/api/posts/${id}` : `/api/comments/${deleteTarget.id}`
    const res = await fetch(url, { method: 'DELETE' })
    const type = deleteTarget.type
    setDeleteTarget(null)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error)
      return
    }
    if (type === 'post') {
      navigate('/')
    } else {
      setError('')
      loadPost()
    }
  }

  if (!post) return <p>{error || 'Yükleniyor...'}</p>

  return (
    <div>
      {editingPost ? (
        <form onSubmit={savePost}>
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
          <MarkdownEditor rows="6" value={editBody} onChange={setEditBody}>
            <div className="actions">
              <button type="button" className="secondary" onClick={() => setEditingPost(false)}>
                Vazgeç
              </button>
              <button type="submit">Kaydet</button>
            </div>
          </MarkdownEditor>
        </form>
      ) : (
        <>
          <div className="post-header">
            <h2>{post.title}</h2>
            <div className="actions">
              {isOwner(post.username) && (
                <button className="edit-button" onClick={startEditPost}>
                  <PencilIcon /> Düzenle
                </button>
              )}
              {(isOwner(post.username) || isAdmin) && (
                <button className="delete-button" onClick={() => setDeleteTarget({ type: 'post' })}>
                  <TrashIcon /> Sil
                </button>
              )}
            </div>
          </div>
          <p className="info">
            {post.username} · {formatDate(post)}
          </p>
          <div className="text">
            <Markdown remarkPlugins={[remarkBreaks]}>{post.body}</Markdown>
          </div>
        </>
      )}

      <p>
        <button className="outline vote" onClick={() => vote(`/api/posts/${id}/vote`, 1)}>▲</button>{' '}
        <strong>{post.score}</strong>{' '}
        <button className="outline vote" onClick={() => vote(`/api/posts/${id}/vote`, -1)}>▼</button>
      </p>

      {error && <p className="error">{error}</p>}

      <h3>Yorumlar ({comments.length})</h3>
      {comments.map((comment) => (
        <article key={comment.id}>
          {editingCommentId === comment.id ? (
            <form onSubmit={saveComment}>
              <MarkdownEditor rows="3" value={editComment} onChange={setEditComment}>
                <div className="actions">
                  <button type="button" className="secondary" onClick={() => setEditingCommentId(null)}>
                    Vazgeç
                  </button>
                  <button type="submit">Kaydet</button>
                </div>
              </MarkdownEditor>
            </form>
          ) : (
            <>
              <div className="text">
                <Markdown remarkPlugins={[remarkBreaks]}>{comment.body}</Markdown>
              </div>
              <p className="info">
                {comment.username} · {formatDate(comment)} ·{' '}
                <button className="outline vote" onClick={() => vote(`/api/comments/${comment.id}/vote`, 1)}>▲</button>{' '}
                {comment.score}{' '}
                <button className="outline vote" onClick={() => vote(`/api/comments/${comment.id}/vote`, -1)}>▼</button>
                {(isOwner(comment.username) || isAdmin) && (
                  <button
                    className="delete-button small"
                    title="Yorumu sil"
                    onClick={() => setDeleteTarget({ type: 'comment', id: comment.id })}
                  >
                    <TrashIcon />
                  </button>
                )}
                {isOwner(comment.username) && (
                  <button
                    className="edit-button small"
                    title="Yorumu düzenle"
                    onClick={() => startEditComment(comment)}
                  >
                    <PencilIcon />
                  </button>
                )}
              </p>
            </>
          )}
        </article>
      ))}

      {user ? (
        <form onSubmit={addComment}>
          <MarkdownEditor
            rows="3"
            placeholder="Yorumunu yaz"
            value={newComment}
            onChange={setNewComment}
          >
            <button type="submit">Yorum Yap</button>
          </MarkdownEditor>
        </form>
      ) : (
        <p>
          Yorum yapmak için <Link to="/login">giriş yap</Link>.
        </p>
      )}

      {deleteTarget && (
        <dialog open>
          <article>
            <header>
              <button aria-label="Kapat" rel="prev" onClick={() => setDeleteTarget(null)}></button>
              <strong>{deleteTarget.type === 'post' ? 'Gönderiyi sil?' : 'Yorumu sil?'}</strong>
            </header>
            <p>
              {deleteTarget.type === 'post'
                ? 'Bu gönderiyi sildikten sonra geri getirilemez. Gönderiye ait yorumlar ve oylar da silinecek.'
                : 'Bu yorumu sildikten sonra geri getirilemez.'}
            </p>
            <footer>
              <button className="secondary" onClick={() => setDeleteTarget(null)}>
                Vazgeç
              </button>
              <button className="danger" onClick={confirmDelete}>
                Evet, Sil
              </button>
            </footer>
          </article>
        </dialog>
      )}
    </div>
  )
}

export default PostDetail
