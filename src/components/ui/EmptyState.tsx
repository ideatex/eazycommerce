import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "📦",
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div className={`p-12 text-center bg-white rounded-2xl border border-gray-3 shadow-xs ${className}`}>
      <div className="text-4xl mb-4 flex items-center justify-center">
        {typeof icon === "string" ? <span>{icon}</span> : icon}
      </div>
      <h3 className="text-lg font-bold text-dark mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
