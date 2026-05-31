"use client";

import { useState, useCallback } from "react";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { CreateCaseModal } from "@/components/ui/modals/create-case";

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  usePageTitle({
    title: "Dashboard",
    action: { label: "Add New Case", onClick: openModal },
  });

  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-secondary text-sm">Dashboard — coming soon.</p>
      </div>
      <CreateCaseModal open={modalOpen} onClose={closeModal} />
    </>
  );
}
