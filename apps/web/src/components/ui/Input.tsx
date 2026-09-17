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
          <label htmlFor={inputId} className="block text-xs font-semibold text-sand-800 tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-sand-900 placeholder:text-sand-400 
            transition-colors duration-150 min-h-[44px]
            focus:outline-none focus:ring-2 focus:ring-calm-700/30 focus:border-calm-700
            ${error ? 'border-crisis focus:border-crisis focus:ring-crisis/20' : 'border-sand-200 hover:border-sand-300'}
            disabled:bg-sand-50 disabled:text-sand-400 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-crisis font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-sand-700">{helperText}</p>
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
          <label htmlFor={inputId} className="block text-xs font-semibold text-sand-800 tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-sand-900 placeholder:text-sand-400 
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-calm-700/30 focus:border-calm-700
            ${error ? 'border-crisis focus:border-crisis focus:ring-crisis/20' : 'border-sand-200 hover:border-sand-300'}
            disabled:bg-sand-50 disabled:text-sand-400 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-crisis font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-sand-700">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
