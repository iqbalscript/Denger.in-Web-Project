import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  tint?: 'none' | 'calm' | 'warm';
  hoverEffect?: boolean;
}

export function GlassCard({
  children,
  className = '',
  tint = 'none',
  hoverEffect = false,
  ...props
}: GlassCardProps) {
  const tintClasses = {
    none: 'bg-white border-2 border-[#151515] shadow-[3px_3px_0px_#151515]',
    calm: 'bg-white border-2 border-[#151515] shadow-[3px_3px_0px_#4169FF]',
    warm: 'bg-white border-2 border-[#151515] shadow-[3px_3px_0px_#FF8A3D]',
  };

  const hoverClass = hoverEffect
    ? 'transition-all duration-120 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515]'
    : '';

  return (
    <div
      className={`rounded-[6px] ${tintClasses[tint]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
