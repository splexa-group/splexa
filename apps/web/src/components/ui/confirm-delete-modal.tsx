"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  entityName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ConfirmDeleteModal({
  open,
  title,
  entityName,
  onConfirm,
  onCancel,
  isPending = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={`Delete this ${title}?`}>
      <div className="p-5 space-y-3">
        <div className="w-10 h-10 rounded-lg bg-negative-muted flex items-center justify-center">
          <Trash2 className="size-5 text-negative" />
        </div>
        <p className="text-sm text-secondary leading-relaxed">
          You are about to permanently delete{" "}
          <span className="font-semibold text-dark">{entityName}</span> and all its
          associated data.
        </p>
        <p className="text-xs font-semibold text-negative">
          ⚠ This cannot be undone.
        </p>
      </div>
      <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="negative"
          size="sm"
          onClick={onConfirm}
          loading={isPending}
        >
          Yes, delete {title}
        </Button>
      </div>
    </Modal>
  );
}
