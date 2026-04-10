import { Extension } from "@tiptap/core"

interface MarkdownIt {
    enable(rule: string): void
}

// Enables markdown-it's built-in GFM table rule so parser.parse() outputs <table> HTML.
// tiptap-markdown matches by name="table" and uses its Table$1 serializer automatically.
export const MarkdownTableEnable = Extension.create({
    name: "markdownTableEnable",
    addStorage: () => ({ markdown: { parse: { setup: (md: MarkdownIt) => md.enable("table") } } }),
})
