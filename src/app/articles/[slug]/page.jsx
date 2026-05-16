import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMetadata } from '@/lib/seo'
import { ArrowLeft, UserCircle, Calendar, Building } from 'lucide-react'
import { ShareButton } from '@/components/ui/ShareButton'
import { LikeDislikeButtons } from '@/components/ui/LikeDislikeButtons'
import { PublicNavbar, PublicFooter } from '@/components/PublicLayout'

export async function generateMetadata({ params }) {
    const { slug } = await params
    const supabase = createAdminSupabaseClient()

    const { data: article } = await supabase
        .from('articles')
        .select('title, meta_title, meta_description, keywords')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

    if (!article) return getMetadata({ title: 'Artikel Tidak Ditemukan' })

    return getMetadata({
        title: article.meta_title || article.title,
        description: article.meta_description || 'Baca artikel selengkapnya di Arvela Articles.',
        keywords: article.keywords ? article.keywords.join(', ') : '',
    })
}

export const revalidate = 60

export default async function ArticleDetailPage({ params }) {
    const { slug } = await params
    const supabase = createAdminSupabaseClient()

    // Ambil artikel, lalu update views secara asinkron (RPC jika ada, atau update langsung)
    const { data: article, error } = await supabase
        .from('articles')
        .select('*, profiles(full_name)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

    if (error || !article) {
        notFound()
    }

    // Fire and forget update views (in background)
    supabase.rpc('increment_article_views', { article_id: article.id }).then(({ error: rpcErr }) => {
        // Fallback jika tidak ada RPC, lakukan update manual (bisa kotor/race condition, tapi gapapa u/ MVP)
        if (rpcErr) {
            supabase.from('articles').update({ views: (article.views || 0) + 1 }).eq('id', article.id).then()
        }
    })

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <PublicNavbar />

            <article className="max-w-3xl mx-auto px-6 py-32 md:py-40">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Article",
                            "headline": article.meta_title || article.title,
                            "description": article.meta_description || 'Baca artikel selengkapnya di Arvela Articles.',
                            "author": {
                                "@type": "Person",
                                "name": article.author_name || article.profiles?.full_name || 'Tim Arvela'
                            },
                            "datePublished": article.published_at,
                            "dateModified": article.updated_at || article.published_at,
                            "publisher": {
                                "@type": "Organization",
                                "name": "Arvela",
                                "logo": {
                                    "@type": "ImageObject",
                                    "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://arvela.id'}/arvela-logo.png`
                                }
                            }
                        })
                    }}
                />

                <Link href="/articles" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground/50 hover:text-primary transition-colors mb-12 border-2 border-transparent hover:border-foreground/10 px-4 py-2">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Library
                </Link>

                <header className="mb-12">
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em] bg-background border-2 border-primary px-3 py-1 shadow-[2px_2px_0px_0px_rgba(238,117,34,1)]">
                            {article.category || 'Research & Guide'}
                        </span>
                        <div className="flex items-center text-xs font-bold text-foreground/50 gap-1.5 font-serif italic">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(article.published_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </div>
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-black text-foreground leading-[1] tracking-tighter mb-8 uppercase">
                        {article.title}
                    </h1>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-6 border-y-2 border-foreground gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 border-2 border-foreground bg-primary/5 flex items-center justify-center">
                                <UserCircle className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-foreground/50 mb-0.5">Author</p>
                                <p className="text-sm font-bold text-foreground font-serif italic">"{article.author_name || article.profiles?.full_name || 'Tim Arvela'}"</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <LikeDislikeButtons articleId={article.id} initialLikes={article.likes} initialDislikes={article.dislikes} />
                            <div className="w-px h-6 bg-foreground hidden sm:block"></div>
                            <ShareButton />
                        </div>
                    </div>
                </header>

                <div className="prose prose-slate prose-lg md:prose-xl max-w-none 
                    prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground prose-headings:uppercase
                    prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                    prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:font-medium prose-p:font-sans
                    prose-strong:text-foreground prose-strong:font-black
                    prose-li:text-foreground/80
                    text-[17px] md:text-[19px] whitespace-pre-wrap">
                    {article.content}
                </div>

                <div className="mt-24">
                    <div className="bg-primary text-foreground border-2 border-foreground p-8 md:p-12 text-center relative overflow-hidden flex flex-col items-center shadow-[12px_12px_0px_0px_rgba(14,13,10,1)]">
                        <div className="relative z-10 space-y-6 w-full">
                            <div className="w-16 h-16 border-2 border-foreground bg-background flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(14,13,10,1)]">
                                <Building className="w-8 h-8 text-foreground" />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-black tracking-tighter max-w-2xl mx-auto text-foreground uppercase leading-[1.1]">
                                Fokus Bangun Bisnis Anda, Biar <span className="font-serif italic text-background normal-case">Arvela</span> Mengurus Beban HR.
                            </h3>
                            <p className="text-foreground/80 font-medium max-w-xl mx-auto font-serif italic text-lg">
                                "Mulai kelola sistem HR perusahaan Anda dengan mudah dan terjangkau! Hanya Rp10.000 / karyawan / bulan."
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                                <a href="https://wa.me/6285727627146" target="_blank" rel="noopener noreferrer" className="bg-background text-foreground font-black px-8 py-4 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(250,247,241,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(250,247,241,1)] w-full sm:w-auto uppercase tracking-widest text-sm">
                                    Coba Arvela Sekarang
                                </a>
                                <Link href="/careers/login" className="bg-transparent text-foreground font-black px-8 py-4 transition-all border-2 border-foreground w-full sm:w-auto uppercase tracking-widest text-sm hover:bg-foreground hover:text-background">
                                    Login Portal
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            <PublicFooter />
        </div>
    )
}
