import React from 'react';
import type { WellbeingTimeline as TimelineData } from '@/lib/wellbeingTimeline';

const MOOD_EMOJI: Record<number, string> = { 5: '😊', 4: '🙂', 3: '😐', 2: '😟', 1: '😞' };
const MOOD_COLOR: Record<number, string> = { 5: '#B8F34A', 4: '#4169FF', 3: '#FFD84D', 2: '#FF8A3D', 1: '#FF5252' };

const WIDTH = 340;
const HEIGHT = 170;
const PAD = { left: 28, right: 12, top: 12, bottom: 26 };

interface WellbeingTimelineProps {
  timeline: TimelineData;
  className?: string;
}

/**
 * Personal Well-being Timeline: mood dots over the last N days plus four totals.
 * Days without a check-in stay empty (no dot) — a gap is fine, not a failure.
 */
export function WellbeingTimeline({ timeline, className = '' }: WellbeingTimelineProps) {
  const { days, totals } = timeline;
  const step = days.length > 1 ? (WIDTH - PAD.left - PAD.right) / (days.length - 1) : 0;
  const x = (index: number) => PAD.left + index * step;
  const y = (level: number) => PAD.top + ((5 - level) / 4) * (HEIGHT - PAD.top - PAD.bottom);
  const rounded = (mood: number) => Math.min(5, Math.max(1, Math.round(mood)));

  const points = days
    .map((day, index) => (day.mood === null ? null : { index, mood: day.mood, date: day.date }))
    .filter((point): point is { index: number; mood: number; date: string } => point !== null);

  const segments = points.slice(1).map((point, i) => {
    const previous = points[i];
    return { from: previous, to: point, gap: point.index - previous.index > 1 };
  });

  const summary = `Timeline ${days.length} hari terakhir: ${totals.checkins} check-in, ${totals.missions} misi, ${totals.journals} jurnal, ${totals.activeDays} hari aktif.`;

  const stats: Array<{ label: string; value: number }> = [
    { label: 'Check-in', value: totals.checkins },
    { label: 'Mission', value: totals.missions },
    { label: 'Journal', value: totals.journals },
    { label: 'Active Days', value: totals.activeDays },
  ];

  return (
    <div className={`bg-white border-2 border-ink rounded-lg p-6 space-y-4 shadow-hard-sm text-left ${className}`}>
      <div className="border-b-2 border-ink pb-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-ink">Personal Well-being Timeline</h2>
        <p className="text-[11px] text-ink/60 font-bold uppercase tracking-wider">{days.length} Hari Terakhir</p>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-ink/60">Mood</span>
        {points.length === 0 ? (
          <p className="text-xs text-ink/70 font-medium py-6 text-center">
            Belum ada check-in di {days.length} hari terakhir. Gak apa-apa, mulai dari satu check-in kecil aja.
          </p>
        ) : (
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary} className="w-full h-auto">
            {[5, 4, 3, 2, 1].map((level) => (
              <g key={level}>
                <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(level)} y2={y(level)} stroke="#151515" strokeOpacity="0.08" />
                <text x={PAD.left - 6} y={y(level) + 4} fontSize="11" textAnchor="end" aria-hidden="true">{MOOD_EMOJI[level]}</text>
              </g>
            ))}
            {segments.map(({ from, to, gap }) => (
              <line
                key={`${from.date}-${to.date}`}
                x1={x(from.index)} y1={y(from.mood)} x2={x(to.index)} y2={y(to.mood)}
                stroke="#151515" strokeWidth="2" strokeDasharray={gap ? '4 4' : undefined} strokeOpacity={gap ? 0.4 : 1}
              />
            ))}
            {points.map((point) => (
              <circle key={point.date} cx={x(point.index)} cy={y(point.mood)} r="5" fill={MOOD_COLOR[rounded(point.mood)]} stroke="#151515" strokeWidth="2">
                <title>{`${point.date}: mood ${point.mood.toFixed(1)}/5`}</title>
              </circle>
            ))}
            {days.map((day, index) => (
              <text
                key={day.date} x={x(index)} y={HEIGHT - 8} fontSize="9" textAnchor="middle" fontWeight="700"
                fill="#151515" fillOpacity={day.active ? 0.9 : 0.35}
              >
                {day.dayOfMonth}
              </text>
            ))}
          </svg>
        )}
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="p-3 rounded border-2 border-ink bg-paper shadow-hard-sm">
            <dd className="text-2xl font-black text-ink leading-none">{stat.value}</dd>
            <dt className="text-[10px] font-black uppercase tracking-wider text-ink/60 pt-1">{stat.label}</dt>
          </div>
        ))}
      </dl>

      <p className="text-[11px] text-ink/60 font-medium">
        Hari yang kosong itu normal. Data ini cuma ada di perangkatmu.
      </p>
    </div>
  );
}
