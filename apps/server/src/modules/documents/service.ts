import type { MultipartFile } from "@fastify/multipart";

import { MAX_UPLOAD_BYTES } from "@/constants/misc";
import { R2Adapter } from "@/integrations/storage/r2-adapter";
import { casesRepository } from "@/modules/cases/repository";
import type { ServiceContext } from "@/types/service-context";
import { generateUUID } from "@/utils/crypto";
import { AppError, Errors } from "@/utils/errors";

import { documentsRepository } from "./repository";
import type { ListDocumentsOrgQuery, ListDocumentsQuery } from "./schema";

const storage = new R2Adapter();

export const documentsService = {
  async upload(caseId: string, file: MultipartFile, ctx: ServiceContext) {
    const parentCase = await casesRepository.findById(caseId, ctx.orgId);
    if (!parentCase) throw Errors.caseNotFound();

    const buffer = await file.toBuffer();
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new AppError(413, "FILE_TOO_LARGE", "File must be 50 MB or smaller");
    }

    const ext = file.filename.includes(".") ? file.filename.split(".").pop() : "";
    const storageKey = `orgs/${ctx.orgId}/cases/${caseId}/documents/${generateUUID()}${ext ? `.${ext}` : ""}`;

    await storage.upload(storageKey, buffer, file.mimetype);

    return documentsRepository.create({
      orgId: ctx.orgId,
      caseId,
      name: file.filename,
      mimeType: file.mimetype,
      size: buffer.byteLength,
      storageKey,
      uploadedBy: ctx.userId,
    });
  },

  async listForCase(caseId: string, query: ListDocumentsQuery, ctx: ServiceContext) {
    const parentCase = await casesRepository.findById(caseId, ctx.orgId);
    if (!parentCase) throw Errors.caseNotFound();
    return documentsRepository.listForCase(caseId, ctx.orgId, query);
  },

  async listForOrg(orgId: string, query: ListDocumentsOrgQuery) {
    return documentsRepository.listForOrg(orgId, query);
  },

  async getPresignedUrl(documentId: string, caseId: string, orgId: string) {
    const doc = await documentsRepository.findById(documentId, caseId, orgId);
    if (!doc) throw Errors.documentNotFound();
    return { url: await storage.presignedUrl(doc.storageKey, 3600) };
  },

  async delete(documentId: string, caseId: string, ctx: ServiceContext) {
    const doc = await documentsRepository.findById(documentId, caseId, ctx.orgId);
    if (!doc) throw Errors.documentNotFound();
    await storage.delete(doc.storageKey);
    await documentsRepository.softDelete(documentId, ctx.orgId);
  },
};
