import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-[#151515]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2.5 bg-white border-2 rounded-[4px] text-sm font-medium text-[#151515] placeholder:text-[#8A857D] 
            transition-all duration-120 min-h-[44px]
            focus:outline-none focus:shadow-[3px_3px_0px_#4169FF]
            ${error ? 'border-[#FF5252] shadow-[2px_2px_0px_#FF5252]' : 'border-[#151515] shadow-[2px_2px_0px_#151515]'}
            disabled:bg-[#D8D3C9]/40 disabled:text-[#8A857D] disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[#FF5252] font-bold">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#59544D]">{helperText}</p>
        ) : null}
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
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-[#151515]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`w-full px-3.5 py-2.5 bg-white border-2 rounded-[4px] text-sm font-medium text-[#151515] placeholder:text-[#8A857D] 
            transition-all duration-120
            focus:outline-none focus:shadow-[3px_3px_0px_#4169FF]
            ${error ? 'border-[#FF5252] shadow-[2px_2px_0px_#FF5252]' : 'border-[#151515] shadow-[2px_2px_0px_#151515]'}
            disabled:bg-[#D8D3C9]/40 disabled:text-[#8A857D] disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[#FF5252] font-bold">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#59544D]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
