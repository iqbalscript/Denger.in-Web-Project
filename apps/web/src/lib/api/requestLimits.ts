export const CHAT_MAX_BYTES = 32 * 1024;
export const CHAT_MAX_MESSAGE = 2000;
export const CHAT_MAX_HISTORY_COUNT = 12;
export const CHAT_MAX_HISTORY_ENTRY = 2000;
export const CHAT_MAX_HISTORY_TOTAL = 12000;

export async function readJsonLimited(request: Request, maxBytes: number): Promise<
  { ok: true; value: unknown } | { ok: false; status: 400 | 413 }
> {
  const declared = request.headers.get('content-length');
  if (declared && /^\d+$/.test(declared) && Number(declared) > maxBytes) {
    return { ok: false, status: 413 };
  }
  if (!request.body) return { ok: false, status: 400 };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { ok: true, value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) };
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }
}

export function chatInputWithinLimits(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const input = value as { message?: unknown; history?: unknown };
  if (typeof input.message !== 'string' || input.message.length > CHAT_MAX_MESSAGE) return false;
  if (input.history === undefined) return true;
  if (!Array.isArray(input.history) || input.history.length > CHAT_MAX_HISTORY_COUNT) return false;
  let total = 0;
  for (const entry of input.history) {
    if (!entry || typeof entry !== 'object' || typeof entry.text !== 'string') return false;
    if (entry.text.length > CHAT_MAX_HISTORY_ENTRY) return false;
    total += entry.text.length;
    if (total > CHAT_MAX_HISTORY_TOTAL) return false;
  }
  return true;
}
