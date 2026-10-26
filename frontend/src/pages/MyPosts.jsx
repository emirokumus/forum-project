import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'

function MyPosts() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/posts/mine')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          return
        }
        setPosts(data.posts)
      })
  }, [])

  if (error) return <p>{error}</p>

  return (
    <div>
      <h2>Gönderilerim</h2>
      {posts.length === 0 && (
        <p>
          Henüz gönderin yok. <Link to="/new">İlk gönderini oluştur.</Link>
        </p>
      )}
      {posts.map((post) => (
        <article
          key={post.id}
          className="clickable"
          onClick={() => navigate(`/posts/${post.id}`)}
        >
          <span className="post-title">{post.title}</span>
          <p className="info">
            {post.score} puan · {post.comment_count} yorum ·{' '}
            {new Date(post.created_at).toLocaleDateString('tr-TR')}
          </p>
        </article>
      ))}
    </div>
  )
}

export default MyPosts
