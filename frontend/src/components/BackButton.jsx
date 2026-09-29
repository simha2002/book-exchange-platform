import { useNavigate } from 'react-router-dom'

export default function BackButton({ label = '← Back', fallback = '/books' }) {
  const navigate = useNavigate()

  const handleBack = () => {
    // If there's browser history, go back. Otherwise go to fallback
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(fallback)
    }
  }

  return (
    <button className="back-dept-btn" onClick={handleBack}>
      {label}
    </button>
  )
}
