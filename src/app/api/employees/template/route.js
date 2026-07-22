import * as XLSX from 'xlsx'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { getAuthProfile } from '@/lib/actions/auth-helpers'

/**
 * GET /api/employees/template
 * Streams a color-coded .xlsx template with active Reference Data tab.
 * - Green columns = mandatory fields
 * - Yellow columns = reference data fields (validated against Tab 2)
 * - Gray columns = optional fields
 */
export async function GET() {
    const supabase = createAdminSupabaseClient()

    let companyId = null
    try {
        const { profile } = await getAuthProfile({ requireAdmin: false })
        companyId = profile.company_id
    } catch (e) {
        // Fallback: pick first active company if unauthenticated GET
        const { data: c } = await supabase.from('companies').select('id').limit(1).single()
        companyId = c?.id
    }

    // Fetch reference data from database
    const [{ data: depts }, { data: grades }, { data: managers }] = await Promise.all([
        supabase.from('departments').select('name, level').eq('company_id', companyId).order('name'),
        supabase.from('job_grades').select('name, level').eq('company_id', companyId).order('level', { ascending: false }),
        supabase.from('profiles').select('full_name, email, role').eq('company_id', companyId).order('full_name'),
    ])

    const validDepts = (depts || []).map(d => [d.name])
    const validGrades = (grades || []).map(g => [g.name])
    const validManagers = (managers || []).map(m => [`${m.full_name} <${m.email}>`, m.email])

    const wb = XLSX.utils.book_new()

    // ─── Column definitions ─────────────────────────────────────────────────────
    const columns = [
        { header: 'Nama Lengkap *', key: 'full_name', type: 'required', example: 'Budi Santoso' },
        { header: 'Email *', key: 'email', type: 'required', example: 'budi.santoso@perusahaan.com' },
        { header: 'Jabatan *', key: 'job_title', type: 'required', example: 'Software Engineer' },
        { header: 'Tanggal Bergabung *', key: 'joined_at', type: 'required', example: '2026-01-15' },
        { header: 'Unit Kerja / Departemen', key: 'department', type: 'reference', example: validDepts[0]?.[0] || 'Engineering' },
        { header: 'Pangkat / Golongan', key: 'pangkat', type: 'reference', example: validGrades[0]?.[0] || 'Sersan / Level 5' },
        { header: 'Email Atasan Langsung', key: 'manager_email', type: 'reference', example: validManagers[0]?.[1] || 'head@perusahaan.com' },
        { header: 'No. Handphone', key: 'phone', type: 'optional', example: '081234567890' },
        { header: 'Status', key: 'status', type: 'optional', example: 'active' },
    ]

    // ─── Tab 1: Template Karyawan ───────────────────────────────────────────────
    const headerRow = columns.map(c => c.header)
    const exampleRow = columns.map(c => c.example)
    const emptyRows = Array(10).fill(columns.map(() => ''))

    const ws = XLSX.utils.aoa_to_sheet([
        headerRow,
        exampleRow,
        ...emptyRows,
    ])

    ws['!cols'] = columns.map(() => ({ wch: 30 }))

    // Fills for headers
    const fills = {
        required:  { fgColor: { rgb: 'D9EAD3' } }, // Green
        reference: { fgColor: { rgb: 'FFF2CC' } }, // Yellow
        optional:  { fgColor: { rgb: 'EFEFEF' } }, // Gray
    }
    const fonts = {
        required:  { bold: true, color: { rgb: '276221' } },
        reference: { bold: true, color: { rgb: 'B45F06' } },
        optional:  { bold: true, color: { rgb: '555555' } },
    }

    columns.forEach((col, colIdx) => {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: colIdx })
        if (!ws[cellAddr]) ws[cellAddr] = { v: headerRow[colIdx], t: 's' }
        ws[cellAddr].s = {
            fill: { patternType: 'solid', ...fills[col.type] },
            font: fonts[col.type],
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        }
    })

    // Style row 2 (example)
    columns.forEach((_, colIdx) => {
        const cellAddr = XLSX.utils.encode_cell({ r: 1, c: colIdx })
        if (!ws[cellAddr]) ws[cellAddr] = { v: exampleRow[colIdx], t: 's' }
        ws[cellAddr].s = {
            fill: { patternType: 'solid', fgColor: { rgb: 'F9F9F9' } },
            font: { italic: true, color: { rgb: '777777' } },
        }
    })

    // ─── Tab 2: Master Data Referensi Valid ─────────────────────────────────────
    const refData = [
        ['--- UNIT KERJA / DEPARTEMEN ---', '--- PANGKAT / GOLONGAN ---', '--- EMAIL ATASAN LANGSUNG ---'],
    ]
    const maxLen = Math.max(validDepts.length, validGrades.length, validManagers.length, 1)
    for (let i = 0; i < maxLen; i++) {
        refData.push([
            validDepts[i]?.[0] || '',
            validGrades[i]?.[0] || '',
            validManagers[i]?.[1] || '',
        ])
    }

    const refWs = XLSX.utils.aoa_to_sheet(refData)
    refWs['!cols'] = [{ wch: 35 }, { wch: 30 }, { wch: 40 }]

    // ─── Tab 3: Keterangan ──────────────────────────────────────────────────────
    const legendWs = XLSX.utils.aoa_to_sheet([
        ['PETUNJUK PENGISIAN TEMPLATE IMPORT KARYAWAN'],
        [],
        ['Warna Header', 'Keterangan Kategori', 'Aturan Impor'],
        ['🟩 Hijau', 'Wajib Diisi (Mandatory)', 'Import akan GAGAL jika kolom ini kosong.'],
        ['🟨 Kuning', 'Data Referensi Master', 'HARUS COCOK dengan daftar di Tab "Daftar Referensi". Jika tidak cocok, system return error.'],
        ['⬜ Abu-abu', 'Opsional', 'Boleh dikosongkan.'],
        [],
        ['PENTING:'],
        ['1. Harap gunakan data Unit Kerja, Pangkat, dan Email Atasan yang terdaftar di Tab "Daftar Referensi".'],
        ['2. Jika data referensi tidak ditemukan di sistem, proses import untuk baris tersebut akan ditolak (return error).'],
    ])
    legendWs['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 65 }]

    XLSX.utils.book_append_sheet(wb, ws, 'Template Karyawan')
    XLSX.utils.book_append_sheet(wb, refWs, 'Daftar Referensi')
    XLSX.utils.book_append_sheet(wb, legendWs, 'Petunjuk & Aturan')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new Response(buf, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="template-import-karyawan.xlsx"',
            'Content-Length': buf.length.toString(),
        },
    })
}
