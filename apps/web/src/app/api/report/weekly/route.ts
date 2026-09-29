import type { NextRequest } from 'next/server';
import type { DailyCheckin, DailyMission, MoodScore, WeeklyReportSummary } from '@dengarin/types';
import { jsonError, jsonOk } from '@/lib/api/response';
import { isRateLimited } from '@/lib/api/rateLimit';
import { readJsonLimited } from '@/lib/api/requestLimits';

interface WeeklyReportRequestBody {
  weekStarting?: string;
  checkins?: DailyCheckin[];
  missions?: DailyMission[];
}

const MOOD_WEIGHTS: Record<MoodScore, number> = {
  sangat_baik: 2,
  baik: 1,
  netral: 0,
  berat: -1,
  kewalahan: -2
};

function computeDominantMood(checkins: DailyCheckin[]): MoodScore {
  const counts = new Map<MoodScore, number>();
  for (const checkin of checkins) {
    counts.set(checkin.mood, (counts.get(checkin.mood) ?? 0) + 1);
  }

  let dominant: MoodScore = 'netral';
  let highestCount = -Infinity;
  for (const [mood, count] of counts) {
    if (count > highestCount) {
      highestCount = count;
      dominant = mood;
    }
  }
  return dominant;
}

/**
 * POST /api/report/weekly
 * Dengar.in stores check-ins and missions locally in the browser (Zero
 * Unnecessary PII), so this endpoint stays stateless: it synthesizes a
 * WeeklyReportSummary from the client's own local history rather than
 * reading from a server-side database.
 */
export async function POST(request: NextRequest) {
  if (await isRateLimited('weekly-report', request)) return jsonError('Sedang cukup ramai. Tarik napas dulu, lalu coba lagi sebentar lagi, ya.', 429);
  const parsed = await readJsonLimited(request, 64 * 1024);
  if (!parsed.ok) return jsonError('Permintaan tidak valid atau terlalu besar.', parsed.status);
  const body = parsed.value as WeeklyReportRequestBody | null;
  if (!body || !Array.isArray(body.checkins) || !Array.isArray(body.missions)) {
    return jsonError('Properti "checkins" dan "missions" wajib berupa array.');
  }
  if (body.checkins.length > 500 || body.missions.length > 500) return jsonError('Permintaan tidak valid atau terlalu besar.', 413);

  const completedMissionsCount = body.missions.filter((mission) => mission.completed).length;
  const dominantMood = body.checkins.length > 0 ? computeDominantMood(body.checkins) : 'netral';
  const averageWeight =
    body.checkins.length > 0
      ? body.checkins.reduce((sum, checkin) => sum + MOOD_WEIGHTS[checkin.mood], 0) / body.checkins.length
      : 0;

  const keyObservation =
    averageWeight >= 0.5
      ? 'Suasana hatimu minggu ini cenderung stabil dan positif. Nikmati momen baik ini.'
      : averageWeight <= -0.5
        ? 'Minggu ini sepertinya terasa cukup berat. Tidak apa-apa untuk memperlambat ritme dan memberi dirimu lebih banyak istirahat.'
        : 'Suasana hatimu minggu ini bervariasi, dan itu sepenuhnya wajar.';

  const summary: WeeklyReportSummary = {
    weekStarting: body.weekStarting ?? new Date().toISOString(),
    totalCheckins: body.checkins.length,
    completedMissionsCount,
    dominantMood,
    keyObservation,
    encouragementNote:
      'Terima kasih sudah tetap hadir untuk dirimu sendiri. Setiap langkah kecil minggu ini tetap berarti. Teruskan dengan ritme yang nyaman bagimu.'
  };

  return jsonOk({ summary });
}
