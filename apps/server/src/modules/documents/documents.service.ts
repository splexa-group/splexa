import { MultipartFile } from "@fastify/multipart";

import { logger } from "@/config/logger";
import { PRESIGNED_URL_TTL_SECONDS } from "@/constants/misc";
import { storageProvider } from "@/integrations/storage";
import { ReqContext } from "@/models/req-context";
import { casesService } from "@/modules/cases/cases.service";
import { Errors } from "@/utils/errors";
import { UUID } from "@/utils/misc";

import { documentsRepository } from "./documents.repository";
import { ListDocumentsQuery } from "./documents.schema";

export const documentsService = {
  async upload(
    caseId: string,
    file: MultipartFile | undefined,
    ctx: ReqContext,
  ) {
    if (!file) throw Errors.noFileUploaded();

    await casesService.findById(caseId, ctx.orgId);

    // @fastify/multipart enforces MAX_UPLOAD_BYTES itself (registered with that fileSize
    // limit) and throws FST_REQ_FILE_TOO_LARGE from toBuffer() when exceeded — it never
    // silently truncates, so there's no oversized buffer left to check after this resolves.
    const buffer = await file.toBuffer().catch((err: unknown) => {
      if (
        err instanceof Error &&
        "code" in err &&
        err.code === "FST_REQ_FILE_TOO_LARGE"
      ) {
        throw Errors.fileTooLarge();
      }
      throw err;
    });

    const ext = file.filename.includes(".")
      ? file.filename.split(".").pop()
      : "";
    const storageKey = `orgs/${ctx.orgId}/cases/${caseId}/documents/${UUID()}${ext ? `.${ext}` : ""}`;

    await storageProvider.upload(storageKey, buffer, file.mimetype);

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

  async listForCase(
    caseId: string,
    query: ListDocumentsQuery,
    ctx: ReqContext,
  ) {
    await casesService.findById(caseId, ctx.orgId);
    return documentsRepository.listForCase(caseId, ctx.orgId, query);
  },

  async getPresignedUrl(documentId: string, caseId: string, orgId: string) {
    const doc = await documentsRepository.findById(documentId, caseId, orgId);
    if (!doc) throw Errors.documentNotFound();
    return {
      url: await storageProvider.presignedUrl(
        doc.storageKey,
        PRESIGNED_URL_TTL_SECONDS,
      ),
    };
  },

  async delete(documentId: string, caseId: string, ctx: ReqContext) {
    const doc = await documentsRepository.findById(
      documentId,
      caseId,
      ctx.orgId,
    );
    if (!doc) throw Errors.documentNotFound();
    // Soft-delete DB record first so the document is immediately inaccessible
    const { count } = await documentsRepository.softDelete(
      documentId,
      ctx.orgId,
    );
    if (count === 0) throw Errors.documentNotFound();
    // Storage cleanup is best-effort — a failed delete leaves an orphaned object but keeps DB consistent
    storageProvider.delete(doc.storageKey).catch((err: unknown) => {
      logger.error(
        { documentId, storageKey: doc.storageKey, err },
        "documents: failed to delete object from storage",
      );
    });
  },

  async rename(
    documentId: string,
    caseId: string,
    name: string,
    ctx: ReqContext,
  ) {
    const doc = await documentsRepository.findById(
      documentId,
      caseId,
      ctx.orgId,
    );
    if (!doc) throw Errors.documentNotFound();
    return documentsRepository.rename(documentId, caseId, ctx.orgId, name);
  },

  async listFolders(orgId: string) {
    return documentsRepository.listFolders(orgId);
  },
};
