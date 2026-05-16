import { createAdminSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { getMetadata } from '@/lib/seo'
import { ArrowRight, BookOpen, Clock, UserCircle } from 'lucide-react'
import { PublicNavbar, PublicFooter } from '@/components/PublicLayout'

export const metadata = getMetadata({
    title: 'Arvela Articles & HR Guide',
    description: 'Kumpulan artikel, panduan HRIS, dan strategi rekrutmen terbaru.',
    keywords: ['Artikel HR', 'Panduan Rekrutmen', 'Tips HRIS', 'Strategi HR Indonesia']
})

export const revalidate = 60

export default async function ArticlesPage() {
    const supabase = createAdminSupabaseClient()

    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, slug, category, author_name, meta_description, published_at, profiles(full_name)')
        .eq('status', 'published')
        .order('published_at', { ascending: false })

    return (
        <div className="bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary min-h-screen flex flex-col">
            <PublicNavbar />

            {/* ── HERO ─────────────────────────────────────────────────────── */}
            <section className="relative pt-32 pb-20 px-6 border-b-2 border-foreground overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image 
                        src="/images/articles_hero.png" 
                        alt="Articles Library" 
                        fill 
                        className="object-cover opacity-30 mix-blend-multiply grayscale-[0.5]"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                </div>
                <div className="max-w-5xl mx-auto space-y-6 relative z-10 text-center">
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] bg-background border border-primary px-3 py-1">Arvela Library</span>
                    <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter uppercase leading-[0.9]">
                        Panduan & <span className="font-serif italic text-primary normal-case">Artikel HR</span>
                    </h1>
                    <p className="text-foreground/70 max-w-2xl mx-auto font-medium text-lg font-serif italic">
                        "Baca panduan terbaru tentang optimasi rekrutmen, retensi karyawan, hingga integrasi sistem HRIS modern untuk perusahaan Anda."
                    </p>
                </div>
            </section>

            <section className="flex-grow py-20 px-6 bg-background relative">
                <div className="max-w-7xl mx-auto">
                    {error ? (
                        <div className="text-center text-background bg-foreground border-2 border-primary font-bold p-10 shadow-[8px_8px_0px_0px_rgba(238,117,34,1)]">
                            Terjadi kesalahan memuat artikel.
                        </div>
                    ) : articles?.length === 0 ? (
                        <div className="text-center text-foreground/50 font-black uppercase tracking-widest p-20 border-2 border-border bg-background shadow-[8px_8px_0px_0px_rgba(14,13,10,0.1)]">
                            Belum ada artikel yang diterbitkan saat ini.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {articles.map((article) => (
                                <Link key={article.id} href={`/articles/${article.slug}`} className="group bg-background border-2 border-foreground p-6 hover:shadow-[8px_8px_0px_0px_rgba(238,117,34,1)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest mb-6">
                                        <div className="flex items-center gap-1.5 text-foreground/50">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>
                                                {new Date(article.published_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="text-primary border border-primary px-2 py-0.5 bg-primary/5">
                                            <span>{article.category || 'Article'}</span>
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-black text-foreground mb-4 group-hover:text-primary transition-colors leading-[1.1] uppercase tracking-tight">
                                        {article.title}
                                    </h2>
                                    <p className="text-foreground/70 text-sm leading-relaxed mb-8 flex-grow font-serif italic">
                                        "{article.meta_description || 'Baca wawasan lebih mendalam tentang topik ini.'}"
                                    </p>
                                    <div className="flex items-center justify-between border-t-2 border-foreground pt-4 mt-auto">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground">
                                            <UserCircle className="w-4 h-4 text-primary" />
                                            <span>{article.author_name || article.profiles?.full_name || 'Tim Arvela'}</span>
                                        </div>
                                        <span className="w-8 h-8 flex items-center justify-center bg-foreground text-background group-hover:bg-primary transition-colors">
                                            <ArrowRight className="w-4 h-4 group-hover:-rotate-45 transition-transform" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <PublicFooter />
        </div>
    )
}
