import React from 'react';
import Link from 'next/link';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'crisis' | 'calm-subtle' | 'cobalt' | 'lime';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  /** 'end' seats the icon in its own small key that nudges forward on hover (for "next"/arrow CTAs). */
  iconPosition?: 'start' | 'end';
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
      iconPosition = 'start',
      type = 'button',
      href,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'group inline-flex items-center justify-center text-center font-bold leading-tight rounded-[4px] border-2 border-[#151515] transition-[transform,box-shadow,background-color,color] duration-200 ease-spring select-none disabled:transform-none disabled:shadow-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2';

    // Semua ukuran memenuhi area sentuh 44px; label tidak pernah lebih kecil dari ~16px.
    const sizeClasses = {
      sm: 'px-3.5 py-2 text-sm min-h-[44px] gap-2',
      md: 'px-5 py-2.5 text-base min-h-[48px] gap-2',
      lg: 'px-6 py-3 text-lg min-h-[52px] gap-2.5',
    };

    const variantClasses = {
      primary:
        'bg-[#B8F34A] text-[#151515] shadow-[3px_3px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#151515]',
      secondary:
        'bg-[#FFFFFF] text-[#151515] shadow-[3px_3px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#151515]',
      cobalt:
        'bg-[#3357EE] text-white shadow-[3px_3px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#151515]',
      lime:
        'bg-[#B8F34A] text-[#151515] shadow-[3px_3px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#151515]',
      'calm-subtle':
        'bg-[#FFF8EF] text-[#151515] shadow-[2px_2px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515]',
      outline:
        'bg-transparent text-[#151515] shadow-[2px_2px_0px_#151515] hover:bg-[#FFFFFF] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515]',
      ghost:
        'border-transparent shadow-none hover:bg-[#151515]/5 active:bg-[#151515]/10 text-[#151515]',
      crisis:
        'bg-[#D32F2F] text-white hover:bg-[#B3261E] shadow-[3px_3px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#151515]',
    };

    // PRD-DESIGN.md §12.2 disabled look; a loading button keeps its colour and just waits.
    const stateClass = isLoading
      ? 'cursor-wait'
      : 'disabled:bg-[#D8D3C9] disabled:text-[#7A756D] disabled:border-[#7A756D] disabled:cursor-not-allowed';
    const widthClass = fullWidth ? 'w-full' : '';
    const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${stateClass} ${widthClass} ${className}`;

    const spinner = (
      <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
    );

    const content =
      iconPosition === 'end' ? (
        <>
          <span>{children}</span>
          {isLoading
            ? spinner
            : icon && (
                <span
                  className="shrink-0 -mr-2 inline-flex items-center justify-center w-7 h-7 rounded-[3px] border-2 border-current transition-transform duration-400 ease-spring group-hover:translate-x-0.5 group-active:translate-x-0"
                  aria-hidden="true"
                >
                  {icon}
                </span>
              )}
        </>
      ) : (
        <>
          {isLoading ? spinner : icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
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
        aria-busy={isLoading || undefined}
        className={combinedClasses}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
