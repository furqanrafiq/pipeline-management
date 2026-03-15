import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import client from '../api/client'
import NetworkHealthBanner from '../components/NetworkHealthBanner'
import { DistrictDetailSkeleton } from '../components/Skeleton'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const HEALTH_COLORS = { good: '#16a34a', warning: '#f39c12', critical: '#dc2626' }
function getHealthColor(h) { return HEALTH_COLORS[h] ?? HEALTH_COLORS.good }
function getHealthLabel(h) { return { good: 'Optimal', warning: 'Monitor', critical: 'Critical' }[h] ?? 'Unknown' }

async function getRoute(waypoints) {
  try {
    const coords = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';')
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${mapboxgl.accessToken}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.routes?.length > 0) return data.routes[0].geometry
  } catch {}
  return { type: 'LineString', coordinates: waypoints }
}

function removeLayers(map, sourceId) {
  [`${sourceId}-glow`, `${sourceId}-circle`, `${sourceId}-label`].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id)
  })
  if (map.getSource(sourceId)) map.removeSource(sourceId)
}

function removeAllPipelineLayers(map, ids) {
  ids.forEach((id) => {
    ['', '-endpoints', '-hit'].forEach((suffix) => {
      if (map.getLayer(id + suffix)) map.removeLayer(id + suffix)
      if (map.getSource(id + suffix)) map.removeSource(id + suffix)
    })
  })
}

function addCircleLayers(map, sourceId) {
  map.addLayer({ id: `${sourceId}-glow`, type: 'circle', source: sourceId,
    paint: { 'circle-radius': 18, 'circle-color': ['get', 'color'], 'circle-opacity': 0.2, 'circle-blur': 1 } })
  map.addLayer({ id: `${sourceId}-circle`, type: 'circle', source: sourceId,
    paint: { 'circle-radius': 10, 'circle-color': ['get', 'color'], 'circle-opacity': 0.9,
      'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 } })
  map.addLayer({ id: `${sourceId}-label`, type: 'symbol', source: sourceId,
    layout: { 'text-field': ['get', 'name'], 'text-size': 11, 'text-offset': [0, 1.8], 'text-anchor': 'top' },
    paint: { 'text-color': '#333333', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 } })
}

function setCursor(map, layerId) {
  map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = '' })
}

function Gauge({ label, value, pct, status, statusColor, icon }) {
  const r = 26, circ = 2 * Math.PI * r
  const fill = circ * (Math.min(pct, 100) / 100)
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
      padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
      <svg width={64} height={64} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={32} cy={32} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} />
        <circle cx={32} cy={32} r={r} fill="none" stroke={statusColor} strokeWidth={5}
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .6s' }} />
        <text x={32} y={32} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={700} fill="#1c1917"
          style={{ transform: 'rotate(90deg)', transformOrigin: '32px 32px' }}>{pct}%</text>
      </svg>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#374151', textAlign: 'center' }}>{icon} {label}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: statusColor, background: `${statusColor}15`,
        border: `1px solid ${statusColor}30`, borderRadius: 10, padding: '1px 7px',
        textTransform: 'uppercase', letterSpacing: 1 }}>{status}</div>
    </div>
  )
}

function PipeDetailPanel({ pipe, onClose }) {
  if (!pipe) return null
  const isLoading = pipe.flowPct == null
  const s = pipe.sensor || pipe
  const color = getHealthColor(pipe.health)
  const wFill = s.waterLevelPct ?? 50
  const wColor = wFill < 40 ? '#dc2626' : wFill < 65 ? '#ca8a04' : '#2563eb'
  const fillH = 60 * (wFill / 100)
  const fillY = 70 - fillH

  const gauges = [
    { label: 'Flow Rate',   value: s.flow,        pct: s.flowPct,        status: s.flowStatus,        icon: '💧',
      statusColor: s.flowPct < 40 ? '#dc2626' : s.flowPct < 60 ? '#ca8a04' : '#16a34a' },
    { label: 'Pressure',    value: s.pressure,    pct: s.pressurePct,    status: s.pressureStatus,    icon: '🔵',
      statusColor: s.pressurePct < 30 ? '#dc2626' : s.pressurePct < 55 ? '#ca8a04' : '#16a34a' },
    { label: 'Water Level', value: s.waterLevel,  pct: s.waterLevelPct,  status: s.waterLevelStatus,  icon: '🌊',
      statusColor: wColor },
    { label: 'Acoustic',    value: s.acoustic,    pct: s.acousticPct,    status: s.acousticStatus,    icon: '🔊',
      statusColor: s.acousticPct > 60 ? '#dc2626' : s.acousticPct > 35 ? '#ca8a04' : '#16a34a' },
    { label: 'Temperature', value: s.temperature, pct: s.temperaturePct, status: s.temperatureStatus, icon: '🌡️',
      statusColor: s.temperaturePct > 65 ? '#dc2626' : s.temperaturePct > 50 ? '#ca8a04' : '#16a34a' },
    { label: 'Moisture', value: s.moisturePct != null ? `${s.moisturePct}%` : '—', pct: s.moisturePct ?? 0, status: s.moistureStatus, icon: '💦',
      statusColor: s.moisturePct > 55 ? '#dc2626' : s.moisturePct > 25 ? '#ca8a04' : '#16a34a' },
  ]

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, width: 350, height: '100%',
      background: '#fff', borderLeft: '1px solid #e5e7eb', zIndex: 20,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.10)' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #e5e7eb', background: `${color}07`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Pipeline Segment</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1c1917', fontFamily: 'monospace' }}>{pipe.id}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{pipe.jointCount ? `${pipe.jointCount} joints monitored` : 'Loading sensors...'}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', padding: '6px 10px', fontSize: 13, color: '#6b7280' }}>✕</button>
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${color}25`, borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${color}15`, border: `2.5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color }}>{s.healthScore}</div>
          <div>
            <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Health Score</div>
            <div style={{ fontSize: 13, fontWeight: 700, color }}>{getHealthLabel(pipe.health)}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Leak Risk</div>
            <div style={{ fontSize: 15, fontWeight: 800, color }}>{s.leakProbability}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 }}>Live Sensor Readings</div>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 12 }}>
            <div style={{ fontSize: 20, marginBottom: 6, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
            <div>Loading sensor data...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {gauges.map((g) => <Gauge key={g.label} {...g} />)}
          </div>
        )}
      </div>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 }}>Pipe Cross-Section — Water Level</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width={80} height={80} viewBox="0 0 80 80">
            <defs><clipPath id={`clip-${pipe.id?.replace(/[^a-z0-9]/gi, '')}`}><circle cx={40} cy={40} r={30} /></clipPath></defs>
            <circle cx={40} cy={40} r={32} fill="#e5e7eb" />
            <circle cx={40} cy={40} r={30} fill="#f0f4ff" />
            <rect x={10} y={fillY} width={60} height={fillH} fill={`${wColor}35`} clipPath={`url(#clip-${pipe.id?.replace(/[^a-z0-9]/gi, '')})`} />
            <line x1={10} y1={fillY} x2={70} y2={fillY} stroke={wColor} strokeWidth={1.5} strokeDasharray="3 2" />
            <circle cx={40} cy={40} r={30} fill="none" stroke="#94a3b8" strokeWidth={3} />
            <circle cx={40} cy={40} r={32} fill="none" stroke="#64748b" strokeWidth={2} />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: '#6b7280' }}>Fill level</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: wColor }}>{s.waterLevel}</span>
            </div>
            <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${wFill}%`, background: wColor, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
              {wFill < 40 ? '⚠️ Critical — possible leak or blockage upstream' : wFill < 65 ? '⚠️ Below baseline — monitor closely' : '✅ Within normal operating range'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TrendBadge({ pct, dir, label, invertGood = false }) {
  if (pct == null) return null
  const isGood = invertGood ? dir === 'down' : dir === 'up'
  const color = dir === 'flat' ? '#9ca3af' : isGood ? '#16a34a' : '#dc2626'
  const arrow = dir === 'flat' ? '—' : dir === 'up' ? '▲' : '▼'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
      <span style={{ color, fontWeight: 700 }}>{arrow} {pct}%</span>
      <span style={{ color: '#9ca3af' }}>{label}</span>
    </div>
  )
}

function KpiCard({ icon, title, value, unit, trend, invertGood }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.05)', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: .5, textTransform: 'uppercase' }}>{title}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 700, color: '#111827', lineHeight: 1, marginBottom: 6 }}>
        {value ?? '—'}{unit && <span style={{ fontSize: 16, color: '#6b7280', marginLeft: 2 }}>{unit}</span>}
      </div>
      {trend && <TrendBadge {...trend} invertGood={invertGood} />}
    </div>
  )
}

export default function DistrictDetailView() {
  const { districtId } = useParams()
  const navigate = useNavigate()

  const mapRef              = useRef(null)
  const mapInstance         = useRef(null)
  const viewStack           = useRef([])
  const activePipelineIds   = useRef([])
  const activePipelinesData = useRef([])
  const activeSubAreaRef    = useRef(null)
  const geometryCache       = useRef({})
  const drillRef            = useRef(null)
  const subareasRef         = useRef([])
  const districtRef         = useRef(null)

  const [selectedPipe,    setSelectedPipe]    = useState(null)
  const [currentView,     setCurrentView]     = useState('subareas')
  const [activeSubArea,   setActiveSubArea]   = useState(null)
  const [activePipelines, setActivePipelines] = useState([])
  const [district,     setDistrict]     = useState(null)
  const [subareas,     setSubareas]     = useState([])
  const [incidents,    setIncidents]    = useState([])
  const [kpiData,      setKpiData]      = useState(null)
  const [period,       setPeriod]       = useState('today')
  const [loading,      setLoading]      = useState(true)

  // District + subareas — runs once per districtId, never on period change
  useEffect(() => {
    if (!districtId) return
    setLoading(true)
    client.get(`/districts/${districtId}`)
      .then((dRes) => {
        const d = dRes.data.data
        setDistrict(d)
        districtRef.current = d
        const sas = d.subAreas || []
        setSubareas(sas)
        subareasRef.current = sas
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [districtId])

  // KPIs — re-runs when period changes, does NOT touch district/subareas so map stays alive
  useEffect(() => {
    if (!districtId) return
    Promise.all([
      client.get(`/kpi/district-controller/${districtId}`),
      client.get(`/kpi/summary?period=${period}`),
    ])
      .then(([kpiRes, sumRes]) => {
        setIncidents(kpiRes.data.data.incidents || [])
        setKpiData({ controller: kpiRes.data.data, summary: sumRes.data.data })
      })
      .catch(console.error)
  }, [districtId, period])

  // ── drillIntoPipe — identical to MapView ──────────────────────────────────
  function drillIntoPipe(map, pipeline, geometry) {
    viewStack.current = ['subareas', 'pipelines', 'pipedetail']
    setCurrentView('pipedetail')
    const color = getHealthColor(pipeline.health)
    const coords = geometry.coordinates
    const lngs = coords.map(([lng]) => lng)
    const lats = coords.map(([, lat]) => lat)
    map.fitBounds(
      [[Math.min(...lngs) - 0.0005, Math.min(...lats) - 0.0005],
       [Math.max(...lngs) + 0.0005, Math.max(...lats) + 0.0005]],
      { padding: { top: 100, bottom: 100, left: 80, right: 420 }, duration: 700 }
    )
    activePipelineIds.current.forEach((pid) => {
      if (pid === pipeline.id) return
      if (map.getLayer(pid)) {
        map.setPaintProperty(pid, 'line-opacity', 0.1)
        map.setPaintProperty(pid, 'line-width', 2)
      }
      if (map.getLayer(`${pid}-endpoints`)) {
        map.setPaintProperty(`${pid}-endpoints`, 'circle-opacity', 0.1)
        map.setPaintProperty(`${pid}-endpoints`, 'circle-stroke-opacity', 0.1)
      }
    })
    if (map.getLayer(pipeline.id)) {
      map.setPaintProperty(pipeline.id, 'line-width', 8)
      map.setPaintProperty(pipeline.id, 'line-color', color)
      map.setPaintProperty(pipeline.id, 'line-opacity', 1)
    }
    setSelectedPipe(pipeline)
    client.get('/districts/pipelines/' + pipeline.id + '/joints')
      .then((res) => {
        const joints = res.data.data
        if (!joints?.length) return
        const j = joints[0]
        setSelectedPipe((prev) => ({
          ...prev,
          flow: j.flow, flowPct: j.flowPct, flowStatus: j.flowStatus,
          pressure: j.pressure, pressurePct: j.pressurePct, pressureStatus: j.pressureStatus,
          waterLevel: j.waterLevel, waterLevelPct: j.waterLevelPct, waterLevelStatus: j.waterLevelStatus,
          acoustic: j.acoustic, acousticPct: j.acousticPct, acousticStatus: j.acousticStatus,
          temperature: j.temperature, temperaturePct: j.temperaturePct, temperatureStatus: j.temperatureStatus,
          moisturePct: j.moisturePct, moistureStatus: j.moistureStatus,
          healthScore: j.healthScore, leakProbability: j.leakProbability,
          jointCount: joints.length, jointNo: j.jointNo,
        }))
      })
      .catch(console.error)
  }
  drillRef.current = drillIntoPipe

  // ── showSubAreas — same visual as MapView level 2 ─────────────────────────
  function showSubAreas(map, sas) {
    viewStack.current = ['subareas']
    setCurrentView('subareas')
    setSelectedPipe(null)
    if (map.getSource('subareas')) removeLayers(map, 'subareas')

    map.addSource('subareas', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: sas.map((sa) => ({
          type: 'Feature',
          properties: { name: sa.name, color: getHealthColor(sa.health), subareaId: sa.id },
          geometry: { type: 'Point', coordinates: sa.coordinates },
        })),
      },
    })
    addCircleLayers(map, 'subareas')
    map.on('click', 'subareas-circle', async (e) => {
      const { subareaId } = e.features[0].properties
      const sa = { id: subareaId, name: e.features[0].properties.name, coordinates: e.features[0].geometry.coordinates }
      activeSubAreaRef.current = sa
      setActiveSubArea(sa)
      map.flyTo({ center: e.features[0].geometry.coordinates, zoom: 17, duration: 800 })
      setTimeout(async () => {
        removeLayers(map, 'subareas')
        const pRes = await client.get(`/districts/subareas/${subareaId}/pipelines`)
        showPipelines(map, pRes.data.data)
      }, 800)
    })
    setCursor(map, 'subareas-circle')
  }

  // ── showPipelines — identical to MapView ──────────────────────────────────
  async function showPipelines(map, pipelines) {
    viewStack.current = ['subareas', 'pipelines']
    setCurrentView('pipelines')
    activePipelineIds.current = []
    activePipelinesData.current = pipelines
    setSelectedPipe(null)
    setActivePipelines(pipelines)
    geometryCache.current = {}

    for (const pipeline of pipelines) {
      const { id, health, waypoints } = pipeline
      const color = getHealthColor(health)
      const geometry = await getRoute(waypoints)
      geometryCache.current[id] = geometry

      map.addSource(id, { type: 'geojson', data: { type: 'Feature', geometry } })
      map.addLayer({ id, type: 'line', source: id,
        paint: { 'line-color': color, 'line-width': 4, 'line-opacity': 0.95 },
        layout: { 'line-join': 'round', 'line-cap': 'round' } })
      map.addSource(`${id}-hit`, { type: 'geojson', data: { type: 'Feature', geometry } })
      map.addLayer({ id: `${id}-hit`, type: 'line', source: `${id}-hit`,
        paint: { 'line-color': 'transparent', 'line-width': 20, 'line-opacity': 0 },
        layout: { 'line-join': 'round', 'line-cap': 'round' } })

      const coords = geometry.coordinates
      const epId = `${id}-endpoints`
      map.addSource(epId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: coords[0] } },
            { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: coords[coords.length - 1] } },
          ],
        },
      })
      map.addLayer({ id: epId, type: 'circle', source: epId,
        paint: { 'circle-radius': 8, 'circle-color': '#ffffff', 'circle-stroke-color': color, 'circle-stroke-width': 3 } })

      const handlePipeClick = (e) => { e.preventDefault(); drillRef.current(map, pipeline, geometry) }
      map.on('click', `${id}-hit`, handlePipeClick)
      map.on('click', id, handlePipeClick)
      map.on('click', epId, handlePipeClick)
      map.on('mouseenter', `${id}-hit`, () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', `${id}-hit`, () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', epId, () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', epId, () => { map.getCanvas().style.cursor = '' })
      activePipelineIds.current.push(id)
    }
  }

  function closePipeDetail() {
    const map = mapInstance.current
    if (!map) return
    activePipelineIds.current.forEach((pid) => {
      const p = activePipelinesData.current.find((x) => x.id === pid)
      if (!p) return
      const c = getHealthColor(p.health)
      if (map.getLayer(pid)) {
        map.setPaintProperty(pid, 'line-opacity', 0.95)
        map.setPaintProperty(pid, 'line-width', 4)
        map.setPaintProperty(pid, 'line-color', c)
      }
      if (map.getLayer(`${pid}-endpoints`)) {
        map.setPaintProperty(`${pid}-endpoints`, 'circle-opacity', 1)
        map.setPaintProperty(`${pid}-endpoints`, 'circle-stroke-opacity', 1)
      }
    })
    viewStack.current = ['subareas', 'pipelines']
    setCurrentView('pipelines')
    setSelectedPipe(null)
  }

  function handleBack() {
    const map = mapInstance.current
    if (!map) return
    if (currentView === 'pipedetail') { closePipeDetail(); return }
    if (currentView === 'pipelines') {
      removeAllPipelineLayers(map, activePipelineIds.current)
      activePipelineIds.current = []
      activePipelinesData.current = []
      geometryCache.current = {}
      setSelectedPipe(null)
      setActivePipelines([])
      const d = districtRef.current
      if (!d) return
      map.flyTo({ center: d.coordinates, zoom: 13, duration: 800 })
      setTimeout(() => showSubAreas(map, subareasRef.current), 800)
    }
  }

  // ── Init map — start zoomed into district at subarea level ────────────────
  useEffect(() => {
    if (!mapRef.current || !district || subareas.length === 0) return
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: district.coordinates,
      zoom: 13,
    })
    mapInstance.current = map

    map.on('load', () => {
      map.setConfig('basemap', { showPointOfInterestLabels: false, showRoadLabels: true, showTransitLabels: false, showPlaceLabels: false })
      map.addLayer({ id: 'fade-overlay', type: 'background', paint: { 'background-color': '#ffffff', 'background-opacity': 0.3 } })

      // Fit to all subareas bounds then show markers
      const bounds = new mapboxgl.LngLatBounds()
      subareas.forEach(sa => bounds.extend(sa.coordinates))
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 120, maxZoom: 14.5, duration: 600 })
      }

      showSubAreas(map, subareas)
    })

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
    }
  }, [district?.id, subareas.length])

  const criticalCount = incidents.filter(i => i.status === 'critical').length
  const liveCount     = incidents.filter(i => i.status === 'live').length
  const rt            = kpiData?.controller?.responseTimes
  const tk            = kpiData?.controller?.tasks
  const trends        = kpiData?.summary?.trends || {}

  const avgHours = rt
    ? (period === 'mtd' ? (rt.avgHoursMtd ?? rt.avgHours)
     : period === 'ytd' ? (rt.avgHoursYtd ?? rt.avgHours)
     : rt.avgHours)
    : '—'

  const completedTasks = tk
    ? (period === 'mtd' ? (tk.todayMtd ?? tk.today)
     : period === 'ytd' ? (tk.todayYtd ?? tk.today)
     : tk.today)
    : '—'
  const cmpLabel      = period === 'today' ? 'vs yesterday' : period === 'mtd' ? 'vs last month' : 'vs last year'
  const backLabel     = { pipedetail: '← All Pipes', pipelines: '← Sub-Areas' }

  if (loading) return <DistrictDetailSkeleton />
  if (!district) return <div style={{ padding: 32, color: '#dc2626' }}>District not found.</div>

  const hColor = getHealthColor(district.health)

  return (
    <div className="overview-view">
      <NetworkHealthBanner
        districtName={district.name}
        overrideData={{
          score:    district.health === 'good' ? 90 : district.health === 'warning' ? 60 : 25,
          status:   district.health,
          good:     subareas.filter(s => s.health === 'good').length,
          warning:  subareas.filter(s => s.health === 'warning').length,
          critical: subareas.filter(s => s.health === 'critical').length,
        }}
      />

      {/* District header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: '#6b7280', fontSize: 12 }}>← Overview</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#9ca3af' }}>{districtId}</span>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>{district.name}</h1>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${hColor}15`, color: hColor, border: `1px solid ${hColor}40`, textTransform: 'uppercase' }}>{district.health}</span>
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{subareas.length} subareas · Section-level view</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Period:</span>
          {[['today','Today'],['mtd','MTD'],['ytd','YTD']].map(([key, label]) => (
            <button key={key} onClick={() => setPeriod(key)} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid',
              borderColor: period === key ? '#2563eb' : '#e2ddd6',
              background:  period === key ? '#2563eb' : '#fff',
              color:       period === key ? '#fff'    : '#6b7280',
              transition: 'all .15s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <KpiCard icon="🔴" title="Critical Incidents" value={criticalCount}
          trend={{ pct: trends.critical?.pct, dir: trends.critical?.dir, label: cmpLabel }} invertGood />
        <KpiCard icon="🟡" title="Live Incidents" value={liveCount}
          trend={{ pct: trends.live?.pct, dir: trends.live?.dir, label: cmpLabel }} invertGood />
        <KpiCard icon="⏱" title="Avg Response" value={avgHours} unit="hr"
          trend={{ pct: trends.response?.pct, dir: trends.response?.dir, label: cmpLabel }} invertGood />
        <KpiCard icon="✅" title="Completed Tasks" value={completedTasks}
          trend={{ pct: trends.tasks?.pct, dir: trends.tasks?.dir, label: cmpLabel }} />
        <KpiCard icon="📊" title="District Health" value={district.health.charAt(0).toUpperCase() + district.health.slice(1)} />
      </div>

      {/* ── Map — identical look & feel to MapView ───────────────────────── */}
      <div style={{ position: 'relative', width: '100%', height: 520, marginBottom: 16, borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>

        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {selectedPipe && <PipeDetailPanel pipe={selectedPipe} onClose={closePipeDetail} />}

        {/* Back button */}
        {currentView !== 'subareas' && (
          <button onClick={handleBack} style={{ position: 'absolute', top: 16, left: 16, zIndex: 10,
            padding: '7px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
            cursor: 'pointer', fontWeight: 700, fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', color: '#374151' }}>
            {backLabel[currentView] ?? '← Back'}
          </button>
        )}

        {/* Breadcrumb pill — same as MapView */}
        <div style={{ position: 'absolute', top: 16, left: currentView !== 'subareas' ? 150 : 16, zIndex: 10,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20,
          padding: '5px 14px', fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#374151', fontWeight: 500 }}>{district.name}</span>
          {(currentView === 'pipelines' || currentView === 'pipedetail') && activeSubArea && (
            <><span style={{ color: '#d1d5db' }}>›</span>
            <span style={{ color: '#374151', fontWeight: 500 }}>{activeSubArea.name}</span></>
          )}
          {currentView === 'pipedetail' && selectedPipe && (
            <><span style={{ color: '#d1d5db' }}>›</span>
            <span style={{ color: getHealthColor(selectedPipe.health), fontWeight: 700 }}>{selectedPipe.id}</span></>
          )}
        </div>

        {/* Health legend — same as MapView */}
        <div style={{ position: 'absolute', top: 16, right: selectedPipe ? 366 : 16, zIndex: 10,
          background: '#fff', borderRadius: 8, padding: '12px 16px', boxShadow: '0 2px 6px rgba(0,0,0,0.10)', transition: 'right .3s ease' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 11, color: '#374151', letterSpacing: 1 }}>NETWORK HEALTH</p>
          {Object.entries(HEALTH_COLORS).map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 11, textTransform: 'capitalize', color: '#6b7280' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Pipeline list sidebar — identical to MapView */}
        {currentView === 'pipelines' && !selectedPipe && activePipelines.length > 0 && (
          <div style={{ position: 'absolute', bottom: 24, left: 16, zIndex: 10, background: '#fff',
            borderRadius: 8, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', maxHeight: '45vh', overflowY: 'auto' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 11, color: '#374151' }}>
              SEGMENTS — {activeSubArea?.name?.toUpperCase()}
            </p>
            {activePipelines.map((pipe, i) => {
              const c = getHealthColor(pipe.health)
              return (
                <div key={pipe.id}
                  onClick={() => drillRef.current(mapInstance.current, pipe, geometryCache.current[pipe.id])}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, cursor: 'pointer', padding: '5px 6px', borderRadius: 6 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ width: 20, height: 4, background: c, borderRadius: 2 }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', border: `2px solid ${c}` }} />
                  <span style={{ fontSize: 11, color: '#374151' }}>Seg {i + 1}</span>
                  <span style={{ fontSize: 10, color: c, fontWeight: 700, textTransform: 'capitalize', marginLeft: 'auto', paddingLeft: 8 }}>{pipe.health}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Subareas table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>Subarea Status</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{subareas.length} subareas in {district.name}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['ID', 'Name', 'Sector', 'Health', 'Coordinates'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: .5, textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subareas.map((sa, i) => {
                const hc = getHealthColor(sa.health)
                return (
                  <tr key={sa.id}
                    style={{ background: i % 2 === 0 ? '#fff' : '#fafbff', cursor: 'pointer', transition: 'background .1s' }}
                    onClick={() => {
                      const map = mapInstance.current
                      if (!map) return
                      // If we're deep in pipelines/pipedetail, clean up first
                      if (currentView === 'pipedetail') closePipeDetail()
                      if (currentView === 'pipelines' || currentView === 'pipedetail') {
                        removeAllPipelineLayers(map, activePipelineIds.current)
                        activePipelineIds.current = []
                        activePipelinesData.current = []
                        geometryCache.current = {}
                        setSelectedPipe(null)
                        setActivePipelines([])
                      }
                      // Fly to subarea and load its pipelines
                      const saObj = { id: sa.id, name: sa.name, coordinates: sa.coordinates }
                      activeSubAreaRef.current = saObj
                      setActiveSubArea(saObj)
                      map.flyTo({ center: sa.coordinates, zoom: 17, duration: 800 })
                      if (map.getSource('subareas')) removeLayers(map, 'subareas')
                      setTimeout(async () => {
                        const pRes = await client.get(`/districts/subareas/${sa.id}/pipelines`)
                        showPipelines(map, pRes.data.data)
                      }, 800)
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbff'}
                  >
                    <td style={{ padding: '9px 14px', borderBottom: '1px solid #f3f4f6', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{sa.id}</td>
                    <td style={{ padding: '9px 14px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, color: '#111827' }}>{sa.name}</td>
                    <td style={{ padding: '9px 14px', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>Sector {sa.sectorLetter}</td>
                    <td style={{ padding: '9px 14px', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${hc}15`, color: hc, textTransform: 'uppercase', border: `1px solid ${hc}40` }}>
                        {sa.health}
                      </span>
                    </td>
                    <td style={{ padding: '9px 14px', borderBottom: '1px solid #f3f4f6', fontFamily: 'monospace', fontSize: 10, color: '#9ca3af' }}>
                      {sa.coordinates?.[1]?.toFixed(4)}°N, {sa.coordinates?.[0]?.toFixed(4)}°E
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}