'use client'

// ──────────────────────────────────────────────────
// MODULE  : Onboarding Template Management (Mod 6)
// FILE    : app/dashboard/onboarding/page.jsx
// TABLES  : onboarding_templates, onboarding_tasks
// ACCESS  : PROTECTED — hr, super_admin
// SKILL   : baca Arvela/SKILL.md sebelum edit file ini
// ──────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Plus, Trash2, ChevronDown, ChevronUp,
    GripVertical, BookOpen, ClipboardList, Pencil, CheckCircle2
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'

export default function OnboardingTemplatePage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)
    const [templates, setTemplates] = useState([])
    const [expanded, setExpanded] = useState(null)
    const [newTemplateName, setNewTemplateName] = useState('')
    const [creatingTemplate, setCreatingTemplate] = useState(false)
    const [showTemplateForm, setShowTemplateForm] = useState(false)

    // New task form state per template
    const [newTask, setNewTask] = useState({})
    const [addingTask, setAddingTask] = useState(null)

    async function loadTemplates(cid) {
        const { data } = await supabase
            .from('onboarding_templates')
            .select('id, name, created_at, onboarding_tasks(id, title, description, due_days, order_index)')
            .eq('company_id', cid)
            .order('created_at', { ascending: false })
        setTemplates(data || [])
    }

    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser()
            const { data: prof } = await supabase
                .from('profiles').select('id, company_id, full_name').eq('id', user.id).single()
            setProfile(prof)
            if (prof?.company_id) await loadTemplates(prof.company_id)
            setLoading(false)
        }
        init()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function createTemplate() {
        if (!newTemplateName.trim()) return
        setCreatingTemplate(true)
        await supabase.from('onboarding_templates').insert({
            company_id: profile.company_id,
            created_by: profile.id,
            name: newTemplateName.trim(),
        })
        setNewTemplateName('')
        setShowTemplateForm(false)
        await loadTemplates(profile.company_id)
        setCreatingTemplate(false)
    }

    async function deleteTemplate(id) {
        await supabase.from('onboarding_tasks').delete().eq('template_id', id)
        await supabase.from('onboarding_templates').delete().eq('id', id)
        await loadTemplates(profile.company_id)
        if (expanded === id) setExpanded(null)
    }

    async function addTask(templateId) {
        const t = newTask[templateId]
        if (!t?.title?.trim()) return
        setAddingTask(templateId)
        const tasks = templates.find(tm => tm.id === templateId)?.onboarding_tasks || []
        const { error } = await supabase.from('onboarding_tasks').insert({
            template_id: templateId,
            title: t.title.trim(),
            description: t.description?.trim() || null,
            due_days: t.due_days ? parseInt(t.due_days) : null,
            order_index: tasks.length,
        })

        if (error) {
            console.error('Error adding task:', error)
            alert('Gagal menambah tugas: ' + error.message)
        }

        setNewTask(prev => ({ ...prev, [templateId]: { title: '', description: '', due_days: '' } }))
        await loadTemplates(profile.company_id)
        setAddingTask(null)
    }

    async function deleteTask(taskId) {
        await supabase.from('onboarding_tasks').delete().eq('id', taskId)
        await loadTemplates(profile.company_id)
    }

    if (loading) return (
        <div className="space-y-4 max-w-3xl">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
    )

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-24">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-primary" />
                        Onboarding Templates
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Buat template checklist onboarding yang akan di-assign ke karyawan baru.
                    </p>
                </div>
                <Button
                    onClick={() => setShowTemplateForm(v => !v)}
                    className="rounded-xl bg-primary text-primary-foreground font-bold gap-2 shrink-0"
                >
                    <Plus className="w-4 h-4" /> Template Baru
                </Button>
            </div>

            {/* Create Template Form */}
            {showTemplateForm && (
                <Card className="p-5 border-none shadow-sm rounded-2xl border-l-4 border-l-primary">
                    <p className="text-sm font-black text-foreground mb-3">Nama Template Baru</p>
                    <div className="flex gap-3">
                        <Input
                            placeholder="cth: Onboarding Engineering, Onboarding Sales..."
                            value={newTemplateName}
                            onChange={e => setNewTemplateName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && createTemplate()}
                            className="rounded-xl"
                            autoFocus
                        />
                        <Button
                            onClick={createTemplate}
                            disabled={creatingTemplate || !newTemplateName.trim()}
                            className="rounded-xl bg-primary text-primary-foreground font-bold shrink-0"
                        >
                            {creatingTemplate ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button variant="ghost" onClick={() => { setShowTemplateForm(false); setNewTemplateName('') }} className="rounded-xl">
                            Batal
                        </Button>
                    </div>
                </Card>
            )}

            {/* Templates List */}
            {templates.length === 0 ? (
                <Card className="p-16 border-none shadow-sm rounded-2xl text-center">
                    <BookOpen className="w-12 h-12 text-muted mx-auto mb-4" />
                    <h3 className="font-black text-foreground mb-1">Belum ada template onboarding</h3>
                    <p className="text-muted-foreground text-sm">Buat template pertama untuk mulai menyusun checklist karyawan baru.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {templates.map(template => {
                        const isOpen = expanded === template.id
                        const tasks = [...(template.onboarding_tasks || [])].sort((a, b) => a.order_index - b.order_index)
                        const taskForm = newTask[template.id] || { title: '', description: '', due_days: '' }

                        return (
                            <Card key={template.id} className="border-none shadow-sm rounded-2xl overflow-hidden">
                                {/* Template Header */}
                                <div
                                    className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                                    onClick={() => setExpanded(isOpen ? null : template.id)}
                                >
                                    <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                                        <ClipboardList className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-foreground truncate">{template.name}</h3>
                                        <p className="text-xs text-muted-foreground">{tasks.length} tugas</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <AlertDialog>
                                            <AlertDialogTrigger render={<Button
                                                variant="ghost" size="icon"
                                                className="w-8 h-8 text-muted-foreground hover:text-destructive rounded-xl"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>}
                                            />
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Hapus template ini?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Template <strong>{template.name}</strong> beserta semua tugasnya akan dihapus permanen.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-destructive text-destructive-foreground"
                                                        onClick={() => deleteTemplate(template.id)}
                                                    >
                                                        Hapus
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        {isOpen
                                            ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                                            : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                                        }
                                    </div>
                                </div>

                                {/* Tasks */}
                                {isOpen && (
                                    <div className="border-t border-border">
                                        {/* Task List */}
                                        {tasks.length === 0 ? (
                                            <p className="px-5 py-4 text-sm text-muted-foreground italic">Belum ada tugas. Tambahkan di bawah.</p>
                                        ) : (
                                            <div className="divide-y divide-border">
                                                {tasks.map((task, idx) => (
                                                    <div key={task.id} className="px-5 py-3.5 flex items-start gap-3 group hover:bg-muted/20 transition-colors">
                                                        <CheckCircle2 className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-foreground text-sm">{task.title}</p>
                                                            {task.description && (
                                                                <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                                                            )}
                                                            {task.due_days && (
                                                                <p className="text-[10px] font-bold text-primary mt-1">
                                                                    Selesaikan dalam {task.due_days} hari
                                                                </p>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            className="w-7 h-7 text-muted-foreground hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                            onClick={() => deleteTask(task.id)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Task Form */}
                                        <div className="px-5 py-4 bg-muted/20 space-y-2">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tambah Tugas</p>
                                            <Input
                                                placeholder="Judul tugas, cth: Lengkapi Data Diri"
                                                value={taskForm.title}
                                                onChange={e => setNewTask(p => ({ ...p, [template.id]: { ...taskForm, title: e.target.value } }))}
                                                className="rounded-xl text-sm"
                                            />
                                            <Textarea
                                                placeholder="Deskripsi tugas (opsional)"
                                                value={taskForm.description}
                                                onChange={e => setNewTask(p => ({ ...p, [template.id]: { ...taskForm, description: e.target.value } }))}
                                                className="rounded-xl text-sm min-h-0 h-16 resize-none"
                                            />
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    type="number"
                                                    placeholder="Batas hari (opsional)"
                                                    value={taskForm.due_days}
                                                    onChange={e => setNewTask(p => ({ ...p, [template.id]: { ...taskForm, due_days: e.target.value } }))}
                                                    className="rounded-xl text-sm w-44"
                                                    min={1}
                                                />
                                                <Button
                                                    onClick={() => addTask(template.id)}
                                                    disabled={addingTask === template.id || !taskForm.title?.trim()}
                                                    size="sm"
                                                    className="rounded-xl bg-primary text-primary-foreground font-bold gap-1.5"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    {addingTask === template.id ? 'Menyimpan...' : 'Tambah'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
