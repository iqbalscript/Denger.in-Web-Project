import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCrisisInput } from '../../services/crisis-engine/src/crisisDetector.ts';
import { screenChatContext } from '../../apps/web/src/lib/api/chatHistory.ts';
import { runCrisisGate, buildSupportPathway } from '../../apps/web/src/lib/api/crisisGate.ts';
import { screenVoiceRoomFinalTranscript } from '../../apps/web/src/lib/voiceRoom.ts';
import { crisisGuardReducer, INITIAL_CRISIS_GUARD_STATE, isSubmitAllowed } from '../../apps/web/src/lib/crisisGuard.ts';

/**
 * English coverage of the deterministic crisis engine (UI language EN).
 * Every English input below must route to crisis exactly like its Indonesian
 * counterpart, through the same engine and the same gates. Synthetic inputs.
 */

const ENGLISH_CRISIS = [
  // explicit suicidal ideation
  { text: 'I want to kill myself tonight', domain: 'suicide' },
  { text: 'i am going to end my life', domain: 'suicide' },
  { text: "I'm thinking about suicide", domain: 'suicide' },
  { text: 'I feel suicidal and I cannot stop it', domain: 'suicide' },
  { text: 'I will take my own life this weekend', domain: 'suicide' },
  { text: 'I just want to end it all', domain: 'suicide' },
  { text: 'honestly i want to unalive myself', domain: 'suicide' },
  // death wish
  { text: 'I want to die', domain: 'suicide' },
  { text: 'i wanna be dead', domain: 'suicide' },
  { text: 'I wish I was dead', domain: 'suicide' },
  { text: 'everyone would be better off without me', domain: 'extreme_hopelessness' },
  { text: "I don't want to live anymore", domain: 'suicide' },
  { text: 'I don’t want to wake up anymore', domain: 'suicide' },
  { text: 'there is no reason to live', domain: 'suicide' },
  // self-harm
  { text: 'I want to hurt myself', domain: 'self_harm' },
  { text: 'I keep cutting myself at night', domain: 'self_harm' },
  { text: 'I have been self harming again', domain: 'self_harm' },
  { text: 'I am going to slit my wrists', domain: 'self_harm' },
  // intent / plan / lethal means
  { text: 'I am going to hang myself', domain: 'self_harm' },
  { text: 'I will take an overdose tonight', domain: 'self_harm' },
  { text: 'thinking of jumping off the bridge', domain: 'self_harm' },
  { text: 'I plan to swallow all my pills', domain: 'self_harm' },
  // farewell
  { text: 'goodbye everyone, this is my last message', domain: 'extreme_hopelessness' },
  { text: 'I wrote my suicide note already', domain: 'suicide' },
  { text: 'I just want to sleep forever', domain: 'extreme_hopelessness' },
];

const ENGLISH_HIGH = [
  "I can't take this anymore",
  'I feel completely hopeless',
  'I hate my life and nothing matters anymore',
];

const ENGLISH_CALM = [
  'I am so tired of my thesis this week',
  'my boss is toxic and I feel burnt out',
  'I just broke up with my girlfriend and feel empty',
  'the battery on my phone died again',
  'my plants died because I forgot to water them',
  'I killed it at the presentation today',
  'that joke killed me, so funny',
  'I need to kill time before class',
  'dying to see the new movie this weekend',
  'deadline tomorrow and I am stressed',
];

const INDONESIAN_EQUIVALENTS = [
  ['Aku mau bunuh diri malam ini', 'I want to kill myself tonight'],
  ['Aku ingin mengakhiri hidupku', 'I want to end my life'],
  ['Aku pengen mati', 'I want to die'],
  ['Aku akan menyakiti diriku', 'I am going to hurt myself'],
  ['Aku mau gantung diri', 'I am going to hang myself'],
  ['Aku ingin tidur selamanya', 'I want to sleep forever'],
];

describe('English crisis coverage (same engine, same gates)', () => {
  for (const { text, domain } of ENGLISH_CRISIS) {
    it(`routes English high-risk input: "${text}"`, () => {
      const result = evaluateCrisisInput(text, '18-24');
      assert.equal(result.isCrisis, true, text);
      assert.equal(result.severity, 'crisis');
      assert.equal(result.matchedDomain, domain);
      assert.ok(result.emergencyContacts.length > 0);
      assert.ok(result.triggeredPatterns.some((id) => id.startsWith('en-')));
    });
  }

  for (const text of ENGLISH_HIGH) {
    it(`flags English high distress without halting the AI: "${text}"`, () => {
      const result = evaluateCrisisInput(text, '18-24');
      assert.equal(result.isCrisis, false);
      assert.equal(result.severity, 'high');
      assert.ok(buildSupportPathway(result, 'en'));
    });
  }

  for (const text of ENGLISH_CALM) {
    it(`does not falsely trigger on benign English: "${text}"`, () => {
      assert.equal(evaluateCrisisInput(text, '18-24').isCrisis, false, text);
    });
  }

  for (const [indonesian, english] of INDONESIAN_EQUIVALENTS) {
    it(`"${english}" routes exactly like "${indonesian}"`, () => {
      const a = evaluateCrisisInput(indonesian, '18-24');
      const b = evaluateCrisisInput(english, '18-24');
      assert.equal(a.isCrisis, true);
      assert.equal(b.isCrisis, a.isCrisis);
      assert.equal(b.severity, a.severity);
      assert.deepEqual(b.emergencyContacts.map((c) => c.id), a.emergencyContacts.map((c) => c.id));
    });
  }

  it('keeps the Indonesian corpus unchanged (no weakening)', () => {
    for (const text of ['Aku mau bunuh diri', 'Aku ingin mengakhiri hidupku malam ini', 'pengen bundir rasanya', 'Aku akan melukai diriku besok']) {
      assert.equal(evaluateCrisisInput(text).isCrisis, true, text);
    }
    for (const text of ['Aku tidak mau bunuh diri', 'Lampu kamar mati', 'Di berita itu dia mau mati']) {
      assert.equal(evaluateCrisisInput(text).isCrisis, false, text);
    }
  });

  it('exempts only whole-sentence English denial or a clearly third-person story', () => {
    assert.equal(evaluateCrisisInput("I don't want to kill myself.").isCrisis, false);
    assert.equal(evaluateCrisisInput('In the movie the character killed himself.').isCrisis, false);
    // Mixed statements take the safer path, exactly like the Indonesian rule.
    assert.equal(evaluateCrisisInput("I don't want to kill myself but I want to die tonight").isCrisis, true);
    assert.equal(evaluateCrisisInput('In the movie the character killed himself and I want to die too').isCrisis, true);
  });

  it('catches leetspeak, spacing and apostrophe variants', () => {
    assert.equal(evaluateCrisisInput('k1ll mys3lf').isCrisis, true);
    assert.equal(evaluateCrisisInput('I want to   die').isCrisis, true);
    assert.equal(evaluateCrisisInput('I don’t want to live anymore').isCrisis, true);
  });

  it('catches mixed Indonesian and English in one message', () => {
    assert.equal(evaluateCrisisInput('aku capek banget, I want to die').isCrisis, true);
    assert.equal(evaluateCrisisInput('honestly aku mau bunuh diri').isCrisis, true);
  });

  it('gives English intervention copy only when lang is en; contacts stay identical', () => {
    const id = evaluateCrisisInput('I want to die', '15-17');
    const en = evaluateCrisisInput('I want to die', '15-17', 'en');
    assert.match(id.immediateInterventionCopy, /perlindungan remaja/);
    assert.match(en.immediateInterventionCopy, /Healing119/);
    assert.doesNotMatch(en.immediateInterventionCopy, /Kami/);
    assert.deepEqual(en.emergencyContacts, id.emergencyContacts);
    assert.ok(en.emergencyContacts.some((c) => c.id === 'tepsa-kemensos'));
  });
});

describe('English crisis text reaches every gate the Indonesian text reaches', () => {
  it('chat history screen halts on English crisis in any position', () => {
    assert.equal(screenChatContext('Halo', [{ sender: 'user', text: 'I want to kill myself' }]).evaluation?.isCrisis, true);
    assert.equal(screenChatContext('I want to die', []).evaluation?.isCrisis, true);
    assert.equal(screenChatContext('Hi', [{ sender: 'assistant', text: 'I want to die' }]).evaluation?.isCrisis, true);
  });

  it('server crisis gate blocks English crisis and localises the high-distress pathway', () => {
    assert.equal(runCrisisGate('I want to end my life', '18-24', 'en').cleared, false);
    const high = runCrisisGate("I can't take this anymore", '18-24', 'en');
    assert.equal(high.cleared, true);
    assert.equal(high.supportPathway?.title, 'Want to talk to a trained person too?');
    assert.deepEqual(high.supportPathway?.links.map((l) => l.href).sort(), ['/crisis', '/resources']);
    assert.doesNotMatch(`${high.supportPathway?.title} ${high.supportPathway?.message}`, /[–—]/);
    assert.equal(runCrisisGate("I can't take this anymore", '18-24').supportPathway?.title, 'Mau ngobrol juga dengan orang terlatih?');
  });

  it('voice room final-transcript screen and inline guard treat English like Indonesian', () => {
    assert.equal(screenVoiceRoomFinalTranscript('  I want to hurt myself  ', '18-24').isCrisis, true);
    const match = (text) => {
      const r = evaluateCrisisInput(text, '18-24');
      return { isCrisis: r.isCrisis, emergencyContacts: r.emergencyContacts };
    };
    const state = crisisGuardReducer(INITIAL_CRISIS_GUARD_STATE, { type: 'text_evaluated', match: match('i want to die') });
    assert.equal(state.isCrisis, true);
    assert.equal(state.cardVisible, true);
    assert.equal(isSubmitAllowed(match('i want to die')), false);
    assert.equal(isSubmitAllowed(match('a calm english day')), true);
  });
});
