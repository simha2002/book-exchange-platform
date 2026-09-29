import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useTitle from '../hooks/useTitle'

export default function Landing() {
  useTitle('Welcome')

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [active, setActive] = useState(null)

  // Separate form states
  const [regForm, setRegForm] = useState({ name: '', email: '', roll_number: '', password: '' })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [adminPass, setAdminPass] = useState('')

  // Separate loading + error per panel
  const [regLoading,   setRegLoading]   = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)

  const [regError,   setRegError]   = useState('')
  const [loginError, setLoginError] = useState('')
  const [adminError, setAdminError] = useState('')
  const [regSuccess, setRegSuccess] = useState('')

  const openPanel = (panel) => {
    setActive(active === panel ? null : panel)
    // clear errors when switching
    setRegError(''); setLoginError(''); setAdminError(''); setRegSuccess('')
  }

  // ── Register ──
  const handleRegister = async (e) => {
    e.preventDefault()
    setRegError(''); setRegSuccess('')

    if (!regForm.name.trim())        { setRegError('Name is required'); return }
    if (/\d/.test(regForm.name))     { setRegError('Name must not contain numbers'); return }
    if (!regForm.email.trim())       { setRegError('Email is required'); return }
    if (!regForm.roll_number.trim()) { setRegError('Roll number is required'); return }
    if (regForm.password.length < 5) { setRegError('Password must be at least 5 characters'); return }

    setRegLoading(true)
    try {
      const result = await register(regForm.name, regForm.email, regForm.roll_number, regForm.password)
      navigate('/verify-otp', {
        state: { email: regForm.email, devOtp: result?.devOtp }
      })
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) setRegError(Object.values(errors).flat().join(', '))
      else setRegError(err.response?.data?.message || `Error ${err.response?.status || ''}: Registration failed`)
    } finally {
      setRegLoading(false)
    }
  }

  // ── User Login ──
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const user = await login(loginForm.email, loginForm.password)
      navigate(user.role === 'admin' ? '/admin' : '/books')
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoginLoading(false)
    }
  }

  // ── Admin Login ──
  const handleAdmin = async (e) => {
    e.preventDefault()
    setAdminError('')
    setAdminLoading(true)
    try {
      const user = await login('admin@gmail.com', adminPass)
      if (user.role !== 'admin') {
        setAdminError('This account does not have admin access')
        return
      }
      navigate('/admin')
    } catch (err) {
      setAdminError(err.response?.data?.message || 'Invalid admin password')
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <div className="landing-page">

      {/* ── Hero ── */}
      <div className="landing-hero">
        <h1>📚 BookXchange</h1>
        <p>Exchange books with people around you.<br />Find your next read, share what you've finished.</p>
      </div>

      {/* ── Main: Photo + Panels side by side ── */}
      <div className="landing-main">

        {/* Left — College Photo */}
        <div className="landing-photo-wrap">
          <img src="/collage.jpg" alt="TRI College" className="landing-college-photo" />
        </div>

        {/* Right — 3 Panels */}
        <div className="landing-panels">

        {/* ── Panel 1: New User ── */}
        <div className={`landing-card ${active === 'new' ? 'expanded' : ''}`}>
          <div className="landing-card-header" onClick={() => openPanel('new')}>
            <span className="panel-icon">🆕</span>
            <div>
              <h3>New User</h3>
              <p>Create a free account</p>
            </div>
            <span className="panel-arrow">{active === 'new' ? '▲' : '▼'}</span>
          </div>

          {active === 'new' && (
            <form className="landing-form" onSubmit={handleRegister}>
              {regError   && <p className="landing-error">{regError}</p>}
              {regSuccess && <p className="landing-success">{regSuccess}</p>}

              <input
                type="text"
                placeholder="Full Name"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Roll Number (e.g. IT/IT/2324/F/001)"
                value={regForm.roll_number}
                onChange={(e) => setRegForm({ ...regForm, roll_number: e.target.value.toUpperCase() })}
                required
              />
              <p className="roll-hint">Format: DEPT/BRANCH/YEAR/SECTION/NUMBER</p>
              <input
                type="password"
                placeholder="Password (min 5 characters)"
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                required
                minLength={5}
              />
              <button type="submit" className="landing-btn green" disabled={regLoading}>
                {regLoading ? 'Creating account...' : '✅ Create Account'}
              </button>
            </form>
          )}
        </div>

        {/* ── Panel 2: Existing User ── */}
        <div className={`landing-card ${active === 'user' ? 'expanded' : ''}`}>
          <div className="landing-card-header" onClick={() => openPanel('user')}>
            <span className="panel-icon">👤</span>
            <div>
              <h3>Existing User</h3>
              <p>Login to your account</p>
            </div>
            <span className="panel-arrow">{active === 'user' ? '▲' : '▼'}</span>
          </div>

          {active === 'user' && (
            <form className="landing-form" onSubmit={handleLogin}>
              {loginError && <p className="landing-error">{loginError}</p>}
              {/* Show this when coming from register */}
              {loginForm.email && !loginError && (
                <p className="landing-success">
                  ✅ Account created! Enter your password to login.
                </p>
              )}
              <input
                type="email"
                placeholder="Email Address"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                autoFocus
              />
              <button type="submit" className="landing-btn blue" disabled={loginLoading}>
                {loginLoading ? 'Logging in...' : '🚀 Login & Continue'}
              </button>
            </form>
          )}
        </div>

        {/* ── Panel 3: Admin ── */}
        <div className={`landing-card ${active === 'admin' ? 'expanded' : ''}`}>
          <div className="landing-card-header" onClick={() => openPanel('admin')}>
            <span className="panel-icon">🛠️</span>
            <div>
              <h3>Admin</h3>
              <p>Access admin dashboard</p>
            </div>
            <span className="panel-arrow">{active === 'admin' ? '▲' : '▼'}</span>
          </div>

          {active === 'admin' && (
            <form className="landing-form" onSubmit={handleAdmin}>
              {adminError && <p className="landing-error">{adminError}</p>}

              <div className="admin-email-hint">
                <span>🔑 Logging in as: admin@gmail.com</span>
              </div>
              <input
                type="password"
                placeholder="Admin Password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                required
              />
              <button type="submit" className="landing-btn dark" disabled={adminLoading}>
                {adminLoading ? 'Verifying...' : '🔐 Enter Admin Panel'}
              </button>
            </form>
          )}
        </div>

      </div> {/* end landing-panels */}
      </div> {/* end landing-main */}

      {/* ── Footer ── */}
      <div className="landing-footer">
        <p>📖 Join thousands of readers exchanging books every day</p>
      </div>

    </div>
  )
}
