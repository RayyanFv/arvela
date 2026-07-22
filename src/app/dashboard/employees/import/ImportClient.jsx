'use client'

import { useState, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { 
    Download, Upload, CheckCircle2, XCircle, AlertTriangle,
    FileSpreadsheet, ArrowRight, Loader2, Users, RefreshCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { bulkImportEmployees } from '@/lib/actions/employees'

// ─── Constants ────────────────────────────────────────────────────────────────
const REQUIRED_COLS = ['Nama Lengkap *', 'Email *', 'Jabatan *', 'Tanggal Bergabung *']
const COL_MAP = {
    'Nama Lengkap *':      'full_name',
    'Email *':             'email',
    'Jabatan *':           'job_title',
    'Tanggal Bergabung *': 'joined_at',
    'Departemen':          'department',
    'No. Handphone':       'phone',
    'Email Atasan':        'manager_email',
    'Status':              'status',
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ─── Validation ───────────────────────────────────────────────────────────────
function validateRows(rows) {
    return rows.map((row, idx) => {
        const errors = []
        if (!row.full_name?.trim())                  errors.push('Nama Lengkap wajib diisi')
        if (!row.email?.trim())                      errors.push('Email wajib diisi')
        else if (!EMAIL_RE.test(row.email.trim()))   errors.push('Format email tidak valid')
        if (!row.job_title?.trim())                  errors.push('Jabatan wajib diisi')
        if (!row.joined_at?.trim())                  errors.push('Tanggal Bergabung wajib diisi')
        return { ...row, _rowNum: idx + 3, _errors: errors, _valid: errors.length === 0 }
    })
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function EmployeeImportPage({ companyId }) {
    const [step, setStep]               = useState(1) // 1=Download, 2=Upload, 3=Result
    const [rows, setRows]               = useState([])
    const [isDragging, setIsDragging]   = useState(false)
    const [fileName, setFileName]       = useState(null)
    const [parseError, setParseError]   = useState(null)
    const [isImporting, setIsImporting] = useState(false)
    const [result, setResult]           = useState(null)
    const fileRef                       = useRef(null)

    // ─── Parse Excel ─────────────────────────────────────────────────────────
    const parseFile = useCallback((file) => {
        setParseError(null)
        setRows([])
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const wb   = XLSX.read(e.target.result, { type: 'array' })
                const ws   = wb.Sheets[wb.SheetNames[0]]
                const raw  = XLSX.utils.sheet_to_json(ws, { header: 1 })

                if (raw.length < 2) {
                    setParseError('File kosong atau tidak memiliki data.')
                    return
                }

                const headers = raw[0]
                // Skip row 0 (headers) and row 1 (example/gray row)
                const dataRows = raw.slice(2).filter(r => r.some(c => c !== undefined && c !== ''))

                if (dataRows.length === 0) {
                    setParseError('Tidak ada data karyawan yang ditemukan. Pastikan data dimulai dari baris ke-3.')
                    return
                }

                const mapped = dataRows.map(row => {
                    const obj = {}
                    headers.forEach((h, i) => {
                        const key = COL_MAP[h]
                        if (key) obj[key] = row[i] !== undefined ? String(row[i]).trim() : ''
                    })
                    return obj
                })

                setRows(validateRows(mapped))
                setFileName(file.name)
                setStep(2)
            } catch (err) {
                setParseError(`Gagal membaca file: ${err.message}`)
            }
        }
        reader.readAsArrayBuffer(file)
    }, [])

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) parseFile(file)
    }

    const handleFileInput = (e) => {
        const file = e.target.files[0]
        if (file) parseFile(file)
    }

    // ─── Import ───────────────────────────────────────────────────────────────
    const handleImport = async () => {
        const validRows = rows.filter(r => r._valid)
        setIsImporting(true)
        try {
            const res = await bulkImportEmployees(
                validRows.map(({ _rowNum, _errors, _valid, ...rest }) => rest),
                companyId
            )
            setResult(res)
            setStep(3)
        } catch (err) {
            setResult({ succeeded: [], failed: [{ email: '-', full_name: '-', error: err.message }] })
            setStep(3)
        } finally {
            setIsImporting(false)
        }
    }

    const reset = () => {
        setStep(1); setRows([]); setFileName(null)
        setParseError(null); setResult(null); setIsImporting(false)
    }

    const validCount   = rows.filter(r => r._valid).length
    const invalidCount = rows.filter(r => !r._valid).length

    return (
        <div className="space-y-8 pb-20 max-w-5xl mx-auto">
            {/* ── Header ── */}
            <div>
                <h1 className="text-2xl font-black text-slate-900">Import Karyawan</h1>
                <p className="text-slate-500 text-sm font-medium mt-1">
                    Upload file Excel untuk menambahkan banyak karyawan sekaligus.
                </p>
            </div>

            {/* ── Stepper ── */}
            <div className="flex items-center gap-2">
                {['Download Template', 'Upload & Validasi', 'Hasil Import'].map((label, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all
                            ${step === i + 1 ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : step > i + 1  ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-400'}`}>
                            {step > i + 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                            {label}
                        </div>
                        {i < 2 && <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />}
                    </div>
                ))}
            </div>

            {/* ─────────────────────────── STEP 1: Download ─────────────────────── */}
            {step === 1 && (
                <Card className="p-8 rounded-3xl border-none shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Legend */}
                        <div className="space-y-4">
                            <h3 className="font-black text-slate-800">Panduan Pengisian Template</h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-2xl">
                                    <div className="w-4 h-4 rounded bg-emerald-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-emerald-800">Kolom Hijau — WAJIB</p>
                                        <p className="text-xs text-emerald-700 mt-0.5">Nama Lengkap, Email, Jabatan, Tanggal Bergabung</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-2xl">
                                    <div className="w-4 h-4 rounded bg-amber-300 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-amber-800">Kolom Kuning — OPSIONAL</p>
                                        <p className="text-xs text-amber-700 mt-0.5">Departemen, No. HP, Email Atasan, Status</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-2xl space-y-1">
                                <p className="text-xs font-black text-blue-800">📧 Undangan Otomatis</p>
                                <p className="text-xs text-blue-700">Setiap karyawan baru akan menerima email undangan untuk mengatur password mereka sendiri.</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                                <p className="text-xs font-black text-slate-700">🔄 Upsert — Aman Digunakan Ulang</p>
                                <p className="text-xs text-slate-500">Jika email sudah terdaftar, data akan diperbarui (bukan duplikat).</p>
                            </div>
                        </div>

                        {/* Download button */}
                        <div className="flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-2xl p-8 text-center">
                            <FileSpreadsheet className="w-16 h-16 text-emerald-500" />
                            <div>
                                <p className="font-black text-slate-800">Template Siap Pakai</p>
                                <p className="text-xs text-slate-500 mt-1">File .xlsx dengan kolom berwarna dan contoh data</p>
                            </div>
                            <a href="/api/employees/template" download>
                                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-black gap-2 rounded-2xl shadow-lg shadow-emerald-200">
                                    <Download className="w-4 h-4" /> Download Template
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Dropzone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                            ${isDragging ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'}`}
                    >
                        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-primary' : 'text-slate-300'}`} />
                        <p className="font-black text-slate-600">Drag & drop file di sini</p>
                        <p className="text-xs text-slate-400 mt-1">atau klik untuk memilih file .xlsx / .csv</p>
                        <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFileInput} />
                    </div>

                    {parseError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl text-red-700 text-xs font-bold">
                            <XCircle className="w-4 h-4 shrink-0" /> {parseError}
                        </div>
                    )}
                </Card>
            )}

            {/* ─────────────────────────── STEP 2: Validate ─────────────────────── */}
            {step === 2 && (
                <div className="space-y-4">
                    {/* Summary bar */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-sm font-black text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" /> {validCount} baris valid
                            </div>
                            {invalidCount > 0 && (
                                <div className="flex items-center gap-1.5 text-sm font-black text-red-500">
                                    <XCircle className="w-4 h-4" /> {invalidCount} baris error
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={reset}>
                                <RefreshCcw className="w-3.5 h-3.5" /> Upload ulang
                            </Button>
                            <Button 
                                onClick={handleImport} 
                                disabled={validCount === 0 || isImporting}
                                className="rounded-xl bg-primary text-white font-black gap-2 text-sm shadow-lg shadow-primary/20"
                            >
                                {isImporting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                                ) : (
                                    <><Users className="w-4 h-4" /> Import {validCount} Karyawan</>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Preview table */}
                    <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-wider text-[10px]">#</th>
                                        <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-wider text-[10px]">Nama</th>
                                        <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-wider text-[10px]">Email</th>
                                        <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-wider text-[10px]">Jabatan</th>
                                        <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-wider text-[10px]">Departemen</th>
                                        <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-wider text-[10px]">Bergabung</th>
                                        <th className="text-left px-4 py-3 font-black text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, i) => (
                                        <tr key={i} className={`border-b border-slate-50 transition-colors
                                            ${row._valid ? 'hover:bg-slate-50' : 'bg-red-50/50 hover:bg-red-50'}`}>
                                            <td className="px-4 py-3 text-slate-400 font-bold">{row._rowNum}</td>
                                            <td className="px-4 py-3 font-bold text-slate-800">{row.full_name || <span className="text-red-400 italic">kosong</span>}</td>
                                            <td className="px-4 py-3 text-slate-600">{row.email || <span className="text-red-400 italic">kosong</span>}</td>
                                            <td className="px-4 py-3 text-slate-600">{row.job_title || '-'}</td>
                                            <td className="px-4 py-3 text-slate-500">{row.department || '-'}</td>
                                            <td className="px-4 py-3 text-slate-500">{row.joined_at || '-'}</td>
                                            <td className="px-4 py-3">
                                                {row._valid ? (
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-black text-[10px]">VALID</span>
                                                ) : (
                                                    <div className="space-y-0.5">
                                                        {row._errors.map((e, j) => (
                                                            <div key={j} className="flex items-center gap-1 text-red-500 font-bold">
                                                                <AlertTriangle className="w-3 h-3 shrink-0" /> {e}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* ─────────────────────────── STEP 3: Result ───────────────────────── */}
            {step === 3 && result && (
                <div className="space-y-6">
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-6 rounded-3xl border-none shadow-sm bg-emerald-50 text-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                            <p className="text-3xl font-black text-emerald-700">{result.succeeded.length}</p>
                            <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-1">Berhasil Diimport</p>
                        </Card>
                        <Card className={`p-6 rounded-3xl border-none shadow-sm text-center ${result.failed.length > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                            {result.failed.length > 0
                                ? <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                                : <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />}
                            <p className={`text-3xl font-black ${result.failed.length > 0 ? 'text-red-600' : 'text-slate-400'}`}>{result.failed.length}</p>
                            <p className={`text-xs font-black uppercase tracking-widest mt-1 ${result.failed.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>Gagal</p>
                        </Card>
                    </div>

                    {/* Success list */}
                    {result.succeeded.length > 0 && (
                        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                                <h3 className="font-black text-emerald-800 text-sm">✅ Berhasil Diimport ({result.succeeded.length})</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {result.succeeded.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between px-6 py-3">
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{s.full_name}</p>
                                            <p className="text-xs text-slate-400">{s.email}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black
                                            ${s.action === 'created' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {s.action === 'created' ? 'BARU + UNDANGAN' : 'DIPERBARUI'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Error list */}
                    {result.failed.length > 0 && (
                        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-red-50 border-b border-red-100">
                                <h3 className="font-black text-red-800 text-sm">❌ Gagal Diimport ({result.failed.length})</h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {result.failed.map((f, i) => (
                                    <div key={i} className="flex items-start justify-between px-6 py-3">
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{f.full_name}</p>
                                            <p className="text-xs text-slate-400">{f.email}</p>
                                        </div>
                                        <p className="text-xs text-red-500 font-bold max-w-xs text-right">{f.error}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    <div className="flex items-center gap-3">
                        <Button onClick={reset} variant="outline" className="rounded-2xl gap-2 font-bold">
                            <RefreshCcw className="w-4 h-4" /> Import Lagi
                        </Button>
                        <a href="/dashboard/employees">
                            <Button className="bg-primary text-white rounded-2xl gap-2 font-black shadow-lg shadow-primary/20">
                                <Users className="w-4 h-4" /> Lihat Data Karyawan
                            </Button>
                        </a>
                    </div>
                </div>
            )}
        </div>
    )
}
