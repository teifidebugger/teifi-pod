import { redirect } from "next/navigation"

/**
 * /estimation/new redirects to /estimation
 * The CreateSessionDialog lives on the list page — clicking "New Session"
 * there opens the dialog inline. This route exists for deep-link compatibility.
 */
export default function NewEstimationPage() {
    redirect("/estimation")
}
