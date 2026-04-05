import { createAdminSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getMetadata } from '@/lib/seo'
import { ArrowRight, BookOpen, Clock, UserCircle } from 'lucide-react'

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
        <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-6">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">Arvela Library</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Panduan & Artikel HR</h1>
                    <p className="text-slate-500 max-w-2xl mx-auto font-medium">Baca panduan terbaru tentang optimasi rekrutmen, retensi karyawan, hingga integrasi sistem HRIS modern untuk perusahaan Anda.</p>
                </div>

                {error ? (
                    <div className="text-center text-rose-500 font-bold p-10 bg-rose-50 rounded-2xl">
                        Terjadi kesalahan memuat artikel.
                    </div>
                ) : articles?.length === 0 ? (
                    <div className="text-center text-slate-400 font-bold p-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        Belum ada artikel yang diterbitkan saat ini.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((article) => (
                            <Link key={article.id} href={`/articles/${article.slug}`} className="group bg-white rounded-3xl p-6 border border-slate-100 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 flex flex-col h-full">
                                <div className="flex items-center gap-3 text-xs text-slate-400 font-bold mb-4">
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>
                                            {new Date(article.published_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'long', year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-primary/5 text-primary px-2.5 py-1 rounded-md">
                                        <span>{article.category || 'Article'}</span>
                                    </div>
                                </div>
                                <h2 className="text-xl font-black text-slate-900 mb-3 group-hover:text-primary transition-colors leading-tight">
                                    {article.title}
                                </h2>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">
                                    {article.meta_description || 'Baca wawasan lebih mendalam tentang topik ini.'}
                                </p>
                                <div className="flex items-center justify-between border-t border-slate-50 pt-5 mt-auto">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                        <UserCircle className="w-4 h-4 text-slate-400" />
                                        <span>{article.author_name || article.profiles?.full_name || 'Tim Arvela'}</span>
                                    </div>
                                    <span className="flex items-center text-primary text-xs font-black uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                        Baca <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
