import { Link2 } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/dashboard/page-header"
import { PaymentsTable } from "@/components/dashboard/payments-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PaymentsPage() {
  return (
    <DashboardShell
      title="Payments"
      subtitle="Default is bank transfer: customer pays to your account, claims paid, you verify before the order is confirmed."
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="Money in"
          description="Share the pay link from a new order. Customers see your bank details, a countdown, and can mark “I have made payment” (receipt optional)."
          actions={
            <Button className="gap-2" variant="outline" disabled title="Pay links are created with each order">
              <Link2 className="size-4" />
              Pay link = per order
            </Button>
          }
        />

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How bank transfer works</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Order creates a pay link with your business account details and a 30‑minute countdown.</li>
              <li>Customer transfers, then taps <strong className="text-foreground">I have made payment</strong> (receipt optional).</li>
              <li>You verify in your bank, then confirm here — only then is the order <strong className="text-foreground">paid</strong>.</li>
            </ol>
          </CardContent>
        </Card>

        <PaymentsTable defaultFilter="under_review" />
      </div>
    </DashboardShell>
  )
}
