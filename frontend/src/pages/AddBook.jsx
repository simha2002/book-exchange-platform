import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import BackButton from '../components/BackButton'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'
import useTitle from '../hooks/useTitle'

const CATEGORIES = ['Pass Papers', 'Notes']
const CONDITIONS  = ['New', 'Excellent', 'Good', 'Fair']
const DEPARTMENTS = ['ALL', 'IT', 'ENGLISH', 'ACCOUNTS']

export default function AddBook() {
  useTitle('Add Book')
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()

  const [form, setForm] = useState({ title: '', author: '', description: '', condition: '', category: 'Pass Papers', book_department: 'ALL' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB', 'error'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    // Reset file input
    const input = document.getElementById('book-image-input')
    if (input) input.value = ''
  }

  const handleGenerate = async () => {
    if (!form.title.trim()) { showToast('Enter a title first', 'error'); return }
    setGenerating(true)
    try {
      const res = await api.post('/generate-description', { title: form.title })
      setForm((f) => ({ ...f, description: res.data.description }))
    } catch {
      showToast('Generation failed', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.author.trim()) e.author = 'Author is required'
    if (!form.condition) e.condition = 'Select a condition'
    if (!form.description.trim()) e.description = 'Description is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      if (imageFile) data.append('image', imageFile)
      await api.post('/add-book', data)
      showToast('Book added successfully!')
      // Go to browse page with the selected department
      setTimeout(() => navigate('/books', { state: { dept: form.book_department } }), 1200)
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) setErrors(errs)
      else showToast(err.response?.data?.message || 'Failed to add book', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="content">
        <div style={{ marginBottom: '1rem' }}>
          <BackButton />
        </div>
        <div className="form-card">
          <h2>📖 Add New Book</h2>
          <form onSubmit={handleSubmit} encType="multipart/form-data">

            <div className="form-group">
              <label>Book Title *</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="Enter book title" />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label>Author *</label>
              <input name="author" value={form.author} onChange={handleChange} placeholder="Enter author name" />
              {errors.author && <span className="field-error">{errors.author}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Condition *</label>
                <select name="condition" value={form.condition} onChange={handleChange}>
                  <option value="">Select condition</option>
                  {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
                {errors.condition && <span className="field-error">{errors.condition}</span>}
              </div>

              <div className="form-group">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Department</label>
                <select name="book_department" value={form.book_department} onChange={handleChange}>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Book Cover Image</label>
              {imagePreview ? (
                <div className="img-preview-wrap">
                  <img src={imagePreview} alt="preview" className="img-preview" />
                  <button type="button" className="remove-img-btn" onClick={removeImage}>
                    ✕ Remove Image
                  </button>
                </div>
              ) : (
                <input
                  id="book-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                />
              )}
            </div>

            <div className="form-group">
              <div className="desc-header">
                <label>Description *</label>
                <button type="button" onClick={handleGenerate} disabled={generating} className="generate-btn">
                  {generating ? '⏳ Generating...' : '✨ Auto Generate'}
                </button>
              </div>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Enter description or auto generate" />
              {errors.description && <span className="field-error">{errors.description}</span>}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Book'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
