import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCrisisInput } from '../../services/crisis-engine/src/crisisDetector.ts';
import { EMERGENCY_CONTACTS } from '../../packages/config/src/index.ts';

/**
 * Two hotline catalogs exist on purpose (the crisis engine must stay free of
 * app-level imports), so they can drift apart. The API crisis response
 * (chat/forum) is built from the engine list while /crisis and /resources
 * render the config list; a user must never see two different numbers or
 * hours for the same service depending on which screen they hit.
 */
const engineContacts = evaluateCrisisInput('aku mau bunuh diri', '18-24').emergencyContacts
  .concat(evaluateCrisisInput('aku mau bunuh diri', '15-17').emergencyContacts);

const byId = (list) => new Map(list.map((c) => [c.id, c]));

describe('emergency contact catalogs stay consistent', () => {
  it('every engine contact exists in config with identical reachability data', () => {
    const config = byId(EMERGENCY_CONTACTS);
    const seen = new Set();
    for (const contact of engineContacts) {
      if (seen.has(contact.id)) continue;
      seen.add(contact.id);
      const twin = config.get(contact.id);
      assert.ok(twin, `engine contact ${contact.id} missing from packages/config (ids must match)`);
      for (const field of ['name', 'phone', 'whatsapp', 'website', 'availableHours', 'cost', 'category']) {
        assert.equal(contact[field], twin[field], `${contact.id}.${field} drifted from config ${twin.id}`);
      }
    }
  });

  it('no catalog still points at the dead sejiwa.kemkes.go.id host', () => {
    for (const contact of [...engineContacts, ...EMERGENCY_CONTACTS]) {
      assert.doesNotMatch(contact.website ?? '', /sejiwa\.kemkes\.go\.id/);
    }
  });

  it('no catalog uses the retired "Sejiwa" branding or claims 24-hour Healing119 service', () => {
    for (const contact of [...engineContacts, ...EMERGENCY_CONTACTS]) {
      assert.doesNotMatch(`${contact.id} ${contact.name} ${contact.description}`, /sejiwa/i);
      if (contact.phone === '119 ext 8') {
        assert.doesNotMatch(contact.availableHours, /24/, 'no official Kemenkes source confirms 24/7');
        assert.match(contact.name, /Healing119/);
      }
    }
  });

  it('every contact is reachable by phone or WhatsApp', () => {
    for (const contact of [...engineContacts, ...EMERGENCY_CONTACTS]) {
      assert.ok(contact.phone || contact.whatsapp, `${contact.id} has no phone or WhatsApp`);
    }
  });

  it('119 ext 8 is present, free, and listed first for every age bracket', () => {
    for (const bracket of ['15-17', '18-24', '18-29', '25-34', '30-49', '35-54', '50+']) {
      const result = evaluateCrisisInput('aku mau bunuh diri', bracket);
      assert.equal(result.isCrisis, true);
      assert.equal(result.emergencyContacts[0]?.phone, '119 ext 8', `bracket ${bracket}`);
      assert.equal(result.emergencyContacts[0]?.cost, 'gratis');
    }
    assert.equal(EMERGENCY_CONTACTS[0].phone, '119 ext 8');
  });

  it('teen bracket receives the child-protection line, adults do not', () => {
    const teen = evaluateCrisisInput('aku mau bunuh diri', '15-17').emergencyContacts;
    const adult = evaluateCrisisInput('aku mau bunuh diri', '25-34').emergencyContacts;
    assert.ok(teen.some((c) => c.category === 'teen_protection'));
    assert.ok(!adult.some((c) => c.category === 'teen_protection'));
  });

  it('an unknown caller-supplied age bracket still yields the full contact list', () => {
    const result = evaluateCrisisInput('aku mau bunuh diri', 'not-a-bracket');
    assert.equal(result.isCrisis, true);
    assert.ok(result.emergencyContacts.length >= 3, 'crisis result must never ship with zero contacts');
    assert.equal(result.emergencyContacts[0].phone, '119 ext 8');
  });
});
