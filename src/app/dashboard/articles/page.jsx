import { createAdminSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Edit, Trash2, Globe, FileX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function ArticlesListPage() {
    const supabase = createAdminSupabaseClient()

    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, slug, category, author_name, status, published_at, created_at, views, likes, dislikes, profiles(full_name)')
        .order('created_at', { ascending: false })

    return (
        <div className="max-w-6xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Manajemen Konten & SEO</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola perbendaharaan artikel blog Arvela.</p>
                </div>
                <Link 
                    href="/dashboard/articles/create" 
                    className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105"
                >
                    <Plus className="w-4 h-4" />
                    Tulis Artikel
                </Link>
            </div>

            {error ? (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold">
                    Gagal mengambil data artikel: {error.message}
                </div>
            ) : articles?.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <FileX className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-slate-900 font-bold mb-1">Belum ada artikel</h3>
                    <p className="text-slate-500 text-sm mb-4">Mulailah menulis artikel pertama Anda untuk publik.</p>
                </div>
            ) : (
                <div className="bg-white border text-sm border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Judul</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Metrik</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Penulis</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400">Dibuat</th>
                                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-slate-400 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {articles.map((article) => (
                                    <tr key={article.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{article.title}</p>
                                            <p className="text-xs text-slate-400 font-mono mt-1">/{article.slug}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {article.status === 'published' ? (
                                                <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100 flex items-center gap-1 w-fit">
                                                    <Globe className="w-3 h-3" /> Published
                                                </Badge>
                                            ) : article.status === 'archived' ? (
                                                <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-none w-fit">
                                                    Archived
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-100 w-fit">
                                                    Draft
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 gap-3 w-fit text-xs font-bold text-slate-500">
                                                <span className="flex items-center gap-1 text-blue-600"><Globe className="w-3 h-3"/> {article.views || 0}</span>
                                                <span className="flex items-center gap-1 text-emerald-600">👍 {article.likes || 0}</span>
                                                <span className="flex items-center gap-1 text-rose-600">👎 {article.dislikes || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {article.author_name || article.profiles?.full_name || 'System'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {new Date(article.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                                <Link 
                                                    href={`/articles/${article.slug}`}
                                                    target="_blank"
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                                                    title="Preview Artikel"
                                                >
                                                    <Globe className="w-4 h-4" />
                                                </Link>
                                                <Link 
                                                    href={`/dashboard/articles/${article.id}/edit`}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 hover:bg-primary/10 hover:text-primary text-slate-400 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
