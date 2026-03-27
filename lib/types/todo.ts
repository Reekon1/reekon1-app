export const TODO_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "done",
  "cancelled",
] as const;
export type TodoStatus = (typeof TODO_STATUSES)[number];

export const TODO_PRIORITIES = [
  "urgent",
  "high",
  "medium",
  "low",
  "none",
] as const;
export type TodoPriority = (typeof TODO_PRIORITIES)[number];

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<TodoStatus, string> = {
  backlog: "Backlog",
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
  cancelled: "Annulé",
};

export const PRIORITY_LABELS: Record<TodoPriority, string> = {
  urgent: "Urgent",
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
  none: "Aucune",
};
