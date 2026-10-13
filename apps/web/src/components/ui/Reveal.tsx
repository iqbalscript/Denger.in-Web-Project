'use client';

import React, { useEffect, useRef, useState } from 'react';

type RevealElement = 'div' | 'section' | 'article' | 'aside' | 'li' | 'ul' | 'ol' | 'header';

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: RevealElement;
  /** Stagger offset in ms, e.g. index * 80 for a list. */
  delay?: number;
}

/**
 * Fades content up once it scrolls into view. Use it for below-the-fold
 * sections; above-the-fold content should use the CSS-only `animate-reveal-up`
 * so it doesn't wait for hydration. The hidden state lives in globals.css and
 * only applies when scripting is on and the viewer allows motion.
 *
 * Never wrap crisis hotlines or safety messaging in this.
 */
export function Reveal({ children, as = 'div', delay = 0, style, ...props }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<'hidden' | 'shown' | 'done'>('hidden');

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setState('done');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('shown');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Drop the entrance transition once it has played so hover/press utilities win again.
  useEffect(() => {
    if (state !== 'shown') return;
    const timer = window.setTimeout(() => setState('done'), 700 + delay + 50);
    return () => window.clearTimeout(timer);
  }, [state, delay]);

  return React.createElement(
    as,
    {
      ...props,
      ref,
      'data-reveal': state,
      style: delay ? { ...style, ['--reveal-delay' as string]: `${delay}ms` } : style,
    },
    children
  );
}
