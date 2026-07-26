import { createContext, useState, useContext, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => { token ? fetchMe() : setLoading(false) }, [token])

  const fetchMe = async () => {
    try { const res = await api.get('/users/me'); setUser(res.data) }
    catch { logout() } finally { setLoading(false) }
  }

  const login = async (username, password) => {
    const fd = new URLSearchParams()
    fd.append('username', username); fd.append('password', password)
    const res = await api.post('/auth/login', fd, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    localStorage.setItem('token', res.data.access_token)
    setToken(res.data.access_token)
    await fetchMe()
    return true
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null); setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
