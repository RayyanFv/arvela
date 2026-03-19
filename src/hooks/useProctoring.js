'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { logProctoringEvent, uploadProctoringSnapshot } from '@/lib/actions/assessments'

/**
 * useProctoring hook
 * Encapsulates camera, mic, multi-screen, and AI face detection logic
 */
export function useProctoring({ 
    assignmentId, 
    enabled = false, 
    onAnomaliesLogged = () => {} 
}) {
    const [cameraActive, setCameraActive] = useState(false)
    const [multiScreen, setMultiScreen] = useState(false)
    const [faceApiLoaded, setFaceApiLoaded] = useState(false)
    const [anomalyCounters, setAnomalyCounters] = useState({ no_face: 0, multiple_faces: 0 })
    
    const videoRef = useRef(null)
    const canvasRef = useRef(null)

    const captureAndLog = useCallback(async (eventType, detail) => {
        // 1. Report to parent
        onAnomaliesLogged(eventType, detail)

        // 2. Capture screenshot
        let screenshotUrl = null
        if (enabled && videoRef.current && canvasRef.current) {
            try {
                const canvas = canvasRef.current
                const video = videoRef.current
                canvas.width = video.videoWidth / 2
                canvas.height = video.videoHeight / 2
                const ctx = canvas.getContext('2d')
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                const base64 = canvas.toDataURL('image/jpeg', 0.6)
                screenshotUrl = await uploadProctoringSnapshot(assignmentId, base64)
            } catch (err) {
                console.warn('Screenshot capture failed:', err)
            }
        }

        // 3. Log to DB
        await logProctoringEvent({
            assignment_id: assignmentId,
            event_type: eventType,
            details: detail,
            screenshot_url: screenshotUrl
        })
    }, [assignmentId, enabled, onAnomaliesLogged])

    // Browser Events (Tab switch, copy, etc)
    useEffect(() => {
        if (!enabled) return

        const handleBlur = () => {
            setTimeout(async () => {
                if (document.hidden || !document.hasFocus()) {
                    await captureAndLog('tab_switch_blur', 'Dideteksi berpindah tab atau meninggalkan jendela browser.')
                }
            }, 100)
        }

        const handleFocus = () => {
            if (!document.hidden && document.hasFocus()) {
                logProctoringEvent({
                    assignment_id: assignmentId,
                    event_type: 'tab_switch_focus',
                    details: 'Kandidat kembali ke jendela tes.'
                })
            }
        }

        const handleCopy = () => captureAndLog('copy_attempt', 'Mencoba menyalin teks (DIBLOKIR).')
        const handlePaste = () => captureAndLog('paste_attempt', 'Mencoba menempelkan teks (DIBLOKIR).')
        const handleContextMenu = (e) => {
            e.preventDefault()
            captureAndLog('right_click', 'Mencoba klik kanan menu konteks (DIBLOKIR).')
        }

        const checkScreens = () => {
            if (window.screen && window.screen.isExtended) {
                setMultiScreen(true)
                captureAndLog('multi_screen_detected', 'Terdeteksi lebih dari satu layar (Extended Display).')
            } else {
                setMultiScreen(false)
            }
        }

        window.addEventListener('blur', handleBlur)
        window.addEventListener('focus', handleFocus)
        window.addEventListener('resize', checkScreens)
        document.addEventListener('copy', handleCopy)
        document.addEventListener('paste', handlePaste)
        document.addEventListener('contextmenu', handleContextMenu)

        checkScreens()

        return () => {
            window.removeEventListener('blur', handleBlur)
            window.removeEventListener('focus', handleFocus)
            window.removeEventListener('resize', checkScreens)
            document.removeEventListener('copy', handleCopy)
            document.removeEventListener('paste', handlePaste)
            document.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [enabled, assignmentId, captureAndLog])

    // Media Initializer
    useEffect(() => {
        if (!enabled) return

        async function enableMedia() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    setCameraActive(true)
                    setupAudio(stream)
                }
            } catch (err) {
                console.warn('Media access denied')
                logProctoringEvent({
                    assignment_id: assignmentId,
                    event_type: 'media_unavailable',
                    details: 'Gagal mengakses kamera/mic atau akses ditolak kandidat.'
                })
            }
        }

        let audioCtx
        function setupAudio(stream) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)()
                const analyser = audioCtx.createAnalyser()
                const microphone = audioCtx.createMediaStreamSource(stream)
                const scriptProcessor = audioCtx.createScriptProcessor(2048, 1, 1)

                analyser.smoothingTimeConstant = 0.8
                analyser.fftSize = 1024
                microphone.connect(analyser)
                analyser.connect(scriptProcessor)
                scriptProcessor.connect(audioCtx.destination)

                let noiseCount = 0
                scriptProcessor.onaudioprocess = () => {
                    const array = new Uint8Array(analyser.frequencyBinCount)
                    analyser.getByteFrequencyData(array)
                    let values = 0
                    for (let i = 0; i < array.length; i++) values += array[i]
                    const average = values / array.length
                    if (average > 35) {
                        noiseCount++
                        if (noiseCount > 100) { // Approx 2-3s of noise
                            captureAndLog('speech_detected', 'Dideteksi suara mencurigakan.')
                            noiseCount = 0
                        }
                    } else {
                        noiseCount = Math.max(0, noiseCount - 1)
                    }
                }
            } catch (err) { console.warn(err) }
        }

        enableMedia()

        return () => {
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop())
            }
            if (audioCtx) audioCtx.close()
        }
    }, [enabled, assignmentId, captureAndLog])

    // Face Detection Loop
    useEffect(() => {
        if (!enabled || !faceApiLoaded || !cameraActive) return

        const interval = setInterval(async () => {
            if (!videoRef.current || typeof faceapi === 'undefined') return
            try {
                // @ts-ignore
                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                
                if (detections.length === 0) {
                    setAnomalyCounters(prev => {
                        const count = prev.no_face + 1
                        if (count >= 2) { // 2 checks * 2.5s = ~5s of missing face
                            captureAndLog('no_face_detected', 'Wajah tidak terdeteksi atau kandidat menoleh menjauh.')
                            return { ...prev, no_face: 0 }
                        }
                        return { ...prev, no_face: count }
                    })
                } else if (detections.length > 1) {
                    captureAndLog('multiple_faces', 'Terdeteksi lebih dari satu wajah di kamera.')
                } else {
                    setAnomalyCounters({ no_face: 0, multiple_faces: 0 })
                }
            } catch (err) { console.warn(err) }
        }, 2500)

        return () => clearInterval(interval)
    }, [enabled, faceApiLoaded, cameraActive, captureAndLog])

    const initializeFaceApi = useCallback(async () => {
        if (typeof faceapi === 'undefined') return
        try {
            // @ts-ignore
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/')
            setFaceApiLoaded(true)
        } catch (err) { console.error(err) }
    }, [])

    return {
        videoRef,
        canvasRef,
        cameraActive,
        multiScreen,
        faceApiLoaded,
        initializeFaceApi
    }
}
