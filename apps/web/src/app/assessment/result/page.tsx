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
import { getAssessmentResult } from '@/lib/storage';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { ConsentPending } from '@/components/ConsentPending';
import type { AssessmentEvaluation } from '@dengarin/types';
import { PageContainer, ContentColumn, Button, Badge, Reveal } from '@/components/ui';

export default function AssessmentResultPage() {
  const router = useRouter();
  const { ready, session } = useConsentGuard();
  const [evaluation, setEvaluation] = useState<AssessmentEvaluation | null>(null);

  // Storage is read only after hydration and once consent is confirmed.
  useEffect(() => {
    if (!ready) return;
    const res = getAssessmentResult();
    if (!res) {
      router.push('/assessment');
      return;
    }
    setEvaluation(res);
  }, [ready, router]);

  if (!ready) return <ConsentPending />;

  if (!evaluation) {
    return (
      <PageContainer size="narrow">
        <div role="status" className="py-20 text-center text-base text-[#59544D] font-medium">Memuat saran untukmu...</div>
      </PageContainer>
    );
  }

  const severity = evaluation.severityLevel || 'MILD';
  const isSenior = session?.ageBracket === '50+';

  const severityBadgeProps = {
    MILD: {
      label: 'Beban Terasa: Ringan',
      colorClass: 'bg-lime text-ink border-2 border-ink shadow-hard-sm',
    },
    MODERATE: {
      label: 'Beban Terasa: Cukup Berat',
      colorClass: 'bg-yellow text-ink border-2 border-ink shadow-hard-sm',
    },
    SEVERE: {
      label: 'Beban Terasa: Sangat Berat',
      colorClass: 'bg-[#D32F2F] text-white border-2 border-ink shadow-hard-sm',
    },
  }[severity];

  return (
    <PageContainer size="narrow" className="sm:py-16">
      <ContentColumn size="md" className={`space-y-10 text-left ${isSenior ? 'accessibility-large-text' : ''}`}>
        {/* Header */}
        <div className="space-y-3 animate-reveal-up">
          <Badge variant="calm" size="md">
            <Sparkles className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            Saran dukungan (bukan diagnosis)
          </Badge>

          <h1 className="text-[2rem] sm:text-5xl lg:text-[3.5rem] font-bold text-ink tracking-[-0.03em] leading-[1.05]">
            Ini yang bisa menemanimu
          </h1>

          <p className="text-lg sm:text-xl text-[#4A453E] leading-[1.45] max-w-[34rem] font-medium">
            Terima kasih sudah menjawab dengan jujur. Berdasarkan ceritamu, ruang-ruang berikut
            mungkin bisa membantumu merasa lebih stabil dan aman:
          </p>
        </div>

        {/* Severity Badge & Feedback Card. Stays static for SEVERE so help-oriented guidance shows at once. */}
        <div className={`bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-5 shadow-hard ${severity === 'SEVERE' ? '' : 'animate-reveal-up [animation-delay:120ms]'}`}>
          <div className="flex items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-sm font-bold ${severityBadgeProps.colorClass}`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              {severityBadgeProps.label}
            </span>
            <span className="text-sm text-[#59544D] font-bold">Bukan diagnosis</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-[1.75rem] font-bold text-ink tracking-[-0.02em] leading-[1.2]">
              {severity === 'MILD'
                ? 'Jalur Mandiri'
                : severity === 'MODERATE'
                ? 'Jalur Pendampingan & Kelola Emosi'
                : 'Jalur Dukungan Profesional & Bantuan Segera'}
            </h2>
            <p className="text-base text-[#4A453E] leading-relaxed">
              {evaluation.summaryFeedback}
            </p>
          </div>

          {/* Recommended Support Spaces Checklist */}
          <div className="pt-4 border-t border-[#D8D3C9] space-y-3">
            <h3 className="text-base font-bold text-ink">
              Ruang yang mungkin cocok untukmu
            </h3>
            <ul className="divide-y divide-[#D8D3C9]">
              {evaluation.recommendedSupportSpaces?.map((space, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-base text-ink font-medium py-2.5">
                  <CheckCircle2 className="w-5 h-5 text-cobalt shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{space}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tailored Pathway Next Actions */}
        <div className="space-y-4">
          <Reveal>
            <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-[-0.01em] leading-[1.25]">
              Langkah kecil yang bisa kamu pilih
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Action 1: Dashboard / Missions */}
            <Reveal delay={80}>
            <Link href="/dashboard" className="group block h-full rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2">
              <div className="bg-white border-2 border-ink rounded-md p-5 sm:p-6 space-y-3 h-full flex flex-col justify-between shadow-hard transition-[transform,box-shadow] duration-200 ease-spring group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] group-hover:shadow-hard-lg group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:shadow-hard-sm">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-md bg-yellow text-ink border-2 border-ink flex items-center justify-center" aria-hidden="true">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-ink tracking-[-0.01em] leading-[1.25]">Masuk ke beranda</h3>
                  <p className="text-base text-[#4A453E] leading-relaxed">
                    Mulai misi kecil harian 3–7 menit yang sesuai kemampuanmu.
                  </p>
                </div>
                <span className="text-base font-bold text-[#2B51E6] flex items-center gap-1.5 pt-2" aria-hidden="true">
                  Buka beranda <span className="inline-block transition-transform duration-400 ease-spring group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
            </Reveal>

            {/* Action 2: Journal or Professional Referral depending on severity */}
            {severity === 'SEVERE' ? (
              <Link href="/resources" className="group block h-full rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2">
                <div className="bg-white border-2 border-ink rounded-md p-5 sm:p-6 space-y-3 h-full flex flex-col justify-between shadow-hard transition-[transform,box-shadow] duration-200 ease-spring group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] group-hover:shadow-hard-lg group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:shadow-hard-sm">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-md bg-[#D32F2F] text-white border-2 border-ink flex items-center justify-center" aria-hidden="true">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-ink tracking-[-0.01em] leading-[1.25]">Direktori bantuan terverifikasi</h3>
                    <p className="text-base text-[#4A453E] leading-relaxed">
                      Kontak resmi Healing119 (Kemenkes) 119 ext 8, LISA Helpline, dan layanan konseling, kapan pun kamu ingin bicara dengan manusia.
                    </p>
                  </div>
                  <span className="text-base font-bold text-[#B3261E] flex items-center gap-1.5 pt-2" aria-hidden="true">
                    Lihat kontak bantuan <span className="inline-block transition-transform duration-400 ease-spring group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            ) : (
              <Reveal delay={160}>
              <Link href="/journal" className="group block h-full rounded-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2">
                <div className="bg-white border-2 border-ink rounded-md p-5 sm:p-6 space-y-3 h-full flex flex-col justify-between shadow-hard transition-[transform,box-shadow] duration-200 ease-spring group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] group-hover:shadow-hard-lg group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:shadow-hard-sm">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-md bg-lime text-ink border-2 border-ink flex items-center justify-center" aria-hidden="true">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-ink tracking-[-0.01em] leading-[1.25]">Jurnal refleksi privat</h3>
                    <p className="text-base text-[#4A453E] leading-relaxed">
                      Tuliskan perasaanmu secara bebas di peramban tanpa terhubung ke server manapun.
                    </p>
                  </div>
                  <span className="text-base font-bold text-[#2B51E6] flex items-center gap-1.5 pt-2" aria-hidden="true">
                    Mulai menulis <span className="inline-block transition-transform duration-400 ease-spring group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
              </Reveal>
            )}
          </div>
        </div>

        {/* Strict Ethical Non-Diagnostic Disclaimer */}
        <aside aria-label="Bukan diagnosis" className="p-4 sm:p-5 rounded-md bg-[#FFF1C2] border-l-4 border-yellow text-base text-[#4A453E] leading-relaxed flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cobalt shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-bold text-ink block mb-1 text-base">Bukan diagnosis</span>
            <span>
              Hasil ini merupakan panduan awal mandiri non-klinis dan{' '}
              <strong className="text-ink font-bold">bukan diagnosis medis</strong> (seperti depresi klinis, gangguan kecemasan, atau PTSD).
              Layanan ini tidak mengklaim validitas psikometrik atau klinis. Jika kamu membutuhkan diagnosis formal, silakan konsultasikan dengan tenaga profesional kesehatan jiwa berlisensi.
            </span>
          </div>
        </aside>

        {/* Bottom Button */}
        <Reveal className="pt-2 text-center">
          <Button
            href="/dashboard"
            variant="primary"
            size="lg"
            iconPosition="end"
            icon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Lanjut ke beranda
          </Button>
        </Reveal>
      </ContentColumn>
    </PageContainer>
  );
}

