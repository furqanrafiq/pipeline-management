import { useState, useEffect } from 'react'
import client from '../api/client'

export function useKpiSummary(period = 'today') {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    client.get(`/kpi/summary?period=${period}`)
      .then((res) => setSummary(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period])

  return { summary, loading }
}

export function useNetworkHealth() {
  const [health, setHealth]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/kpi/network-health')
      .then((res) => setHealth(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { health, loading }
}

export function useResponseTimes(period = 'today') {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    client.get(`/kpi/response-times?period=${period}`)
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period])

  return { data, loading }
}

export function useTasks(period = 'today') {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    client.get(`/kpi/tasks?period=${period}`)
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period])

  return { data, loading }
}

export function useNetGains(period = 'today') {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    client.get(`/kpi/net-gains?period=${period}`)
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period])

  return { data, loading }
}

export function useRankings() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/kpi/rankings')
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}

export function useDistrictController(districtId) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!districtId) return
    setLoading(true)
    client.get(`/kpi/district-controller/${districtId}`)
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [districtId])

  return { data, loading }
}

export function useActiveRepairs(districtId) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = districtId ? `/kpi/active-repairs?districtId=${districtId}` : '/kpi/active-repairs'
    client.get(url)
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [districtId])

  return { data, loading }
}