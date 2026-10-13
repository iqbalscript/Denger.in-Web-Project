'use client';

import React from 'react';
import { ArrowRight, LifeBuoy } from 'lucide-react';
import type { SupportPathway } from '@/lib/api/crisisGate';
import { Button } from '@/components/ui';
import { contactText } from '@/i18n/common';
import { useLanguage } from '@/i18n/store';

/** Accept only the server's deterministic pathway shape; anything else is ignored. */
export function readSupportPathway(value: unknown): SupportPathway | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Partial<SupportPathway>;
  if (candidate.kind !== 'human_support' || candidate.severity !== 'high') return undefined;
  if (!Array.isArray(candidate.contacts) || !Array.isArray(candidate.links)) return undefined;
  return candidate as SupportPathway;
}

export interface SupportPathwayCardProps {
  pathway: SupportPathway;
  className?: string;
}

/**
 * Calm, static card: no animation, no alarm colours (crisis-adjacent content
 * is never animated). Contacts come from the deterministic crisis engine,
 * never from model output. Title/message/link labels arrive already localised
 * from the server; contact names and hours are localised here by contact id.
 */
export function SupportPathwayCard({ pathway, className = '' }: SupportPathwayCardProps) {
  const { lang } = useLanguage();
  return (
    <section
      aria-label={pathway.title}
      className={`p-4 rounded-md bg-white border-2 border-ink shadow-hard-sm text-base space-y-3 ${className}`.trim()}
    >
      <div className="flex items-center gap-1.5 font-bold text-base text-ink leading-snug">
        <LifeBuoy className="w-4 h-4 text-cobalt shrink-0" aria-hidden="true" />
        <span>{pathway.title}</span>
      </div>
      <p className="text-[#59544D] text-base leading-relaxed">{pathway.message}</p>
      {pathway.contacts.length > 0 && (
        <ul className="space-y-1.5">
          {pathway.contacts.map((contact) => {
            const text = contactText(lang, contact.id);
            return (
              <li key={contact.id} className="rounded border border-ink bg-paper px-2.5 py-1.5">
                <p className="font-semibold text-ink leading-snug">{text?.name ?? contact.name}</p>
                <p className="text-sm text-[#59544D] leading-snug">
                  {contact.phone && (
                    <a href={`tel:${contact.phone.replace(/\s*ext\s*/i, ',').replace(/[^\d+,]/g, '')}`} className="inline-flex items-center min-h-[44px] font-bold text-ink underline underline-offset-4 decoration-2">
                      {contact.phone}
                    </a>
                  )}
                  {contact.phone && ' · '}
                  {text?.hours ?? contact.availableHours}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-wrap gap-2 pt-0.5">
        {pathway.links.map((link) => (
          <Button
            key={link.href}
            href={link.href}
            size="sm"
            variant={link.href === '/resources' ? 'primary' : 'outline'}
            className="min-h-[44px]"
            iconPosition="end"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {link.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
