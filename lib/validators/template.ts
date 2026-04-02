import { z } from "zod";

export const keyTransformSchema = z.enum([
  "default",
  "alphanumeric_only",
  "extract_code_prefix",
  "absolute_amount",
]);

const templateKeyMappingSchema = z.object({
  colsA: z.array(z.string()).min(1),
  colsB: z.array(z.string()).min(1),
  separator: z.string(),
  transform: keyTransformSchema,
});

export const templateConfigSchema = z.object({
  // New format (optional for backward compat)
  keyMappings: z.array(templateKeyMappingSchema).optional(),
  // Legacy format
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
  keySeparator: z.string().optional(),
});

export const saveTemplateSchema = z.object({
  templateName: z
    .string()
    .min(1, "Le nom du mod\u00e8le est obligatoire")
    .max(100, "Le nom ne peut pas d\u00e9passer 100 caract\u00e8res"),
  description: z.string().max(500).optional().default(""),
  config: templateConfigSchema,
});

export type SaveTemplateInput = z.infer<typeof saveTemplateSchema>;

export const updateTemplateSchema = z.object({
  templateName: z
    .string()
    .min(1, "Le nom du mod\u00e8le est obligatoire")
    .max(100, "Le nom ne peut pas d\u00e9passer 100 caract\u00e8res"),
  description: z.string().max(500).optional().default(""),
});

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
