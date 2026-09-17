import React from 'react';

interface SoftCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'white' | 'sand' | 'tinted' | 'crisis';
  elevation?: 'flat' | 'low' | 'medium';
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
    white: 'bg-white border-sand-200 text-sand-900',
    sand: 'bg-sand-50 border-sand-200 text-sand-900',
    tinted: 'bg-calm-50/80 border-calm-200/80 text-calm-950',
    crisis: 'bg-red-50/90 border-red-200 text-red-950',
  };

  const elevationClasses = {
    flat: 'shadow-none',
    low: 'shadow-soft-xs',
    medium: 'shadow-soft-sm',
  };

  const hoverClass = hoverEffect
    ? 'transition-all duration-200 hover:shadow-soft-md hover:border-sand-300'
    : 'transition-colors';

  return (
    <div
      className={`rounded-2xl border ${variantClasses[variant]} ${elevationClasses[elevation]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
