'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Video, VideoOff, Mic, MicOff, PhoneOff, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * JitsiMeeting Component
 * Embeds a Jitsi Meet session using the External API.
 */
export default function JitsiMeeting({ roomName, displayName, jwt, onReady, onFinished }) {
    const jitsiContainerRef = useRef(null)
    const [api, setApi] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Load Jitsi script dynamicly
        const script = document.createElement('script')
        script.src = 'https://meet.jit.si/external_api.js'
        script.async = true
        script.onload = () => {
            const domain = 'meet.jit.si'
            const options = {
                roomName: roomName,
                width: '100%',
                height: '100%',
                parentNode: jitsiContainerRef.current,
                userInfo: {
                    displayName: displayName
                },
                interfaceConfigOverwrite: {
                    // Customize UI here
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    DEFAULT_REMOTE_DISPLAY_NAME: 'Candidate',
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                        'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                        'security'
                    ],
                },
                configOverwrite: {
                  disableDeepLinking: true,
                  prejoinPageEnabled: false,
                }
            }
            
            if (jwt) options.jwt = jwt

            const jitsiApi = new window.JitsiMeetExternalAPI(domain, options)
            
            jitsiApi.addEventListeners({
                readyToClose: () => {
                    if (onFinished) onFinished()
                },
                videoConferenceJoined: () => {
                   setLoading(false)
                   if (onReady) onReady()
                },
                videoConferenceLeft: () => {
                    if (onFinished) onFinished()
                }
            })

            setApi(jitsiApi)
        }
        document.body.appendChild(script)

        return () => {
            if (api) api.dispose()
            document.body.removeChild(script)
        }
    }, [roomName, displayName, jwt])

    return (
        <div className="relative w-full h-full bg-slate-950 rounded-[32px] overflow-hidden shadow-2xl border border-slate-800">
            {loading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 animate-pulse">Menghubungkan Sesi Interview...</p>
                </div>
            )}
            <div ref={jitsiContainerRef} className="w-full h-full" />

            {/* Premium Overlay Controls (Visual Only for now) */}
            {!loading && (
                <div className="absolute bottom-8 inset-x-0 pointer-events-none flex justify-center items-end px-10">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-2 rounded-[24px] pointer-events-auto flex gap-2 shadow-2xl">
                        <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl text-white hover:bg-white/10">
                            <Mic className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl text-white hover:bg-white/10">
                            <Video className="w-5 h-5" />
                        </Button>
                        <div className="w-px h-6 bg-white/10 self-center mx-1" />
                        <Button 
                           variant="ghost" 
                           onClick={() => api?.executeCommand('hangup')}
                           className="h-12 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black group transition-all"
                        >
                            <PhoneOff className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" /> Akhiri Sesi
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
