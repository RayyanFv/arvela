import { createAdminSupabaseClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { getMetadata } from '@/lib/seo'
import { PublicNavbar, PublicFooter } from '@/components/PublicLayout'
import { Suspense } from 'react'
import ArticlesClient from './ArticlesClient'

export const metadata = getMetadata({
    title: 'Arvela Articles & HR Guide',
    description: 'Kumpulan artikel, panduan HRIS, dan strategi rekrutmen terbaru untuk profesional HR Indonesia.',
    keywords: ['Artikel HR', 'Panduan Rekrutmen', 'Tips HRIS', 'Strategi HR Indonesia', 'HRIS Indonesia']
})

export const revalidate = 60

export default async function ArticlesPage() {
    const supabase = createAdminSupabaseClient()

    const { data: articles } = await supabase
        .from('articles')
        .select('id, title, slug, category, author_name, meta_description, published_at, profiles(full_name)')
        .eq('status', 'published')
        .order('published_at', { ascending: false })

    return (
        <div className="bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary min-h-screen flex flex-col">
            <PublicNavbar />

            {/* ── HERO ──────────────────────────────────────────────── */}
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
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] bg-background border border-primary px-3 py-1">
                        Arvela Library
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter uppercase leading-[0.9]">
                        Panduan &amp; <span className="font-serif italic text-primary normal-case">Artikel HR</span>
                    </h1>
                    <p className="text-foreground/70 max-w-2xl mx-auto font-medium text-lg font-serif italic">
                        &ldquo;Baca panduan terbaru tentang optimasi rekrutmen, retensi karyawan, hingga integrasi sistem HRIS modern untuk perusahaan Anda.&rdquo;
                    </p>
                </div>
            </section>

            {/* ── CLIENT: SEARCH + FILTER + GRID + PAGINATION ───────── */}
            <Suspense fallback={
                <div className="flex-grow flex items-center justify-center py-32">
                    <div className="text-foreground/30 font-black uppercase tracking-widest text-sm animate-pulse">
                        Memuat artikel...
                    </div>
                </div>
            }>
                <ArticlesClient articles={articles ?? []} />
            </Suspense>

            <PublicFooter />
        </div>
    )
}
