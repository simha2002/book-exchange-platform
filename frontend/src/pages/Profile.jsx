import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'
import useTitle from '../hooks/useTitle'

const IMG_BASE = 'http://localhost:8000/storage/'

export default function Profile() {
  useTitle('Profile')
  const { user, updateUser } = useAuth()
  const { toast, showToast, hideToast } = useToast()

  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', bio: '' })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  // Password change state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwErrors, setPwErrors] = useState({})

  useEffect(() => {
    api.get('/profile')
      .then((res) => {
        const u = res.data.user
        setProfile(u)
        setForm({ name: u.name || '', phone: u.phone || '', bio: u.bio || '' })
      })
      .catch(() => showToast('Failed to load profile', 'error'))
      .finally(() => setFetching(false))
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleAvatar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB', 'error'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    const input = document.getElementById('avatar-input')
    if (input) input.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { showToast('Name is required', 'error'); return }
    setLoading(true)
    try {
      const data = new FormData()
      data.append('name', form.name)
      data.append('phone', form.phone)
      data.append('bio', form.bio)
      if (avatarFile) data.append('avatar', avatarFile)

      const res = await api.post('/profile/update', data)
      const updated = res.data.user

      // Update Navbar instantly
      updateUser({ name: updated.name, avatar: updated.avatar })
      setProfile(updated)
      showToast('Profile updated successfully!')
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!pwForm.current_password) errors.current_password = 'Required'
    if (!pwForm.new_password || pwForm.new_password.length < 5) errors.new_password = 'Min 5 characters'
    if (pwForm.new_password !== pwForm.confirm_password) errors.confirm_password = 'Passwords do not match'
    if (Object.keys(errors).length) { setPwErrors(errors); return }

    setPwLoading(true)
    setPwErrors({})
    try {
      await api.post('/profile/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      })
      showToast('Password changed successfully!')
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error')
    } finally {
      setPwLoading(false)
    }
  }

  const avatarSrc = avatarPreview || (profile?.avatar ? IMG_BASE + profile.avatar : null)

  if (fetching) return <div className="page"><Navbar /><p className="loading">Loading...</p></div>

  return (
    <div className="page">
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="content">
        <div style={{ marginBottom: '1rem' }}>
          <button className="back-dept-btn" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/books')}>← Back</button>
        </div>
        <div className="profile-layout">

          {/* ── Left: Avatar + Info ── */}
          <div className="profile-avatar-section">
            <div className="avatar-large">
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" />
                : <span>{profile?.name?.charAt(0).toUpperCase()}</span>
              }
            </div>
            <h3>{profile?.name}</h3>
            <p className="profile-email">{profile?.email}</p>
            <span className="badge">{profile?.role}</span>
            <p className="profile-books-count">{profile?.books_count ?? 0} books listed</p>
            {profile?.roll_number && <p className="profile-roll">🎓 {profile.roll_number}</p>}
            {profile?.department  && <p className="profile-dept">🏢 {profile.department} Dept</p>}
            {profile?.phone && <p className="profile-phone">📞 {profile.phone}</p>}
            {profile?.bio && <p className="profile-bio">"{profile.bio}"</p>}
          </div>

          {/* ── Right: Edit Forms ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Profile Edit */}
            <div className="form-card profile-form-card">
              <h2>✏️ Edit Profile</h2>
              <form onSubmit={handleSubmit}>

                <div className="form-group">
                  <label>Profile Photo</label>
                  {avatarPreview ? (
                    <div className="img-preview-wrap">
                      <img src={avatarPreview} alt="preview" className="img-preview" />
                      <button type="button" className="remove-img-btn" onClick={removeAvatar}>✕ Remove</button>
                    </div>
                  ) : (
                    <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatar} />
                  )}
                </div>

                <div className="form-group">
                  <label>Full Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                    placeholder="Tell something about yourself..." maxLength={500} />
                  <small>{form.bio.length}/500</small>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>

            {/* Password Change */}
            <div className="form-card profile-form-card">
              <h2>🔒 Change Password</h2>
              <form onSubmit={handlePasswordChange}>

                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={pwForm.current_password}
                    onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                    placeholder="Enter current password"
                  />
                  {pwErrors.current_password && <span className="field-error">{pwErrors.current_password}</span>}
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={pwForm.new_password}
                    onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                    placeholder="Min 5 characters"
                  />
                  {pwErrors.new_password && <span className="field-error">{pwErrors.new_password}</span>}
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={pwForm.confirm_password}
                    onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                    placeholder="Re-enter new password"
                  />
                  {pwErrors.confirm_password && <span className="field-error">{pwErrors.confirm_password}</span>}
                </div>

                <button type="submit" className="btn-primary" disabled={pwLoading}>
                  {pwLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
