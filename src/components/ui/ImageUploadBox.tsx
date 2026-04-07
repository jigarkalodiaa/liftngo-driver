"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { CameraIcon } from "@/components/icons";

type ImageUploadBoxProps = {
  label: string;
  preview: string | null;
  error?: string | null;
  onFileSelect: (file: File, preview: string) => void;
};

const MAX_SIZE = 5 * 1024 * 1024;

export default function ImageUploadBox({
  label,
  preview,
  error,
  onFileSelect,
}: ImageUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > MAX_SIZE) {
        toast.error("File must be under 5 MB.");
        return;
      }
      onFileSelect(file, URL.createObjectURL(file));
      e.target.value = "";
    },
    [onFileSelect],
  );

  const borderColor = preview
    ? "border-[var(--color-success)]"
    : error
      ? "border-[var(--color-error)]"
      : "border-[var(--color-gray-300)]";

  return (
    <div className="flex-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={[
          "flex w-full flex-col items-center justify-center gap-2.5",
          "rounded-2xl border-2 border-dashed bg-white",
          "px-4 py-6 transition-colors hover:bg-[var(--color-gray-50)]",
          borderColor,
        ].join(" ")}
        style={{ minHeight: 100 }}
      >
        {preview ? (
          <Image
            src={preview}
            alt={label}
            width={56}
            height={42}
            className="rounded-lg object-cover"
          />
        ) : (
          <span className="text-[var(--color-gray-400)]">
            <CameraIcon />
          </span>
        )}
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
          {label}
        </span>
      </button>
    </div>
  );
}
