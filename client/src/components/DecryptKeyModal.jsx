import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { decryptSecretKeyWithPassword } from '../services/encryption.js'
import './DecryptKeyModal.css'

/**
 * Modal that prompts the user for their password to decrypt the
 * secret key of the active community. Appears automatically when
 * the user switches communities (or on page refresh) and no
 * cached key exists for that community in sessionStorage.
 */
function DecryptKeyModal() {
  const { activeMembership, storeSecretKey, needsKeyDecryption, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [decrypting, setDecrypting] = useState(false)

  // Track whether the component is still mounted so the async decryption
  // handler can bail out if the user logs out (or navigates away) while
  // PBKDF2 derivation is in progress. Without this, storeSecretKey()
  // could write a key back to sessionStorage after logout cleared it.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Reset local state when the target community changes so stale
  // error messages / passwords from a previous community don't persist.
  useEffect(() => {
    setPassword('')
    setError('')
    setDecrypting(false)
  }, [activeMembership?.communityId])

  if (!needsKeyDecryption || !activeMembership?.encryptionData) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setDecrypting(true)

    try {
      const { encryptedSecretKey, secretKeyNonce, secretKeySalt } = activeMembership.encryptionData

      const secretKey = await decryptSecretKeyWithPassword(
        encryptedSecretKey, secretKeyNonce, secretKeySalt, password
      )

      // If the user logged out while decryption was running, don't
      // write the key back — sessionStorage was already cleared.
      if (!mountedRef.current) return

      if (!secretKey) {
        setError('Incorrect password. Could not decrypt your encryption keys.')
        setDecrypting(false)
        return
      }

      storeSecretKey(secretKey, activeMembership.communityId)
      setPassword('')
      setError('')
    } catch {
      if (!mountedRef.current) return
      setError('Decryption failed. Please try again.')
    } finally {
      if (mountedRef.current) {
        setDecrypting(false)
      }
    }
  }

  return (
    <div className="decrypt-modal-overlay">
      <div className="decrypt-modal">
        <div className="decrypt-modal-header">
          <span className="decrypt-modal-icon">&#x1f511;</span>
          <h2>Unlock Encryption Keys</h2>
          <p className="decrypt-modal-subtitle">
            Enter your password to decrypt the private key for
            <strong> {activeMembership.communityName}</strong>
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="decrypt-password">Password</label>
            <input
              id="decrypt-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="Your account password"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={decrypting || !password}
          >
            {decrypting ? 'Decrypting...' : 'Unlock'}
          </button>
        </form>

        <p className="decrypt-modal-hint">
          Your password is used locally to decrypt your private key.
          It is never sent to the server.
        </p>

        <button
          type="button"
          className="btn btn-secondary auth-submit"
          style={{ marginTop: '0.75rem' }}
          onClick={logout}
        >
          Log Out
        </button>
      </div>
    </div>
  )
}

export default DecryptKeyModal
