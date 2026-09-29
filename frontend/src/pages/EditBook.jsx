import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import BackButton from '../components/BackButton'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'

const CATEGORIES  = ['Pass Papers', 'Notes']
const CONDITIONS  = ['New', 'Excellent', 'Good', 'Fair']
const DEPARTMENTS = ['ALL', 'IT', 'ENGLISH', 'ACCOUNTS']
const IMG_BASE    = 'http://localhost:8000/storage/'

export default function EditBook() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { toast, showToast, hideToast } = useToast()

  const [form, setForm] = useState({
    title: '', author: '', description: '',
    condition: '', category: 'Pass Papers', book_department: 'ALL'
  })
  const [existingImage, setExistingImage] = useState(null)
  const [imageFile,     setImageFile]     = useState(null)
  const [imagePreview,  setImagePreview]  = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [fetching,      setFetching]      = useState(true)
  const [generating,    setGenerating]    = useState(false)

  useEffect(() => {
    api.get('/books').then((res) => {
      const book = res.data.data?.find((b) => b.id === parseInt(id))
      if (book) {
        setForm({
          title:           book.title,
          author:          book.author,
          description:     book.description,
          condition:       book.condition,
          category:        book.category        || 'Pass Papers',
          book_department: book.book_department || 'ALL',
        })
        setExistingImage(book.image)
      } else {
        showToast('Book not found', 'error')
      }
    }).catch(() => showToast('Failed to load book', 'error'))
      .finally(() => setFetching(false))
  }, [id])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleGenerate = async () => {
    if (!form.title.trim()) { showToast('Enter a title first', 'error'); return }
    setGenerating(true)
    try {
      const res = await api.post('/generate-description', { title: form.title })
      setForm(f => ({ ...f, description: res.data.description }))
      showToast('Description generated!')
    } catch {
      showToast('Generation failed', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    const input = document.getElementById('edit-image-input')
    if (input) input.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      if (imageFile) data.append('image', imageFile)
      await api.post(`/books/${id}/update`, data)
      showToast('Book updated!')
      setTimeout(() => navigate('/my-books'), 1200)
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error')
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
          <h2>✏️ Edit Book</h2>
          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Book Title</label>
              <input name="title" value={form.title} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Author</label>
              <input name="author" value={form.author} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Condition</label>
                <select name="condition" value={form.condition} onChange={handleChange}>
                  {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Department</label>
              <select name="book_department" value={form.book_department} onChange={handleChange}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d === 'ALL' ? 'All Departments' : d}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Book Cover Image</label>
              {imagePreview ? (
                <div className="img-preview-wrap">
                  <img src={imagePreview} alt="new preview" className="img-preview" />
                  <button type="button" className="remove-img-btn" onClick={removeImage}>
                    ✕ Remove Image
                  </button>
                </div>
              ) : existingImage ? (
                <div className="img-preview-wrap">
                  <img src={IMG_BASE + existingImage} alt="current" className="img-preview" />
                  <button type="button" className="remove-img-btn" onClick={() => setExistingImage(null)}>
                    ✕ Remove Image
                  </button>
                </div>
              ) : (
                <input id="edit-image-input" type="file" accept="image/*" onChange={handleImage} />
              )}
              {(imagePreview || existingImage) && (
                <label className="change-img-label">
                  <input
                    id="edit-image-input" type="file" accept="image/*"
                    onChange={handleImage} style={{ display: 'none' }}
                  />
                  🔄 Change Image
                </label>
              )}
            </div>

            <div className="form-group">
              <div className="desc-header">
                <label>Description</label>
                <button type="button" onClick={handleGenerate} disabled={generating} className="generate-btn">
                  {generating ? '⏳ Generating...' : '✨ Auto Generate'}
                </button>
              </div>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} required />
            </div>

            <div className="form-row-btns">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
