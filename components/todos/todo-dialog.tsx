"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTodo, updateTodo } from "@/lib/actions/todos";
import type { Todo, TodoStatus, TodoPriority } from "@/lib/types/todo";
import {
  TODO_STATUSES,
  TODO_PRIORITIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from "@/lib/types/todo";

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: Todo | null;
  defaultStatus?: TodoStatus;
  onSaved: () => void;
}

export function TodoDialog({
  open,
  onOpenChange,
  todo,
  defaultStatus = "backlog",
  onSaved,
}: TodoDialogProps) {
  const isEdit = !!todo;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TodoStatus>(defaultStatus);
  const [priority, setPriority] = useState<TodoPriority>("none");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (todo) {
        setTitle(todo.title);
        setDescription(todo.description ?? "");
        setStatus(todo.status);
        setPriority(todo.priority);
      } else {
        setTitle("");
        setDescription("");
        setStatus(defaultStatus);
        setPriority("none");
      }
      setError(null);
    }
  }, [open, todo, defaultStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = isEdit
      ? await updateTodo(todo!.id, { title, description, status, priority })
      : await createTodo({ title, description, status, priority });

    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Erreur inconnue");
      return;
    }

    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le todo" : "Nouveau todo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du todo..."
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optionnel)..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TodoStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODO_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Priorité</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TodoPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TODO_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
