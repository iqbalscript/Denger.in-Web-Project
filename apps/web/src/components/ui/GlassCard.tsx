import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
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
    none: 'bg-white/70 border-white/70',
    calm: 'bg-calm-50/70 border-calm-200/50',
    warm: 'bg-warm-50/70 border-sand-200/60',
  };

  const hoverClass = hoverEffect
    ? 'transition-all duration-200 hover:shadow-soft-lg hover:-translate-y-0.5'
    : '';

  return (
    <div
      className={`backdrop-blur-md rounded-2xl sm:rounded-3xl border shadow-glass ${tintClasses[tint]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
