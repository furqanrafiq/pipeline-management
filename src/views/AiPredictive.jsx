import { useState } from 'react'
import { usePredictions } from '../hooks/usePredictions'
import { useNameMaps } from '../hooks/useNameMaps'
import { AiSkeleton } from '../components/Skeleton'

const SEV_COLOR = { critical: '#dc2626', warning: '#f39c12', ok: '#16a34a' }

function PredictionCard({ p, dn, san }) {
  const color    = SEV_COLOR[p.severity] || SEV_COLOR.ok
  const isCrit   = p.severity === 'critical'
  const distName = dn(p.districtId)

  return (
    <div style={{
      background: '#ffffff',
      border: `1px solid ${color}30`,
      borderTop: `3px solid ${color}`,
      borderRadius: 12,
      padding: 18,
      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      transition: 'transform .2s, box-shadow .2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.10)' }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.06)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color,
              background: `${color}12`, border: `1px solid ${color}30`,
              borderRadius: 4, padding: '2px 6px',
            }}>{p.districtId}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1c1917' }}>{distName}</span>
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{p.subareaId}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1c1917' }}>{p.predictedType}</div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color,
          background: `${color}12`, border: `1px solid ${color}35`,
          borderRadius: 20, padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {isCrit ? '⚠ CRITICAL' : p.severity === 'warning' ? '▲ WARNING' : '● HEALTHY'}
        </span>
      </div>

      {/* Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 12 }}>
        {[
          { label: 'Leak Probability',  val: `${p.leakLikelihood}%`,               pct: p.leakLikelihood },
          { label: 'Pipe Failure Risk', val: `${p.failureLikelihood}%`,            pct: p.failureLikelihood },
          { label: 'Degradation/mo',    val: `−${p.degradationRatePerMonth}%/mo`, pct: Math.min(p.degradationRatePerMonth * 10, 100) },
        ].map((m) => (
          <div key={m.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{m.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color }}>{m.val}</span>
            </div>
            <div style={{ height: 4, background: '#f0ede8', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${m.pct}%`, height: '100%', background: color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{
        background: `${color}08`, border: `1px solid ${color}20`,
        borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12,
      }}>
        <strong style={{ color }}>~{p.daysUntilEvent} days</strong>
        <span style={{ color: '#6b7280', marginLeft: 6 }}>{p.recommendation}</span>
      </div>

      {/* Factors */}
      {p.contributingFactors?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {p.contributingFactors.map((f) => (
            <div key={f} style={{ fontSize: 11, color: '#9ca3af' }}>• {f}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AiPredictiveView() {
  const [windowDays, setWindowDays] = useState(30)
  const { predictions, summary, loading } = usePredictions({ window: windowDays })
  const { dn, san } = useNameMaps()

  if (loading) return <AiSkeleton />

  return (
    <div className="ai-view">
      {/* Header */}
      <div className="ai-header-banner">
        <div className="ai-header-left">
          <div className="ai-header-icon">🧠</div>
          <div>
            <div className="ai-header-title">AI Predictive Analysis</div>
            <div className="ai-header-sub">Pattern recognition on 6+ months of live sensor data across all districts</div>
          </div>
        </div>
        <div className="ai-header-stats">
          <div className="ai-stat">
            <div className="ai-stat-val">80%</div>
            <div className="ai-stat-lab">Prediction Accuracy</div>
          </div>
          <div className="ai-stat">
            <div className="ai-stat-val" style={{ color: '#dc2626' }}>{summary.critical}</div>
            <div className="ai-stat-lab">Critical Alerts</div>
          </div>
          <div className="ai-stat">
            <div className="ai-stat-val">{summary.total}</div>
            <div className="ai-stat-lab">Active in {windowDays}d window</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="ai-filters">
        {[7, 30, 90].map((w) => (
          <button
            key={w}
            className={`ai-filter-btn ${windowDays === w ? 'active' : ''}`}
            onClick={() => setWindowDays(w)}
          >
            {w} DAYS
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!loading && predictions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No predictions in {windowDays}-day window</div>
          <div style={{ fontSize: 12 }}>Try expanding to 30 or 90 days to see upcoming alerts.</div>
        </div>
      )}

      {/* Cards */}
      <div className="ai-pred-grid">
        {predictions.map((p) => <PredictionCard key={p._id} p={p} dn={dn} san={san} />)}
      </div>

      {/* Event log table */}
      {!loading && predictions.length > 0 && (
        <div className="ai-event-log">
          <div className="ai-log-header">PREDICTION EVENT LOG — NEXT {windowDays} DAYS</div>
          <table className="ai-log-table">
            <thead>
              <tr>
                <th>District</th>
                <th>Subarea</th>
                <th>Prediction</th>
                <th>Confidence</th>
                <th>Severity</th>
                <th>Timeline</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p) => {
                const color    = SEV_COLOR[p.severity] || SEV_COLOR.ok
                const distName = dn(p.districtId)
                return (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color,
                          background: `${color}12`, border: `1px solid ${color}30`,
                          borderRadius: 3, padding: '1px 5px',
                        }}>{p.districtId}</span>
                        <span style={{ fontWeight: 600 }}>{distName}</span>
                      </div>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{san(p.subareaId)}</td>
                    <td>{p.predictedType}</td>
                    <td>
                      <div className="log-conf-wrap">
                        <div className="log-conf-track">
                          <div className="log-conf-fill" style={{ width: `${p.probability}%`, background: color }} />
                        </div>
                        <span style={{ color, fontWeight: 700 }}>{p.probability}%</span>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' }}>{p.severity}</span></td>
                    <td style={{ color: p.daysUntilEvent <= 7 ? '#dc2626' : p.daysUntilEvent <= 20 ? '#f39c12' : '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      ~{p.daysUntilEvent} days
                    </td>
                    <td>
                      <span className="log-status-chip" style={{ color, background: `${color}12`, border: `1px solid ${color}35`, whiteSpace: 'nowrap' }}>
                        {p.daysUntilEvent <= 7 ? '⚠ Urgent' : p.daysUntilEvent <= 20 ? 'Monitor' : 'Schedule'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}