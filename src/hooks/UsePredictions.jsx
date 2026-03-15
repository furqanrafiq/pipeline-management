import { useState, useEffect } from 'react'
import client from '../api/client'

export function usePredictions({ window: windowDays = 30 } = {}) {
    const [allPredictions, setAllPredictions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        client.get('/predictions')
            .then((res) => setAllPredictions(res.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    // Filter client-side by day window
    const predictions = allPredictions.filter((p) => p.daysUntilEvent <= windowDays)

    const summary = {
        total: predictions.length,
        critical: predictions.filter((p) => p.severity === 'critical').length,
        warning: predictions.filter((p) => p.severity === 'warning').length,
    }

    return { predictions, summary, loading }
}

// Predictions for one district (AI card per district)
export function useDistrictPredictions(districtId) {
    const [predictions, setPredictions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!districtId) return
        setLoading(true)
        client.get(`/predictions/district/${districtId}`)
            .then((res) => setPredictions(res.data.data))
            .catch(setError)
            .finally(() => setLoading(false))
    }, [districtId])

    return { predictions, loading, error }
}