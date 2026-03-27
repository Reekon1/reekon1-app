"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { TodoCard } from "./todo-card";
import { TodoDialog } from "./todo-dialog";
import { DeleteTodoDialog } from "./delete-todo-dialog";
import { moveTodo, listTodos } from "@/lib/actions/todos";
import type { Todo, TodoStatus } from "@/lib/types/todo";
import { TODO_STATUSES } from "@/lib/types/todo";

interface KanbanBoardProps {
  initialTodos: Todo[];
}

export function KanbanBoard({ initialTodos }: KanbanBoardProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const previousTodos = useRef<Todo[]>(initialTodos);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TodoStatus>("backlog");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTodo, setDeletingTodo] = useState<Todo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const todosByStatus = useMemo(() => {
    const grouped: Record<TodoStatus, Todo[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      done: [],
      cancelled: [],
    };
    for (const t of todos) {
      grouped[t.status].push(t);
    }
    // Sort by sortOrder within each column
    for (const status of TODO_STATUSES) {
      grouped[status].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return grouped;
  }, [todos]);

  const activeTodo = useMemo(
    () => (activeId ? todos.find((t) => t.id === activeId) ?? null : null),
    [activeId, todos]
  );

  // Find which column a todo or column-id belongs to
  function findColumn(id: string): TodoStatus | null {
    // Is it a column id?
    if (TODO_STATUSES.includes(id as TodoStatus)) return id as TodoStatus;
    // Is it a todo id?
    const todo = todos.find((t) => t.id === id);
    return todo ? todo.status : null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    previousTodos.current = [...todos];
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeColumn = findColumn(active.id as string);
    const overColumn = findColumn(over.id as string);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    // Move the card to the new column optimistically
    setTodos((prev) =>
      prev.map((t) =>
        t.id === active.id ? { ...t, status: overColumn } : t
      )
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      // Dropped outside — revert
      setTodos(previousTodos.current);
      return;
    }

    const todoId = active.id as string;
    const targetColumn = findColumn(over.id as string);
    if (!targetColumn) return;

    // Compute new sortOrder based on position in target column
    const columnTodos = todos
      .filter((t) => t.status === targetColumn && t.id !== todoId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const overTodo = columnTodos.find((t) => t.id === over.id);
    let newSortOrder: number;

    if (columnTodos.length === 0) {
      newSortOrder = 1000;
    } else if (!overTodo) {
      // Dropped on the column itself (not on a card) — place at end
      newSortOrder = columnTodos[columnTodos.length - 1].sortOrder + 1000;
    } else {
      const overIndex = columnTodos.indexOf(overTodo);
      if (overIndex === 0) {
        newSortOrder = overTodo.sortOrder - 1000;
      } else {
        const prevTodo = columnTodos[overIndex - 1];
        newSortOrder = Math.floor(
          (prevTodo.sortOrder + overTodo.sortOrder) / 2
        );
      }
    }

    // Optimistically update local state
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? { ...t, status: targetColumn, sortOrder: newSortOrder }
          : t
      )
    );

    // Persist to DB
    const result = await moveTodo(todoId, targetColumn, newSortOrder);
    if (!result.success) {
      // Revert on failure
      setTodos(previousTodos.current);
    }
  }

  const refreshTodos = useCallback(async () => {
    const result = await listTodos();
    if (result.success && result.data) {
      setTodos(result.data);
    }
  }, []);

  function handleEdit(todo: Todo) {
    setEditingTodo(todo);
    setDialogOpen(true);
  }

  function handleDelete(todo: Todo) {
    setDeletingTodo(todo);
    setDeleteDialogOpen(true);
  }

  function handleNewTodo(status: TodoStatus = "backlog") {
    setEditingTodo(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">Todos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos tâches avec le board Kanban
          </p>
        </div>
        <Button onClick={() => handleNewTodo()} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nouveau
        </Button>
      </div>

      <div className="overflow-x-auto -mx-5 px-5 pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max">
            {TODO_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                todos={todosByStatus[status]}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdd={handleNewTodo}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTodo ? (
              <TodoCard
                todo={activeTodo}
                onEdit={() => {}}
                onDelete={() => {}}
                isDragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <TodoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        todo={editingTodo}
        defaultStatus={defaultStatus}
        onSaved={refreshTodos}
      />

      <DeleteTodoDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        todo={deletingTodo}
        onDeleted={refreshTodos}
      />
    </div>
  );
}
