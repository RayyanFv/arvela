'use client'

import React, { useRef, useMemo, useCallback } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function OfficeLocationPicker({ lat, lng, radius, onChange }) {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const onMarkerDrag = useCallback((event) => {
        onChange({
            lat: event.lngLat.lat,
            lng: event.lngLat.lng
        });
    }, [onChange]);

    const circlePolygon = useMemo(() => {
        if (!lat || !lng || !radius) return null;

        const points = 64;
        const coords = [];
        const radiusInDeg = radius / 111320;

        for (let i = 0; i < points; i++) {
            const angle = (i * 360) / points;
            const theta = angle * (Math.PI / 180);
            const rLng = radiusInDeg / Math.cos(lat * (Math.PI / 180));
            coords.push([
                lng + rLng * Math.cos(theta),
                lat + radiusInDeg * Math.sin(theta)
            ]);
        }
        coords.push(coords[0]);

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
    }, [lat, lng, radius]);

    if (!mapboxToken) {
        return (
            <div className="w-full h-48 bg-slate-100 rounded-2xl flex flex-col items-center justify-center p-4 text-center border border-dashed border-slate-300">
                <span className="text-xl mb-2">🗺️</span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapbox Token Required</p>
                <p className="text-[9px] text-slate-400 mt-1 uppercase">Set NEXT_PUBLIC_MAPBOX_TOKEN to enable interactive map picking.</p>
            </div>
        )
    }

    return (
        <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative group">
            <Map
                initialViewState={{
                    longitude: (!lng || isNaN(lng)) ? 106.8272 : lng,
                    latitude: (!lat || isNaN(lat)) ? -6.1751 : lat,
                    zoom: 15
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={mapboxToken}
            >
                {typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && (
                    <>
                        <Marker
                            longitude={lng}
                            latitude={lat}
                            color="#3b82f6"
                            draggable
                            onDragEnd={onMarkerDrag}
                        />
                        {circlePolygon && (
                            <Source type="geojson" data={circlePolygon}>
                                <Layer
                                    id="office-radius-layer"
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
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-xl pointer-events-none transition-opacity group-hover:opacity-100">
                <p className="text-[10px] font-black text-slate-900 leading-none">💡 Geser pin untuk set lokasi</p>
            </div>
        </div>
    );
}
