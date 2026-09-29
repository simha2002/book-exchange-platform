import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import SkeletonCard from '../components/SkeletonCard'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'
import useTitle from '../hooks/useTitle'

const IMG_BASE = 'http://localhost:8000/storage/'

const DEPARTMENTS = [
  { code: 'IT',       label: 'IT Department',       icon: '💻', color: '#3498db' },
  { code: 'ENGLISH',  label: 'English Department',  icon: '📝', color: '#9b59b6' },
  { code: 'ACCOUNTS', label: 'Accounts Department', icon: '💰', color: '#27ae60' },
]

const CATEGORIES = ['All', 'Pass Papers', 'Notes']

export default function Books() {
  useTitle('Browse Books')
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const { toast, showToast, hideToast } = useToast()

  // If coming from Add Book, auto-select that department
  const initialDept = location.state?.dept || null

  const [activeDept,   setActiveDept]   = useState(initialDept)
  const [books,        setBooks]        = useState([])
  const [meta,         setMeta]         = useState(null)
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [searchInput,  setSearchInput]  = useState('')
  const [category,     setCategory]     = useState('All')
  const [loading,      setLoading]      = useState(false)

  const fetchBooks = useCallback(async (dept, p = 1, title = '', cat = 'All') => {
    setLoading(true)
    try {
      const endpoint = title
        ? `/search-book?title=${encodeURIComponent(title)}&page=${p}&department=${dept}`
        : `/books?page=${p}&department=${dept}&category=${cat}`
      const res = await api.get(endpoint)
      setBooks(res.data.data || [])
      setMeta(res.data)
    } catch {
      showToast('Failed to load books', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (activeDept) fetchBooks(activeDept, page, search, category)
  }, [activeDept, page, search, category, fetchBooks])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const handleClear = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this book?')) return
    try {
      await api.delete(`/books/${id}`)
      setBooks(books.filter(b => b.id !== id))
      showToast('Book deleted')
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error')
    }
  }

  // ── Department Selection Page ──
  if (!activeDept) {
    return (
      <div className="page">
        <Navbar />
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

        <div className="content">
          <div className="dept-select-header">
            <h2>📚 Browse Books</h2>
            <p>Select your department to browse books</p>
          </div>

          <div className="dept-cards">
            {DEPARTMENTS.map((dept) => (
              <div
                key={dept.code}
                className="dept-card"
                style={{ '--dept-color': dept.color }}
                onClick={() => { setActiveDept(dept.code); setPage(1); setSearch(''); setSearchInput(''); setCategory('All') }}
              >
                <span className="dept-card-icon">{dept.icon}</span>
                <h3>{dept.label}</h3>
                <p>Browse & exchange books</p>
                <span className="dept-card-arrow">→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Books inside a Department ──
  const currentDept = DEPARTMENTS.find(d => d.code === activeDept)

  return (
    <div className="page">
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="content">

        {/* Header */}
        <div className="books-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="back-dept-btn" onClick={() => { setActiveDept(null); setSearch(''); setSearchInput(''); setCategory('All') }}>
              ← Back
            </button>
            <h2 style={{ margin: 0 }}>
              {currentDept?.icon} {currentDept?.label}
            </h2>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit">Search</button>
            {search && <button type="button" onClick={handleClear}>Clear</button>}
          </form>
        </div>

        {/* Category filter tabs */}
        {!search && (
          <div className="category-tabs" style={{ marginBottom: '1.25rem' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`cat-tab ${category === c ? 'active' : ''}`}
                onClick={() => { setCategory(c); setPage(1) }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Books Grid */}
        {loading ? (
          <div className="books-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : books.length === 0 ? (
          <div className="empty-state">
            <p>📭 No books found in {currentDept?.label}.</p>
            {user && <Link to="/add-book" className="btn-primary">Add a book</Link>}
          </div>
        ) : (
          <div className="books-grid">
            {books.map((book) => (
              <div key={book.id} className="book-card">
                <div className="book-img-wrap" style={{ cursor: 'pointer' }} onClick={() => navigate(`/books/${book.id}`)}>
                  {book.image
                    ? <img src={IMG_BASE + book.image} alt={book.title} className="book-img" />
                    : <div className="book-img-placeholder">📖</div>
                  }
                  <span className="book-category">{book.category}</span>
                </div>
                <div className="book-body">
                  <h3 style={{ cursor: 'pointer' }} onClick={() => navigate(`/books/${book.id}`)}>{book.title}</h3>
                  <p className="author">by {book.author}</p>
                  <p className="condition">Condition: <span>{book.condition}</span></p>
                  <p className="description">{book.description}</p>
                  {book.user && <p className="owner">📌 {book.user.name}</p>}

                  <div className="book-actions">
                    {user.id !== book.user_id && (
                      <Link to={`/exchange/send/${book.id}`} className="exchange-btn">
                        🔄 Request Exchange
                      </Link>
                    )}
                    {(user.id === book.user_id || user.role === 'admin') && (
                      <Link to={`/edit-book/${book.id}`} className="edit-btn">Edit</Link>
                    )}
                    {user.role === 'admin' && (
                      <button onClick={() => handleDelete(book.id)} className="delete-btn">Delete</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
            <span>Page {meta.current_page} of {meta.last_page}</span>
            <button disabled={page === meta.last_page} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
        )}

      </div>
    </div>
  )
}
