import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const path = location.pathname

  // Books/department selection page — minimal navbar (no logout, no links)
  const isDeptSelectPage = path === '/books' && !location.state?.dept

  // Inside a department (books page with active dept) or any other inner page
  const isInnerPage = path !== '/books' || !!location.state?.dept

  const handleLogout = async () => {
    await logout()
    setMenuOpen(false)
    navigate('/')
  }

  const close = () => setMenuOpen(false)

  return (
    <nav className="navbar">
      <Link to="/books" className="brand" onClick={close}>📚 BookXchange</Link>

      {/* Hamburger — mobile */}
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
        {menuOpen ? '✕' : '☰'}
      </button>

      <div className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>

        {/* Show full nav only on inner pages (not dept selection home) */}
        {isInnerPage && (
          <>
            <Link to="/books" onClick={close}>🏠 Browse</Link>
            {user && <Link to="/my-books" onClick={close}>My Books</Link>}
            {user && <Link to="/exchange" onClick={close}>Exchanges</Link>}
            {user && <Link to="/add-book" className="nav-add-btn" onClick={close}>+ Add Book</Link>}
            {user?.role === 'admin' && <Link to="/admin" onClick={close}>Admin</Link>}
          </>
        )}

        {/* Admin link on dept selection too */}
        {isDeptSelectPage && user?.role === 'admin' && (
          <Link to="/admin" onClick={close}>Admin</Link>
        )}

        {/* Avatar always */}
        {user ? (
          <div className="nav-user">
            <Link to="/profile" className="nav-avatar" onClick={close}>
              {user.avatar
                ? <img src={`http://localhost:8000/storage/${user.avatar}`} alt="avatar" />
                : <span className="avatar-initials">{user.name.charAt(0).toUpperCase()}</span>
              }
              <span className="nav-username">{user.name}</span>
            </Link>
            {/* Logout only on inner pages */}
            {isInnerPage && (
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" onClick={close}>Login</Link>
            <Link to="/register" className="nav-register-btn" onClick={close}>Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
