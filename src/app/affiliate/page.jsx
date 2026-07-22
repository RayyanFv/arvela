import { PublicNavbar, PublicFooter } from '@/components/PublicLayout'
import { ArrowRight, Link as LinkIcon, Gift, Users, Handshake, ChevronRight, User } from 'lucide-react'

export const metadata = {
    title: 'Program Affiliate | Arvela HR',
    description: 'Rekomendasikan Arvela ke HR & Perusahaan lain dan dapatkan keuntungan eksklusif.',
}

export default function AffiliatePage() {
    return (
        <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary selection:text-foreground">
            <PublicNavbar />
            
            <main className="pt-24 md:pt-32 pb-16">
                {/* HERO SECTION */}
                <section className="px-6 max-w-7xl mx-auto mb-24 md:mb-32">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-block bg-primary text-foreground font-black uppercase tracking-widest text-[10px] md:text-xs px-3 py-1 mb-6 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(14,13,10,1)]">
                                Program Kemitraan
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter uppercase mb-6">
                                Bawa <span className="text-primary italic font-serif normal-case">Arvela</span> Ke Kolega HR Anda.
                            </h1>
                            <p className="text-lg md:text-xl font-medium text-foreground/80 mb-8 max-w-lg leading-relaxed">
                                Jadilah bagian dari revolusi HR-Tech. Rekomendasikan sistem Arvela ke perusahaan atau jejaring HR Anda, dan nikmati skema bagi hasil yang transparan dan saling menguntungkan.
                            </p>
                            
                            <a href="https://wa.me/6285727627146?text=halo%20kak%20mau%20daftar%20program%20affiliate%20Arvela" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-foreground text-background font-black text-lg px-8 py-5 border-2 border-foreground shadow-[6px_6px_0px_0px_rgba(238,117,34,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(238,117,34,1)] transition-all">
                                Daftar via WhatsApp <ArrowRight className="w-5 h-5" />
                            </a>
                        </div>

                        {/* BRUTALIST ANIMATED GRAPHIC */}
                        <div className="relative h-[400px] md:h-[500px] w-full border-4 border-foreground bg-[#FDF9F1] p-6 shadow-[12px_12px_0px_0px_rgba(14,13,10,1)] overflow-hidden flex items-center justify-center">
                            {/* Animated Network Graphic */}
                            <div className="relative w-full h-full flex items-center justify-center">
                                {/* Center Node */}
                                <div className="absolute z-20 bg-foreground text-background p-4 border-2 border-background shadow-[4px_4px_0px_0px_rgba(238,117,34,1)] rounded-full">
                                    <User className="w-8 h-8" />
                                </div>
                                
                                {/* Orbiting Nodes */}
                                <div className="absolute w-[200px] h-[200px] md:w-[300px] md:h-[300px] border-2 border-dashed border-foreground/30 rounded-full animate-[spin_10s_linear_infinite]" />
                                <div className="absolute w-[300px] h-[300px] md:w-[450px] md:h-[450px] border-2 border-dashed border-primary/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                                
                                {/* Connection Lines (SVG) */}
                                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 10 }}>
                                    <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="text-foreground animate-[pulse_2s_ease-in-out_infinite]" />
                                    <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="text-primary animate-[pulse_3s_ease-in-out_infinite]" />
                                    <line x1="50%" y1="50%" x2="30%" y2="80%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="text-foreground animate-[pulse_2.5s_ease-in-out_infinite]" />
                                    <line x1="50%" y1="50%" x2="70%" y2="70%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="text-primary animate-[pulse_4s_ease-in-out_infinite]" />
                                </svg>

                                {/* Connecting Company Badges */}
                                <div className="absolute top-[10%] left-[10%] z-20 bg-background border-2 border-foreground px-4 py-2 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(14,13,10,1)] hover:bg-primary transition-colors cursor-default">Kolega HR</div>
                                <div className="absolute top-[20%] right-[10%] z-20 bg-background border-2 border-foreground px-4 py-2 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(14,13,10,1)] hover:bg-primary transition-colors cursor-default">Perusahaan A</div>
                                <div className="absolute bottom-[20%] left-[20%] z-20 bg-primary border-2 border-foreground px-4 py-2 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(14,13,10,1)] hover:bg-background transition-colors cursor-default">Grup Rekrutmen</div>
                                <div className="absolute bottom-[25%] right-[20%] z-20 bg-background border-2 border-foreground px-4 py-2 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(14,13,10,1)] hover:bg-primary transition-colors cursor-default">Startup Baru</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MEKANISME */}
                <section className="bg-foreground text-background py-24 md:py-32">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-white">Mekanisme <span className="text-primary font-serif italic normal-case">Sederhana</span></h2>
                            <p className="text-lg text-white/80 font-medium leading-relaxed">Tanpa dashboard afiliasi yang membingungkan atau link rahasia. Semua dilakukan melalui komunikasi transparan.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-background text-foreground p-8 border-4 border-primary relative group hover:-translate-y-2 transition-transform">
                                <div className="absolute -top-6 -right-6 w-12 h-12 bg-primary text-foreground font-black text-xl flex items-center justify-center border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(14,13,10,1)]">1</div>
                                <Users className="w-12 h-12 mb-6 text-primary" />
                                <h3 className="text-2xl font-black uppercase mb-4">Rekomendasikan</h3>
                                <p className="font-medium text-foreground/80 leading-relaxed">Ceritakan pengalaman Anda menggunakan Arvela kepada rekan HR atau pemilik bisnis yang membutuhkan sistem rekrutmen & HCM modern.</p>
                            </div>
                            <div className="bg-background text-foreground p-8 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(238,117,34,1)] relative group hover:-translate-y-2 transition-transform">
                                <div className="absolute -top-6 -right-6 w-12 h-12 bg-primary text-foreground font-black text-xl flex items-center justify-center border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(14,13,10,1)]">2</div>
                                <LinkIcon className="w-12 h-12 mb-6 text-foreground" />
                                <h3 className="text-2xl font-black uppercase mb-4">Hubungkan</h3>
                                <p className="font-medium text-foreground/80 leading-relaxed">Berikan kontak WhatsApp kami kepada mereka, atau buat satu grup obrolan bersama. Kami akan menangani demo dan presentasi produk sepenuhnya.</p>
                            </div>
                            <div className="bg-primary text-foreground p-8 border-4 border-foreground relative group hover:-translate-y-2 transition-transform">
                                <div className="absolute -top-6 -right-6 w-12 h-12 bg-background text-foreground font-black text-xl flex items-center justify-center border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(14,13,10,1)]">3</div>
                                <Gift className="w-12 h-12 mb-6 text-foreground" />
                                <h3 className="text-2xl font-black uppercase mb-4">Dapatkan Reward</h3>
                                <p className="font-medium text-foreground/80 leading-relaxed">Saat perusahaan tersebut memutuskan untuk berlangganan Arvela Max (berbayar), Anda langsung menerima komisi afiliasi sesuai kesepakatan awal.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CALL TO ACTION */}
                <section className="py-24 md:py-32 px-6">
                    <div className="max-w-4xl mx-auto bg-primary border-4 border-foreground p-8 md:p-16 shadow-[12px_12px_0px_0px_rgba(14,13,10,1)] text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 border-b-4 border-r-4 border-foreground opacity-20 -translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 right-0 w-48 h-48 border-t-4 border-l-4 border-foreground opacity-20 translate-x-1/4 translate-y-1/4 rounded-full" />
                        
                        <Handshake className="w-16 h-16 mx-auto mb-8 text-foreground relative z-10" />
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6 relative z-10">Siap Menjadi Mitra Kami?</h2>
                        <p className="text-xl font-medium mb-10 max-w-2xl mx-auto relative z-10">Kami sangat menghargai jejaring dan reputasi Anda. Mari berdiskusi tentang bagaimana program affiliate ini bisa menguntungkan Anda dan koneksi Anda.</p>
                        
                        <a href="https://wa.me/6285727627146?text=halo%20kak%20mau%20daftar%20program%20affiliate%20Arvela" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-foreground hover:bg-foreground/90 text-background font-black text-xl px-12 py-6 border-2 border-foreground shadow-[6px_6px_0px_0px_rgba(250,247,241,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(250,247,241,1)] relative z-10">
                            Hubungi via WhatsApp <ChevronRight className="w-6 h-6" />
                        </a>
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    )
}
