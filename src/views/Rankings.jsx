import { useRankings } from '../hooks/Usekpi'
import { RankingsSkeleton } from '../components/Skeleton'

const HEALTH_COLOR = { good: '#16a34a', warning: '#f39c12', critical: '#dc2626' }
const TREND_COLOR = { Improving: '#16a34a', Stable: '#3b82f6', Worsening: '#f39c12', Critical: '#dc2626' }

export default function RankingsView() {
    const { data, loading } = useRankings()

    if (loading) return <RankingsSkeleton />

    return (
        <div className="rankings-view">
            <div className="view-header">
                <h2>District Rankings</h2>
                <p>Sorted by task completion rate. Updated every 5 min.</p>
            </div>

            <div className="rankings-table-wrap">
                <table className="rankings-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>District</th>
                            <th>Health</th>
                            <th>Avg Response</th>
                            <th>Response Trend</th>
                            <th>Completion Rate</th>
                            <th>Today Net Gain</th>
                            <th>Trend</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((d, i) => {
                            const hColor = HEALTH_COLOR[d.health] || HEALTH_COLOR.good
                            const tColor = TREND_COLOR[d.responseTrend] || TREND_COLOR.Stable
                            return (
                                <tr key={d.districtId} className={i === 0 ? 'rank-top' : ''}>
                                    <td className="rank-num">
                                        {i + 1 <= 3
                                            ? <span className="rank-medal">{['🥇', '🥈', '🥉'][i]}</span>
                                            : i + 1
                                        }
                                    </td>
                                    <td>
                                        <div className="rank-district-name">
                                            <span className="rank-id">{d.districtId}</span>
                                            {d.name}
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className="rank-badge"
                                            style={{ color: hColor, borderColor: `${hColor}40`, background: `${hColor}10` }}
                                        >
                                            ● {d.health}
                                        </span>
                                    </td>
                                    <td className="rank-mono">{d.avgResponseHrs}h</td>
                                    <td>
                                        <span style={{ color: tColor, fontWeight: 600, fontSize: 12 }}>
                                            {d.responseTrend}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="rank-rate-wrap">
                                            <div className="rank-rate-track">
                                                <div
                                                    className="rank-rate-fill"
                                                    style={{
                                                        width: `${d.completionRate}%`,
                                                        background: d.completionRate < 50 ? '#dc2626' : d.completionRate < 75 ? '#f39c12' : '#16a34a',
                                                    }}
                                                />
                                            </div>
                                            <span className="rank-rate-pct">{d.completionRate}%</span>
                                        </div>
                                    </td>
                                    <td className="rank-mono">{d.todayNetGainK}K</td>
                                    <td>
                                        <span style={{
                                            color: d.trendPct > 0 ? '#16a34a' : d.trendPct < 0 ? '#dc2626' : '#6b7280',
                                            fontWeight: 700,
                                        }}>
                                            {d.trendPct > 0 ? '▲' : d.trendPct < 0 ? '▼' : '—'} {Math.abs(d.trendPct)}%
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}