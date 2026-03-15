import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './LoginPage.css'
import favicon from '../assets/favicon.png'
import client from '../api/client'

function IconSJS({ size = 22 }) {
  return <img src={favicon} width={size} height={size} alt="SJS" style={{ display: 'block' }} />
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!username || !password) {
      setError('Please enter your username and password.')
      return
    }
    setLoading(true)
    try {
      const res = await client.post('/auth/login', { username, password })
      localStorage.setItem('sjs_token', res.data.token)
      localStorage.setItem('sjs_user', JSON.stringify(res.data.user))
      navigate('/app')
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Background grid */}
      <div className="login-bg-grid" />

      {/* Navbar */}
      <nav className="login-nav">
        <Link to="/" className="login-nav-logo">
          <IconSJS />
          SJS
        </Link>
      </nav>

      {/* Card */}
      <div className="login-card-wrap">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-icon-wrap">
              <IconSJS size={28} />
            </div>
            <h1>Sign in to SJS</h1>
            <p>Monitor your pipeline network in real time</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="login-field">
              <div className="login-field-row">
                <label htmlFor="password">Password</label>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="login-spinner" /> : 'Sign in'}
            </button>
          </form>

          <div className="login-divider"><span>or continue with</span></div>

          <button className="login-btn-demo" onClick={() => navigate('/app')}>
            Enter as Demo User
          </button>

          <p className="login-footer-note">
            Don't have access?{' '}
            <a href="#">Request a pilot</a>
          </p>
        </div>

        <p className="login-back">
          <Link to="/">← Back to homepage</Link>
        </p>
      </div>
    </div>
  )
}
