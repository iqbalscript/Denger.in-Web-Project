import React from 'react';
import Link from 'next/link';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'crisis' | 'calm-subtle' | 'cobalt' | 'lime';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  href?: string;
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
      href,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-bold rounded-[4px] border-2 border-[#151515] transition-all duration-120 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4169FF] focus-visible:ring-offset-2';

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs min-h-[44px] sm:min-h-[40px] gap-1.5',
      md: 'px-4 py-2 text-sm min-h-[44px] gap-2',
      lg: 'px-6 py-3 text-base min-h-[48px] gap-2.5',
    };

    const variantClasses = {
      primary:
        'bg-[#B8F34A] text-[#151515] shadow-[3px_3px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#151515]',
      secondary:
        'bg-[#FFFFFF] text-[#151515] shadow-[3px_3px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#151515]',
      cobalt:
        'bg-[#4169FF] text-white shadow-[3px_3px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#151515]',
      lime:
        'bg-[#B8F34A] text-[#151515] shadow-[3px_3px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#151515]',
      'calm-subtle':
        'bg-[#FFF8EF] text-[#151515] shadow-[2px_2px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515]',
      outline:
        'bg-transparent text-[#151515] shadow-[2px_2px_0px_#151515] hover:bg-[#FFFFFF] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515]',
      ghost:
        'border-transparent shadow-none hover:bg-[#151515]/5 active:bg-[#151515]/10 text-[#151515]',
      crisis:
        'bg-[#FF5252] text-white shadow-[3px_3px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#151515]',
    };

    const widthClass = fullWidth ? 'w-full' : '';
    const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`;

    const content = (
      <>
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        <span>{children}</span>
      </>
    );

    if (href && !disabled && !isLoading) {
      return (
        <Link href={href} className={combinedClasses} aria-label={props['aria-label']}>
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={combinedClasses}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
