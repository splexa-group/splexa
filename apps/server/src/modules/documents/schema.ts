import { z } from "zod";

export const documentCaseParamsSchema = z
  .object({ caseId: z.string() })
  .strict();

export const documentParamsSchema = z
  .object({ caseId: z.string(), documentId: z.string() })
  .strict();

export const listDocumentsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export const listDocumentsOrgQuerySchema = z
  .object({
    caseId: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export type DocumentCaseParams = z.infer<typeof documentCaseParamsSchema>;
export type DocumentParams = z.infer<typeof documentParamsSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type ListDocumentsOrgQuery = z.infer<typeof listDocumentsOrgQuerySchema>;

export const renameDocumentBodySchema = z
  .object({ name: z.string().min(1).max(255) })
  .strict();

export type RenameDocumentBody = z.infer<typeof renameDocumentBodySchema>;
