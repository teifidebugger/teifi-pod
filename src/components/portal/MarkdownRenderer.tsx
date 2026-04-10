"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { proxyLinearImageUrl } from "@/lib/portal-image"
import { PortalImageViewer } from "@/components/portal/PortalImageViewer"
import { parsePortalDescription } from "@/components/portal/portal-issue-utils"

interface MarkdownRendererProps {
    content: string | null | undefined
    className?: string
    compactImages?: boolean
}

export function MarkdownRenderer({ content, className, compactImages }: MarkdownRendererProps) {
    if (!content?.trim()) {
        return (
            <p className="text-sm text-muted-foreground/50 italic">No description provided.</p>
        )
    }

    const clean = parsePortalDescription(content).body

    return (
        <div className={cn("notion-doc", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // ── Headings ────────────────────────────────────────────
                    h1: ({ children }) => (
                        <h1 className="text-[1.25rem] font-bold tracking-tight leading-snug text-foreground mt-6 mb-2 first:mt-0">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-[1.0625rem] font-bold leading-snug text-foreground mt-5 mb-1.5 first:mt-0">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-[0.9375rem] font-semibold text-foreground mt-4 mb-1 first:mt-0">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-[0.875rem] font-semibold text-foreground mt-3 mb-1 first:mt-0">
                            {children}
                        </h4>
                    ),
                    h5: ({ children }) => (
                        <h5 className="text-[0.875rem] font-semibold text-muted-foreground mt-3 mb-1 first:mt-0">
                            {children}
                        </h5>
                    ),
                    h6: ({ children }) => (
                        <h6 className="text-[0.8125rem] font-semibold text-muted-foreground/70 mt-3 mb-1 first:mt-0">
                            {children}
                        </h6>
                    ),

                    // ── Body text ────────────────────────────────────────────
                    p: ({ children }) => (
                        <p className="text-[0.9375rem] leading-[1.75] text-foreground mb-4 last:mb-0">
                            {children}
                        </p>
                    ),

                    // ── Lists ────────────────────────────────────────────────
                    ul: ({ children }) => (
                        <ul className="list-disc pl-6 mb-4 space-y-1 text-[0.9375rem] text-foreground">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal pl-6 mb-4 space-y-1 text-[0.9375rem] text-foreground">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="leading-[1.7] pl-0.5">
                            {children}
                        </li>
                    ),

                    // ── Inline formatting ────────────────────────────────────
                    strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    em: ({ children }) => (
                        <em className="italic text-foreground/90">{children}</em>
                    ),
                    del: ({ children }) => (
                        <del className="line-through text-muted-foreground">{children}</del>
                    ),

                    // ── Links ─────────────────────────────────────────────────
                    a: ({ href, children }) => {
                        const isExternal = href?.startsWith("http")
                        return (
                            <a
                                href={href}
                                target={isExternal ? "_blank" : undefined}
                                rel={isExternal ? "noopener noreferrer" : undefined}
                                className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary transition-colors inline-flex items-center gap-0.5"
                            >
                                {children}
                                {isExternal && <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />}
                            </a>
                        )
                    },

                    // ── Code ─────────────────────────────────────────────────
                    code: ({ className: cls, children }) => {
                        const isBlock = !!cls
                        if (isBlock) {
                            return (
                                <code className="block font-mono text-[0.825rem] text-foreground leading-relaxed whitespace-pre-wrap">
                                    {children}
                                </code>
                            )
                        }
                        return (
                            <code className="font-mono text-[0.825em] bg-muted/80 text-foreground px-1.5 py-0.5 rounded-md border border-border/50">
                                {children}
                            </code>
                        )
                    },
                    pre: ({ children }) => (
                        <pre className="bg-muted/60 border border-border/50 rounded-lg p-4 overflow-x-auto mb-4 text-sm">
                            {children}
                        </pre>
                    ),

                    // ── Blockquote ───────────────────────────────────────────
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-[3px] border-primary/40 pl-4 py-0.5 my-4 bg-muted/30 rounded-r-md">
                            <div className="text-[0.9375rem] text-muted-foreground italic leading-relaxed">
                                {children}
                            </div>
                        </blockquote>
                    ),

                    // ── Divider ──────────────────────────────────────────────
                    hr: () => <hr className="my-6 border-border/60" />,

                    // ── Images ───────────────────────────────────────────────
                    img: ({ src, alt }) => (
                        <PortalImageViewer
                            src={proxyLinearImageUrl(typeof src === "string" ? src : undefined)}
                            alt={alt ?? undefined}
                            compact={compactImages}
                        />
                    ),

                    // ── Tables ───────────────────────────────────────────────
                    table: ({ children }) => (
                        <div className="overflow-x-auto mb-4 rounded-lg border border-border/60">
                            <table className="min-w-full border-collapse text-[0.875rem]">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-muted/60">{children}</thead>
                    ),
                    tr: ({ children }) => (
                        <tr className="border-b border-border/50 last:border-0">{children}</tr>
                    ),
                    th: ({ children }) => (
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border/50 last:border-0">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-4 py-2.5 text-[0.875rem] text-foreground border-r border-border/50 last:border-0">
                            {children}
                        </td>
                    ),

                    // ── Task list checkboxes (GFM) ────────────────────────────
                    input: ({ type, checked }) => {
                        if (type === "checkbox") {
                            return (
                                <span
                                    className={cn(
                                        "inline-flex items-center justify-center w-4 h-4 rounded border mr-2 align-text-bottom shrink-0",
                                        checked
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-muted-foreground/40 bg-background"
                                    )}
                                    aria-checked={checked}
                                    role="checkbox"
                                >
                                    {checked && (
                                        <svg className="w-2.5 h-2.5" viewBox="0 0 10 8" fill="none">
                                            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </span>
                            )
                        }
                        return <input type={type} checked={checked} readOnly />
                    },
                }}
            >
                {clean}
            </ReactMarkdown>
        </div>
    )
}
