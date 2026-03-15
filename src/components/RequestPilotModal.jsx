import { useState, useEffect, useRef } from 'react'
import client from '../api/client'
import './RequestPilotModal.css'

const INITIAL = { name: '', email: '', organisation: '', phone: '', networkSize: '', message: '' }

export default function RequestPilotModal({ open, onClose }) {
  const [form, setForm]       = useState(INITIAL)
  const [status, setStatus]   = useState('idle') // idle | sending | success | error
  const [errors, setErrors]   = useState({})
  const firstRef              = useRef(null)

  // Lock body scroll & focus first field when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => firstRef.current?.focus(), 80)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function handleClose() {
    if (status === 'sending') return
    onClose()
    // Reset after close animation
    setTimeout(() => { setForm(INITIAL); setErrors({}); setStatus('idle') }, 300)
  }

  function validate() {
    const e = {}
    if (!form.name.trim())         e.name         = 'Full name is required'
    if (!form.email.trim())        e.email        = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.organisation.trim()) e.organisation = 'Organisation is required'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStatus('sending')

    try {
      await client.post('/pilot-requests', {
        fullName:    form.name,
        email:       form.email,
        organisation: form.organisation,
        phone:       form.phone || undefined,
        networkSize: form.networkSize || undefined,
        message:     form.message || undefined,
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  function field(id, label, type = 'text', placeholder = '', required = false, hint = '') {
    return (
      <div className="rpm-field">
        <label htmlFor={id}>
          {label}
          {required && <span className="rpm-required">*</span>}
        </label>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={form[id]}
          ref={id === 'name' ? firstRef : undefined}
          onChange={(e) => setForm((p) => ({ ...p, [id]: e.target.value }))}
          className={errors[id] ? 'rpm-input-error' : ''}
          autoComplete={type === 'email' ? 'email' : 'off'}
        />
        {errors[id] && <span className="rpm-error-msg">{errors[id]}</span>}
        {hint && !errors[id] && <span className="rpm-hint">{hint}</span>}
      </div>
    )
  }

  if (!open) return null

  return (
    <div className="rpm-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="rpm-modal" role="dialog" aria-modal="true" aria-labelledby="rpm-title">

        {/* Header */}
        <div className="rpm-header">
          <div className="rpm-header-left">
            <div className="rpm-badge">
              <span className="rpm-badge-dot" />
              Pilot Programme
            </div>
            <h2 id="rpm-title">Request a Pilot</h2>
            <p>Tell us about your network and we'll be in touch within 24 hours.</p>
          </div>
          <button className="rpm-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {/* Success state */}
        {status === 'success' ? (
          <div className="rpm-success">
            <div className="rpm-success-icon">✓</div>
            <h3>Request received!</h3>
            <p>Thanks, <strong>{form.name}</strong>. We'll reach out to <strong>{form.email}</strong> within 24 hours.</p>
            <button className="rpm-btn-primary" onClick={handleClose}>Close</button>
          </div>
        ) : (
          <form className="rpm-form" onSubmit={handleSubmit} noValidate>
            <div className="rpm-form-grid">
              {field('name',         'Full Name',        'text',  'Jane Smith',                   true)}
              {field('email',        'Email Address',    'email', 'jane@organisation.com',         true)}
              {field('organisation', 'Organisation',     'text',  'City Water Authority',          true)}
              {field('phone',        'Phone',            'tel',   '+1 (555) 000-0000',             false)}
              {field('networkSize',  'Network Size',     'text',  'e.g. 500 km of pipelines',     false, 'Approximate length or number of monitored assets')}
            </div>

            <div className="rpm-field rpm-field--full">
              <label htmlFor="message">Message <span className="rpm-optional">(optional)</span></label>
              <textarea
                id="message"
                rows={3}
                placeholder="Anything else you'd like us to know about your infrastructure or goals..."
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              />
            </div>

            {status === 'error' && (
              <div className="rpm-submit-error">
                Something went wrong. Please try again or email us directly.
              </div>
            )}

            <div className="rpm-footer">
              <p className="rpm-privacy">
                🔒 Your details are only used to respond to this request.
              </p>
              <div className="rpm-footer-btns">
                <button type="button" className="rpm-btn-secondary" onClick={handleClose} disabled={status === 'sending'}>
                  Cancel
                </button>
                <button type="submit" className="rpm-btn-primary" disabled={status === 'sending'}>
                  {status === 'sending'
                    ? <><span className="rpm-spinner" /> Sending…</>
                    : 'Send Request'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
