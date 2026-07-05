import { beforeEach, describe, expect, it, vi } from "vitest";

import { Errors } from "@/utils/errors";

import { settingsRepository } from "../repository";
import { settingsService } from "../service";

vi.mock("../repository", () => ({
  settingsRepository: {
    getProfile:         vi.fn(),
    updateProfile:      vi.fn(),
    getOrganization:    vi.fn(),
    updateOrganization: vi.fn(),
  },
}));

const mockProfile = {
  id:          "user-1",
  firstName:   "Rajesh",
  lastName:    "Sharma",
  email:       "rajesh@example.com",
  phoneNumber: "9876543210",
  designation: "ADVOCATE",
  role:        "OWNER",
};

const mockOrg = {
  id:            "org-1",
  name:          "Sharma & Associates",
  city:          "Hyderabad",
  practiceTypes: ["CRIMINAL", "CIVIL"],
};

beforeEach(() => vi.clearAllMocks());

describe("settingsService.getProfile", () => {
  it("throws userNotFound when user does not exist", async () => {
    vi.mocked(settingsRepository.getProfile).mockResolvedValue(null);
    await expect(
      settingsService.getProfile("bad-user", "org-1"),
    ).rejects.toThrow(Errors.userNotFound());
  });

  it("returns profile data when user exists", async () => {
    vi.mocked(settingsRepository.getProfile).mockResolvedValue(mockProfile as never);
    const result = await settingsService.getProfile("user-1", "org-1");
    expect(result).toEqual(mockProfile);
    expect(settingsRepository.getProfile).toHaveBeenCalledWith("user-1", "org-1");
  });
});

describe("settingsService.updateProfile", () => {
  it("updates and returns the profile", async () => {
    const updated = { ...mockProfile, firstName: "Ravi" };
    vi.mocked(settingsRepository.updateProfile).mockResolvedValue(updated as never);
    const body = { firstName: "Ravi", lastName: "Sharma", phoneNumber: "9876543210", designation: "ADVOCATE" as never };
    const result = await settingsService.updateProfile("user-1", "org-1", body);
    expect(result).toEqual(updated);
    expect(settingsRepository.updateProfile).toHaveBeenCalledWith("user-1", "org-1", body);
  });
});

describe("settingsService.getOrganization", () => {
  it("throws organizationNotFound when org does not exist", async () => {
    vi.mocked(settingsRepository.getOrganization).mockResolvedValue(null);
    await expect(
      settingsService.getOrganization("bad-org"),
    ).rejects.toThrow(Errors.organizationNotFound());
  });

  it("returns org data when org exists", async () => {
    vi.mocked(settingsRepository.getOrganization).mockResolvedValue(mockOrg as never);
    const result = await settingsService.getOrganization("org-1");
    expect(result).toEqual(mockOrg);
    expect(settingsRepository.getOrganization).toHaveBeenCalledWith("org-1");
  });
});

describe("settingsService.updateOrganization", () => {
  it("updates and returns the organization", async () => {
    const updated = { ...mockOrg, name: "New Firm Name" };
    vi.mocked(settingsRepository.updateOrganization).mockResolvedValue(updated as never);
    const body = { name: "New Firm Name", city: "Hyderabad", practiceTypes: ["CRIMINAL"] as never };
    const result = await settingsService.updateOrganization("org-1", body);
    expect(result).toEqual(updated);
    expect(settingsRepository.updateOrganization).toHaveBeenCalledWith("org-1", body);
  });
});
