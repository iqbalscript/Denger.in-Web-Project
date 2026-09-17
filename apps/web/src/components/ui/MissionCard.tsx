import React from 'react';
import Link from 'next/link';
import { SoftCard } from './SoftCard';
import { Badge } from './Chip';
import { Button } from './Button';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';

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
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  return (
    <SoftCard
      variant={isCompleted ? 'tinted' : 'white'}
      elevation="medium"
      className={`p-5 sm:p-6 transition-all duration-200 ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="calm" size="sm">
            {category}
          </Badge>
          <Badge variant="sand" size="sm">
            Intensitas: {difficulty}
          </Badge>
        </div>

        {isCompleted ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-calm-700 bg-calm-100 px-2.5 py-1 rounded-full border border-calm-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai</span>
          </span>
        ) : isInProgress ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-warm-700 bg-warm-100 px-2.5 py-1 rounded-full border border-warm-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Sedang Berjalan</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-sand-700 bg-sand-100 px-2.5 py-1 rounded-full border border-sand-200">
            <span>Rekomendasi</span>
          </span>
        )}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-sand-900 mb-1.5 leading-snug">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-sand-800/80 mb-4 leading-relaxed line-clamp-2">
        {description}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-sand-200/80">
        <div className="text-xs text-sand-600 font-medium">
          {stepsCount > 0 && (
            <span>
              {completedStepsCount} / {stepsCount} langkah selesai
            </span>
          )}
        </div>

        {href ? (
          <Link href={href}>
            <Button
              variant={isCompleted ? 'calm-subtle' : 'primary'}
              size="sm"
              icon={isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            >
              {isCompleted ? 'Tinjau Kembali' : isInProgress ? 'Lanjutkan' : 'Mulai Langkah'}
            </Button>
          </Link>
        ) : onAction ? (
          <Button
            variant={isCompleted ? 'calm-subtle' : 'primary'}
            size="sm"
            onClick={onAction}
            icon={isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          >
            {isCompleted ? 'Tinjau Kembali' : isInProgress ? 'Lanjutkan' : 'Mulai Langkah'}
          </Button>
        ) : null}
      </div>
    </SoftCard>
  );
}
