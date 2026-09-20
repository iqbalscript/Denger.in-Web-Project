import React from 'react';
import Link from 'next/link';
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
    <div
      className={`p-5 sm:p-6 bg-white border-2 border-[#151515] shadow-[4px_4px_0px_#151515] rounded-[6px] transition-all duration-120 ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="cobalt" size="sm">
            {category}
          </Badge>
          <Badge variant="sand" size="sm">
            Intensitas: {difficulty}
          </Badge>
        </div>

        {isCompleted ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#151515] bg-[#B8F34A] px-2.5 py-1 rounded-[4px] border-2 border-[#151515] shadow-[1px_1px_0px_#151515]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Selesai</span>
          </span>
        ) : isInProgress ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#151515] bg-[#FFD84D] px-2.5 py-1 rounded-[4px] border-2 border-[#151515] shadow-[1px_1px_0px_#151515]">
            <Clock className="w-3.5 h-3.5" />
            <span>Sedang Berjalan</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#151515] bg-[#FFF8EF] px-2.5 py-1 rounded-[4px] border-2 border-[#151515]">
            <span>Rekomendasi</span>
          </span>
        )}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[#151515] mb-1.5 leading-snug">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#59544D] mb-4 leading-relaxed line-clamp-2">
        {description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t-2 border-[#151515]/10">
        <div className="text-xs text-[#59544D] font-bold uppercase tracking-wider">
          {stepsCount > 0 && (
            <span>
              {completedStepsCount} / {stepsCount} langkah selesai
            </span>
          )}
        </div>

        {href ? (
          <Link href={href}>
            <Button
              variant={isCompleted ? 'secondary' : 'primary'}
              size="sm"
              icon={isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            >
              {isCompleted ? 'Tinjau Kembali' : isInProgress ? 'Lanjutkan' : 'Mulai Langkah'}
            </Button>
          </Link>
        ) : onAction ? (
          <Button
            variant={isCompleted ? 'secondary' : 'primary'}
            size="sm"
            onClick={onAction}
            icon={isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          >
            {isCompleted ? 'Tinjau Kembali' : isInProgress ? 'Lanjutkan' : 'Mulai Langkah'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
