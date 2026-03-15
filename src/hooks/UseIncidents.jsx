import { useState, useEffect } from 'react'
import client from '../api/client'

// All incidents — optionally filter by status or district
export function useIncidents({ status, district, severity } = {}) {
    const [incidents, setIncidents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const params = {}
        if (status) params.status = status
        if (district) params.district = district
        if (severity) params.severity = severity

        client.get('/incidents', { params })
            .then((res) => setIncidents(res.data.data))
            .catch(setError)
            .finally(() => setLoading(false))
    }, [status, district, severity])

    return { incidents, loading, error }
}

// Single incident with AI breakdown
export function useIncident(id) {
    const [incident, setIncident] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!id) return
        setLoading(true)
        client.get(`/incidents/${id}`)
            .then((res) => setIncident(res.data.data))
            .catch(setError)
            .finally(() => setLoading(false))
    }, [id])

    return { incident, loading, error }
}