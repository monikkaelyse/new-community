import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { generateKeypair, encryptSecretKeyWithPassword } from '../services/encryption.js'
import api from '../services/api.js'
import './AuthPages.css'

function JoinCommunityPage() {
  const navigate = useNavigate()
  const { joinAndSwitchCommunity, storeSecretKey } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [communityName, setCommunityName] = useState('')
  const [isNewCommunity, setIsNewCommunity] = useState(false)
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // 1. Generate a NEW keypair for this community
      const { publicKey, secretKey } = generateKeypair()

      // 2. Encrypt with password
      const { encryptedSecretKey, nonce, salt } = await encryptSecretKeyWithPassword(
        secretKey, password
      )

      // 3. Join community
      const { data } = await api.post('/auth/join-community', {
        communityName,
        isNewCommunity,
        publicKey,
        encryptedSecretKey,
        secretKeyNonce: nonce,
        secretKeySalt: salt,
      })

      // 4. Update memberships and switch to new community atomically
      const newMembership = data.memberships.find(m => m.communityName === communityName)
      if (newMembership) {
        joinAndSwitchCommunity(data.memberships, newMembership.communityId)
        storeSecretKey(secretKey)
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join community.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Join Another Community</h1>
          <p className="auth-subtitle">A new keypair will be generated for this community</p>
          <span className="encrypted-badge">Isolated Encryption Keys</span>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={isNewCommunity}
                onChange={(e) => setIsNewCommunity(e.target.checked)}
              />
              <span>I want to create a new community (admin)</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="join-community">
              {isNewCommunity ? 'New Community Name' : 'Community to Join'}
            </label>
            <input
              id="join-community"
              type="text"
              value={communityName}
              onChange={(e) => { setCommunityName(e.target.value); setError('') }}
              placeholder={isNewCommunity ? 'Name your community' : 'Enter community name'}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="join-password">Your Password</label>
            <input
              id="join-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="Needed to encrypt the new keypair"
              required
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
              Your password encrypts the new private key for this community.
            </p>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? 'Generating keys...' : (isNewCommunity ? 'Create & Join' : 'Join Community')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default JoinCommunityPage
