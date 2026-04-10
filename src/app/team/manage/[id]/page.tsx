import { redirect } from "next/navigation"

export default async function ManageMemberRedirect({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    redirect(`/team/${id}/profile`)
}
