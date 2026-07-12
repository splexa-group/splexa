import { beforeEach, describe, expect, it, vi } from "vitest";

import { casesService } from "@/modules/cases/cases.service";
import { Errors } from "@/utils/errors";

import { documentsRepository } from "../documents.repository";
import { documentsService } from "../documents.service";

vi.mock("../documents.repository", () => ({
  documentsRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    listForCase: vi.fn(),
    softDelete: vi.fn(),
    rename: vi.fn(),
    listFolders: vi.fn(),
  },
}));

vi.mock("@/modules/cases/cases.service", () => ({
  casesService: { findById: vi.fn() },
}));

vi.mock("@/integrations/storage", () => ({
  storageProvider: {
    upload: vi.fn().mockResolvedValue(undefined),
    presignedUrl: vi.fn().mockResolvedValue("https://example.com/signed"),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/config/logger", () => ({
  logger: { error: vi.fn() },
}));

const ctx = { orgId: "org-1", userId: "user-1", ipAddress: "127.0.0.1" };
const mockCase = { id: "case-1", orgId: "org-1", createdBy: "user-1", assignedTo: null };
const mockDoc = {
  id: "doc-1",
  caseId: "case-1",
  orgId: "org-1",
  name: "contract.pdf",
  mimeType: "application/pdf",
  size: 1024,
  storageKey: "orgs/org-1/cases/case-1/documents/abc/contract.pdf",
  uploadedBy: "user-1",
  createdAt: new Date(),
};

function makeFile(filename: string, bytes: number, mimetype = "application/pdf") {
  return {
    filename,
    mimetype,
    toBuffer: vi.fn().mockResolvedValue(Buffer.alloc(bytes)),
  };
}

beforeEach(() => vi.clearAllMocks());

describe("documentsService.upload", () => {
  it("throws caseNotFound when case does not exist", async () => {
    vi.mocked(casesService.findById).mockRejectedValue(Errors.caseNotFound());
    await expect(
      documentsService.upload("bad-case", makeFile("doc.pdf", 100) as never, ctx),
    ).rejects.toThrow(Errors.caseNotFound());
  });

  it("throws FILE_TOO_LARGE when @fastify/multipart's own size limit rejects the upload", async () => {
    vi.mocked(casesService.findById).mockResolvedValue(mockCase as never);
    const tooLarge = {
      filename: "big.pdf",
      mimetype: "application/pdf",
      toBuffer: vi.fn().mockRejectedValue(Object.assign(new Error("request file too large"), {
        code: "FST_REQ_FILE_TOO_LARGE",
      })),
    };
    await expect(
      documentsService.upload("case-1", tooLarge as never, ctx),
    ).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
  });

  it("uploads to storage and creates DB record", async () => {
    vi.mocked(casesService.findById).mockResolvedValue(mockCase as never);
    vi.mocked(documentsRepository.create).mockResolvedValue(mockDoc);

    const file = makeFile("contract.pdf", 1024);
    const result = await documentsService.upload("case-1", file as never, ctx);

    expect(result).toEqual(mockDoc);
    expect(documentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-1",
        caseId: "case-1",
        name: "contract.pdf",
        mimeType: "application/pdf",
        size: 1024,
      }),
    );
  });

  it("storage key includes orgId, caseId, and file extension", async () => {
    vi.mocked(casesService.findById).mockResolvedValue(mockCase as never);
    vi.mocked(documentsRepository.create).mockResolvedValue(mockDoc);

    await documentsService.upload("case-1", makeFile("report.xlsx", 500, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") as never, ctx);

    const createCall = vi.mocked(documentsRepository.create).mock.calls[0][0];
    expect(createCall.storageKey).toMatch(/^orgs\/org-1\/cases\/case-1\/documents\/.+\.xlsx$/);
  });
});

describe("documentsService.listForCase", () => {
  it("throws caseNotFound when case does not belong to org", async () => {
    vi.mocked(casesService.findById).mockRejectedValue(Errors.caseNotFound());

    await expect(
      documentsService.listForCase("case-1", { page: 1, limit: 20 }, ctx),
    ).rejects.toThrow(Errors.caseNotFound());

    expect(documentsRepository.listForCase).not.toHaveBeenCalled();
  });

  it("returns the case's documents when the case exists", async () => {
    vi.mocked(casesService.findById).mockResolvedValue(mockCase as never);
    vi.mocked(documentsRepository.listForCase).mockResolvedValue({ data: [mockDoc], total: 1 });

    const result = await documentsService.listForCase("case-1", { page: 1, limit: 20 }, ctx);

    expect(result).toEqual({ data: [mockDoc], total: 1 });
    expect(documentsRepository.listForCase).toHaveBeenCalledWith("case-1", "org-1", {
      page: 1,
      limit: 20,
    });
  });
});

describe("documentsService.getPresignedUrl", () => {
  it("throws documentNotFound when doc does not exist", async () => {
    vi.mocked(documentsRepository.findById).mockResolvedValue(null);
    await expect(
      documentsService.getPresignedUrl("bad-doc", "case-1", "org-1"),
    ).rejects.toThrow(Errors.documentNotFound());
  });

  it("returns presigned URL from storage provider", async () => {
    vi.mocked(documentsRepository.findById).mockResolvedValue(mockDoc);
    const result = await documentsService.getPresignedUrl("doc-1", "case-1", "org-1");
    expect(result).toEqual({ url: "https://example.com/signed" });
  });
});

describe("documentsService.delete", () => {
  it("throws documentNotFound when doc does not exist", async () => {
    vi.mocked(documentsRepository.findById).mockResolvedValue(null);
    await expect(
      documentsService.delete("bad-doc", "case-1", ctx),
    ).rejects.toThrow(Errors.documentNotFound());
  });

  it("soft-deletes DB record before attempting storage deletion", async () => {
    vi.mocked(documentsRepository.findById).mockResolvedValue(mockDoc);
    vi.mocked(documentsRepository.softDelete).mockResolvedValue({ count: 1 });

    const { storageProvider } = await import("@/integrations/storage");
    const deleteOrder: string[] = [];
    vi.mocked(documentsRepository.softDelete).mockImplementation(async () => {
      deleteOrder.push("db");
      return { count: 1 };
    });
    vi.mocked(storageProvider.delete).mockImplementation(async () => {
      deleteOrder.push("storage");
    });

    await documentsService.delete("doc-1", "case-1", ctx);

    expect(deleteOrder[0]).toBe("db");
    expect(documentsRepository.softDelete).toHaveBeenCalledWith("doc-1", "org-1");
  });
});

describe("documentsService.rename", () => {
  it("throws documentNotFound when doc does not exist", async () => {
    vi.mocked(documentsRepository.findById).mockResolvedValue(null);
    await expect(
      documentsService.rename("bad-doc", "case-1", "new name.pdf", ctx),
    ).rejects.toThrow(Errors.documentNotFound());
  });

  it("renames the document and returns updated record", async () => {
    const renamed = { ...mockDoc, name: "new name.pdf" };
    vi.mocked(documentsRepository.findById).mockResolvedValue(mockDoc);
    vi.mocked(documentsRepository.rename).mockResolvedValue(renamed);

    const result = await documentsService.rename("doc-1", "case-1", "new name.pdf", ctx);

    expect(documentsRepository.rename).toHaveBeenCalledWith("doc-1", "case-1", "org-1", "new name.pdf");
    expect(result).toEqual(renamed);
  });
});

describe("documentsService.listFolders", () => {
  it("returns folder list from repository", async () => {
    const folders = [
      { caseId: "case-1", title: "Sharma v State", documentCount: 4 },
      { caseId: "case-2", title: "Mehta Property", documentCount: 0 },
    ];
    vi.mocked(documentsRepository.listFolders).mockResolvedValue(folders);

    const result = await documentsService.listFolders("org-1");

    expect(documentsRepository.listFolders).toHaveBeenCalledWith("org-1");
    expect(result).toEqual(folders);
  });
});
