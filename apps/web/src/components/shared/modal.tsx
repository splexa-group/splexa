"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/utils/tailwind";
import { Button } from "@/components/ui/button";

type ModalSize = "sm" | "md" | "lg" | "xl" | "xxl";

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  xxl: "max-w-2xl",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: ModalSize;
  className?: string;
  // Footer actions
  onSave?: () => void;
  saveLabel?: string;
  saveLoading?: boolean;
  saveDisabled?: boolean;
  onDelete?: () => void;
  deleteLabel?: string;
  deleteLoading?: boolean;
  deleteDisabled?: boolean;
  cancelLabel?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "lg",
  className,
  onSave,
  saveLabel = "Save",
  saveLoading,
  saveDisabled,
  onDelete,
  deleteLabel = "Delete",
  deleteLoading,
  deleteDisabled,
  cancelLabel = "Cancel",
}: ModalProps) {
  const showFooter = !!(onSave || onDelete);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full bg-card rounded shadow-xl border border-line",
            SIZE_CLASS[size],
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            className,
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <Dialog.Title className="text-base font-semibold text-dark">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="secondarySoft" size="icon" aria-label="Close">
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Body */}
          {children}

          {/* Footer */}
          {showFooter && (
            <div className="flex items-center gap-2 px-5 py-4 border-t border-line">
              {onDelete && (
                <Button
                  type="button"
                  variant="negative"
                  loading={deleteLoading}
                  disabled={deleteDisabled}
                  onClick={onDelete}
                >
                  {deleteLabel}
                </Button>
              )}
              <div className="flex-1" />
              <Button type="button" variant="secondary" onClick={onClose}>
                {cancelLabel}
              </Button>
              {onSave && (
                <Button
                  type="button"
                  loading={saveLoading}
                  disabled={saveDisabled}
                  onClick={onSave}
                >
                  {saveLabel}
                </Button>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
