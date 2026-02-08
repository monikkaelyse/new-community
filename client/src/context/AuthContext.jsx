import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [memberships, setMemberships] = useState([])
  const [activeMembership, setActiveMembership] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user + memberships from token on mount
  const loadUser = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
      setMemberships(data.memberships)

      // Restore active membership from localStorage or default to first
      const savedCommunityId = localStorage.getItem('activeCommunityId')
      const saved = data.memberships.find(m => m.communityId === savedCommunityId)
      setActiveMembership(saved || data.memberships[0] || null)
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('activeCommunityId')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = (userData, jwtToken, membershipList) => {
    setUser(userData)
    setToken(jwtToken)
    setMemberships(membershipList)
    localStorage.setItem('token', jwtToken)

    // Auto-select first membership
    if (membershipList.length > 0) {
      setActiveMembership(membershipList[0])
      localStorage.setItem('activeCommunityId', membershipList[0].communityId)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setMemberships([])
    setActiveMembership(null)
    localStorage.removeItem('token')
    localStorage.removeItem('activeCommunityId')
    sessionStorage.clear()
  }

  /**
   * Switch active community. Clears the cached secret key so user
   * must decrypt the new community's key.
   */
  const switchCommunity = (communityId) => {
    const membership = memberships.find(m => m.communityId === communityId)
    if (membership) {
      setActiveMembership(membership)
      localStorage.setItem('activeCommunityId', communityId)
      // Clear secret key — new community needs its own decrypted key
      sessionStorage.removeItem('secretKey')
    }
  }

  const updateMemberships = (newMemberships) => {
    setMemberships(newMemberships)
  }

  /**
   * Atomically update memberships and switch to a specific community.
   * Avoids the stale-state issue when calling updateMemberships + switchCommunity separately.
   */
  const joinAndSwitchCommunity = (newMemberships, communityId) => {
    setMemberships(newMemberships)
    const membership = newMemberships.find(m => m.communityId === communityId)
    if (membership) {
      setActiveMembership(membership)
      localStorage.setItem('activeCommunityId', communityId)
      sessionStorage.removeItem('secretKey')
    }
  }

  /**
   * Store the decrypted secret key for the active community.
   * Only lives in sessionStorage — never sent to the server.
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
    memberships,
    activeMembership,
    login,
    logout,
    switchCommunity,
    updateMemberships,
    joinAndSwitchCommunity,
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
