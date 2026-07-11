import { describe, it, expect, vi, beforeEach } from "vitest";

import { clientsRepository } from "@/modules/clients/clients.repository";
import { Errors } from "@/utils/errors";

import { casesRepository } from "../cases.repository";
import { casesService } from "../cases.service";

vi.mock("../cases.repository", () => ({
  casesRepository: {
    create: vi.fn(),
    createWithNewClient: vi.fn(),
    createClientAndLink: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    softDeleteCascade: vi.fn(),
    userExistsInOrg: vi.fn(),
  },
}));

vi.mock("@/modules/clients/clients.repository", () => ({
  clientsRepository: { findById: vi.fn(), findByPhone: vi.fn() },
}));

const ctx = { orgId: "org-1", userId: "user-1", ipAddress: "127.0.0.1" };
const mockCase = {
  id: "case-1",
  orgId: "org-1",
  title: "Test Case",
  status: "ACTIVE",
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
          description: "Test description",
          clientRole: "PETITIONER" as never,
          clientId: "bad-id",
          status: "ACTIVE" as never,
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
        description: "Test description",
        clientRole: "PETITIONER" as never,
        clientId: "client-1",
        status: "ACTIVE" as never,
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
        description: "Test description",
        clientRole: "PETITIONER" as never,
        newClient: { fullName: "Suresh Nair", phone: "9999999999", type: "INDIVIDUAL" as never },
        status: "ACTIVE" as never,
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
        description: "Test description",
        clientRole: "PETITIONER" as never,
        newClient: { fullName: "Suresh Nair", phone: "9999999999", type: "INDIVIDUAL" as never },
        status: "ACTIVE" as never,
      },
      ctx,
    );

    expect(result.data).toEqual(mockCase);
    expect(result.warnings).toEqual(["Anita Desai already has this phone number"]);
  });
});

describe("casesService.create with assignedTo", () => {
  it("throws assignedUserNotFound when assignedTo does not belong to org", async () => {
    vi.mocked(casesRepository.userExistsInOrg).mockResolvedValue(false);

    await expect(
      casesService.create(
        {
          title: "Test",
          description: "Test description",
          clientRole: "PETITIONER" as never,
          assignedTo: "other-org-user",
          status: "ACTIVE" as never,
        },
        ctx,
      ),
    ).rejects.toThrow(Errors.assignedUserNotFound());

    expect(casesRepository.create).not.toHaveBeenCalled();
  });

  it("creates case when assignedTo belongs to org", async () => {
    vi.mocked(casesRepository.userExistsInOrg).mockResolvedValue(true);
    vi.mocked(casesRepository.create).mockResolvedValue(mockCase as never);

    const result = await casesService.create(
      {
        title: "Test",
        description: "Test description",
        clientRole: "PETITIONER" as never,
        assignedTo: "user-1",
        status: "ACTIVE" as never,
      },
      ctx,
    );

    expect(result.data).toEqual(mockCase);
    expect(casesRepository.userExistsInOrg).toHaveBeenCalledWith("user-1", "org-1");
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
    vi.mocked(casesRepository.softDeleteCascade).mockResolvedValue({ count: 1 });

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

  it("throws assignedUserNotFound when assignedTo does not belong to org", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(mockCase as never);
    vi.mocked(casesRepository.userExistsInOrg).mockResolvedValue(false);

    await expect(
      casesService.update("case-1", { assignedTo: "other-org-user" }, ctx),
    ).rejects.toThrow(Errors.assignedUserNotFound());

    expect(casesRepository.update).not.toHaveBeenCalled();
  });
});

describe("casesService.addClient", () => {
  const input = { fullName: "Ravi Kumar", phone: "9999999999", type: "INDIVIDUAL" as never };

  it("throws caseNotFound when case does not exist", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(null);

    await expect(casesService.addClient("bad-id", input, ctx)).rejects.toThrow(
      Errors.caseNotFound(),
    );
  });

  it("throws caseClientExists when case already has a client", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(mockCase as never);

    await expect(casesService.addClient("case-1", input, ctx)).rejects.toThrow(
      Errors.caseClientExists(),
    );
  });

  it("links the new client and returns the updated case", async () => {
    const clientlessCase = { ...mockCase, clientId: null };
    vi.mocked(casesRepository.findById).mockResolvedValue(clientlessCase as never);
    vi.mocked(clientsRepository.findByPhone).mockResolvedValue(null);
    vi.mocked(casesRepository.createClientAndLink).mockResolvedValue(mockCase as never);

    const result = await casesService.addClient("case-1", input, ctx);
    expect(result.data).toEqual(mockCase);
    expect(result.warnings).toBeUndefined();
  });

  it("throws caseClientExists (not caseNotFound) when a concurrent request wins the link race", async () => {
    const clientlessCase = { ...mockCase, clientId: null };
    vi.mocked(casesRepository.findById)
      .mockResolvedValueOnce(clientlessCase as never) // initial existence check
      .mockResolvedValueOnce(mockCase as never); // re-check after lost race: case still exists
    vi.mocked(clientsRepository.findByPhone).mockResolvedValue(null);
    vi.mocked(casesRepository.createClientAndLink).mockResolvedValue(null);

    await expect(casesService.addClient("case-1", input, ctx)).rejects.toThrow(
      Errors.caseClientExists(),
    );
  });

  it("throws caseNotFound when the case is deleted mid-request", async () => {
    const clientlessCase = { ...mockCase, clientId: null };
    vi.mocked(casesRepository.findById)
      .mockResolvedValueOnce(clientlessCase as never) // initial existence check
      .mockResolvedValueOnce(null); // re-check after lost race: case no longer exists
    vi.mocked(clientsRepository.findByPhone).mockResolvedValue(null);
    vi.mocked(casesRepository.createClientAndLink).mockResolvedValue(null);

    await expect(casesService.addClient("case-1", input, ctx)).rejects.toThrow(
      Errors.caseNotFound(),
    );
  });
});
