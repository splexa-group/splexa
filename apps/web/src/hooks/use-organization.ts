import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { organizationApi } from "@/services/organization";
import type { UpdateOrganizationInput, UpdateProfileInput } from "@/types/organization";

export const organizationKeys = {
  detail: () => ["organization"] as const,
  profile: () => ["organization", "profile"] as const,
};

export function useOrganization() {
  return useQuery({
    queryKey: organizationKeys.detail(),
    queryFn: () => organizationApi.get(),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOrganizationInput) => organizationApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.detail() });
      toast.success("Settings saved successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update firm details"),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: organizationKeys.profile(),
    queryFn: () => organizationApi.getProfile(),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileInput) => organizationApi.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: organizationKeys.profile() });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update profile"),
  });
}
