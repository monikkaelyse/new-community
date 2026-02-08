import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import CommunitySwitcher from './CommunitySwitcher.jsx'
import './Navbar.css'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const isAuthPage = ['/login', '/register'].includes(location.pathname)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar-brand">
            <span className="navbar-lock">&#x1f512;</span>
            <span className="navbar-title">CommunityE2E</span>
          </Link>

          {isAuthenticated && !isAuthPage && <CommunitySwitcher />}
        </div>

        {isAuthenticated && !isAuthPage && (
          <div className="navbar-links">
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
              Dashboard
            </Link>
            <Link to="/chat" className={location.pathname === '/chat' ? 'active' : ''}>
              Chat
            </Link>
            <Link to="/board" className={location.pathname === '/board' ? 'active' : ''}>
              Board
            </Link>
            <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
              Profile
            </Link>
          </div>
        )}

        {isAuthenticated && (
          <div className="navbar-user">
            <span className="navbar-username">{user?.username}</span>
            <button onClick={handleLogout} className="navbar-logout">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
