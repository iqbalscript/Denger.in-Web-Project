'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Heart,
  Coins,
  GraduationCap,
  Briefcase,
  Lock,
  PhoneCall,
  Clock,
  Shield,
} from 'lucide-react';
import { PageContainer, GlassCard, SoftCard, Button, Badge } from '@/components/ui';

export default function LandingPage() {
  const domains = [
    {
      icon: GraduationCap,
      title: 'Sekolah & Kampus',
      desc: 'Tekanan ujian masuk, skripsi, beban tugas, atau keraguan jurusan masa depan.',
    },
    {
      icon: Briefcase,
      title: 'Beban Pekerjaan',
      desc: 'Burnout, konflik kantor, jam kerja berlebih, atau kecemasan karir masa depan.',
    },
    {
      icon: Coins,
      title: 'Tekanan Finansial',
      desc: 'Kecemasan hutang, teror penagihan pinjol, atau beban generasi sandwich.',
    },
    {
      icon: Heart,
      title: 'Hubungan & Keluarga',
      desc: 'Patah hati, dinamika keluarga, ekspektasi orang tua, atau rasa kesepian.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. EDITORIAL HERO (Split layout with breathing room, NO giant outer card) */}
      <section className="pt-8 sm:pt-14">
        <PageContainer size="default">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-calm-100/90 border border-calm-200/80 text-calm-900 text-xs font-semibold shadow-soft-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-calm-700" />
                <span>Ruang Tenang & Pendamping Anonim</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-sand-900 tracking-tight leading-[1.12]">
                Ruang Aman untuk <br />
                <span className="text-calm-700">Meredakan Beban</span> Pikiranmu.
              </h1>

              <p className="text-base sm:text-lg text-sand-700 max-w-xl font-normal leading-relaxed">
                Dengar.in membantu kamu mengurai apa yang sebenarnya membebanimu — dari tekanan
                sekolah, karir, hingga jeratan finansial — melalui langkah kecil terarah dan
                pendampingan tanpa penghakiman.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link href="/consent">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={<ArrowRight className="w-4 h-4" />}
                    className="flex-row-reverse shadow-soft-sm"
                  >
                    Mulai Sekarang (Tanpa Mendaftar)
                  </Button>
                </Link>

                <Link href="/resources">
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    icon={<PhoneCall className="w-4 h-4 text-calm-700" />}
                  >
                    Daftar Bantuan Krisis
                  </Button>
                </Link>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-sand-600 font-medium">
                <Lock className="w-3.5 h-3.5 text-calm-700" />
                <span>100% Bebas Registrasi • Tanpa Nama • Tanpa Email • Tanpa No. HP</span>
              </div>
            </div>

            {/* Right Column: Abstract Calm Visual ("Listening Orb") + Contextual Floating Glass Card */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Concentric Meditative Rings */}
              <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-calm-100/60 blur-xl animate-pulse" />
                <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-calm-200/70 bg-gradient-to-tr from-calm-100/30 to-sand-100/50 flex items-center justify-center">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-calm-300/60 bg-gradient-to-bl from-calm-50/60 to-white/70 flex items-center justify-center shadow-inner">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-calm-700/90 text-white flex flex-col items-center justify-center shadow-soft-lg transition-transform hover:scale-105 duration-300">
                      <Sparkles className="w-6 h-6 mb-1 text-calm-200" />
                      <span className="text-xs font-bold tracking-wider uppercase text-calm-100">
                        Ruang Tenang
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Contextual Glass Element */}
                <GlassCard
                  tint="calm"
                  className="absolute -bottom-4 -left-2 sm:-left-6 p-4 max-w-[240px] shadow-glass"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-calm-950">Sesi Privat Aktif</span>
                  </div>
                  <p className="text-[11px] text-sand-700 mt-1 leading-tight">
                    Data disimpan lokal di peramban Anda dengan UUID anonim.
                  </p>
                </GlassCard>

                {/* Floating Contextual Glass Badge (Top Right) */}
                <GlassCard
                  tint="none"
                  className="absolute -top-3 -right-2 sm:-right-4 px-3.5 py-2 flex items-center gap-2 shadow-glass"
                >
                  <Shield className="w-4 h-4 text-calm-700" />
                  <span className="text-xs font-semibold text-sand-900">Zero AI di Krisis</span>
                </GlassCard>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 2. TRUST STRIP (Horizontal clean bar without boxed cards) */}
      <section className="border-y border-sand-200/80 bg-sand-100/60 py-6">
        <PageContainer size="default">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-8 h-8 rounded-xl bg-white border border-sand-200 flex items-center justify-center text-calm-700 shrink-0 shadow-soft-xs">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-sand-900">Privasi Mutlak UUID</h4>
                <p className="text-[11px] sm:text-xs text-sand-600">Tanpa formulir registrasi & tanpa akun</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-8 h-8 rounded-xl bg-white border border-sand-200 flex items-center justify-center text-calm-700 shrink-0 shadow-soft-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-sand-900">Langkah Kecil 3–7 Menit</h4>
                <p className="text-[11px] sm:text-xs text-sand-600">Misi harian realistis dan tidak membebani</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-8 h-8 rounded-xl bg-white border border-sand-200 flex items-center justify-center text-calm-700 shrink-0 shadow-soft-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-sand-900">Filter Krisis Terverifikasi</h4>
                <p className="text-[11px] sm:text-xs text-sand-600">Langsung ke saluran darurat Kemenkes 119</p>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 3. HOW IT WORKS (3 Horizontal Connected Steps, NOT a bunch of stacked boxes) */}
      <section>
        <PageContainer size="default">
          <div className="text-center space-y-3 mb-12">
            <Badge variant="calm" size="md">
              Metode Pendampingan
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-sand-900 tracking-tight">
              Bukan Sekadar Chatbot. Tiga Langkah Pendampingan Nyata.
            </h2>
            <p className="text-xs sm:text-sm text-sand-700 max-w-xl mx-auto leading-relaxed">
              Kecemasan tidak muncul dalam ruang hampa. Dengar.in menghubungkan apa yang kamu rasakan
              dengan konteks hidup dan tindakan nyata.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-2xl bg-calm-700 text-white font-bold text-sm flex items-center justify-center shadow-soft-xs">
                  1
                </span>
                <span className="text-xs font-bold text-calm-700 uppercase tracking-wider">
                  Langkah Pertama
                </span>
              </div>
              <h3 className="text-lg font-bold text-sand-900 pt-1">Pahami Konteks Hidupmu</h3>
              <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
                Petakan beban pikiranmu berdasarkan situasi nyata: sekolah, kampus, pekerjaan,
                tekanan finansial, atau hubungan pribadi tanpa penghakiman.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-2xl bg-calm-700 text-white font-bold text-sm flex items-center justify-center shadow-soft-xs">
                  2
                </span>
                <span className="text-xs font-bold text-calm-700 uppercase tracking-wider">
                  Langkah Kedua
                </span>
              </div>
              <h3 className="text-lg font-bold text-sand-900 pt-1">Ambil Tindakan Kecil 3–7 Menit</h3>
              <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
                Jalani misi harian yang dapat dicapai: latihan pernapasan, penetapan batasan diri,
                atau penguraian prioritas hutang secara terstruktur.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-2xl bg-calm-700 text-white font-bold text-sm flex items-center justify-center shadow-soft-xs">
                  3
                </span>
                <span className="text-xs font-bold text-calm-700 uppercase tracking-wider">
                  Langkah Ketiga
                </span>
              </div>
              <h3 className="text-lg font-bold text-sand-900 pt-1">Terus Didampingi (Follow-up)</h3>
              <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
                Bukan interaksi sekali pakai. Pantau ritme emosimu dari hari ke hari dengan laporan
                mingguan, jurnal lokal, dan follow-up berkala.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 4. INTERVENTION DOMAINS (Structured 4-column grid with subtle borders) */}
      <section>
        <PageContainer size="default">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-sand-900 tracking-tight">
              Menjangkau Beragam Tekanan Hidup
            </h2>
            <p className="text-xs sm:text-sm text-sand-700 max-w-lg mx-auto">
              Dirancang untuk remaja usia 15 tahun hingga dewasa usia 54 tahun di seluruh Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {domains.map((item, idx) => {
              const Icon = item.icon;
              return (
                <SoftCard
                  key={idx}
                  variant="white"
                  elevation="low"
                  hoverEffect
                  className="p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-calm-50 border border-calm-100 flex items-center justify-center text-calm-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-sand-900">{item.title}</h4>
                    <p className="text-xs text-sand-600 leading-relaxed">{item.desc}</p>
                  </div>
                </SoftCard>
              );
            })}
          </div>
        </PageContainer>
      </section>

      {/* 5. SAFETY GATE COMMITMENT & FINAL ACTION BANNER */}
      <section>
        <PageContainer size="default">
          <div className="rounded-3xl border border-red-200/80 bg-red-50/60 p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-crisis-dark bg-red-100 px-2.5 py-1 rounded-full border border-red-200">
                Komitmen Keselamatan 24/7
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-red-950 pt-1">
                Filter Krisis Deterministik Bebas AI
              </h3>
              <p className="text-xs sm:text-sm text-red-900/80 leading-relaxed">
                Jika terdeteksi kata kunci bahaya mendesak atau pikiran melukai diri, sistem akan
                segera mengalihkan layar ke saluran darurat resmi Kemenkes Sejiwa (119 ext 8) tanpa
                perantara bot atau AI.
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <Link href="/crisis" className="block w-full sm:w-auto">
                <Button variant="crisis" size="md" fullWidth icon={<PhoneCall className="w-4 h-4" />}>
                  Akses Saluran Darurat
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
