import { Badge } from "@/components/ui/badge";
import { STATUS_VARIANT } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({
  value,
  className,
}: {
  value?: string | null;
  className?: string;
}) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const variant = STATUS_VARIANT[value] ?? "secondary";
  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {value}
    </Badge>
  );
}
