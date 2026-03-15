import { useNetworkHealth } from "../hooks/Usekpi"


const STATUS_COLOR = { good: '#16a34a', warning: '#f39c12', critical: '#dc2626' }

export default function NetworkHealthBanner({ districtName, overrideData }) {
    const { health, loading } = useNetworkHealth()
    const d = overrideData || health

    if (loading && !overrideData) {
        return <div className="nh-banner" style={{ opacity: 0.5 }}>Loading network health...</div>
    }
    if (!d) return null

    const color = STATUS_COLOR[d.status] || STATUS_COLOR.good

    return (
        <div className="nh-banner">
            <div className="nh-left">
                <div className="nh-label">Network Health</div>
                <div className="nh-score" style={{ color }}>{d.score}%</div>
                <div className="nh-status" style={{ color }}>
                    {d.status === 'critical' ? '⚠ Needs Attention' : d.status === 'warning' ? '⚠ Monitor' : '✓ Healthy'}
                </div>
            </div>

            <div className="nh-sep" />

            <div className="nh-mid">
                <div className="nh-mid-top">
                    <div className="nh-mid-title">
                        {districtName || 'All Districts'} — Network Overview
                    </div>
                    <span className="nh-rolling">2-DAY ROLLING</span>
                </div>
                <div className="nh-track">
                    <div className="nh-fill" style={{ width: `${d.score}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
                </div>
                {/* <div className="nh-sub">Last updated 2 min ago · Refreshes every 5 min</div> */}
            </div>

            <div className="nh-sep" />

            <div className="nh-meta">
                <div className="nh-stat">
                    <div className="nh-stat-val" style={{ color: '#16a34a' }}>{d.good ?? 0}</div>
                    <div className="nh-stat-lab">Healthy</div>
                </div>
                <div className="nh-stat">
                    <div className="nh-stat-val" style={{ color: '#f39c12' }}>{d.warning ?? 0}</div>
                    <div className="nh-stat-lab">Monitor</div>
                </div>
                <div className="nh-stat">
                    <div className="nh-stat-val" style={{ color: '#dc2626' }}>{d.critical ?? 0}</div>
                    <div className="nh-stat-lab">Critical</div>
                </div>
            </div>
        </div>
    )
}