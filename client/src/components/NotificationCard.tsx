import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

type NotificationType = "info" | "warning" | "success" | "alert";

interface NotificationCardProps {
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

const typeConfig = {
  info: {
    icon: Info,
    color: "text-chart-5",
    bg: "bg-chart-5/10"
  },
  warning: {
    icon: AlertTriangle,
    color: "text-[hsl(38,90%,55%)]",
    bg: "bg-[hsl(38,90%,55%)]/10"
  },
  success: {
    icon: CheckCircle2,
    color: "text-[hsl(142,70%,45%)]",
    bg: "bg-[hsl(142,70%,45%)]/10"
  },
  alert: {
    icon: Bell,
    color: "text-[hsl(0,80%,55%)]",
    bg: "bg-[hsl(0,80%,55%)]/10"
  }
};

export function NotificationCard({
  type,
  title,
  message,
  timestamp,
  onDismiss,
  actionLabel,
  onAction
}: NotificationCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Card className="p-4" data-testid={`notification-${type}`}>
      <div className="flex gap-3">
        <div className={`${config.bg} rounded-full p-2 h-fit`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm">{title}</h4>
            {onDismiss && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6"
                onClick={onDismiss}
                data-testid="button-dismiss-notification"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-muted-foreground">{timestamp}</span>
            {actionLabel && onAction && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onAction}
                data-testid="button-notification-action"
              >
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
