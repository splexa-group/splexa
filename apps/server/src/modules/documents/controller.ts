import "@fastify/multipart";
import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "@/utils/errors";

import type {
  DocumentCaseParams,
  DocumentParams,
  ListDocumentsOrgQuery,
  ListDocumentsQuery,
  RenameDocumentBody,
} from "./schema";
import { documentsService } from "./service";

export const documentsController = {
  async upload(
    req: FastifyRequest<{ Params: DocumentCaseParams }>,
    reply: FastifyReply,
  ) {
    const file = await req.file();
    if (!file) throw new AppError(400, "NO_FILE", "No file uploaded");

    const result = await documentsService.upload(req.params.caseId, file, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
    reply.code(201);
    return result;
  },

  async listForCase(req: FastifyRequest<{ Params: DocumentCaseParams; Querystring: ListDocumentsQuery }>) {
    const { data, total } = await documentsService.listForCase(
      req.params.caseId,
      req.query,
      { orgId: req.user.orgId, userId: req.user.userId, ipAddress: req.ip },
    );
    return { data, total, page: req.query.page, limit: req.query.limit };
  },

  async listForOrg(req: FastifyRequest<{ Querystring: ListDocumentsOrgQuery }>) {
    const { data, total } = await documentsService.listForOrg(req.user.orgId, req.query);
    return { data, total, page: req.query.page, limit: req.query.limit };
  },

  async getUrl(req: FastifyRequest<{ Params: DocumentParams }>) {
    return documentsService.getPresignedUrl(
      req.params.documentId,
      req.params.caseId,
      req.user.orgId,
    );
  },

  async delete(
    req: FastifyRequest<{ Params: DocumentParams }>,
    reply: FastifyReply,
  ) {
    await documentsService.delete(req.params.documentId, req.params.caseId, {
      orgId: req.user.orgId,
      userId: req.user.userId,
      ipAddress: req.ip,
    });
    reply.code(204);
  },

  async rename(
    req: FastifyRequest<{ Params: DocumentParams; Body: RenameDocumentBody }>,
  ) {
    return documentsService.rename(
      req.params.documentId,
      req.params.caseId,
      req.body.name,
      { orgId: req.user.orgId, userId: req.user.userId, ipAddress: req.ip },
    );
  },
};
