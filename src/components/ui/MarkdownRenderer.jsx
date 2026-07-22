'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders article markdown content using react-markdown with remark-gfm.
 * Styled to match the brutalist Arvela design system.
 */
export default function MarkdownRenderer({ content }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ children }) => (
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase mt-12 mb-5 leading-tight">
                        {children}
                    </h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase mt-10 mb-4 leading-tight border-l-4 border-primary pl-4">
                        {children}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-xl font-black text-foreground tracking-tight uppercase mt-8 mb-3">
                        {children}
                    </h3>
                ),
                h4: ({ children }) => (
                    <h4 className="text-lg font-black text-foreground uppercase mt-6 mb-2">
                        {children}
                    </h4>
                ),
                p: ({ children }) => (
                    <p className="text-foreground/80 leading-[1.85] font-medium mb-5 text-[17px]">
                        {children}
                    </p>
                ),
                strong: ({ children }) => (
                    <strong className="text-foreground font-black">{children}</strong>
                ),
                em: ({ children }) => (
                    <em className="font-serif italic text-foreground/90">{children}</em>
                ),
                a: ({ href, children }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-bold underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                        {children}
                    </a>
                ),
                ul: ({ children }) => (
                    <ul className="mb-6 space-y-2 pl-6">
                        {children}
                    </ul>
                ),
                ol: ({ children }) => (
                    <ol className="mb-6 space-y-2 pl-6 list-decimal">
                        {children}
                    </ol>
                ),
                li: ({ children }) => (
                    <li className="text-foreground/80 leading-[1.8] font-medium relative">
                        <span className="absolute -left-4 text-primary font-black select-none">—</span>
                        {children}
                    </li>
                ),
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary bg-primary/5 px-6 py-4 my-6 italic font-serif text-foreground/80 text-lg">
                        {children}
                    </blockquote>
                ),
                hr: () => (
                    <hr className="my-8 border-0 border-t-2 border-foreground/10" />
                ),
                code: ({ inline, className, children }) => {
                    if (inline) {
                        return (
                            <code className="bg-foreground/10 text-foreground font-mono text-sm px-1.5 py-0.5 rounded">
                                {children}
                            </code>
                        )
                    }
                    return (
                        <pre className="bg-foreground text-background font-mono text-sm p-5 my-6 overflow-x-auto shadow-[4px_4px_0px_0px_rgba(238,117,34,1)]">
                            <code>{children}</code>
                        </pre>
                    )
                },
                table: ({ children }) => (
                    <div className="overflow-x-auto my-8">
                        <table className="w-full border-collapse border-2 border-foreground text-sm">
                            {children}
                        </table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead className="bg-foreground text-background">
                        {children}
                    </thead>
                ),
                th: ({ children }) => (
                    <th className="border border-foreground/20 px-4 py-3 text-left font-black uppercase tracking-widest text-xs">
                        {children}
                    </th>
                ),
                td: ({ children }) => (
                    <td className="border border-foreground/10 px-4 py-3 text-foreground/80 font-medium leading-relaxed">
                        {children}
                    </td>
                ),
                tr: ({ children }) => (
                    <tr className="even:bg-foreground/3 hover:bg-primary/5 transition-colors">
                        {children}
                    </tr>
                ),
                img: ({ src, alt }) => (
                    <img
                        src={src}
                        alt={alt || ''}
                        className="w-full my-8 border-2 border-foreground shadow-[6px_6px_0px_0px_rgba(238,117,34,1)]"
                    />
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    )
}
