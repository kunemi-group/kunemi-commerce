import { redirect } from "next/navigation"

/** Legacy sales-floor route — bookmarks land on Home (Phase A). */
export default function WorkspaceRedirectPage() {
  redirect("/")
}
