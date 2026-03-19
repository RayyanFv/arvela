'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { logProctoringEvent, uploadProctoringSnapshot } from '@/lib/actions/assessments'

/**
 * useProctoring hook — Enhanced v3
 * Features:
 *   1. Tab switch detection (visibilitychange only, no blur spam)
 *   2. Copy/Paste blocking
 *   3. Multi-screen detection
 *   4. AI Face detection (very tolerant — 40 misses = ~120s before logging)
 *   5. Audio frequency-band analysis (speech 300-3000Hz, ignores keyboard clicks)
 *   6. Cooldown system (60s between same event type)
 *   7. Heartbeat periodic snapshot (every 3 min)
 *   8. DevTools detection (window inner size delta)
 *   9. Fullscreen tracking (request + exit detection)
 */
export function useProctoring({
    assignmentId,
    enabled = false,
    onAnomaliesLogged = () => { }
}) {
    const [cameraActive, setCameraActive] = useState(false)
    const [multiScreen, setMultiScreen] = useState(false)
    const [faceApiLoaded, setFaceApiLoaded] = useState(false)
    const [audioLevel, setAudioLevel] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const anomalyCounters = useRef({ no_face: 0, multiple_faces: 0 })

    const videoRef = useRef(null)
    const canvasRef = useRef(null)

    // ─── Cooldown System ───
    // Prevents spam: minimum 60s between logs of the same event type
    const lastLogTime = useRef({})
    const COOLDOWN_MS = 60_000

    const canLog = useCallback((eventType) => {
        const now = Date.now()
        const last = lastLogTime.current[eventType] || 0
        if (now - last < COOLDOWN_MS) return false
        lastLogTime.current[eventType] = now
        return true
    }, [])

    const captureAndLog = useCallback(async (eventType, detail, includeScreenshot = true) => {
        if (!canLog(eventType)) return // Cooldown active

        // 1. Report to parent UI
        onAnomaliesLogged(eventType, detail)

        // 2. Capture screenshot (only for important events)
        let screenshotUrl = null
        if (includeScreenshot && enabled && videoRef.current && canvasRef.current) {
            try {
                const canvas = canvasRef.current
                const video = videoRef.current
                canvas.width = video.videoWidth / 2
                canvas.height = video.videoHeight / 2
                const ctx = canvas.getContext('2d')
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                const base64 = canvas.toDataURL('image/jpeg', 0.5)
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
    }, [assignmentId, enabled, onAnomaliesLogged, canLog])

    // ─── Browser Events (Tab switch, copy/paste) ───
    useEffect(() => {
        if (!enabled) return

        // Debounce flag: prevents blur from double-logging when switching tabs
        let visibilityJustChanged = false
        let visibilityTimer = null

        const handleVisibilityChange = () => {
            visibilityJustChanged = true
            clearTimeout(visibilityTimer)
            visibilityTimer = setTimeout(() => { visibilityJustChanged = false }, 500)

            if (document.hidden) {
                captureAndLog('tab_switch_blur', 'Kandidat berpindah tab atau meminimalkan jendela ujian.')
            } else {
                logProctoringEvent({
                    assignment_id: assignmentId,
                    event_type: 'tab_switch_focus',
                    details: 'Kandidat kembali ke tab tes.'
                })
            }
        }

        // Blur fires when focus leaves to another window/screen
        // Only log if visibilitychange didn't JUST fire (avoids double-log on tab switch)
        const handleBlur = () => {
            setTimeout(() => {
                if (!visibilityJustChanged && !document.hidden) {
                    captureAndLog('window_blur', 'Kandidat mengalihkan fokus ke jendela atau layar lain.')
                }
            }, 300)
        }

        const handleCopy = () => captureAndLog('copy_attempt', 'Kandidat mencoba menyalin teks (diblokir oleh sistem).')
        const handlePaste = () => captureAndLog('paste_attempt', 'Kandidat mencoba menempelkan teks (diblokir oleh sistem).')

        const checkScreens = () => {
            const isExtended = !!(window.screen && window.screen.isExtended)
            setMultiScreen(isExtended)
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('blur', handleBlur)
        window.addEventListener('resize', checkScreens)
        document.addEventListener('copy', handleCopy)
        document.addEventListener('paste', handlePaste)

        checkScreens()

        return () => {
            clearTimeout(visibilityTimer)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('blur', handleBlur)
            window.removeEventListener('resize', checkScreens)
            document.removeEventListener('copy', handleCopy)
            document.removeEventListener('paste', handlePaste)
        }
    }, [enabled, assignmentId, captureAndLog])

    // ─── Multi-Screen Change Logger ───
    const hasLoggedScreen = useRef(false)
    useEffect(() => {
        if (enabled && multiScreen && !hasLoggedScreen.current) {
            captureAndLog('multi_screen_detected', 'Terdeteksi penggunaan lebih dari satu layar (Extended Display).')
            hasLoggedScreen.current = true
        } else if (!multiScreen) {
            hasLoggedScreen.current = false
        }
    }, [enabled, multiScreen, captureAndLog])

    // ─── DevTools Detection ───
    useEffect(() => {
        if (!enabled) return
        const threshold = 160 // DevTools panel biasanya > 160px
        const checkDevTools = () => {
            const widthDelta = window.outerWidth - window.innerWidth
            const heightDelta = window.outerHeight - window.innerHeight
            if (widthDelta > threshold || heightDelta > threshold) {
                captureAndLog('devtools_detected', 'Terindikasi pembukaan Developer Tools (inspeksi halaman).')
            }
        }
        const interval = setInterval(checkDevTools, 5000)
        return () => clearInterval(interval)
    }, [enabled, captureAndLog])

    // ─── Fullscreen Tracking (API only — reliable) ───
    useEffect(() => {
        if (!enabled) return

        const prevFs = { current: false }

        const checkFullscreen = () => {
            const inFs = !!document.fullscreenElement
            if (prevFs.current && !inFs) {
                captureAndLog('fullscreen_exit', 'Kandidat keluar dari mode layar penuh.', false)
            }
            prevFs.current = inFs
            setIsFullscreen(inFs)
        }

        document.addEventListener('fullscreenchange', checkFullscreen)
        checkFullscreen()

        return () => {
            document.removeEventListener('fullscreenchange', checkFullscreen)
        }
    }, [enabled, captureAndLog])

    const requestFullscreen = useCallback(async () => {
        try {
            await document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } catch (err) {
            console.warn('Fullscreen request rejected:', err)
        }
    }, [])

    useEffect(() => {
        if (!enabled) return

        let animationFrameId
        let audioCtx // Elevate to component scope for cleanup

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
                    details: 'Gagal mengakses kamera/mikrofon atau akses ditolak oleh kandidat.'
                })
            }
        }

        function setupAudio(stream) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)()
                const analyser = audioCtx.createAnalyser()
                const microphone = audioCtx.createMediaStreamSource(stream)

                analyser.smoothingTimeConstant = 0.85
                analyser.fftSize = 2048 // Higher resolution for frequency analysis
                microphone.connect(analyser)

                const sampleRate = audioCtx.sampleRate
                const binSize = sampleRate / analyser.fftSize // Hz per bin

                // Speech frequency range: 300Hz – 3000Hz
                const speechBinStart = Math.floor(300 / binSize)
                const speechBinEnd = Math.min(Math.ceil(3000 / binSize), analyser.frequencyBinCount - 1)
                const nonSpeechBinCount = analyser.frequencyBinCount - (speechBinEnd - speechBinStart + 1)

                let speechNoiseCount = 0

                function processAudio() {
                    if (!audioCtx) return

                    const freqData = new Uint8Array(analyser.frequencyBinCount)
                    analyser.getByteFrequencyData(freqData)

                    // Full-spectrum average (for UI meter only)
                    let totalSum = 0
                    for (let i = 0; i < freqData.length; i++) totalSum += freqData[i]
                    const fullAverage = totalSum / freqData.length

                    // Speech-band average (300-3000Hz)
                    let speechSum = 0
                    const speechBinCount = speechBinEnd - speechBinStart + 1
                    for (let i = speechBinStart; i <= speechBinEnd; i++) speechSum += freqData[i]
                    const speechAverage = speechSum / speechBinCount

                    // Non-speech-band average (all other frequencies)
                    const nonSpeechSum = totalSum - speechSum
                    const nonSpeechAverage = nonSpeechBinCount > 0 ? nonSpeechSum / nonSpeechBinCount : 0

                    // Speech-to-noise ratio: real speech has mid-freq dominance (~1.8x+)
                    const speechRatio = nonSpeechAverage > 0 ? speechAverage / nonSpeechAverage : 0

                    // Throttled UI update
                    if (Math.random() > 0.85) setAudioLevel(fullAverage)

                    // Trigger ONLY if:
                    //   1. Speech-band energy is genuinely loud (>80)
                    //   2. Speech-band is at least 1.8x louder than other bands (rules out flat ambient noise like fan/AC)
                    const isSpeech = speechAverage > 80 && speechRatio > 1.8
                    if (isSpeech) {
                        speechNoiseCount++
                        if (speechNoiseCount > 80) { // ~3.5s of continuous real speech
                            captureAndLog('speech_detected', 'Terdeteksi indikasi suara percakapan yang berkelanjutan.')
                            speechNoiseCount = 0
                        }
                    } else {
                        speechNoiseCount = Math.max(0, speechNoiseCount - 3) // Decay fast
                    }

                    animationFrameId = requestAnimationFrame(processAudio)
                }

                processAudio()
            } catch (err) { console.warn(err) }
        }

        enableMedia()

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId)
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop())
            }
            if (audioCtx && audioCtx.state !== 'closed') audioCtx.close()
        }
    }, [enabled, assignmentId, captureAndLog])

    // ─── Solid Face Detection (NPM Package @vladmandic/face-api) ───
    const [faceDetected, setFaceDetected] = useState(true)
    const faceapiRef = useRef(null)

    // 1. Initializer Model
    useEffect(() => {
        if (!enabled || !cameraActive) return

        let isMounted = true
        const initModel = async () => {
            try {
                const faceapi = await import('@vladmandic/face-api')
                faceapiRef.current = faceapi
                await faceapi.tf.ready()
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
                if (isMounted) setFaceApiLoaded(true)
            } catch (e) { console.error('[Proctoring] Model load failed:', e) }
        }
        initModel()
        return () => { isMounted = false }
    }, [enabled, cameraActive])

    // 2. Face Detection Loop
    useEffect(() => {
        if (!enabled || !cameraActive || !faceApiLoaded) return

        let warmupChecks = 0
        const WARMUP_THRESHOLD = 2 // ~5 detik initial warmup

        const interval = setInterval(async () => {
            const faceapi = faceapiRef.current
            if (!videoRef.current || !faceapi || !faceapi.nets.tinyFaceDetector.isLoaded) return

            // Wajib: Render DOM width agar Face-API tidak mendeteksi bingkai 0x0 pixels
            if (videoRef.current.videoWidth > 0 && !videoRef.current.width) {
                videoRef.current.width = videoRef.current.videoWidth
                videoRef.current.height = videoRef.current.videoHeight
            }

            warmupChecks++
            if (warmupChecks <= WARMUP_THRESHOLD) return // Beri waktu adjust cahaya

            try {
                const detections = await faceapi.detectAllFaces(
                    videoRef.current,
                    // Resolusi 224 stabil untuk semua laptop. Score Threshold super pemaaf (0.1).
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.1 })
                )

                if (detections.length === 0) {
                    setFaceDetected(false)
                    anomalyCounters.current.no_face += 1
                    if (anomalyCounters.current.no_face >= 4) { // 6 misses * 2.5s = 15 detik toleransi
                        captureAndLog('no_face_detected', 'Tidak terdeteksi kehadiran wajah di depan kamera secara konsisten.')
                        anomalyCounters.current.no_face = 0
                    }
                } else if (detections.length > 1) {
                    setFaceDetected(true)
                    captureAndLog('multiple_faces', 'Terdeteksi lebih dari satu wajah di depan kamera.')
                    anomalyCounters.current.no_face = 0
                } else {
                    setFaceDetected(true)
                    anomalyCounters.current.no_face = 0
                }
            } catch (e) {
                console.error('[Proctoring] Deteksi wajah gagal:', e)
            }
        }, 2500)

        return () => clearInterval(interval)
    }, [enabled, cameraActive, faceApiLoaded, captureAndLog])

    // ─── Heartbeat Periodic Snapshot (every 3 min) ───
    useEffect(() => {
        if (!enabled || !cameraActive) return

        const heartbeatInterval = setInterval(async () => {
            if (!videoRef.current || !canvasRef.current) return
            try {
                const canvas = canvasRef.current
                const video = videoRef.current
                canvas.width = video.videoWidth / 3
                canvas.height = video.videoHeight / 3
                const ctx = canvas.getContext('2d')
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                const base64 = canvas.toDataURL('image/jpeg', 0.4) // Lower quality for heartbeat
                const url = await uploadProctoringSnapshot(assignmentId, base64)

                await logProctoringEvent({
                    assignment_id: assignmentId,
                    event_type: 'heartbeat',
                    details: 'Snapshot periodik kehadiran kandidat.',
                    screenshot_url: url
                })
            } catch (err) { console.warn('Heartbeat snapshot failed:', err) }
        }, 180_000) // 3 menit

        return () => clearInterval(heartbeatInterval)
    }, [enabled, cameraActive, assignmentId])

    return {
        videoRef,
        canvasRef,
        cameraActive,
        multiScreen,
        audioLevel,
        isFullscreen,
        faceDetected,
        requestFullscreen
    }
}
