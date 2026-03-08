import AssessmentBasicForm from '../BasicForm'

export const metadata = { title: 'Buat Assessment — Arvela HR' }

export default function NewAssessmentPage() {
    return (
        <div className="py-8">
            <div className="max-w-3xl mx-auto mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-xs font-bold text-primary uppercase tracking-widest mb-4">
                    Assessment Baru
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Siapkan Ujian Kompetensi</h1>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                    Assessment otomatis membantu kamu menyaring ratusan kandidat tanpa perlu meninjau satu per satu secara manual.
                </p>
            </div>

            <AssessmentBasicForm />
        </div>
    )
}
