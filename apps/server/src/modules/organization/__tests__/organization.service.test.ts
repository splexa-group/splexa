import { Designation, FirmType, PracticeType, States } from "@splexa-group/shared/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Errors } from "@/utils/errors";

import { organizationRepository } from "../organization.repository";
import { organizationService } from "../organization.service";

vi.mock("../organization.repository", () => ({
  organizationRepository: {
    get:           vi.fn(),
    update:        vi.fn(),
    getProfile:    vi.fn(),
    updateProfile: vi.fn(),
    findUserById:  vi.fn(),
  },
}));

const mockOrg = {
  id: "org-1",
  name: "Sharma & Associates",
  city: "Hyderabad",
  state: States.TELANGANA,
  firmType: FirmType.FIRM,
  practiceTypes: [PracticeType.CRIMINAL, PracticeType.CIVIL],
};

const mockProfile = {
  id:          "user-1",
  firstName:   "Rajesh",
  lastName:    "Sharma",
  email:       "rajesh@example.com",
  phoneNumber: "9876543210",
  designation: Designation.ADVOCATE,
  role:        "OWNER",
};

beforeEach(() => vi.clearAllMocks());

describe("organizationService.get", () => {
  it("throws organizationNotFound when org does not exist", async () => {
    vi.mocked(organizationRepository.get).mockResolvedValue(null);
    await expect(organizationService.get("bad-org")).rejects.toThrow(
      Errors.organizationNotFound(),
    );
  });

  it("returns org data when org exists", async () => {
    vi.mocked(organizationRepository.get).mockResolvedValue(mockOrg as never);
    const result = await organizationService.get("org-1");
    expect(result).toEqual(mockOrg);
    expect(organizationRepository.get).toHaveBeenCalledWith("org-1");
  });
});

describe("organizationService.update", () => {
  it("throws organizationNotFound when org does not exist", async () => {
    vi.mocked(organizationRepository.get).mockResolvedValue(null);
    const body = {
      name: "New Firm Name",
      city: "Hyderabad",
      state: States.TELANGANA,
      firmType: FirmType.FIRM,
      practiceTypes: [PracticeType.CRIMINAL],
    };
    await expect(organizationService.update("bad-org", body)).rejects.toThrow(
      Errors.organizationNotFound(),
    );
    expect(organizationRepository.update).not.toHaveBeenCalled();
  });

  it("updates and returns the organization", async () => {
    const updated = { ...mockOrg, name: "New Firm Name" };
    vi.mocked(organizationRepository.get).mockResolvedValue(mockOrg as never);
    vi.mocked(organizationRepository.update).mockResolvedValue(updated as never);
    const body = {
      name: "New Firm Name",
      city: "Hyderabad",
      state: States.TELANGANA,
      firmType: FirmType.FIRM,
      practiceTypes: [PracticeType.CRIMINAL],
    };
    const result = await organizationService.update("org-1", body);
    expect(result).toEqual(updated);
    expect(organizationRepository.update).toHaveBeenCalledWith("org-1", body);
  });
});

describe("organizationService.getProfile", () => {
  it("throws userNotFound when user does not exist", async () => {
    vi.mocked(organizationRepository.getProfile).mockResolvedValue(null);
    await expect(
      organizationService.getProfile("bad-user", "org-1"),
    ).rejects.toThrow(Errors.userNotFound());
  });

  it("returns profile data when user exists", async () => {
    vi.mocked(organizationRepository.getProfile).mockResolvedValue(mockProfile as never);
    const result = await organizationService.getProfile("user-1", "org-1");
    expect(result).toEqual(mockProfile);
    expect(organizationRepository.getProfile).toHaveBeenCalledWith("user-1", "org-1");
  });
});

describe("organizationService.updateProfile", () => {
  it("throws userNotFound when user does not exist", async () => {
    vi.mocked(organizationRepository.getProfile).mockResolvedValue(null);
    const body = { firstName: "Ravi", lastName: "Sharma", phoneNumber: "9876543210", designation: Designation.ADVOCATE };
    await expect(
      organizationService.updateProfile("bad-user", "org-1", body),
    ).rejects.toThrow(Errors.userNotFound());
    expect(organizationRepository.updateProfile).not.toHaveBeenCalled();
  });

  it("updates and returns the profile", async () => {
    const updated = { ...mockProfile, firstName: "Ravi" };
    vi.mocked(organizationRepository.getProfile).mockResolvedValue(mockProfile as never);
    vi.mocked(organizationRepository.updateProfile).mockResolvedValue(updated as never);
    const body = { firstName: "Ravi", lastName: "Sharma", phoneNumber: "9876543210", designation: Designation.ADVOCATE };
    const result = await organizationService.updateProfile("user-1", "org-1", body);
    expect(result).toEqual(updated);
    expect(organizationRepository.updateProfile).toHaveBeenCalledWith("user-1", "org-1", body);
  });
});
