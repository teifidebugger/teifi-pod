export interface BillingRateInput {
    project: { billingType: string; billBy: string; hourlyRateCents: number | null }
    task?: { isBillable: boolean; hourlyRateCents: number | null } | null
    projectMember?: { billableRateCents: number | null } | null
    userDefaultBillableCents: number
}

export interface BillingRateResult {
    isBillable: boolean
    billableRateCents: number
}

export function resolveBillingRate(input: BillingRateInput): BillingRateResult {
    const { project, task, projectMember, userDefaultBillableCents } = input
    if (project.billingType === "NON_BILLABLE" || project.billBy === "none" || task?.isBillable === false) {
        return { isBillable: false, billableRateCents: 0 }
    }
    let billableRateCents = 0
    if (project.billBy === "Project") {
        billableRateCents = project.hourlyRateCents ?? 0
    } else if (project.billBy === "Tasks") {
        billableRateCents = task?.hourlyRateCents ?? project.hourlyRateCents ?? 0
    } else if (project.billBy === "People") {
        billableRateCents = projectMember?.billableRateCents ?? userDefaultBillableCents
    }
    return { isBillable: true, billableRateCents }
}
