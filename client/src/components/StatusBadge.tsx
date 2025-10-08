import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

type StatusType = "valid" | "invalid" | "warning" | "pending";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig = {
  valid: {
    icon: CheckCircle2,
    className: "bg-[hsl(142,70%,45%)] text-white border-0",
    defaultLabel: "Valid"
  },
  invalid: {
    icon: XCircle,
    className: "bg-[hsl(0,80%,55%)] text-white border-0",
    defaultLabel: "Invalid"
  },
  warning: {
    icon: AlertCircle,
    className: "bg-[hsl(38,90%,55%)] text-white border-0",
    defaultLabel: "Warning"
  },
  pending: {
    icon: Clock,
    className: "bg-muted text-muted-foreground",
    defaultLabel: "Pending"
  }
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge className={config.className} data-testid={`badge-status-${status}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label || config.defaultLabel}
    </Badge>
  );
}
