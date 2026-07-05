import type { FastifyInstance } from "fastify";

import { documentsController } from "./controller";
import {
  documentCaseParamsSchema,
  documentParamsSchema,
  listDocumentsOrgQuerySchema,
  listDocumentsQuerySchema,
  renameDocumentBodySchema,
} from "./schema";

export function documentsRoutes(router: FastifyInstance): void {
  router.get("/", {
    schema: { querystring: listDocumentsOrgQuerySchema },
    preHandler: [router.authenticate],
    handler: documentsController.listForOrg,
  });

  router.get("/folders", {
    preHandler: [router.authenticate],
    handler: documentsController.listFolders,
  });
}

// Case-scoped: registered under /api/v1/cases in the plugin
export function documentsCaseScopedRoutes(router: FastifyInstance): void {
  router.post("/:caseId/documents", {
    schema: { params: documentCaseParamsSchema },
    preHandler: [router.authenticate],
    handler: documentsController.upload,
  });

  router.get("/:caseId/documents", {
    schema: { params: documentCaseParamsSchema, querystring: listDocumentsQuerySchema },
    preHandler: [router.authenticate],
    handler: documentsController.listForCase,
  });

  router.get("/:caseId/documents/:documentId/url", {
    schema: { params: documentParamsSchema },
    preHandler: [router.authenticate],
    handler: documentsController.getUrl,
  });

  router.delete("/:caseId/documents/:documentId", {
    schema: { params: documentParamsSchema },
    preHandler: [router.authenticate],
    handler: documentsController.delete,
  });

  router.patch("/:caseId/documents/:documentId", {
    schema: { params: documentParamsSchema, body: renameDocumentBodySchema },
    preHandler: [router.authenticate],
    handler: documentsController.rename,
  });
}
