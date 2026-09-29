import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'
import useTitle from '../hooks/useTitle'

const STATUS_COLOR = { pending: '#f39c12', accepted: '#27ae60', rejected: '#e74c3c', completed: '#3498db' }

function StarDisplay({ rating }) {
  return (
    <span>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= rating ? '#f39c12' : '#ddd' }}>★</span>
      ))}
    </span>
  )
}

export default function AdminDashboard() {
  useTitle('Admin Dashboard')
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const { toast, showToast, hideToast } = useToast()

  const [tab,          setTab]          = useState('overview')
  const [stats,        setStats]        = useState(null)
  const [users,        setUsers]        = useState([])
  const [allBooks,     setAllBooks]     = useState([])
  const [booksPage,    setBooksPage]    = useState(1)
  const [booksMeta,    setBooksMeta]    = useState(null)
  const [exchanges,    setExchanges]    = useState([])
  const [bookReviews,  setBookReviews]  = useState([])
  const [ownerReviews, setOwnerReviews] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [tabLoading,   setTabLoading]   = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/books'); return }
    Promise.all([api.get('/admin-dashboard'), api.get('/admin/users')])
      .then(([s, u]) => { setStats(s.data); setUsers(u.data.users) })
      .catch(() => showToast('Failed to load dashboard', 'error'))
      .finally(() => setLoading(false))
  }, [user, navigate])

  useEffect(() => {
    if (tab === 'books') {
      setTabLoading(true)
      api.get(`/books?page=${booksPage}`)
        .then(r => { setAllBooks(r.data.data); setBooksMeta(r.data) })
        .catch(() => showToast('Failed', 'error'))
        .finally(() => setTabLoading(false))
    }
    if (tab === 'exchanges' && exchanges.length === 0) {
      setTabLoading(true)
      api.get('/admin/exchanges')
        .then(r => setExchanges(r.data.exchanges))
        .catch(() => showToast('Failed', 'error'))
        .finally(() => setTabLoading(false))
    }
    if (tab === 'book-reviews' && bookReviews.length === 0) {
      setTabLoading(true)
      api.get('/admin/book-reviews')
        .then(r => setBookReviews(r.data.reviews))
        .catch(() => showToast('Failed', 'error'))
        .finally(() => setTabLoading(false))
    }
    if (tab === 'owner-reviews' && ownerReviews.length === 0) {
      setTabLoading(true)
      api.get('/admin/owner-reviews')
        .then(r => setOwnerReviews(r.data.grouped))
        .catch(() => showToast('Failed', 'error'))
        .finally(() => setTabLoading(false))
    }
  }, [tab, booksPage])

  const handleDeleteBook = async (id, fromOverview = false) => {
    if (!confirm('Delete this book?')) return
    try {
      await api.delete(`/books/${id}`)
      if (fromOverview) {
        setStats(s => ({ ...s, recentBooks: s.recentBooks.filter(b => b.id !== id), totalBooks: s.totalBooks - 1 }))
      } else {
        setAllBooks(allBooks.filter(b => b.id !== id))
        setStats(s => s ? { ...s, totalBooks: s.totalBooks - 1 } : s)
      }
      showToast('Book deleted')
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
  }

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role })
      setUsers(users.map(u => u.id === id ? { ...u, role } : u))
      showToast('Role updated to ' + role)
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers(users.filter(u => u.id !== id))
      showToast('User deleted')
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error') }
  }

  if (loading) return <div className="page"><Navbar /><p className="loading">Loading dashboard...</p></div>

  const TABS = [
    { key: 'overview',      label: 'Overview' },
    { key: 'books',         label: `All Books`, count: stats?.totalBooks },
    { key: 'users',         label: `Users`,     count: users.length },
    { key: 'exchanges',     label: 'Exchanges', count: exchanges.length || null },
    { key: 'book-reviews',  label: 'Book Reviews', count: bookReviews.length || null },
    { key: 'owner-reviews', label: 'Owner Reviews', count: ownerReviews.length || null },
  ]

  return (
    <div className="page">
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="content">
        <h2>🛠️ Admin Dashboard</h2>

        {/* Tabs */}
        <div className="tab-bar" style={{ flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} className={tab === t.key ? 'tab active' : 'tab'} onClick={() => setTab(t.key)}>
              {t.label}
              {t.count != null && <span className="badge-count">{t.count}</span>}
            </button>
          ))}
        </div>

        {tabLoading && <p className="loading">Loading...</p>}

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card clickable-stat" onClick={() => setTab('books')}>
                <h3>{stats.totalBooks}</h3><p>Total Books</p><small>Click to view →</small>
              </div>
              <div className="stat-card clickable-stat" onClick={() => setTab('users')}>
                <h3>{stats.totalUsers}</h3><p>Total Users</p><small>Click to view →</small>
              </div>
              <div className="stat-card clickable-stat" onClick={() => setTab('exchanges')}>
                <h3>{stats.totalAdmins}</h3><p>Admins</p><small>Click to view →</small>
              </div>
              <div className="stat-card clickable-stat" onClick={() => setTab('users')}>
                <h3>{stats.totalNormalUsers}</h3><p>Normal Users</p><small>Click to view →</small>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1rem' }}>
              <h3>Recent Books</h3>
              <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                onClick={() => setTab('books')}>View All →</button>
            </div>

            {stats.recentBooks?.length === 0 ? (
              <p className="empty-state">No books yet.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Title</th><th>Author</th><th>Condition</th><th>Category</th><th>Dept</th><th>Owner</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {stats.recentBooks?.map(book => (
                      <tr key={book.id}>
                        <td>{book.title}</td><td>{book.author}</td>
                        <td>{book.condition}</td><td>{book.category}</td>
                        <td>{book.book_department}</td><td>{book.user?.name}</td>
                        <td>
                          <Link to={`/edit-book/${book.id}`} className="edit-btn sm">Edit</Link>
                          <button onClick={() => handleDeleteBook(book.id, true)} className="delete-btn sm">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── ALL BOOKS ── */}
        {tab === 'books' && !tabLoading && (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Title</th><th>Author</th><th>Condition</th><th>Category</th><th>Dept</th><th>Owner</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {allBooks.map(book => (
                    <tr key={book.id}>
                      <td>{book.title}</td><td>{book.author}</td>
                      <td>{book.condition}</td><td>{book.category}</td>
                      <td>{book.book_department}</td><td>{book.user?.name}</td>
                      <td>
                        <Link to={`/edit-book/${book.id}`} className="edit-btn sm">Edit</Link>
                        <button onClick={() => handleDeleteBook(book.id)} className="delete-btn sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {booksMeta && booksMeta.last_page > 1 && (
              <div className="pagination">
                <button disabled={booksPage === 1} onClick={() => setBooksPage(booksPage - 1)}>← Prev</button>
                <span>Page {booksMeta.current_page} of {booksMeta.last_page}</span>
                <button disabled={booksPage === booksMeta.last_page} onClick={() => setBooksPage(booksPage + 1)}>Next →</button>
              </div>
            )}
          </>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Roll No</th><th>Dept</th><th>Role</th><th>Books</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td><td>{u.email}</td>
                    <td>{u.roll_number || '-'}</td><td>{u.department || '-'}</td>
                    <td>
                      <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                        className="role-select" disabled={u.id === user.id}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>{u.books_count}</td>
                    <td>
                      {u.id !== user.id && (
                        <button onClick={() => handleDeleteUser(u.id)} className="delete-btn sm">Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── EXCHANGES ── */}
        {tab === 'exchanges' && !tabLoading && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Requester</th><th>Owner</th><th>Wants Book</th><th>Offers Book</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {exchanges.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No exchange requests yet.</td></tr>
                ) : exchanges.map(ex => (
                  <tr key={ex.id}>
                    <td>{ex.requester?.name}<br /><small style={{ color: '#888' }}>{ex.requester?.roll_number}</small></td>
                    <td>{ex.owner?.name}<br /><small style={{ color: '#888' }}>{ex.owner?.roll_number}</small></td>
                    <td>{ex.book?.title}</td>
                    <td>{ex.offered_book?.title || '-'}</td>
                    <td>
                      <span style={{ background: STATUS_COLOR[ex.status] || '#888', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.78rem' }}>
                        {ex.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#888' }}>
                      {new Date(ex.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── BOOK REVIEWS ── */}
        {tab === 'book-reviews' && !tabLoading && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Book</th><th>Reviewer</th><th>Rating</th><th>Comment</th><th>Date</th></tr>
              </thead>
              <tbody>
                {bookReviews.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No book reviews yet.</td></tr>
                ) : bookReviews.map(r => (
                  <tr key={r.id}>
                    <td>{r.book?.title}<br /><small style={{ color: '#888' }}>{r.book?.author}</small></td>
                    <td>{r.reviewer?.name}<br /><small style={{ color: '#888' }}>{r.reviewer?.roll_number}</small></td>
                    <td><StarDisplay rating={r.rating} /> <small>({r.rating}/5)</small></td>
                    <td style={{ maxWidth: '200px', fontSize: '0.88rem' }}>{r.comment || '-'}</td>
                    <td style={{ fontSize: '0.82rem', color: '#888' }}>
                      {new Date(r.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── OWNER REVIEWS ── */}
        {tab === 'owner-reviews' && !tabLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {ownerReviews.length === 0 ? (
              <div className="empty-state"><p>No owner reviews yet.</p></div>
            ) : ownerReviews.map((group, i) => (
              <div key={i} className="review-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{group.user?.name}</h3>
                    <small style={{ color: '#888' }}>{group.user?.roll_number}</small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <StarDisplay rating={Math.round(group.avg)} />
                    <p style={{ fontSize: '0.82rem', color: '#888', margin: 0 }}>{group.avg} avg • {group.total} reviews</p>
                  </div>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Reviewer</th><th>Book</th><th>Rating</th><th>Comment</th></tr>
                    </thead>
                    <tbody>
                      {group.reviews.map(r => (
                        <tr key={r.id}>
                          <td>{r.reviewer?.name}</td>
                          <td>{r.book?.title}</td>
                          <td><StarDisplay rating={r.rating} /></td>
                          <td style={{ fontSize: '0.85rem' }}>{r.comment || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
