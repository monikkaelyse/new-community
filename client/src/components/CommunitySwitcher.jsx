import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './CommunitySwitcher.css'

function CommunitySwitcher() {
  const { memberships, activeMembership, switchCommunity } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  if (!activeMembership) return null

  const handleSwitch = (communityId) => {
    switchCommunity(communityId)
    setOpen(false)
    // Redirect to dashboard on switch since secret key needs re-decryption
    navigate('/dashboard')
  }

  return (
    <div className="community-switcher">
      <button
        className="switcher-trigger"
        onClick={() => setOpen(!open)}
      >
        <span className="switcher-name">{activeMembership.communityName}</span>
        <span className="switcher-role">{activeMembership.role}</span>
        <span className="switcher-arrow">{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {open && (
        <div className="switcher-dropdown">
          {memberships.map(m => (
            <button
              key={m.communityId}
              className={`switcher-option ${m.communityId === activeMembership.communityId ? 'active' : ''}`}
              onClick={() => handleSwitch(m.communityId)}
            >
              <span className="switcher-option-name">{m.communityName}</span>
              <span className="switcher-option-role">{m.role}</span>
            </button>
          ))}
          <div className="switcher-divider" />
          <button
            className="switcher-option switcher-join"
            onClick={() => { setOpen(false); navigate('/join-community') }}
          >
            + Join another community
          </button>
        </div>
      )}
    </div>
  )
}

export default CommunitySwitcher
