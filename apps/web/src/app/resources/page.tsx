'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PhoneCall, MessageCircle, ExternalLink, ArrowLeft, Search } from 'lucide-react';
import { EMERGENCY_CONTACTS } from '@dengarin/config';
import { PageContainer, SoftCard, Button, Badge, Chip } from '@/components/ui';

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'Semua Layanan' },
    { id: 'national_emergency', label: 'Darurat Nasional' },
    { id: 'crisis_hotline', label: 'Pencegahan Krisis' },
    { id: 'teen_protection', label: 'Khusus Remaja (15–17 Th)' },
    { id: 'financial_advocacy', label: 'Advokasi Pinjol / Finansial' },
  ];

  const filtered = EMERGENCY_CONTACTS.filter((contact) => {
    const matchesCategory = activeCategory === 'all' || contact.category === activeCategory;
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageContainer size="default" className="space-y-8">
      {/* Top Nav */}
      <div>
        <Link href="/dashboard" className="inline-block">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Kembali ke Dashboard
          </Button>
        </Link>
      </div>

      {/* Header */}
      <SoftCard variant="white" elevation="medium" className="p-6 sm:p-8 space-y-3">
        <Badge variant="calm" size="md">
          Direktori Terverifikasi
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight pt-1">
          Bantuan Profesional & Saluran Krisis Indonesia
        </h1>
        <p className="text-xs sm:text-sm text-sand-700 leading-relaxed max-w-2xl">
          Ketika bantuan mandiri tidak lagi mencukupi, tenaga profesional manusia siap mendampingimu.
          Semua kontak di bawah ini merupakan lembaga resmi, nirlaba terverifikasi, atau otoritas negara.
        </p>
      </SoftCard>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-sand-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari layanan, nomor telepon, atau jenis bantuan..."
            aria-label="Cari layanan bantuan"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-calm-700/30 focus:border-calm-700"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              selected={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              size="sm"
            >
              {cat.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <SoftCard
            key={item.id}
            variant="white"
            elevation="low"
            className="p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant={item.cost === 'gratis' ? 'calm' : 'sand'}
                  size="sm"
                >
                  {item.cost === 'gratis' ? 'Bebas Pulsa / Gratis' : 'Tarif Normal'}
                </Badge>
                <span className="text-xs text-sand-500 font-medium">
                  {item.availableHours}
                </span>
              </div>
              <h3 className="font-bold text-base text-sand-900 leading-snug">{item.name}</h3>
              <p className="text-xs text-sand-700 leading-relaxed">{item.description}</p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-sand-100">
              {item.phone && (
                <a
                  href={`tel:${item.phone.replace(/[^0-9]/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-calm-700 hover:bg-calm-800 text-white text-xs font-semibold rounded-xl shadow-soft-xs transition-colors min-h-[38px] focus-visible:outline-calm-700"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{item.phone}</span>
                </a>
              )}
              {item.whatsapp && (
                <a
                  href={`https://wa.me/62${item.whatsapp.replace(/^0/, '').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-soft-xs transition-colors min-h-[38px] focus-visible:outline-emerald-700"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WA: {item.whatsapp}</span>
                </a>
              )}
              {item.website && (
                <a
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-sand-100 hover:bg-sand-200 text-sand-800 rounded-xl transition-colors ml-auto min-h-[38px] min-w-[38px] flex items-center justify-center focus-visible:outline-sand-700"
                  title="Buka Website"
                  aria-label={`Buka website resmi ${item.name}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </SoftCard>
        ))}
      </div>
    </PageContainer>
  );
}
