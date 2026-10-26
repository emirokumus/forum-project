import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import MarkdownEditor from '../components/MarkdownEditor.jsx'

function PostList({ user }) {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [sort, setSort] = useState('new')

  function loadPosts() {
    fetch(`/api/posts?sort=${sort}`)
      .then((res) => res.json())
      .then((data) => setPosts(data.posts))
  }

  useEffect(() => {
    loadPosts()
  }, [sort])

  async function handleSubmit(e) {
    e.preventDefault()
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setTitle('')
    setBody('')
    setError('')
    loadPosts()
  }

  return (
    <div>
      {user ? (
        <article className="new-post">
          <form onSubmit={handleSubmit}>
            <input
              placeholder="Başlık"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <MarkdownEditor
              rows="2"
              placeholder="Ne sormak istiyorsun?"
              value={body}
              onChange={setBody}
            >
              <button type="submit">Paylaş</button>
            </MarkdownEditor>
            {error && <p className="error">{error}</p>}
          </form>
        </article>
      ) : (
        <p>
          Soru sormak için <Link to="/login">giriş yap</Link>.
        </p>
      )}

      <div className="list-header">
        <h2>Gönderiler</h2>
        <div className="actions">
          <button
            className={sort === 'new' ? 'sort-button' : 'sort-button outline'}
            onClick={() => setSort('new')}
          >
            En Yeni
          </button>
          <button
            className={sort === 'top' ? 'sort-button' : 'sort-button outline'}
            onClick={() => setSort('top')}
          >
            En Çok Oy
          </button>
        </div>
      </div>
      {posts.length === 0 && <p>Henüz gönderi yok.</p>}
      {posts.map((post) => (
        <article
          key={post.id}
          className="clickable"
          onClick={() => navigate(`/posts/${post.id}`)}
        >
          <span className="post-title">{post.title}</span>
          <p className="info">
            {post.username} · {post.score} puan · {post.comment_count} yorum ·{' '}
            {new Date(post.created_at).toLocaleDateString('tr-TR')}
          </p>
        </article>
      ))}
    </div>
  )
}

export default PostList
