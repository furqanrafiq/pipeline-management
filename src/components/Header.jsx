import { NavLink, useNavigate } from 'react-router-dom'
import { usePredictions } from '../hooks/usePredictions'
import { toggleSidebarGlobal } from './Aside'

export default function Header() {
  const { summary } = usePredictions()
  const navigate = useNavigate()

  const tabs = [
    { to: '/app',          label: 'Overview'      },
    { to: '/app/map',      label: 'Map'           },
    { to: '/app/rankings', label: 'Rankings'      },
    { to: '/app/ai',       label: 'AI Predictive', badge: summary.critical || 0 },
  ]

  function handleLogout() {
    localStorage.removeItem('sjs_token')
    localStorage.removeItem('sjs_user')
    navigate('/login')
  }

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('sjs_user')) } catch { return null }
  })()

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Hamburger — mobile only */}
        <button className="topbar-hamburger" onClick={toggleSidebarGlobal} aria-label="Toggle menu">
          <span /><span /><span />
        </button>

        <div className="topbar-title">
          <span className="topbar-label">NETWORK MONITORING</span>
        </div>
        <nav className="topbar-tabs">
          {tabs.map(({ to, label, badge }) => (
            <NavLink
              key={to} to={to} end={to === '/app'}
              className={({ isActive }) => `tab-item ${isActive ? 'tab-active' : ''} ${badge > 0 ? 'tab-ai' : ''}`}
            >
              {label}
              {badge > 0 && <span className="tab-badge">{badge}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="topbar-right">
        <div className="topbar-time">
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="topbar-refresh">🔄 Live</div>
        {user && (
          <div className="topbar-user">
            <span className="topbar-username">{user.username}</span>
          </div>
        )}
        <button className="topbar-logout" onClick={handleLogout} title="Sign out">
          Sign out
        </button>
      </div>
    </header>
  )
}