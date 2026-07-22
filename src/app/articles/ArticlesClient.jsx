'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Clock, UserCircle, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'

const CATEGORIES = ['Semua', 'HR Tech', 'Recruitment', 'Tutorial', 'Insight', 'Research', 'Compliance']
const PER_PAGE = 9

export default function ArticlesClient({ articles: allArticles }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')
    const activeCategory = searchParams.get('cat') || 'Semua'
    const currentPage = Number(searchParams.get('page') || '1')

    // ── Update URL helpers ──────────────────────────────────────────
    const pushParams = useCallback((updates) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(updates).forEach(([k, v]) => {
            if (v && v !== 'Semua' && v !== '1') {
                params.set(k, v)
            } else {
                params.delete(k)
            }
        })
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }, [pathname, router, searchParams])

    // ── Search submit ───────────────────────────────────────────────
    const handleSearch = (e) => {
        e.preventDefault()
        pushParams({ q: searchValue.trim(), page: '1' })
    }

    const handleClearSearch = () => {
        setSearchValue('')
        pushParams({ q: '', page: '1' })
    }

    // ── Filter category ─────────────────────────────────────────────
    const handleCategory = (cat) => {
        pushParams({ cat: cat === 'Semua' ? '' : cat, page: '1' })
    }

    // ── Filter + search client-side (already fetched from server) ──
    const q = (searchParams.get('q') || '').toLowerCase().trim()

    const filtered = useMemo(() => {
        return allArticles.filter(a => {
            const matchCat = activeCategory === 'Semua' || a.category === activeCategory
            const matchQ = !q || (
                a.title.toLowerCase().includes(q) ||
                (a.meta_description || '').toLowerCase().includes(q) ||
                (a.author_name || '').toLowerCase().includes(q) ||
                (a.category || '').toLowerCase().includes(q)
            )
            return matchCat && matchQ
        })
    }, [allArticles, activeCategory, q])

    // ── Pagination ─────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
    const safePage = Math.min(Math.max(1, currentPage), totalPages)
    const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

    const handlePage = (p) => {
        pushParams({ page: String(p) })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // ── Category counts ────────────────────────────────────────────
    const catCounts = useMemo(() => {
        const counts = { Semua: allArticles.length }
        allArticles.forEach(a => {
            counts[a.category] = (counts[a.category] || 0) + 1
        })
        return counts
    }, [allArticles])

    return (
        <section className="flex-grow py-16 px-6 bg-background">
            <div className="max-w-7xl mx-auto">

                {/* ── SEARCH + FILTER BAR ───────────────────────────────── */}
                <div className="mb-12 space-y-6">

                    {/* Search */}
                    <form onSubmit={handleSearch} className="relative flex items-stretch gap-0 w-full">
                        <div className="relative flex-grow">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
                            <input
                                type="text"
                                value={searchValue}
                                onChange={e => setSearchValue(e.target.value)}
                                placeholder="Cari artikel, topik, atau penulis..."
                                className="w-full pl-10 pr-10 py-3.5 border-2 border-foreground bg-background text-foreground text-sm font-medium placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                            />
                            {searchValue && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="px-6 bg-foreground text-background text-xs font-black uppercase tracking-widest border-2 border-foreground hover:bg-primary hover:border-primary transition-colors whitespace-nowrap"
                        >
                            Cari
                        </button>
                    </form>

                    {/* Category pills */}
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => {
                            const isActive = activeCategory === cat
                            const count = catCounts[cat] || 0
                            return (
                                <button
                                    key={cat}
                                    onClick={() => handleCategory(cat)}
                                    className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest border-2 transition-all duration-150
                                        ${isActive
                                            ? 'bg-foreground text-background border-foreground shadow-[4px_4px_0px_0px_rgba(238,117,34,1)]'
                                            : 'bg-background text-foreground/60 border-foreground/20 hover:border-foreground hover:text-foreground'
                                        }`}
                                >
                                    {cat}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                                        ${isActive ? 'bg-primary text-background' : 'bg-foreground/10 text-foreground/60'}`}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Active filters summary */}
                    {(q || activeCategory !== 'Semua') && (
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-foreground/50 font-medium">
                                Menampilkan <strong className="text-foreground">{filtered.length}</strong> artikel
                                {q && <> untuk <strong className="text-primary">&quot;{q}&quot;</strong></>}
                                {activeCategory !== 'Semua' && <> dalam kategori <strong className="text-primary">{activeCategory}</strong></>}
                            </span>
                            <button
                                onClick={() => { setSearchValue(''); pushParams({ q: '', cat: '', page: '1' }) }}
                                className="text-[11px] font-black uppercase tracking-widest text-primary underline underline-offset-2 hover:no-underline"
                            >
                                Reset
                            </button>
                        </div>
                    )}
                </div>

                {/* ── ARTICLES GRID ────────────────────────────────────── */}
                {paginated.length === 0 ? (
                    <div className="text-center py-24 border-2 border-foreground/10">
                        <p className="text-foreground/30 font-black uppercase tracking-widest text-sm">
                            Tidak ada artikel yang sesuai dengan pencarian Anda.
                        </p>
                        <button
                            onClick={() => { setSearchValue(''); pushParams({ q: '', cat: '', page: '1' }) }}
                            className="mt-6 text-xs font-black uppercase tracking-widest text-primary border border-primary px-4 py-2 hover:bg-primary hover:text-background transition-colors"
                        >
                            Lihat Semua Artikel
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {paginated.map((article) => (
                            <Link
                                key={article.id}
                                href={`/articles/${article.slug}`}
                                className="group bg-background border-2 border-foreground p-6 hover:shadow-[8px_8px_0px_0px_rgba(238,117,34,1)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
                            >
                                {/* Category + Date */}
                                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest mb-5">
                                    <div className="flex items-center gap-1.5 text-foreground/40">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>
                                            {new Date(article.published_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="text-primary border border-primary px-2 py-0.5 bg-primary/5 text-[10px]">
                                        {article.category || 'Article'}
                                    </div>
                                </div>

                                {/* Title */}
                                <h2 className="text-xl font-black text-foreground mb-3 group-hover:text-primary transition-colors leading-[1.15] uppercase tracking-tight">
                                    {article.title}
                                </h2>

                                {/* Description */}
                                <p className="text-foreground/60 text-sm leading-relaxed mb-8 flex-grow font-serif italic line-clamp-3">
                                    &ldquo;{article.meta_description || 'Baca wawasan lebih mendalam tentang topik ini.'}&rdquo;
                                </p>

                                {/* Footer */}
                                <div className="flex items-center justify-between border-t-2 border-foreground pt-4 mt-auto">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground">
                                        <UserCircle className="w-4 h-4 text-primary flex-shrink-0" />
                                        <span className="truncate max-w-[120px]">
                                            {article.author_name || article.profiles?.full_name || 'Tim Arvela'}
                                        </span>
                                    </div>
                                    <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-foreground text-background group-hover:bg-primary transition-colors">
                                        <ArrowRight className="w-4 h-4 group-hover:-rotate-45 transition-transform" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* ── PAGINATION ───────────────────────────────────────── */}
                {totalPages > 1 && (
                    <div className="mt-16 flex items-center justify-center gap-2">
                        <button
                            onClick={() => handlePage(safePage - 1)}
                            disabled={safePage <= 1}
                            className="w-10 h-10 flex items-center justify-center border-2 border-foreground disabled:opacity-20 disabled:cursor-not-allowed hover:bg-foreground hover:text-background transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
                            // Show first, last, current, and neighbours
                            const show = p === 1 || p === totalPages || Math.abs(p - safePage) <= 1
                            if (!show) {
                                // Show ellipsis only once per gap
                                if (p === 2 || p === totalPages - 1) {
                                    return <span key={`dot-${p}`} className="text-foreground/30 font-bold px-1">...</span>
                                }
                                return null
                            }
                            return (
                                <button
                                    key={p}
                                    onClick={() => handlePage(p)}
                                    className={`w-10 h-10 flex items-center justify-center border-2 text-sm font-black transition-colors
                                        ${safePage === p
                                            ? 'bg-foreground text-background border-foreground shadow-[4px_4px_0px_0px_rgba(238,117,34,1)]'
                                            : 'border-foreground/30 text-foreground hover:border-foreground hover:bg-foreground/5'
                                        }`}
                                >
                                    {p}
                                </button>
                            )
                        })}

                        <button
                            onClick={() => handlePage(safePage + 1)}
                            disabled={safePage >= totalPages}
                            className="w-10 h-10 flex items-center justify-center border-2 border-foreground disabled:opacity-20 disabled:cursor-not-allowed hover:bg-foreground hover:text-background transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Page info */}
                {totalPages > 1 && (
                    <p className="text-center text-foreground/30 text-xs font-black uppercase tracking-widest mt-4">
                        Halaman {safePage} dari {totalPages} &mdash; {filtered.length} artikel
                    </p>
                )}
            </div>
        </section>
    )
}
