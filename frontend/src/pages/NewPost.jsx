import { useState } from 'react'
import { useNavigate } from 'react-router'
import MarkdownEditor from '../components/MarkdownEditor.jsx'

function NewPost() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

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
    navigate(`/posts/${data.post.id}`)
  }

  return (
    <div>
      <h2>Yeni Gönderi</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Başlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <MarkdownEditor
          rows="6"
          placeholder="Sorunu detaylı yaz"
          value={body}
          onChange={setBody}
        >
          <button type="submit">Paylaş</button>
        </MarkdownEditor>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}

export default NewPost
