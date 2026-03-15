import './Skeleton.css'

/** A single shimmer block */
export function Skel({ w = '100%', h = 16, r = 8, mb = 0, style = {} }) {
  return (
    <div
      className="skel"
      style={{ width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0, ...style }}
    />
  )
}

/** Full Overview dashboard skeleton */
export function OverviewSkeleton() {
  return (
    <div className="skel-overview">

      {/* NetworkHealthBanner */}
      <Skel h={68} r={12} mb={18} />

      {/* Period filter */}
      <div className="skel-row" style={{ marginBottom: 16, gap: 8 }}>
        <Skel w={52} h={28} r={20} />
        <Skel w={52} h={28} r={20} />
        <Skel w={52} h={28} r={20} />
        <Skel w={160} h={16} r={6} style={{ alignSelf: 'center', marginLeft: 4 }} />
      </div>

      {/* KPI grid — 6 cards */}
      <div className="skel-kpi-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skel-kpi-card">
            <div className="skel-row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <Skel w="55%" h={11} r={4} />
              <Skel w={20} h={20} r={6} />
            </div>
            <Skel w="40%" h={32} r={6} mb={8} />
            <Skel w="65%" h={10} r={4} mb={14} />
            <Skel h={56} r={8} />
          </div>
        ))}
      </div>

    </div>
  )
}

/** Single KPI card skeleton */
export function KpiCardSkeleton() {
  return (
    <div className="skel-kpi-card">
      <div className="skel-row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <Skel w="55%" h={11} r={4} />
        <Skel w={20} h={20} r={6} />
      </div>
      <Skel w="40%" h={32} r={6} mb={8} />
      <Skel w="65%" h={10} r={4} mb={14} />
      <Skel h={56} r={8} />
    </div>
  )
}

/** Table skeleton */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="skel-table-wrap">
      {/* Header row */}
      <div className="skel-table-row skel-table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <Skel key={i} w={`${60 + (i % 3) * 20}%`} h={10} r={4} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel-table-row">
          {Array.from({ length: cols }).map((_, j) => (
            <Skel key={j} w={`${50 + ((i + j) % 4) * 12}%`} h={11} r={4} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** AI Predictive page skeleton */
export function AiSkeleton() {
  return (
    <div className="skel-ai">
      {/* Header banner */}
      <Skel h={88} r={14} mb={18} />
      {/* Filters */}
      <div className="skel-row" style={{ marginBottom: 18, gap: 4 }}>
        {[48, 56, 56].map((w, i) => <Skel key={i} w={w} h={30} r={6} />)}
      </div>
      {/* Cards grid */}
      <div className="skel-ai-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skel-kpi-card">
            <div className="skel-row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <Skel w="50%" h={11} r={4} />
              <Skel w={64} h={20} r={10} />
            </div>
            <Skel w="70%" h={14} r={4} mb={14} />
            {[1, 2, 3].map((j) => (
              <div key={j} style={{ marginBottom: 10 }}>
                <div className="skel-row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                  <Skel w="45%" h={9} r={3} />
                  <Skel w="15%" h={9} r={3} />
                </div>
                <Skel h={4} r={2} />
              </div>
            ))}
            <Skel h={32} r={8} mb={10} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** District Detail page skeleton */
export function DistrictDetailSkeleton() {
  return (
    <div className="skel-overview">
      {/* NetworkHealthBanner */}
      <Skel h={68} r={12} mb={18} />

      {/* District header row */}
      <div className="skel-row" style={{ justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div className="skel-row" style={{ gap: 12 }}>
          <Skel w={90} h={28} r={8} />
          <div>
            <div className="skel-row" style={{ gap: 8, marginBottom: 6 }}>
              <Skel w={40} h={11} r={3} />
              <Skel w={120} h={18} r={5} />
              <Skel w={56} h={20} r={10} />
            </div>
            <Skel w={180} h={10} r={4} />
          </div>
        </div>
        <div className="skel-row" style={{ gap: 6 }}>
          <Skel w={44} h={11} r={4} />
          <Skel w={52} h={28} r={20} />
          <Skel w={52} h={28} r={20} />
          <Skel w={52} h={28} r={20} />
        </div>
      </div>

      {/* 5 KPI cards */}
      <div className="skel-row" style={{ gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skel-kpi-card" style={{ flex: 1, minWidth: 120 }}>
            <div className="skel-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <Skel w="55%" h={10} r={4} />
              <Skel w={20} h={20} r={5} />
            </div>
            <Skel w="45%" h={28} r={5} mb={6} />
            <Skel w="70%" h={9} r={4} />
          </div>
        ))}
      </div>

      {/* Map area */}
      <Skel h={520} r={14} mb={16} />

      {/* Subareas table */}
      <div className="skel-rank-table">
        <div className="skel-rank-head" style={{ display: 'flex', gap: 16, padding: '10px 16px' }}>
          {[40, 120, 80, 64, 140].map((w, i) => (
            <Skel key={i} w={w} h={10} r={3} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '10px 16px', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}>
            <Skel w={40} h={11} r={4} />
            <Skel w={120} h={11} r={4} />
            <Skel w={80} h={11} r={4} />
            <Skel w={56} h={20} r={10} />
            <Skel w={140} h={10} r={4} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** District Controller (Subarea) page skeleton */
export function DistrictControllerSkeleton() {
  return (
    <div className="skel-overview">
      {/* Breadcrumb */}
      <div className="skel-row" style={{ marginBottom: 14, gap: 8 }}>
        <Skel w={100} h={13} r={4} />
        <Skel w={8} h={13} r={2} />
        <Skel w={70} h={13} r={4} />
      </div>

      {/* NetworkHealthBanner */}
      <Skel h={68} r={12} mb={16} />

      {/* kpi-row-3: 3 cards */}
      <div className="skel-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 14 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skel-kpi-card">
            <div className="skel-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <Skel w="55%" h={10} r={4} />
              <Skel w={20} h={20} r={5} />
            </div>
            <Skel w="40%" h={32} r={5} mb={8} />
            <Skel w="65%" h={9} r={4} />
          </div>
        ))}
      </div>

      {/* kpi-row-2: 2 cards */}
      <div className="skel-kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {/* Completed Tasks card */}
        <div className="skel-kpi-card">
          <div className="skel-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <Skel w="55%" h={10} r={4} />
            <Skel w={20} h={20} r={5} />
          </div>
          <Skel w="40%" h={32} r={5} mb={8} />
          <Skel w="80%" h={9} r={4} mb={10} />
          <Skel h={6} r={3} mb={4} />
          <Skel w="35%" h={9} r={4} />
        </div>
        {/* AI Predictions card */}
        <div className="skel-kpi-card">
          <div className="skel-row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <Skel w="55%" h={10} r={4} />
            <Skel w={20} h={20} r={5} />
          </div>
          <Skel w="30%" h={32} r={5} mb={12} />
          <Skel h={28} r={6} mb={6} />
          <Skel h={28} r={6} />
        </div>
      </div>
    </div>
  )
}

// Col widths mirror the actual Rankings table:
// #, District, Health, Avg Response, Response Trend, Completion Rate, Net Gain, Trend
const RANK_COLS = [28, 140, 72, 88, 96, 120, 80, 72]

/** Rankings page skeleton — matches the real table layout */
export function RankingsSkeleton() {
  return (
    <div className="skel-rankings">
      {/* Page header */}
      <Skel w={200} h={22} r={6} mb={6} />
      <Skel w={300} h={12} r={4} mb={20} />

      {/* Table */}
      <div className="skel-rank-table">
        {/* Header */}
        <div className="skel-rank-row skel-rank-head">
          {RANK_COLS.map((w, i) => (
            <div key={i} className="skel-rank-cell" style={{ width: w, flexShrink: 0 }}>
              <Skel w="70%" h={10} r={3} />
            </div>
          ))}
        </div>

        {/* 10 data rows */}
        {Array.from({ length: 10 }).map((_, row) => (
          <div key={row} className="skel-rank-row">
            {/* # */}
            <div className="skel-rank-cell" style={{ width: RANK_COLS[0], flexShrink: 0 }}>
              <Skel w={20} h={20} r={4} />
            </div>
            {/* District — badge + name */}
            <div className="skel-rank-cell" style={{ width: RANK_COLS[1], flexShrink: 0, gap: 6 }}>
              <Skel w={28} h={18} r={4} />
              <Skel w={80} h={11} r={4} />
            </div>
            {/* Health badge */}
            <div className="skel-rank-cell" style={{ width: RANK_COLS[2], flexShrink: 0 }}>
              <Skel w={56} h={20} r={10} />
            </div>
            {/* Avg Response */}
            <div className="skel-rank-cell" style={{ width: RANK_COLS[3], flexShrink: 0 }}>
              <Skel w={40} h={11} r={4} />
            </div>
            {/* Response Trend */}
            <div className="skel-rank-cell" style={{ width: RANK_COLS[4], flexShrink: 0 }}>
              <Skel w={64} h={11} r={4} />
            </div>
            {/* Completion Rate — bar + pct */}
            <div className="skel-rank-cell" style={{ width: RANK_COLS[5], flexShrink: 0, flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <Skel w="80%" h={6} r={3} />
              <Skel w={32} h={10} r={3} />
            </div>
            {/* Net Gain */}
            <div className="skel-rank-cell" style={{ width: RANK_COLS[6], flexShrink: 0 }}>
              <Skel w={44} h={11} r={4} />
            </div>
            {/* Trend */}
            <div className="skel-rank-cell" style={{ width: RANK_COLS[7], flexShrink: 0 }}>
              <Skel w={40} h={11} r={4} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
