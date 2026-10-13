'use client';

import React, { useState } from 'react';
import { PhoneCall, MessageCircle, ExternalLink, ArrowLeft, Search, SearchX } from 'lucide-react';
import { EMERGENCY_CONTACTS, toTelHref } from '@dengarin/config';
import { PageContainer, Button, Badge, Chip } from '@/components/ui';

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'Semua Layanan' },
    { id: 'national_emergency', label: 'Darurat Nasional' },
    { id: 'crisis_hotline', label: 'Pencegahan Krisis' },
    { id: 'teen_protection', label: 'Khusus Remaja (15–17 Th)' },
    { id: 'financial_advocacy', label: 'Bantuan Soal Pinjol & Keuangan' },
  ];

  const filtered = EMERGENCY_CONTACTS.filter((contact) => {
    const matchesCategory = activeCategory === 'all' || contact.category === activeCategory;
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageContainer size="default" className="space-y-8 lg:space-y-10">
      {/* Top Nav */}
      <div>
        <Button
          href="/dashboard"
          variant="outline"
          size="sm"
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Kembali ke beranda
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Left rail: header + filters (sticky on desktop) */}
      <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-6" aria-label="Pencarian dan filter layanan">
      {/* Header */}
      <div className="animate-reveal-up space-y-4 text-left">
        <Badge variant="calm" size="md">
          Direktori Terverifikasi
        </Badge>
        <h1 className="text-[2.25rem] sm:text-5xl lg:text-[2.75rem] xl:text-5xl font-bold text-ink tracking-[-0.03em] leading-[1.05] pt-1">
          Bantuan profesional &amp; saluran krisis Indonesia
        </h1>
        <p className="text-base sm:text-lg text-[#4A453E] leading-relaxed max-w-[34rem]">
          Meminta bantuan bukan tanda lemah, itu tanda kamu peduli pada dirimu sendiri. Ada orang-orang yang siap mendengarkan dan mendampingimu.
          Semua kontak di bawah ini adalah lembaga resmi, nirlaba terverifikasi, atau otoritas negara.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="animate-reveal-up [animation-delay:120ms] flex flex-col gap-3">
        <div className="relative">
          <label htmlFor="cari-layanan" className="block text-base font-bold text-ink mb-1.5">Cari layanan</label>
          <Search className="w-5 h-5 text-[#6B665E] absolute left-3.5 bottom-[15px] pointer-events-none" aria-hidden="true" />
          <input
            id="cari-layanan"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Contoh: psikolog, pinjol, remaja"
            className="w-full min-h-[52px] pl-11 pr-4 py-3 rounded-md border-2 border-ink text-base bg-white shadow-hard-sm placeholder:text-[#6B665E] transition-shadow duration-120 focus:outline-none focus:shadow-[3px_3px_0px_#3357EE] font-medium"
          />
        </div>

        <p className="text-sm font-bold text-ink">Saring berdasarkan jenis layanan</p>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter kategori layanan">
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              selected={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              aria-pressed={activeCategory === cat.id}
              size="sm"
            >
              {cat.label}
            </Chip>
          ))}
        </div>
      </div>

      </aside>

      {/* Right: directory. Every card carries a hotline, so none of them animate in or wait. */}
      <section className="lg:col-span-7 space-y-4" aria-label="Daftar layanan bantuan">
      {filtered.length === 0 && (
        <div role="status" className="py-12 px-6 border-2 border-dashed border-[#D8D3C9] rounded-lg text-left sm:text-center space-y-2">
          <SearchX className="w-6 h-6 text-[#6B665E] sm:mx-auto" aria-hidden="true" />
          <p className="text-lg font-bold text-ink">Belum ada layanan yang cocok</p>
          <p className="text-base text-[#59544D] leading-relaxed max-w-md sm:mx-auto">
            Coba kata kunci lain atau pilih &quot;Semua Layanan&quot;. Kalau kamu butuh bantuan sekarang, hubungi Healing119 (Kemenkes) di{' '}
            <a href={toTelHref('119 ext 8')} className="font-bold text-[#B3261E] underline underline-offset-4 decoration-2 tabular-nums">119 ext 8</a>.
          </p>
        </div>
      )}

      {/* Directory list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="bg-white border-2 border-ink rounded-lg p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-hard-sm text-left"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-bold px-2 py-0.5 rounded border border-ink ${
                  item.cost === 'gratis' ? 'bg-lime text-ink' : 'bg-paper text-ink'
                }`}>
                  {item.cost === 'gratis' ? 'Gratis' : 'Tarif normal'}
                </span>
                <span className="text-sm text-[#59544D] font-semibold tabular-nums">
                  {item.availableHours}
                </span>
              </div>
              <h2 className="font-bold text-lg text-ink leading-[1.25] pt-1">{item.name}</h2>
              <p className="text-base text-[#59544D] leading-relaxed">{item.description}</p>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-2 border-t border-[#D8D3C9]">
              {item.phone && (
                <a
                  href={toTelHref(item.phone)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cobalt hover:bg-calm-600 text-white text-base font-bold rounded border-2 border-ink shadow-hard-sm transition-[transform,box-shadow,background-color] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px]"
                  aria-label={`Telepon ${item.name}: ${item.phone}`}
                >
                  <PhoneCall className="w-5 h-5" aria-hidden="true" />
                  <span>Telepon <span className="tabular-nums">{item.phone}</span></span>
                </a>
              )}
              {item.whatsapp && (
                <a
                  href={`https://wa.me/62${item.whatsapp.replace(/^0/, '').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-lime text-ink text-base font-bold rounded border-2 border-ink shadow-hard-sm transition-[transform,box-shadow,background-color] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px]"
                  aria-label={`WhatsApp ${item.name}: ${item.whatsapp}`}
                >
                  <MessageCircle className="w-5 h-5" aria-hidden="true" />
                  <span>WhatsApp <span className="tabular-nums">{item.whatsapp}</span></span>
                </a>
              )}
              {item.website && (
                <a
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-paper hover:bg-white text-ink text-base font-bold rounded border-2 border-ink shadow-hard-sm transition-[transform,box-shadow,background-color] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none min-h-[48px]"
                  aria-label={`Buka situs resmi ${item.name} (tab baru)`}
                >
                  <ExternalLink className="w-5 h-5" aria-hidden="true" />
                  <span>Situs</span>
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      </section>
      </div>
    </PageContainer>
  );
}

