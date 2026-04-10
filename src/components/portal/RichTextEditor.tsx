"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { useEffect, useState, useCallback, useRef } from "react"
import StarterKit from "@tiptap/starter-kit"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Link } from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import { proxyLinearImageUrl } from "@/lib/portal-image"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import { Markdown } from "tiptap-markdown"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableCell } from "@tiptap/extension-table-cell"
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model"
import { Bold, Italic, Strikethrough, List, ListOrdered, Code, Heading1, Heading2, Heading3, CheckSquare, Quote, Link2, Minus, Loader2, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { uploadFileToLinear } from "@/lib/portal-upload"
import { getEditorMarkdown } from "@/components/portal/portal-issue-utils"
import { MarkdownTableEnable } from "@/components/portal/tiptap-extensions"
import type { EditorView } from "@tiptap/pm/view"

interface RichTextEditorProps {
    value: string
    onChange: (markdown: string) => void
    placeholder?: string
    minHeight?: string
    disabled?: boolean
    autoFocus?: boolean
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = "Start typing…",
    minHeight = "120px",
    disabled = false,
    autoFocus = false,
}: RichTextEditorProps) {
    const [uploadCount, setUploadCount] = useState(0)
    const editorRef = useRef<ReturnType<typeof useEditor>>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Always use editorRef.current — avoids stale closures in async callbacks
    const handleFileUpload = useCallback(async (file: File) => {
        const ed = editorRef.current
        if (!ed) return
        setUploadCount(c => c + 1)
        try {
            const { url, filename } = await uploadFileToLinear(file)
            const latest = editorRef.current
            if (!latest) return
            if (file.type.startsWith("image/")) {
                latest.chain().focus().setImage({ src: url, alt: filename }).run()
            } else {
                const { from } = latest.state.selection
                latest.chain().focus().insertContentAt(from, `[${filename}](${url})`).run()
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Upload failed")
        } finally {
            setUploadCount(c => c - 1)
        }
    }, [])

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Image.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        src: {
                            default: null,
                            renderHTML(attributes) {
                                return { src: proxyLinearImageUrl(attributes.src) }
                            },
                        },
                    }
                },
            }).configure({ inline: true, allowBase64: false }),
            Link.configure({ openOnClick: false, autolink: true }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Table.configure({ resizable: false }),
            TableRow,
            TableHeader,
            TableCell,
            MarkdownTableEnable,
            Placeholder.configure({ placeholder }),
            Markdown.configure({ html: false, tightLists: true, transformPastedText: true }),
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            onChange(getEditorMarkdown(editor))
        },
        editorProps: {
            attributes: { class: "prose prose-sm max-w-none focus:outline-none text-sm text-foreground" },
            handlePaste(_view, event) {
                // File paste
                const files = event.clipboardData?.files
                if (files && files.length > 0) {
                    const file = files[0]
                    if (!file) return false
                    event.preventDefault()
                    handleFileUpload(file)
                    return true
                }
                // Text paste — parse as markdown
                const text = event.clipboardData?.getData("text/plain")
                if (text) {
                    event.preventDefault()
                    const ed = editorRef.current
                    if (!ed) return false
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const html = (ed.storage as any).markdown.parser.parse(text) as string
                    const el = document.createElement("div")
                    el.innerHTML = html
                    const pmParser = ProseMirrorDOMParser.fromSchema(ed.schema)
                    const slice = pmParser.parseSlice(el)
                    ed.view.dispatch(ed.state.tr.replaceSelection(slice))
                    ed.commands.focus()
                    return true
                }
                return false
            },
            handleDrop(_view, event) {
                const files = (event as DragEvent).dataTransfer?.files
                if (!files || files.length === 0) return false
                event.preventDefault()
                Array.from(files).forEach(f => handleFileUpload(f))
                return true
            },
        },
    })

    // Keep editorRef in sync
    useEffect(() => {
        editorRef.current = editor
    }, [editor])

    // Auto-focus on mount when requested
    useEffect(() => {
        if (autoFocus && editor) {
            editor.commands.focus("end")
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor])

    // Re-bind handlers on editor ready so they use the latest handleFileUpload closure
    useEffect(() => {
        if (!editor) return
        const ep = editor.options.editorProps as Record<string, unknown>
        ep.handlePaste = (_view: EditorView, event: ClipboardEvent) => {
            const files = event.clipboardData?.files
            if (files && files.length > 0) {
                const file = files[0]
                if (!file) return false
                event.preventDefault()
                handleFileUpload(file)
                return true
            }
            const text = event.clipboardData?.getData("text/plain")
            if (text) {
                event.preventDefault()
                const ed = editorRef.current
                if (!ed) return false
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const html = (ed.storage as any).markdown.parser.parse(text) as string
                const el = document.createElement("div")
                el.innerHTML = html
                const pmParser = ProseMirrorDOMParser.fromSchema(ed.schema)
                const slice = pmParser.parseSlice(el)
                ed.view.dispatch(ed.state.tr.replaceSelection(slice))
                ed.commands.focus()
                return true
            }
            return false
        }
        ep.handleDrop = (_view: EditorView, event: DragEvent) => {
            const files = event.dataTransfer?.files
            if (!files || files.length === 0) return false
            event.preventDefault()
            Array.from(files).forEach(f => handleFileUpload(f))
            return true
        }
    }, [editor, handleFileUpload])

    // Sync content when value changes externally (post-clear, template switch, etc.)
    useEffect(() => {
        if (!editor) return
        const current = getEditorMarkdown(editor)
        if (current.trim() !== value.trim()) {
            editor.commands.setContent(value)
        }
    }, [editor, value])

    if (!editor) return null

    const isUploading = uploadCount > 0

    const toolbarBtn = (active: boolean, onClick: () => void, icon: React.ReactNode, title: string, extraDisabled = false) => (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            title={title}
            onClick={onClick}
            disabled={disabled || extraDisabled}
            className={cn("h-7 w-7 p-0", active && "bg-primary/10 text-primary")}
        >
            {icon}
        </Button>
    )

    return (
        <div className={cn("border border-border/80 rounded-lg overflow-hidden bg-muted/10 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1", disabled && "opacity-60")}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx"
                onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    e.target.value = ""
                    handleFileUpload(file)
                }}
                disabled={disabled || isUploading}
            />

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-border bg-muted/30">
                {toolbarBtn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <Bold className="h-3.5 w-3.5" />, "Bold (⌘B)")}
                {toolbarBtn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <Italic className="h-3.5 w-3.5" />, "Italic (⌘I)")}
                {toolbarBtn(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), <Strikethrough className="h-3.5 w-3.5" />, "Strikethrough")}
                {toolbarBtn(editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), <Code className="h-3.5 w-3.5" />, "Inline code")}
                {toolbarBtn(editor.isActive("link"), () => {
                    const prev = editor.getAttributes("link").href as string | undefined
                    const url = window.prompt("URL", prev ?? "https://")
                    if (url === null) return
                    if (!url) { editor.chain().focus().unsetLink().run(); return }
                    editor.chain().focus().setLink({ href: url, target: "_blank" }).run()
                }, <Link2 className="h-3.5 w-3.5" />, "Link (⌘K)")}
                <div className="w-px h-4 bg-border mx-0.5" />
                {toolbarBtn(editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <Heading1 className="h-3.5 w-3.5" />, "Heading 1")}
                {toolbarBtn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 className="h-3.5 w-3.5" />, "Heading 2")}
                {toolbarBtn(editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 className="h-3.5 w-3.5" />, "Heading 3")}
                <div className="w-px h-4 bg-border mx-0.5" />
                {toolbarBtn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <List className="h-3.5 w-3.5" />, "Bullet list")}
                {toolbarBtn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-3.5 w-3.5" />, "Numbered list")}
                {toolbarBtn(editor.isActive("taskList"), () => editor.chain().focus().toggleTaskList().run(), <CheckSquare className="h-3.5 w-3.5" />, "Checklist")}
                {toolbarBtn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), <Quote className="h-3.5 w-3.5" />, "Blockquote")}
                {toolbarBtn(false, () => editor.chain().focus().setHorizontalRule().run(), <Minus className="h-3.5 w-3.5" />, "Divider")}
                <div className="w-px h-4 bg-border mx-0.5" />
                {/* Upload button */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    title="Attach image or file"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="h-7 w-7 p-0"
                >
                    {isUploading
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        : <Paperclip className="h-3.5 w-3.5" />
                    }
                </Button>
                {isUploading && (
                    <span className="text-[11px] text-muted-foreground pl-0.5 select-none">
                        Uploading…
                    </span>
                )}
            </div>

            {/* Editor — also a drop zone */}
            <EditorContent
                editor={editor}
                className={cn(
                    "px-3 py-2",
                    "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[var(--editor-min-h)]",
                    "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/50 [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
                    "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-4 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-4 [&_.ProseMirror_li]:my-0.5",
                    "[&_.ProseMirror_h2]:text-base [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-1",
                    "[&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-xs [&_.ProseMirror_code]:font-mono",
                    "[&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-2 [&_.ProseMirror_pre]:rounded [&_.ProseMirror_pre]:mb-2",
                    "[&_.ProseMirror_ul[data-type=taskList]]:list-none [&_.ProseMirror_ul[data-type=taskList]]:pl-0",
                    "[&_.ProseMirror_li[data-type=taskItem]]:flex [&_.ProseMirror_li[data-type=taskItem]]:items-start [&_.ProseMirror_li[data-type=taskItem]]:gap-2",
                    "[&_.ProseMirror_img]:block [&_.ProseMirror_img]:max-w-[320px] [&_.ProseMirror_img]:max-h-[240px] [&_.ProseMirror_img]:w-auto [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded [&_.ProseMirror_img]:border [&_.ProseMirror_img]:border-border/40 [&_.ProseMirror_img]:my-1 [&_.ProseMirror_img]:mx-auto [&_.ProseMirror_img]:cursor-pointer",
                    "[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-2",
                    "[&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:text-xs [&_.ProseMirror_table]:my-2",
                    "[&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border/60 [&_.ProseMirror_th]:px-2 [&_.ProseMirror_th]:py-1 [&_.ProseMirror_th]:bg-muted/40 [&_.ProseMirror_th]:font-medium [&_.ProseMirror_th]:text-left [&_.ProseMirror_th]:align-top",
                    "[&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border/60 [&_.ProseMirror_td]:px-2 [&_.ProseMirror_td]:py-1 [&_.ProseMirror_td]:align-top",
                )}
                style={{ "--editor-min-h": minHeight } as React.CSSProperties}
            />
            <div className="px-3 py-1.5 border-t border-border/40 bg-muted/20">
                <span className="text-[11px] text-muted-foreground/60 select-none">
                    Supports <span className="font-medium text-muted-foreground/80">Markdown</span> — paste formatted text to render automatically
                </span>
            </div>
        </div>
    )
}
