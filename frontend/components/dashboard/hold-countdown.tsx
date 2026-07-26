"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

/** Live countdown from a starting minutes-left value (demo mock). */
export function HoldCountdown({
  minutesLeft,
  totalMinutes = 30,
  compact = false,
  className,
}: {
  minutesLeft: number
  totalMinutes?: number
  compact?: boolean
  className?: string
}) {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(0, Math.floor(minutesLeft * 60)),
  )

  useEffect(() => {
    setSecondsLeft(Math.max(0, Math.floor(minutesLeft * 60)))
  }, [minutesLeft])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [secondsLeft > 0])

  const m = Math.floor(secondsLeft / 60)
  const s = secondsLeft % 60
  const ratio = Math.min(1, secondsLeft / (totalMinutes * 60))
  const critical = secondsLeft > 0 && secondsLeft < 5 * 60
  const expired = secondsLeft <= 0

  const label = expired
    ? "Hold expired"
    : `${m}:${s.toString().padStart(2, "0")} left`

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
          expired
            ? "bg-muted text-muted-foreground"
            : critical
              ? "bg-destructive/15 text-destructive animate-pulse-soft"
              : "bg-warning/15 text-warning",
          className,
        )}
        title="Inventory reservation window"
      >
        <span
          className="relative size-3.5 shrink-0"
          aria-hidden
        >
          <svg viewBox="0 0 36 36" className="size-3.5 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="4"
            />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${ratio * 88} 88`}
              strokeLinecap="round"
            />
          </svg>
        </span>
        {label}
      </span>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        expired
          ? "border-border bg-muted/40"
          : critical
            ? "border-destructive/40 bg-destructive/10"
            : "border-warning/40 bg-warning/10",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Stock hold
        </p>
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            expired
              ? "text-muted-foreground"
              : critical
                ? "text-destructive"
                : "text-warning",
          )}
        >
          {label}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/60">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-linear",
            expired
              ? "bg-muted-foreground"
              : critical
                ? "bg-destructive"
                : "bg-warning",
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Unpaid chat orders auto-expire and release reserved units.
      </p>
    </div>
  )
}
