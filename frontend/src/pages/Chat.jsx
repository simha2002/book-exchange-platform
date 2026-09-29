import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'
import useTitle from '../hooks/useTitle'
import useMeetingAlert, { requestNotificationPermission, scheduleMeetingAlert } from '../hooks/useMeetingAlert'

const IMG_BASE = 'http://localhost:8000/storage/'

const PLACES = ['Canteen', 'Library', 'Department Office', 'Classroom', 'Main Gate', 'Parking Area', 'Reading Room', 'Other']

function MeetingCard({ msg, isMine }) {
  return (
    <div className={`meeting-card ${isMine ? 'mine' : 'theirs'}`}>
      <p className="meeting-icon">📍 Meeting Proposed</p>
      <p className="meeting-place"><strong>{msg.meeting_place}</strong></p>
      <p className="meeting-time">
        🗓️ {new Date(msg.meeting_time).toLocaleString('en-IN', {
          weekday: 'short', day: 'numeric', month: 'short',
          year: 'numeric', hour: '2-digit', minute: '2-digit',
          timeZone: 'Asia/Kolkata'
        })}
      </p>
    </div>
  )
}

export default function Chat() {
  useTitle('Chat')
  const { exchangeId } = useParams()
  const { user }       = useAuth()
  const navigate       = useNavigate()
  const { toast, showToast, hideToast } = useToast()

  const [messages,  setMessages]  = useState([])
  const [exchange,  setExchange]  = useState(null)
  const [newMsg,    setNewMsg]    = useState('')
  const [loading,   setLoading]   = useState(true)
  const [sending,   setSending]   = useState(false)
  const [showMeeting, setShowMeeting] = useState(false)
  const [meetingPlace, setMeetingPlace] = useState('')
  const [customPlace,  setCustomPlace]  = useState('')
  const [meetingTime,  setMeetingTime]  = useState('')
  const [showReview,   setShowReview]   = useState(false)
  const [rating,       setRating]       = useState(0)
  const [reviewText,   setReviewText]   = useState('')
  const [reviewed,     setReviewed]     = useState(false)
  useMeetingAlert(messages)
  const bottomRef = useRef(null)
  const pollRef   = useRef(null)

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/${exchangeId}`)
      setMessages(res.data.messages)
      setExchange(res.data.exchange)
    } catch (err) {
      if (err.response?.status === 403) navigate('/exchange')
      else if (!loading) showToast('Connection lost', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) { navigate('/'); return }
    fetchMessages()
    pollRef.current = setInterval(fetchMessages, 3000)
    return () => clearInterval(pollRef.current)
  }, [exchangeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMsg.trim()) return
    setSending(true)
    try {
      const res = await api.post(`/chat/${exchangeId}/send`, { message: newMsg.trim() })
      setMessages(prev => [...prev, res.data.message])
      setNewMsg('')
    } catch {
      showToast('Failed to send', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleSendMeeting = async () => {
    const place = meetingPlace === 'Other' ? customPlace : meetingPlace
    if (!place) { showToast('Please select a place', 'error'); return }
    if (!meetingTime) { showToast('Please select date & time', 'error'); return }

    setSending(true)
    try {
      const res = await api.post(`/chat/${exchangeId}/meeting`, {
        meeting_place: place,
        meeting_time:  meetingTime,
      })
      setMessages(prev => [...prev, res.data.message])
      // Schedule alert for this meeting
      scheduleMeetingAlert('Meeting', place, meetingTime)
      setShowMeeting(false)
      setMeetingPlace(''); setCustomPlace(''); setMeetingTime('')
      showToast('Meeting proposed!')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleReview = async () => {
    if (!rating) { showToast('Please select a rating', 'error'); return }
    const bookId = exchange?.requester_id === user?.id
      ? exchange?.offered_book?.id
      : exchange?.book?.id

    try {
      await api.post('/reviews', {
        exchange_request_id: parseInt(exchangeId),
        book_id: bookId,
        rating,
        comment: reviewText,
      })
      setReviewed(true)
      setShowReview(false)
      showToast('Review submitted! ⭐')
    } catch (err) {
      showToast(err.response?.data?.message || 'Review failed', 'error')
    }
  }

  const otherUser = exchange
    ? (exchange.requester_id === user?.id ? exchange.owner : exchange.requester)
    : null

  // Min datetime for meeting — now
  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16)

  if (loading) return <div className="page"><Navbar /><p className="loading">Loading chat...</p></div>

  return (
    <div className="page chat-page">
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="chat-container">

        {/* ── Header ── */}
        <div className="chat-header">
          <button className="chat-back" onClick={() => navigate('/exchange')}>← Back</button>
          <div className="chat-header-info">
            <div className="chat-avatar">
              {otherUser?.avatar
                ? <img src={IMG_BASE + otherUser.avatar} alt="" />
                : <span>{otherUser?.name?.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div>
              <h3>{otherUser?.name}</h3>
              <p className="chat-exchange-info">
                📖 {exchange?.book?.title} ⇄ {exchange?.offered_book?.title}
              </p>
            </div>
          </div>
          {!reviewed && (
            <button className="review-trigger-btn" onClick={() => setShowReview(true)}>
              ⭐ Review
            </button>
          )}
        </div>

        {/* ── Messages ── */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p>👋 Say hi! Discuss where and when to exchange your books.</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === user?.id
            if (msg.message_type === 'meeting') {
              return (
                <div key={msg.id} className={`chat-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
                  <MeetingCard msg={msg} isMine={isMine} />
                </div>
              )
            }
            return (
              <div key={msg.id} className={`chat-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
                {!isMine && (
                  <div className="chat-bubble-avatar">
                    {msg.sender?.avatar
                      ? <img src={IMG_BASE + msg.sender.avatar} alt="" />
                      : <span>{msg.sender?.name?.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                )}
                <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                  <p>{msg.message}</p>
                  <span className="chat-time">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMine && <span className="chat-read">{msg.is_read ? ' ✓✓' : ' ✓'}</span>}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* ── Meeting Picker ── */}
        {showMeeting && (
          <div className="meeting-picker">
            <div className="meeting-picker-header">
              <h4>📍 Propose Meeting Place</h4>
              <button onClick={() => setShowMeeting(false)} className="close-btn">✕</button>
            </div>
            <p className="meeting-picker-label">Select Place:</p>
            <div className="place-grid">
              {PLACES.map(p => (
                <button
                  key={p}
                  className={`place-btn ${meetingPlace === p ? 'selected' : ''}`}
                  onClick={() => setMeetingPlace(p)}
                >
                  {p === 'Canteen' && '🍽️ '}
                  {p === 'Library' && '📚 '}
                  {p === 'Department Office' && '🏢 '}
                  {p === 'Classroom' && '🏫 '}
                  {p === 'Main Gate' && '🚪 '}
                  {p === 'Parking Area' && '🚗 '}
                  {p === 'Reading Room' && '📖 '}
                  {p === 'Other' && '📌 '}
                  {p}
                </button>
              ))}
            </div>
            {meetingPlace === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom place..."
                value={customPlace}
                onChange={e => setCustomPlace(e.target.value)}
                className="custom-place-input"
              />
            )}
            <p className="meeting-picker-label" style={{ marginTop: '0.75rem' }}>Select Date & Time:</p>
            <input
              type="datetime-local"
              value={meetingTime}
              min={minDateTime}
              onChange={e => setMeetingTime(e.target.value)}
              className="meeting-datetime"
            />
            <button
              className="send-meeting-btn"
              onClick={handleSendMeeting}
              disabled={sending}
            >
              {sending ? 'Sending...' : '📨 Send Meeting Proposal'}
            </button>
          </div>
        )}

        {/* ── Review Modal ── */}
        {showReview && (
          <div className="review-overlay">
            <div className="review-modal">
              <div className="review-modal-header">
                <h4>⭐ Review {otherUser?.name}</h4>
                <button onClick={() => setShowReview(false)} className="close-btn">✕</button>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: '0.75rem' }}>
                How was the exchange experience?
              </p>
              <div className="star-rating">
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    className={`star-btn ${rating >= s ? 'filled' : ''}`}
                    onClick={() => setRating(s)}
                  >★</button>
                ))}
              </div>
              <textarea
                placeholder="Write a review (optional)..."
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                rows={3}
                maxLength={500}
                className="review-textarea"
              />
              <small style={{ color: '#aaa' }}>{reviewText.length}/500</small>
              <button className="submit-review-btn" onClick={handleReview}>
                Submit Review
              </button>
            </div>
          </div>
        )}

        {/* ── Input ── */}
        <form className="chat-input-wrap" onSubmit={handleSend}>
          <button
            type="button"
            className="meeting-trigger-btn"
            onClick={() => setShowMeeting(!showMeeting)}
            title="Propose meeting"
          >
            📍
          </button>
          <textarea
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
            placeholder="Type a message... (Enter to send)"
            rows={1}
            maxLength={1000}
            className="chat-input"
          />
          <button type="submit" disabled={sending || !newMsg.trim()} className="chat-send-btn">
            {sending ? '...' : '➤'}
          </button>
        </form>

      </div>
    </div>
  )
}
