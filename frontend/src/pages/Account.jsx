import { useEffect, useState } from 'react'

function Account() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          return
        }
        setUser(data.user)
      })
  }, [])

  if (!user) return <p>{error || 'Yükleniyor...'}</p>

  return (
    <div>
      <h2>Hesabım</h2>
      <article>
        <p>
          <strong>Kullanıcı adı:</strong> {user.username}
        </p>
        <p>
          <strong>E-posta:</strong> {user.email}
        </p>
        {user.role === 'admin' && (
          <p>
            <strong>Rol:</strong> Yönetici
          </p>
        )}
        <p>
          <strong>Üyelik tarihi:</strong>{' '}
          {new Date(user.created_at).toLocaleDateString('tr-TR')}
        </p>
        <p>
          <strong>Gönderi sayısı:</strong> {user.post_count}
        </p>
        <p>
          <strong>Yorum sayısı:</strong> {user.comment_count}
        </p>
      </article>
    </div>
  )
}

export default Account
