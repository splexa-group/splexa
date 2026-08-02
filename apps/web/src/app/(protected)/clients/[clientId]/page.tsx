import { use } from "react";
import { ClientDetailView } from "@/components/clients/client-detail-view";

export default function Page({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  return <ClientDetailView clientId={clientId} />;
}
