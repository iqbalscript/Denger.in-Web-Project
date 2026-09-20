'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  ArrowLeft,
  Heart,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  X,
  Send,
  RefreshCw,
  MessageCircleHeart
} from 'lucide-react';
import {
  PageContainer,
  ContentColumn,
  SoftCard,
  Button,
  Badge,
  Chip,
  Input,
  Textarea
} from '@/components/ui';
import type { InterventionDomain } from '@dengarin/types';

interface ForumPostItem {
  id: string;
  authorPseudonym: string;
  domain: InterventionDomain;
  title: string;
  body: string;
  createdAt: string;
  supportCount: number;
}

const INITIAL_FALLBACK_POSTS: ForumPostItem[] = [
  {
    id: 'seed-1',
    authorPseudonym: 'Sahabat Anonim #3912',
    domain: 'campus',
    title: 'Merasa tertinggal dari teman-teman yang sudah wisuda...',
    body: 'Setiap buka media sosial rasanya sesak melihat teman seangkatan sudah mulai kerja. Tapi pelan-pelan saya belajar bahwa setiap orang punya garis waktu masing-masing. Fokus hari ini hanya menyelesaikan revisi satu bab saja.',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    supportCount: 24,
  },
  {
    id: 'seed-2',
    authorPseudonym: 'Sahabat Anonim #7401',
    domain: 'finance',
    title: 'Bernapas lega setelah memberanikan diri membuat daftar hutang',
    body: 'Awalnya takut sekali melihat total tagihan. Tapi setelah diurai satu per satu dan menghubungi layanan pengaduan resmi, bebannya mulai terasa bisa dikelola. Jangan lari dari kenyataan, hadapi pelan-pelan.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    supportCount: 41,
  },
  {
    id: 'seed-3',
    authorPseudonym: 'Sahabat Anonim #1108',
    domain: 'work',
    title: 'Belajar menetapkan batas jam kerja setelah sempat burnout parah',
    body: 'Dulu saya selalu merasa bersalah kalau tidak membalas chat kantor di malam hari. Sampai fisik saya drop total. Sekarang jam 7 malam laptop ditutup. Pekerjaan penting, tapi kesehatan mental saya tidak tergantikan.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    supportCount: 38,
  },
  {
    id: 'seed-4',
    authorPseudonym: 'Sahabat Anonim #5234',
    domain: 'family',
    title: 'Menerima bahwa ekspektasi orang tua bukan kewajiban mutlak',
    body: 'Lelah sekali bertahun-tahun berusaha memenuhi standar keluarga yang tidak ada habisnya. Hari ini saya mulai berani menyuarakan apa yang sebenarnya saya inginkan dengan nada tenang.',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    supportCount: 19,
  }
];

const CATEGORIES: { id: string; label: string; domain?: InterventionDomain }[] = [
  { id: 'all', label: 'Semua Cerita' },
  { id: 'campus', label: 'Kampus & Skripsi', domain: 'campus' },
  { id: 'finance', label: 'Tekanan Finansial', domain: 'finance' },
  { id: 'work', label: 'Beban Pekerjaan', domain: 'work' },
  { id: 'family', label: 'Dinamika Keluarga', domain: 'family' },
  { id: 'relationship', label: 'Hubungan & Relasi', domain: 'relationship' },
  { id: 'general', label: 'Beban Pikiran', domain: 'general' },
];

function generateRandomPseudonym(): string {
  const adjectives = ['Tenang', 'Hangat', 'Tabah', 'Sabar', 'Teduh', 'Kuat', 'Damai'];
  const nouns = ['Langkah', 'Napas', 'Bintang', 'Pagi', 'Embun', 'Cahaya', 'Kembara'];
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${noun} ${adj} #${randNum}`;
}

export default function ForumPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState<ForumPostItem[]>(INITIAL_FALLBACK_POSTS);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [domain, setDomain] = useState<InterventionDomain>('general');
  const [authorPseudonym, setAuthorPseudonym] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // Supported posts tracking in local storage
  const [supportedPosts, setSupportedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dengarin_supported_posts');
      if (stored) {
        setSupportedPosts(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchPosts = useCallback(async (selectedDomain?: string) => {
    setLoading(true);
    try {
      const url = selectedDomain && selectedDomain !== 'all'
        ? `/api/forum?domain=${encodeURIComponent(selectedDomain)}`
        : '/api/forum';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.posts && Array.isArray(data.posts)) {
          // Combine server posts with fallback seed posts if empty
          if (data.posts.length === 0) {
            const filteredSeed = selectedDomain && selectedDomain !== 'all'
              ? INITIAL_FALLBACK_POSTS.filter((p) => p.domain === selectedDomain)
              : INITIAL_FALLBACK_POSTS;
            setPosts(filteredSeed);
          } else {
            setPosts(data.posts);
          }
        }
      }
    } catch {
      // Fallback already populated
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(activeTab);
  }, [activeTab, fetchPosts]);

  const handleOpenModal = () => {
    setAuthorPseudonym(generateRandomPseudonym());
    setTitle('');
    setBody('');
    setSubmitNotice(null);
    setIsModalOpen(true);
  };

  const handleSupport = async (postId: string) => {
    if (supportedPosts.has(postId)) return;

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, supportCount: p.supportCount + 1 } : p))
    );

    const updatedSupported = new Set(supportedPosts);
    updatedSupported.add(postId);
    setSupportedPosts(updatedSupported);
    try {
      localStorage.setItem('dengarin_supported_posts', JSON.stringify(Array.from(updatedSupported)));
    } catch {
      // ignore
    }

    // Call API if not a seed
    if (!postId.startsWith('seed-')) {
      try {
        await fetch(`/api/forum/${postId}/support`, { method: 'POST' });
      } catch {
        // silent fail
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitNotice(null);

    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          domain,
          authorPseudonym: authorPseudonym.trim() || 'Sahabat Anonim',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitNotice({
          type: 'error',
          message: data.error || 'Gagal mengirim cerita. Mohon periksa kembali tulisanmu.',
        });
        setSubmitting(false);
        return;
      }

      if (data.crisis) {
        setSubmitNotice({
          type: 'warning',
          message: 'Tulisanmu mengindikasikan beban berat. Silakan buka halaman Bantuan Darurat untuk berbicara langsung dengan tenaga ahli.',
        });
        setSubmitting(false);
        return;
      }

      if (data.moderation?.status === 'approved') {
        // Auto approved! Prepend post to feed
        if (data.post) {
          setPosts((prev) => [data.post, ...prev]);
        }
        setSubmitNotice({
          type: 'success',
          message: 'Ceritamu lolos verifikasi keselamatan dan langsung tayang di ruang solidaritas. Terima kasih telah berbagi!',
        });
        setTimeout(() => {
          setIsModalOpen(false);
        }, 1500);
      } else {
        setSubmitNotice({
          type: 'warning',
          message: 'Ceritamu telah tersimpan dan sedang menunggu tinjauan tim kurasi kami demi kenyamanan dan rasa aman bersama.',
        });
        setTimeout(() => {
          setIsModalOpen(false);
        }, 2000);
      }
    } catch {
      setSubmitNotice({
        type: 'error',
        message: 'Terjadi kendala jaringan saat mengirim cerita. Coba sesaat lagi.',
      });
    } finally {
      setSubmitting(false);
    }
  };

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

        {/* Header Intro */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="calm" size="md">
              <Users className="w-3.5 h-3.5 mr-1 text-calm-700" />
              Ruang Cerita Anonim
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-sand-900 tracking-tight">
              Solidaritas Tanpa Identitas
            </h1>
            <p className="text-xs sm:text-sm text-sand-700 leading-relaxed max-w-xl">
              Ruang aman membaca dan berbagi refleksi dengan sesama yang menghadapi beban hidup serupa.
              Bebas dari penghakiman dan 100% anonim.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={handleOpenModal}
            className="shrink-0 shadow-soft-sm"
          >
            Bagikan Cerita
          </Button>
        </div>

        {/* Safety & Moderation Trust Badge */}
        <div className="p-3.5 rounded-2xl bg-calm-50/90 border border-calm-200/80 flex items-center justify-between gap-3 text-xs text-calm-950">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-calm-700 shrink-0" />
            <span>
              <strong>Moderasi Keselamatan Otomatis Aktif:</strong> Setiap cerita disaring melalui gerbang krisis deterministik & filter kelayakan anti-toksik.
            </span>
          </div>
          <button
            onClick={() => fetchPosts(activeTab)}
            className="text-calm-700 hover:text-calm-900 transition-colors p-1"
            title="Segarkan feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
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
          {posts.map((post) => {
            const hasSupported = supportedPosts.has(post.id);
            const categoryLabel = CATEGORIES.find((c) => c.domain === post.domain)?.label || 'Beban Pikiran';

            return (
              <SoftCard
                key={post.id}
                variant="white"
                elevation="low"
                hoverEffect
                className="p-6 space-y-3.5 transition-all"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <Badge variant="sand" size="sm">
                    {post.authorPseudonym}
                  </Badge>
                  <span className="text-[11px] text-sand-500 font-medium">
                    {categoryLabel}
                  </span>
                </div>

                <h3 className="font-bold text-base text-sand-900 leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm text-sand-700 leading-relaxed whitespace-pre-line">
                  {post.body}
                </p>

                <div className="pt-3 flex items-center justify-between text-xs text-sand-600 border-t border-sand-100">
                  <button
                    onClick={() => handleSupport(post.id)}
                    className={`flex items-center gap-1.5 font-semibold py-1 px-2.5 rounded-full transition-all ${
                      hasSupported
                        ? 'bg-red-50 text-red-700 font-bold border border-red-200/80 shadow-soft-xs'
                        : 'text-sand-600 hover:text-red-700 hover:bg-sand-50'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        hasSupported ? 'fill-red-500 text-red-500 scale-110' : 'text-sand-400'
                      } transition-transform`}
                    />
                    <span>
                      {hasSupported
                        ? `Kamu & ${post.supportCount - 1 > 0 ? post.supportCount - 1 : 0} orang merasakan hal serupa`
                        : `${post.supportCount} orang merasakan hal serupa`}
                    </span>
                  </button>

                  <span className="text-[11px] text-sand-400">
                    {new Date(post.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              </SoftCard>
            );
          })}
        </div>

        {/* Modal: Bagikan Cerita Anonim */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-950/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-sand-200/90 shadow-soft-lg w-full max-w-lg p-6 sm:p-7 space-y-5 text-left relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-sand-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-calm-50 flex items-center justify-center text-calm-700">
                    <MessageCircleHeart className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-sand-900">Bagikan Cerita Anonim</h2>
                    <p className="text-[11px] text-sand-500">Kisahmu mungkin menguatkan orang lain hari ini.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full text-sand-400 hover:text-sand-700 hover:bg-sand-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitNotice && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                    submitNotice.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : submitNotice.type === 'warning'
                      ? 'bg-amber-50 border border-amber-200 text-amber-900'
                      : 'bg-red-50 border border-red-200 text-red-900'
                  }`}
                >
                  {submitNotice.type === 'success' ? (
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{submitNotice.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Pseudonym */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-sand-700 flex items-center justify-between">
                    <span>Nama Samaran Anonim</span>
                    <button
                      type="button"
                      onClick={() => setAuthorPseudonym(generateRandomPseudonym())}
                      className="text-calm-700 hover:text-calm-900 text-[11px] font-medium flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Acak Nama
                    </button>
                  </label>
                  <Input
                    value={authorPseudonym}
                    onChange={(e) => setAuthorPseudonym(e.target.value)}
                    placeholder="Contoh: Langkah Tenang #4829"
                    required
                  />
                </div>

                {/* Category Domain */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-sand-700">Topik Beban Hidup</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as InterventionDomain)}
                    className="w-full rounded-2xl border border-sand-200 bg-white px-3.5 py-2.5 text-xs text-sand-800 shadow-soft-xs focus:outline-none focus:ring-2 focus:ring-calm-600/30"
                  >
                    <option value="campus">Kampus & Skripsi</option>
                    <option value="finance">Tekanan Finansial & Pinjol</option>
                    <option value="work">Beban Pekerjaan & Burnout</option>
                    <option value="family">Dinamika Keluarga</option>
                    <option value="relationship">Hubungan & Asmara</option>
                    <option value="general">Beban Pikiran Umum</option>
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-sand-700">
                    <span>Judul Cerita</span>
                    <span className="text-sand-400 font-normal">{title.length}/100</span>
                  </div>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                    placeholder="Misal: Menyisihkan waktu istirahat di tengah revisi..."
                    required
                  />
                </div>

                {/* Story Body */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-sand-700">
                    <span>Isi Pengalaman / Refleksi</span>
                    <span className="text-sand-400 font-normal">{body.length}/2500</span>
                  </div>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, 2500))}
                    rows={5}
                    placeholder="Tuliskan apa yang kamu rasakan, bagaimana kamu melewatinya, atau langkah kecil yang kamu ambil..."
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-sand-50 border border-sand-200/80 text-[11px] text-sand-600 leading-relaxed">
                  🔒 <strong>Etika Ruang Aman:</strong> Dilarang menyertakan nama asli, kontak pribadi, tautan luar, promosi, atau ujaran kebencian. Postingan akan langsung disaring secara otomatis demi kenyamanan bersama.
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={<Send className="w-3.5 h-3.5" />}
                    disabled={submitting || title.trim().length < 5 || body.trim().length < 20}
                  >
                    {submitting ? 'Memverifikasi...' : 'Kirim Cerita'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </ContentColumn>
    </PageContainer>
  );
}
