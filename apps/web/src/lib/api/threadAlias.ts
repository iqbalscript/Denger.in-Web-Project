import { createHmac, randomInt } from 'node:crypto';

const THREAD_KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const NOUNS = ['Awan', 'Senja', 'Hujan', 'Embun', 'Pelita', 'Angin', 'Daun', 'Sungai', 'Bintang', 'Fajar', 'Langit', 'Purnama', 'Rimba', 'Samudra', 'Kidung', 'Mentari', 'Cakrawala', 'Lentera', 'Pohon', 'Bunga', 'Kabut', 'Batu', 'Ranting', 'Danau', 'Pagi', 'Cahaya', 'Rembulan', 'Teras', 'Jendela', 'Jejak', 'Napas', 'Hening'];
const QUALIFIERS = ['Teduh', 'Tenang', 'Hangat', 'Jernih', 'Lembut', 'Sabar', 'Damai', 'Sejuk', 'Tabah', 'Bijak', 'Ramah', 'Tulus', 'Hening', 'Kecil', 'Lega', 'Cerah', 'Rindu', 'Tegar', 'Sederhana', 'Penuh', 'Akrab', 'Pelan', 'Kuat', 'Baik', 'Sore', 'Pagi', 'Luas', 'Dekat', 'Harum', 'Biru', 'Hijau', 'Jingga'];
const DETAILS = ['Pagi', 'Sore', 'Malam', 'Ruang', 'Jalan', 'Langkah', 'Nada', 'Rona', 'Rasa', 'Arah', 'Cerita', 'Hening', 'Teduh', 'Hangat', 'Lembut', 'Jernih', 'Damai', 'Kecil', 'Luas', 'Pelan', 'Tulus', 'Baik', 'Ramah', 'Biru', 'Jingga', 'Hijau', 'Emas', 'Putih', 'Lapis', 'Bening', 'Sinar', 'Pijar'];

export function deriveThreadParticipantHash(storyId: string, threadKey: string): string | undefined {
  if (!THREAD_KEY_PATTERN.test(threadKey)) return undefined;
  const secret = process.env.FORUM_THREAD_ALIAS_SECRET;
  if (!secret) return undefined;
  return createHmac('sha256', secret).update(`${storyId}\u0000${threadKey}`).digest('base64url');
}

/** Server-selected aliases; the browser never submits or chooses one. */
export function generateAliasCandidates(count = 16): string[] {
  const aliases = new Set<string>();
  while (aliases.size < count) aliases.add(`Sahabat ${NOUNS[randomInt(NOUNS.length)]} ${QUALIFIERS[randomInt(QUALIFIERS.length)]} ${DETAILS[randomInt(DETAILS.length)]}`);
  return [...aliases];
}
