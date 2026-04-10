export type AcceptanceFieldType = "text" | "textarea" | "select" | "checkbox"

export interface AcceptanceIssueField {
    id: string
    label: string
    type?: AcceptanceFieldType
    placeholder?: string
    defaultValue?: string
    options?: string[]
    required: boolean
}

export const DEFAULT_ACCEPTANCE_FIELDS: AcceptanceIssueField[] = [
    { id: "whatHappened",     label: "What happened?",     type: "textarea", placeholder: "Describe the bug or issue you observed…",   required: false },
    { id: "stepsToReproduce", label: "Steps to reproduce", type: "textarea", placeholder: "1. Go to…\n2. Click…\n3. See error",        required: false },
    { id: "expectedBehavior", label: "Expected behavior",  type: "textarea", placeholder: "What should have happened instead?",        required: false },
]

export const DEFAULT_BUG_FIELDS: AcceptanceIssueField[] = [
    { id: "whatHappened",     label: "What happened?",     type: "textarea", placeholder: "Describe the bug or issue you observed…",   required: true },
    { id: "expectedBehavior", label: "Expected behavior",  type: "textarea", placeholder: "What should have happened instead?",        required: true },
    { id: "stepsToReproduce", label: "Steps to reproduce", type: "textarea", placeholder: "List the steps to reproduce this issue", defaultValue: "1. \n2. \n3. ", required: false },
]

export const DEFAULT_FEATURE_FIELDS: AcceptanceIssueField[] = [
    { id: "whatWouldYouLike", label: "What would you like?",  type: "textarea", placeholder: "Describe the feature or enhancement…",  required: true },
    { id: "whyNeeded",       label: "Why is this needed?",    type: "textarea", placeholder: "How would this help your workflow?",     required: false },
]

export type IssueTemplateType = "acceptance" | "bug" | "feature"

export const TEMPLATE_TYPE_LABELS: Record<IssueTemplateType, string> = {
    acceptance: "Acceptance",
    bug: "Bug Report",
    feature: "Feature Request",
}

function isAcceptanceIssueField(v: unknown): v is AcceptanceIssueField {
    if (!v || typeof v !== 'object') return false
    const f = v as Record<string, unknown>
    return typeof f.id === 'string' && typeof f.label === 'string' && typeof f.required === 'boolean'
}

export function parseTemplateFields(fields: unknown): AcceptanceIssueField[] {
    if (!Array.isArray(fields)) return []
    return fields.filter(isAcceptanceIssueField)
}

export function getDefaultFieldsForType(type: IssueTemplateType): AcceptanceIssueField[] {
    switch (type) {
        case "bug": return DEFAULT_BUG_FIELDS
        case "feature": return DEFAULT_FEATURE_FIELDS
        default: return DEFAULT_ACCEPTANCE_FIELDS
    }
}
