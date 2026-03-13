import { z } from "zod";

export const keyTransformSchema = z.enum([
  "default",
  "alphanumeric_only",
  "extract_code_prefix",
  "absolute_amount",
]);

export const templateConfigSchema = z.object({
  keyColumnsA: z.array(z.string()).min(1),
  keyColumnsB: z.array(z.string()).min(1),
  amountColumnA: z.string().nullable(),
  amountColumnB: z.string().nullable(),
  excludeHeaderRowsA: z.number().int().min(0),
  excludeHeaderRowsB: z.number().int().min(0),
  excludeFooterRowsA: z.number().int().min(0),
  excludeFooterRowsB: z.number().int().min(0),
  deduplication: z.boolean(),
  keyTransforms: z.array(keyTransformSchema).optional(),
});

export const saveTemplateSchema = z.object({
  templateName: z
    .string()
    .min(1, "Le nom du modèle est obligatoire")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  description: z.string().max(500).optional().default(""),
  config: templateConfigSchema,
});

export type SaveTemplateInput = z.infer<typeof saveTemplateSchema>;

export const updateTemplateSchema = z.object({
  templateName: z
    .string()
    .min(1, "Le nom du modèle est obligatoire")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  description: z.string().max(500).optional().default(""),
});

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
