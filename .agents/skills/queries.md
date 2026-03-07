# Arvela — Query Reference: Fase 1 & 2

> File ini adalah referensi WAJIB DIBACA sebelum menulis query apapun yang menyentuh
> tabel `jobs`, `applications`, atau `stage_history`.
> Gunakan pola query ini secara KONSISTEN — jangan buat sendiri ad-hoc.

---

## KONVENSI UMUM

```js
// WAJIB: import dari path yang benar
import { createClient } from '@/lib/supabase/client'           // client component
import { createServerSupabaseClient } from '@/lib/supabase/server' // server component / server action

// WAJIB: selalu filter company_id di setiap query
// RLS adalah safety net, bukan pengganti filter eksplisit dari kode
```

---

## FASE 1 — JOBS

### Fetch semua jobs milik company (Dashboard HR)

```js
// Server Component atau Server Action
const supabase = await createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()

// ambil company_id dari profile
const { data: profile } = await supabase
  .from('profiles')
  .select('company_id')
  .eq('id', user.id)
  .single()

// fetch jobs — filter company_id EKSPLISIT
const { data: jobs, error } = await supabase
  .from('jobs')
  .select('id, title, slug, status, work_type, employment_type, location, deadline, created_at')
  .eq('company_id', profile.company_id)
  .order('created_at', { ascending: false })
```

### Fetch jobs dengan filter status

```js
const { data: jobs } = await supabase
  .from('jobs')
  .select('id, title, slug, status, deadline, created_at')
  .eq('company_id', profile.company_id)
  .eq('status', 'published')           // 'draft' | 'published' | 'closed'
  .order('published_at', { ascending: false })
```

### Fetch single job (edit form)

```js
const { data: job } = await supabase
  .from('jobs')
  .select('*')
  .eq('id', jobId)
  .eq('company_id', profile.company_id)  // WAJIB validasi company_id
  .single()
```

### Fetch jobs publik untuk career page (tanpa auth)

```js
// Client atau server — gunakan anon key (tidak perlu login)
// company harus diidentifikasi dari slug URL param
const { data: company } = await supabase
  .from('companies')
  .select('id, name, logo_url, industry, website')
  .eq('slug', companySlug)
  .single()

const { data: jobs } = await supabase
  .from('jobs')
  .select('id, title, slug, location, work_type, employment_type, deadline, published_at')
  .eq('company_id', company.id)
  .eq('status', 'published')
  .order('published_at', { ascending: false })
// SATU QUERY — tidak ada N+1
```

### Fetch job detail publik (job detail page)

```js
const { data: job } = await supabase
  .from('jobs')
  .select(`
    id, title, slug, description, requirements,
    location, work_type, employment_type, deadline, published_at,
    companies (name, logo_url, industry, website)
  `)
  .eq('slug', jobSlug)
  .eq('status', 'published')
  .single()
```

### INSERT job baru (Server Action)

```js
'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function createJob(formData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  // VALIDASI ROLE sebelum INSERT
  if (!['hr', 'super_admin'].includes(profile.role)) {
    throw new Error('Unauthorized')
  }

  // Generate slug via DB function
  const { data: slugData } = await supabase
    .rpc('generate_job_slug', {
      title: formData.title,
      company_id: profile.company_id
    })

  const { data: newJob, error } = await supabase
    .from('jobs')
    .insert({
      company_id:      profile.company_id,  // WAJIB dari session, bukan dari form
      created_by:      user.id,
      title:           formData.title,
      slug:            slugData,
      description:     formData.description,
      requirements:    formData.requirements,
      location:        formData.location,
      work_type:       formData.workType,
      employment_type: formData.employmentType,
      deadline:        formData.deadline || null,
      status:          formData.publish ? 'published' : 'draft',
      published_at:    formData.publish ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) throw error
  return newJob
}
```

### UPDATE job (publish / close / edit)

```js
'use server'
export async function updateJob(jobId, updates) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!['hr', 'super_admin'].includes(profile.role)) throw new Error('Unauthorized')

  // Siapkan payload — timestamp otomatis
  const payload = { ...updates }
  if (updates.status === 'published' && !updates.published_at) {
    payload.published_at = new Date().toISOString()
  }
  if (updates.status === 'closed') {
    payload.closed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('jobs')
    .update(payload)
    .eq('id', jobId)
    .eq('company_id', profile.company_id)  // WAJIB
    .select()
    .single()

  if (error) throw error
  return data
}
```

### DELETE job (hanya draft)

```js
'use server'
export async function deleteJob(jobId) {
  const supabase = await createServerSupabaseClient()
  // ... validasi role sama seperti atas

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)
    .eq('company_id', profile.company_id)
    .eq('status', 'draft')  // hanya bisa hapus draft — RLS juga enforce ini
}
```

---

## FASE 2 — APPLICATIONS

### INSERT application (form apply publik — tanpa auth)

```js
// Client Component — gunakan anon key
import { createClient } from '@/lib/supabase/client'

export async function submitApplication(jobId, companyId, formData, cvFile) {
  const supabase = createClient()

  // 1. Upload CV ke bucket 'cvs' jika ada
  let cvUrl = null
  if (cvFile) {
    const fileExt = cvFile.name.split('.').pop()
    const fileName = `${companyId}/${jobId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(fileName, cvFile, {
        contentType: cvFile.type,
        upsert: false,
      })

    if (uploadError) throw uploadError
    cvUrl = supabase.storage.from('cvs').getPublicUrl(fileName).data.publicUrl
    // catatan: bucket 'cvs' private — gunakan signed URL untuk download
  }

  // 2. INSERT application
  const { data, error } = await supabase
    .from('applications')
    .insert({
      job_id:       jobId,
      company_id:   companyId,     // denormalized, diisi dari props halaman
      full_name:    formData.fullName,
      email:        formData.email,
      phone:        formData.phone || null,
      cv_url:       cvUrl,
      cover_letter: formData.coverLetter || null,
    })
    .select('id')
    .single()

  if (error) {
    // Handle double apply — Postgres error code 23505
    if (error.code === '23505') {
      throw new Error('Anda sudah pernah melamar posisi ini sebelumnya.')
    }
    throw error
  }

  return data
}
```

### Fetch semua kandidat lintas job (Dashboard HR)

```js
const { data: applications } = await supabase
  .from('applications')
  .select(`
    id, full_name, email, phone, stage, created_at, updated_at,
    jobs (id, title, slug)
  `)
  .eq('company_id', profile.company_id)
  .order('created_at', { ascending: false })
```

### Fetch kandidat per job (pipeline kanban)

```js
const { data: applications } = await supabase
  .from('applications')
  .select('id, full_name, email, phone, stage, cv_url, created_at, updated_at')
  .eq('job_id', jobId)
  .eq('company_id', profile.company_id)  // validate ownership
  .order('created_at', { ascending: false })
// SATU QUERY — group by stage di JavaScript, bukan multiple queries
```

### Fetch detail kandidat + stage history

```js
const { data: application } = await supabase
  .from('applications')
  .select(`
    *,
    jobs (title, slug),
    stage_history (from_stage, to_stage, message_to_candidate, created_at, profiles(full_name))
  `)
  .eq('id', applicationId)
  .eq('company_id', profile.company_id)
  .single()
```

### UPDATE stage kandidat (Server Action)

```js
'use server'
export async function updateStage(applicationId, newStage, messageToCandidate = null) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!['hr', 'super_admin', 'hiring_manager', 'boss'].includes(profile.role)) {
    throw new Error('Unauthorized')
  }

  // UPDATE stage → DB trigger akan auto-insert ke stage_history
  const { data, error } = await supabase
    .from('applications')
    .update({
      stage: newStage,
      // Jika mau simpan rejection_reason:
      // rejection_reason: newStage === 'rejected' ? reason : undefined,
    })
    .eq('id', applicationId)
    .eq('company_id', profile.company_id)  // WAJIB
    .select()
    .single()

  if (error) throw error

  // Jika ada pesan ke kandidat, update stage_history terakhir
  // (opsional — bisa juga di trigger mengambil dari aplikasi)
  if (messageToCandidate) {
    await supabase
      .from('stage_history')
      .update({ message_to_candidate: messageToCandidate })
      .eq('application_id', applicationId)
      .eq('to_stage', newStage)
      .order('created_at', { ascending: false })
      .limit(1)
  }

  return data
}
```

### UPDATE internal notes (tanpa pindah stage)

```js
'use server'
export async function updateNotes(applicationId, internalNotes) {
  const supabase = await createServerSupabaseClient()
  // ... validasi role

  const { error } = await supabase
    .from('applications')
    .update({ internal_notes: internalNotes })
    .eq('id', applicationId)
    .eq('company_id', profile.company_id)
}
```

### Signed URL untuk download CV

```js
// Gunakan signed URL karena bucket 'cvs' bersifat private
const { data, error } = await supabase.storage
  .from('cvs')
  .createSignedUrl(filePath, 60 * 60) // expired dalam 1 jam

if (data) window.open(data.signedUrl)
```

---

## FILTER & SEARCH PATTERNS

```js
// Filter by stage
.eq('stage', 'screening')

// Filter by multiple stages (OR)
.in('stage', ['applied', 'screening'])

// Search nama atau email
.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)

// Filter by job
.eq('job_id', jobId)

// Filter by tanggal (dari - sampai)
.gte('created_at', fromDate.toISOString())
.lte('created_at', toDate.toISOString())

// Kombinasi filter
.eq('company_id', profile.company_id)
.eq('stage', filterStage)
.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
.order('created_at', { ascending: false })
.range(0, 19)  // pagination: page pertama 20 item
```

---

## ERROR HANDLING STANDAR

```js
const { data, error } = await supabase.from('jobs').insert({...})

if (error) {
  // Duplicate slug
  if (error.code === '23505' && error.message.includes('slug')) {
    return { error: 'Slug sudah dipakai, coba judul yang berbeda.' }
  }
  // Double apply
  if (error.code === '23505' && error.message.includes('job_id')) {
    return { error: 'Anda sudah pernah melamar posisi ini.' }
  }
  // Unauthorized (RLS reject)
  if (error.code === '42501') {
    return { error: 'Akses ditolak.' }
  }
  // Fallback
  return { error: error.message }
}
```

---

## CHECKLIST SEBELUM MENULIS QUERY BARU

- [ ] Apakah sudah filter `company_id` secara eksplisit?
- [ ] Apakah `company_id` diambil dari **session/profile**, bukan dari input user?
- [ ] Apakah sudah validasi role sebelum INSERT/UPDATE/DELETE?
- [ ] Apakah query ini single-query (tidak ada loop yang trigger query lagi)?
- [ ] Apakah error code Postgres `23505` (duplicate) sudah di-handle?
- [ ] Apakah stage_history diisi via trigger, bukan manual insert?
