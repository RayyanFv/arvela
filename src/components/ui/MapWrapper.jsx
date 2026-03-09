'use client'

import dynamic from 'next/dynamic'

const LocationMap = dynamic(() => import('./LocationMap'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">Loading Map...</div>
})

export default function MapWrapper(props) {
    return <LocationMap {...props} />
}
