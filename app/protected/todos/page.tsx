import { Suspense } from "react";
import { listTodos } from "@/lib/actions/todos";
import { KanbanBoard } from "@/components/todos/kanban-board";

async function TodosBoard() {
  const result = await listTodos();
  const todos = result.success ? (result.data ?? []) : [];

  if (!result.success) {
    return <p className="text-sm text-red-600">{result.error}</p>;
  }

  return <KanbanBoard initialTodos={todos} />;
}

export default function TodosPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Chargement des todos...</p>
      }
    >
      <TodosBoard />
    </Suspense>
  );
}
