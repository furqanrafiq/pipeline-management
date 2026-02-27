import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { districts, getHealthColor, getHealthLabel, HEALTH_COLORS } from '../rawData'

mapboxgl.accessToken = ''

// ─── ROUTE API ────────────────────────────────────────────────────────────────
async function getRoute(waypoints) {
  try {
    const coords = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';')
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${mapboxgl.accessToken}`
    const res  = await fetch(url)
    const data = await res.json()
    if (data.routes?.length > 0) return data.routes[0].geometry
  } catch {}
  return { type: 'LineString', coordinates: waypoints }
}

// ─── LAYER HELPERS ────────────────────────────────────────────────────────────
function removeLayers(map, sourceId) {
  [`${sourceId}-glow`, `${sourceId}-circle`, `${sourceId}-label`].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id)
  })
  if (map.getSource(sourceId)) map.removeSource(sourceId)
}

function removeAllPipelineLayers(map, ids) {
  ids.forEach((id) => {
    ['', '-endpoints', '-hit'].forEach((suffix) => {
      if (map.getLayer(id + suffix))  map.removeLayer(id + suffix)
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

// ─── GAUGE ────────────────────────────────────────────────────────────────────
function Gauge({ label, value, pct, status, statusColor, icon }) {
  const r    = 26
  const circ = 2 * Math.PI * r
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

// ─── PIPE DETAIL PANEL ────────────────────────────────────────────────────────
function PipeDetailPanel({ pipe, onClose }) {
  if (!pipe) return null
  const s     = pipe.sensor
  const color = getHealthColor(pipe.health)
  const wFill = s.waterLevelPct
  const wColor = wFill < 40 ? '#dc2626' : wFill < 65 ? '#ca8a04' : '#2563eb'
  const fillH  = 60 * (wFill / 100)
  const fillY  = 70 - fillH

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
    { label: 'Moisture',    value: `${s.moisturePct}%`, pct: s.moisturePct, status: s.moistureStatus, icon: '💦',
      statusColor: s.moisturePct > 55 ? '#dc2626' : s.moisturePct > 25 ? '#ca8a04' : '#16a34a' },
  ]

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, width: 350, height: '100%',
      background: '#fff', borderLeft: '1px solid #e5e7eb', zIndex: 20,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.10)' }}>

      {/* Header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #e5e7eb',
        background: `${color}07`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 9, color: '#9ca3af', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
              Pipeline Segment
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1c1917', fontFamily: 'monospace' }}>{pipe.id}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Joint {pipe.jointNo} → Joint {pipe.jointNo + 1}</div>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6,
            cursor: 'pointer', padding: '6px 10px', fontSize: 13, color: '#6b7280' }}>✕</button>
        </div>
        {/* Score row */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', border: `1px solid ${color}25`, borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${color}15`,
            border: `2.5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color }}>{s.healthScore}</div>
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

      {/* Gauges */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 }}>
          Live Sensor Readings
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {gauges.map((g) => <Gauge key={g.label} {...g} />)}
        </div>
      </div>

      {/* Cross-section */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 }}>
          Pipe Cross-Section — Water Level
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width={80} height={80} viewBox="0 0 80 80">
            <defs><clipPath id={`clip-${pipe.id.replace(/[^a-z0-9]/gi, '')}`}><circle cx={40} cy={40} r={30} /></clipPath></defs>
            <circle cx={40} cy={40} r={32} fill="#e5e7eb" />
            <circle cx={40} cy={40} r={30} fill="#f0f4ff" />
            <rect x={10} y={fillY} width={60} height={fillH} fill={`${wColor}35`}
              clipPath={`url(#clip-${pipe.id.replace(/[^a-z0-9]/gi, '')})`} />
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
              {wFill < 40 ? '⚠️ Critical — possible leak or blockage upstream'
                : wFill < 65 ? '⚠️ Below baseline — monitor closely'
                : '✅ Within normal operating range'}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 }}>
          Pipe Metadata
        </div>
        {[
          ['Segment ID',     pipe.id,                                    '🔖'],
          ['Joint Range',    `J${pipe.jointNo} → J${pipe.jointNo + 1}`,  '🔗'],
          ['Pipe Age',       s.pipeAge,                                  '🕐'],
          ['Last Inspected', s.lastInspected,                            '🔍'],
          ['Movement',       `${s.movementPct}% — ${s.movementStatus}`,  '📳'],
          ['Soil Moisture',  `${s.moisturePct}% — ${s.moistureStatus}`,  '🌱'],
        ].map(([label, val, icon]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 0', borderBottom: '1px solid #f9fafb' }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{icon} {label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', maxWidth: 170, textAlign: 'right' }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div style={{ padding: '14px 18px' }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>
          System Notes
        </div>
        <div style={{ background: `${color}08`, border: `1px solid ${color}25`, borderRadius: 8,
          padding: '10px 12px', fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{s.notes}</div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
function MapboxMap() {
  const mapRef              = useRef(null)
  const mapInstance         = useRef(null)
  const viewStack           = useRef([])
  const activePipelineIds   = useRef([])
  const activePipelinesData = useRef([])
  const activeDistrictRef   = useRef(null)
  const activeSubAreaRef    = useRef(null)
  const geometryCache       = useRef({})

  // ─── KEY FIX: store drillIntoPipe in a ref so Mapbox click handlers
  // always call the latest version, never a stale closure ───────────────────
  const drillRef = useRef(null)

  const [selectedPipe, setSelectedPipe] = useState(null)

  // ─── LEVEL 4 — defined early so drillRef can point to it ─────────────────
  function drillIntoPipe(map, pipeline, geometry) {
    viewStack.current = ['districts', 'subareas', 'pipelines', 'pipedetail']
    const color  = getHealthColor(pipeline.health)
    const coords = geometry.coordinates

    // Fit to this segment with room for the panel on the right
    const lngs = coords.map(([lng]) => lng)
    const lats  = coords.map(([, lat]) => lat)
    map.fitBounds(
      [[Math.min(...lngs) - 0.0005, Math.min(...lats) - 0.0005],
       [Math.max(...lngs) + 0.0005, Math.max(...lats) + 0.0005]],
      { padding: { top: 100, bottom: 100, left: 80, right: 420 }, duration: 700 }
    )

    // Dim all other pipes
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

    // Highlight selected
    if (map.getLayer(pipeline.id)) {
      map.setPaintProperty(pipeline.id, 'line-width', 8)
      map.setPaintProperty(pipeline.id, 'line-color', color)
      map.setPaintProperty(pipeline.id, 'line-opacity', 1)
    }

    setSelectedPipe(pipeline)
  }

  // Always keep ref pointing to the latest function
  drillRef.current = drillIntoPipe

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [46.7167, 24.6833],
      zoom: 11,
    })
    mapInstance.current = map

    map.on('load', () => {
      map.setConfig('basemap', {
        showPointOfInterestLabels: false,
        showRoadLabels: true,
        showTransitLabels: false,
        showPlaceLabels: false,
      })
      map.addLayer({ id: 'fade-overlay', type: 'background',
        paint: { 'background-color': '#ffffff', 'background-opacity': 0.3 } })
      showDistricts(map)
    })

    return () => map.remove()
  }, [])

  // ─── LEVEL 1 ───────────────────────────────────────────────────────────────
  function showDistricts(map) {
    viewStack.current = ['districts']
    activeDistrictRef.current = null
    activeSubAreaRef.current  = null
    setSelectedPipe(null)

    map.addSource('districts', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: districts.map(({ name, coordinates, subAreas, health }) => ({
          type: 'Feature',
          properties: { name, color: getHealthColor(health), subAreas: JSON.stringify(subAreas) },
          geometry: { type: 'Point', coordinates },
        })),
      },
    })
    addCircleLayers(map, 'districts')
    map.on('click', 'districts-circle', (e) => {
      const { name, subAreas } = e.features[0].properties
      activeDistrictRef.current = districts.find((d) => d.name === name)
      map.flyTo({ center: e.features[0].geometry.coordinates, zoom: 14, duration: 800 })
      setTimeout(() => { removeLayers(map, 'districts'); showSubAreas(map, name, JSON.parse(subAreas)) }, 800)
    })
    setCursor(map, 'districts-circle')
  }

  // ─── LEVEL 2 ───────────────────────────────────────────────────────────────
  function showSubAreas(map, districtName, subAreas) {
    viewStack.current = ['districts', 'subareas']

    map.addSource('subareas', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: subAreas.map(({ name, coordinates, pipelines, health }) => ({
          type: 'Feature',
          properties: { name, color: getHealthColor(health), pipelines: JSON.stringify(pipelines) },
          geometry: { type: 'Point', coordinates },
        })),
      },
    })
    addCircleLayers(map, 'subareas')
    map.on('click', 'subareas-circle', (e) => {
      const { name, pipelines } = e.features[0].properties
      activeSubAreaRef.current = { name, coordinates: e.features[0].geometry.coordinates }
      map.flyTo({ center: e.features[0].geometry.coordinates, zoom: 17, duration: 800 })
      setTimeout(() => { removeLayers(map, 'subareas'); showPipelines(map, JSON.parse(pipelines)) }, 800)
    })
    setCursor(map, 'subareas-circle')
  }

  // ─── LEVEL 3 ───────────────────────────────────────────────────────────────
  async function showPipelines(map, pipelines) {
    viewStack.current = ['districts', 'subareas', 'pipelines']
    activePipelineIds.current   = []
    activePipelinesData.current = pipelines
    setSelectedPipe(null)
    geometryCache.current = {}

    for (const pipeline of pipelines) {
      const { id, health, waypoints } = pipeline
      const color    = getHealthColor(health)
      const geometry = await getRoute(waypoints)
      geometryCache.current[id] = geometry

      // Line layer
      map.addSource(id, { type: 'geojson', data: { type: 'Feature', geometry } })
      map.addLayer({ id, type: 'line', source: id,
        paint: { 'line-color': color, 'line-width': 4, 'line-opacity': 0.95 },
        layout: { 'line-join': 'round', 'line-cap': 'round' } })

      // Invisible wide hit-area layer on top (easier to click a 25m line)
      map.addSource(`${id}-hit`, { type: 'geojson', data: { type: 'Feature', geometry } })
      map.addLayer({ id: `${id}-hit`, type: 'line', source: `${id}-hit`,
        paint: { 'line-color': 'transparent', 'line-width': 20, 'line-opacity': 0 },
        layout: { 'line-join': 'round', 'line-cap': 'round' } })

      // Endpoint joint dots
      const coords = geometry.coordinates
      const epId   = `${id}-endpoints`
      map.addSource(epId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: { pipeId: id }, geometry: { type: 'Point', coordinates: coords[0] } },
            { type: 'Feature', properties: { pipeId: id }, geometry: { type: 'Point', coordinates: coords[coords.length - 1] } },
          ],
        },
      })
      map.addLayer({ id: epId, type: 'circle', source: epId,
        paint: { 'circle-radius': 8, 'circle-color': '#ffffff',
          'circle-stroke-color': color, 'circle-stroke-width': 3 } })

      // ─── USE REF IN CLICK HANDLER — this is the fix ─────────────────────
      // Captures `pipeline` and `geometry` from loop scope (correct per iteration)
      // but calls drillRef.current which is ALWAYS the latest drillIntoPipe
      const handlePipeClick = (e) => {
        e.preventDefault()
        drillRef.current(map, pipeline, geometry)
      }

      map.on('click', `${id}-hit`, handlePipeClick)   // wide invisible hit area
      map.on('click', id,          handlePipeClick)   // visible line
      map.on('click', epId,        handlePipeClick)   // joint dots

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
    viewStack.current = ['districts', 'subareas', 'pipelines']
    setSelectedPipe(null)
  }

  // ─── BACK ──────────────────────────────────────────────────────────────────
  function handleBack() {
    const map     = mapInstance.current
    if (!map) return
    const current = viewStack.current[viewStack.current.length - 1]

    if (current === 'pipedetail') { closePipeDetail(); return }

    if (current === 'pipelines') {
      removeAllPipelineLayers(map, activePipelineIds.current)
      activePipelineIds.current   = []
      activePipelinesData.current = []
      geometryCache.current       = {}
      setSelectedPipe(null)
      const d = activeDistrictRef.current
      if (!d) return
      map.flyTo({ center: d.coordinates, zoom: 14, duration: 800 })
      setTimeout(() => showSubAreas(map, d.name, d.subAreas), 800)

    } else if (current === 'subareas') {
      removeLayers(map, 'subareas')
      activeDistrictRef.current = null
      activeSubAreaRef.current  = null
      map.flyTo({ center: [46.7167, 24.6833], zoom: 11, duration: 800 })
      setTimeout(() => showDistricts(map), 800)
    }
  }

  const currentView = viewStack.current[viewStack.current.length - 1]
  const backLabel   = { pipedetail: '← All Pipes', pipelines: '← Sub-Areas', subareas: '← Districts' }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Level 4 detail panel */}
      {selectedPipe && <PipeDetailPanel pipe={selectedPipe} onClose={closePipeDetail} />}

      {/* Back */}
      {currentView !== 'districts' && (
        <button onClick={handleBack} style={{
          position: 'absolute', top: 16, left: 16, zIndex: 10,
          padding: '7px 16px', background: '#fff', border: '1px solid #d1d5db',
          borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)', color: '#374151', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          {backLabel[currentView] ?? '← Back'}
        </button>
      )}

      {/* Breadcrumb */}
      {currentView !== 'districts' && (
        <div style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20,
          padding: '5px 14px', fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', whiteSpace: 'nowrap',
        }}>
          <span style={{ color: '#374151', fontWeight: 500 }}>{activeDistrictRef.current?.name}</span>
          {(currentView === 'pipelines' || currentView === 'pipedetail') && (<>
            <span style={{ color: '#d1d5db' }}>›</span>
            <span style={{ color: '#374151', fontWeight: 500 }}>{activeSubAreaRef.current?.name}</span>
          </>)}
          {currentView === 'pipedetail' && selectedPipe && (<>
            <span style={{ color: '#d1d5db' }}>›</span>
            <span style={{ color: getHealthColor(selectedPipe.health), fontWeight: 700 }}>{selectedPipe.id}</span>
          </>)}
        </div>
      )}

      {/* Health legend */}
      <div style={{
        position: 'absolute', top: 16, right: selectedPipe ? 366 : 16, zIndex: 10,
        background: '#fff', borderRadius: 8, padding: '12px 16px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.10)', transition: 'right .3s ease',
      }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 11, color: '#374151', letterSpacing: 1 }}>
          NETWORK HEALTH
        </p>
        {Object.entries(HEALTH_COLORS).map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 11, textTransform: 'capitalize', color: '#6b7280' }}>{label}</span>
          </div>
        ))}
        {currentView === 'pipelines' && !selectedPipe && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f3f4f6', fontSize: 10, color: '#9ca3af' }}>
            Click a segment to inspect
          </div>
        )}
      </div>

      {/* Segment list */}
      {currentView === 'pipelines' && !selectedPipe && activePipelinesData.current.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 24, left: 16, zIndex: 10, background: '#fff',
          borderRadius: 8, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          maxHeight: '45vh', overflowY: 'auto',
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 11, color: '#374151' }}>
            SEGMENTS — {activeSubAreaRef.current?.name?.toUpperCase()}
          </p>
          {activePipelinesData.current.map((pipe, i) => {
            const c = getHealthColor(pipe.health)
            return (
              <div key={pipe.id}
                onClick={() => drillRef.current(mapInstance.current, pipe, geometryCache.current[pipe.id])}
                style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                  cursor: 'pointer', padding: '5px 6px', borderRadius: 6, transition: 'background .15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                <div style={{ width: 20, height: 4, background: c, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff',
                  border: `2px solid ${c}`, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#374151' }}>Seg {i + 1}</span>
                <span style={{ fontSize: 10, color: c, fontWeight: 700, textTransform: 'capitalize',
                  marginLeft: 'auto', paddingLeft: 8 }}>{pipe.health}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MapboxMap