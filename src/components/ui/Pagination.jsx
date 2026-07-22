'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Reusable Pagination Bar for Arvela Dashboard
 *
 * @param {Object} props
 * @param {number} props.currentPage - Active 1-indexed page number
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalCount - Total number of records
 * @param {number} [props.limit=10] - Items per page
 * @param {string} props.baseUrl - Base path (e.g. '/dashboard/employees')
 * @param {Object} [props.searchParams] - Existing query params object to preserve
 */
export function Pagination({ currentPage, totalPages, totalCount, limit = 10, baseUrl, searchParams = {} }) {
    if (totalPages <= 1) return null

    const page = Math.max(1, parseInt(currentPage || '1', 10))
    const startIdx = (page - 1) * limit + 1
    const endIdx = Math.min(page * limit, totalCount)

    const createPageUrl = (targetPage) => {
        const params = new URLSearchParams()
        Object.entries(searchParams).forEach(([k, v]) => {
            if (k !== 'page' && v) params.set(k, v)
        })
        params.set('page', targetPage.toString())
        return `${baseUrl}?${params.toString()}`
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm gap-4">
            <p className="text-xs font-bold text-slate-400">
                Menampilkan <span className="text-slate-900 font-extrabold">{startIdx}-{endIdx}</span> dari <span className="text-slate-900 font-extrabold">{totalCount}</span> data
            </p>

            <div className="flex items-center gap-2">
                <Link
                    href={createPageUrl(Math.max(1, page - 1))}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                        page <= 1
                            ? 'pointer-events-none opacity-40 bg-slate-50 text-slate-400'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-xs'
                    }`}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Link>

                <span className="text-xs font-black text-slate-900 px-3 py-1 bg-slate-50 rounded-xl border border-slate-100">
                    Halaman {page} / {totalPages}
                </span>

                <Link
                    href={createPageUrl(Math.min(totalPages, page + 1))}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                        page >= totalPages
                            ? 'pointer-events-none opacity-40 bg-slate-50 text-slate-400'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-xs'
                    }`}
                >
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    )
}
