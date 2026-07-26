import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { teamMembers } from "@/lib/data"

/** Sales team performance widget (humans — not AI agents) */
export function AgentPerformance() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Sales team</CardTitle>
        <CardDescription>Conversion rate (chat → paid) by teammate</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {teamMembers.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-secondary text-xs font-medium">
                {member.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <span className="text-sm font-medium tabular-nums">{member.conversion}%</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <Progress value={member.conversion} className="h-1.5" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {member.orders} orders · {member.revenue} ·{" "}
                <span className="capitalize">{member.role}</span>
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
