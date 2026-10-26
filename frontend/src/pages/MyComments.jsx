import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'

function MyComments() {
  const navigate = useNavigate()
  const [comments, setComments] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/comments/mine')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          return
        }
        setComments(data.comments)
      })
  }, [])

  if (error) return <p>{error}</p>

  return (
    <div>
      <h2>Yorumlarım</h2>
      {comments.length === 0 && <p>Henüz hiç yorum yapmadın.</p>}
      {comments.map((comment) => (
        <article
          key={comment.id}
          className="clickable"
          onClick={() => navigate(`/posts/${comment.post_id}`)}
        >
          <div className="text">
            <Markdown remarkPlugins={[remarkBreaks]}>{comment.body}</Markdown>
          </div>
          <p className="info">
            <span className="post-title">{comment.post_title}</span> ·{' '}
            {comment.score} puan · {new Date(comment.created_at).toLocaleDateString('tr-TR')}
          </p>
        </article>
      ))}
    </div>
  )
}

export default MyComments
