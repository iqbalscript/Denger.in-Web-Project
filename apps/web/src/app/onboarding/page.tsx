'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Briefcase,
  Coins,
  Heart,
  Home,
  Compass,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import type { AgeBracket, InterventionDomain } from '@dengarin/types';
import { OCCUPATION_OPTIONS } from '@dengarin/config';
import { updateUserContext } from '@/lib/storage';
import { ContentColumn, PageContainer, Button, ProgressBar, Badge } from '@/components/ui';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedAge, setSelectedAge] = useState<AgeBracket | null>(null);
  const [selectedOccupation, setSelectedOccupation] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<InterventionDomain | null>(null);

  const ageOptions: Array<{ id: AgeBracket; label: string; sub: string; isTeen?: boolean }> = [
    { id: '15-17', label: '15–17 Tahun', sub: 'Pelajar SMA / SMK (Perlindungan Khusus Anak)', isTeen: true },
    { id: '18-24', label: '18–24 Tahun', sub: 'Mahasiswa, Fresh Graduate, atau Karir Awal' },
    { id: '25-34', label: '25–34 Tahun', sub: 'Pekerja Profesional, Generasi Sandwich' },
    { id: '35-54', label: '35–54 Tahun', sub: 'Pekerja Senior / Wirausaha, Berkeluarga' },
  ];

  const domainOptions: Array<{
    id: InterventionDomain;
    label: string;
    desc: string;
    icon: React.ElementType;
  }> = [
    { id: 'school', label: 'Sekolah & Ujian', desc: 'Tekanan ujian masuk, nilai akademik, atau teman sebaya.', icon: GraduationCap },
    { id: 'campus', label: 'Dunia Kampus', desc: 'Beban tugas, skripsi, adaptasi merantau, atau salah jurusan.', icon: BookOpen },
    { id: 'work', label: 'Beban Pekerjaan', desc: 'Burnout, konflik kantor, atau kecemasan karir masa depan.', icon: Briefcase },
    { id: 'finance', label: 'Tekanan Finansial', desc: 'Kecemasan hutang, teror pinjol, atau beban sandwich generation.', icon: Coins },
    { id: 'relationship', label: 'Hubungan & Cinta', desc: 'Patah hati, putus hubungan, atau kesepian dalam bergaul.', icon: Heart },
    { id: 'family', label: 'Dinamika Keluarga', desc: 'Ekspektasi orang tua, konflik internal, atau beban tanggungan.', icon: Home },
    { id: 'loneliness', label: 'Kesepian & Hampa', desc: 'Merasa terasing atau tidak memiliki tempat bercerita.', icon: Compass },
    { id: 'general', label: 'Beban Pikiran Umum', desc: 'Merasa lelah & cemas namun belum tahu penyebab pastinya.', icon: Sparkles },
  ];

  const canProceed =
    (step === 1 && selectedAge !== null) ||
    (step === 2 && selectedOccupation !== null) ||
    (step === 3 && selectedDomain !== null);

  const handleNext = () => {
    if (!canProceed) return;
    if (step === 1) {
      if (selectedAge === '15-17' && !selectedOccupation) {
        setSelectedOccupation('pelajar');
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (selectedAge && selectedOccupation && selectedDomain) {
        updateUserContext(selectedAge, selectedOccupation, selectedDomain);
        router.push('/assessment');
      }
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-8">
        {/* Top: Concise Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-sand-600 font-medium">
            <span>Pengenalan Konteks</span>
            <span className="font-bold text-calm-800">Langkah {step} dari 3</span>
          </div>
          <ProgressBar value={step} max={3} />
        </div>

        {/* Middle: Step 1 (Age) */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2 text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
                Berapa rentang usia Anda saat ini?
              </h1>
              <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
                Rentang usia membantu Dengar.in menyesuaikan materi pendampingan serta protokol
                perlindungan khusus untuk remaja di bawah umur.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {ageOptions.map((opt) => {
                const isSelected = selectedAge === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedAge(opt.id)}
                    className={`p-4 rounded-2xl text-left border transition-all duration-150 cursor-pointer focus-visible:outline-calm-700 min-h-[92px] flex flex-col justify-between ${
                      isSelected
                        ? 'border-calm-700 bg-calm-50/90 shadow-soft-sm ring-1 ring-calm-700 -translate-y-0.5'
                        : 'border-sand-200 bg-white hover:border-sand-300 hover:bg-sand-50/50 shadow-soft-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm sm:text-base text-sand-900">
                        {opt.label}
                      </span>
                      {opt.isTeen && (
                        <Badge variant="calm" size="sm" className="gap-1">
                          <ShieldCheck className="w-3 h-3 text-calm-700" />
                          Khusus Remaja
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-sand-600 mt-1.5 leading-relaxed">{opt.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Middle: Step 2 (Occupation) */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2 text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
                Apa peran atau aktivitas utama Anda saat ini?
              </h1>
              <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
                Pilih status yang paling menggambarkan rutinitas harianmu agar studi kasus intervensi
                relevan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {OCCUPATION_OPTIONS.map((occ) => {
                const isSelected = selectedOccupation === occ.id;
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setSelectedOccupation(occ.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all duration-150 flex items-center justify-between cursor-pointer focus-visible:outline-calm-700 min-h-[50px] ${
                      isSelected
                        ? 'border-calm-700 bg-calm-50/90 text-calm-950 shadow-soft-xs ring-1 ring-calm-700 font-bold'
                        : 'border-sand-200 bg-white hover:border-sand-300 hover:bg-sand-50/50 text-sand-800 font-medium'
                    }`}
                  >
                    <span className="text-xs sm:text-sm">{occ.label}</span>
                    {isSelected && <UserCheck className="w-4 h-4 text-calm-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Middle: Step 3 (Domain) */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2 text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
                Apa sumber tekanan terbesarmu saat ini?
              </h1>
              <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
                Dengar.in akan menyusun jalur misi harian terfokus berdasarkan topik pilihanmu.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {domainOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedDomain === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedDomain(opt.id)}
                    className={`p-4 rounded-2xl text-left border transition-all duration-150 flex items-start gap-3.5 cursor-pointer focus-visible:outline-calm-700 ${
                      isSelected
                        ? 'border-calm-700 bg-calm-50/90 shadow-soft-xs ring-1 ring-calm-700'
                        : 'border-sand-200 bg-white hover:border-sand-300 hover:bg-sand-50/50'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-calm-700 text-white shadow-soft-xs'
                          : 'bg-sand-100 text-calm-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-sand-900">{opt.label}</h3>
                      <p className="text-[11px] sm:text-xs text-sand-600 mt-0.5 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom: Guided Navigation Controls */}
        <div className="pt-4 flex items-center justify-between gap-4 border-t border-sand-200/80">
          {step > 1 ? (
            <Button
              variant="ghost"
              size="md"
              onClick={handleBack}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Sebelumnya
            </Button>
          ) : (
            <div />
          )}

          <Button
            variant="primary"
            size="lg"
            disabled={!canProceed}
            onClick={handleNext}
            icon={<ArrowRight className="w-4 h-4" />}
            className="flex-row-reverse"
          >
            {step === 3 ? 'Selesaikan & Mulai Asesmen' : 'Lanjutkan'}
          </Button>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}
