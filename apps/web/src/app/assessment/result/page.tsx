'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  PhoneCall,
  Compass,
  Sparkles,
} from 'lucide-react';
import { getAssessmentResult, getAnonymousSession } from '@/lib/storage';
import type { AssessmentEvaluation } from '@dengarin/types';
import { PageContainer, ContentColumn, Button, Badge } from '@/components/ui';

export default function AssessmentResultPage() {
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<AssessmentEvaluation | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const res = getAssessmentResult();
    const sess = getAnonymousSession();
    if (!res) {
      router.push('/assessment');
      return;
    }
    setEvaluation(res);
    setSession(sess);
  }, [router]);

  if (!evaluation) {
    return (
      <PageContainer size="narrow">
        <div className="py-20 text-center text-ink/70 font-medium">Memuat hasil rekomendasi...</div>
      </PageContainer>
    );
  }

  const severity = evaluation.severityLevel || 'MILD';
  const isSenior = session?.ageBracket === '50+';

  const severityBadgeProps = {
    MILD: {
      label: 'Tingkat Beban: Ringan (Mild)',
      colorClass: 'bg-lime text-ink border-2 border-ink shadow-hard-sm',
    },
    MODERATE: {
      label: 'Tingkat Beban: Menengah (Moderate)',
      colorClass: 'bg-yellow text-ink border-2 border-ink shadow-hard-sm',
    },
    SEVERE: {
      label: 'Tingkat Beban: Intensitas Tinggi (Severe)',
      colorClass: 'bg-coral text-white border-2 border-ink shadow-hard-sm',
    },
  }[severity];

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className={`space-y-8 text-left ${isSenior ? 'accessibility-large-text' : ''}`}>
        {/* Header */}
        <div className="space-y-3">
          <Badge variant="calm" size="md">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Rekomendasi Ruang Dukungan Non-Diagnostik
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight uppercase leading-tight">
            REKOMENDASI RUANG PEMULIHAN ANDA
          </h1>

          <p className="text-sm sm:text-base text-ink/80 leading-relaxed max-w-xl font-medium">
            Berdasarkan respon yang Anda berikan, kami merekomendasikan ruang pendampingan berikut untuk
            membantu menjaga kestabilan dan rasa aman Anda:
          </p>
        </div>

        {/* Severity Badge & Feedback Card */}
        <div className="bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-5 shadow-hard">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-black uppercase tracking-wider ${severityBadgeProps.colorClass}`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {severityBadgeProps.label}
            </span>
            <span className="text-xs text-ink/60 font-black uppercase tracking-wider">Non-Diagnostik</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-black text-ink uppercase tracking-wide">
              {severity === 'MILD'
                ? 'Jalur Mandiri & Penguatan Diri'
                : severity === 'MODERATE'
                ? 'Jalur Pendampingan Terarah & Regulasi Emosi'
                : 'Jalur Prioritas Konseling & Dukungan Darurat'}
            </h2>
            <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-medium">
              {evaluation.summaryFeedback}
            </p>
          </div>

          {/* Recommended Support Spaces Checklist */}
          <div className="pt-3 border-t-2 border-ink space-y-2.5">
            <h3 className="text-xs font-black text-ink uppercase tracking-wider">
              RUANG PENDAMPINGAN YANG DIREKOMENDASIKAN:
            </h3>
            <ul className="space-y-2">
              {evaluation.recommendedSupportSpaces?.map((space, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-ink font-medium p-2 bg-paper rounded border border-ink">
                  <CheckCircle2 className="w-4 h-4 text-cobalt shrink-0 mt-0.5" />
                  <span>{space}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tailored Pathway Next Actions */}
        <div className="space-y-4">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-ink">
            LANGKAH TINDAKAN YANG DAPAT ANDA AMBIL:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Action 1: Dashboard / Missions */}
            <Link href="/dashboard" className="block focus-visible:outline-ink">
              <div className="bg-white border-2 border-ink rounded-md p-5 space-y-3 h-full flex flex-col justify-between shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-md bg-yellow text-ink border-2 border-ink shadow-hard-sm flex items-center justify-center font-black">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-sm text-ink uppercase tracking-wide">Masuk ke Ruang Tenang (Dashboard)</h4>
                  <p className="text-xs text-ink/80 leading-relaxed font-medium">
                    Mulai misi mikro harian 3–7 menit yang disesuaikan dengan ritmemu.
                  </p>
                </div>
                <span className="text-xs font-black text-cobalt flex items-center gap-1 pt-2 uppercase tracking-wider">
                  Buka Dashboard →
                </span>
              </div>
            </Link>

            {/* Action 2: Journal or Professional Referral depending on severity */}
            {severity === 'SEVERE' ? (
              <Link href="/resources" className="block focus-visible:outline-ink">
                <div className="bg-white border-2 border-ink rounded-md p-5 space-y-3 h-full flex flex-col justify-between shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-md bg-coral text-white border-2 border-ink shadow-hard-sm flex items-center justify-center font-black">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <h4 className="font-black text-sm text-ink uppercase tracking-wide">Direktori Bantuan Terverifikasi</h4>
                    <p className="text-xs text-ink/80 leading-relaxed font-medium">
                      Akses kontak resmi Kemenkes Sejiwa 119 ext 8, Lisa Helpline, dan layanan konseling.
                    </p>
                  </div>
                  <span className="text-xs font-black text-coral flex items-center gap-1 pt-2 uppercase tracking-wider">
                    Lihat Kontak Bantuan →
                  </span>
                </div>
              </Link>
            ) : (
              <Link href="/journal" className="block focus-visible:outline-ink">
                <div className="bg-white border-2 border-ink rounded-md p-5 space-y-3 h-full flex flex-col justify-between shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-md bg-lime text-ink border-2 border-ink shadow-hard-sm flex items-center justify-center font-black">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h4 className="font-black text-sm text-ink uppercase tracking-wide">Jurnal Refleksi Privat</h4>
                    <p className="text-xs text-ink/80 leading-relaxed font-medium">
                      Tuliskan perasaanmu secara bebas di peramban tanpa terhubung ke server manapun.
                    </p>
                  </div>
                  <span className="text-xs font-black text-cobalt flex items-center gap-1 pt-2 uppercase tracking-wider">
                    Mulai Menulis →
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Strict Ethical Non-Diagnostic Disclaimer */}
        <div className="p-4 rounded-md bg-yellow/20 border-2 border-ink text-xs text-ink leading-relaxed flex items-start gap-3 shadow-hard-sm font-medium">
          <ShieldCheck className="w-5 h-5 text-cobalt shrink-0 mt-0.5" />
          <div>
            <span className="font-black text-ink block mb-0.5 uppercase tracking-wide">PENAFIAN NON-DIAGNOSTIK:</span>
            <span>
              Hasil ini merupakan panduan triase mandiri non-klinis dan{' '}
              <strong className="text-ink font-bold">bukan diagnosis medis</strong> (seperti depresi klinis, gangguan kecemasan, atau PTSD).
              Platform ini tidak mengklaim validitas psikometrik atau klinis. Jika Anda membutuhkan diagnosis formal, silakan konsultasikan dengan tenaga profesional kesehatan jiwa berlisensi.
            </span>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="pt-2 text-center">
          <Link href="/dashboard" className="inline-block w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={<ArrowRight className="w-4 h-4" />}
              className="flex-row-reverse"
            >
              LANJUTKAN KE RUANG TENANG →
            </Button>
          </Link>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}

