import type { EmergencyContact } from '@dengarin/types';

/**
 * Inline crisis guard state machine (M6).
 *
 * Replaces the old "router.push('/crisis') on every keystroke" behaviour:
 * - the user's text is never discarded and there is no automatic navigation;
 * - as soon as the text matches the deterministic crisis rules, a static card
 *   with emergency contacts is shown and stays until the user acknowledges it;
 * - the save/AI action is blocked for as long as the text still matches.
 *
 * Pure reducer with no React or crisis-engine import, so it is unit testable.
 */

export interface CrisisMatch {
  isCrisis: boolean;
  emergencyContacts: EmergencyContact[];
}

export interface CrisisGuardState {
  /** Current text matches the crisis rules: save/AI must be blocked. */
  isCrisis: boolean;
  /** Inline crisis card is visible (stays until acknowledged). */
  cardVisible: boolean;
  /** Contacts from the most recent match, kept while the card is visible. */
  contacts: EmergencyContact[];
}

export const INITIAL_CRISIS_GUARD_STATE: CrisisGuardState = {
  isCrisis: false,
  cardVisible: false,
  contacts: [],
};

export type CrisisGuardAction =
  | { type: 'text_evaluated'; match: CrisisMatch }
  | { type: 'submit_attempted'; match: CrisisMatch }
  | { type: 'acknowledged' }
  | { type: 'reset' };

export function crisisGuardReducer(state: CrisisGuardState, action: CrisisGuardAction): CrisisGuardState {
  switch (action.type) {
    case 'text_evaluated': {
      const { isCrisis, emergencyContacts } = action.match;
      if (isCrisis) {
        // Newly matching text re-opens the card; continued typing inside an
        // already-matching text does not re-open an acknowledged card.
        const reopen = !state.isCrisis;
        return {
          isCrisis: true,
          cardVisible: state.cardVisible || reopen,
          contacts: emergencyContacts.length > 0 ? emergencyContacts : state.contacts,
        };
      }
      // Text no longer matches: unblock, but keep the card until acknowledged.
      return { ...state, isCrisis: false };
    }
    case 'submit_attempted': {
      const { isCrisis, emergencyContacts } = action.match;
      if (!isCrisis) return { ...state, isCrisis: false };
      return {
        isCrisis: true,
        cardVisible: true,
        contacts: emergencyContacts.length > 0 ? emergencyContacts : state.contacts,
      };
    }
    case 'acknowledged':
      return { ...state, cardVisible: false };
    case 'reset':
      return INITIAL_CRISIS_GUARD_STATE;
    default:
      return state;
  }
}

/** Whether a save/AI action may proceed for the given match. */
export function isSubmitAllowed(match: CrisisMatch): boolean {
  return !match.isCrisis;
}
