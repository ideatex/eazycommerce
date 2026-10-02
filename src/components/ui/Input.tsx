import React, { useId } from "react";

const FIELD =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold text-neutral-700 block mb-1">
      {children}
    </label>
  );
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  description?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, description, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id || autoId;
    return (
      <div>
        {label && <Label htmlFor={fieldId}>{label}</Label>}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={fieldId}
            className={`${FIELD} ${leftIcon ? "pl-9" : ""} ${rightIcon ? "pr-9" : ""} ${className}`}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </span>
          )}
        </div>
        {description && <p className="text-[11px] text-neutral-400 mt-1">{description}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, description, className = "", id, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id || autoId;
    return (
      <div>
        {label && <Label htmlFor={fieldId}>{label}</Label>}
        <textarea ref={ref} id={fieldId} className={`${FIELD} ${className}`} {...props} />
        {description && <p className="text-[11px] text-neutral-400 mt-1">{description}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  options?: Array<{ label: string; value: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, description, options, className = "", id, children, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id || autoId;
    return (
      <div>
        {label && <Label htmlFor={fieldId}>{label}</Label>}
        <select ref={ref} id={fieldId} className={`${FIELD} ${className}`} {...props}>
          {options
            ? options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))
            : children}
        </select>
        {description && <p className="text-[11px] text-neutral-400 mt-1">{description}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
