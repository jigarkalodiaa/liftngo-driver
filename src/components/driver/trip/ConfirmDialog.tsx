"use client";

import { useLocale } from "@/context/LocaleContext";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useLocale();
  if (!open) return null;

  const cancelText = cancelLabel ?? t("common.cancel");
  const confirmText = confirmLabel ?? t("common.confirm");

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:opacity-95"
      : "bg-[var(--color-primary)] text-white hover:opacity-95";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 id="confirm-title" className="text-lg font-bold text-[var(--color-text-primary)]">
          {title}
        </h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {description}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-[var(--color-gray-300)] py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-gray-50)] disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl py-3 text-sm font-bold disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? t("confirmDialog.pleaseWait") : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
