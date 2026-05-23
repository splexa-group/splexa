import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientType } from "@splexa-group/shared/enums";

import { Errors } from "@/utils/errors";

import { clientsRepository } from "../repository";
import { clientsService } from "../service";

vi.mock("../repository", () => ({
  clientsRepository: {
    findByPhone: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
}));

const ctx = { orgId: "org-1", userId: "user-1", ipAddress: "127.0.0.1" };

const mockClient = {
  id: "client-1",
  orgId: "org-1",
  fullName: "Ravi Kumar",
  phone: "+91 99999 00000",
  type: ClientType.Individual,
  email: null,
  address: null,
  companyName: null,
  notes: null,
  preferredLanguage: null,
  createdBy: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe("clientsService.create", () => {
  it("creates a client and returns it when no duplicate phone", async () => {
    vi.mocked(clientsRepository.findByPhone).mockResolvedValue(null);
    vi.mocked(clientsRepository.create).mockResolvedValue(mockClient);

    const result = await clientsService.create(
      { fullName: "Ravi Kumar", phone: "+91 99999 00000", type: ClientType.Individual },
      ctx,
    );

    expect(result).toEqual(mockClient);
    expect(result).not.toHaveProperty("warning");
  });

  it("returns warning when phone already exists", async () => {
    vi.mocked(clientsRepository.findByPhone).mockResolvedValue({
      id: "existing-1",
      fullName: "Old Ravi",
    });
    vi.mocked(clientsRepository.create).mockResolvedValue(mockClient);

    const result = await clientsService.create(
      { fullName: "Ravi Kumar", phone: "+91 99999 00000", type: ClientType.Individual },
      ctx,
    );

    expect(result).toHaveProperty("warning", "PHONE_ALREADY_EXISTS");
    expect(result).toHaveProperty("existingClientId", "existing-1");
  });
});

describe("clientsService.findById", () => {
  it("returns client when found", async () => {
    vi.mocked(clientsRepository.findById).mockResolvedValue(mockClient);
    const result = await clientsService.findById("client-1", "org-1");
    expect(result).toEqual(mockClient);
  });

  it("throws clientNotFound when null", async () => {
    vi.mocked(clientsRepository.findById).mockResolvedValue(null);
    await expect(
      clientsService.findById("bad-id", "org-1"),
    ).rejects.toMatchObject({ code: "CLIENT_NOT_FOUND" });
  });
});

describe("clientsService.update", () => {
  it("throws clientNotFound when client does not exist", async () => {
    vi.mocked(clientsRepository.findById).mockResolvedValue(null);

    await expect(
      clientsService.update("bad-id", { fullName: "New Name" }, ctx),
    ).rejects.toMatchObject({ code: "CLIENT_NOT_FOUND" });
  });

  it("updates client when it exists", async () => {
    const updatedClient = { ...mockClient, fullName: "New Name" };
    vi.mocked(clientsRepository.findById).mockResolvedValue(mockClient);
    vi.mocked(clientsRepository.update).mockResolvedValue(updatedClient);

    const result = await clientsService.update(
      "client-1",
      { fullName: "New Name" },
      ctx,
    );

    expect(result).toEqual(updatedClient);
    expect(clientsRepository.update).toHaveBeenCalledWith(
      "client-1",
      { fullName: "New Name" },
    );
  });
});

describe("clientsService.list", () => {
  it("returns data and total from repository", async () => {
    vi.mocked(clientsRepository.list).mockResolvedValue({
      data: [mockClient],
      total: 1,
    });

    const result = await clientsService.list("org-1", {
      page: 1,
      limit: 20,
    });

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(clientsRepository.list).toHaveBeenCalledWith("org-1", {
      page: 1,
      limit: 20,
    });
  });
});

describe("clientsService.delete", () => {
  it("throws clientNotFound when client does not exist", async () => {
    vi.mocked(clientsRepository.findById).mockResolvedValue(null);
    await expect(
      clientsService.delete("bad-id", ctx),
    ).rejects.toMatchObject({ code: "CLIENT_NOT_FOUND" });
  });

  it("soft-deletes when client exists", async () => {
    vi.mocked(clientsRepository.findById).mockResolvedValue(mockClient);
    vi.mocked(clientsRepository.softDelete).mockResolvedValue({ count: 1 });

    await clientsService.delete("client-1", ctx);

    expect(clientsRepository.softDelete).toHaveBeenCalledWith(
      "client-1",
      "org-1",
    );
  });
});
