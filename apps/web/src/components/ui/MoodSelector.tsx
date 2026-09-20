import React from 'react';

export interface MoodOption {
  value: number;
  label: string;
  emoji: string;
  subtext?: string;
  accentColor?: string;
}

export const DEFAULT_MOOD_OPTIONS: MoodOption[] = [
  { value: 1, emoji: '😞', label: 'Kewalahan', subtext: 'Sangat Berat', accentColor: '#FF5252' },
  { value: 2, emoji: '😟', label: 'Berat', subtext: 'Cemas / Lelah', accentColor: '#FF8A3D' },
  { value: 3, emoji: '😐', label: 'Netral', subtext: 'Biasa Saja', accentColor: '#FFD84D' },
  { value: 4, emoji: '🙂', label: 'Baik', subtext: 'Cukup Tenang', accentColor: '#93C5FD' },
  { value: 5, emoji: '😊', label: 'Sangat Baik', subtext: 'Bertenaga', accentColor: '#B8F34A' },
];

export interface MoodSelectorProps {
  value: number;
  onChange: (val: number) => void;
  options?: MoodOption[];
  className?: string;
}

export function MoodSelector({
  value,
  onChange,
  options = DEFAULT_MOOD_OPTIONS,
  className = '',
}: MoodSelectorProps) {
  return (
    <div className={`grid grid-cols-5 gap-2 sm:gap-3 ${className}`} role="radiogroup" aria-label="Pilih suasana hati">
      {options.map((m) => {
        const isSelected = value === m.value;
        const accent = m.accentColor || '#B8F34A';
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(m.value)}
            style={{
              backgroundColor: isSelected ? accent : '#FFFFFF',
            }}
            className={`flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-[4px] border-2 border-[#151515] transition-all duration-120 min-h-[76px] sm:min-h-[88px] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4169FF] ${
              isSelected
                ? 'shadow-[3px_3px_0px_#151515] -translate-x-[1px] -translate-y-[1px]'
                : 'shadow-[2px_2px_0px_#151515] hover:bg-[#FFF8EF] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#151515]'
            }`}
          >
            <span className="text-2xl sm:text-3xl mb-1 select-none" aria-hidden="true">
              {m.emoji}
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-wider leading-tight text-[#151515]`}
            >
              {m.label}
            </span>
            {m.subtext && (
              <span className="text-[10px] text-[#59544D] font-medium hidden sm:block mt-0.5">
                {m.subtext}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
