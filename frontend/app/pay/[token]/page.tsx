import { PayPageClient } from "./pay-client"

export default async function PayPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <PayPageClient token={token} />
}
