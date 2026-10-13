import type { HelpDestination, HelpDestinationId } from '@dengarin/config';
import type { Language } from '../language';

/**
 * Teks Inggris untuk tujuan bantuan (packages/config/src/helpDestinations.ts).
 * Data config tetap Indonesia (dipakai validator, prompt, dan tes). Di sini
 * hanya pemetaan per id; fakta, angka, dan peringatan sama persis. Daftar
 * periksa dipetakan per indeks, jadi urutannya harus sama dengan config.
 */

interface DestinationCopy {
  label: string;
  description: string;
  checklist: string[];
  caveat: string;
}

const EN: Record<HelpDestinationId, DestinationCopy> = {
  fktp: {
    label: 'Puskesmas / primary-care doctor',
    description: 'A general practitioner at a puskesmas (community health centre) or BPJS clinic. The first door if you want a referral to a psychologist or mental-health clinic.',
    checklist: [
      'Bring your BPJS/KIS card, ID card (KTP), and family card (KK). Make sure your BPJS membership is active with no arrears.',
      'Ask whether this puskesmas or clinic has a mental-health clinic or psychologist.',
      'If not, ask for a referral letter to a hospital with mental-health services.',
      'If a professional has treated you before, bring any notes or letters you have.',
      'The Ministry of Health recommends a mental-health screening at least once a year at the puskesmas. You may ask for one.',
      'Bring these notes. You may read them out or show them if it is hard to say.',
      'Not every puskesmas has mental-health services yet. If yours does not, that is not your fault.',
    ],
    caveat: 'Referral rules can differ by region and can change. Check directly with your primary-care provider. We do not state how long a referral letter is valid because we could not confirm it.',
  },
  psikolog: {
    label: 'Psychologist',
    description: 'A first session with a psychologist, through a BPJS referral or a private service.',
    checklist: [
      'If going through BPJS, start at primary care for a referral letter. Without a referral, psychologist services are usually paid.',
      'Bring your BPJS/KIS card, ID card (KTP), family card (KK), and the referral letter if going through BPJS.',
      'Bring these notes. A first session usually involves many questions, so notes help you not forget.',
      'Ask at the start: how long a session is, the cost, and whether you can continue regularly.',
      'It is fine to say you do not know where to start. That is normal in a first session.',
    ],
    caveat: 'We do not state private service fees because the figures could not be confirmed for 2025 to 2026. Ask the service directly.',
  },
  healing119: {
    label: 'Healing119 (Ministry of Health)',
    description: 'Initial psychological support from the Ministry of Health by phone or chat. Free and anonymous.',
    checklist: [
      'Call 119, then press extension 8. Or open www.healing119.id and choose the WhatsApp button.',
      'Free. Anonymous, not face to face.',
      'Service hours: morning to night, not 24 hours. Check the website for the latest hours.',
      'What you get is initial psychological support, not therapy. The counsellor can help open a referral to professional services.',
      'The phone queue can be long. The Ministry of Health suggests the chat or call route through the website.',
      'If using chat, you can paste the opening lines above directly.',
    ],
    caveat: 'We do not list the WhatsApp number here because it was only found in the media, not on the official page. Take it from the healing119.id website directly.',
  },
  kampus: {
    label: 'Campus / workplace counsellor',
    description: 'The campus counselling unit or the employee assistance programme at work.',
    checklist: [
      'Find the unit’s name first: usually the "psychology service unit", "counselling centre", or "EAP" at work.',
      'Ask about confidentiality: what is recorded, who can see it, and whether it is linked to academic grades or HR.',
      'Ask whether they can refer you to a psychologist or psychiatrist outside the campus or office if needed.',
      'Bring these notes. You may read them out if it is hard to say.',
    ],
    caveat: 'There is no uniform national rule for campus or workplace counselling that we could verify. The points above are general advice; each place can differ.',
  },
};

const SOURCE_LABEL_EN: Record<string, string> = {
  'kemenkes-healing119-2025': 'Ministry of Health (Public Health Directorate), 7 Aug 2025',
  'healing119-site': 'Official healing119.id website',
  'detik-healing119-2025': 'detikHealth quoting the Ministry of Health, 2 Sep 2025',
  'cnn-bpjs-psikolog-2025': 'CNN Indonesia, 1 Aug 2025 (media, not a BPJS document)',
  'kemenkes-skrining-2024': 'Ministry of Health, 25 Oct 2024',
  'kemenkes-jejaring-2022': 'Ministry of Health, 10 Oct 2022',
  'mind-uk-gp-guide': 'Mind guide (UK), not an Indonesian rule',
};

export interface LocalizedHelpDestination {
  label: string;
  description: string;
  caveat: string;
  checklist: Array<{ text: string; sourceIds: string[]; unverified?: boolean }>;
  sources: Array<{ id: string; label: string; url: string; kind: 'official' | 'media' | 'guide' }>;
}

/** Tujuan bantuan sesuai bahasa; id yang tidak dikenal kembali ke teks config. */
export function localizedHelpDestination(destination: HelpDestination, lang: Language): LocalizedHelpDestination {
  const copy = lang === 'en' ? EN[destination.id] : undefined;
  return {
    label: copy?.label ?? destination.label,
    description: copy?.description ?? destination.description,
    caveat: copy?.caveat ?? destination.caveat,
    checklist: destination.checklist.map((item, index) => ({
      text: copy?.checklist[index] ?? item.text,
      sourceIds: item.sourceIds,
      unverified: item.unverified,
    })),
    sources: destination.sources.map((source) => ({
      id: source.id,
      label: lang === 'en' ? SOURCE_LABEL_EN[source.id] ?? source.label : source.label,
      url: source.url,
      kind: source.kind,
    })),
  };
}
