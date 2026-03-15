// Shows AI confidence % + alternative scenarios breakdown
// Used inside the Critical Incidents KPI card

export default function AiConfidenceBlock({ incident }) {
    if (!incident) return null
    const top = incident.aiBreakdown?.[0]
    const alts = incident.aiBreakdown?.slice(1) || []

    return (
        <div className="ai-conf-block">
            <div className="ai-conf-header">
                🧠 AI Analysis — <span>{incident.id}</span>
            </div>

            {/* Main confidence */}
            <div className="ai-conf-main">
                <div className="ai-conf-pct">{incident.aiConfidence}%</div>
                <div className="ai-conf-type">{top?.label}</div>
            </div>

            {/* Confidence bar */}
            <div className="ai-conf-bar-wrap">
                <div
                    className="ai-conf-bar"
                    style={{ width: `${incident.aiConfidence}%` }}
                />
            </div>

            {/* Alternative scenarios */}
            <div className="ai-conf-alts">
                {alts.map((alt) => (
                    <div key={alt.label} className="ai-conf-alt">
                        <span>{alt.label}</span>
                        <span>{alt.pct}%</span>
                    </div>
                ))}
            </div>

            <div className="ai-conf-ref">
                {incident.districtId} · {incident.subareaId?.split('-').slice(-1)[0]}
            </div>
        </div>
    )
}