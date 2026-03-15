import { useState, useEffect } from 'react'
import client from '../api/client'

// ─── Module-level cache — fetched once per app session ───────────────────────
let _districtMap = null   // { D1: 'Al Olaya', ... }
let _subareaMap = null   // { 'D1-SA1': 'Olaya North', ... }
let _promise = null   // single in-flight promise

function fetchMaps() {
    if (_promise) return _promise
    _promise = Promise.all([
        client.get('/districts'),
        client.get('/districts/subareas'),
    ]).then(([dRes, saRes]) => {
        _districtMap = {}
        dRes.data.data.forEach((d) => { _districtMap[d.id] = d.name })

        _subareaMap = {}
        saRes.data.data.forEach((sa) => { _subareaMap[sa.id] = sa.name })

        return { districtMap: _districtMap, subareaMap: _subareaMap }
    })
    return _promise
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNameMaps() {
    const [maps, setMaps] = useState({
        districtMap: _districtMap || {},
        subareaMap: _subareaMap || {},
        ready: !!(_districtMap && _subareaMap),
    })

    useEffect(() => {
        if (_districtMap && _subareaMap) return   // already cached
        fetchMaps().then(({ districtMap, subareaMap }) => {
            setMaps({ districtMap, subareaMap, ready: true })
        }).catch(console.error)
    }, [])

    // Helpers
    const dn = (id) => maps.districtMap[id] || id          // full district name
    const ds = (id) => {                                    // short district name for chart axes
        const name = maps.districtMap[id] || id
        return name.replace(/^Al /, '').slice(0, 8)
    }
    const san = (id) => maps.subareaMap[id] || id          // subarea name

    return { ...maps, dn, ds, san }
}