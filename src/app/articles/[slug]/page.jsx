import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMetadata } from '@/lib/seo'
import { ArrowLeft, UserCircle, Calendar } from 'lucide-react'
import { ShareButton } from '@/components/ui/ShareButton'
import { LikeDislikeButtons } from '@/components/ui/LikeDislikeButtons'

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
        <div className="min-h-screen bg-white">
            <div className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 hidden md:block">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/articles" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Artikel
                    </Link>
                    <div className="flex items-center gap-2">
                        <img src="/arvela-logo.png" alt="Arvela Logo" className="w-6 h-6 grayscale opacity-80" />
                        <span className="text-slate-900 font-black tracking-tight text-sm">Arvela Library</span>
                    </div>
                </div>
            </div>

            <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
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
                                "name": "Arvela HR",
                                "logo": {
                                    "@type": "ImageObject",
                                    "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://arvela.id'}/arvela-logo.png`
                                }
                            }
                        })
                    }}
                />
                <header className="mb-12 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                        <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em] bg-primary/5 px-3 py-1 rounded-full">
                            {article.category || 'Research & Guide'}
                        </span>
                        <div className="flex items-center text-xs font-bold text-slate-400 gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(article.published_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </div>
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.15] tracking-tighter mb-8">
                        {article.title}
                    </h1>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-6 border-y border-slate-100 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                <UserCircle className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Author</p>
                                <p className="text-sm font-bold text-slate-900">{article.author_name || article.profiles?.full_name || 'Tim Arvela'}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <LikeDislikeButtons articleId={article.id} initialLikes={article.likes} initialDislikes={article.dislikes} />
                            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
                            <ShareButton />
                        </div>
                    </div>
                </header>

                <div className="prose prose-slate prose-lg md:prose-xl max-w-none 
                    prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
                    prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                    prose-p:text-slate-600 prose-p:leading-relaxed prose-p:font-medium text-[17px] md:text-[19px] whitespace-pre-wrap">
                    {article.content}
                </div>

                <div className="mt-20 pt-12 border-t border-slate-100">
                    <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden flex flex-col items-center">
                        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150 opacity-40"></div>
                        <div className="relative z-10 space-y-6 w-full">
                            <h3 className="text-2xl md:text-3xl font-black tracking-tighter max-w-2xl mx-auto text-white">
                                Fokus Bangun Bisnis Anda, Biar Arvela yang Mengurus Beban Administrasi HR.
                            </h3>
                            <p className="text-slate-400 font-medium max-w-xl mx-auto">
                                Mulai kelola sistem HR perusahaan Anda dengan mudah dan terjangkau! Hanya Rp10.000 / karyawan / bulan dengan Arvela.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                                <a href="https://wa.me/6285727627146" target="_blank" rel="noopener noreferrer" className="bg-primary hover:bg-white hover:text-primary text-white font-black px-8 py-3.5 rounded-xl shadow-xl shadow-primary/20 transition-all w-full sm:w-auto">
                                    Coba Arvela Sekarang
                                </a>
                                <Link href="/portal/login" className="bg-slate-800 hover:bg-slate-700 text-white font-black px-8 py-3.5 rounded-xl transition-all border border-white/5 w-full sm:w-auto">
                                    Login Portal
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    )
}
