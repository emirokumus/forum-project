import { useEffect, useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router'
import PostList from './pages/PostList.jsx'
import PostDetail from './pages/PostDetail.jsx'
import NewPost from './pages/NewPost.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Account from './pages/Account.jsx'
import MyPosts from './pages/MyPosts.jsx'
import MyComments from './pages/MyComments.jsx'

function App() {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data ? data.user : null))
  }, [])

  function closeMenu(e) {
    e.target.closest('details').removeAttribute('open')
  }

  async function logout(e) {
    e.preventDefault()
    closeMenu(e)
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    navigate('/')
  }

  return (
    <main className="container">
      <nav>
        <ul>
          <li>
            <Link to="/">
              <strong>KodSor</strong>
            </Link>
          </li>
        </ul>
        <ul>
          {user ? (
            <>
              <li>
                <Link to="/new">Yeni Gönderi</Link>
              </li>
              <li>
                <details className="dropdown">
                  <summary>{user.username}</summary>
                  <ul dir="rtl">
                    <li>
                      <Link to="/account" onClick={closeMenu}>Hesabım</Link>
                    </li>
                    <li>
                      <Link to="/my-posts" onClick={closeMenu}>Gönderilerim</Link>
                    </li>
                    <li>
                      <Link to="/my-comments" onClick={closeMenu}>Yorumlarım</Link>
                    </li>
                    <li>
                      <a href="/" onClick={logout}>Çıkış</a>
                    </li>
                  </ul>
                </details>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Giriş</Link>
              </li>
              <li>
                <Link to="/register">Kayıt Ol</Link>
              </li>
            </>
          )}
          <li>
            <button
              className="theme-button"
              title={theme === 'light' ? 'Koyu tema' : 'Açık tema'}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<PostList user={user} />} />
        <Route path="/posts/:id" element={<PostDetail user={user} />} />
        <Route path="/new" element={<NewPost />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account" element={<Account />} />
        <Route path="/my-posts" element={<MyPosts />} />
        <Route path="/my-comments" element={<MyComments />} />
      </Routes>
    </main>
  )
}

export default App
