import "@fastify/multipart";
import { FastifyReply, FastifyRequest } from "fastify";

import {
  DocumentCaseParams,
  DocumentParams,
  ListDocumentsQuery,
  RenameDocumentBody,
} from "./documents.schema";
import { documentsService } from "./documents.service";

export const documentsController = {
  async upload(
    req: FastifyRequest<{ Params: DocumentCaseParams }>,
    reply: FastifyReply,
  ) {
    const file = await req.file();

    const document = await documentsService.upload(req.params.caseId, file, {
      orgId: req.user.orgId,
      userId: req.user.userId,
    });
    reply.code(201);
    return { document };
  },

  async listForCase(req: FastifyRequest<{ Params: DocumentCaseParams; Querystring: ListDocumentsQuery }>) {
    const { data, total } = await documentsService.listForCase(
      req.params.caseId,
      req.query,
      { orgId: req.user.orgId, userId: req.user.userId },
    );
    return { documents: data, total, page: req.query.page, limit: req.query.limit };
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
    });
    reply.code(204);
  },

  async rename(
    req: FastifyRequest<{ Params: DocumentParams; Body: RenameDocumentBody }>,
  ) {
    const document = await documentsService.rename(
      req.params.documentId,
      req.params.caseId,
      req.body.name,
      { orgId: req.user.orgId, userId: req.user.userId },
    );
    return { document };
  },

  async listFolders(req: FastifyRequest) {
    const folders = await documentsService.listFolders(req.user.orgId);
    return { folders };
  },
};
