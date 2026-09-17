import React from 'react';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  selected?: boolean;
  variant?: 'calm' | 'sand' | 'warm' | 'crisis' | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export function Chip({
  children,
  selected = false,
  variant = 'sand',
  size = 'md',
  icon,
  className = '',
  type = 'button',
  ...props
}: ChipProps) {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1 min-h-[30px]',
    md: 'px-3.5 py-1.5 text-sm gap-1.5 min-h-[36px]',
  };

  const unselectedVariants = {
    calm: 'bg-calm-100 text-calm-800 border-calm-200/80 hover:bg-calm-200',
    sand: 'bg-sand-100 text-sand-800 border-sand-200 hover:bg-sand-200 hover:border-sand-300',
    warm: 'bg-warm-100 text-warm-700 border-sand-200 hover:bg-warm-50',
    crisis: 'bg-red-50 text-crisis-dark border-red-200 hover:bg-red-100',
    outline: 'bg-transparent text-sand-800 border-sand-300 hover:bg-sand-50',
  };

  const selectedClass = 'bg-calm-700 text-white border-calm-800 shadow-soft-xs font-semibold';

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-full border font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-calm-700 ${
        sizeClasses[size]
      } ${selected ? selectedClass : unselectedVariants[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'calm' | 'sand' | 'warm' | 'crisis';
  size?: 'sm' | 'md';
}

export function Badge({
  children,
  variant = 'calm',
  size = 'sm',
  className = '',
  ...props
}: BadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantClasses = {
    calm: 'bg-calm-100 text-calm-800 border-calm-200/70',
    sand: 'bg-sand-100 text-sand-800 border-sand-200',
    warm: 'bg-warm-100 text-warm-700 border-warm-200/70',
    crisis: 'bg-red-100 text-crisis-dark border-red-200',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
