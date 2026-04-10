import { NextRequest, NextResponse } from "next/server"
import { getOnboardingJob } from "@/app/actions/onboarding"

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ jobId: string }> },
) {
    const { jobId } = await params
    const job = await getOnboardingJob(jobId)
    if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }
    return NextResponse.json({
        status: job.status,
        steps: job.steps,
        result: job.result,
    })
}
