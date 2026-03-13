"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveTemplateSchema, updateTemplateSchema } from "@/lib/validators/template";
import type { TemplateConfig, SavedTemplate } from "@/lib/types/template";

// ⚠️ SECURITY: Auth is disabled — all operations use the admin client (bypasses RLS)
// with a hardcoded user ID. When re-enabling auth, switch back to createClient()
// and resolve the real userId from supabase.auth.getClaims().
const ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000000";

const uuidSchema = z.string().uuid("Identifiant invalide");

interface ListResult {
  success: boolean;
  data?: SavedTemplate[];
  error?: string;
}

interface GetResult {
  success: boolean;
  data?: SavedTemplate;
  error?: string;
}

interface MutationResult {
  success: boolean;
  error?: string;
}

interface SaveResult extends MutationResult {
  duplicate?: boolean;
  templateId?: string;
}

export async function saveTemplate(input: {
  templateName: string;
  description?: string;
  config: TemplateConfig;
}): Promise<SaveResult> {
  const parsed = saveTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();
  const userId = ANONYMOUS_USER_ID;

  // Check for duplicate name
  const { data: existing } = await supabase
    .from("reconciliation_templates")
    .select("id")
    .eq("user_id", userId)
    .eq("template_name", parsed.data.templateName)
    .maybeSingle();

  if (existing) {
    return { success: false, duplicate: true, error: "Un modèle avec ce nom existe déjà" };
  }

  const { data, error } = await supabase
    .from("reconciliation_templates")
    .insert({
      user_id: userId,
      template_name: parsed.data.templateName,
      description: parsed.data.description || null,
      config: parsed.data.config as unknown as Record<string, unknown>,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: "Impossible de sauvegarder le modèle. Veuillez réessayer." };
  }

  return { success: true, templateId: data.id };
}

export async function upsertTemplate(input: {
  templateName: string;
  description?: string;
  config: TemplateConfig;
}): Promise<SaveResult> {
  const parsed = saveTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();
  const userId = ANONYMOUS_USER_ID;

  const { data, error } = await supabase
    .from("reconciliation_templates")
    .upsert(
      {
        user_id: userId,
        template_name: parsed.data.templateName,
        description: parsed.data.description || null,
        config: parsed.data.config as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,template_name" }
    )
    .select("id")
    .single();

  if (error) {
    return { success: false, error: "Impossible de sauvegarder le modèle. Veuillez réessayer." };
  }

  return { success: true, templateId: data.id };
}

export async function listTemplates(): Promise<ListResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reconciliation_templates")
    .select("id, template_name, description, config, created_at, updated_at")
    .eq("user_id", ANONYMOUS_USER_ID)
    .order("updated_at", { ascending: false });

  if (error) {
    return { success: false, error: "Impossible de charger les modèles." };
  }

  const templates: SavedTemplate[] = (data ?? []).map((row) => ({
    id: row.id,
    templateName: row.template_name,
    description: row.description,
    config: row.config as unknown as TemplateConfig,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { success: true, data: templates };
}

export async function getTemplate(id: string): Promise<GetResult> {
  if (!uuidSchema.safeParse(id).success) {
    return { success: false, error: "Identifiant invalide." };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reconciliation_templates")
    .select("id, template_name, description, config, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { success: false, error: "Impossible de charger le modèle." };
  }

  if (!data) {
    return { success: false, error: "Modèle introuvable." };
  }

  return {
    success: true,
    data: {
      id: data.id,
      templateName: data.template_name,
      description: data.description,
      config: data.config as unknown as TemplateConfig,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

export async function updateTemplate(
  id: string,
  input: { templateName: string; description?: string }
): Promise<MutationResult> {
  if (!uuidSchema.safeParse(id).success) {
    return { success: false, error: "Identifiant invalide." };
  }

  const parsed = updateTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();

  // Check for duplicate name (exclude current template)
  const { data: existing } = await supabase
    .from("reconciliation_templates")
    .select("id")
    .eq("user_id", ANONYMOUS_USER_ID)
    .eq("template_name", parsed.data.templateName)
    .neq("id", id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Un modèle avec ce nom existe déjà." };
  }

  const { error } = await supabase
    .from("reconciliation_templates")
    .update({
      template_name: parsed.data.templateName,
      description: parsed.data.description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Impossible de mettre à jour le modèle." };
  }

  return { success: true };
}

export async function deleteTemplate(id: string): Promise<MutationResult> {
  if (!uuidSchema.safeParse(id).success) {
    return { success: false, error: "Identifiant invalide." };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("reconciliation_templates")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: "Impossible de supprimer le modèle." };
  }

  return { success: true };
}
