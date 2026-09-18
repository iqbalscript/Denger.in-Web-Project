import { NextResponse } from 'next/server';

export function jsonOk<T>(data: T, init?: { status?: number }) {
  return NextResponse.json({ ok: true, data }, { status: init?.status ?? 200 });
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}
