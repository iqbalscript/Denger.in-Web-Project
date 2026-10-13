import type {
  AdaptiveAssessmentQuestion,
  AgeBracket,
  AssessmentQuestion,
  DailyMission,
  InterventionDomain,
  TopicPillarId,
} from '@dengarin/types';
import {
  AGE_BRACKET_CONFIGS,
  DOMAIN_CONFIGS,
  OCCUPATION_OPTIONS,
  PRD_AGE_BRACKET_CONFIGS,
  TOPIC_PILLARS,
} from '@dengarin/config';
import type { Language } from './language';

/**
 * Teks Inggris untuk katalog di packages/config (pertanyaan asesmen, kelompok
 * usia, pekerjaan, domain, pilar topik, misi harian). Data config tetap
 * Indonesia (dipakai server, tes, dan fallback); di sini hanya pemetaan
 * per id. Bila id tidak dikenal atau bahasa 'id', nilai asli yang dikembalikan.
 */

const MISSIONS_EN: Record<string, Pick<DailyMission, 'title' | 'summary' | 'steps' | 'reflectionQuestion'>> = {
  'mission-school-1': {
    title: 'Calm Down Before Studying',
    summary: 'Ease the nerves before an exam or a pile of homework.',
    steps: [
      'Close the book or screen for a moment, relax your shoulders and jaw.',
      'Breathe in slowly for a count of 4, hold for 4, breathe out for 4, then hold again for 4. Repeat 3 times.',
      'Pick the one small task that is most urgent. Do that first for 25 minutes; the rest can wait.',
    ],
    reflectionQuestion: 'What is the one small task you will finish first after this?',
  },
  'mission-campus-1': {
    title: 'Untangle Your Thesis & Assignments',
    summary: 'Help for when your mind is stuck and overwhelmed by lecturers or revisions.',
    steps: [
      'Take a sheet of paper and write down the 1 main thing that makes you put off your thesis or assignment.',
      'Break it into one tiny action (for example: find 1 reference or write just 1 paragraph).',
      'Drink a glass of water. Small progress is still progress.',
    ],
    reflectionQuestion: 'What small sentence can you write for your assignment today?',
  },
  'mission-work-1': {
    title: 'Set Limits for Work',
    summary: 'Protect your mind from office demands and piled-up exhaustion (burnout).',
    steps: [
      'Mark the end of your workday: take 3 long breaths, then tell yourself, "today\'s work is enough".',
      'Leave non-urgent work messages until tomorrow\'s working hours.',
      'Tell yourself: "My work matters, but my mental health comes first."',
    ],
    reflectionQuestion: 'How do you feel after giving work a pause today?',
  },
  'mission-finance-1': {
    title: 'Calm the Money Worries',
    summary: 'Settle your mind when money or debt makes you anxious.',
    steps: [
      'Take a long breath. Remind yourself: "My finances are not the measure of my worth."',
      'Write down what must be paid and what can wait. No need to blame yourself.',
      'If illegal online-loan collectors are harassing you, keep the evidence. The official OJK line at 157 is there to protect you.',
    ],
    reflectionQuestion: 'What is one thing within your control today that could help you feel a little calmer?',
  },
  'mission-relationship-1': {
    title: 'Write the Letter You Will Not Send',
    summary: 'Ease the emotions of heartbreak, a fight, or a misunderstanding.',
    steps: [
      'Hold back: do not send a message or post anything while emotions are still hot.',
      'Write out all your disappointment, anger, or sadness as freely as you like in your private notes.',
      'Keep or tear up the note as a sign that you have let that weight go.',
    ],
    reflectionQuestion: 'Which emotion feels strongest in you right now?',
  },
  'mission-family-1': {
    title: 'Quiet Time When Home Feels Tense',
    summary: 'Give yourself a break from the demands or tension at home.',
    steps: [
      'Find a quiet spot (your room, the porch, or a short walk) to be alone for 5 minutes.',
      'Remember, you are not responsible for fixing everyone\'s mood at home.',
      'Look after your body: make sure you have eaten and had enough to drink today.',
    ],
    reflectionQuestion: 'What simple thing can you do to care for yourself today?',
  },
  'mission-loneliness-1': {
    title: 'Reconnect, Slowly',
    summary: 'Ease the loneliness with small steps to reconnect.',
    steps: [
      'Open a window or step outside for a moment, feel the air and the light for 2 minutes.',
      'Send one short, honest message to a friend, or greet someone with a smile.',
      'Remember, millions of other people feel lonely right now too. You are not strange.',
    ],
    reflectionQuestion: 'Who is the one person who comes to mind as you read this?',
  },
  'mission-general-1': {
    title: 'Slow Breath & Notice Your Surroundings',
    summary: 'Calm your body when your mind feels full and messy.',
    steps: [
      'Sit comfortably with your back straight. Breathe in through your nose for a count of 4.',
      'Hold your breath for a count of 7, without tensing up.',
      'Breathe out slowly through your mouth for a count of 8. Repeat 3 to 4 times.',
      'Name 3 objects around you that you can see clearly.',
    ],
    reflectionQuestion: 'Does your chest or head feel a little lighter now?',
  },
};

const DOMAINS_EN: Record<InterventionDomain, { label: string; description: string }> = {
  school: { label: 'School & Exams', description: 'Study pressure at high school, university entrance exams, or trouble with friends.' },
  campus: { label: 'Campus Life', description: 'Piled-up assignments, a thesis, living away from home, or doubts about your major.' },
  work: { label: 'Work Pressure', description: 'Burnout, trouble with a boss or coworkers, chasing targets, or career worries.' },
  finance: { label: 'Money Pressure', description: 'Debt worries, illegal online-loan harassment, supporting family, or the cost of living.' },
  relationship: { label: 'Relationships & Love', description: 'Heartbreak, a breakup, fights with a partner, or loneliness.' },
  family: { label: 'Family Matters', description: 'Parents\' expectations, arguments at home, or the weight of caregiving.' },
  loneliness: { label: 'Loneliness', description: 'Feeling you have no one to talk to, or alone even around people.' },
  general: { label: 'General Worries', description: 'Feeling overwhelmed without knowing why yet, and that is fine too.' },
};

const AGE_EN: Record<AgeBracket, { label: string; subtext: string; rationale: string }> = {
  '15-17': {
    label: '15-17 years',
    subtext: 'High school student (extra protection for minors)',
    rationale: 'Teen-friendly language and child-specific emergency contacts (TePSA and KPAI).',
  },
  '18-29': {
    label: '18-29 years',
    subtext: 'University student, fresh graduate, early career',
    rationale: 'Topics around becoming independent, study pressure, starting work, and finding yourself.',
  },
  '30-49': {
    label: '30-49 years',
    subtext: 'Employee, business owner, with family',
    rationale: 'Topics around providing for family, work pressure, and caring for children and parents at once.',
  },
  '50+': {
    label: '50+ years',
    subtext: 'Senior or nearing retirement (large text)',
    rationale: 'Larger text, a calm display with no time pressure, and topics around peace of mind.',
  },
  '18-24': { label: '18-24 years', subtext: 'University student, fresh graduate, early career', rationale: '' },
  '25-34': { label: '25-34 years', subtext: 'Employee, supporting family', rationale: '' },
  '35-54': { label: '35-54 years', subtext: 'Senior employee, household responsibilities', rationale: '' },
};

const OCCUPATIONS_EN: Record<string, string> = {
  pelajar: 'High school student',
  mahasiswa: 'University student',
  pekerja_kantor: 'Employee (private, state-owned, civil service)',
  wirausaha: 'Business owner or trader',
  pencari_kerja: 'Job seeker or fresh graduate',
  freelancer: 'Freelancer or creative worker',
  rumah_tangga: 'Homemaker',
  lainnya: 'Other, or prefer not to say',
};

const PILLARS_EN: Record<TopicPillarId, { label: string; tagline: string; description: string }> = {
  finance: {
    label: 'Money & Debt Pressure',
    tagline: 'Slowly easing the worry about living costs, instalments, and providing for family.',
    description: 'A safe place to talk about debt, loans, supporting your family, or worries about the future. No need to feel ashamed, and no one will judge you.',
  },
  trauma: {
    label: 'Inner Wounds & Trauma',
    tagline: 'Tending to old wounds, rejection, guilt, and deep grief, as slowly as you want.',
    description: 'Step-by-step support for painful memories or family matters that left a mark, at your own pace. You can stop at any time.',
  },
  sexual_violence: {
    label: 'Sexual Violence & Toxic Relationships',
    tagline: 'A private, respectful place to regain control over yourself.',
    description: 'We fully respect your decisions. Whatever happened, it was not your fault. Direct referrals to certified professional counsellors are available.',
  },
};

const GENERIC_QUESTIONS_EN: Record<string, { text: string; options: Record<number, string> }> = {
  'q1-strain': {
    text: 'In the last 7 days, how often did worries drain your energy?',
    options: { 0: 'Never', 1: 'Sometimes', 2: 'Quite often', 3: 'Almost all the time' },
  },
  'q2-impact': {
    text: 'How much does your current problem disturb your daily concentration?',
    options: { 0: 'Not at all', 1: 'A little', 2: 'Quite a lot', 3: 'It disrupts my daily activities' },
  },
  'q3-rest': {
    text: 'Do your thoughts make it hard to sleep, or leave you tired in the morning?',
    options: { 0: 'I sleep well enough', 1: 'I sometimes wake up or feel restless', 2: 'I often struggle to sleep', 3: 'I can barely sleep' },
  },
  'q4-agency': {
    text: 'How confident are you that you can sort this out step by step?',
    options: { 0: 'I still feel able', 1: 'Unsure, but still trying', 2: 'Very tired and struggling to see a way out', 3: 'Completely stuck and alone' },
  },
};

const ADAPTIVE_QUESTIONS_EN: Record<string, { text: string; subtext?: string; options: Record<string, string> }> = {
  'root-emotional-strain': {
    text: 'In the last 7 days, how often did worries drain your energy?',
    subtext: 'Pick the one closest to what you are going through.',
    options: {
      'opt-strain-0': 'Rarely, my mind is fairly calm',
      'opt-strain-1': 'Sometimes it feels heavy, but I can handle it',
      'opt-strain-2': 'Quite often it drains my focus and motivation',
      'opt-strain-3': 'Almost all the time it feels crushing and exhausting',
    },
  },
  'context-finance': {
    text: 'How much do money or debt worries disturb your sense of safety?',
    subtext: 'Your finances are not the measure of your worth.',
    options: {
      'opt-fin-0': 'Still under control, and I have a plan',
      'opt-fin-1': 'Quite worrying, but there is still a way out',
      'opt-fin-2': 'Often anxious about bills or tomorrow',
      'opt-fin-3': 'Feeling trapped, stuck, and overwhelmed',
    },
  },
  'context-trauma': {
    text: 'When painful memories come up, how strong is the tightness or unease?',
    subtext: 'You are safe here. You can skip this question without losing anything.',
    options: {
      'opt-tr-0': 'Rarely feels heavy and passes quickly',
      'opt-tr-1': 'Sometimes bothers me briefly, then I settle again',
      'opt-tr-2': 'Strong enough that my body tenses and I need a long break',
      'opt-tr-3': 'Very draining, I feel crushed or alone',
    },
  },
  'context-sexual-violence': {
    text: 'How heavy is the feeling of being unsafe or unable to trust others?',
    subtext: 'Your safety and your decisions come first. You can skip this question at any time.',
    options: {
      'opt-sv-0': 'I feel safe and can hold my boundaries',
      'opt-sv-1': 'Sometimes on guard, but I can still socialise',
      'opt-sv-2': 'Often feel unsafe and withdraw from people',
      'opt-sv-3': 'Feel very vulnerable, threatened, or unable to trust anyone',
    },
  },
  'context-general': {
    text: 'How much does your problem disturb your focus and calm right now?',
    subtext: 'Take a short pause to notice your body and your mind.',
    options: {
      'opt-gen-0': 'Not at all',
      'opt-gen-1': 'A little, but I can still get on with things',
      'opt-gen-2': 'Quite a lot, I often drift off or feel anxious',
      'opt-gen-3': 'So much that my daily routine is hard to keep up',
    },
  },
  'functioning-impact': {
    text: 'Do your thoughts make it hard to sleep, or leave you tired in the morning?',
    subtext: 'Sleep quality often shows how tense your body and mind are.',
    options: {
      'opt-func-0': 'I still sleep well and wake up refreshed',
      'opt-func-1': 'I sometimes wake up or feel restless before sleep',
      'opt-func-2': 'I often struggle to sleep and wake up still tired',
      'opt-func-3': 'I can barely sleep and my energy feels gone',
    },
  },
  'support-readiness': {
    text: 'What kind of support do you hope for most right now?',
    subtext: 'Your answer helps us suggest support that fits and does not weigh on you.',
    options: {
      'opt-supp-0': 'Gentle self-guided missions and a private journal',
      'opt-supp-1': 'Daily missions and the anonymous Story Room',
      'opt-supp-2': 'Guidance on managing emotions and the option of seeing a psychologist',
      'opt-supp-3': 'Straight to a professional or emergency help',
    },
  },
};

export function localizedMission(mission: DailyMission, lang: Language): DailyMission {
  if (lang !== 'en') return mission;
  const text = MISSIONS_EN[mission.id];
  return text ? { ...mission, ...text } : mission;
}

export function domainText(domain: InterventionDomain, lang: Language): { label: string; description: string } {
  const config = DOMAIN_CONFIGS[domain] ?? DOMAIN_CONFIGS.general;
  const en = lang === 'en' ? DOMAINS_EN[domain] : undefined;
  return en ?? { label: config.label, description: config.description };
}

export function ageBracketText(bracket: AgeBracket, lang: Language): { label: string; subtext: string } {
  if (lang === 'en' && AGE_EN[bracket]) return { label: AGE_EN[bracket].label, subtext: AGE_EN[bracket].subtext };
  const prd = (PRD_AGE_BRACKET_CONFIGS as Record<string, { label: string; subtext: string } | undefined>)[bracket];
  const config = prd ?? AGE_BRACKET_CONFIGS[bracket] ?? AGE_BRACKET_CONFIGS['18-29'];
  return { label: config.label, subtext: config.subtext };
}

export function ageBracketRationale(bracket: AgeBracket, lang: Language): string {
  if (lang === 'en' && AGE_EN[bracket]) return AGE_EN[bracket].rationale;
  const prd = (PRD_AGE_BRACKET_CONFIGS as Record<string, { rationale: string } | undefined>)[bracket];
  return prd?.rationale ?? '';
}

export function occupationText(id: string, lang: Language): string {
  if (lang === 'en' && OCCUPATIONS_EN[id]) return OCCUPATIONS_EN[id];
  return OCCUPATION_OPTIONS.find((option) => option.id === id)?.label ?? id;
}

export function topicPillarText(id: TopicPillarId, lang: Language): { label: string; tagline: string; description: string } {
  if (lang === 'en' && PILLARS_EN[id]) return PILLARS_EN[id];
  const config = TOPIC_PILLARS[id];
  return { label: config.label, tagline: config.tagline, description: config.description };
}

export function localizedAdaptiveQuestion(question: AdaptiveAssessmentQuestion, lang: Language): AdaptiveAssessmentQuestion {
  if (lang !== 'en') return question;
  const text = ADAPTIVE_QUESTIONS_EN[question.id];
  if (!text) return question;
  return {
    ...question,
    text: text.text,
    subtext: text.subtext ?? question.subtext,
    options: question.options.map((option) => ({ ...option, label: text.options[option.id] ?? option.label })),
  };
}

export function localizedGenericQuestion(question: AssessmentQuestion, lang: Language): AssessmentQuestion {
  if (lang !== 'en') return question;
  const text = GENERIC_QUESTIONS_EN[question.id];
  if (!text) return question;
  return {
    ...question,
    text: text.text,
    options: question.options?.map((option) => ({ ...option, label: text.options[option.value as number] ?? option.label })),
  };
}
