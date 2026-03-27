import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LandingPage.css'
import heroVideo from '../assets/sjs.mp4'
import iconLeak from '../assets/icon-leak.png'
import dashboard from '../assets/dashboard.png'
import iconSensor from '../assets/icon-sensor.png'
import iconNetwork from '../assets/icon-network.png'
import favicon from '../assets/favicon.png'
import RequestPilotModal from '../components/RequestPilotModal'

function IconSJS({ size = 22 }) {
  return <img src={favicon} width={size} height={size} alt="SJS" style={{ display: 'block' }} />
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [pilotOpen, setPilotOpen] = useState(false)

  return (
    <div className="lp">
      <RequestPilotModal open={pilotOpen} onClose={() => setPilotOpen(false)} />

      {/* ── Navbar ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <a className="lp-logo" href="#">
            <IconSJS />
            SJS
          </a>
          <div className="lp-nav-links">
            <a href="#problem">Problem</a>
            <a href="#solution">Solution</a>
            <a href="#how-it-works">How it works</a>
          </div>
          <div className="lp-nav-actions">
            <button className="lp-nav-signin" onClick={() => navigate('/login')}>Sign In</button>
            <button className="lp-nav-cta" onClick={() => setPilotOpen(true)}>Request a Pilot</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-badge">
            <span className="lp-badge-dot" />
            Real-time Pipeline Intelligence
          </div>

          <h1>
            Detect pipeline <span>failures</span><br />
            before they happen
          </h1>

          <p className="lp-hero-sub">
            SJS monitors water pipelines in real time using embedded sensors and AI —
            detecting structural anomalies, pressure drops, and leak signals before they become disasters.
          </p>

          <div className="lp-hero-ctas">
            <button className="lp-btn-primary" onClick={() => setPilotOpen(true)}>Request a Pilot</button>
            <button className="lp-btn-secondary" onClick={() => setPilotOpen(true)}>Talk to the Team</button>
          </div>

          <div className="lp-hero-features">
            <span>Joint-level precision</span>
            <span>AI anomaly detection</span>
            <span>Visual network map</span>
          </div>

          {/* Hero video */}
          <div className="lp-hero-img-wrap">
            <video
              src={heroVideo}
              className="lp-hero-img"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="lp-problem lp-section" id="problem">
        <div className="lp-section-inner">
          <div className="lp-problem-hero">
            <div className="lp-section-label">The Problem</div>
            <h2>Pipeline failures are reactive,<br />costly, and hard to detect</h2>
            <p className="lp-problem-sub">
              Water infrastructure teams are flying blind — discovering failures only after
              significant damage has already occurred.
            </p>
          </div>

          <div className="lp-problem-cards">
            <div className="lp-problem-card">
              <img src={iconLeak} alt="" className="lp-problem-icon-img" />
              <h3>Leaks go undetected until failure</h3>
              <p>
                Without real-time structural sensing, leaks often go unnoticed until major
                damage occurs — driving up costs and causing service disruption across entire districts.
              </p>
            </div>
            <div className="lp-problem-card">
              <img src={iconSensor} alt="" className="lp-problem-icon-img" />
              <h3>Existing systems lack structural insight</h3>
              <p>
                Legacy tools only capture basic flow metrics. They miss the acoustic and structural
                signals that precede joint failure — the ones that matter most.
              </p>
            </div>
            <div className="lp-problem-card">
              <img src={iconNetwork} alt="" className="lp-problem-icon-img" />
              <h3>No real-time network visibility</h3>
              <p>
                Infrastructure teams lack a unified view of pipeline health — making maintenance
                prioritization slow, manual, and expensive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Solution ── */}
      <section className="lp-solution lp-section" id="solution">
        <div className="lp-section-inner">
          <div className="lp-solution-grid">
            <div>
              <div className="lp-section-label blue">The Solution</div>
              <h2>A joint-level monitoring system for pipeline health</h2>
              <p className="lp-solution-sub">
                Sentinel Joint System installs at pipeline joints, continuously monitoring
                structural movement, acoustics, pressure, and moisture to detect anomalies
                early and prioritise maintenance before failure.
              </p>
              <div className="lp-solution-tags">
                {['Acoustic Sensing', 'Pressure Monitoring', 'Structural Movement',
                  'Moisture Detection', 'AI Anomaly Models', 'Visual Dashboard'].map(tag => (
                    <span key={tag} className="lp-solution-tag">{tag}</span>
                  ))}
              </div>
            </div>
            {/* <div className="lp-solution-visual"> */}
            {/* <img src={dashboard} alt="Sentinel Joint Sensor" className="lp-solution-img" /> */}
            <img src={dashboard} alt="Sentinel Joint Sensor" className="" style={{borderRadius:'16px'}}/>
            {/* </div> */}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="lp-how lp-section" id="how-it-works">
        <div className="lp-section-inner">
          <div className="lp-section-label" style={{ justifyContent: 'center' }}>How it Works</div>
          <h2>From raw signal to clear action</h2>
          <p className="lp-how-sub">
            Four steps from sensor installation to prioritised alerts your team can act on immediately.
          </p>

          <div className="lp-how-steps">
            {[
              {
                num: 1,
                title: 'Sensors collect real-time data',
                desc: 'Embedded sensors at pipeline joints continuously capture flow, pressure, acoustic, and structural movement data around the clock.'
              },
              {
                num: 2,
                title: 'AI analyses for anomalies',
                desc: 'Signals are normalised and processed through anomaly detection models that identify deviations from healthy baseline patterns.'
              },
              {
                num: 3,
                title: 'Network health is mapped',
                desc: 'Pipeline health across the active network is shown in a live dashboard — joint by joint, district to district, in real time.'
              },
              {
                num: 4,
                title: 'Teams receive clear alerts',
                desc: 'When intervention is needed, the system surfaces a prioritised alert with severity level, precise location, and full context.'
              }
            ].map(step => (
              <div key={step.num} className="lp-how-step">
                <div className="lp-how-step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pilot Phase ── */}
      <section className="lp-pilot">
        <div className="lp-pilot-card">
          <div className="lp-pilot-badge">
            <span className="lp-pilot-badge-dot" />
            Active Deployment
          </div>
          <h2>Currently in pilot phase</h2>
          <p>
            Sentinel Joint System is in early deployment and working with infrastructure
            partners to validate performance in real-world pipeline environments. We are
            actively onboarding pilot users and welcome teams ready to modernise their
            monitoring approach.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <div className="lp-cta-label">SJS Piloting</div>
          <h2>
            Interested in piloting<br />
            <span>Sentinel Joint System?</span>
          </h2>
          <p className="lp-cta-sub">
            Join infrastructure teams using real-time sensor data to get ahead of pipeline
            failures. Tell us about your network and we'll take it from there.
          </p>
          <div className="lp-cta-btns">
            <button className="lp-btn-white" onClick={() => setPilotOpen(true)}>Request a Demo</button>
            <button className="lp-btn-outline-white" onClick={() => setPilotOpen(true)}>Get in Touch</button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">
            <IconSJS />
            SJS
          </div>
          <div className="lp-footer-links">
            <a href="#problem">Problem</a>
            <a href="#solution">Solution</a>
            <a href="#how-it-works">How it works</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setPilotOpen(true) }}>Pilot</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setPilotOpen(true) }}>Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
