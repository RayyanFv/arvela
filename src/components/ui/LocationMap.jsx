'use client'

import React, { useRef, useMemo } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function LocationMap({ lat, lng, officeLat, officeLng, officeRadius }) {
    if (!lat || !lng) return null;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // If no mapbox token is available, fallback to a simpler aesthetic using a static placeholder or basic container
    if (!mapboxToken) {
        return (
            <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-4 text-center">
                <span className="text-2xl mb-2">🗺️</span>
                <p className="text-xs font-bold text-slate-500">Peta tidak dapat dimuat (Mapbox Token tidak disetel).</p>
                <p className="text-[10px] text-slate-400 mt-1">Namun radius dan absen tetap berjalan normal di background.</p>
            </div>
        )
    }

    // Convert radius from meters to degrees roughly for display purposes (for the circle)
    // 1 latitude degree = ~111km
    const circlePolygon = useMemo(() => {
        if (!officeLat || !officeLng || !officeRadius) return null;

        // Generate a polygon string for a circle
        const points = 64;
        const coords = [];
        const radiusInDeg = officeRadius / 111320; // very rough estimation for radius in degrees

        for (let i = 0; i < points; i++) {
            const angle = (i * 360) / points;
            const theta = angle * (Math.PI / 180);
            const rLng = radiusInDeg / Math.cos(officeLat * (Math.PI / 180));
            coords.push([
                officeLng + rLng * Math.cos(theta),
                officeLat + radiusInDeg * Math.sin(theta)
            ]);
        }
        coords.push(coords[0]); // close the polygon

        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [coords]
                    }
                }
            ]
        };
    }, [officeLat, officeLng, officeRadius]);

    return (
        <Map
            initialViewState={{
                longitude: lng,
                latitude: lat,
                zoom: 14
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={mapboxToken}
        >
            {/* User Location */}
            <Marker longitude={lng} latitude={lat} color="blue" />

            {/* Office boundary */}
            {officeLat && officeLng && (
                <>
                    <Marker longitude={officeLng} latitude={officeLat} color="red" />
                    {circlePolygon && (
                        <Source type="geojson" data={circlePolygon}>
                            <Layer
                                id="office-radius"
                                type="fill"
                                paint={{
                                    'fill-color': '#3b82f6',
                                    'fill-opacity': 0.15,
                                    'fill-outline-color': '#2563eb'
                                }}
                            />
                        </Source>
                    )}
                </>
            )}
        </Map>
    );
}
