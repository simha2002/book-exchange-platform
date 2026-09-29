import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [checking, setChecking] = useState(false) // Don't wait for backend on startup

  // On app start — verify token silently in background
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return // No token = already showing landing page

    // Verify in background — don't block UI
    const timeout = setTimeout(() => {
      // If backend takes too long, clear token
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }, 5000)

    api.get('/me')
      .then((res) => {
        clearTimeout(timeout)
        const u = res.data.user
        localStorage.setItem('user', JSON.stringify(u))
        setUser(u)
      })
      .catch(() => {
        clearTimeout(timeout)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      })
  }, [])

  const saveUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password })
    const { token, user } = res.data
    localStorage.setItem('token', token)
    saveUser(user)
    return user
  }

  const register = async (name, email, roll_number, password) => {
    const res = await api.post('/register', { name, email, roll_number, password })
    return { devOtp: res.data.dev_otp || null }
  }

  const logout = async () => {
    try { await api.post('/logout') } catch { }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = (updatedFields) => {
    const merged = { ...user, ...updatedFields }
    saveUser(merged)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
