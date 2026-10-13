import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

// PRD-DESIGN.md §13: teks >= 16px (tanpa zoom iOS), padding 14px 16px, label tebal statis di atas.
const fieldBaseClasses =
  'w-full px-4 py-3.5 bg-white border-2 rounded-[4px] text-base font-medium text-[#151515] placeholder:text-[#6B665E] transition-all duration-120 focus:outline-none focus:shadow-[3px_3px_0px_#3357EE] focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2 disabled:bg-[#D8D3C9]/40 disabled:text-[#7A756D] disabled:border-[#7A756D] disabled:shadow-none disabled:cursor-not-allowed';

// Label kalimat biasa (bukan huruf kapital semua) supaya lebih mudah dibaca.
const labelClasses = 'block text-base font-bold text-[#151515] leading-snug';

function fieldStateClasses(error?: string) {
  return error
    ? 'border-[#FF5252] shadow-[2px_2px_0px_#FF5252]'
    : 'border-[#151515] shadow-[2px_2px_0px_#151515]';
}

function FieldMessage({ id, error, helperText }: { id?: string; error?: string; helperText?: string }) {
  if (error) {
    return (
      <p id={id} role="alert" className="text-sm text-[#B3261E] font-bold leading-snug">
        {error}
      </p>
    );
  }
  if (helperText) {
    return (
      <p id={id} className="text-sm text-[#59544D]">
        {helperText}
      </p>
    );
  }
  return null;
}

function describedBy(messageId: string | undefined, hasMessage: boolean, existing?: string) {
  const ids = [existing, hasMessage ? messageId : undefined].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, id, className = '', ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
    const messageId = `${inputId}-pesan`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={describedBy(messageId, Boolean(error || helperText), props['aria-describedby'])}
          className={`${fieldBaseClasses} min-h-[52px] ${fieldStateClasses(error)} ${className}`}
        />
        <FieldMessage id={messageId} error={error} helperText={helperText} />
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, id, className = '', rows = 4, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
    const messageId = `${inputId}-pesan`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          {...props}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={describedBy(messageId, Boolean(error || helperText), props['aria-describedby'])}
          className={`${fieldBaseClasses} leading-[1.6] ${fieldStateClasses(error)} ${className}`}
        />
        <FieldMessage id={messageId} error={error} helperText={helperText} />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
