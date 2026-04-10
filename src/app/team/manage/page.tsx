import { redirect } from "next/navigation"

export default function ManageTeamRedirect() {
    redirect("/team?view=manage")
}
