import { TrackPageClient } from "./track-client"

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <TrackPageClient token={token} />
}
