/**
 * Orchestrator warnings are written for operators: they embed the provider's
 * raw error text ("DeepSeek merespons dengan status 402: Insufficient
 * Balance", upstream request ids, model slugs). /api/chat used to forward them
 * verbatim to the browser. Nothing in the UI renders them, so the only effect
 * was leaking billing state and provider internals to any caller.
 *
 * This keeps the warning *shape* (which tier was skipped / failed / rejected)
 * while dropping everything after the first provider-supplied detail.
 */

const UPSTREAM_DETAIL = /\s(?:merespons dengan status\s+(\d{3}))?:.*$/su;

export function redactWarning(warning: string): string {
  if (typeof warning !== 'string') return '';
  const trimmed = warning.trim();
  if (!trimmed) return '';

  // "<provider> gagal: <upstream message>" -> "<provider> gagal: status 402"
  // or "<provider> gagal: kesalahan penyedia".
  const failed = trimmed.match(/^(.*?\bgagal):\s*(.*)$/su);
  if (failed) {
    const detail = failed[2];
    const status = detail.match(/\bstatus\s+(\d{3})\b/u)?.[1];
    if (status) return `${failed[1]}: status ${status}`;
    if (/abort|timeout|timed out|waktu/iu.test(detail)) return `${failed[1]}: waktu habis`;
    return `${failed[1]}: kesalahan penyedia`;
  }

  // Validator rejection lists are internal rule names; keep only the summary.
  const invalid = trimmed.match(/^(.*?\b(?:output tidak valid|output akhir tidak aman|skema tidak valid))\b.*$/su);
  if (invalid) return invalid[1];

  // Anything else that still carries a provider detail after a colon.
  return trimmed.replace(UPSTREAM_DETAIL, '');
}

/** Public-safe projection of orchestrator warnings for API responses. */
export function toPublicWarnings(warnings: readonly string[] | undefined): string[] {
  if (!Array.isArray(warnings)) return [];
  return warnings.map(redactWarning).filter((warning) => warning.length > 0);
}
