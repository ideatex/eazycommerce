"use client";

import React, { useEffect, useId } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

const SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" };

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  footer,
  children,
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-neutral-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full ${SIZES[size]} max-h-[92vh] flex flex-col bg-white rounded-t-xl sm:rounded-xl shadow-xl border border-neutral-200`}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-neutral-100">
          <div className="min-w-0">
            <h2 id={titleId} className="text-sm font-semibold text-neutral-900">
              {title}
            </h2>
            {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 -m-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto min-h-0">{children}</div>
        {footer && (
          <div className="p-4 border-t border-neutral-100 bg-neutral-50/60 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
