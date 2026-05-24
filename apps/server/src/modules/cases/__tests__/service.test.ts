import { describe, it, expect, vi, beforeEach } from "vitest";

import { clientsRepository } from "@/modules/clients/repository";
import { Errors } from "@/utils/errors";

import { casesRepository } from "../repository";
import { casesService } from "../service";

vi.mock("../repository", () => ({
  casesRepository: {
    create: vi.fn(),
    createWithNewClient: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    softDeleteCascade: vi.fn(),
  },
}));

vi.mock("@/modules/clients/repository", () => ({
  clientsRepository: { findById: vi.fn(), findByPhone: vi.fn() },
}));

const ctx = { orgId: "org-1", userId: "user-1", ipAddress: "127.0.0.1" };
const mockCase = {
  id: "case-1",
  orgId: "org-1",
  title: "Test Case",
  status: "Active",
  clientId: "client-1",
  assignedTo: null,
  createdBy: "user-1",
};
const mockClient = { id: "client-1", orgId: "org-1", fullName: "Ravi Kumar" };

beforeEach(() => vi.clearAllMocks());

describe("casesService.create with clientId", () => {
  it("throws clientNotFound when clientId does not belong to org", async () => {
    vi.mocked(clientsRepository.findById).mockResolvedValue(null);

    await expect(
      casesService.create(
        {
          title: "Test",
          clientRole: "Petitioner" as never,
          clientId: "bad-id",
          status: "Active" as never,
        },
        ctx,
      ),
    ).rejects.toThrow(Errors.clientNotFound());
  });

  it("creates case when clientId is valid", async () => {
    vi.mocked(clientsRepository.findById).mockResolvedValue(mockClient as never);
    vi.mocked(casesRepository.create).mockResolvedValue(mockCase as never);

    const result = await casesService.create(
      {
        title: "Test",
        clientRole: "Petitioner" as never,
        clientId: "client-1",
        status: "Active" as never,
      },
      ctx,
    );

    expect(result.data).toEqual(mockCase);
    expect(result.warnings).toBeUndefined();
    expect(casesRepository.create).toHaveBeenCalled();
  });
});

describe("casesService.create with newClient", () => {
  it("creates client and case atomically, no warning when phone is unique", async () => {
    vi.mocked(clientsRepository.findByPhone).mockResolvedValue(null);
    vi.mocked(casesRepository.createWithNewClient).mockResolvedValue(mockCase as never);

    const result = await casesService.create(
      {
        title: "Test",
        clientRole: "Petitioner" as never,
        newClient: { fullName: "Suresh Nair", phone: "9999999999", type: "Individual" as never },
        status: "Active" as never,
      },
      ctx,
    );

    expect(result.data).toEqual(mockCase);
    expect(result.warnings).toBeUndefined();
  });

  it("returns warnings when new client phone belongs to an existing client", async () => {
    vi.mocked(clientsRepository.findByPhone).mockResolvedValue({
      id: "other-client",
      fullName: "Anita Desai",
    });
    vi.mocked(casesRepository.createWithNewClient).mockResolvedValue(mockCase as never);

    const result = await casesService.create(
      {
        title: "Test",
        clientRole: "Petitioner" as never,
        newClient: { fullName: "Suresh Nair", phone: "9999999999", type: "Individual" as never },
        status: "Active" as never,
      },
      ctx,
    );

    expect(result.data).toEqual(mockCase);
    expect(result.warnings).toEqual(["Anita Desai already has this phone number"]);
  });
});

describe("casesService.findById", () => {
  it("throws caseNotFound when null", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(null);
    await expect(casesService.findById("bad-id", "org-1")).rejects.toThrow(
      Errors.caseNotFound(),
    );
  });

  it("returns case when found", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(mockCase as never);
    const result = await casesService.findById("case-1", "org-1");
    expect(result).toEqual(mockCase);
  });
});

describe("casesService.delete", () => {
  it("throws caseNotFound when case does not exist", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(null);
    await expect(casesService.delete("bad-id", ctx)).rejects.toThrow(
      Errors.caseNotFound(),
    );
  });

  it("cascade-deletes when case exists", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(mockCase as never);
    vi.mocked(casesRepository.softDeleteCascade).mockResolvedValue(undefined as never);

    await casesService.delete("case-1", ctx);
    expect(casesRepository.softDeleteCascade).toHaveBeenCalledWith("case-1", "org-1");
  });
});

describe("casesService.update", () => {
  it("throws caseNotFound when case does not exist", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(null);
    await expect(
      casesService.update("bad-id", { title: "New Title" }, ctx),
    ).rejects.toThrow(Errors.caseNotFound());
  });

  it("updates case when it exists", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(mockCase as never);
    vi.mocked(casesRepository.update).mockResolvedValue({
      ...mockCase,
      title: "New Title",
    } as never);

    const result = await casesService.update("case-1", { title: "New Title" }, ctx);
    expect(result).toHaveProperty("title", "New Title");
    expect(casesRepository.update).toHaveBeenCalledWith(
      "case-1",
      "org-1",
      expect.objectContaining({ title: "New Title" }),
    );
  });
});
