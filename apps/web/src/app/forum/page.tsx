'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, ArrowLeft, Heart, AlertCircle } from 'lucide-react';
import { PageContainer, ContentColumn, SoftCard, Button, Badge, Chip } from '@/components/ui';

export default function ForumPage() {
  const [activeTab, setActiveTab] = useState('all');

  const categories = [
    { id: 'all', label: 'Semua Cerita' },
    { id: 'campus', label: 'Kampus & Skripsi' },
    { id: 'finance', label: 'Tekanan Finansial' },
    { id: 'work', label: 'Beban Pekerjaan' },
    { id: 'family', label: 'Dinamika Keluarga' },
  ];

  const samplePosts = [
    {
      id: '1',
      category: 'campus',
      author: 'Sahabat Anonim #3912',
      tag: 'Dunia Kampus • Skripsi',
      title: 'Merasa tertinggal dari teman-teman yang sudah wisuda...',
      snippet:
        'Setiap buka media sosial rasanya sesak melihat teman seangkatan sudah mulai kerja. Tapi pelan-pelan saya belajar bahwa setiap orang punya garis waktu masing-masing. Fokus hari ini hanya menyelesaikan revisi satu bab saja.',
      supportCount: 24,
    },
    {
      id: '2',
      category: 'finance',
      author: 'Sahabat Anonim #7401',
      tag: 'Tekanan Finansial • Sandwich Gen',
      title: 'Bernapas lega setelah memberanikan diri membuat daftar hutang',
      snippet:
        'Awalnya takut sekali melihat total tagihan. Tapi setelah diurai satu per satu dan menghubungi layanan pengaduan resmi, bebannya mulai terasa bisa dikelola. Jangan lari dari kenyataan, hadapi pelan-pelan.',
      supportCount: 41,
    },
  ];

  const filteredPosts =
    activeTab === 'all' ? samplePosts : samplePosts.filter((p) => p.category === activeTab);

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

        {/* Intro */}
        <div className="space-y-2">
          <Badge variant="calm" size="md">
            <Users className="w-3.5 h-3.5 mr-1 text-calm-700" />
            Ruang Cerita Anonim
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-sand-900 tracking-tight">
            Solidaritas Tanpa Identitas
          </h1>
          <p className="text-xs sm:text-sm text-sand-700 leading-relaxed max-w-xl">
            Ruang aman untuk membaca dan berbagi pengalaman dengan sesama pengguna yang menghadapi
            beban hidup serupa, tanpa rasa takut dihakimi.
          </p>
        </div>

        {/* Architectural Boundary Notice */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong>Catatan Arsitektur:</strong> Halaman ini adalah kerangka rute (skeleton).
            Infrastruktur backend dan moderasi keselamatan otomatis akan diaktifkan pada Sprint berikutnya.
          </span>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              selected={activeTab === cat.id}
              onClick={() => setActiveTab(cat.id)}
              size="sm"
            >
              {cat.label}
            </Chip>
          ))}
        </div>

        {/* Story Stream */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <SoftCard
              key={post.id}
              variant="white"
              elevation="low"
              hoverEffect
              className="p-6 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <Badge variant="sand" size="sm">
                  {post.author}
                </Badge>
                <span className="text-xs text-sand-500 font-medium">{post.tag}</span>
              </div>

              <h3 className="font-bold text-base text-sand-900 leading-snug">{post.title}</h3>
              <p className="text-xs sm:text-sm text-sand-700 leading-relaxed">{post.snippet}</p>

              <div className="pt-3 flex items-center gap-4 text-xs text-sand-600 border-t border-sand-100">
                <span className="flex items-center gap-1.5 text-calm-700 font-semibold">
                  <Heart className="w-3.5 h-3.5 fill-calm-700/20" />
                  <span>{post.supportCount} orang merasakan hal serupa</span>
                </span>
              </div>
            </SoftCard>
          ))}
        </div>
      </ContentColumn>
    </PageContainer>
  );
}
