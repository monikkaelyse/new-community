import { useState } from 'react'
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
  const { activeMembership, storeSecretKey, needsKeyDecryption } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [decrypting, setDecrypting] = useState(false)

  if (!needsKeyDecryption || !activeMembership) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setDecrypting(true)

    try {
      const { encryptedSecretKey, secretKeyNonce, secretKeySalt } = activeMembership.encryptionData

      const secretKey = await decryptSecretKeyWithPassword(
        encryptedSecretKey, secretKeyNonce, secretKeySalt, password
      )

      if (!secretKey) {
        setError('Incorrect password. Could not decrypt your encryption keys.')
        setDecrypting(false)
        return
      }

      storeSecretKey(secretKey, activeMembership.communityId)
      setPassword('')
      setError('')
    } catch {
      setError('Decryption failed. Please try again.')
    } finally {
      setDecrypting(false)
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
      </div>
    </div>
  )
}

export default DecryptKeyModal
