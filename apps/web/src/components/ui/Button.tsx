import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'crisis' | 'calm-subtle';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      disabled = false,
      icon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const sizeClasses = {
      sm: 'px-3.5 py-1.5 text-xs min-h-[38px] gap-1.5',
      md: 'px-4 py-2.5 text-sm min-h-[44px] gap-2',
      lg: 'px-6 py-3.5 text-base min-h-[48px] gap-2.5 rounded-2xl',
    };

    const variantClasses = {
      primary:
        'bg-calm-700 text-white hover:bg-calm-800 focus-visible:outline-calm-700 shadow-soft-xs border border-transparent',
      secondary:
        'bg-sand-100 text-sand-900 hover:bg-sand-200 focus-visible:outline-sand-700 border border-sand-200/80 shadow-soft-xs',
      'calm-subtle':
        'bg-calm-100 text-calm-900 hover:bg-calm-200 focus-visible:outline-calm-700 border border-calm-200/80',
      outline:
        'border border-sand-300 text-sand-800 hover:bg-sand-50 hover:border-sand-400 focus-visible:outline-calm-700',
      ghost:
        'text-sand-800 hover:bg-sand-100/70 hover:text-calm-900 focus-visible:outline-calm-700',
      crisis:
        'bg-crisis text-white hover:bg-crisis-dark focus-visible:outline-crisis shadow-soft-xs border border-transparent',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
