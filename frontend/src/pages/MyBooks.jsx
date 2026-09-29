import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import SkeletonCard from '../components/SkeletonCard'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'
import useTitle from '../hooks/useTitle'

const IMG_BASE = 'http://localhost:8000/storage/'

export default function MyBooks() {
  useTitle('My Books')
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()
  const [books, setBooks] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    setLoading(true)
    api.get(`/my-books?page=${page}`)
      .then((res) => { setBooks(res.data.data); setMeta(res.data) })
      .catch(() => showToast('Failed to load books', 'error'))
      .finally(() => setLoading(false))
  }, [user, page, navigate])

  const handleDelete = async (id) => {
    if (!confirm('Delete this book?')) return
    try {
      await api.delete(`/books/${id}`)
      setBooks(books.filter((b) => b.id !== id))
      showToast('Book deleted')
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error')
    }
  }

  return (
    <div className="page">
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="content">
        <div className="books-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="back-dept-btn" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/books')}>← Back</button>
            <h2 style={{ margin: 0 }}>My Books</h2>
          </div>
          <Link to="/add-book" className="btn-primary">+ Add Book</Link>
        </div>

        {loading ? (
          <div className="books-grid">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : books.length === 0 ? (
          <div className="empty-state">
            <p>📭 You haven't added any books yet.</p>
            <Link to="/add-book" className="btn-primary">Add your first book</Link>
          </div>
        ) : (
          <div className="books-grid">
            {books.map((book) => (
              <div key={book.id} className="book-card">
                <div className="book-img-wrap">
                  {book.image
                    ? <img src={IMG_BASE + book.image} alt={book.title} className="book-img" />
                    : <div className="book-img-placeholder">📖</div>
                  }
                  <span className="book-category">{book.category}</span>
                </div>
                <div className="book-body">
                  <h3>{book.title}</h3>
                  <p className="author">by {book.author}</p>
                  <p className="condition">Condition: <span>{book.condition}</span></p>
                  <p className="description">{book.description}</p>
                  <div className="book-actions">
                    <Link to={`/edit-book/${book.id}`} className="edit-btn">Edit</Link>
                    <button onClick={() => handleDelete(book.id)} className="delete-btn">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
