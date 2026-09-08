import React from "react";

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-dark uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm text-dark bg-white transition focus:outline-none focus:ring-2 focus:ring-blue/20 placeholder:text-gray-400 ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-gray-3 focus:border-blue"
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-gray-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = "FormField";
