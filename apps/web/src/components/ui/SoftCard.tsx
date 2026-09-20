import React from 'react';

export interface SoftCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'white' | 'sand' | 'tinted' | 'crisis';
  elevation?: 'flat' | 'low' | 'medium' | 'high';
  hoverEffect?: boolean;
}

export function SoftCard({
  children,
  className = '',
  variant = 'white',
  elevation = 'low',
  hoverEffect = false,
  ...props
}: SoftCardProps) {
  const variantClasses = {
    white: 'bg-white border-2 border-[#151515] text-[#151515]',
    sand: 'bg-[#FFF8EF] border-2 border-[#151515] text-[#151515]',
    tinted: 'bg-[#FFF8EF] border-2 border-[#151515] text-[#151515]',
    crisis: 'bg-[#FFEBEB] border-2 border-[#151515] text-[#151515]',
  };

  const elevationClasses = {
    flat: 'shadow-none',
    low: 'shadow-[2px_2px_0px_#151515]',
    medium: 'shadow-[3px_3px_0px_#151515]',
    high: 'shadow-[4px_4px_0px_#151515]',
  };

  const hoverClass = hoverEffect
    ? 'transition-all duration-120 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_#151515]'
    : '';

  return (
    <div
      className={`rounded-[6px] ${variantClasses[variant]} ${elevationClasses[elevation]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
