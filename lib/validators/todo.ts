import { z } from "zod";

export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est obligatoire")
    .max(200, "Le titre ne peut pas dépasser 200 caractères"),
  description: z.string().max(2000).optional().default(""),
  status: z
    .enum(["backlog", "todo", "in_progress", "done", "cancelled"])
    .default("backlog"),
  priority: z
    .enum(["urgent", "high", "medium", "low", "none"])
    .default("none"),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est obligatoire")
    .max(200, "Le titre ne peut pas dépasser 200 caractères")
    .optional(),
  description: z.string().max(2000).optional(),
  status: z
    .enum(["backlog", "todo", "in_progress", "done", "cancelled"])
    .optional(),
  priority: z
    .enum(["urgent", "high", "medium", "low", "none"])
    .optional(),
  sortOrder: z.number().int().optional(),
});

export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
