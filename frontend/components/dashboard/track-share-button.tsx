"use client"

import { useState } from "react"
import { Check, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TrackShareButton({
  title,
  text,
}: {
  title: string
  text: string
}) {
  const [done, setDone] = useState(false)

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setDone(true)
      window.setTimeout(() => setDone(false), 1500)
    } catch {
      // user cancelled share
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 bg-card"
      onClick={share}
      aria-label="Share tracking link"
    >
      {done ? <Check className="size-4 text-success" /> : <Share2 className="size-4" />}
      <span className="hidden sm:inline">{done ? "Copied" : "Share"}</span>
    </Button>
  )
}
