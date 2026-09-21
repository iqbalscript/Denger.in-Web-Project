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
  if (await isRateLimited('weekly-report')) return jsonError('Terlalu banyak permintaan. Coba lagi sebentar lagi.', 429);
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
      ? 'Kecenderungan suasana hatimu minggu ini relatif stabil dan positif.'
      : averageWeight <= -0.5
        ? 'Minggu ini terasa cukup berat — pertimbangkan untuk memperlambat ritme misi harian.'
        : 'Suasana hatimu minggu ini bervariasi, dan itu sepenuhnya wajar.';

  const summary: WeeklyReportSummary = {
    weekStarting: body.weekStarting ?? new Date().toISOString(),
    totalCheckins: body.checkins.length,
    completedMissionsCount,
    dominantMood,
    keyObservation,
    encouragementNote:
      'Setiap langkah kecil yang kamu ambil minggu ini tetap berarti. Teruskan dengan ritme yang terasa nyaman bagimu.'
  };

  return jsonOk({ summary });
}
