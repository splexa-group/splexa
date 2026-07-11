import { GET, PATCH } from "@/api/http";
import type {
  OrganizationData,
  ProfileData,
  UpdateOrganizationInput,
  UpdateProfileInput,
} from "@/types/settings";

export const settingsApi = {
  getProfile: () =>
    GET<{ profile: ProfileData }>("/settings/profile").then((r) => r.profile),
  updateProfile: (data: UpdateProfileInput) =>
    PATCH<{ profile: ProfileData }>("/settings/profile", data).then((r) => r.profile),
  getOrganization: () =>
    GET<{ organization: OrganizationData }>("/settings/organization").then(
      (r) => r.organization,
    ),
  updateOrganization: (data: UpdateOrganizationInput) =>
    PATCH<{ organization: OrganizationData }>("/settings/organization", data).then(
      (r) => r.organization,
    ),
};
