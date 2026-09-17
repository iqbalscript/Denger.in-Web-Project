import React from 'react';

export interface MoodOption {
  value: number;
  label: string;
  emoji: string;
  subtext?: string;
}

export const DEFAULT_MOOD_OPTIONS: MoodOption[] = [
  { value: 1, emoji: '😞', label: 'Sangat Berat', subtext: 'Kewalahan' },
  { value: 2, emoji: '😟', label: 'Cemas / Lelah', subtext: 'Tegang' },
  { value: 3, emoji: '😐', label: 'Cukup Stabil', subtext: 'Biasa saja' },
  { value: 4, emoji: '🙂', label: 'Baik / Tenang', subtext: 'Terkendali' },
  { value: 5, emoji: '😊', label: 'Sangat Baik', subtext: 'Bertenaga' },
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
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(m.value)}
            className={`flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-150 min-h-[72px] sm:min-h-[84px] text-center focus-visible:outline-2 focus-visible:outline-calm-700 ${
              isSelected
                ? 'bg-calm-100 border-calm-700 shadow-soft-sm ring-1 ring-calm-700 -translate-y-0.5'
                : 'bg-white border-sand-200 hover:bg-sand-50 hover:border-sand-300'
            }`}
          >
            <span className="text-2xl sm:text-3xl mb-1 select-none" aria-hidden="true">
              {m.emoji}
            </span>
            <span
              className={`text-xs font-semibold leading-tight ${
                isSelected ? 'text-calm-950 font-bold' : 'text-sand-800'
              }`}
            >
              {m.label}
            </span>
            {m.subtext && (
              <span className="text-[10px] text-sand-500 hidden sm:block mt-0.5">
                {m.subtext}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
