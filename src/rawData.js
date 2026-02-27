// ─────────────────────────────────────────────────────────────────────────────
// SJS — UNIFIED DATABASE
// Single source of truth for map, dashboard, district controller, and AI pages
// No backend — all data lives here. Replace with API calls later.
// ─────────────────────────────────────────────────────────────────────────────

// ─── HEALTH SYSTEM ───────────────────────────────────────────────────────────
// good     → pressure/flow normal, last inspected < 6 months
// warning  → minor pressure drop, inspection overdue, or flow irregularity
// critical → significant pressure loss, suspected leak, pipe age > 30yr

export const HEALTH = {
  GOOD:     'good',
  WARNING:  'warning',
  CRITICAL: 'critical',
}

export const HEALTH_COLORS = {
  good:     '#16a34a',   // green  — matches CSS --green
  warning:  '#f39c12',   // amber  — matches CSS --yellow
  critical: '#dc2626',   // red    — matches CSS --red
}

export const HEALTH_LABELS = {
  good:     'Optimal',
  warning:  'Monitor',
  critical: 'Critical',
}

export function getHealthColor(health) {
  return HEALTH_COLORS[health] ?? HEALTH_COLORS.good
}

export function getHealthLabel(health) {
  return HEALTH_LABELS[health] ?? 'Unknown'
}

// Rolls up child health array → parent health
export function computeHealth(items) {
  const statuses = items.map((i) => i.health)
  if (statuses.includes('critical')) return HEALTH.CRITICAL
  if (statuses.includes('warning'))  return HEALTH.WARNING
  return HEALTH.GOOD
}

// ─── JOINT SENSOR DATA ───────────────────────────────────────────────────────
// Each joint has live sensor readings.
// This matches the district controller's sensorData object.
// Key format: "{districtId}-{subareaId}-{pipelineId}-J{n}"

export const JOINT_SENSOR_DEFAULTS = {
  good: {
    // Flow
    flow:            '142 L/min',
    flowPct:         71,
    flowStatus:      'Normal',
    // Pressure
    pressure:        '3.2 bar',
    pressurePct:     64,
    pressureStatus:  'Normal',
    // Water level (% of pipe cross-section filled)
    waterLevel:      '78%',
    waterLevelPct:   78,
    waterLevelStatus:'Normal',
    // Acoustic (leak detection via ultrasound)
    acoustic:        '18 dB',
    acousticPct:     18,
    acousticStatus:  'Clear',
    // Pipe temperature
    temperature:     '22°C',
    temperaturePct:  44,
    temperatureStatus:'Normal',
    // Ground movement / vibration
    movementPct:     12,
    movementStatus:  'Stable',
    // Moisture (external pipe surface / surrounding soil)
    moisturePct:     8,
    moistureStatus:  'Dry',
    // Pipe health score (0–100)
    healthScore:     91,
    // Last inspection
    lastInspected:   '42 days ago',
    // Pipe age
    pipeAge:         '8 years',
    // Leak probability from ultrasound
    leakProbability: '2%',
    // Notes
    notes:           'All readings nominal. Next inspection in 48 days.',
  },
  warning: {
    flow:            '98 L/min',
    flowPct:         49,
    flowStatus:      'Below Normal',
    pressure:        '2.1 bar',
    pressurePct:     42,
    pressureStatus:  'Low',
    waterLevel:      '54%',
    waterLevelPct:   54,
    waterLevelStatus:'Below Normal',
    acoustic:        '44 dB',
    acousticPct:     44,
    acousticStatus:  'Elevated',
    temperature:     '26°C',
    temperaturePct:  52,
    temperatureStatus:'Slightly High',
    movementPct:     31,
    movementStatus:  'Minor Activity',
    moisturePct:     27,
    moistureStatus:  'Moist',
    healthScore:     58,
    lastInspected:   '94 days ago',
    pipeAge:         '19 years',
    leakProbability: '28%',
    notes:           'Pressure irregularity detected. Recommend inspection within 2 weeks.',
  },
  critical: {
    flow:            '41 L/min',
    flowPct:         21,
    flowStatus:      'Critical Low',
    pressure:        '0.9 bar',
    pressurePct:     18,
    pressureStatus:  'Critical',
    waterLevel:      '31%',
    waterLevelPct:   31,
    waterLevelStatus:'Critical Low',
    acoustic:        '78 dB',
    acousticPct:     78,
    acousticStatus:  'Fracture Signature',
    temperature:     '31°C',
    temperaturePct:  62,
    temperatureStatus:'High',
    movementPct:     67,
    movementStatus:  'High Activity',
    moisturePct:     71,
    moistureStatus:  'Saturated',
    healthScore:     22,
    lastInspected:   '210 days ago',
    pipeAge:         '31 years',
    leakProbability: '87%',
    notes:           'URGENT: Acoustic signature indicates micro-fracture. Immediate field inspection required.',
  },
}

// ─── MAP GEOMETRY HELPERS ─────────────────────────────────────────────────────
// ~25 meters per step at Riyadh latitude
const STEP = 0.000225

// Builds a chain of N pipelines starting at [lng, lat].
// Each pipeline = one ~25m segment (one joint to next).
// alternateDir: if true, snakes the pipe in a slightly realistic path
function makeChain(prefix, lng, lat, healths, bearing = 'east') {
  const dirs = {
    east:      [STEP,        0],
    northeast: [STEP * 0.7,  STEP * 0.7],
    north:     [0,           STEP],
    southeast: [STEP * 0.7, -STEP * 0.7],
    south:     [0,          -STEP],
  }
  const [dl, db] = dirs[bearing] ?? dirs.east

  let curLng = lng
  let curLat = lat

  return healths.map((health, i) => {
    // slight wobble for realism
    const wobbleLng = (i % 3 === 1) ?  STEP * 0.08 : 0
    const wobbleLat = (i % 4 === 2) ? -STEP * 0.06 : 0
    const start = [curLng, curLat]
    curLng += dl + wobbleLng
    curLat += db + wobbleLat
    const end = [curLng, curLat]
    return {
      id:        `${prefix}-p${i + 1}`,
      health,
      color:     getHealthColor(health),
      jointNo:   i + 1,
      waypoints: [start, end],
      sensor:    { ...JOINT_SENSOR_DEFAULTS[health] },
    }
  })
}

// ─── RAW DISTRICT + SUBAREA + PIPELINE DATA ──────────────────────────────────
// Districts map 1:1 to dashboard "District N" labels via districtId
// Pipeline health arrays represent per-joint sensor status

const rawDistricts = [

  // ── D1 · Al Olaya ────────────────────────────────────────────────────────
  {
    id:          'D1',
    name:        'Al Olaya',
    coordinates: [46.6863, 24.6916],
    subAreas: [
      {
        id:          'D1-SA1',
        name:        'Kingdom Tower Area',
        coordinates: [46.6830, 24.6953],
        pipelines: makeChain('D1-SA1', 46.6815, 24.6948, [
          'good','good','warning','good','good',
          'warning','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D1-SA2',
        name:        'Al Faisaliyah Area',
        coordinates: [46.6882, 24.6895],
        pipelines: makeChain('D1-SA2', 46.6867, 24.6890, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D1-SA3',
        name:        'Star Ave Area',
        coordinates: [46.6791, 24.6940],
        pipelines: makeChain('D1-SA3', 46.6776, 24.6935, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'northeast'),
      },
      {
        id:          'D1-SA4',
        name:        'Al Olaya North',
        coordinates: [46.6863, 24.7010],
        pipelines: makeChain('D1-SA4', 46.6848, 24.7005, [
          'good','good','good','warning','good',
          'good','good','warning','good','good',
        ], 'east'),
      },
    ],
  },

  // ── D2 · Al Malaz ────────────────────────────────────────────────────────
  {
    id:          'D2',
    name:        'Al Malaz',
    coordinates: [46.7184, 24.6568],
    subAreas: [
      {
        id:          'D2-SA1',
        name:        'Prince Faisal Stadium',
        coordinates: [46.7215, 24.6601],
        pipelines: makeChain('D2-SA1', 46.7200, 24.6596, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D2-SA2',
        name:        'Al Malaz Park Area',
        coordinates: [46.7150, 24.6555],
        pipelines: makeChain('D2-SA2', 46.7135, 24.6550, [
          'good','warning','critical','warning','good',
          'critical','warning','good','good','warning',
        ], 'east'),
      },
      {
        id:          'D2-SA3',
        name:        'Al Malaz North',
        coordinates: [46.7180, 24.6620],
        pipelines: makeChain('D2-SA3', 46.7165, 24.6615, [
          'good','good','warning','good','good',
          'good','warning','good','good','good',
        ], 'east'),
      },
      {
        id:          'D2-SA4',
        name:        'Al Malaz South',
        coordinates: [46.7200, 24.6510],
        pipelines: makeChain('D2-SA4', 46.7185, 24.6505, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
    ],
  },

  // ── D3 · Al Murabba ──────────────────────────────────────────────────────
  {
    id:          'D3',
    name:        'Al Murabba',
    coordinates: [46.7108, 24.6921],
    subAreas: [
      {
        id:          'D3-SA1',
        name:        'National Museum Area',
        coordinates: [46.7133, 24.6950],
        pipelines: makeChain('D3-SA1', 46.7118, 24.6945, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D3-SA2',
        name:        'Murabba Palace Area',
        coordinates: [46.7080, 24.6900],
        pipelines: makeChain('D3-SA2', 46.7065, 24.6895, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'northeast'),
      },
      {
        id:          'D3-SA3',
        name:        'Al Murabba North',
        coordinates: [46.7100, 24.6980],
        pipelines: makeChain('D3-SA3', 46.7085, 24.6975, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D3-SA4',
        name:        'Al Murabba East',
        coordinates: [46.7160, 24.6921],
        pipelines: makeChain('D3-SA4', 46.7145, 24.6916, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
    ],
  },

  // ── D4 · Al Wurud ────────────────────────────────────────────────────────
  {
    id:          'D4',
    name:        'Al Wurud',
    coordinates: [46.6680, 24.7100],
    subAreas: [
      {
        id:          'D4-SA1',
        name:        'Wurud North',
        coordinates: [46.6650, 24.7160],
        pipelines: makeChain('D4-SA1', 46.6635, 24.7155, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D4-SA2',
        name:        'Wurud South',
        coordinates: [46.6650, 24.7040],
        pipelines: makeChain('D4-SA2', 46.6635, 24.7035, [
          'good','warning','good','warning','good',
          'good','warning','good','good','good',
        ], 'east'),
      },
      {
        id:          'D4-SA3',
        name:        'Wurud East',
        coordinates: [46.6730, 24.7100],
        pipelines: makeChain('D4-SA3', 46.6715, 24.7095, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'northeast'),
      },
      {
        id:          'D4-SA4',
        name:        'Wurud Center',
        coordinates: [46.6680, 24.7100],
        pipelines: makeChain('D4-SA4', 46.6665, 24.7095, [
          'good','good','warning','good','good',
          'good','good','warning','good','good',
        ], 'east'),
      },
    ],
  },

  // ── D5 · Al Sahafa ───────────────────────────────────────────────────────
  {
    id:          'D5',
    name:        'Al Sahafa',
    coordinates: [46.6380, 24.7580],
    subAreas: [
      {
        id:          'D5-SA1',
        name:        'Sahafa North',
        coordinates: [46.6330, 24.7650],
        pipelines: makeChain('D5-SA1', 46.6315, 24.7645, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D5-SA2',
        name:        'Sahafa South',
        coordinates: [46.6330, 24.7510],
        pipelines: makeChain('D5-SA2', 46.6315, 24.7505, [
          'warning','critical','critical','warning','good',
          'critical','warning','good','warning','good',
        ], 'east'),
      },
      {
        id:          'D5-SA3',
        name:        'Sahafa East',
        coordinates: [46.6430, 24.7580],
        pipelines: makeChain('D5-SA3', 46.6415, 24.7575, [
          'good','warning','good','good','warning',
          'good','good','good','warning','good',
        ], 'northeast'),
      },
      {
        id:          'D5-SA4',
        name:        'Sahafa Center',
        coordinates: [46.6380, 24.7580],
        pipelines: makeChain('D5-SA4', 46.6365, 24.7575, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
    ],
  },

  // ── D6 · Al Nakheel ──────────────────────────────────────────────────────
  {
    id:          'D6',
    name:        'Al Nakheel',
    coordinates: [46.6450, 24.7780],
    subAreas: [
      {
        id:          'D6-SA1',
        name:        'Nakheel Mall Area',
        coordinates: [46.6480, 24.7750],
        pipelines: makeChain('D6-SA1', 46.6465, 24.7745, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D6-SA2',
        name:        'Nakheel North',
        coordinates: [46.6420, 24.7850],
        pipelines: makeChain('D6-SA2', 46.6405, 24.7845, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D6-SA3',
        name:        'Nakheel South',
        coordinates: [46.6420, 24.7710],
        pipelines: makeChain('D6-SA3', 46.6405, 24.7705, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'northeast'),
      },
      {
        id:          'D6-SA4',
        name:        'Nakheel East',
        coordinates: [46.6530, 24.7780],
        pipelines: makeChain('D6-SA4', 46.6515, 24.7775, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
    ],
  },

  // ── D7 · Al Rawdah ───────────────────────────────────────────────────────
  {
    id:          'D7',
    name:        'Al Rawdah',
    coordinates: [46.6600, 24.7200],
    subAreas: [
      {
        id:          'D7-SA1',
        name:        'Rawdah North',
        coordinates: [46.6570, 24.7270],
        pipelines: makeChain('D7-SA1', 46.6555, 24.7265, [
          'good','warning','good','good','warning',
          'good','good','good','good','warning',
        ], 'east'),
      },
      {
        id:          'D7-SA2',
        name:        'Rawdah South',
        coordinates: [46.6570, 24.7130],
        pipelines: makeChain('D7-SA2', 46.6555, 24.7125, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D7-SA3',
        name:        'Rawdah East',
        coordinates: [46.6660, 24.7200],
        pipelines: makeChain('D7-SA3', 46.6645, 24.7195, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'north'),
      },
      {
        id:          'D7-SA4',
        name:        'Rawdah West',
        coordinates: [46.6530, 24.7200],
        pipelines: makeChain('D7-SA4', 46.6515, 24.7195, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
    ],
  },

  // ── D8 · Al Naseem ───────────────────────────────────────────────────────
  {
    id:          'D8',
    name:        'Al Naseem',
    coordinates: [46.7750, 24.7050],
    subAreas: [
      {
        id:          'D8-SA1',
        name:        'Naseem North',
        coordinates: [46.7720, 24.7120],
        pipelines: makeChain('D8-SA1', 46.7705, 24.7115, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D8-SA2',
        name:        'Naseem South',
        coordinates: [46.7720, 24.6980],
        pipelines: makeChain('D8-SA2', 46.7705, 24.6975, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D8-SA3',
        name:        'Naseem East',
        coordinates: [46.7820, 24.7050],
        pipelines: makeChain('D8-SA3', 46.7805, 24.7045, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'northeast'),
      },
      {
        id:          'D8-SA4',
        name:        'Naseem Center',
        coordinates: [46.7750, 24.7050],
        pipelines: makeChain('D8-SA4', 46.7735, 24.7045, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
    ],
  },

  // ── D9 · Al Shifa ────────────────────────────────────────────────────────
  {
    id:          'D9',
    name:        'Al Shifa',
    coordinates: [46.7280, 24.5900],
    subAreas: [
      {
        id:          'D9-SA1',
        name:        'Shifa North',
        coordinates: [46.7250, 24.5970],
        pipelines: makeChain('D9-SA1', 46.7235, 24.5965, [
          'critical','warning','critical','good','warning',
          'critical','good','warning','good','good',
        ], 'east'),
      },
      {
        id:          'D9-SA2',
        name:        'Shifa South',
        coordinates: [46.7250, 24.5830],
        pipelines: makeChain('D9-SA2', 46.7235, 24.5825, [
          'good','warning','good','good','good',
          'warning','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D9-SA3',
        name:        'Shifa East',
        coordinates: [46.7340, 24.5900],
        pipelines: makeChain('D9-SA3', 46.7325, 24.5895, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'north'),
      },
      {
        id:          'D9-SA4',
        name:        'Shifa Center',
        coordinates: [46.7280, 24.5900],
        pipelines: makeChain('D9-SA4', 46.7265, 24.5895, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
    ],
  },

  // ── D10 · Al Sulimaniyah ─────────────────────────────────────────────────
  {
    id:          'D10',
    name:        'Al Sulimaniyah',
    coordinates: [46.6780, 24.7020],
    subAreas: [
      {
        id:          'D10-SA1',
        name:        'Sulimaniyah North',
        coordinates: [46.6760, 24.7080],
        pipelines: makeChain('D10-SA1', 46.6745, 24.7075, [
          'good','warning','good','good','good',
          'warning','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D10-SA2',
        name:        'Sulimaniyah South',
        coordinates: [46.6760, 24.6960],
        pipelines: makeChain('D10-SA2', 46.6745, 24.6955, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
      {
        id:          'D10-SA3',
        name:        'Sulimaniyah East',
        coordinates: [46.6830, 24.7020],
        pipelines: makeChain('D10-SA3', 46.6815, 24.7015, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'northeast'),
      },
      {
        id:          'D10-SA4',
        name:        'Sulimaniyah West',
        coordinates: [46.6720, 24.7020],
        pipelines: makeChain('D10-SA4', 46.6705, 24.7015, [
          'good','good','good','good','good',
          'good','good','good','good','good',
        ], 'east'),
      },
    ],
  },
]

// ─── COMPUTE HEALTH BOTTOM-UP ────────────────────────────────────────────────
export const districts = rawDistricts.map((district) => {
  const subAreas = district.subAreas.map((subArea) => {
    const health = computeHealth(subArea.pipelines)
    return { ...subArea, health }
  })
  const health = computeHealth(subAreas)
  return { ...district, subAreas, health }
})

// ─── DISTRICT LOOKUP MAP ─────────────────────────────────────────────────────
// Quick access by ID: districtMap['D1'] → district object
export const districtMap = Object.fromEntries(districts.map((d) => [d.id, d]))


// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD DATA
// ─────────────────────────────────────────────────────────────────────────────

// ─── OVERALL NETWORK HEALTH ──────────────────────────────────────────────────
// Derived from district health counts. Used in dashboard banner.
export const networkHealth = (() => {
  const total    = districts.length
  const critical = districts.filter((d) => d.health === 'critical').length
  const warning  = districts.filter((d) => d.health === 'warning').length
  const good     = districts.filter((d) => d.health === 'good').length
  const score    = Math.round(((good * 100 + warning * 60 + critical * 10) / (total * 100)) * 100)
  const status   = critical > 0 ? 'critical' : warning > 0 ? 'warning' : 'good'
  return { score, total, critical, warning, good, status }
})()

// ─── INCIDENTS ───────────────────────────────────────────────────────────────
export const incidents = [
  {
    id:         '#INC-0482',
    districtId: 'D5',
    subareaId:  'D5-SA2',
    pipelineId: 'D5-SA2-p2',
    type:       'Pipeline Leak',
    aiConfidence: 90,
    aiBreakdown: [
      { label: 'Pipeline Leak',       pct: 90 },
      { label: 'Pressure Anomaly',    pct: 7  },
      { label: 'Sensor Fault',        pct: 3  },
    ],
    severity:    'critical',
    duration:    '2.6 hr',
    startTime:   '08:42',
    status:      'critical',
    description: 'Significant pressure loss detected between joints 2–3. Suspected pipe fracture.',
  },
  {
    id:         '#INC-0481',
    districtId: 'D2',
    subareaId:  'D2-SA2',
    pipelineId: 'D2-SA2-p3',
    type:       'Pressure Drop',
    aiConfidence: 76,
    aiBreakdown: [
      { label: 'Pressure Drop',       pct: 76 },
      { label: 'Partial Blockage',    pct: 15 },
      { label: 'Valve Failure',       pct: 9  },
    ],
    severity:    'critical',
    duration:    '1.6 hr',
    startTime:   '09:58',
    status:      'critical',
    description: 'Pressure dropped below threshold on Al Malaz Park main line.',
  },
  {
    id:         '#INC-0475',
    districtId: 'D9',
    subareaId:  'D9-SA1',
    pipelineId: 'D9-SA1-p1',
    type:       'Flow Anomaly',
    aiConfidence: 83,
    aiBreakdown: [
      { label: 'Unauthorized Draw',   pct: 83 },
      { label: 'Wear/Tear Leak',      pct: 12 },
      { label: 'Vibration Damage',    pct: 5  },
    ],
    severity:    'critical',
    duration:    '3.1 hr',
    startTime:   '08:26',
    status:      'critical',
    description: 'Abnormal flow rate detected. Possible unauthorized connection or theft.',
  },
  {
    id:         '#INC-0483',
    districtId: 'D1',
    subareaId:  'D1-SA1',
    pipelineId: 'D1-SA1-p3',
    type:       'Moisture',
    aiConfidence: 61,
    aiBreakdown: [
      { label: 'Ground Moisture',     pct: 61 },
      { label: 'Minor Seepage',       pct: 29 },
      { label: 'Condensation',        pct: 10 },
    ],
    severity:    'warning',
    duration:    '0.6 hr',
    startTime:   '10:22',
    status:      'live',
    description: 'Elevated moisture reading at joint 3, Kingdom Tower Area.',
  },
  {
    id:         '#INC-0484',
    districtId: 'D4',
    subareaId:  'D4-SA2',
    pipelineId: 'D4-SA2-p2',
    type:       'Flow Drop',
    aiConfidence: 58,
    aiBreakdown: [
      { label: 'Partial Blockage',    pct: 58 },
      { label: 'Valve Narrowing',     pct: 27 },
      { label: 'Sediment Build-up',   pct: 15 },
    ],
    severity:    'warning',
    duration:    '0.4 hr',
    startTime:   '11:05',
    status:      'live',
    description: 'Flow rate down 30% in Wurud South sector.',
  },
  {
    id:         '#INC-0485',
    districtId: 'D7',
    subareaId:  'D7-SA1',
    pipelineId: 'D7-SA1-p2',
    type:       'Movement',
    aiConfidence: 52,
    aiBreakdown: [
      { label: 'Ground Shift',        pct: 52 },
      { label: 'Heavy Traffic',       pct: 33 },
      { label: 'Construction Nearby', pct: 15 },
    ],
    severity:    'warning',
    duration:    '0.2 hr',
    startTime:   '11:40',
    status:      'live',
    description: 'Vibration/movement sensor triggered in Rawdah North.',
  },
]

export const criticalIncidents = incidents.filter((i) => i.status === 'critical')
export const liveIncidents     = incidents.filter((i) => i.status === 'live')

// ─── RESPONSE TIMES PER DISTRICT ─────────────────────────────────────────────
// Used in dashboard bar chart. Matches HTML distResp array.
export const responseTimesPerDistrict = [
  { districtId: 'D1', label: 'D1', avgHours: 0.8,  trend: 'Improving', health: 'good'     },
  { districtId: 'D2', label: 'D2', avgHours: 1.1,  trend: 'Stable',    health: 'good'     },
  { districtId: 'D3', label: 'D3', avgHours: 1.9,  trend: 'Worsening', health: 'warning'  },
  { districtId: 'D4', label: 'D4', avgHours: 1.2,  trend: 'Stable',    health: 'good'     },
  { districtId: 'D5', label: 'D5', avgHours: 2.4,  trend: 'Critical',  health: 'critical' },
  { districtId: 'D6', label: 'D6', avgHours: 0.9,  trend: 'Improving', health: 'good'     },
  { districtId: 'D7', label: 'D7', avgHours: 1.4,  trend: 'Stable',    health: 'warning'  },
  { districtId: 'D8', label: 'D8', avgHours: 0.7,  trend: 'Improving', health: 'good'     },
  { districtId: 'D9', label: 'D9', avgHours: 2.1,  trend: 'Worsening', health: 'critical' },
  { districtId: 'D10',label: 'D10',avgHours: 1.3,  trend: 'Stable',    health: 'warning'  },
]

// ─── COMPLETED TASKS ─────────────────────────────────────────────────────────
export const completedTasks = [
  { districtId: 'D1',  today: 12, pending: 1,  overdue: 0, rate: 92 },
  { districtId: 'D2',  today: 9,  pending: 2,  overdue: 0, rate: 82 },
  { districtId: 'D3',  today: 7,  pending: 4,  overdue: 1, rate: 58 },
  { districtId: 'D4',  today: 10, pending: 1,  overdue: 0, rate: 83 },
  { districtId: 'D5',  today: 6,  pending: 5,  overdue: 2, rate: 46 },
  { districtId: 'D6',  today: 4,  pending: 0,  overdue: 0, rate: 100},
  { districtId: 'D7',  today: 8,  pending: 2,  overdue: 0, rate: 80 },
  { districtId: 'D8',  today: 11, pending: 1,  overdue: 0, rate: 88 },
  { districtId: 'D9',  today: 5,  pending: 6,  overdue: 3, rate: 38 },
  { districtId: 'D10', today: 9,  pending: 2,  overdue: 0, rate: 77 },
]

// ─── NET GAINS ───────────────────────────────────────────────────────────────
export const netGains = [
  { districtId: 'D1',  todayK: 62,  mtdM: 1.2, ytdM: 8.4,  trendPct: +34, trend: 'up'   },
  { districtId: 'D2',  todayK: 44,  mtdM: 0.9, ytdM: 6.1,  trendPct: +22, trend: 'up'   },
  { districtId: 'D3',  todayK: 38,  mtdM: 0.7, ytdM: 4.8,  trendPct:   0, trend: 'flat' },
  { districtId: 'D4',  todayK: 51,  mtdM: 1.0, ytdM: 7.2,  trendPct: +18, trend: 'up'   },
  { districtId: 'D5',  todayK: 57,  mtdM: 1.1, ytdM: 7.9,  trendPct:  -8, trend: 'down' },
  { districtId: 'D6',  todayK: 32,  mtdM: 0.6, ytdM: 4.1,  trendPct: +41, trend: 'up'   },
  { districtId: 'D7',  todayK: 40,  mtdM: 0.8, ytdM: 5.5,  trendPct: +10, trend: 'up'   },
  { districtId: 'D8',  todayK: 55,  mtdM: 1.1, ytdM: 7.6,  trendPct: +28, trend: 'up'   },
  { districtId: 'D9',  todayK: 29,  mtdM: 0.5, ytdM: 3.7,  trendPct: -15, trend: 'down' },
  { districtId: 'D10', todayK: 43,  mtdM: 0.8, ytdM: 5.9,  trendPct:  +5, trend: 'up'   },
]

// ─── OVERALL KPI SUMMARY ─────────────────────────────────────────────────────
// Used in dashboard top KPI cards
export const kpiSummary = {
  criticalCount:    criticalIncidents.length,
  liveCount:        liveIncidents.length,
  avgResponseHours: +(responseTimesPerDistrict.reduce((s,d) => s + d.avgHours, 0) / responseTimesPerDistrict.length).toFixed(1),
  completedToday:   completedTasks.reduce((s, d) => s + d.today, 0),
  totalNetGainTodayK: netGains.reduce((s, d) => s + d.todayK, 0),
}


// ─────────────────────────────────────────────────────────────────────────────
// AI PREDICTIVE ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

export const aiPredictions = [
  {
    districtId:      'D5',
    subareaId:       'D5-SA2',
    pipelineId:      'D5-SA2-p2',
    severity:        'critical',
    daysUntilEvent:  5,
    probability:     94,
    predictedType:   'Pipe Burst',
    contributingFactors: [
      'Pipe age exceeds 30 years',
      'Pressure fluctuations over 6 months',
      'Joint 2 showing acoustic signature of micro-fracture',
    ],
    leakLikelihood:  94,
    failureLikelihood: 87,
    degradationRatePerMonth: 4.2,
    recommendation:  'URGENT: Schedule excavation within 72 hours. Focus on joint 2–3 segment.',
    coordinates:     [46.6316, 24.7506],
  },
  {
    districtId:      'D9',
    subareaId:       'D9-SA1',
    pipelineId:      'D9-SA1-p1',
    severity:        'critical',
    daysUntilEvent:  9,
    probability:     88,
    predictedType:   'Major Leak',
    contributingFactors: [
      'Acoustic readings elevated for 3 weeks',
      'Flow inconsistency detected at joint 1',
      'Historical leak in same corridor in 2021',
    ],
    leakLikelihood:  88,
    failureLikelihood: 74,
    degradationRatePerMonth: 3.8,
    recommendation:  'Inspect joints 1–3. Deploy acoustic sensor sweep before weekend.',
    coordinates:     [46.7236, 24.5966],
  },
  {
    districtId:      'D2',
    subareaId:       'D2-SA2',
    pipelineId:      'D2-SA2-p6',
    severity:        'critical',
    daysUntilEvent:  12,
    probability:     81,
    predictedType:   'Pressure Failure',
    contributingFactors: [
      'Critical joint flagged at position 6',
      'Downstream pressure 40% below baseline',
      'Corrosion pattern consistent with imminent failure',
    ],
    leakLikelihood:  81,
    failureLikelihood: 69,
    degradationRatePerMonth: 3.1,
    recommendation:  'Replace segment D2-SA2-p6. Temporary pressure reduction recommended.',
    coordinates:     [46.7148, 24.6551],
  },
  {
    districtId:      'D1',
    subareaId:       'D1-SA1',
    pipelineId:      'D1-SA1-p3',
    severity:        'warning',
    daysUntilEvent:  30,
    probability:     62,
    predictedType:   'Minor Seepage',
    contributingFactors: [
      'Moisture sensor elevated since last month',
      'Joint 3 showing slight pressure gradient',
    ],
    leakLikelihood:  62,
    failureLikelihood: 35,
    degradationRatePerMonth: 1.4,
    recommendation:  'Schedule routine inspection within 2 weeks.',
    coordinates:     [46.6817, 24.6949],
  },
  {
    districtId:      'D4',
    subareaId:       'D4-SA2',
    pipelineId:      'D4-SA2-p2',
    severity:        'warning',
    daysUntilEvent:  21,
    probability:     55,
    predictedType:   'Flow Restriction',
    contributingFactors: [
      'Sediment build-up pattern detected',
      'Flow rate declining 2% per week',
    ],
    leakLikelihood:  40,
    failureLikelihood: 55,
    degradationRatePerMonth: 1.8,
    recommendation:  'Schedule flushing operation for Wurud South within 3 weeks.',
    coordinates:     [46.6636, 24.7036],
  },
  {
    districtId:      'D7',
    subareaId:       'D7-SA1',
    pipelineId:      'D7-SA1-p2',
    severity:        'warning',
    daysUntilEvent:  45,
    probability:     48,
    predictedType:   'Ground Movement Impact',
    contributingFactors: [
      'Vibration readings above baseline',
      'New construction detected nearby',
    ],
    leakLikelihood:  38,
    failureLikelihood: 48,
    degradationRatePerMonth: 1.1,
    recommendation:  'Monitor weekly. Alert construction team of pipe proximity.',
    coordinates:     [46.6556, 24.7266],
  },
  {
    districtId:      'D10',
    subareaId:       'D10-SA1',
    pipelineId:      'D10-SA1-p2',
    severity:        'warning',
    daysUntilEvent:  60,
    probability:     44,
    predictedType:   'Age-related Degradation',
    contributingFactors: [
      'Pipe segment age 22 years',
      'Warning reading on joint 2 and 6',
    ],
    leakLikelihood:  44,
    failureLikelihood: 38,
    degradationRatePerMonth: 0.9,
    recommendation:  'Include in next quarterly maintenance cycle.',
    coordinates:     [46.6746, 24.7076],
  },
]

export const aiPredictionsSummary = {
  critical: aiPredictions.filter((p) => p.severity === 'critical').length,
  warning:  aiPredictions.filter((p) => p.severity === 'warning').length,
  total:    aiPredictions.length,
}


// ─────────────────────────────────────────────────────────────────────────────
// DISTRICT CONTROLLER / MAP INFO DATA
// Combined stats per district for the map tooltip / district info panel
// ─────────────────────────────────────────────────────────────────────────────

export const districtStats = districts.map((d) => {
  const rt    = responseTimesPerDistrict.find((r) => r.districtId === d.id)
  const tasks = completedTasks.find((t) => t.districtId === d.id)
  const gains = netGains.find((g) => g.districtId === d.id)
  const dInc  = incidents.filter((i) => i.districtId === d.id)
  const aiP   = aiPredictions.filter((p) => p.districtId === d.id)

  return {
    id:              d.id,
    name:            d.name,
    health:          d.health,
    healthLabel:     getHealthLabel(d.health),
    healthColor:     getHealthColor(d.health),
    criticalCount:   dInc.filter((i) => i.status === 'critical').length,
    liveCount:       dInc.filter((i) => i.status === 'live').length,
    avgResponseHrs:  rt?.avgHours ?? 0,
    responseTrend:   rt?.trend ?? 'Stable',
    taskRate:        tasks?.rate ?? 0,
    todayNetGainK:   gains?.todayK ?? 0,
    aiPredictions:   aiP,
    aiCriticalCount: aiP.filter((p) => p.severity === 'critical').length,
    // Sector data for district controller page (A/B/C/D map areas)
    sectors: d.subAreas.map((sa, i) => ({
      letter:      ['A','B','C','D'][i] ?? String(i),
      id:          sa.id,
      name:        sa.name,
      health:      sa.health,
      status:      getHealthLabel(sa.health),
      statusColor: getHealthColor(sa.health),
      incidentCount: dInc.filter((inc) => inc.subareaId === sa.id).length,
      responseHrs: rt?.avgHours ?? 0,
    })),
  }
})

export const districtStatsMap = Object.fromEntries(districtStats.map((d) => [d.id, d]))