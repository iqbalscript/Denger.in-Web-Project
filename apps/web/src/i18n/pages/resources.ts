import type { TextBundle } from '../language';

const id = {
  back: 'Kembali ke beranda',
  filtersAria: 'Pencarian dan filter layanan',
  badge: 'Daftar bantuan resmi',
  title: 'Bantuan profesional dan kontak darurat Indonesia',
  intro:
    'Minta bantuan bukan tanda lemah, itu tanda kamu peduli pada dirimu. Ada orang yang siap mendengarkan dan menemanimu. Semua kontak di bawah ini lembaga resmi, yayasan nirlaba yang sudah dicek, atau lembaga negara.',
  searchLabel: 'Cari layanan',
  searchPlaceholder: 'Contoh: psikolog, pinjol, remaja',
  filterLabel: 'Saring menurut jenis layanan',
  filterAria: 'Filter jenis layanan',
  categories: {
    all: 'Semua layanan',
    national_emergency: 'Darurat nasional',
    crisis_hotline: 'Pencegahan krisis',
    teen_protection: 'Khusus remaja (15-17 tahun)',
    financial_advocacy: 'Soal pinjol dan keuangan',
  },
  listAria: 'Daftar layanan bantuan',
  emptyTitle: 'Belum ada layanan yang cocok',
  emptyBodyA: 'Coba kata lain atau pilih "Semua layanan". Kalau kamu butuh bantuan sekarang, hubungi Healing119 (Kemenkes) di',
  callLabel: 'Telepon',
  callAria: (name: string, phone: string) => `Telepon ${name}: ${phone}`,
  whatsappAria: (name: string, number: string) => `WhatsApp ${name}: ${number}`,
  websiteAria: (name: string) => `Buka situs resmi ${name} (tab baru)`,
  website: 'Situs',
};

const en: typeof id = {
  back: 'Back to home',
  filtersAria: 'Search and filter services',
  badge: 'Official help directory',
  title: 'Professional help and emergency contacts in Indonesia',
  intro:
    'Asking for help is not weakness, it shows you care about yourself. There are people ready to listen and stand by you. Every contact below is an official body, a verified non-profit, or a government agency.',
  searchLabel: 'Search services',
  searchPlaceholder: 'Example: psychologist, online loans, teens',
  filterLabel: 'Filter by type of service',
  filterAria: 'Service type filter',
  categories: {
    all: 'All services',
    national_emergency: 'National emergency',
    crisis_hotline: 'Crisis prevention',
    teen_protection: 'For teens (ages 15-17)',
    financial_advocacy: 'Online loans and money',
  },
  listAria: 'List of help services',
  emptyTitle: 'No matching services yet',
  emptyBodyA: 'Try another word or choose "All services". If you need help right now, call Healing119 (Ministry of Health) at',
  callLabel: 'Call',
  callAria: (name: string, phone: string) => `Call ${name}: ${phone}`,
  whatsappAria: (name: string, number: string) => `WhatsApp ${name}: ${number}`,
  websiteAria: (name: string) => `Open the official ${name} website (new tab)`,
  website: 'Website',
};

export const resourcesText: TextBundle<typeof id> = { id, en };
