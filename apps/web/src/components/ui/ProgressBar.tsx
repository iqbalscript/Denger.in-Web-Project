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
    calm: 'bg-[#4169FF]',
    warm: 'bg-[#FF8A3D]',
    crisis: 'bg-[#FF5252]',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || stepIndicator) && (
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#151515]">
          {label && <span>{label}</span>}
          {stepIndicator && <span className="text-[#4169FF] font-bold">{stepIndicator}</span>}
        </div>
      )}
      <div
        className="w-full h-3 bg-white border-2 border-[#151515] rounded-[2px] overflow-hidden shadow-[1px_1px_0px_#151515]"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Kemajuan proses'}
      >
        <div
          className={`h-full transition-all duration-300 ease-out ${variantColors[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
