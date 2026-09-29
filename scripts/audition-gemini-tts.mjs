/**
 * LOCAL-ONLY Gemini TTS audition utility.
 *
 * This is deliberately not imported by the web app and does not expose an API
 * route. It writes disposable WAV files under the OS temporary directory so a
 * reviewer can compare exactly three prebuilt voices before choosing one.
 */
import { access, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

const MODEL = 'gemini-3.8-flash-lite-tts';
const VOICES = ['Sulafat', 'Achird', 'Achernar'];
const STYLE = 'Natural conversational Indonesian. Warm, calm, casual, and grounded. Speak like a supportive young adult friend, not a narrator, announcer, customer-service agent, therapist, or motivational speaker. Moderate pace with natural Indonesian rhythm. Avoid exaggerated cheerfulness, dramatic emotion, and overly polished delivery.';
const LINES = [
  ['normal', 'Ya, kedengarannya hari ini lumayan berat. Kita nggak harus nyelesaiin semuanya sekarang.'],
  ['casual', 'Gapapa, cerita aja pelan-pelan. Gue dengerin.'],
  ['slang', 'Kalau lagi mumet banget, kita urutin satu-satu aja dulu.'],
  ['code-switch', 'Kayaknya kamu lagi overwhelmed. Kita cari satu hal kecil yang bisa bikin malam ini sedikit lebih ringan.'],
  ['pause-empathy', 'Hm... oke. Kedengarannya itu cukup nguras energi kamu.'],
  ['question', 'Yang paling bikin kepikiran sekarang bagian yang mana?'],
];
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const DELAY_MS = Number(process.env.VOICE_AUDITION_DELAY_MS ?? 16_000);

function findWav(payload) {
  for (const step of payload?.steps ?? []) {
    if (step?.type !== 'model_output') continue;
    for (const content of step.content ?? []) {
      if (content?.type === 'audio' && typeof content.data === 'string') return content.data;
    }
  }
  return null;
}

function isExpectedWav(bytes) {
  if (bytes.length < 44) return false;
  const ascii = (start, end) => bytes.subarray(start, end).toString('ascii');
  if (ascii(0, 4) !== 'RIFF' || ascii(8, 12) !== 'WAVE' || ascii(12, 16) !== 'fmt ' || ascii(36, 40) !== 'data') return false;
  return bytes.readUInt16LE(20) === 1
    && bytes.readUInt16LE(22) === 1
    && bytes.readUInt32LE(24) === 24_000
    && bytes.readUInt16LE(34) === 16;
}

async function synthesize(apiKey, voice, text) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        model: MODEL,
        // Do not retain provider-side interaction state for this audition.
        store: false,
        input: [{
          type: 'user_input',
          content: [{
            type: 'text',
            text,
            annotations: [{ type: 'speech_metadata', style: STYLE }],
          }],
        }],
        response_format: { type: 'audio', mime_type: 'audio/wav', sample_rate: 24_000 },
        generation_config: { speech_config: [{ voice }] },
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Gemini TTS returned HTTP ${response.status}.`);
    const payload = await response.json();
    const base64 = findWav(payload);
    if (!base64 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) throw new Error('Gemini TTS returned no valid base64 audio block.');
    const audio = Buffer.from(base64, 'base64');
    if (!isExpectedWav(audio)) throw new Error('Gemini TTS returned an unexpected audio format.');
    return audio;
  } finally {
    clearTimeout(timeout);
  }
}

function auditionPage() {
  const sections = LINES.map(([label, text]) => `
    <section><h2>${label.toUpperCase()}</h2><p>${text}</p>${VOICES.map((voice) => `
      <div><strong>${voice}</strong><br><audio controls preload="metadata" src="${voice.toLowerCase()}-${label}.wav"></audio></div>`).join('')}</section>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>Dengar.in local voice audition</title>
<style>body{font:16px system-ui;max-width:780px;margin:32px auto;padding:0 16px}section{border-top:1px solid #bbb;padding:16px 0}audio{width:min(100%,420px)}strong{display:inline-block;margin-top:10px}</style>
<h1>Ruang Ngobrol — local voice audition</h1><p>Model: ${MODEL}. Style is metadata only; the displayed transcripts are verbatim.</p>${sections}`;
}

loadEnvConfig(path.join(process.cwd(), 'apps/web'));
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is required in the local environment; no key was written or logged.');

const outputDir = process.env.VOICE_AUDITION_OUTPUT_DIR
  ?? path.join(tmpdir(), 'dengarin-voice-audition');
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'index.html'), auditionPage(), 'utf8');
await writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify({ model: MODEL, voices: VOICES, style: STYLE, lines: LINES }, null, 2), 'utf8');

for (const [label, text] of LINES) {
  for (const voice of VOICES) {
    const filename = `${voice.toLowerCase()}-${label}.wav`;
    try {
      await access(path.join(outputDir, filename));
      console.log(`Keeping existing ${voice} / ${label}`);
      continue;
    } catch {
      // Missing sample: generate it below.
    }
    const audio = await synthesize(apiKey, voice, text);
    await writeFile(path.join(outputDir, filename), audio);
    console.log(`Created ${voice} / ${label}`);
    // Stay below the conservative audition cadence; this is not a retry loop.
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }
}

console.log(`\nAudition ready: ${path.join(outputDir, 'index.html')}`);
console.log('Open index.html locally and compare every row before choosing a voice. The directory is OS-temp local output only.');
