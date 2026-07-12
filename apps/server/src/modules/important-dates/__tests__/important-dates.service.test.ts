import { describe, it, expect, vi, beforeEach } from "vitest";

import { casesRepository } from "@/modules/cases/cases.repository";
import { Errors } from "@/utils/errors";

import { importantDatesRepository } from "../important-dates.repository";
import { importantDatesService } from "../important-dates.service";

vi.mock("../important-dates.repository", () => ({
  importantDatesRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
}));

vi.mock("@/modules/cases/cases.repository", () => ({
  casesRepository: { findById: vi.fn() },
}));

const ctx = { orgId: "org-1", userId: "user-1", ipAddress: "127.0.0.1" };
const mockCase = { id: "case-1", orgId: "org-1", assignedTo: null, createdBy: "user-1" };
const mockDate = { id: "date-1", caseId: "case-1", orgId: "org-1", dateType: "LIMITATION", date: new Date() };

beforeEach(() => vi.clearAllMocks());

describe("importantDatesService.create", () => {
  it("throws caseNotFound when case does not exist", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(null);
    await expect(
      importantDatesService.create("bad-id", { dateType: "LIMITATION" as never, date: new Date().toISOString() }, ctx),
    ).rejects.toThrow(Errors.caseNotFound());
  });

  it("creates important date when case exists", async () => {
    vi.mocked(casesRepository.findById).mockResolvedValue(mockCase as never);
    vi.mocked(importantDatesRepository.create).mockResolvedValue(mockDate as never);

    const result = await importantDatesService.create(
      "case-1",
      { dateType: "LIMITATION" as never, date: new Date().toISOString() },
      ctx,
    );

    expect(result).toEqual(mockDate);
    expect(importantDatesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ caseId: "case-1", orgId: "org-1", notifyUserId: "user-1" }),
    );
  });
});

describe("importantDatesService.update", () => {
  it("throws importantDateNotFound when date does not exist", async () => {
    vi.mocked(importantDatesRepository.findById).mockResolvedValue(null);
    await expect(
      importantDatesService.update("case-1", "bad-id", {}, ctx),
    ).rejects.toThrow(Errors.importantDateNotFound());
  });
});

describe("importantDatesService.delete", () => {
  it("throws importantDateNotFound when date does not exist", async () => {
    vi.mocked(importantDatesRepository.findById).mockResolvedValue(null);
    await expect(
      importantDatesService.delete("case-1", "bad-id", ctx),
    ).rejects.toThrow(Errors.importantDateNotFound());
  });

  it("soft-deletes when date exists", async () => {
    vi.mocked(importantDatesRepository.findById).mockResolvedValue(mockDate as never);
    vi.mocked(importantDatesRepository.softDelete).mockResolvedValue({ count: 1 } as never);
    await importantDatesService.delete("case-1", "date-1", ctx);
    expect(importantDatesRepository.softDelete).toHaveBeenCalledWith("date-1", "org-1");
  });
});
