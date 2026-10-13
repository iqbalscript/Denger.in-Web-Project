'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckSquare, Square, PenLine } from 'lucide-react';
import { Button } from '@/components/ui';
import { MUTED, SectionCard, StepHeading, UrgentHelpLink } from './shared';

export interface ConsentStepProps {
  onAccept: () => void;
  onDecline: () => void;
}

const POINTS = [
  {
    title: 'Ini persetujuan terpisah',
    body: 'Persetujuan umum Dengar.in tidak otomatis mencakup ini. Khusus halaman ini, ceritamu dikirim ke model AI untuk disusun menjadi catatan. Kamu boleh menolak dan tetap menulis catatan sendiri.',
  },
  {
    title: 'Data pribadi disamarkan dulu',
    body: 'Sebelum dikirim, nomor telepon, email, alamat, dan nama yang terdeteksi diganti dengan label. Kamu melihat dan mengatur sendiri apa yang disamarkan.',
  },
  {
    title: 'AI hanya merangkum, kamu yang memutuskan',
    body: 'Setiap kalimat di catatan harus mengutip ceritamu. Tidak ada diagnosis, tidak ada skor, dan tidak ada yang dikirim ke pihak lain tanpa tindakanmu sendiri.',
  },
  {
    title: 'Tidak disimpan',
    body: 'Cerita dan catatanmu tidak disimpan di server dan tidak dipakai untuk melatih apa pun. Kalau halaman ditutup, isinya hilang.',
  },
];

export function ConsentStep({ onAccept, onDecline }: ConsentStepProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <StepHeading
          step="Langkah 1 dari 4"
          title="Sebelum AI membaca ceritamu."
          lede="Catatan Konsultasi membantu kamu menyiapkan apa yang ingin disampaikan ke psikolog atau konselor. Bagian ini butuh izin khusus darimu."
        />
        <UrgentHelpLink className="shrink-0" />
      </div>

      <ol className="space-y-5">
        {POINTS.map((point, index) => (
          <li
            key={point.title}
            style={{ animationDelay: `${120 + index * 70}ms` }}
            className="animate-reveal-up flex items-start gap-4 border-t-2 border-[#151515] pt-4"
          >
            <span
              className="w-9 h-9 rounded-[4px] border-2 border-[#151515] bg-[#4169FF] text-white font-bold text-sm flex items-center justify-center shrink-0 tabular-nums"
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#151515] leading-[1.25]">{point.title}</h2>
              <p className={`text-[15px] leading-relaxed ${MUTED}`}>{point.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <SectionCard elevation="high" className="animate-reveal-up [animation-delay:200ms] space-y-5">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={() => setChecked((v) => !v)}
          className={`flex items-start gap-3.5 text-left w-full rounded-[6px] p-4 border-2 border-[#151515] transition-[transform,box-shadow,background-color] duration-200 ease-spring ${
            checked
              ? 'bg-[#E6ECFF] shadow-[2px_2px_0px_#151515]'
              : 'bg-[#FFF8EF] hover:bg-[#F7F0E6] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[2px_2px_0px_#151515] active:translate-x-0 active:translate-y-0 active:shadow-none'
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4169FF]`}
        >
          {checked ? (
            <CheckSquare className="w-5 h-5 text-[#4169FF] shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <Square className="w-5 h-5 text-[#7A756D] shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <span className="text-[15px] text-[#151515] leading-snug font-medium">
            Saya berusia 18 tahun ke atas dan setuju cerita saya, setelah data pribadi disamarkan, diproses oleh AI untuk menyusun draf catatan yang akan saya tinjau sendiri.
          </span>
        </button>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            size="lg"
            disabled={!checked}
            onClick={onAccept}
            iconPosition="end"
            icon={<ArrowRight className="w-4 h-4" />}
            className="sm:flex-1"
          >
            Setuju, lanjut tulis cerita
          </Button>
          <Button variant="secondary" size="lg" onClick={onDecline} icon={<PenLine className="w-4 h-4" />} className="sm:flex-1">
            Tidak, saya tulis sendiri
          </Button>
        </div>
        <p className={`text-sm leading-relaxed ${MUTED}`}>
          Menolak tidak mengurangi apa pun. Kamu tetap mendapat kerangka catatan yang bisa diisi dan diunduh.
        </p>
      </SectionCard>
    </div>
  );
}
