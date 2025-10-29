import { createContext, useContext, useEffect, useState } from 'react'
import api from '../utils/api'

const AuthCtx = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!token)

  useEffect(() => {
    if (!token) return
    api.get('/auth/me').then(({ data }) => setUser(data)).catch(() => setToken(null)).finally(() => setLoading(false))
  }, [token])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ token, user, setUser, login, register, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
