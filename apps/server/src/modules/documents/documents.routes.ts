import multipart from "@fastify/multipart";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { MAX_UPLOAD_BYTES } from "@/constants/misc";

import { documentsController } from "./documents.controller";
import {
  documentCaseParamsSchema,
  documentParamsSchema,
  listDocumentsQuerySchema,
  renameDocumentBodySchema,
} from "./documents.schema";

async function routes(router: FastifyInstance): Promise<void> {
  await router.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES } });

  router.get("/documents/folders", {
    preHandler: [router.authenticate],
    handler: documentsController.listFolders,
  });

  router.post("/cases/:caseId/documents", {
    schema: { params: documentCaseParamsSchema },
    preHandler: [router.authenticate],
    handler: documentsController.upload,
  });

  router.get("/cases/:caseId/documents", {
    schema: {
      params: documentCaseParamsSchema,
      querystring: listDocumentsQuerySchema,
    },
    preHandler: [router.authenticate],
    handler: documentsController.listForCase,
  });

  router.get("/cases/:caseId/documents/:documentId/url", {
    schema: { params: documentParamsSchema },
    preHandler: [router.authenticate],
    handler: documentsController.getUrl,
  });

  router.delete("/cases/:caseId/documents/:documentId", {
    schema: { params: documentParamsSchema },
    preHandler: [router.authenticate],
    handler: documentsController.delete,
  });

  router.patch("/cases/:caseId/documents/:documentId", {
    schema: { params: documentParamsSchema, body: renameDocumentBodySchema },
    preHandler: [router.authenticate],
    handler: documentsController.rename,
  });
}

export const documentsRoutes = fp(routes, { name: "documents-routes" });
