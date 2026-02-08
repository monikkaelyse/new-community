import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // Validate token and load user on mount / token change
  const loadUser = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)

      // Store encryption data in sessionStorage if not already there
      if (data.encryptionData && !sessionStorage.getItem('encryptionData')) {
        sessionStorage.setItem('encryptionData', JSON.stringify(data.encryptionData))
      }
    } catch {
      // Token is invalid — clear it
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = (userData, jwtToken, encryptionData) => {
    setUser(userData)
    setToken(jwtToken)
    localStorage.setItem('token', jwtToken)
    if (encryptionData) {
      sessionStorage.setItem('encryptionData', JSON.stringify(encryptionData))
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    sessionStorage.clear()
  }

  /**
   * Store the decrypted secret key in sessionStorage for the current session.
   * This key is used for E2E encryption/decryption of messages.
   * It only lives in memory/sessionStorage — never sent to the server.
   */
  const storeSecretKey = (secretKey) => {
    sessionStorage.setItem('secretKey', secretKey)
  }

  const getSecretKey = () => {
    return sessionStorage.getItem('secretKey')
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    storeSecretKey,
    getSecretKey,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
