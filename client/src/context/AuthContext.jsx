import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [memberships, setMemberships] = useState([])
  const [activeMembership, setActiveMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  // Bumped when a secret key is stored/cleared to trigger re-renders
  // that depend on sessionStorage key presence (e.g. needsKeyDecryption).
  const [keyVersion, setKeyVersion] = useState(0)

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
   * Switch active community. The per-community secret key may already
   * be cached in sessionStorage — if not, the DecryptKeyModal will
   * prompt the user for their password.
   */
  const switchCommunity = (communityId) => {
    const membership = memberships.find(m => m.communityId === communityId)
    if (membership) {
      setActiveMembership(membership)
      localStorage.setItem('activeCommunityId', communityId)
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
    }
  }

  /**
   * Store the decrypted secret key for a specific community.
   * Keys are stored per-community so switching back doesn't re-prompt.
   * Only lives in sessionStorage — never sent to the server.
   */
  const storeSecretKey = (secretKey, communityId) => {
    const id = communityId || activeMembership?.communityId
    if (id) {
      sessionStorage.setItem(`secretKey_${id}`, secretKey)
      setKeyVersion(v => v + 1)
    }
  }

  /**
   * Get the decrypted secret key for the active community.
   * Returns null if the key hasn't been decrypted yet for this community.
   */
  const getSecretKey = () => {
    const id = activeMembership?.communityId
    if (!id) return null
    return sessionStorage.getItem(`secretKey_${id}`)
  }

  /**
   * Whether the active community's secret key needs decryption.
   * True when authenticated with an active membership that has
   * encryptionData but no cached key. Memberships without
   * encryptionData (shouldn't happen, but defensive) are skipped
   * so the modal doesn't trap the user.
   * Re-evaluated on every render; keyVersion state changes force re-renders
   * after storeSecretKey() writes to sessionStorage.
   */
  const needsKeyDecryption = !!token && !!user && !!activeMembership
    && !!activeMembership.encryptionData && !getSecretKey()

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    memberships,
    activeMembership,
    needsKeyDecryption,
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
