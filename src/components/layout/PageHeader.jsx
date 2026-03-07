export function PageHeader({ title, description, action }) {
    return (
        <div className="flex items-start justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold text-sidebar-bg">{title}</h1>
                {description && (
                    <p className="text-sm text-sidebar-muted mt-1">{description}</p>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    )
}
