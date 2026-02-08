import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { decryptSecretKeyWithPassword } from '../services/encryption.js'
import api from '../services/api.js'
import './AuthPages.css'

function LoginPage() {
  const navigate = useNavigate()
  const { login, storeSecretKey } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // 1. Authenticate
      const { data } = await api.post('/auth/login', { email, password })

      // 2. Decrypt the secret key for the first (or only) community
      const firstMembership = data.memberships[0]
      if (firstMembership) {
        const { encryptedSecretKey, secretKeyNonce, secretKeySalt } = firstMembership.encryptionData
        const secretKey = await decryptSecretKeyWithPassword(
          encryptedSecretKey, secretKeyNonce, secretKeySalt, password
        )

        if (!secretKey) {
          setError('Failed to decrypt your encryption keys.')
          setSubmitting(false)
          return
        }

        // 3. Store auth + secret key for the first community
        login(data.user, data.token, data.memberships)
        storeSecretKey(secretKey, firstMembership.communityId)
      } else {
        login(data.user, data.token, data.memberships)
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your encrypted community</p>
          <span className="encrypted-badge">End-to-End Encrypted</span>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="Your password decrypts your keys"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? 'Decrypting keys...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
