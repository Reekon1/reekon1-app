"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TodoCard } from "./todo-card";
import type { Todo, TodoStatus } from "@/lib/types/todo";
import { STATUS_LABELS } from "@/lib/types/todo";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: TodoStatus;
  todos: Todo[];
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onAdd: (status: TodoStatus) => void;
}

export function KanbanColumn({
  status,
  todos,
  onEdit,
  onDelete,
  onAdd,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col min-w-[250px] w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{STATUS_LABELS[status]}</h3>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {todos.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onAdd(status)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <SortableContext
        items={todos.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex flex-col gap-2 flex-1 rounded-lg p-2 min-h-[120px] transition-colors",
            "bg-muted/40",
            isOver && "bg-muted/80 ring-2 ring-primary/20"
          )}
        >
          {todos.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {todos.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              Aucun todo
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
