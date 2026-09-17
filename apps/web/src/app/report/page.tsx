'use client';

import React from 'react';
import Link from 'next/link';
import { BarChart3, ArrowLeft, Sparkles, TrendingUp } from 'lucide-react';
import { PageContainer, ContentColumn, SoftCard, Button, Badge, ProgressBar } from '@/components/ui';

export default function ReportPage() {
  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-8 text-left">
        <div>
          <Link href="/dashboard" className="inline-block">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>

        {/* 1. Headline Summary */}
        <div className="space-y-2">
          <Badge variant="calm" size="md">
            <BarChart3 className="w-3.5 h-3.5 mr-1 text-calm-700" />
            Laporan Kemajuan Mingguan (Follow-Up)
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-sand-900 tracking-tight">
            Sintesis Evaluasi & Refleksi 7 Hari
          </h1>
          <p className="text-xs sm:text-sm text-sand-700 leading-relaxed max-w-xl">
            Dengar.in membedakan diri dengan memastikan adanya evaluasi berkelanjutan (follow-up),
            bukan sekadar interaksi sekali pakai.
          </p>
        </div>

        {/* 2. Primary Progress Visualization */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SoftCard variant="white" elevation="low" className="p-5 space-y-2.5">
            <span className="text-xs font-semibold text-sand-600">Konsistensi Misi</span>
            <p className="text-2xl font-black text-sand-900">5 / 7 Hari</p>
            <ProgressBar value={71} max={100} />
            <span className="text-[11px] text-calm-700 font-bold block">71% Tercapai</span>
          </SoftCard>

          <SoftCard variant="white" elevation="low" className="p-5 space-y-2.5">
            <span className="text-xs font-semibold text-sand-600">Check-in Emosi</span>
            <p className="text-2xl font-black text-sand-900">6 Catatan</p>
            <ProgressBar value={85} max={100} />
            <span className="text-[11px] text-calm-700 font-bold block">Tersimpan di peramban</span>
          </SoftCard>

          <SoftCard variant="white" elevation="low" className="p-5 space-y-2.5">
            <span className="text-xs font-semibold text-sand-600">Kecenderungan Suasana</span>
            <p className="text-xl font-bold text-sand-900 pt-1">Stabil Bertahap</p>
            <div className="pt-1">
              <Badge variant="calm" size="sm" className="gap-1">
                <TrendingUp className="w-3 h-3 text-calm-700" />
                Penurunan cemas
              </Badge>
            </div>
          </SoftCard>
        </div>

        {/* 3. Supporting Observations */}
        <SoftCard variant="white" elevation="low" className="p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-sand-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-calm-700" />
            <span>Pengamatan & Sintesis Pola:</span>
          </h3>

          <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">
            Dalam pekan ini, tingkat kecemasan tertinggi Anda terdeteksi saat menghadapi tugas akhir dan urusan finansial.
            Namun setelah menyelesaikan misi pernapasan dan pencatatan skala prioritas, respons relaksasi Anda meningkat sebesar 35%.
            Lanjutkan langkah kecil ini pada pekan berikutnya.
          </p>
        </SoftCard>

        {/* 4. Next Focus */}
        <div className="rounded-2xl border border-calm-200/90 bg-calm-50/80 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs space-y-1 max-w-md text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-calm-800">
              Fokus Minggu Depan:
            </span>
            <p className="text-sm font-bold text-calm-950">
              Pembuatan batasan sehat (boundaries) & rutinitas istirahat teratur.
            </p>
          </div>

          <Link href="/dashboard" className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="md" fullWidth>
              Lanjut ke Hari Ini
            </Button>
          </Link>
        </div>
      </ContentColumn>
    </PageContainer>
  );
}
