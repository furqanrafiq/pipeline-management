import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useDistrictController, useActiveRepairs } from '../hooks/useKpi'
import NetworkHealthBanner from '../components/NetworkHealthBanner'
import client from '../api/client'
import { DistrictControllerSkeleton } from '../components/Skeleton'

const HEALTH_COLOR = { good: '#16a34a', warning: '#ca8a04', critical: '#dc2626' }

export default function DistrictControllerView() {
    const { districtId } = useParams()
    const [searchParams] = useSearchParams()
    const subareaId = searchParams.get('subarea')  // e.g. "D1-SA2"

    const [activeDetail, setActiveDetail] = useState(null)
    const [subareaData, setSubareaData] = useState(null)
    const [subareaLoading, setSubareaLoading] = useState(false)

    // Full district data (incidents, KPIs, predictions)
    const { data, loading } = useDistrictController(districtId || 'D1')
    const { data: repairs }  = useActiveRepairs(districtId || 'D1')

    // ── When subareaId changes → fetch that subarea's pipelines ────────────────
    useEffect(() => {
        if (!subareaId) { setSubareaData(null); return }

        setSubareaLoading(true)
        setSubareaData(null)

        // Fetch pipelines for this subarea
        client.get(`/districts/subareas/${subareaId}/pipelines`)
            .then((res) => {
                const pipelines = res.data.data
                // Compute health summary
                const total = pipelines.length
                const critical = pipelines.filter((p) => p.health === 'critical').length
                const warning = pipelines.filter((p) => p.health === 'warning').length
                const good = total - critical - warning
                setSubareaData({ pipelines, total, critical, warning, good })
            })
            .catch(console.error)
            .finally(() => setSubareaLoading(false))
    }, [subareaId])   // ← this is the fix: watches subareaId separately

    // ── Also reset detail panel when district changes ──────────────────────────
    useEffect(() => {
        setActiveDetail(null)
    }, [districtId])

    if (loading) return <DistrictControllerSkeleton />
    if (!data) return <div className="view-loading">District not found</div>

    const { district, incidents, responseTimes, tasks, aiPredictions, criticalCount, liveCount } = data
    const hColor = HEALTH_COLOR[district.health] || HEALTH_COLOR.good

    // Find active subarea name from district data
    const activeSubareaName = subareaId
        ? subareaId.replace(`${districtId}-`, '').replace('SA', 'Sector ')
        : null

    return (
        <div className="dc-view">

            {/* Breadcrumb */}
            <div className="dc-breadcrumb">
                <span className="dc-breadcrumb-district">{district.name}</span>
                {subareaId && (
                    <>
                        <span className="dc-breadcrumb-sep">›</span>
                        <span className="dc-breadcrumb-sector">{subareaId}</span>
                    </>
                )}
            </div>

            {/* Network Health Banner */}
            <NetworkHealthBanner
                districtName={district.name}
                overrideData={{
                    score: Math.round(district.health === 'good' ? 90 : district.health === 'warning' ? 65 : 35),
                    status: district.health,
                    good: 0,
                    warning: 0,
                    critical: 0,
                }}
            />

            {/* KPI Cards */}
            <div className="kpi-row-3">
                <div className="kpi-card" onClick={() => setActiveDetail(activeDetail === 'critical' ? null : 'critical')}>
                    <div className="kpi-top"><div className="kpi-name">Crit Incidents</div><div className="kpi-icon">🔴</div></div>
                    <div className="kpi-val">{criticalCount}</div>
                    <div className="kpi-sub">Active critical</div>
                </div>
                <div className="kpi-card" onClick={() => setActiveDetail(activeDetail === 'live' ? null : 'live')}>
                    <div className="kpi-top"><div className="kpi-name">Live Incidents</div><div className="kpi-icon">🟡</div></div>
                    <div className="kpi-val">{liveCount}</div>
                    <div className="kpi-sub">Being monitored</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-top"><div className="kpi-name">Avg Response</div><div className="kpi-icon">⏱</div></div>
                    <div className="kpi-val">{responseTimes?.avgHours ?? '—'}<span className="kpi-unit">hr</span></div>
                    <div className="kpi-sub" style={{ color: HEALTH_COLOR[responseTimes?.health] || '#6b7280' }}>
                        {responseTimes?.trend}
                    </div>
                </div>
            </div>

            <div className="kpi-row-2">
                <div className="kpi-card">
                    <div className="kpi-top"><div className="kpi-name">Completed Tasks</div><div className="kpi-icon">✅</div></div>
                    <div className="kpi-val">{tasks?.today ?? '—'}</div>
                    <div className="kpi-sub">Pending: {tasks?.pending ?? 0} · Overdue: {tasks?.overdue ?? 0}</div>
                    <div className="kpi-task-track" style={{ marginTop: 10 }}>
                        <div className="kpi-task-fill" style={{
                            width: `${tasks?.completionRate ?? 0}%`,
                            background: (tasks?.completionRate ?? 0) < 50 ? '#dc2626' : (tasks?.completionRate ?? 0) < 75 ? '#ca8a04' : '#16a34a',
                        }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{tasks?.completionRate ?? 0}% completion rate</div>
                </div>
                <div className="kpi-card" style={{ borderColor: repairs?.mismatch ? 'rgba(220,38,38,.35)' : undefined, boxShadow: repairs?.mismatch ? '0 0 0 3px rgba(220,38,38,.08)' : undefined, cursor: 'pointer' }} onClick={() => setActiveDetail(activeDetail === 'repairs' ? null : 'repairs')}>
                    <div className="kpi-top"><div className="kpi-name">Available Units</div><div className="kpi-icon">🔧</div></div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '4px 0 2px' }}>
                        <div className="kpi-val">{repairs?.teamsOut ?? '—'}</div>
                        <div style={{ fontSize: 13, color: '#9ca3af' }}>/ {repairs?.liveCount ?? 0} incidents</div>
                    </div>
                    {repairs?.mismatch ? (
                        <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, marginBottom: 6 }}>
                            ⚠ {repairs.missingTeams} team{repairs.missingTeams > 1 ? 's' : ''} short — {repairs.liveCount - repairs.teamsOut} unassigned
                        </div>
                    ) : (
                        <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 6 }}>✓ All incidents assigned</div>
                    )}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {Array.from({ length: Math.max(repairs?.teamsOut ?? 0, repairs?.liveCount ?? 0) }).map((_, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <span style={{ fontSize: 13 }}>👷</span>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: i < (repairs?.teamsOut ?? 0) ? '#16a34a' : '#dc2626' }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Active Subarea Pipeline Detail ─────────────────────────────────── */}
            {subareaId && (
                <div className="dc-subarea-panel">
                    <div className="dc-subarea-header">
                        <div className="dc-subarea-title">
                            📍 {subareaId} — Pipeline Overview
                        </div>
                        {subareaLoading && <span className="dc-subarea-loading">Loading...</span>}
                    </div>

                    {subareaData && !subareaLoading && (
                        <>
                            {/* Health summary chips */}
                            <div className="dc-subarea-chips">
                                <span className="dc-chip dc-chip-total">{subareaData.total} Segments</span>
                                {subareaData.good > 0 && <span className="dc-chip dc-chip-good">✓ {subareaData.good} Good</span>}
                                {subareaData.warning > 0 && <span className="dc-chip dc-chip-warn">⚠ {subareaData.warning} Warning</span>}
                                {subareaData.critical > 0 && <span className="dc-chip dc-chip-crit">✕ {subareaData.critical} Critical</span>}
                            </div>

                            {/* Pipeline list */}
                            <div className="dc-pipeline-list">
                                {subareaData.pipelines.map((pipe, i) => {
                                    const color = HEALTH_COLOR[pipe.health] || HEALTH_COLOR.good
                                    return (
                                        <div key={pipe.id} className="dc-pipeline-row">
                                            <div className="dc-pipe-num">Seg {i + 1}</div>
                                            <div className="dc-pipe-id">{pipe.id}</div>
                                            <div className="dc-pipe-bar-wrap">
                                                <div
                                                    className="dc-pipe-bar"
                                                    style={{ background: color, width: `${pipe.health === 'good' ? 85 : pipe.health === 'warning' ? 55 : 25}%` }}
                                                />
                                            </div>
                                            <span
                                                className="dc-pipe-badge"
                                                style={{ color, background: `${color}12`, border: `1px solid ${color}30` }}
                                            >
                                                {pipe.health}
                                            </span>
                                            <div className="dc-pipe-joints">{pipe.jointCount} joints</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Repair Jobs Panel */}
            {activeDetail === 'repairs' && repairs?.jobs && (
                <div className="incident-panel">
                    <div className="incident-panel-header">
                        <span>🔧 Active Repair Jobs — {district.name}</span>
                        <button onClick={() => setActiveDetail(null)} className="incident-close">✕</button>
                    </div>
                    {repairs.mismatch && (
                        <div style={{ padding: '8px 16px', background: 'rgba(220,38,38,.06)', borderBottom: '1px solid rgba(220,38,38,.15)', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                            ⚠ {repairs.missingTeams} incident{repairs.missingTeams > 1 ? 's' : ''} without assigned team
                        </div>
                    )}
                    {repairs.jobs.length === 0 ? (
                        <div style={{ padding: 16, color: '#9ca3af', fontSize: 13 }}>No repair teams currently dispatched</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ background: '#f9fafb' }}>
                                    {['Job #', 'Team', 'Area', 'Joint', 'Elapsed', 'Severity'].map(h => (
                                        <th key={h} style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: .5, textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {repairs.jobs.map((job, i) => {
                                    const hrs = Math.floor(job.elapsedMinutes / 60)
                                    const mins = job.elapsedMinutes % 60
                                    const elapsed = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
                                    const sevColor = job.severity === 'critical' ? '#dc2626' : '#ca8a04'
                                    return (
                                        <tr key={job.jobNumber} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafbff' }}>
                                            <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb', fontSize: 11 }}>{job.jobNumber}</td>
                                            <td style={{ padding: '8px 14px', fontWeight: 600, color: '#111827' }}>{job.teamName}</td>
                                            <td style={{ padding: '8px 14px', color: '#374151' }}>{job.area}</td>
                                            <td style={{ padding: '8px 14px', fontFamily: 'monospace', color: '#6b7280', fontSize: 11 }}>{job.jointRef}</td>
                                            <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontWeight: 600, color: job.elapsedMinutes > 60 ? '#dc2626' : '#374151' }}>{elapsed}</td>
                                            <td style={{ padding: '8px 14px' }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${sevColor}15`, color: sevColor, textTransform: 'uppercase', border: `1px solid ${sevColor}30` }}>
                                                    {job.severity}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Incident Detail Panel */}
            {activeDetail && activeDetail !== 'repairs' && (
                <div className="incident-list">
                    <div className="incident-list-header">
                        {activeDetail === 'critical' ? '🔴 Critical Incidents' : '🟡 Live Incidents'}
                        <button onClick={() => setActiveDetail(null)} className="incident-close">✕</button>
                    </div>
                    {incidents
                        .filter((i) => i.status === activeDetail)
                        .map((inc) => (
                            <div key={inc.id} className="incident-row">
                                <div className="inc-id">{inc.id}</div>
                                <div className="inc-info">
                                    <div className="inc-type">{inc.type}</div>
                                    <div className="inc-desc">{inc.description}</div>
                                </div>
                                <div className="inc-meta">
                                    <div className="inc-time">{inc.startTime}</div>
                                    <div className="inc-dur">{inc.duration}</div>
                                    <div className="inc-ai">🧠 {inc.aiConfidence}% confidence</div>
                                </div>
                            </div>
                        ))}
                    {incidents.filter((i) => i.status === activeDetail).length === 0 && (
                        <div style={{ padding: '16px', color: '#9ca3af', fontSize: 13 }}>No {activeDetail} incidents</div>
                    )}
                </div>
            )}

            {/* AI Predictions */}
            {aiPredictions.length > 0 && (
                <div className="dc-predictions">
                    <div className="dc-section-title">🧠 AI Predictions for {district.name}</div>
                    {aiPredictions.map((p) => {
                        const color = p.severity === 'critical' ? '#dc2626' : '#ca8a04'
                        return (
                            <div key={p._id} className={`apc-alert ${p.severity === 'critical' ? 'alert-red' : 'alert-yellow'}`}>
                                <strong>{p.predictedType}</strong> — ~{p.daysUntilEvent} days ({p.probability}% confidence)
                                <div style={{ marginTop: 4, fontSize: 11, color }}>{p.recommendation}</div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}