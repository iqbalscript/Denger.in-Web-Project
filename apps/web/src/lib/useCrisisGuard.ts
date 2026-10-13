'use client';

import { useCallback, useReducer } from 'react';
import { evaluateCrisisInput } from '@dengarin/crisis-engine';
import type { AgeBracket } from '@dengarin/types';
import {
  crisisGuardReducer,
  INITIAL_CRISIS_GUARD_STATE,
  isSubmitAllowed,
  type CrisisGuardState,
  type CrisisMatch,
} from './crisisGuard.ts';

function evaluate(text: string, ageBracket: AgeBracket): CrisisMatch {
  if (!text.trim()) return { isCrisis: false, emergencyContacts: [] };
  const result = evaluateCrisisInput(text, ageBracket);
  return { isCrisis: result.isCrisis, emergencyContacts: result.emergencyContacts };
}

export interface CrisisGuard extends CrisisGuardState {
  /** Call from onChange with the new text. Never navigates. */
  checkText: (text: string) => void;
  /**
   * Call right before a save/AI action. Returns false (and shows the card)
   * when the text matches the crisis rules; the caller must then stop.
   */
  allowSubmit: (text: string) => boolean;
  acknowledge: () => void;
  reset: () => void;
}

/** Shared inline crisis guard (M6) for journal, check-in, assessment, mission, report. */
export function useCrisisGuard(ageBracket: AgeBracket | undefined): CrisisGuard {
  const [state, dispatch] = useReducer(crisisGuardReducer, INITIAL_CRISIS_GUARD_STATE);
  const bracket: AgeBracket = ageBracket || '18-24';

  const checkText = useCallback(
    (text: string) => dispatch({ type: 'text_evaluated', match: evaluate(text, bracket) }),
    [bracket]
  );

  const allowSubmit = useCallback(
    (text: string) => {
      const match = evaluate(text, bracket);
      dispatch({ type: 'submit_attempted', match });
      return isSubmitAllowed(match);
    },
    [bracket]
  );

  const acknowledge = useCallback(() => dispatch({ type: 'acknowledged' }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  return { ...state, checkText, allowSubmit, acknowledge, reset };
}
