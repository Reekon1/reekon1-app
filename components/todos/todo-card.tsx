"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PriorityBadge } from "./priority-badge";
import type { Todo } from "@/lib/types/todo";
import { cn } from "@/lib/utils";

interface TodoCardProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  isDragOverlay?: boolean;
}

export function TodoCard({ todo, onEdit, onDelete, isDragOverlay }: TodoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-default",
        isDragging && "opacity-30",
        isDragOverlay && "shadow-lg rotate-2"
      )}
    >
      <CardContent className="p-3 flex gap-2">
        <button
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-medium leading-tight truncate">
              {todo.title}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" className="flex-shrink-0">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(todo)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(todo)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {todo.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {todo.description}
            </p>
          )}
          <div className="mt-2">
            <PriorityBadge priority={todo.priority} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
