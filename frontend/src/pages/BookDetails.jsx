import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import BackButton from '../components/BackButton'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'
import useTitle from '../hooks/useTitle'

const IMG_BASE = 'http://localhost:8000/storage/'

function StarDisplay({ rating, size = '1rem' }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= rating ? '#f39c12' : '#ddd' }}>★</span>
      ))}
    </span>
  )
}

export default function BookDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()

  const [book,         setBook]         = useState(null)
  const [bookReviews,  setBookReviews]  = useState([])
  const [ownerReviews, setOwnerReviews] = useState([])
  const [ownerAvg,     setOwnerAvg]     = useState(0)
  const [bookAvg,      setBookAvg]      = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState('book')

  useTitle(book?.title || 'Book Details')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Get book from list
        const booksRes = await api.get('/books')
        const found = booksRes.data.data?.find(b => b.id === parseInt(id))
        if (!found) { showToast('Book not found', 'error'); navigate('/books'); return }
        setBook(found)

        // Book reviews
        const br = await api.get(`/reviews/book/${id}`)
        setBookReviews(br.data.reviews)
        setBookAvg(br.data.average)

        // Owner reviews
        const or = await api.get(`/reviews/user/${found.user_id}`)
        setOwnerReviews(or.data.reviews)
        setOwnerAvg(or.data.average)
      } catch {
        showToast('Failed to load details', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id])

  if (loading) return <div className="page"><Navbar /><p className="loading">Loading...</p></div>
  if (!book)   return null

  return (
    <div className="page">
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="content">
        <div style={{ marginBottom: '1rem' }}>
          <BackButton />
        </div>

        {/* ── Book Info ── */}
        <div className="book-detail-card">
          <div className="book-detail-img">
            {book.image
              ? <img src={IMG_BASE + book.image} alt={book.title} />
              : <div className="book-detail-placeholder">📖</div>
            }
          </div>

          <div className="book-detail-info">
            <span className="book-category-badge">{book.category}</span>
            <h1>{book.title}</h1>
            <p className="book-detail-author">by <strong>{book.author}</strong></p>

            <div className="book-detail-meta">
              <span className="condition-badge">{book.condition}</span>
              {bookAvg > 0 && (
                <span className="rating-inline">
                  <StarDisplay rating={Math.round(bookAvg)} />
                  <span>{bookAvg} ({bookReviews.length} reviews)</span>
                </span>
              )}
            </div>

            <p className="book-detail-description">{book.description}</p>

            {/* Owner info */}
            <div className="book-owner-card">
              <div className="owner-avatar">
                {book.user?.avatar
                  ? <img src={IMG_BASE + book.user.avatar} alt="" />
                  : <span>{book.user?.name?.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div>
                <p className="owner-name">📌 {book.user?.name}</p>
                {ownerAvg > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <StarDisplay rating={Math.round(ownerAvg)} size="0.9rem" />
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{ownerAvg} as exchanger</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="book-detail-actions">
              {user && user.id !== book.user_id && (
                <Link to={`/exchange/send/${book.id}`} className="btn-exchange-big">
                  🔄 Request Exchange
                </Link>
              )}
              {user && (user.id === book.user_id || user.role === 'admin') && (
                <Link to={`/edit-book/${book.id}`} className="btn-primary">Edit Book</Link>
              )}
              <button className="btn-secondary" onClick={() => navigate(-1)}>← Back</button>
            </div>
          </div>
        </div>

        {/* ── Reviews Tabs ── */}
        <div style={{ marginTop: '2rem' }}>
          <div className="tab-bar">
            <button className={activeTab === 'book' ? 'tab active' : 'tab'} onClick={() => setActiveTab('book')}>
              📖 Book Reviews
              {bookReviews.length > 0 && <span className="badge-count">{bookReviews.length}</span>}
            </button>
            <button className={activeTab === 'owner' ? 'tab active' : 'tab'} onClick={() => setActiveTab('owner')}>
              👤 Owner Reviews
              {ownerReviews.length > 0 && <span className="badge-count">{ownerReviews.length}</span>}
            </button>
          </div>

          {/* Book Reviews */}
          {activeTab === 'book' && (
            <div className="reviews-list">
              {bookReviews.length === 0 ? (
                <div className="empty-state"><p>No reviews for this book yet.</p></div>
              ) : (
                bookReviews.map(r => (
                  <div key={r.id} className="review-card">
                    <div className="review-header">
                      <div className="review-avatar">
                        {r.reviewer?.avatar
                          ? <img src={IMG_BASE + r.reviewer.avatar} alt="" />
                          : <span>{r.reviewer?.name?.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <p className="review-name">{r.reviewer?.name}</p>
                        <StarDisplay rating={r.rating} />
                      </div>
                      <p className="review-date">
                        {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {r.comment && <p className="review-comment">{r.comment}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Owner Reviews */}
          {activeTab === 'owner' && (
            <div className="reviews-list">
              {ownerReviews.length === 0 ? (
                <div className="empty-state"><p>No reviews for this owner yet.</p></div>
              ) : (
                ownerReviews.map(r => (
                  <div key={r.id} className="review-card">
                    <div className="review-header">
                      <div className="review-avatar">
                        {r.reviewer?.avatar
                          ? <img src={IMG_BASE + r.reviewer.avatar} alt="" />
                          : <span>{r.reviewer?.name?.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <p className="review-name">{r.reviewer?.name}</p>
                        <StarDisplay rating={r.rating} />
                        {r.book && <p style={{ fontSize: '0.78rem', color: '#aaa' }}>for: {r.book.title}</p>}
                      </div>
                      <p className="review-date">
                        {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {r.comment && <p className="review-comment">{r.comment}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
