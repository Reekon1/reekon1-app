"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTodoSchema, updateTodoSchema } from "@/lib/validators/todo";
import type { Todo, TodoStatus } from "@/lib/types/todo";

// ⚠️ SECURITY: Auth is disabled — all operations use the admin client (bypasses RLS)
// with a hardcoded user ID. When re-enabling auth, switch back to createClient()
// and resolve the real userId from supabase.auth.getClaims().
const ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000000";

const uuidSchema = z.string().uuid("Identifiant invalide");

interface ListResult {
  success: boolean;
  data?: Todo[];
  error?: string;
}

interface MutationResult {
  success: boolean;
  error?: string;
}

interface CreateResult extends MutationResult {
  todoId?: string;
}

function mapRow(row: Record<string, unknown>): Todo {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    status: row.status as TodoStatus,
    priority: row.priority as Todo["priority"],
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listTodos(): Promise<ListResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("todos")
    .select("id, title, description, status, priority, sort_order, created_at, updated_at")
    .eq("user_id", ANONYMOUS_USER_ID)
    .order("sort_order", { ascending: true });

  if (error) {
    return { success: false, error: "Impossible de charger les todos." };
  }

  return { success: true, data: (data ?? []).map(mapRow) };
}

export async function createTodo(input: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
}): Promise<CreateResult> {
  const parsed = createTodoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();
  const userId = ANONYMOUS_USER_ID;

  // Get max sort_order for the target status column
  const { data: maxRow } = await supabase
    .from("todos")
    .select("sort_order")
    .eq("user_id", userId)
    .eq("status", parsed.data.status)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (maxRow?.sort_order ?? 0) + 1000;

  const { data, error } = await supabase
    .from("todos")
    .insert({
      user_id: userId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      sort_order: nextSortOrder,
    })
    .select("id, title, description, status, priority, sort_order, created_at, updated_at")
    .single();

  if (error) {
    return { success: false, error: "Impossible de créer le todo." };
  }

  return { success: true, todoId: data.id };
}

export async function updateTodo(
  id: string,
  input: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    sortOrder?: number;
  }
): Promise<MutationResult> {
  if (!uuidSchema.safeParse(id).success) {
    return { success: false, error: "Identifiant invalide." };
  }

  const parsed = updateTodoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined)
    updateData.description = parsed.data.description || null;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.priority !== undefined)
    updateData.priority = parsed.data.priority;
  if (parsed.data.sortOrder !== undefined)
    updateData.sort_order = parsed.data.sortOrder;

  const { error } = await supabase
    .from("todos")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return { success: false, error: "Impossible de mettre à jour le todo." };
  }

  return { success: true };
}

export async function deleteTodo(id: string): Promise<MutationResult> {
  if (!uuidSchema.safeParse(id).success) {
    return { success: false, error: "Identifiant invalide." };
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) {
    return { success: false, error: "Impossible de supprimer le todo." };
  }

  return { success: true };
}

export async function moveTodo(
  id: string,
  status: TodoStatus,
  sortOrder: number
): Promise<MutationResult> {
  if (!uuidSchema.safeParse(id).success) {
    return { success: false, error: "Identifiant invalide." };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("todos")
    .update({
      status,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Impossible de déplacer le todo." };
  }

  return { success: true };
}
