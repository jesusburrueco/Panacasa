"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { uploadProductImage, type ProductImageVariant } from "@/lib/supabase/storage";

export function ImageUploadField({
  name,
  label,
  variant,
  getSlugBase,
  defaultValue,
}: {
  name: string;
  label: string;
  variant: ProductImageVariant;
  getSlugBase: () => string;
  defaultValue?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(defaultValue ?? null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;

    setError(null);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setIsUploading(true);

    const result = await uploadProductImage(file, getSlugBase(), variant);

    setIsUploading(false);
    URL.revokeObjectURL(localPreview);

    if (!result.ok) {
      setError(result.error);
      setPreview(url || null);
      return;
    }

    setUrl(result.url);
    setPreview(result.url);
  }

  return (
    <div className="space-y-2">
      <span className="font-sans text-label-md text-on-surface-variant">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative flex h-40 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-outline-variant bg-surface transition-colors hover:border-primary",
          isDragging && "border-primary bg-primary-fixed/40"
        )}
      >
        {preview ? (
          // Preview local (blob:) o de storage: se evita next/image para no
          // depender de configurar remotePatterns para URLs blob temporales.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <>
            <span className="material-symbols-outlined text-3xl text-outline">
              add_photo_alternate
            </span>
            <span className="px-4 text-center font-sans text-label-sm text-on-surface-variant">
              Arrastra una imagen o haz click para seleccionar
            </span>
          </>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="font-sans text-label-sm text-white">Subiendo...</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="font-sans text-label-sm text-error">{error}</p>}
    </div>
  );
}
