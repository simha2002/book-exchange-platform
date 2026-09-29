import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOtp from './pages/VerifyOtp'
import Books from './pages/Books'
import AddBook from './pages/AddBook'
import EditBook from './pages/EditBook'
import MyBooks from './pages/MyBooks'
import Profile from './pages/Profile'
import Exchange from './pages/Exchange'
import SendExchange from './pages/SendExchange'
import Chat from './pages/Chat'
import BookDetails from './pages/BookDetails'
import AdminDashboard from './pages/AdminDashboard'
import './App.css'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/" replace />
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'admin') return <Navigate to="/books" replace />
  return children
}

function GuestRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/books" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"           element={<GuestRoute><Landing /></GuestRoute>} />
      <Route path="/login"      element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register"   element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/verify-otp" element={<VerifyOtp />} />

      <Route path="/books"      element={<PrivateRoute><Books /></PrivateRoute>} />
      <Route path="/books/:id"  element={<PrivateRoute><BookDetails /></PrivateRoute>} />
      <Route path="/add-book"   element={<PrivateRoute><AddBook /></PrivateRoute>} />
      <Route path="/edit-book/:id" element={<PrivateRoute><EditBook /></PrivateRoute>} />
      <Route path="/my-books"   element={<PrivateRoute><MyBooks /></PrivateRoute>} />
      <Route path="/profile"    element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/exchange"   element={<PrivateRoute><Exchange /></PrivateRoute>} />
      <Route path="/exchange/send/:bookId" element={<PrivateRoute><SendExchange /></PrivateRoute>} />
      <Route path="/chat/:exchangeId" element={<PrivateRoute><Chat /></PrivateRoute>} />

      <Route path="/admin"      element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="*"           element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
