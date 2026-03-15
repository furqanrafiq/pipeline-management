import { useResponseTimes } from '../hooks/Usekpi'

const TREND_COLOR = {
    Improving: '#16a34a',
    Stable: '#3b82f6',
    Worsening: '#f39c12',
    Critical: '#dc2626',
}

export default function ResponseBarChart() {
    const { data, loading } = useResponseTimes()

    if (loading) return <div style={{ height: 80, opacity: 0.4 }}>Loading...</div>
    if (!data.length) return null

    const max = Math.max(...data.map((d) => d.avgHours))
    const MAX_H = 56

    return (
        <div className="resp-bars">
            {data.map((d) => {
                const h = Math.round((d.avgHours / max) * MAX_H)
                const color = TREND_COLOR[d.trend] || TREND_COLOR.Stable
                const isCrit = d.trend === 'Critical'
                return (
                    <div key={d.districtId} className="resp-bar-col">
                        <div
                            className="resp-bar"
                            style={{
                                height: h,
                                background: color,
                                boxShadow: isCrit ? `0 0 8px ${color}80` : 'none',
                            }}
                        />
                        <div className="resp-bar-label">{d.label}</div>
                        <div className="resp-bar-hrs" style={{ color }}>{d.avgHours}h</div>
                    </div>
                )
            })}

            {/* Status chips row */}
            <div className="resp-status-row">
                {data.map((d) => {
                    const color = TREND_COLOR[d.trend] || TREND_COLOR.Stable
                    return (
                        <div
                            key={d.districtId}
                            className="resp-status-chip"
                            style={{ color, borderColor: `${color}40`, background: `${color}10` }}
                        >
                            {d.districtId} {d.trend}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}