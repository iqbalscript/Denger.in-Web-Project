import React from 'react';
import {
  FaceExpressionless,
  FaceGrinning,
  FaceNeutral,
  FaceSlightlyFrowning,
  FaceSlightlySmiling,
  type LucideIcon,
} from 'lucide-react';
import type { MoodScore } from '@dengarin/types';

/**
 * One icon family for every mood picker, mood label and mood chart
 * (WellbeingTimeline axis). The app uses icons, never emoji, for moods.
 *
 * Lucide has no "overwhelmed" face, so `kewalahan` uses the expressionless face
 * (eyes shut, flat mouth): drained rather than sad, which matches the
 * "Sangat Lelah" wording used across the app.
 */
export const MOOD_ICONS: Record<MoodScore, LucideIcon> = {
  sangat_baik: FaceGrinning,
  baik: FaceSlightlySmiling,
  netral: FaceNeutral,
  berat: FaceSlightlyFrowning,
  kewalahan: FaceExpressionless,
};

/** Numeric 1-5 scale used by MoodSelector (5 = best). */
export const MOOD_ICONS_BY_VALUE: Record<number, LucideIcon> = {
  5: FaceGrinning,
  4: FaceSlightlySmiling,
  3: FaceNeutral,
  2: FaceSlightlyFrowning,
  1: FaceExpressionless,
};

export interface MoodIconProps {
  mood: MoodScore;
  className?: string;
}

/** Decorative: the visible text label next to it carries the meaning. */
export function MoodIcon({ mood, className = 'w-6 h-6' }: MoodIconProps) {
  const Icon = MOOD_ICONS[mood];
  return <Icon className={className} strokeWidth={2} aria-hidden="true" />;
}
