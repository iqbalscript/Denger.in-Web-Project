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
import { PageContainer, ContentColumn, SoftCard, Button, Badge } from '@/components/ui';

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
        <div className="py-20 text-center text-sand-600">Memuat hasil rekomendasi...</div>
      </PageContainer>
    );
  }

  const severity = evaluation.severityLevel || 'MILD';
  const isSenior = session?.ageBracket === '50+';

  const severityBadgeProps = {
    MILD: {
      label: 'Tingkat Beban: Ringan (Mild)',
      variant: 'calm' as const,
      colorClass: 'text-sage-700 bg-sage-50 border-sage-200',
    },
    MODERATE: {
      label: 'Tingkat Beban: Menengah (Moderate)',
      variant: 'warm' as const,
      colorClass: 'text-honey-700 bg-honey-50 border-honey-200',
    },
    SEVERE: {
      label: 'Tingkat Beban: Intensitas Tinggi (Severe)',
      variant: 'crisis' as const,
      colorClass: 'text-crisis bg-red-50 border-red-200',
    },
  }[severity];

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className={`space-y-8 text-left ${isSenior ? 'accessibility-large-text' : ''}`}>
        {/* Header */}
        <div className="space-y-3">
          <Badge variant="calm" size="md">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-terracotta-600" />
            Rekomendasi Ruang Dukungan Non-Diagnostik
          </Badge>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-sand-900 tracking-tight leading-tight">
            Rekomendasi Ruang Pemulihan Anda
          </h1>

          <p className="text-sm sm:text-base text-sand-700 leading-relaxed max-w-xl">
            Berdasarkan respon yang Anda berikan, kami merekomendasikan ruang pendampingan berikut untuk
            membantu menjaga kestabilan dan rasa aman Anda:
          </p>
        </div>

        {/* Severity Badge & Feedback Card */}
        <SoftCard variant="white" elevation="medium" className="p-6 sm:p-8 space-y-5 border-terracotta-200/80">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${severityBadgeProps.colorClass}`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {severityBadgeProps.label}
            </span>
            <span className="text-xs text-sand-500 font-medium">Non-Diagnostik</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-sand-900">
              {severity === 'MILD'
                ? 'Jalur Mandiri & Penguatan Diri'
                : severity === 'MODERATE'
                ? 'Jalur Pendampingan Terarah & Regulasi Emosi'
                : 'Jalur Prioritas Konseling & Dukungan Darurat'}
            </h2>
            <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
              {evaluation.summaryFeedback}
            </p>
          </div>

          {/* Recommended Support Spaces Checklist */}
          <div className="pt-3 border-t border-sand-200/80 space-y-2.5">
            <h3 className="text-xs font-bold text-sand-900 uppercase tracking-wider">
              Ruang Pendampingan yang Direkomendasikan untuk Anda:
            </h3>
            <ul className="space-y-2">
              {evaluation.recommendedSupportSpaces?.map((space, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-sand-800">
                  <CheckCircle2 className="w-4 h-4 text-terracotta-600 shrink-0 mt-0.5" />
                  <span>{space}</span>
                </li>
              ))}
            </ul>
          </div>
        </SoftCard>

        {/* Tailored Pathway Next Actions */}
        <div className="space-y-4">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sand-900">
            Langkah Tindakan yang Dapat Anda Ambil Sekarang:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Action 1: Dashboard / Missions */}
            <Link href="/dashboard" className="block focus-visible:outline-terracotta-500 rounded-2xl">
              <SoftCard variant="white" elevation="low" hoverEffect className="p-5 space-y-2 h-full flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-sand-900">Masuk ke Ruang Tenang (Dashboard)</h4>
                  <p className="text-xs text-sand-600 leading-relaxed">
                    Mulai misi mikro harian 3–7 menit yang disesuaikan dengan ritmemu.
                  </p>
                </div>
                <span className="text-xs font-bold text-terracotta-600 flex items-center gap-1 pt-1">
                  Buka Dashboard &rarr;
                </span>
              </SoftCard>
            </Link>

            {/* Action 2: Journal or Professional Referral depending on severity */}
            {severity === 'SEVERE' ? (
              <Link href="/resources" className="block focus-visible:outline-crisis rounded-2xl">
                <SoftCard variant="white" elevation="low" hoverEffect className="p-5 space-y-2 h-full border-red-200 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-red-50 text-crisis flex items-center justify-center">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-sand-900">Direktori Bantuan Terverifikasi</h4>
                    <p className="text-xs text-sand-600 leading-relaxed">
                      Akses kontak resmi Kemenkes Sejiwa 119 ext 8, Lisa Helpline, dan layanan konseling.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-crisis flex items-center gap-1 pt-1">
                    Lihat Kontak Bantuan &rarr;
                  </span>
                </SoftCard>
              </Link>
            ) : (
              <Link href="/journal" className="block focus-visible:outline-terracotta-500 rounded-2xl">
                <SoftCard variant="white" elevation="low" hoverEffect className="p-5 space-y-2 h-full flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-sand-900">Jurnal Refleksi Privat</h4>
                    <p className="text-xs text-sand-600 leading-relaxed">
                      Tuliskan perasaanmu secara bebas di peramban tanpa terhubung ke server manapun.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-terracotta-600 flex items-center gap-1 pt-1">
                    Mulai Menulis &rarr;
                  </span>
                </SoftCard>
              </Link>
            )}
          </div>
        </div>

        {/* Strict Ethical Non-Diagnostic Disclaimer */}
        <div className="p-4 rounded-2xl bg-sand-100/90 border border-sand-200 text-xs text-sand-700 leading-relaxed flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-terracotta-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sand-900 block mb-0.5">Penafian Non-Diagnostik:</span>
            <span>
              Hasil ini merupakan panduan triase mandiri non-klinis dan{' '}
              <strong className="text-sand-900 font-semibold">bukan diagnosis medis</strong> (seperti depresi klinis, gangguan kecemasan, atau PTSD).
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
              className="flex-row-reverse touch-target-primary shadow-soft-sm"
            >
              Lanjutkan ke Ruang Tenang
            </Button>
          </Link>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}
