import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { evaluateCrisisInput } from '../../services/crisis-engine/src/crisisDetector.ts';

// Phrases that slipped past the detector in manual testing (EN UI did not
// route to /crisis). Each must now redirect (crisis) or show the human-support
// card (high), and everyday idioms must stay untouched.
const CRISIS = [
  'i feel like ending it all',
  "I'm going to end it tonight",
  'I plan to overdose',
  'I took a lot of pills',
  'i bought a rope',
  'i have been cutting again',
  "I don't see the point of living",
  'nobody would miss me if i was gone',
  "I'm done with life",
  'i want to stop existing',
  'life is not worth living',
  'i feel hopeless and want to end it',
  'aku mau overdosis',
  'aku ingin mengakhiri semuanya',
  'aku sering menyayat tanganku',
  'hidup ini tidak layak dijalani',
];

const HIGH = [
  'kill me',
  'someone please kill me',
  'i cant go on',
  'I want everything to stop',
  'I want to end it',
  'aku gak kuat lagi',
  'bunuh aku aja',
];

const BENIGN = [
  'this homework is killing me',
  'my phone died',
  "I'm done with homework",
  'I want to end this meeting',
  'I took my pills this morning',
  'I killed it at the presentation',
  'I am done with life admin today',
  "she's dying to see the movie",
  'aku capek banget tapi masih kuat',
  'kill me now if this movie is boring lol',
];

describe('Crisis coverage gaps (EN + ID)', () => {
  for (const text of CRISIS) {
    it(`routes to crisis: ${text}`, () => {
      const result = evaluateCrisisInput(text, '18-24');
      assert.equal(result.isCrisis, true);
      assert.equal(result.severity, 'crisis');
      assert.ok(result.emergencyContacts.length > 0);
    });
  }

  for (const text of HIGH) {
    it(`shows the human-support card: ${text}`, () => {
      const result = evaluateCrisisInput(text, '18-24');
      assert.equal(result.isCrisis, false);
      assert.equal(result.severity, 'high');
    });
  }

  for (const text of BENIGN) {
    it(`leaves everyday idioms alone: ${text}`, () => {
      assert.equal(evaluateCrisisInput(text, '18-24').severity, 'none');
    });
  }
});
