import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { generateKeypair, encryptSecretKeyWithPassword } from '../services/encryption.js'
import api from '../services/api.js'
import './AuthPages.css'

function RegisterPage() {
  const navigate = useNavigate()
  const { login, storeSecretKey } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    communityName: '',
    isNewCommunity: false,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setSubmitting(true)
    try {
      // 1. Generate per-community keypair locally
      const { publicKey, secretKey } = generateKeypair()

      // 2. Encrypt secret key with password
      const { encryptedSecretKey, nonce, salt } = await encryptSecretKeyWithPassword(
        secretKey, formData.password
      )

      // 3. Register — server never sees plaintext secret key
      const { data } = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        communityName: formData.communityName,
        isNewCommunity: formData.isNewCommunity,
        publicKey,
        encryptedSecretKey,
        secretKeyNonce: nonce,
        secretKeySalt: salt,
      })

      // 4. Store auth + decrypted secret key in session
      const firstMembership = data.memberships[0]
      login(data.user, data.token, data.memberships)
      if (firstMembership) {
        storeSecretKey(secretKey, firstMembership.communityId)
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Join a Community</h1>
          <p className="auth-subtitle">Your encryption keys are generated locally</p>
          <span className="encrypted-badge">Keys Never Leave Your Device</span>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
              minLength={3}
              maxLength={30}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Used to encrypt your private key"
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isNewCommunity"
                checked={formData.isNewCommunity}
                onChange={handleChange}
              />
              <span>I want to create a new community (admin)</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="communityName">
              {formData.isNewCommunity ? 'New Community Name' : 'Community to Join'}
            </label>
            <input
              id="communityName"
              name="communityName"
              type="text"
              value={formData.communityName}
              onChange={handleChange}
              placeholder={formData.isNewCommunity ? 'Name your community' : 'Enter community name'}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? 'Generating keys & registering...' : (formData.isNewCommunity ? 'Create Community & Register' : 'Join & Register')}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
