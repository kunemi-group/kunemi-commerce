import { redirect } from "next/navigation"

/** Legacy path — humans are under Team now */
export default function AgentsRedirectPage() {
  redirect("/team")
}
