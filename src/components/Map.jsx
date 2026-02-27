import { useEffect, useRef } from 'react'
const areas = [
    {
        name: 'DHA',
        coordinates: [
            { lat: 24.7971, lng: 67.0580 },
            { lat: 24.7971, lng: 67.0900 },
            { lat: 24.7750, lng: 67.0900 },
            { lat: 24.7750, lng: 67.0580 },
        ],
        fillColor: '#FF5733',
        strokeColor: '#FF5733',
    },
    {
        name: 'Clifton',
        coordinates: [
            { lat: 24.8100, lng: 67.0200 },
            { lat: 24.8100, lng: 67.0450 },
            { lat: 24.7950, lng: 67.0450 },
            { lat: 24.7950, lng: 67.0200 },
        ],
        fillColor: '#33FF57',
        strokeColor: '#33FF57',
    },
    {
        name: 'Gulshan-e-Iqbal',
        coordinates: [
            { lat: 24.9200, lng: 67.0900 },
            { lat: 24.9200, lng: 67.1200 },
            { lat: 24.9000, lng: 67.1200 },
            { lat: 24.9000, lng: 67.0900 },
        ],
        fillColor: '#3357FF',
        strokeColor: '#3357FF',
    },
    {
        name: 'Saddar',
        coordinates: [
            { lat: 24.8600, lng: 67.0100 },
            { lat: 24.8600, lng: 67.0300 },
            { lat: 24.8450, lng: 67.0300 },
            { lat: 24.8450, lng: 67.0100 },
        ],
        fillColor: '#FF33A8',
        strokeColor: '#FF33A8',
    },
    {
        name: 'PECHS',
        coordinates: [
            { lat: 24.8750, lng: 67.0400 },
            { lat: 24.8750, lng: 67.0600 },
            { lat: 24.8600, lng: 67.0600 },
            { lat: 24.8600, lng: 67.0400 },
        ],
        fillColor: '#FFD700',
        strokeColor: '#FFD700',
    },
    {
        name: 'Nazimabad',
        coordinates: [
            { lat: 24.9050, lng: 67.0250 },
            { lat: 24.9050, lng: 67.0500 },
            { lat: 24.8850, lng: 67.0500 },
            { lat: 24.8850, lng: 67.0250 },
        ],
        fillColor: '#00CED1',
        strokeColor: '#00CED1',
    },
    {
        name: 'Korangi',
        coordinates: [
            { lat: 24.8300, lng: 67.1000 },
            { lat: 24.8300, lng: 67.1400 },
            { lat: 24.8000, lng: 67.1400 },
            { lat: 24.8000, lng: 67.1000 },
        ],
        fillColor: '#FF8C00',
        strokeColor: '#FF8C00',
    },
    {
        name: 'Malir',
        coordinates: [
            { lat: 24.8900, lng: 67.1500 },
            { lat: 24.8900, lng: 67.1900 },
            { lat: 24.8600, lng: 67.1900 },
            { lat: 24.8600, lng: 67.1500 },
        ],
        fillColor: '#8A2BE2',
        strokeColor: '#8A2BE2',
    },
]

const paths = [
    {
        origin: { lat: 24.8814739, lng: 67.0446876 },
        destination: { lat: 24.8845219, lng: 67.0638706 },
        color: 'green',
    },
    {
        origin: { lat: 24.9187627, lng: 67.0648562 },
        destination: { lat: 24.9310314, lng: 67.0766273 },
        color: 'orange',
    },
]

function Map() {
    const mapRef = useRef(null)

    useEffect(() => {
        const map = new google.maps.Map(mapRef.current, {
            zoom: 11,
            center: { lat: 24.8607, lng: 67.0011 },
            mapTypeId: 'roadmap',
        })

        areas.forEach(({ name, coordinates, fillColor, strokeColor }) => {
            const polygon = new google.maps.Polygon({
                paths: coordinates,
                strokeColor,
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor,
                fillOpacity: 0.35,
            })

            polygon.setMap(map)

            // Show area name on click
            polygon.addListener('click', (e) => {
                new google.maps.InfoWindow({
                    content: `<strong>${name}</strong>`,
                    position: e.latLng,
                }).open(map)
            })
        })

        const directionsService = new google.maps.DirectionsService()


        paths.forEach(({ origin, destination, color }) => {
            directionsService.route(
                {
                    origin,
                    destination,
                    travelMode: google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === 'OK') {
                        new google.maps.DirectionsRenderer({
                            map,
                            directions: result,
                            suppressMarkers: true, // hides A/B markers
                            polylineOptions: {
                                strokeColor: color,
                                strokeWeight: 4,
                                strokeOpacity: 0.8,
                            },
                        }).setMap(map)
                    }
                }
            )
        })
    }, [])

    return <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
}

export default Map