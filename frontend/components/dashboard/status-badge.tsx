import { cn } from "@/lib/utils"
import type {
  DeliveryStatus,
  OrderStatus,
  PaymentStatus,
} from "@/lib/data"

const orderStyles: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning",
  payment_review: "bg-primary/15 text-primary",
  paid: "bg-primary/15 text-primary",
  shipped: "bg-chart-2/15 text-chart-2",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
  expired: "bg-muted text-muted-foreground",
}

const orderLabels: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  payment_review: "Payment review",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  expired: "Expired",
}

const paymentStyles: Record<PaymentStatus, string> = {
  awaiting_payment: "bg-warning/15 text-warning",
  under_review: "bg-primary/15 text-primary",
  confirmed: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
}

const paymentLabels: Record<PaymentStatus, string> = {
  awaiting_payment: "Awaiting",
  under_review: "Under review",
  confirmed: "Confirmed",
  failed: "Failed",
}

const deliveryStyles: Record<string, string> = {
  awaiting_pickup: "bg-warning/15 text-warning",
  picked_up: "bg-primary/15 text-primary",
  out_for_delivery: "bg-chart-2/15 text-chart-2",
  delivered: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
}

const deliveryLabels: Record<string, string> = {
  awaiting_pickup: "Awaiting pickup",
  picked_up: "Picked up",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  failed: "Failed",
  cancelled: "Cancelled",
}

function Pill({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  const key = status as OrderStatus
  return (
    <Pill className={orderStyles[key] ?? "bg-muted text-muted-foreground"}>
      {orderLabels[key] ?? status}
    </Pill>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Pill className={paymentStyles[status]}>{paymentLabels[status]}</Pill>
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus | string }) {
  return (
    <Pill className={deliveryStyles[status] ?? "bg-muted text-muted-foreground"}>
      {deliveryLabels[status] ?? status}
    </Pill>
  )
}
