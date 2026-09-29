import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'
import useTitle from '../hooks/useTitle'

const IMG_BASE    = 'http://localhost:8000/storage/'
const STATUS_META = {
  pending:  { color: '#f39c12', label: 'Pending',  icon: '⏳' },
  accepted: { color: '#27ae60', label: 'Accepted', icon: '✅' },
  rejected: { color: '#e74c3c', label: 'Rejected', icon: '❌' },
}

function BookMiniCard({ book, label }) {
  if (!book) return null
  return (
    <div className="exchange-mini-book">
      <p className="mini-book-label">{label}</p>
      <div className="mini-book-inner">
        {book.image
          ? <img src={IMG_BASE + book.image} alt={book.title} />
          : <div className="mini-book-placeholder">📖</div>
        }
        <div>
          <p className="mini-book-title">{book.title}</p>
          <p className="mini-book-author">by {book.author}</p>
          <p className="mini-book-condition">{book.condition}</p>
        </div>
      </div>
    </div>
  )
}

export default function Exchange() {
  useTitle('Exchanges')

  const { user } = useAuth()
  const navigate  = useNavigate()
  const { toast, showToast, hideToast } = useToast()

  const [tab,      setTab]     = useState('received')
  const [received, setReceived] = useState([])
  const [sent,     setSent]     = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    Promise.all([api.get('/exchange/received'), api.get('/exchange/sent')])
      .then(([r, s]) => {
        setReceived(r.data.requests)
        setSent(s.data.requests)
      })
      .catch(() => showToast('Failed to load requests', 'error'))
      .finally(() => setLoading(false))
  }, [user, navigate])

  const handleRespond = async (id, status) => {
    try {
      await api.put(`/exchange/${id}/respond`, { status })
      setReceived(received.map((r) => r.id === id ? { ...r, status } : r))
      showToast(`Request ${status}!`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error')
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this exchange request?')) return
    try {
      await api.delete(`/exchange/${id}/cancel`)
      setSent(sent.filter((r) => r.id !== id))
      showToast('Request cancelled')
    } catch (err) {
      showToast(err.response?.data?.message || 'Cancel failed', 'error')
    }
  }

  const list = tab === 'received' ? received : sent

  return (
    <div className="page">
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="content">
        <div style={{ marginBottom: '1rem' }}>
          <button className="back-dept-btn" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/books')}>← Back</button>
        </div>
        <h2>🔄 Exchange Requests</h2>

        <div className="tab-bar">
          <button className={tab === 'received' ? 'tab active' : 'tab'} onClick={() => setTab('received')}>
            Received
            {received.filter(r => r.status === 'pending').length > 0 && (
              <span className="badge-count">{received.filter(r => r.status === 'pending').length}</span>
            )}
          </button>
          <button className={tab === 'sent' ? 'tab active' : 'tab'} onClick={() => setTab('sent')}>
            Sent
            {sent.filter(r => r.status === 'pending').length > 0 && (
              <span className="badge-count">{sent.filter(r => r.status === 'pending').length}</span>
            )}
          </button>
        </div>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <p>📭 No {tab} requests yet.</p>
          </div>
        ) : (
          <div className="exchange-list">
            {list.map((req) => {
              const sm = STATUS_META[req.status] || STATUS_META.pending
              return (
                <div key={req.id} className="exchange-card">

                  {/* ── Book Exchange Display ── */}
                  <div className="exchange-books-row">
                    <BookMiniCard
                      book={req.book}
                      label={tab === 'received' ? '📖 They want your book:' : '📖 Book you want:'}
                    />
                    <div className="exchange-swap-icon">⇄</div>
                    <BookMiniCard
                      book={req.offered_book}
                      label={tab === 'received' ? '📚 They offer:' : '📚 You offered:'}
                    />
                  </div>

                  {/* ── Meta ── */}
                  <div className="exchange-meta-row">
                    <div>
                      {tab === 'received'
                        ? <p>From: <strong>{req.requester?.name}</strong></p>
                        : <p>To: <strong>{req.owner?.name}</strong></p>
                      }
                      {req.message && (
                        <p className="exchange-msg">💬 "{req.message}"</p>
                      )}
                    </div>
                    <span className="status-badge" style={{ background: sm.color }}>
                      {sm.icon} {sm.label}
                    </span>
                  </div>

                  {/* ── Contact info when accepted ── */}
                  {req.status === 'accepted' && (
                    <div className="contact-info">
                      <p>✅ Exchange approved! Contact to arrange the swap:</p>
                      <div className="contact-details">
                        {tab === 'received' ? (
                          <>
                            <p>👤 <strong>{req.requester?.name}</strong></p>
                            {req.requester?.phone && <a href={`tel:${req.requester.phone}`}>📞 {req.requester.phone}</a>}
                            {req.requester?.email && <a href={`mailto:${req.requester.email}`}>✉️ {req.requester.email}</a>}
                            {!req.requester?.phone && !req.requester?.email && (
                              <p className="no-contact">No contact info added by requester</p>
                            )}
                          </>
                        ) : (
                          <>
                            <p>👤 <strong>{req.owner?.name}</strong></p>
                            {req.owner?.phone && <a href={`tel:${req.owner.phone}`}>📞 {req.owner.phone}</a>}
                            {req.owner?.email && <a href={`mailto:${req.owner.email}`}>✉️ {req.owner.email}</a>}
                            {!req.owner?.phone && !req.owner?.email && (
                              <p className="no-contact">No contact info added by owner</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Actions ── */}
                  <div className="exchange-actions">
                    {tab === 'received' && req.status === 'pending' && (
                      <>
                        <button onClick={() => handleRespond(req.id, 'accepted')} className="btn-accept">
                          ✅ Accept Exchange
                        </button>
                        <button onClick={() => handleRespond(req.id, 'rejected')} className="btn-reject">
                          ❌ Reject
                        </button>
                      </>
                    )}
                    {tab === 'sent' && req.status === 'pending' && (
                      <button onClick={() => handleCancel(req.id)} className="btn-cancel">
                        Cancel Request
                      </button>
                    )}
                    {req.status === 'accepted' && (
                      <Link to={`/chat/${req.id}`} className="btn-chat">
                        💬 Open Chat
                      </Link>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
