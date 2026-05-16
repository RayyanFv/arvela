'use client'
import { useEffect, useState } from 'react'

export function CustomCursor() {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isPointer, setIsPointer] = useState(false)
    const [hidden, setHidden] = useState(true)

    useEffect(() => {
        // Only show custom cursor on desktop
        if (window.matchMedia("(max-width: 768px)").matches) return;

        const updatePosition = (e) => {
            setPosition({ x: e.clientX, y: e.clientY })
            if (hidden) setHidden(false)
        }
        
        const updatePointer = () => {
            const target = document.querySelectorAll('a, button, input, textarea, select, [role="button"]')
            let hovered = false
            target.forEach(el => {
                if (el.matches(':hover')) hovered = true
            })
            setIsPointer(hovered)
        }

        const handleMouseLeave = () => setHidden(true)
        const handleMouseEnter = () => setHidden(false)

        window.addEventListener('mousemove', updatePosition)
        window.addEventListener('mouseover', updatePointer)
        window.addEventListener('mouseleave', handleMouseLeave)
        window.addEventListener('mouseenter', handleMouseEnter)

        return () => {
            window.removeEventListener('mousemove', updatePosition)
            window.removeEventListener('mouseover', updatePointer)
            window.removeEventListener('mouseleave', handleMouseLeave)
            window.removeEventListener('mouseenter', handleMouseEnter)
        }
    }, [hidden])

    if (hidden) return null

    return (
        <div 
            className={`fixed top-0 left-0 pointer-events-none z-[99999] transition-transform duration-75 ease-out flex items-center justify-center`}
            style={{ 
                transform: `translate(${position.x}px, ${position.y}px)`,
                width: isPointer ? '48px' : '16px',
                height: isPointer ? '48px' : '16px',
                marginLeft: isPointer ? '-24px' : '-8px',
                marginTop: isPointer ? '-24px' : '-8px',
            }}
        >
            <div className={`absolute inset-0 transition-all duration-300 flex items-center justify-center ${isPointer ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>
                <div className="w-full h-full bg-primary rounded-full shadow-[0_0_10px_rgba(238,117,34,0.5)]" />
            </div>
            
            <div className={`absolute inset-0 transition-all duration-300 flex items-center justify-center ${isPointer ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_8px_rgba(238,117,34,0.8)]">
                    <rect x="8" y="36" width="17" height="40" rx="8.5" fill="#EE7522"/>
                    <path d="M40.5 6 L49 24 L49 68 Q49 76 40.5 76 Q32 76 32 68 L32 24 Z" fill="#EE7522"/>
                    <rect x="56" y="26" width="17" height="50" rx="8.5" fill="#EE7522"/>
                </svg>
            </div>
        </div>
    )
}
