'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, ArrowRight, Mail } from 'lucide-react'

export const CatalystMark = ({ className }) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="8" y="36" width="17" height="40" rx="8.5" className="fill-primary"/>
      <path d="M40.5 6 L49 24 L49 68 Q49 76 40.5 76 Q32 76 32 68 L32 24 Z" className="fill-foreground"/>
      <rect x="56" y="26" width="17" height="50" rx="8.5" className="fill-primary"/>
    </svg>
)

export function PublicNavbar() {
    const pathname = usePathname()

    const navLinks = [
        { href: '/#modul', label: 'Solusi' },
        { href: '/about', label: 'Company Profile' },
        { href: '/articles', label: 'Articles' },
        { href: '/#bandingkan', label: 'Perbandingan' },
        { href: '/#harga', label: 'Harga' },
    ]

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
            <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 md:gap-3">
                    <CatalystMark className="w-8 h-8 md:w-10 md:h-10" />
                    <span className="text-foreground font-black text-lg md:text-xl tracking-tighter">Arvela<span className="font-serif italic text-primary">.</span></span>
                </Link>
                <div className="hidden md:flex items-center gap-10 text-[13px] font-bold">
                    {navLinks.map((link) => {
                        // Check if active. For hash links like /#modul, they match '/' in pathname, so we don't highlight them strictly based on pathname to avoid bugs, unless it's an exact path match.
                        // For /about and /articles, exact match or startsWith works better.
                        const isActive = pathname === link.href || (link.href !== '/' && !link.href.includes('#') && pathname.startsWith(link.href))
                        return (
                            <Link 
                                key={link.href} 
                                href={link.href} 
                                className={`transition-colors ${isActive ? 'text-primary' : 'text-foreground/70 hover:text-primary'}`}
                            >
                                {link.label}
                            </Link>
                        )
                    })}
                    <Link 
                        href="/careers" 
                        className="text-foreground/70 hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                        <Users className="w-3.5 h-3.5" /> Portal Pelamar
                    </Link>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                    <Link 
                        href="/login" 
                        onClick={(e) => { e.preventDefault(); alert("Sistem HRIS & Asesmen sedang dalam persiapan rilis. Silakan mulai Pilot Promo via WhatsApp untuk akses prioritas."); }}
                        className="text-xs md:text-sm font-bold text-foreground/70 hover:text-foreground transition-colors"
                    >
                        Login
                    </Link>
                    <Link href="/#pilot" className="bg-foreground hover:bg-foreground/90 text-background font-bold text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 rounded-none border-2 border-foreground transition-all shadow-[4px_4px_0px_0px_rgba(238,117,34,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(238,117,34,1)]">
                        Mulai Pilot
                    </Link>
                </div>
            </div>
        </nav>
    )
}

export function PublicFooter() {
    return (
        <footer className="bg-background border-t border-border py-20 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-20">
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <CatalystMark className="w-10 h-10" />
                        <span className="text-foreground font-black text-xl tracking-tighter">Arvela<span className="font-serif italic text-primary">.</span></span>
                    </div>
                    <p className="text-foreground/70 font-bold text-sm max-w-sm mb-6 leading-relaxed">Platform Talent Management untuk Tim HR Modern yang ingin bergerak cepat dan berbasis data.</p>
                    <p className="text-foreground/50 text-xs italic font-serif leading-relaxed border-l-2 border-primary pl-4 py-1">
                        "Kami tidak hanya membangun software. Kami membangun standar baru pengelolaan talenta."
                    </p>
                    <p className="text-foreground/40 text-[10px] font-black uppercase mt-3 tracking-widest">— Dian Kusumawati, Founder</p>
                </div>
                <div>
                    <p className="text-foreground font-black text-[11px] mb-6 uppercase tracking-[0.2em]">Ikuti Kami</p>
                    <div className="flex gap-4">
                        <a href="https://instagram.com/aicareer.id" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-background flex items-center justify-center hover:bg-primary transition-all border border-border group" title="Instagram">
                            <img src="https://cdn.simpleicons.org/instagram/0E0D0A" alt="Instagram" className="w-5 h-5 group-hover:hidden opacity-70" />
                            <img src="https://cdn.simpleicons.org/instagram/0E0D0A" alt="Instagram" className="w-5 h-5 hidden group-hover:block" />
                        </a>
                        <a href="https://tiktok.com/@aicareer.id" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-background flex items-center justify-center hover:bg-primary transition-all border border-border group" title="TikTok">
                            <img src="https://cdn.simpleicons.org/tiktok/0E0D0A" alt="TikTok" className="w-5 h-5 group-hover:hidden opacity-70" />
                            <img src="https://cdn.simpleicons.org/tiktok/0E0D0A" alt="TikTok" className="w-5 h-5 hidden group-hover:block" />
                        </a>
                    </div>
                    <div className="mt-8">
                        <p className="text-foreground font-black text-[11px] mb-4 uppercase tracking-[0.2em]">Kontak</p>
                        <a href="mailto:marketing@arvela.id" className="text-foreground/70 hover:text-primary text-sm font-bold block transition-colors">marketing [at] arvela.id</a>
                        <p className="text-foreground/70 text-sm font-bold mt-2">arvela.id</p>
                    </div>
                </div>
                <div>
                    <p className="text-foreground font-black text-[11px] mb-6 uppercase tracking-[0.2em]">Navigasi & Legal</p>
                    <div className="space-y-4">
                        <Link href="/about" className="text-foreground/70 hover:text-primary text-sm font-bold block transition-colors">Company Profile & Pitch</Link>
                        <Link href="/careers" className="text-foreground/70 hover:text-primary text-sm font-bold block transition-colors">
                            Portal Pelamar / Kandidat
                        </Link>
                        <Link href="/#modul" className="text-foreground/70 hover:text-primary text-sm font-bold block transition-colors">Modul Solusi</Link>
                        <Link 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); alert("Dokumen Kebijakan Privasi sedang dalam pembaruan versi 2026. Silakan kembali lagi nanti."); }}
                            className="text-foreground/70 hover:text-primary text-sm font-bold block transition-colors"
                        >
                            Kebijakan Privasi
                        </Link>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-foreground/40 text-[10px] font-black uppercase tracking-widest italic">© 2026 Arvela by Aicareer.</p>
            </div>

            {/* Email Floating Popup */}
            <a
                href="mailto:marketing@arvela.id?subject=Tanya%20Pilot%20Project%20Arvela"
                className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] bg-primary text-white px-5 py-3 rounded-none shadow-[4px_4px_0px_0px_rgba(14,13,10,1)] border-2 border-foreground hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(14,13,10,1)] transition-all flex items-center gap-3 mix-blend-normal"
            >
                <Mail className="w-6 h-6 text-white" />
                <span className="font-black text-[11px] whitespace-nowrap tracking-widest uppercase">
                    <span className="md:hidden">Email Kami</span>
                    <span className="hidden md:inline">Hubungi via Email</span>
                </span>
            </a>
        </footer>
    )
}
