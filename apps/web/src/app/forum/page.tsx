'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  ArrowLeft,
  MessageCircle,
  Flag,
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
  Button,
  Badge,
  Chip,
  Input,
  Textarea
} from '@/components/ui';
import type { InterventionDomain } from '@dengarin/types';
import { getForumThreadKey } from '@/lib/storage';
import { formatForumDate, formatForumDateTime } from '@/lib/forumDate';

interface ForumPostItem {
  id: string;
  authorPseudonym: string;
  domain: InterventionDomain;
  title: string;
  body: string;
  createdAt: string;
  supportCount: number;
  replyCount?: number;
}
interface ForumReplyItem { id: string; parentReplyId: string | null; authorAlias: string; body: string; createdAt: string; replyingToAlias: string | null; parentContextUnavailable: boolean; }

const INITIAL_FALLBACK_POSTS: ForumPostItem[] = [
  {
    id: 'seed-1',
    authorPseudonym: 'Sahabat Anonim #3912',
    domain: 'campus',
    title: 'Merasa tertinggal dari teman-teman yang sudah wisuda...',
    body: 'Setiap buka media sosial rasanya sesak melihat teman seangkatan sudah mulai kerja. Tapi pelan-pelan saya belajar bahwa setiap orang punya garis waktu masing-masing. Fokus hari ini hanya menyelesaikan revisi satu bab saja.',
    createdAt: '2026-09-29T02:00:00.000Z',
    supportCount: 24,
  },
  {
    id: 'seed-2',
    authorPseudonym: 'Sahabat Anonim #7401',
    domain: 'finance',
    title: 'Bernapas lega setelah memberanikan diri membuat daftar utang',
    body: 'Awalnya takut sekali melihat total tagihan. Tapi setelah diurai satu per satu dan menghubungi layanan pengaduan resmi, bebannya mulai terasa bisa dikelola. Jangan lari dari kenyataan, hadapi pelan-pelan.',
    createdAt: '2026-09-28T19:00:00.000Z',
    supportCount: 41,
  },
  {
    id: 'seed-3',
    authorPseudonym: 'Sahabat Anonim #1108',
    domain: 'work',
    title: 'Belajar menetapkan batas jam kerja setelah sempat burnout parah',
    body: 'Dulu saya selalu merasa bersalah kalau tidak membalas chat kantor di malam hari. Sampai fisik saya drop total. Sekarang jam 7 malam laptop ditutup. Pekerjaan penting, tapi kesehatan mental saya tidak tergantikan.',
    createdAt: '2026-09-28T07:00:00.000Z',
    supportCount: 38,
  },
  {
    id: 'seed-4',
    authorPseudonym: 'Sahabat Anonim #5234',
    domain: 'family',
    title: 'Menerima bahwa ekspektasi orang tua bukan kewajiban mutlak',
    body: 'Lelah sekali bertahun-tahun berusaha memenuhi standar keluarga yang tidak ada habisnya. Hari ini saya mulai berani menyuarakan apa yang sebenarnya saya inginkan dengan nada tenang.',
    createdAt: '2026-09-27T19:00:00.000Z',
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
  // Render pertama (server) memakai UTC agar hydration cocok; setelah mount, waktu mengikuti zona perangkat.
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [domain, setDomain] = useState<InterventionDomain>('general');
  const [authorPseudonym, setAuthorPseudonym] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const isSubmittingRef = useRef(false);

  const [replyPages, setReplyPages] = useState<Record<string, { replies: ForumReplyItem[]; count: number; loading: boolean }>>({});
  const [composer, setComposer] = useState<{ storyId: string; parent?: ForumReplyItem; trigger?: HTMLElement } | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyNotice, setReplyNotice] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<{ storyId: string; reply: ForumReplyItem; trigger?: HTMLElement } | null>(null);
  const [reportReason, setReportReason] = useState('other_safety');
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const replySubmittingRef = useRef(false);

  const fetchPosts = useCallback(async (selectedDomain?: string, options: { silent?: boolean } = {}) => {
    // Refresh otomatis di latar belakang tidak boleh memunculkan status loading.
    if (!options.silent) setLoading(true);
    try {
      const url = selectedDomain && selectedDomain !== 'all'
        ? `/api/forum?domain=${encodeURIComponent(selectedDomain)}`
        : '/api/forum';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const postsList = json.data?.posts ?? json.posts;
        if (Array.isArray(postsList)) {
          if (postsList.length === 0) {
            if (options.silent) return;
            const filteredSeed = selectedDomain && selectedDomain !== 'all'
              ? INITIAL_FALLBACK_POSTS.filter((p) => p.domain === selectedDomain)
              : INITIAL_FALLBACK_POSTS;
            setPosts(filteredSeed);
          } else {
            setPosts(postsList);
          }
        }
      }
    } catch {
      // Fallback already populated
    } finally {
      if (!options.silent) setLoading(false);
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

  const loadReplies = useCallback(async (postId: string, options: { silent?: boolean } = {}) => {
    if (!options.silent) setReplyPages((value) => ({ ...value, [postId]: { replies: value[postId]?.replies ?? [], count: value[postId]?.count ?? 0, loading: true } }));
    try {
      const res = await fetch(`/api/forum/${postId}/replies`);
      const json = await res.json(); const data = json.data ?? json;
      if (res.ok) setReplyPages((value) => {
        const current = value[postId];
        // Refresh otomatis: abaikan bila thread sudah ditutup, dan jangan render ulang bila isinya sama.
        if (options.silent) {
          if (!current) return value;
          const unchanged = current.count === data.approvedCount && current.replies.length === data.replies.length
            && current.replies.every((reply, index) => reply.id === data.replies[index]?.id);
          if (unchanged) return value;
        }
        return { ...value, [postId]: { replies: data.replies, count: data.approvedCount, loading: false } };
      });
    } catch {
      // Refresh otomatis gagal diam-diam; percobaan berikutnya menyusul.
      if (!options.silent) throw new Error('reload-failed');
    } finally { if (!options.silent) setReplyPages((value) => value[postId] ? ({ ...value, [postId]: { ...value[postId], loading: false } }) : value); }
  }, []);

  // Balasan dan hitungan baru dari orang lain muncul otomatis tanpa reload: polling
  // ringan hanya saat tab terlihat, plus refresh seketika saat tab kembali aktif.
  // Server memakai cache Redis berversi, jadi tiap poll murah dan tetap segar.
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const openThreadIds = Object.keys(replyPages).sort().join(',');
  useEffect(() => {
    const refresh = (includeFeed: boolean) => {
      if (document.hidden) return;
      openThreadIds.split(',').filter(Boolean).forEach((id) => { void loadReplies(id, { silent: true }); });
      if (includeFeed) void fetchPosts(activeTabRef.current, { silent: true });
    };
    let tick = 0;
    const interval = setInterval(() => { tick += 1; refresh(tick % 3 === 0); }, 10_000);
    const onReturn = () => refresh(true);
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, [openThreadIds, loadReplies, fetchPosts]);

  const openComposer = (storyId: string, parent?: ForumReplyItem, trigger?: HTMLElement) => { setComposer({ storyId, parent, trigger }); setReplyBody(''); setReplyNotice(null); };
  const submitReply = async (event: React.FormEvent) => {
    event.preventDefault(); if (!composer || replySubmittingRef.current || replyBody.trim().length < 3 || replyBody.trim().length > 800) return;
    const threadKey = getForumThreadKey(composer.storyId); if (!threadKey) { setReplyNotice('Sesi anonim tidak tersedia. Coba lagi.'); return; }
    replySubmittingRef.current = true; setReplySubmitting(true); setReplyNotice(null);
    try {
      const res = await fetch(`/api/forum/${composer.storyId}/replies`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: replyBody, parentReplyId: composer.parent?.id, threadKey }) });
      const json = await res.json().catch(() => null); const data = json?.data ?? json;
      if (data?.crisis) { window.location.assign('/crisis'); return; }
      if (!res.ok) { setReplyNotice(json?.error ?? 'Balasan belum terkirim. Coba lagi.'); return; }
      setReplyNotice(data.moderation?.status === 'pending_review' ? 'Balasan sedang ditinjau moderator.' : 'Balasanmu terkirim. Terima kasih sudah menguatkan.');
      setReplyBody('');
      if (data.moderation?.status === 'approved') {
        const storyId = composer.storyId;
        setPosts((list) => list.map((post) => (post.id === storyId ? { ...post, replyCount: (post.replyCount ?? 0) + 1 } : post)));
        await loadReplies(storyId);
      }
      setTimeout(() => { composer.trigger?.focus(); setComposer(null); }, 900);
    } catch { setReplyNotice('Koneksi terputus. Balasan belum terkirim; kamu dapat mencoba lagi.'); }
    finally { replySubmittingRef.current = false; setReplySubmitting(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
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

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setSubmitNotice({
          type: 'error',
          message: json?.error || json?.message || 'Ceritamu belum terkirim. Coba periksa lagi tulisanmu, atau coba beberapa saat lagi.',
        });
        return;
      }

      const payload = (json?.data ?? json) as any;

      if (payload?.crisis) {
        setSubmitNotice({
          type: 'warning',
          message: 'Sepertinya kamu sedang memikul beban yang sangat berat, dan kami peduli. Silakan buka halaman Bantuan Darurat untuk berbicara langsung dengan tenaga ahli.',
        });
        return;
      }

      if (payload?.moderation?.status === 'approved') {
        if (payload.post) {
          setPosts((prev) => [payload.post, ...prev]);
        }
        setSubmitNotice({
          type: 'success',
          message: 'Ceritamu sudah dibagikan secara anonim. Terima kasih sudah berani bercerita, dan sudah menguatkan orang lain.',
        });
        setTimeout(() => {
          setIsModalOpen(false);
          setTitle('');
          setBody('');
          setAuthorPseudonym('');
          setSubmitNotice(null);
        }, 2000);
      } else if (payload?.moderation?.status === 'pending_review') {
        setSubmitNotice({
          type: 'warning',
          message: 'Ceritamu sedang kami tinjau sebentar supaya ruang ini tetap aman. Terima kasih sudah menunggu.',
        });
        setTimeout(() => {
          setIsModalOpen(false);
          setTitle('');
          setBody('');
          setAuthorPseudonym('');
          setSubmitNotice(null);
        }, 3000);
      } else {
        setSubmitNotice({
          type: 'error',
          message: payload?.moderation?.reason || 'Ceritamu belum bisa kami tampilkan karena belum sesuai panduan komunitas. Kamu boleh mengubahnya dan mencoba lagi.',
        });
      }
    } catch {
      setSubmitNotice({
        type: 'error',
        message: 'Koneksimu sepertinya terputus. Periksa internetmu, lalu coba lagi, ya.',
      });
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <PageContainer size="narrow">
      <ContentColumn size="md" className="space-y-8 text-left">
        <div>
          <Button href="/dashboard" variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            KEMBALI KE DASHBOARD
          </Button>
        </div>

        {/* Header Intro */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="calm" size="md">
              <Users className="w-3.5 h-3.5 mr-1" />
              Ruang Cerita Anonim
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight uppercase leading-none">
              SOLIDARITAS TANPA IDENTITAS
            </h1>
            <p className="text-xs sm:text-sm text-ink/80 leading-relaxed max-w-xl font-medium">
              Di sini kamu bisa membaca dan berbagi cerita dengan orang-orang yang memahami rasanya.
              Tanpa penghakiman, 100% anonim, dan kamu tidak sendirian.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={handleOpenModal}
            className="shrink-0"
          >
            BAGIKAN CERITA →
          </Button>
        </div>

        {/* Safety & Moderation Trust Badge */}
        <div className="p-3.5 rounded-md bg-yellow/20 border-2 border-ink shadow-hard-sm flex items-center justify-between gap-3 text-xs text-ink font-medium">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cobalt shrink-0" />
            <span>
              <strong className="font-black uppercase tracking-wide">DIJAGA BERSAMA:</strong> Setiap cerita disaring lewat gerbang krisis dan filter anti-toxic supaya ruang ini tetap aman untuk semua.
            </span>
          </div>
          <button
            onClick={() => fetchPosts(activeTab)}
            className="text-ink hover:text-cobalt transition-colors p-1"
            title="Muat ulang cerita"
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
        {loading ? (
          <div className="bg-white border-2 border-ink rounded-lg p-8 text-center text-xs text-ink/70 font-bold shadow-hard-sm">
            Sedang mengambil cerita-cerita untukmu...
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border-2 border-ink rounded-lg p-8 sm:p-12 text-center space-y-4 shadow-hard-sm">
            <div className="w-12 h-12 rounded-full bg-paper border-2 border-ink flex items-center justify-center mx-auto text-ink">
              <MessageCircleHeart className="w-6 h-6 text-cobalt" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-base text-ink uppercase tracking-wide">Belum Ada Cerita di Topik Ini</h3>
              <p className="text-xs sm:text-sm text-ink/70 max-w-md mx-auto font-medium">
                Jadilah yang pertama berbagi pengalaman atau beban pikiranmu secara aman dan anonim.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleOpenModal} icon={<PlusCircle className="w-4 h-4" />}>
              TULIS CERITA PERTAMA →
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const categoryLabel = CATEGORIES.find((c) => c.domain === post.domain)?.label || 'Beban Pikiran';
              const thread = replyPages[post.id];

              return (
                <div
                  key={post.id}
                  className="bg-white border-2 border-ink rounded-lg p-6 space-y-3.5 shadow-hard-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 bg-paper border border-ink rounded text-ink">
                      {post.authorPseudonym}
                    </span>
                    <span className="text-[11px] text-ink/60 font-bold uppercase tracking-wide">
                      {categoryLabel}
                    </span>
                  </div>

                  <h3 className="font-black text-base text-ink uppercase tracking-wide leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-ink/80 leading-relaxed whitespace-pre-line font-medium">
                    {post.body}
                  </p>

                  <div className="pt-3 flex flex-wrap items-center gap-2 text-xs text-ink/70 border-t-2 border-ink">
                    <button type="button" onClick={() => thread ? setReplyPages((value) => { const next = { ...value }; delete next[post.id]; return next; }) : loadReplies(post.id)} className="min-h-[44px] px-3 border-2 border-ink rounded font-bold shadow-hard-sm hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt">
                      <MessageCircle className="inline w-3.5 h-3.5 mr-1" /> {thread ? 'SEMBUNYIKAN BALASAN' : `LIHAT ${post.replyCount ?? 0} BALASAN`}
                    </button>
                    <button type="button" onClick={(event) => openComposer(post.id, undefined, event.currentTarget)} className="min-h-[44px] px-3 border-2 border-ink rounded font-bold shadow-hard-sm hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt">BALAS</button>
                    <span className="text-[11px] text-ink/50 font-bold">
                      {formatForumDate(post.createdAt, isClient)}
                    </span>
                  </div>
                  {thread && (
                    <section aria-label="Balasan cerita" className="space-y-3 pt-2">
                      {thread.loading && <p aria-live="polite" className="text-xs font-bold">Memuat balasan…</p>}
                      {!thread.loading && thread.replies.length === 0 && <p className="text-xs text-ink/70">Belum ada balasan. Jadilah yang pertama memberi dukungan yang aman.</p>}
                      {thread.replies.map((reply) => (
                        <article key={reply.id} className={`border-2 border-ink rounded p-3 space-y-2 ${reply.parentReplyId ? 'ml-3 sm:ml-6' : ''}`}>
                          {reply.parentReplyId && <p className="text-[11px] font-bold text-ink/60">↳ {reply.parentContextUnavailable ? 'konteks balasan tidak tersedia' : `membalas ${reply.replyingToAlias}`}</p>}
                          <div className="flex justify-between gap-2"><strong className="text-xs">{reply.authorAlias}</strong><time className="text-[11px] text-ink/60" dateTime={reply.createdAt}>{formatForumDateTime(reply.createdAt, isClient)}</time></div>
                          <p className="text-xs sm:text-sm whitespace-pre-line">{reply.body}</p>
                          <div className="flex gap-2"><button type="button" onClick={(event) => openComposer(post.id, reply, event.currentTarget)} className="min-h-[44px] px-3 font-bold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt">BALAS</button><button type="button" aria-label={`Laporkan balasan ${reply.authorAlias}`} onClick={(event) => { setReportTarget({ storyId: post.id, reply, trigger: event.currentTarget }); setReportReason('other_safety'); setReportNotice(null); }} className="min-h-[44px] px-3 font-bold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"><Flag className="inline w-3 h-3 mr-1" />LAPORKAN</button></div>
                        </article>
                      ))}
                    </section>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {composer && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-ink/50" role="dialog" aria-modal="true" aria-labelledby="reply-composer-title" onKeyDown={(event) => { if (event.key === 'Escape' && !replySubmitting) { composer.trigger?.focus(); setComposer(null); } }}>
            <div className="bg-white w-full max-w-lg border-2 border-ink rounded-lg shadow-hard-lg p-5 space-y-3">
              <div className="flex items-center justify-between gap-3"><h2 id="reply-composer-title" className="font-black uppercase text-sm">{composer.parent ? `Membalas ${composer.parent.authorAlias}` : 'Balas cerita ini'}</h2><button type="button" aria-label="Tutup penulis balasan" onClick={() => { composer.trigger?.focus(); setComposer(null); }} className="min-w-[44px] min-h-[44px] font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt">×</button></div>
              <p className="text-xs text-ink/70">Nama samaran dibuat server untuk percakapan ini saja. Hapus Data Lokal menghapus kunci lokal, bukan balasan yang sudah publik.</p>
              <form onSubmit={submitReply} className="space-y-3">
                <textarea autoFocus value={replyBody} onChange={(event) => setReplyBody(event.target.value)} minLength={3} maxLength={800} required aria-describedby="reply-limit reply-status" className="w-full min-h-28 border-2 border-ink rounded p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt" placeholder="Tulis dukungan dengan aman, tanpa kontak atau tautan." />
                <div className="flex items-center justify-between text-xs"><span id="reply-limit">{replyBody.length}/800 karakter</span><button type="submit" disabled={replySubmitting || replyBody.trim().length < 3 || replyBody.trim().length > 800} className="min-h-[44px] px-4 border-2 border-ink rounded bg-lime font-bold shadow-hard-sm disabled:opacity-50">{replySubmitting ? 'MENGIRIM…' : 'KIRIM BALASAN'}</button></div>
                <p id="reply-status" aria-live="polite" className="text-xs font-bold">{replyNotice}</p>
              </form>
            </div>
          </div>
        )}

        {reportTarget && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-ink/50" role="dialog" aria-modal="true" aria-labelledby="report-title">
            <form onSubmit={async (event) => { event.preventDefault(); const res = await fetch(`/api/forum/${reportTarget.storyId}/replies/${reportTarget.reply.id}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: reportReason }) }); setReportNotice(res.ok ? 'Laporan diterima untuk ditinjau.' : 'Laporan belum terkirim. Coba lagi.'); if (res.ok) setTimeout(() => { reportTarget.trigger?.focus(); setReportTarget(null); }, 900); }} className="bg-white w-full max-w-md border-2 border-ink rounded-lg shadow-hard-lg p-5 space-y-3">
              <div className="flex justify-between items-center"><h2 id="report-title" className="font-black uppercase text-sm">Laporkan balasan</h2><button type="button" aria-label="Tutup laporan" onClick={() => { reportTarget.trigger?.focus(); setReportTarget(null); }} className="min-w-[44px] min-h-[44px] font-black">×</button></div>
              <label className="block text-xs font-bold" htmlFor="report-reason">Alasan laporan</label><select id="report-reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="w-full min-h-[44px] border-2 border-ink rounded px-2"><option value="harassment_or_bullying">Perundungan atau pelecehan</option><option value="self_harm_or_dangerous_advice">Saran menyakiti diri atau berbahaya</option><option value="contact_or_privacy">Kontak atau privasi</option><option value="scam_or_spam">Scam atau spam</option><option value="impersonation">Penyamaran</option><option value="other_safety">Masalah keamanan lainnya</option></select>
              <button type="submit" className="min-h-[44px] px-4 border-2 border-ink rounded bg-yellow font-bold shadow-hard-sm">KIRIM LAPORAN</button><p aria-live="polite" className="text-xs font-bold">{reportNotice}</p>
            </form>
          </div>
        )}

        {/* Modal: Bagikan Cerita Anonim */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-none">
            <div className="bg-white rounded-lg border-2 border-ink shadow-hard-lg w-full max-w-lg p-6 sm:p-7 space-y-5 text-left relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-yellow border-2 border-ink flex items-center justify-center text-ink font-black">
                    <MessageCircleHeart className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-ink uppercase tracking-wide">Bagikan Cerita Anonim</h2>
                    <p className="text-[11px] text-ink/70 font-medium">Kisahmu mungkin menguatkan orang lain hari ini.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded text-ink hover:bg-paper transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitNotice && (
                <div
                  className={`p-3.5 rounded-md border-2 border-ink text-xs flex items-start gap-2.5 shadow-hard-sm ${
                    submitNotice.type === 'success'
                      ? 'bg-lime text-ink'
                      : submitNotice.type === 'warning'
                      ? 'bg-yellow text-ink'
                      : 'bg-coral text-white'
                  }`}
                >
                  {submitNotice.type === 'success' ? (
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed font-medium">{submitNotice.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Pseudonym */}
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-ink flex items-center justify-between">
                    <span>Nama Samaran Anonim</span>
                    <button
                      type="button"
                      onClick={() => setAuthorPseudonym(generateRandomPseudonym())}
                      className="text-cobalt hover:underline text-[11px] font-bold flex items-center gap-1"
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
                  <label className="text-xs font-black uppercase tracking-wider text-ink">Topik Beban Hidup</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as InterventionDomain)}
                    className="w-full rounded-md border-2 border-ink bg-white px-3.5 py-2.5 text-xs text-ink shadow-hard-sm focus:outline-none font-medium"
                  >
                    <option value="campus">Kampus &amp; Skripsi</option>
                    <option value="finance">Tekanan Finansial &amp; Pinjol</option>
                    <option value="work">Beban Pekerjaan &amp; Burnout</option>
                    <option value="family">Dinamika Keluarga</option>
                    <option value="relationship">Hubungan &amp; Asmara</option>
                    <option value="general">Beban Pikiran Umum</option>
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-black uppercase tracking-wider text-ink">
                    <span>Judul Cerita</span>
                    <span className="text-ink/50 font-normal">{title.length}/100</span>
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
                  <div className="flex justify-between text-xs font-black uppercase tracking-wider text-ink">
                    <span>Isi Pengalaman / Refleksi</span>
                    <span className="text-ink/50 font-normal">{body.length}/2500</span>
                  </div>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, 2500))}
                    rows={5}
                    placeholder="Tuliskan apa yang kamu rasakan, bagaimana kamu melewatinya, atau langkah kecil yang kamu ambil..."
                    required
                  />
                </div>

                <div className="p-3 rounded-md bg-paper border-2 border-ink text-[11px] text-ink leading-relaxed font-medium">
                  🔒 <strong className="font-bold">ETIKA RUANG AMAN:</strong> Dilarang menyertakan nama asli, kontak pribadi, tautan luar, promosi, atau ujaran kebencian. Postingan akan langsung disaring secara otomatis demi kenyamanan bersama.
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
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
                    {submitting ? 'Memverifikasi...' : 'KIRIM CERITA →'}
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

