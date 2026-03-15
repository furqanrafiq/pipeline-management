import { useState, useEffect } from 'react'
import client from '../api/client'

// All districts for map level 1
export function useDistricts() {
    const [districts, setDistricts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        client.get('/districts')
            .then((res) => setDistricts(res.data.data))
            .catch(setError)
            .finally(() => setLoading(false))
    }, [])

    return { districts, loading, error }
}

// Single district + its subareas
export function useDistrict(id) {
    const [district, setDistrict] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!id) return
        setLoading(true)
        client.get(`/districts/${id}`)
            .then((res) => setDistrict(res.data.data))
            .catch(setError)
            .finally(() => setLoading(false))
    }, [id])

    return { district, loading, error }
}

// SubAreas for a district (map level 2)
export function useSubAreas(districtId) {
    const [subAreas, setSubAreas] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!districtId) return
        setLoading(true)
        client.get(`/districts/${districtId}/subareas`)
            .then((res) => setSubAreas(res.data.data))
            .catch(setError)
            .finally(() => setLoading(false))
    }, [districtId])

    return { subAreas, loading, error }
}

// Pipelines for a subarea (map level 3)
export function usePipelines(subareaId) {
    const [pipelines, setPipelines] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!subareaId) return
        setLoading(true)
        client.get(`/districts/subareas/${subareaId}/pipelines`)
            .then((res) => setPipelines(res.data.data))
            .catch(setError)
            .finally(() => setLoading(false))
    }, [subareaId])

    return { pipelines, loading, error }
}

// Joints for a pipeline (map level 4)
export function useJoints(pipelineId) {
    const [joints, setJoints] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!pipelineId) return
        setLoading(true)
        client.get(`/districts/pipelines/${pipelineId}/joints`)
            .then((res) => setJoints(res.data.data))
            .catch(setError)
            .finally(() => setLoading(false))
    }, [pipelineId])

    return { joints, loading, error }
}