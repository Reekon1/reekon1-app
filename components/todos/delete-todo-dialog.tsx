"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteTodo } from "@/lib/actions/todos";
import type { Todo } from "@/lib/types/todo";

interface DeleteTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo: Todo | null;
  onDeleted: () => void;
}

export function DeleteTodoDialog({
  open,
  onOpenChange,
  todo,
  onDeleted,
}: DeleteTodoDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!todo) return;
    setDeleting(true);
    const result = await deleteTodo(todo.id);
    setDeleting(false);

    if (result.success) {
      onOpenChange(false);
      onDeleted();
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce todo ?</AlertDialogTitle>
          <AlertDialogDescription>
            &laquo;&nbsp;{todo?.title}&nbsp;&raquo; sera supprimé définitivement.
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
