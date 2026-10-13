'use client';

import React from 'react';
import { MOOD_ICONS_BY_VALUE } from './MoodIcon';
import type { WellbeingTimeline as TimelineData } from '@/lib/wellbeingTimeline';
import { useText } from '@/i18n/store';
import { uiText } from '@/i18n/pages/ui';

const MOOD_COLOR: Record<number, string> = { 5: '#B8F34A', 4: '#3357EE', 3: '#FFD84D', 2: '#FF8A3D', 1: '#FF5252' };

const WIDTH = 340;
const HEIGHT = 170;
const PAD = { left: 28, right: 12, top: 12, bottom: 26 };

interface WellbeingTimelineProps {
  timeline: TimelineData;
  className?: string;
}

/**
 * Personal Well-being Timeline: mood dots over the last N days plus four totals.
 * Days without a check-in stay empty (no dot): a gap is fine, not a failure.
 */
export function WellbeingTimeline({ timeline, className = '' }: WellbeingTimelineProps) {
  const t = useText(uiText).timeline;
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

  const summary = t.summary(days.length, totals.checkins, totals.missions, totals.journals, totals.activeDays);

  const stats: Array<{ label: string; value: number }> = [
    { label: t.checkins, value: totals.checkins },
    { label: t.missions, value: totals.missions },
    { label: t.journals, value: totals.journals },
    { label: t.activeDays, value: totals.activeDays },
  ];

  return (
    <div className={`bg-white border-2 border-ink rounded-[8px] p-6 space-y-5 shadow-hard-sm text-left ${className}`}>
      <div className="border-b border-[#D8D3C9] pb-3 space-y-0.5">
        <h2 className="text-xl font-bold tracking-[-0.01em] leading-[1.25] text-ink">{t.title}</h2>
        <p className="text-sm text-[#59544D] font-medium tabular-nums">{t.lastDays(days.length)}</p>
      </div>

      <div className="space-y-1">
        <span className="text-sm font-bold text-[#59544D]">{t.moodPerDay}</span>
        {points.length === 0 ? (
          <p className="text-sm text-[#59544D] py-8 text-center max-w-[32ch] mx-auto leading-relaxed">
            {t.empty(days.length)}
          </p>
        ) : (
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary} className="w-full h-auto">
            {[5, 4, 3, 2, 1].map((level) => (
              <g key={level}>
                <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(level)} y2={y(level)} stroke="#151515" strokeOpacity="0.08" />
                {React.createElement(MOOD_ICONS_BY_VALUE[level], {
                  x: PAD.left - 20,
                  y: y(level) - 7,
                  width: 14,
                  height: 14,
                  strokeWidth: 2,
                  color: '#151515',
                  'aria-hidden': true,
                })}
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
                <title>{t.point(point.date, point.mood.toFixed(1))}</title>
              </circle>
            ))}
            {days.map((day, index) => (
              <text
                key={day.date} x={x(index)} y={HEIGHT - 8} fontSize="11" textAnchor="middle" fontWeight="700" style={{ fontVariantNumeric: 'tabular-nums' }}
                fill="#151515" fillOpacity={day.active ? 1 : 0.55}
              >
                {day.dayOfMonth}
              </text>
            ))}
          </svg>
        )}
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((stat) => (
          // dt must precede dd; flex-col-reverse keeps the number visually on top.
          <div key={stat.label} className="flex flex-col-reverse p-3 rounded-[4px] bg-paper">
            <dt className="text-sm font-bold text-[#59544D] pt-1">{stat.label}</dt>
            <dd className="text-2xl font-bold text-ink leading-none tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-sm text-[#59544D]">{t.note}</p>
    </div>
  );
}
