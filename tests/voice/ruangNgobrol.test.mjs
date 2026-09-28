import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { runCrisisGate } from '../../apps/web/src/lib/api/crisisGate.ts';
import {
  VOICE_ROOM_MAX_CAPTIONS,
  VOICE_ROOM_MAX_SESSION_MS,
  appendVoiceRoomCaption,
  canTransitionVoiceRoom,
  screenVoiceRoomFinalTranscript,
  shouldResumeVoiceRoomListening,
  validatedActionDisplayText,
  voiceRoomHistory,
} from '../../apps/web/src/lib/voiceRoom.ts';

const roomPage = readFileSync(new URL('../../apps/web/src/app/ruang-ngobrol/page.tsx', import.meta.url), 'utf8');
const chatRoute = readFileSync(new URL('../../apps/web/src/app/api/chat/route.ts', import.meta.url), 'utf8');
const nextConfig = readFileSync(new URL('../../apps/web/next.config.js', import.meta.url), 'utf8');

describe('Ruang Ngobrol safe turn controller', () => {
  it('accepts only the explicit turn-state transitions', () => {
    assert.equal(canTransitionVoiceRoom('IDLE', 'LISTENING'), true);
    assert.equal(canTransitionVoiceRoom('LISTENING', 'PROCESSING'), true);
    assert.equal(canTransitionVoiceRoom('PROCESSING', 'SPEAKING'), true);
    assert.equal(canTransitionVoiceRoom('SPEAKING', 'LISTENING'), true);
    assert.equal(canTransitionVoiceRoom('LISTENING', 'SPEAKING'), false);
    assert.equal(canTransitionVoiceRoom('PROCESSING', 'LISTENING'), false);
  });

  it('screens a final crisis transcript before any room request can be prepared', () => {
    const screened = screenVoiceRoomFinalTranscript('  Aku mau bunuh diri  ', '18-24');
    assert.equal(screened.transcript, 'Aku mau bunuh diri');
    assert.equal(screened.isCrisis, true);
  });

  it('keeps the server crisis gate authoritative for a bypassed client request', () => {
    const result = runCrisisGate('Aku mau bunuh diri', '18-24');
    assert.equal(result.cleared, false);
    assert.equal(result.evaluation.isCrisis, true);
  });

  it('bounds in-memory captions and history without a persistence API', () => {
    let captions = [];
    for (let index = 0; index < VOICE_ROOM_MAX_CAPTIONS + 2; index += 1) {
      captions = appendVoiceRoomCaption(captions, {
        id: String(index),
        sender: index % 2 === 0 ? 'user' : 'assistant',
        text: `turn ${index}`,
      });
    }
    assert.equal(captions.length, VOICE_ROOM_MAX_CAPTIONS);
    assert.equal(voiceRoomHistory(captions).length <= 6, true);
    assert.doesNotMatch(roomPage, /localStorage|sessionStorage|indexedDB|saveAnonymousSession/);
  });

  it('only resumes listening from a current, active, unmuted speaking turn', () => {
    assert.equal(shouldResumeVoiceRoomListening({
      sessionActive: true, muted: false, currentGeneration: true, state: 'SPEAKING',
    }), true);
    assert.equal(shouldResumeVoiceRoomListening({
      sessionActive: true, muted: true, currentGeneration: true, state: 'SPEAKING',
    }), false);
    assert.equal(shouldResumeVoiceRoomListening({
      sessionActive: false, muted: false, currentGeneration: true, state: 'SPEAKING',
    }), false);
  });

  it('allows only known validated action text to reach the room display/TTS boundary', () => {
    assert.equal(validatedActionDisplayText({ action: 'chat', message: 'Respons yang sudah aman.' }), 'Respons yang sudah aman.');
    assert.equal(validatedActionDisplayText({ action: 'unknown', message: 'raw output' }), null);
    assert.equal(validatedActionDisplayText({ action: 'chat', message: '' }), null);
  });

  it('keeps final-turn client screening before the existing same-origin chat request', () => {
    const screeningIndex = roomPage.indexOf('const screening = screenVoiceRoomFinalTranscript');
    const crisisStopIndex = roomPage.indexOf('if (screening.isCrisis)');
    const fetchIndex = roomPage.indexOf("fetch('/api/chat'");
    assert.ok(screeningIndex >= 0 && crisisStopIndex > screeningIndex && fetchIndex > crisisStopIndex);
    assert.match(roomPage, /routeToCrisis\(\);\s*return;/);
    assert.doesNotMatch(roomPage, /generativelanguage\.googleapis\.com|WebSocket|api\/live\/token|NEXT_PUBLIC_GEMINI/);
  });

  it('terminates the voice cycle when the authoritative server crisis response arrives', () => {
    const serverCrisisIndex = roomPage.indexOf('if (json?.data?.crisis)');
    const routeIndex = roomPage.indexOf('routeToCrisis();', serverCrisisIndex);
    assert.ok(serverCrisisIndex >= 0 && routeIndex > serverCrisisIndex);
  });

  it('uses no-store room requests while retaining the existing server safety order', () => {
    assert.match(roomPage, /noStore:\s*true/);
    const gateInvocation = chatRoute.indexOf('const { cleared, evaluation } = runCrisisGate');
    const orchestratorInvocation = chatRoute.indexOf('result = await runOrchestrator');
    assert.ok(gateInvocation >= 0 && gateInvocation < orchestratorInvocation);
    assert.ok(gateInvocation < chatRoute.indexOf('const cacheEnabled'));
    assert.match(chatRoute, /if \(cacheKey\) await writeAiCache/);
  });

  it('has explicit end cleanup and prevents stale callbacks from restarting resources', () => {
    assert.match(roomPage, /generationRef\.current \+= 1/);
    assert.match(roomPage, /speechGenerationRef\.current \+= 1/);
    assert.match(roomPage, /stopRecognition\(true\)/);
    assert.match(roomPage, /cancelSpeech\(/);
    assert.match(roomPage, /requestAbortRef\.current\?\.abort\(\)/);
    assert.match(roomPage, /generation !== generationRef\.current/);
  });

  it('requires explicit privacy acknowledgement and keeps the ten-minute cap', () => {
    assert.match(roomPage, /if \(!hasAcknowledgedDisclosure\)/);
    assert.match(roomPage, /BROWSER_VOICE_PRIVACY_DISCLOSURE/);
    assert.match(roomPage, /VOICE_ROOM_MAX_SESSION_MS/);
    assert.equal(VOICE_ROOM_MAX_SESSION_MS, 600000);
  });

  it('adds microphone permission only to the room route and leaves CSP provider-free', () => {
    assert.match(nextConfig, /source: '\/ruang-ngobrol'[\s\S]*microphone=\(self\)/);
    assert.doesNotMatch(nextConfig, /generativelanguage\.googleapis\.com|wss:/);
  });

  it('contains no gamification mutation or reward import', () => {
    assert.doesNotMatch(roomPage, /awardLangkah|gamification|badge|streak|completeTodayMission/);
    assert.doesNotMatch(roomPage, /<Link[^>]*>\s*<Button/i);
  });
});
