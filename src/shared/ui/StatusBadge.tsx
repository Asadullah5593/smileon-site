import { Badge } from "@/shared/ui/primitives/badge";
import { cn } from "@/shared/utils/cn";

const STYLES: Record<string, string> = {
  PUBLISHED: "bg-success/15 text-success border-success/30",
  DRAFT: "bg-warning/15 text-warning border-warning/30",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
  NEW: "bg-primary/15 text-primary border-primary/30",
  CONFIRMED: "bg-success/15 text-success border-success/30",
  COMPLETED: "bg-muted text-muted-foreground border-border",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize", STYLES[status])}>
      {status.toLowerCase()}
    </Badge>
  );
}
