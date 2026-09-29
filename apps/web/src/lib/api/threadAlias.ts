import { createHmac, randomInt } from 'node:crypto';

const THREAD_KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const NOUNS = ['Awan', 'Senja', 'Hujan', 'Embun', 'Pelita', 'Angin', 'Daun', 'Sungai', 'Bintang', 'Fajar', 'Langit', 'Purnama', 'Rimba', 'Samudra', 'Kidung', 'Mentari', 'Cakrawala', 'Lentera', 'Pohon', 'Bunga', 'Kabut', 'Batu', 'Ranting', 'Danau', 'Pagi', 'Cahaya', 'Rembulan', 'Teras', 'Jendela', 'Jejak', 'Napas', 'Hening'];
const QUALIFIERS = ['Teduh', 'Tenang', 'Hangat', 'Jernih', 'Lembut', 'Sabar', 'Damai', 'Sejuk', 'Tabah', 'Bijak', 'Ramah', 'Tulus', 'Hening', 'Kecil', 'Lega', 'Cerah', 'Rindu', 'Tegar', 'Sederhana', 'Penuh', 'Akrab', 'Pelan', 'Kuat', 'Baik', 'Sore', 'Pagi', 'Luas', 'Dekat', 'Harum', 'Biru', 'Hijau', 'Jingga'];
const DETAILS = ['Pagi', 'Sore', 'Malam', 'Ruang', 'Jalan', 'Langkah', 'Nada', 'Rona', 'Rasa', 'Arah', 'Cerita', 'Hening', 'Teduh', 'Hangat', 'Lembut', 'Jernih', 'Damai', 'Kecil', 'Luas', 'Pelan', 'Tulus', 'Baik', 'Ramah', 'Biru', 'Jingga', 'Hijau', 'Emas', 'Putih', 'Lapis', 'Bening', 'Sinar', 'Pijar'];

let warnedDerivedSecret = false;

/**
 * Secret HMAC untuk identitas anonim per cerita.
 *
 * Utamanya dari `FORUM_THREAD_ALIAS_SECRET`. Bila tidak diisi (mis. slot
 * environment variable di hosting sudah penuh), diturunkan satu arah dari
 * `ADMIN_SESSION_SECRET` dengan pemisah domain, sehingga tidak membuka secret
 * admin dan tidak sama dengan kunci lain yang dipakai secret itu.
 * Konsekuensi: memutar `ADMIN_SESSION_SECRET` juga mengganti alias peserta
 * (pengguna mendapat nama samaran baru di thread yang sama).
 */
function threadAliasSecret(): string | undefined {
  const explicit = process.env.FORUM_THREAD_ALIAS_SECRET;
  if (explicit) return explicit;
  const base = process.env.ADMIN_SESSION_SECRET;
  if (!base) return undefined;
  if (!warnedDerivedSecret) {
    warnedDerivedSecret = true;
    console.warn('[Forum] FORUM_THREAD_ALIAS_SECRET kosong; memakai turunan dari ADMIN_SESSION_SECRET.');
  }
  return createHmac('sha256', base).update('dengarin:forum-thread-alias:v1').digest('hex');
}

export function deriveThreadParticipantHash(storyId: string, threadKey: string): string | undefined {
  if (!THREAD_KEY_PATTERN.test(threadKey)) return undefined;
  const secret = threadAliasSecret();
  if (!secret) return undefined;
  return createHmac('sha256', secret).update(`${storyId}\u0000${threadKey}`).digest('base64url');
}

/** Server-selected aliases; the browser never submits or chooses one. */
export function generateAliasCandidates(count = 16): string[] {
  const aliases = new Set<string>();
  while (aliases.size < count) aliases.add(`Sahabat ${NOUNS[randomInt(NOUNS.length)]} ${QUALIFIERS[randomInt(QUALIFIERS.length)]} ${DETAILS[randomInt(DETAILS.length)]}`);
  return [...aliases];
}
