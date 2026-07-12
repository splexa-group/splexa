import { z } from "zod";

export const documentCaseParamsSchema = z
  .object({ caseId: z.uuid() })
  .strict();

export const documentParamsSchema = z
  .object({ caseId: z.uuid(), documentId: z.uuid() })
  .strict();

export const listDocumentsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export type DocumentCaseParams = z.infer<typeof documentCaseParamsSchema>;
export type DocumentParams = z.infer<typeof documentParamsSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;

export const renameDocumentBodySchema = z
  .object({ name: z.string().min(1).max(255) })
  .strict();

export type RenameDocumentBody = z.infer<typeof renameDocumentBodySchema>;

export interface DocumentFolderItem {
  caseId: string;
  title: string;
  documentCount: number;
}
