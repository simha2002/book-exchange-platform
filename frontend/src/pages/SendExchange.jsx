import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import BackButton from '../components/BackButton'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'
import useTitle from '../hooks/useTitle'

const IMG_BASE = 'http://localhost:8000/storage/'

export default function SendExchange() {
  useTitle('Request Exchange')

  const { bookId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()

  const [wantedBook, setWantedBook] = useState(null)
  const [myBooks, setMyBooks] = useState([])
  const [offeredBookId, setOfferedBookId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }

    // Load wanted book + my books in parallel
    Promise.all([
      api.get('/books'),
      api.get('/exchange/my-books'),
    ]).then(([booksRes, myBooksRes]) => {
      const found = booksRes.data.data?.find((b) => b.id === parseInt(bookId))
      if (found) setWantedBook(found)
      else showToast('Book not found', 'error')

      setMyBooks(myBooksRes.data.books || [])
    }).catch(() => showToast('Failed to load data', 'error'))
      .finally(() => setFetching(false))
  }, [bookId, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!offeredBookId) {
      showToast('Please select a book to offer in exchange', 'error')
      return
    }

    setLoading(true)
    try {
      await api.post('/exchange/send', {
        book_id:         parseInt(bookId),
        offered_book_id: parseInt(offeredBookId),
        message,
      })
      showToast('Exchange request sent!')
      setTimeout(() => navigate('/exchange'), 1200)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send request', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="page"><Navbar /><p className="loading">Loading...</p></div>

  return (
    <div className="page">
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="content">
        <div style={{ marginBottom: '1rem' }}>
          <BackButton />
        </div>
        <div className="form-card">
          <h2>🔄 Request Book Exchange</h2>

          {/* ── Book you WANT ── */}
          {wantedBook && (
            <div className="exchange-section">
              <p className="exchange-section-label">📖 Book you want:</p>
              <div className="exchange-book-preview">
                {wantedBook.image
                  ? <img src={IMG_BASE + wantedBook.image} alt={wantedBook.title} />
                  : <div className="book-img-placeholder large">📖</div>
                }
                <div>
                  <h3>{wantedBook.title}</h3>
                  <p>by {wantedBook.author}</p>
                  <p>Condition: <strong>{wantedBook.condition}</strong></p>
                  <p>Owner: <strong>{wantedBook.user?.name}</strong></p>
                </div>
              </div>
            </div>
          )}

          <div className="exchange-arrow">⇅ Exchange For</div>

          {/* ── Book you OFFER ── */}
          <div className="exchange-section">
            <p className="exchange-section-label">📚 Book you offer in return:</p>

            {myBooks.length === 0 ? (
              <div className="empty-state" style={{ padding: '1rem', textAlign: 'left' }}>
                <p>⚠️ You have no books to offer. Please add a book first.</p>
                <button className="btn-primary" style={{ marginTop: '0.5rem' }}
                  onClick={() => navigate('/add-book')}>
                  + Add a Book
                </button>
              </div>
            ) : (
              <div className="offer-books-grid">
                {myBooks.map((book) => (
                  <div
                    key={book.id}
                    className={`offer-book-card ${offeredBookId === String(book.id) ? 'selected' : ''}`}
                    onClick={() => setOfferedBookId(String(book.id))}
                  >
                    <div className="offer-book-img">
                      {book.image
                        ? <img src={IMG_BASE + book.image} alt={book.title} />
                        : <span>📖</span>
                      }
                    </div>
                    <div className="offer-book-info">
                      <p className="offer-book-title">{book.title}</p>
                      <p className="offer-book-author">by {book.author}</p>
                      <p className="offer-book-condition">{book.condition}</p>
                    </div>
                    {offeredBookId === String(book.id) && (
                      <div className="offer-selected-badge">✓ Selected</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Message + Submit ── */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Message to owner (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Hi! I'd love to exchange this book..."
                maxLength={500}
              />
              <small>{message.length}/500</small>
            </div>
            <div className="form-row-btns">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || myBooks.length === 0}
              >
                {loading ? 'Sending...' : '📨 Send Exchange Request'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
