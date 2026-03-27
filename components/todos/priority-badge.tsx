import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TodoPriority } from "@/lib/types/todo";
import { PRIORITY_LABELS } from "@/lib/types/todo";

const priorityStyles: Record<TodoPriority, string> = {
  urgent: "bg-red-500/15 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800",
  high: "bg-orange-500/15 text-orange-700 border-orange-200 dark:text-orange-400 dark:border-orange-800",
  medium: "bg-yellow-500/15 text-yellow-700 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800",
  low: "bg-blue-500/15 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800",
  none: "bg-muted text-muted-foreground border-transparent",
};

export function PriorityBadge({ priority }: { priority: TodoPriority }) {
  if (priority === "none") return null;

  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] px-1.5 py-0", priorityStyles[priority])}
    >
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
