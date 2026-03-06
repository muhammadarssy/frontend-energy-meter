import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../api/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('em_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('em_token') || null)

  const isAuthenticated = !!token && !!user

  const login = async (credentials) => {
    const res = await apiLogin(credentials.login, credentials.password)
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem('em_token', newToken)
    localStorage.setItem('em_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
    return res
  }

  const logout = () => {
    localStorage.removeItem('em_token')
    localStorage.removeItem('em_user')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
