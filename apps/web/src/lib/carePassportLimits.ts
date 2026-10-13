/** Client-safe limits shared by the Care Passport UI and its API handler. */
export const CARE_PASSPORT_MAX_TEXT = 4000;
export const CARE_PASSPORT_MIN_TEXT = 20;

/**
 * F-A "Bukti Bertanggal": the typed story plus every selected journal /
 * check-in entry and clarification answer. Selected entries count toward
 * this budget, so the picker can refuse a selection that would not fit.
 */
export const CARE_PASSPORT_MAX_SEGMENTS = 12;
export const CARE_PASSPORT_MAX_TOTAL_TEXT = 6000;
export const CARE_PASSPORT_MAX_SEGMENT_TEXT = CARE_PASSPORT_MAX_TEXT;
/** Clarification rounds before the review is shown as-is. */
export const CARE_PASSPORT_MAX_CLARIFICATION_ROUNDS = 3;
/** Only entries from the last N days are offered as evidence. */
export const CARE_PASSPORT_EVIDENCE_WINDOW_DAYS = 30;
