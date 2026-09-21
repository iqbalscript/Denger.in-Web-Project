import React from 'react';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  selected?: boolean;
  variant?: 'calm' | 'sand' | 'warm' | 'crisis' | 'outline' | 'cobalt' | 'lime' | 'yellow';
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
    sm: 'px-2.5 py-1 text-xs gap-1 min-h-[44px] sm:min-h-[34px]',
    md: 'px-3.5 py-1.5 text-sm gap-1.5 min-h-[44px] sm:min-h-[40px]',
  };

  const unselectedVariants = {
    calm: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#4169FF]/10',
    sand: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#FFF8EF]',
    warm: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#FF8A3D]/10',
    crisis: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#FF5252]/10',
    outline: 'bg-transparent text-[#151515] border-2 border-[#151515] hover:bg-white',
    cobalt: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#4169FF]/10',
    lime: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#B8F34A]/20',
    yellow: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#FFD84D]/20',
  };

  const selectedClass = 'bg-[#4169FF] text-white border-2 border-[#151515] shadow-[2px_2px_0px_#151515] font-bold';

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-[4px] font-bold transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4169FF] ${
        sizeClasses[size]
      } ${selected ? selectedClass : `${unselectedVariants[variant]} shadow-[2px_2px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515]` } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'calm' | 'sand' | 'warm' | 'crisis' | 'cobalt' | 'lime' | 'yellow';
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
    calm: 'bg-[#4169FF] text-white border-2 border-[#151515]',
    sand: 'bg-white text-[#151515] border-2 border-[#151515]',
    warm: 'bg-[#FF8A3D] text-[#151515] border-2 border-[#151515]',
    crisis: 'bg-[#FF5252] text-white border-2 border-[#151515]',
    cobalt: 'bg-[#4169FF] text-white border-2 border-[#151515]',
    lime: 'bg-[#B8F34A] text-[#151515] border-2 border-[#151515]',
    yellow: 'bg-[#FFD84D] text-[#151515] border-2 border-[#151515]',
  };

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-[4px] shadow-[1px_1px_0px_#151515] ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
