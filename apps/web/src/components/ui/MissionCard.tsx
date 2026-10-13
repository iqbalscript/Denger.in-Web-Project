'use client';

import React from 'react';
import { Badge } from './Chip';
import { Button } from './Button';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useText } from '@/i18n/store';
import { uiText } from '@/i18n/pages/ui';

export interface MissionCardProps {
  title: string;
  description: string;
  category: string;
  difficulty?: 'ringan' | 'sedang' | 'bertahap';
  stepsCount?: number;
  completedStepsCount?: number;
  status: 'not_started' | 'in_progress' | 'completed';
  href?: string;
  onAction?: () => void;
  className?: string;
}

export function MissionCard({
  title,
  description,
  category,
  difficulty = 'ringan',
  stepsCount = 3,
  completedStepsCount = 0,
  status,
  href,
  onAction,
  className = '',
}: MissionCardProps) {
  const t = useText(uiText).missionCard;
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  const actionLabel = isCompleted ? t.review : isInProgress ? t.continue : t.start;

  return (
    <div
      className={`p-5 sm:p-6 flex flex-col bg-white border-2 border-[#151515] shadow-[4px_4px_0px_#151515] rounded-[8px] ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="cobalt" size="sm">
            {category}
          </Badge>
          <Badge variant="sand" size="sm">
            {t.difficulty}: {t.difficulties[difficulty]}
          </Badge>
        </div>

        {isCompleted ? (
          <span className="inline-flex items-center gap-1 text-sm font-bold text-[#151515] bg-[#B8F34A] px-2.5 py-1 rounded-[4px] border-2 border-[#151515] shadow-[1px_1px_0px_#151515]">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.completed}</span>
          </span>
        ) : isInProgress ? (
          <span className="inline-flex items-center gap-1 text-sm font-bold text-[#151515] bg-[#FFD84D] px-2.5 py-1 rounded-[4px] border-2 border-[#151515] shadow-[1px_1px_0px_#151515]">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.inProgress}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm font-bold text-[#151515] bg-[#FAFAFA] px-2.5 py-1 rounded-[4px] border-2 border-[#151515]">
            <span>{t.recommended}</span>
          </span>
        )}
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-[#151515] mb-1.5 tracking-[-0.01em] leading-[1.25]">
        {title}
      </h3>
      <p className="text-base text-[#59544D] mb-5 leading-relaxed line-clamp-2">
        {description}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-[#D8D3C9]">
        <div className="text-sm text-[#59544D] font-semibold tabular-nums">
          {stepsCount > 0 && <span>{t.steps(completedStepsCount, stepsCount)}</span>}
        </div>

        {href ? (
          <Button
            href={href}
            variant={isCompleted ? 'secondary' : 'primary'}
            size="sm"
            icon={isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          >
            {actionLabel}
          </Button>
        ) : onAction ? (
          <Button
            variant={isCompleted ? 'secondary' : 'primary'}
            size="sm"
            onClick={onAction}
            icon={isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
