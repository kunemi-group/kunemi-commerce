"use client"

import { useState } from "react"
import { Check, Copy, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { copyText, whatsappDeepLink } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"

export function CopyWhatsApp({
  message,
  phone,
  label = "Copy for WhatsApp",
  size = "sm",
  className,
  variant = "outline",
}: {
  message: string
  phone?: string
  label?: string
  size?: "sm" | "default" | "xs"
  className?: string
  variant?: "outline" | "default" | "secondary" | "ghost"
}) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    const ok = await copyText(message)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        type="button"
        size={size}
        variant={variant}
        className="gap-2 bg-card"
        onClick={onCopy}
      >
        {copied ? (
          <Check className="size-4 text-success" />
        ) : (
          <Copy className="size-4" />
        )}
        {copied ? "Copied" : label}
      </Button>
      {phone ? (
        <Button
          type="button"
          size={size}
          variant="secondary"
          className="gap-2"
          render={
            <a
              href={whatsappDeepLink(phone, message)}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <MessageCircle className="size-4" />
          Open WhatsApp
        </Button>
      ) : null}
    </div>
  )
}
