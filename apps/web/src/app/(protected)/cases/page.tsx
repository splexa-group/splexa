"use client";

import { useState, useCallback } from "react";
import { usePageTitle } from "@/components/layout/top/top-bar-context";
import { CaseList } from "@/components/cases/list/case-list";
import { CreateCaseModal } from "@/components/cases/create-case-modal";

export default function CasesPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  usePageTitle({
    title: "Cases",
    action: { label: "Add Case", onClick: openModal },
  });

  return (
    <>
      <CaseList onAdd={openModal} />
      <CreateCaseModal open={modalOpen} onClose={closeModal} />
    </>
  );
}
