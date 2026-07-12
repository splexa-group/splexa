import { describe, it, expect, vi, beforeEach } from "vitest";

import { Errors } from "@/utils/errors";
import { casesService } from "@/modules/cases/cases.service";

import { hearingsRepository } from "../hearings.repository";
import { hearingsService } from "../hearings.service";

vi.mock("../hearings.repository", () => ({
  hearingsRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findByCaseId: vi.fn(),
    listCrossCase: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
}));

vi.mock("@/modules/cases/cases.service", () => ({
  casesService: { findById: vi.fn() },
}));

const ctx = { orgId: "org-1", userId: "user-1", ipAddress: "127.0.0.1" };
const mockCase = {
  id: "case-1",
  orgId: "org-1",
  assignedTo: null,
  createdBy: "user-1",
};
const mockHearing = {
  id: "hearing-1",
  caseId: "case-1",
  orgId: "org-1",
  status: "SCHEDULED",
};

beforeEach(() => vi.clearAllMocks());

describe("hearingsService.create", () => {
  it("throws caseNotFound when case does not belong to org", async () => {
    vi.mocked(casesService.findById).mockRejectedValue(Errors.caseNotFound());

    await expect(
      hearingsService.create("case-1", { date: new Date().toISOString() }, ctx),
    ).rejects.toThrow(Errors.caseNotFound());

    expect(hearingsRepository.create).not.toHaveBeenCalled();
  });

  it("creates hearing when case exists", async () => {
    vi.mocked(casesService.findById).mockResolvedValue(mockCase as never);
    vi.mocked(hearingsRepository.create).mockResolvedValue(mockHearing as never);

    const result = await hearingsService.create(
      "case-1",
      { date: new Date().toISOString() },
      ctx,
    );

    expect(result).toEqual(mockHearing);
    expect(hearingsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ caseId: "case-1", orgId: "org-1", addedBy: "user-1" }),
    );
  });
});

describe("hearingsService.listForCase", () => {
  it("throws caseNotFound when case does not belong to org", async () => {
    vi.mocked(casesService.findById).mockRejectedValue(Errors.caseNotFound());

    await expect(hearingsService.listForCase("case-1", "org-1")).rejects.toThrow(
      Errors.caseNotFound(),
    );

    expect(hearingsRepository.findByCaseId).not.toHaveBeenCalled();
  });

  it("returns the case's hearings when the case exists", async () => {
    vi.mocked(casesService.findById).mockResolvedValue(mockCase as never);
    vi.mocked(hearingsRepository.findByCaseId).mockResolvedValue([mockHearing] as never);

    const result = await hearingsService.listForCase("case-1", "org-1");

    expect(result).toEqual([mockHearing]);
    expect(hearingsRepository.findByCaseId).toHaveBeenCalledWith("case-1", "org-1");
  });
});

describe("hearingsService.update", () => {
  it("throws hearingNotFound when hearing does not exist", async () => {
    vi.mocked(hearingsRepository.findById).mockResolvedValue(null);

    await expect(
      hearingsService.update("bad-id", { status: "COMPLETED" as never }, ctx),
    ).rejects.toThrow(Errors.hearingNotFound());
  });

  it("updates hearing when it exists", async () => {
    vi.mocked(hearingsRepository.findById).mockResolvedValue(mockHearing as never);
    vi.mocked(hearingsRepository.update).mockResolvedValue({
      ...mockHearing,
      status: "COMPLETED",
    } as never);

    const result = await hearingsService.update(
      "hearing-1",
      { status: "COMPLETED" as never },
      ctx,
    );

    expect(result).toHaveProperty("status", "COMPLETED");
    expect(hearingsRepository.update).toHaveBeenCalledWith(
      "hearing-1",
      "case-1",
      "org-1",
      expect.objectContaining({ status: "COMPLETED" }),
    );
  });
});

describe("hearingsService.delete", () => {
  it("throws hearingNotFound when hearing does not exist", async () => {
    vi.mocked(hearingsRepository.findById).mockResolvedValue(null);

    await expect(hearingsService.delete("bad-id", ctx)).rejects.toThrow(
      Errors.hearingNotFound(),
    );
  });

  it("soft-deletes when hearing exists", async () => {
    vi.mocked(hearingsRepository.findById).mockResolvedValue(mockHearing as never);
    vi.mocked(hearingsRepository.softDelete).mockResolvedValue({ count: 1 });

    await hearingsService.delete("hearing-1", ctx);

    expect(hearingsRepository.softDelete).toHaveBeenCalledWith(
      "hearing-1",
      "case-1",
      "org-1",
    );
  });
});
