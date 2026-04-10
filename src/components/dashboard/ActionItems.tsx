import Link from "next/link";
import { AlertTriangle, ClipboardCheck, MessageSquare } from "lucide-react";

interface ActionItemsProps {
  role: string;
  pendingApprovalsCount: number;
  overdueTimesheet: boolean;
  uatIssuesNeedingResponseCount: number;
  hiddenNavItems?: string[];
}

export function ActionItems({
  role,
  pendingApprovalsCount,
  overdueTimesheet,
  uatIssuesNeedingResponseCount,
  hiddenNavItems = [],
}: ActionItemsProps) {
  const isManager = ["OWNER", "ADMIN", "MANAGER"].includes(role);
  const isMember = ["MEMBER", "CONTRACTOR"].includes(role);

  const timeHidden = hiddenNavItems.includes("time");
  const approvalsHidden = hiddenNavItems.includes("approvals");

  const showPendingApprovals = isManager && pendingApprovalsCount > 0 && !approvalsHidden;
  const showUATIssues = isManager && uatIssuesNeedingResponseCount > 0;
  const showOverdueTimesheet = isMember && overdueTimesheet && !timeHidden;

  if (!showPendingApprovals && !showUATIssues && !showOverdueTimesheet) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      {showPendingApprovals && (
        <div className="flex items-center gap-3 rounded-lg border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 px-4 py-2.5">
          <ClipboardCheck className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <p className="text-sm text-foreground/80">
            <Link
              href="/time/approvals"
              className="font-medium hover:text-foreground transition-colors"
            >
              {pendingApprovalsCount} timesheet{pendingApprovalsCount !== 1 ? "s" : ""} awaiting approval
            </Link>
          </p>
        </div>
      )}

      {showUATIssues && (
        <div className="flex items-center gap-3 rounded-lg border-l-2 border-l-blue-400 border border-border/50 bg-muted/30 px-4 py-2.5">
          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          <p className="text-sm text-foreground/80">
            <Link
              href="/portal"
              className="font-medium hover:text-foreground transition-colors"
            >
              {uatIssuesNeedingResponseCount} UAT issue{uatIssuesNeedingResponseCount !== 1 ? "s" : ""} need a response
            </Link>
          </p>
        </div>
      )}

      {showOverdueTimesheet && (
        <div className="flex items-center gap-3 rounded-lg border-l-2 border-l-amber-400 border border-border/50 bg-muted/30 px-4 py-2.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <p className="text-sm text-foreground/80">
            <Link
              href="/time"
              className="font-medium hover:text-foreground transition-colors"
            >
              No time logged in the last 2 business days
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
