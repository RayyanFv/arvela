/**
 * Lightweight markdown to styled HTML converter — no external deps needed.
 * Supports: headings, bold, italic, lists, blockquotes, hr, tables, inline code, code blocks.
 * All styles match the Arvela brutalist design system.
 */

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function inlineMarkdown(text) {
    return text
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-black">$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em class="font-serif italic text-foreground/90">$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code class="bg-foreground/10 text-foreground font-mono text-sm px-1.5 py-0.5 rounded">$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary font-bold underline underline-offset-2 hover:text-foreground transition-colors">$1</a>')
}

function parseTable(block) {
    const lines = block.trim().split('\n')
    if (lines.length < 2) return null

    const headers = lines[0].split('|').map(c => c.trim()).filter(Boolean)
    const isSeparator = lines[1].split('|').every(c => /^[-: ]+$/.test(c.trim()))
    if (!isSeparator) return null

    const rows = lines.slice(2).map(line => line.split('|').map(c => c.trim()).filter(Boolean))

    const headerHtml = headers
        .map(h => `<th class="border border-foreground/20 px-4 py-3 text-left font-black uppercase tracking-widest text-xs">${inlineMarkdown(h)}</th>`)
        .join('')

    const rowsHtml = rows
        .map(cells => {
            const cellsHtml = cells
                .map(c => `<td class="border border-foreground/10 px-4 py-3 text-foreground/80 font-medium leading-relaxed">${inlineMarkdown(c)}</td>`)
                .join('')
            return `<tr class="even:bg-foreground/5 hover:bg-primary/5 transition-colors">${cellsHtml}</tr>`
        })
        .join('')

    return `<div class="overflow-x-auto my-8">
<table class="w-full border-collapse border-2 border-foreground text-sm">
<thead class="bg-foreground text-background"><tr>${headerHtml}</tr></thead>
<tbody>${rowsHtml}</tbody>
</table></div>`
}

export function markdownToHtml(markdown) {
    if (!markdown) return ''

    const lines = markdown.split('\n')
    const output = []
    let i = 0

    while (i < lines.length) {
        const line = lines[i]

        // ── Code block ───────────────────────────────────────────
        if (line.startsWith('```')) {
            const codeLines = []
            i++
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(escapeHtml(lines[i]))
                i++
            }
            output.push(`<pre class="bg-foreground text-background font-mono text-sm p-5 my-6 overflow-x-auto shadow-[4px_4px_0px_0px_rgba(238,117,34,1)]"><code>${codeLines.join('\n')}</code></pre>`)
            i++
            continue
        }

        // ── Headings ─────────────────────────────────────────────
        const h6 = line.match(/^#{6}\s+(.+)/)
        const h5 = line.match(/^#{5}\s+(.+)/)
        const h4 = line.match(/^#{4}\s+(.+)/)
        const h3 = line.match(/^#{3}\s+(.+)/)
        const h2 = line.match(/^#{2}\s+(.+)/)
        const h1 = line.match(/^#{1}\s+(.+)/)

        if (h2) {
            output.push(`<h2 class="text-3xl font-black text-foreground tracking-tighter uppercase mt-10 mb-4 leading-tight border-l-4 border-primary pl-4">${inlineMarkdown(h2[1])}</h2>`)
            i++; continue
        }
        if (h3) {
            output.push(`<h3 class="text-xl font-black text-foreground tracking-tight uppercase mt-8 mb-3">${inlineMarkdown(h3[1])}</h3>`)
            i++; continue
        }
        if (h4 || h5 || h6) {
            const match = h4 || h5 || h6
            output.push(`<h4 class="text-lg font-black text-foreground uppercase mt-6 mb-2">${inlineMarkdown(match[1])}</h4>`)
            i++; continue
        }
        if (h1) {
            output.push(`<h1 class="text-4xl font-black text-foreground tracking-tighter uppercase mt-12 mb-5 leading-tight">${inlineMarkdown(h1[1])}</h1>`)
            i++; continue
        }

        // ── HR ───────────────────────────────────────────────────
        if (/^---+$/.test(line.trim())) {
            output.push('<hr class="my-8 border-0 border-t-2 border-foreground/10" />')
            i++; continue
        }

        // ── Blockquote ───────────────────────────────────────────
        if (line.startsWith('> ')) {
            const quoteLines = []
            while (i < lines.length && lines[i].startsWith('> ')) {
                quoteLines.push(lines[i].slice(2))
                i++
            }
            const quoteContent = quoteLines.map(l => inlineMarkdown(l)).join('<br />')
            output.push(`<blockquote class="border-l-4 border-primary bg-primary/5 px-6 py-4 my-6 font-serif text-foreground/80 text-lg">${quoteContent}</blockquote>`)
            continue
        }

        // ── Table detection ──────────────────────────────────────
        if (line.includes('|')) {
            const tableLines = []
            while (i < lines.length && lines[i].includes('|')) {
                tableLines.push(lines[i])
                i++
            }
            const tableHtml = parseTable(tableLines.join('\n'))
            if (tableHtml) { output.push(tableHtml); continue }
            // Not a real table — fall through treating each as paragraph
            tableLines.forEach(tl => {
                if (tl.trim()) output.push(`<p class="text-foreground/80 leading-[1.85] font-medium mb-5 text-[17px]">${inlineMarkdown(tl)}</p>`)
            })
            continue
        }

        // ── Unordered list ───────────────────────────────────────
        if (/^[-*+] /.test(line)) {
            const items = []
            while (i < lines.length && /^[-*+] /.test(lines[i])) {
                items.push(lines[i].replace(/^[-*+] /, ''))
                i++
            }
            const liHtml = items
                .map(it => `<li class="text-foreground/80 leading-[1.8] font-medium flex gap-2"><span class="text-primary font-black mt-0.5 flex-shrink-0">—</span><span>${inlineMarkdown(it)}</span></li>`)
                .join('')
            output.push(`<ul class="mb-6 space-y-2">${liHtml}</ul>`)
            continue
        }

        // ── Ordered list ─────────────────────────────────────────
        if (/^\d+\. /.test(line)) {
            const items = []
            while (i < lines.length && /^\d+\. /.test(lines[i])) {
                items.push(lines[i].replace(/^\d+\. /, ''))
                i++
            }
            const liHtml = items
                .map((it, idx) => `<li class="text-foreground/80 leading-[1.8] font-medium flex gap-2"><span class="text-primary font-black min-w-[1.5rem] flex-shrink-0">${idx + 1}.</span><span>${inlineMarkdown(it)}</span></li>`)
                .join('')
            output.push(`<ol class="mb-6 space-y-2">${liHtml}</ol>`)
            continue
        }

        // ── Empty line ───────────────────────────────────────────
        if (!line.trim()) {
            i++; continue
        }

        // ── Paragraph ────────────────────────────────────────────
        const paraLines = []
        while (i < lines.length && lines[i].trim() && !lines[i].match(/^[#>`-]/) && !lines[i].match(/^\d+\. /)) {
            paraLines.push(lines[i])
            i++
        }
        if (paraLines.length) {
            output.push(`<p class="text-foreground/80 leading-[1.85] font-medium mb-5 text-[17px]">${inlineMarkdown(paraLines.join(' '))}</p>`)
        }
    }

    return output.join('\n')
}
