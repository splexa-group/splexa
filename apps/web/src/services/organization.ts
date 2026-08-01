import { GET, PATCH } from "@/api/http";
import type {
  OrganizationData,
  ProfileData,
  UpdateOrganizationInput,
  UpdateProfileInput,
} from "@/types/organization";

export const organizationApi = {
  get: () =>
    GET<{ organization: OrganizationData }>("/organization").then((r) => r.organization),
  update: (data: UpdateOrganizationInput) =>
    PATCH<{ organization: OrganizationData }>("/organization", data).then(
      (r) => r.organization,
    ),
  getProfile: () =>
    GET<{ profile: ProfileData }>("/organization/profile").then((r) => r.profile),
  updateProfile: (data: UpdateProfileInput) =>
    PATCH<{ profile: ProfileData }>("/organization/profile", data).then((r) => r.profile),
};
