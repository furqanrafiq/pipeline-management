import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import client from '../api/client'
import dashboardLogo from '../assets/dashboard-logo.png'
import shortLogo from '../assets/favicon.png'

const DISTRICT_COLORS = {
  D1: '#2563eb', D2: '#1d4ed8', D3: '#7c3aed', D4: '#f97316',
  D5: '#ec4899', D6: '#14b8a6', D7: '#ca8a04', D8: '#16a34a',
  D9: '#dc2626', D10: '#0891b2',
}
const HEALTH_COLOR = { good: '#16a34a', warning: '#ca8a04', critical: '#dc2626' }

let _globalToggle = null
export function toggleSidebarGlobal() { _globalToggle && _globalToggle() }

export default function Aside() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDistrict, setOpenDistrict] = useState(null)
  const [activeSubArea, setActiveSubArea] = useState(null)
  const [districts, setDistricts] = useState([])
  const [subAreas, setSubAreas] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingSubs, setLoadingSubs] = useState({})

  useEffect(() => {
    _globalToggle = () => setMobileOpen((v) => !v)
    return () => { _globalToggle = null }
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  useEffect(() => {
    client.get('/districts')
      .then((res) => setDistricts(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function toggleDistrict(id) {
    if (openDistrict === id) { setOpenDistrict(null); return }
    setOpenDistrict(id)
    if (!subAreas[id]) {
      setLoadingSubs((p) => ({ ...p, [id]: true }))
      client.get(`/districts/${id}/subareas`)
        .then((res) => setSubAreas((p) => ({ ...p, [id]: res.data.data })))
        .catch(console.error)
        .finally(() => setLoadingSubs((p) => ({ ...p, [id]: false })))
    }
  }

  function handleSubAreaClick(district, sa) {
    setActiveSubArea(sa.id)
    navigate(`/app/district/${district.id}?subarea=${sa.id}`)
  }

  const navItems = [
    { to: '/app', icon: '⬡', label: 'Overview' },
    { to: '/app/map', icon: '◉', label: 'Map' },
    { to: '/app/rankings', icon: '◈', label: 'Rankings' },
    { to: '/app/ai', icon: '🧠', label: 'AI Predictive' },
  ]

  const inner = (isMobile) => (
    <>
      <div className="sidebar-logo">
        <div className="logo-mark">
          {
            !collapsed ? <img src={dashboardLogo} width="110" />
              :
              <img src={shortLogo} width="20" />
          }
        </div>
        {isMobile ? (
          <button className="sb-collapse-btn" onClick={() => setMobileOpen(false)} title="Close">✕</button>
        ) : (
          <button className="sb-collapse-btn" onClick={() => setCollapsed((v) => !v)} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? '▶' : '◀'}
          </button>
        )}
      </div>

      <div className="sb-nav">
        {(!collapsed || isMobile) && <div className="sb-section-label">MAIN</div>}

        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to} to={to} end={to === '/app'}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''} ${collapsed && !isMobile ? 'nav-item-collapsed' : ''}`}
            title={collapsed && !isMobile ? label : ''}
          >
            <span className="nav-icon">{icon}</span>
            {(!collapsed || isMobile) && <span className="nav-label">{label}</span>}
          </NavLink>
        ))}

        {(!collapsed || isMobile) && (
          <>
            <div className="nav-divider" />
            <div className="sb-section-label">DISTRICTS</div>
            {loading && <div className="sb-loading">Loading...</div>}
            {districts.map((district) => {
              const color = DISTRICT_COLORS[district.id] || '#6b7280'
              const hColor = HEALTH_COLOR[district.health] || HEALTH_COLOR.good
              const isOpen = openDistrict === district.id
              const subs = subAreas[district.id] || []
              return (
                <div key={district.id}>
                  <div className={`nav-item district-item ${isOpen ? 'district-open' : ''}`}>
                    <span className="district-badge" style={{ color, borderColor: `${color}35`, background: `${color}12` }}>{district.id}</span>
                    <span className="nav-label district-name" onClick={() => navigate(`/app/district-detail/${district.id}`)} style={{ flex: 1, cursor: 'pointer' }}>{district.name}</span>
                    <span className="district-health-dot" style={{ background: hColor, boxShadow: district.health === 'critical' ? `0 0 5px ${hColor}` : 'none' }} />
                    <span className="sb-chevron" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', padding: '0 4px', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); toggleDistrict(district.id) }}>▶</span>
                  </div>
                  <div className="sb-sub" style={{ maxHeight: isOpen ? `${(subs.length || 4) * 40 + 16}px` : '0px' }}>
                    {loadingSubs[district.id] && <div className="sb-sub-loading">Loading sectors...</div>}
                    {subs.map((sa) => {
                      const saHColor = HEALTH_COLOR[sa.health] || HEALTH_COLOR.good
                      const isActive = activeSubArea === sa.id
                      return (
                        <div key={sa.id} className={`sb-subitem ${isActive ? 'sb-subitem-active' : ''}`} onClick={() => handleSubAreaClick(district, sa)} style={isActive ? { color } : {}}>
                          <span className="sb-dot" style={{ background: isActive ? color : saHColor, boxShadow: sa.health !== 'good' ? `0 0 4px ${saHColor}80` : 'none' }} />
                          <span className="sb-subitem-text">{sa.name}</span>
                          <span className="sb-sector-letter" style={{ color, borderColor: `${color}25`, background: `${color}08` }}>{sa.sectorLetter}</span>
                          {sa.health === 'critical' && <span className="sb-warn-dot" title="Critical" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {collapsed && !isMobile && (
          <div style={{ padding: '8px 0' }}>
            <div className="nav-divider" />
            {districts.map((d) => {
              const hColor = HEALTH_COLOR[d.health] || HEALTH_COLOR.good
              return (
                <div key={d.id} className="nav-item nav-item-collapsed" title={`${d.id} — ${d.name}`}
                  onClick={() => { setCollapsed(false); setTimeout(() => toggleDistrict(d.id), 80) }}
                  style={{ justifyContent: 'center' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: hColor, display: 'inline-block', boxShadow: d.health === 'critical' ? `0 0 5px ${hColor}` : 'none' }} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        {collapsed && !isMobile ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
            <div className="sb-avatar" style={{ margin: 0 }}>AD</div>
          </div>
        ) : (
          <div className="sb-user">
            <div className="sb-avatar">AD</div>
            <div className="sb-userinfo">
              <div className="sb-username">Admin User</div>
              <div className="sb-userrole">SUPER ADMIN</div>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {mobileOpen && <div className="sb-mobile-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar sidebar-desktop ${collapsed ? 'sidebar-collapsed' : ''}`}>{inner(false)}</aside>
      <aside className={`sidebar sidebar-mobile ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>{inner(true)}</aside>
    </>
  )
}