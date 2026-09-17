import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 - 100
  max?: number;
  label?: string;
  stepIndicator?: string;
  className?: string;
  variant?: 'calm' | 'warm' | 'crisis';
}

export function ProgressBar({
  value,
  max = 100,
  label,
  stepIndicator,
  className = '',
  variant = 'calm',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantColors = {
    calm: 'bg-calm-600',
    warm: 'bg-warm-500',
    crisis: 'bg-crisis',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || stepIndicator) && (
        <div className="flex items-center justify-between text-xs font-medium text-sand-800">
          {label && <span>{label}</span>}
          {stepIndicator && <span className="text-calm-800 font-semibold">{stepIndicator}</span>}
        </div>
      )}
      <div
        className="w-full h-2 bg-sand-200/80 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Kemajuan proses'}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${variantColors[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
