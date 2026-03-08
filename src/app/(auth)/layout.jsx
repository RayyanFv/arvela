export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative background blobs */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-in fade-in duration-1000" />
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-[hsl(217,91%,60%)]/20 rounded-full blur-3xl animate-in fade-in duration-1000 delay-500" />

            {/* Container */}
            <div className="w-full max-w-[1000px] bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden flex flex-col md:flex-row relative z-10 animate-in slide-in-from-bottom-5 duration-700">

                {/* Left Side - Brand & Illustration */}
                <div className="hidden md:flex flex-col justify-between w-1/2 bg-sidebar-bg p-10 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-sidebar-bg/0 z-0" />

                    <div className="relative z-10 font-bold text-3xl tracking-tight text-white">
                        Arvela<span className="text-primary">HR</span>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <h2 className="text-3xl font-bold leading-tight text-white">
                            Satu platform untuk <br />
                            semua proses rekrutmen.
                        </h2>
                        <p className="text-sidebar-text/80 text-base leading-relaxed max-w-sm">
                            Kelola lowongan, assessment, interview, hingga performa karyawan dengan mulus dalam ekosistem yang pintar.
                        </p>
                    </div>

                    <div className="relative z-10 mt-12 bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 group hover:bg-white/15 transition-all">
                        <p className="italic text-sm text-sidebar-text">&quot;Arvela mengubah cara kami merekrut. Lebih terstruktur, lebih transparan, dan sangat efisien.&quot;</p>
                        <div className="mt-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shadow-lg">HR</div>
                            <div>
                                <p className="text-xs font-medium text-white">Head of HR</p>
                                <p className="text-[10px] text-white/60">Tech Enterprise</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white/50">
                    <div className="md:hidden font-bold text-2xl tracking-tight text-sidebar-bg mb-8 text-center">
                        Arvela<span className="text-primary">HR</span>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}
