import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/axios'
import useTitle from '../hooks/useTitle'

export default function VerifyOtp() {
  useTitle('Verify Email')
  const navigate = useNavigate()
  const location = useLocation()
  const email  = location.state?.email  || ''
  const devOtp = location.state?.devOtp || null // shown only if mail failed

  const [otp,       setOtp]       = useState(['', '', '', '', ''])
  const [shownOtp,  setShownOtp]  = useState(devOtp)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const inputs = useRef([])

  useEffect(() => { if (!email) navigate('/') }, [email, navigate])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    setError('')
    if (value && index < 4) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5)
    if (pasted.length === 5) {
      setOtp(pasted.split(''))
      inputs.current[4]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpStr = otp.join('')
    if (otpStr.length < 5) { setError('Please enter all 5 digits'); return }
    setLoading(true); setError('')
    try {
      await api.post('/verify-otp', { email, otp: otpStr })
      setSuccess('✅ Email verified! Redirecting to login...')
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Try again.')
      setOtp(['', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true); setError('')
    try {
      const res = await api.post('/resend-otp', { email })
      if (res.data.dev_otp) setShownOtp(res.data.dev_otp)
      setCountdown(60)
      setSuccess('New OTP sent to your email!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card otp-card">
        <h2>📚 BookXchange</h2>
        <h3>Verify Your Email</h3>

        <p className="otp-subtitle">
          We sent a 5-digit OTP to<br />
          <strong>{email}</strong>
        </p>

        {/* Show OTP on screen only if mail failed */}
        {shownOtp && (
          <div className="otp-dev-box">
            <p>📧 Your OTP (mail not configured)</p>
            <span className="otp-dev-code">{shownOtp}</span>
          </div>
        )}

        {error   && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}

        <form onSubmit={handleSubmit}>
          <div className="otp-boxes" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`otp-box ${digit ? 'filled' : ''}`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button type="submit" className="otp-verify-btn" disabled={loading}>
            {loading ? 'Verifying...' : '✅ Verify & Continue'}
          </button>
        </form>

        <div className="otp-resend">
          {countdown > 0 ? (
            <p>Resend OTP in <strong>{countdown}s</strong></p>
          ) : (
            <button onClick={handleResend} disabled={resending} className="resend-btn">
              {resending ? 'Sending...' : '🔄 Resend OTP'}
            </button>
          )}
        </div>

        <p className="otp-expire-note">OTP expires in 10 minutes</p>
      </div>
    </div>
  )
}
