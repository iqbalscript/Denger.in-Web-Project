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
  selected,
  variant = 'sand',
  size = 'md',
  icon,
  className = '',
  type = 'button',
  ...props
}: ChipProps) {
  // Chip adalah tombol pilihan: selalu 44px dan label minimal ~16px.
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5 min-h-[44px]',
    md: 'px-4 py-2 text-base gap-2 min-h-[48px]',
  };

  const unselectedVariants = {
    calm: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#3357EE]/10',
    sand: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#FFF8EF]',
    warm: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#FF8A3D]/10',
    crisis: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#D32F2F]/10',
    outline: 'bg-transparent text-[#151515] border-2 border-[#151515] hover:bg-white',
    cobalt: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#3357EE]/10',
    lime: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#B8F34A]/20',
    yellow: 'bg-white text-[#151515] border-2 border-[#151515] hover:bg-[#FFD84D]/20',
  };

  // Terpilih = cobalt + teks putih + tanda centang, jadi tidak bergantung pada warna saja.
  const selectedClass = 'bg-[#3357EE] text-white border-2 border-[#151515] shadow-[2px_2px_0px_#151515] font-bold';

  const isSelected = selected ?? false;

  return (
    <button
      type={type}
      // Only announce as a toggle when the caller actually drives `selected`.
      aria-pressed={selected === undefined ? undefined : isSelected}
      className={`inline-flex items-center justify-center rounded-[4px] font-bold text-center leading-tight transition-[transform,box-shadow,background-color,color] duration-200 ease-spring active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2 ${
        sizeClasses[size]
      } ${isSelected ? selectedClass : `${unselectedVariants[variant]} shadow-[2px_2px_0px_#151515] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#151515] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#151515]` } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
      {isSelected && (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
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
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const variantClasses = {
    calm: 'bg-[#3357EE] text-white border-2 border-[#151515]',
    sand: 'bg-white text-[#151515] border-2 border-[#151515]',
    warm: 'bg-[#FF8A3D] text-[#151515] border-2 border-[#151515]',
    crisis: 'bg-[#D32F2F] text-white border-2 border-[#151515]',
    cobalt: 'bg-[#3357EE] text-white border-2 border-[#151515]',
    lime: 'bg-[#B8F34A] text-[#151515] border-2 border-[#151515]',
    yellow: 'bg-[#FFD84D] text-[#151515] border-2 border-[#151515]',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-[4px] shadow-[1px_1px_0px_#151515] ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
