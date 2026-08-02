"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Modal } from "@/components/shared/modal";
import { ClientDetails } from "@/components/cases/client/client-details";
import { useCreateClient } from "@/hooks/use-clients";
import type { CreateClientInput, UpdateClientInput } from "@/types/clients";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateClientModal({ open, onClose }: Props) {
  const router = useRouter();
  const createClient = useCreateClient();

  const form = useForm<UpdateClientInput>({
    defaultValues: { fullName: "", phone: "", type: undefined },
  });
  const { handleSubmit, reset, control } = form;

  const fullName = useWatch({ control, name: "fullName" });
  const phone = useWatch({ control, name: "phone" });
  const type = useWatch({ control, name: "type" });

  async function onSubmit(data: UpdateClientInput) {
    if (!data.type) {
      toast.error("Client type is required");
      return;
    }

    const input: CreateClientInput = {
      fullName: data.fullName ?? "",
      phone: data.phone ?? "",
      type: data.type,
      email: data.email,
      address: data.address,
      companyName: data.companyName,
      notes: data.notes,
      preferredLanguage: data.preferredLanguage,
      relationType: data.relationType,
      relationName: data.relationName,
      dateOfBirth: data.dateOfBirth,
      occupation: data.occupation,
    };

    const result = await createClient.mutateAsync(input);
    reset();
    onClose();
    router.push(`/clients/${result.id}`);
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Client"
      size="lg"
      onSave={handleSubmit(onSubmit)}
      saveLabel="Add Client"
      saveLoading={createClient.isPending}
      saveDisabled={!fullName?.trim() || !phone?.trim() || !type}
    >
      <div className="p-5">
        <FormProvider {...form}>
          <ClientDetails />
        </FormProvider>
      </div>
    </Modal>
  );
}
