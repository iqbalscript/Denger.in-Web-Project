'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PhoneCall, MessageCircle, ExternalLink, ArrowLeft, Search } from 'lucide-react';
import { EMERGENCY_CONTACTS } from '@dengarin/config';
import { PageContainer, Button, Badge, Chip } from '@/components/ui';

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
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            KEMBALI KE DASHBOARD
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white border-2 border-ink rounded-lg p-6 sm:p-8 space-y-3 shadow-hard text-left">
        <Badge variant="calm" size="md">
          Direktori Terverifikasi
        </Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight uppercase leading-none pt-1">
          BANTUAN PROFESIONAL &amp; SALURAN KRISIS INDONESIA
        </h1>
        <p className="text-xs sm:text-sm text-ink/80 leading-relaxed max-w-2xl font-medium">
          Ketika bantuan mandiri tidak lagi mencukupi, tenaga profesional manusia siap mendampingimu.
          Semua kontak di bawah ini merupakan lembaga resmi, nirlaba terverifikasi, atau otoritas negara.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink/40 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari layanan, nomor telepon, atau jenis bantuan..."
            aria-label="Cari layanan bantuan"
            className="w-full pl-10 pr-4 py-2.5 rounded-md border-2 border-ink text-xs sm:text-sm bg-white shadow-hard-sm focus:outline-none font-medium"
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
          <div
            key={item.id}
            className="bg-white border-2 border-ink rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all text-left"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-ink ${
                  item.cost === 'gratis' ? 'bg-lime text-ink' : 'bg-paper text-ink'
                }`}>
                  {item.cost === 'gratis' ? 'Bebas Pulsa / Gratis' : 'Tarif Normal'}
                </span>
                <span className="text-xs text-ink/60 font-bold uppercase tracking-wide">
                  {item.availableHours}
                </span>
              </div>
              <h3 className="font-black text-base text-ink uppercase tracking-wide leading-snug">{item.name}</h3>
              <p className="text-xs text-ink/80 leading-relaxed font-medium">{item.description}</p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2 border-t-2 border-ink">
              {item.phone && (
                <a
                  href={`tel:${item.phone.replace(/[^0-9]/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cobalt hover:bg-cobalt-dark text-white text-xs font-black uppercase rounded border-2 border-ink shadow-hard-sm transition-all min-h-[38px]"
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-lime text-ink text-xs font-black uppercase rounded border-2 border-ink shadow-hard-sm transition-all min-h-[38px]"
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
                  className="p-2 bg-paper hover:bg-paper-dark text-ink rounded border-2 border-ink shadow-hard-sm transition-all ml-auto min-h-[38px] min-w-[38px] flex items-center justify-center"
                  title="Buka Website"
                  aria-label={`Buka website resmi ${item.name}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

