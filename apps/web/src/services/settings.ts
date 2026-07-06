import { GET, PATCH } from "@/api/http";
import type {
  OrganizationData,
  ProfileData,
  UpdateOrganizationInput,
  UpdateProfileInput,
} from "@/types/settings";

export const settingsApi = {
  getProfile:         () => GET<ProfileData>("/settings/profile"),
  updateProfile:      (data: UpdateProfileInput) => PATCH<ProfileData>("/settings/profile", data),
  getOrganization:    () => GET<OrganizationData>("/settings/organization"),
  updateOrganization: (data: UpdateOrganizationInput) => PATCH<OrganizationData>("/settings/organization", data),
};
