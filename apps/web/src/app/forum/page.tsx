'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Flag,
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
  Button,
  Badge,
  Chip,
  Input,
  Textarea,
  Reveal
} from '@/components/ui';
import type { InterventionDomain } from '@dengarin/types';
import { getForumThreadKey } from '@/lib/storage';
import { useConsentGuard } from '@/lib/useConsentGuard';
import { ConsentPending } from '@/components/ConsentPending';
import { formatForumDate, formatForumDateTime } from '@/lib/forumDate';
import { useLanguage, useText } from '@/i18n';
import { domainText } from '@/i18n/config';
import { forumText } from '@/i18n/pages/forum';

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

type ForumText = typeof forumText.id;

// Contoh cerita saat server kosong. Tanggal tetap literal (bukan jam sekarang) agar SSR deterministik.
function fallbackPosts(t: ForumText): ForumPostItem[] {
  const seeds = [
    { id: 'seed-1', authorPseudonym: `${t.defaultPseudonym} #3912`, domain: 'campus' as const, createdAt: '2026-09-29T02:00:00.000Z', supportCount: 24 },
    { id: 'seed-2', authorPseudonym: `${t.defaultPseudonym} #7401`, domain: 'finance' as const, createdAt: '2026-09-28T19:00:00.000Z', supportCount: 41 },
    { id: 'seed-3', authorPseudonym: `${t.defaultPseudonym} #1108`, domain: 'work' as const, createdAt: '2026-09-28T07:00:00.000Z', supportCount: 38 },
    { id: 'seed-4', authorPseudonym: `${t.defaultPseudonym} #5234`, domain: 'family' as const, createdAt: '2026-09-27T19:00:00.000Z', supportCount: 19 },
  ];
  return seeds.map((seed, index) => ({ ...seed, title: t.seeds[index].title, body: t.seeds[index].body }));
}

const CATEGORY_DOMAINS: InterventionDomain[] = ['campus', 'finance', 'work', 'family', 'relationship', 'general'];
const REPORT_REASONS = ['harassment_or_bullying', 'self_harm_or_dangerous_advice', 'contact_or_privacy', 'scam_or_spam', 'impersonation', 'other_safety'] as const;

function generateRandomPseudonym(t: ForumText): string {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const adj = t.pseudonymAdjectives[Math.floor(Math.random() * t.pseudonymAdjectives.length)];
  const noun = t.pseudonymNouns[Math.floor(Math.random() * t.pseudonymNouns.length)];
  return `${noun} ${adj} #${randNum}`;
}

export default function ForumPage() {
  const { ready } = useConsentGuard();
  const { lang } = useLanguage();
  const t = useText(forumText);
  const categories = [
    { id: 'all', label: t.allStories, domain: undefined as InterventionDomain | undefined },
    ...CATEGORY_DOMAINS.map((d) => ({ id: d, label: domainText(d, lang).label, domain: d as InterventionDomain | undefined })),
  ];
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState<ForumPostItem[]>(() => fallbackPosts(forumText.id));
  const [usingFallback, setUsingFallback] = useState(true);
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

  // Teks bahasa aktif untuk callback yang stabil (tanpa membuat ulang fetchPosts tiap ganti bahasa).
  const tRef = useRef(t);
  tRef.current = t;
  // Contoh cerita ikut bahasa saat bahasa diganti.
  useEffect(() => {
    if (usingFallback) setPosts((list) => fallbackPosts(t).filter((seed) => list.some((p) => p.id === seed.id)));
  }, [t, usingFallback]);

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
            const seeds = fallbackPosts(tRef.current);
            const filteredSeed = selectedDomain && selectedDomain !== 'all'
              ? seeds.filter((p) => p.domain === selectedDomain)
              : seeds;
            setPosts(filteredSeed);
            setUsingFallback(true);
          } else {
            setPosts(postsList);
            setUsingFallback(false);
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
    if (!ready) return;
    fetchPosts(activeTab);
  }, [ready, activeTab, fetchPosts]);

  const handleOpenModal = () => {
    setAuthorPseudonym(generateRandomPseudonym(t));
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
    const threadKey = getForumThreadKey(composer.storyId); if (!threadKey) { setReplyNotice(t.replyNoSession); return; }
    replySubmittingRef.current = true; setReplySubmitting(true); setReplyNotice(null);
    try {
      const res = await fetch(`/api/forum/${composer.storyId}/replies`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: replyBody, parentReplyId: composer.parent?.id, threadKey }) });
      const json = await res.json().catch(() => null); const data = json?.data ?? json;
      if (data?.crisis) { window.location.assign('/crisis'); return; }
      if (!res.ok) { setReplyNotice(json?.error ?? t.replyFailed); return; }
      setReplyNotice(data.moderation?.status === 'pending_review' ? t.replyPending : t.replySent);
      setReplyBody('');
      if (data.moderation?.status === 'approved') {
        const storyId = composer.storyId;
        setPosts((list) => list.map((post) => (post.id === storyId ? { ...post, replyCount: (post.replyCount ?? 0) + 1 } : post)));
        await loadReplies(storyId);
      }
      setTimeout(() => { composer.trigger?.focus(); setComposer(null); }, 900);
    } catch { setReplyNotice(t.replyOffline); }
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
          authorPseudonym: authorPseudonym.trim() || t.defaultPseudonym,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setSubmitNotice({
          type: 'error',
          message: json?.error || json?.message || t.submitFailed,
        });
        return;
      }

      const payload = (json?.data ?? json) as any;

      if (payload?.crisis) {
        setSubmitNotice({
          type: 'warning',
          message: t.submitCrisis,
        });
        return;
      }

      if (payload?.moderation?.status === 'approved') {
        if (payload.post) {
          setPosts((prev) => [payload.post, ...prev]);
          setUsingFallback(false);
        }
        setSubmitNotice({
          type: 'success',
          message: t.submitApproved,
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
          message: t.submitPending,
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
          message: payload?.moderation?.reason || t.submitRejected,
        });
      }
    } catch {
      setSubmitNotice({
        type: 'error',
        message: t.submitOffline,
      });
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (!ready) return <ConsentPending />;

  return (
    <PageContainer size="default">
      <div className="space-y-8 text-left">
        <div className="animate-reveal-up">
          <Button href="/dashboard" variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            {t.back}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-5 space-y-6 animate-reveal-up [animation-delay:80ms]">
        {/* Header Intro */}
        <div className="flex flex-col sm:flex-row sm:items-end lg:flex-col lg:items-start justify-between gap-5">
          <div className="space-y-3">
            <Badge variant="calm" size="md">
              <Users className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              {t.badge}
            </Badge>
            <h1 className="text-[2rem] sm:text-4xl lg:text-5xl font-bold text-ink tracking-[-0.03em] leading-[1.08]">
              {t.title}
            </h1>
            <p className="text-base sm:text-lg text-[#4A453E] leading-relaxed max-w-[34rem]">
              {t.intro}
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            iconPosition="end"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={handleOpenModal}
            className="shrink-0 w-full sm:w-auto"
          >
            {t.share}
          </Button>
        </div>

        {/* Safety & Moderation Trust Badge */}
        <div className="py-1 pl-4 border-l-4 border-cobalt flex items-center justify-between gap-3 text-base text-[#4A453E] leading-relaxed">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cobalt shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong className="font-bold text-ink">{t.safetyTitle}</strong> {t.safetyBody}
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchPosts(activeTab)}
            className="shrink-0 min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded-[4px] text-sm font-bold text-ink border-2 border-ink bg-white hover:bg-paper transition-colors duration-200 ease-spring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
            aria-label={t.reloadAria}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{t.reload}</span>
          </button>
        </div>

        {/* Category Filter Tabs */}
        <p className="text-sm font-bold text-ink">{t.pickTopic}</p>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.topics}>
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              selected={activeTab === cat.id}
              aria-pressed={activeTab === cat.id}
              onClick={() => setActiveTab(cat.id)}
              size="sm"
            >
              {cat.label}
            </Chip>
          ))}
        </div>
        </div>

        <section className="lg:col-span-7" aria-label={t.storyList}>
        {/* Story Stream */}
        {loading ? (
          <div className="space-y-4" role="status" aria-live="polite">
            <span className="sr-only">{t.loadingStories}</span>
            {[0, 1].map((i) => (
              <div key={i} className="bg-white border-2 border-[#D8D3C9] rounded-[8px] p-6 space-y-3 animate-pulse" aria-hidden="true">
                <div className="flex justify-between"><div className="h-5 w-36 rounded-[4px] bg-[#F5ECE0]" /><div className="h-4 w-20 rounded-[4px] bg-[#F5ECE0]" /></div>
                <div className="h-5 w-3/4 rounded-[4px] bg-[#F5ECE0]" />
                <div className="space-y-2"><div className="h-3.5 w-full rounded-[4px] bg-[#F5ECE0]" /><div className="h-3.5 w-5/6 rounded-[4px] bg-[#F5ECE0]" /></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="animate-reveal-up bg-white border-2 border-ink rounded-[8px] p-8 sm:p-12 text-center space-y-5 shadow-hard-sm">
            <div className="w-12 h-12 rounded-[6px] bg-paper border-2 border-ink flex items-center justify-center mx-auto text-ink" aria-hidden="true">
              <MessageCircleHeart className="w-6 h-6 text-cobalt" />
            </div>
            <div className="space-y-2">
              <h2 className="font-bold text-xl text-ink tracking-[-0.01em]">{t.emptyTitle}</h2>
              <p className="text-base text-[#59544D] max-w-md mx-auto leading-relaxed">
                {t.emptyBody}
              </p>
            </div>
            <Button variant="primary" size="md" onClick={handleOpenModal} iconPosition="end" icon={<ArrowRight className="w-4 h-4" />}>
              {t.writeFirst}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => {
              const categoryLabel = domainText(post.domain, lang).label;
              const thread = replyPages[post.id];

              return (
                <Reveal
                  as="article"
                  key={post.id}
                  delay={Math.min(index, 5) * 70}
                  className="bg-white border-2 border-ink rounded-[8px] p-5 sm:p-6 space-y-3.5 shadow-hard-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-sm font-bold px-2 py-0.5 bg-paper border border-ink rounded-[4px] text-ink">
                      {post.authorPseudonym}
                    </span>
                    <span className="text-sm text-[#2B51E6] font-bold">
                      {categoryLabel}
                    </span>
                  </div>

                  <h2 className="font-bold text-lg sm:text-xl text-ink tracking-[-0.01em] leading-[1.25]">
                    {post.title}
                  </h2>
                  <p className="text-base text-[#3D3934] leading-[1.6] whitespace-pre-line">
                    {post.body}
                  </p>

                  <div className="pt-3 flex flex-wrap items-center gap-2 text-sm text-ink border-t border-[#D8D3C9]">
                    <button type="button" onClick={() => thread ? setReplyPages((value) => { const next = { ...value }; delete next[post.id]; return next; }) : loadReplies(post.id)} aria-expanded={Boolean(thread)} className="min-h-[44px] px-3 bg-white border-2 border-ink rounded-[4px] font-bold shadow-hard-sm inline-flex items-center gap-1.5 transition-[transform,box-shadow] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2">
                      <MessageCircle className="w-4 h-4" aria-hidden="true" /> {thread ? t.hideReplies : <>{t.seeRepliesBefore} <span className="tabular-nums">{post.replyCount ?? 0}</span> {t.seeRepliesAfter}</>}
                    </button>
                    <button type="button" onClick={(event) => openComposer(post.id, undefined, event.currentTarget)} className="min-h-[44px] px-3 bg-white border-2 border-ink rounded-[4px] font-bold shadow-hard-sm transition-[transform,box-shadow] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2">{t.reply}</button>
                    <span className="ml-auto text-sm text-[#59544D] font-medium tabular-nums">
                      {formatForumDate(post.createdAt, isClient, lang)}
                    </span>
                  </div>
                  {thread && (
                    <section aria-label={t.replies} className="space-y-3 pt-2">
                      {thread.loading && <p role="status" aria-live="polite" className="text-base font-semibold text-[#59544D]">{t.loadingReplies}</p>}
                      {!thread.loading && thread.replies.length === 0 && <p className="text-base text-[#59544D]">{t.noReplies}</p>}
                      {thread.replies.map((reply) => (
                        <article key={reply.id} className={`animate-reveal-up border-l-2 border-[#D8D3C9] bg-[#FAFAFA] rounded-r-[6px] py-3 pl-4 pr-3 space-y-1.5 ${reply.parentReplyId ? 'ml-4 sm:ml-8' : ''}`}>
                          {reply.parentReplyId && <p className="text-sm font-semibold text-[#59544D]">↳ {reply.parentContextUnavailable ? t.replyContextMissing : t.replyingTo(reply.replyingToAlias ?? '')}</p>}
                          <div className="flex flex-wrap justify-between gap-2"><strong className="text-base font-bold">{reply.authorAlias}</strong><time className="text-sm text-[#59544D] tabular-nums" dateTime={reply.createdAt}>{formatForumDateTime(reply.createdAt, isClient, lang)}</time></div>
                          <p className="text-base leading-relaxed text-[#3D3934] whitespace-pre-line">{reply.body}</p>
                          <div className="flex flex-wrap gap-2 text-sm"><button type="button" onClick={(event) => openComposer(post.id, reply, event.currentTarget)} className="min-h-[44px] px-3 font-bold underline underline-offset-4 decoration-2 rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt">{t.reply}</button><button type="button" aria-label={t.reportReplyAria(reply.authorAlias)} onClick={(event) => { setReportTarget({ storyId: post.id, reply, trigger: event.currentTarget }); setReportReason('other_safety'); setReportNotice(null); }} className="min-h-[44px] px-3 font-bold underline underline-offset-4 decoration-2 rounded inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt"><Flag className="w-4 h-4" aria-hidden="true" />{t.report}</button></div>
                        </article>
                      ))}
                    </section>
                  )}
                </Reveal>
              );
            })}
          </div>
        )}
        </section>
        </div>

        {composer && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-ink/50" role="dialog" aria-modal="true" aria-labelledby="reply-composer-title" onKeyDown={(event) => { if (event.key === 'Escape' && !replySubmitting) { composer.trigger?.focus(); setComposer(null); } }}>
            <div className="animate-reveal-up bg-white w-full max-w-lg border-2 border-ink rounded-lg shadow-hard-lg p-5 space-y-3">
              <div className="flex items-center justify-between gap-3"><h2 id="reply-composer-title" className="font-bold text-lg tracking-[-0.01em]">{composer.parent ? t.replyToUser(composer.parent.authorAlias) : t.replyToStory}</h2><button type="button" aria-label={t.closeReply} onClick={() => { composer.trigger?.focus(); setComposer(null); }} className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-[4px] border-2 border-ink bg-white hover:bg-paper focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"><X className="w-5 h-5" aria-hidden="true" /></button></div>
              <p className="text-base text-[#59544D] leading-relaxed">{t.replyNote}</p>
              <form onSubmit={submitReply} className="space-y-3">
                <label htmlFor="isi-balasan" className="block text-base font-bold text-ink">{t.yourReply}</label>
                <textarea id="isi-balasan" autoFocus value={replyBody} onChange={(event) => setReplyBody(event.target.value)} minLength={3} maxLength={800} required aria-describedby="reply-limit reply-status" className="w-full min-h-28 border-2 border-ink rounded-[4px] p-3 text-base leading-relaxed shadow-[2px_2px_0px_#151515] placeholder:text-[#6B665E] focus:outline-none focus:shadow-[3px_3px_0px_#3357EE] focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2" placeholder={t.replyPlaceholder} />
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span id="reply-limit" className="text-[#59544D] tabular-nums">{t.charCount(replyBody.length, 800)}</span><button type="submit" disabled={replySubmitting || replyBody.trim().length < 3 || replyBody.trim().length > 800} className="min-h-[48px] px-5 border-2 border-ink rounded-[4px] bg-lime text-base font-bold shadow-hard-sm transition-[transform,box-shadow] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:bg-[#D8D3C9] disabled:text-[#7A756D] disabled:border-[#7A756D] disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2">{replySubmitting ? t.sending : t.sendReply}</button></div>
                <p id="reply-status" role="status" aria-live="polite" className="text-base font-semibold">{replyNotice}</p>
              </form>
            </div>
          </div>
        )}

        {reportTarget && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-ink/50" role="dialog" aria-modal="true" aria-labelledby="report-title" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); reportTarget.trigger?.focus(); setReportTarget(null); } }}>
            <form onSubmit={async (event) => { event.preventDefault(); const res = await fetch(`/api/forum/${reportTarget.storyId}/replies/${reportTarget.reply.id}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: reportReason }) }); setReportNotice(res.ok ? t.reportReceived : t.reportFailed); if (res.ok) setTimeout(() => { reportTarget.trigger?.focus(); setReportTarget(null); }, 900); }} className="animate-reveal-up bg-white w-full max-w-md border-2 border-ink rounded-lg shadow-hard-lg p-5 space-y-3">
              <div className="flex justify-between items-center"><h2 id="report-title" className="font-bold text-lg tracking-[-0.01em]">{t.reportTitle}</h2><button type="button" aria-label={t.closeReport} onClick={() => { reportTarget.trigger?.focus(); setReportTarget(null); }} className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-[4px] border-2 border-ink bg-white hover:bg-paper focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"><X className="w-5 h-5" aria-hidden="true" /></button></div>
              <label className="block text-base font-bold" htmlFor="report-reason">{t.reportReason}</label><select id="report-reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="w-full min-h-[48px] border-2 border-ink rounded-[4px] bg-white px-3 text-base shadow-[2px_2px_0px_#151515] focus:outline-none focus:shadow-[3px_3px_0px_#3357EE] focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2">{REPORT_REASONS.map((reason) => <option key={reason} value={reason}>{t.reportReasons[reason]}</option>)}</select>
              <button type="submit" className="min-h-[48px] px-5 border-2 border-ink rounded-[4px] bg-yellow text-base font-bold shadow-hard-sm transition-[transform,box-shadow] duration-200 ease-spring hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-hard active:translate-x-[1px] active:translate-y-[1px] active:shadow-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2">{t.sendReport}</button><p role="status" aria-live="polite" className="text-base font-semibold">{reportNotice}</p>
            </form>
          </div>
        )}

        {/* Modal: Bagikan Cerita Anonim */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/50" role="dialog" aria-modal="true" aria-labelledby="share-story-title" onKeyDown={(event) => { if (event.key === 'Escape' && !submitting) { event.preventDefault(); setIsModalOpen(false); } }}>
            <div className="animate-reveal-up bg-white rounded-[8px] border-2 border-ink shadow-hard-lg w-full max-w-lg p-5 sm:p-7 space-y-5 text-left relative max-h-[92dvh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#D8D3C9]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[4px] bg-cobalt text-white border-2 border-ink flex items-center justify-center" aria-hidden="true">
                    <MessageCircleHeart className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 id="share-story-title" className="text-lg font-bold text-ink tracking-[-0.01em] leading-tight">{t.modalTitle}</h2>
                    <p className="text-base text-[#59544D]">{t.modalSubtitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label={t.closeForm}
                  className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-[4px] border-2 border-ink bg-white text-ink hover:bg-paper transition-colors duration-200 ease-spring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {submitNotice && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`p-3.5 rounded-md border-2 border-ink text-base flex items-start gap-2.5 shadow-hard-sm ${
                    submitNotice.type === 'success'
                      ? 'bg-lime text-ink'
                      : submitNotice.type === 'warning'
                      ? 'bg-yellow text-ink'
                      : 'bg-[#D32F2F] text-white'
                  }`}
                >
                  {submitNotice.type === 'success' ? (
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <span className="leading-relaxed">{submitNotice.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Pseudonym */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="nama-samaran" className="text-base font-bold text-ink">{t.pseudonymLabel}</label>
                    <button
                      type="button"
                      onClick={() => setAuthorPseudonym(generateRandomPseudonym(t))}
                      className="min-h-[44px] px-2 text-[#2B51E6] underline underline-offset-4 decoration-2 text-sm font-bold flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-cobalt"
                    >
                      <RefreshCw className="w-4 h-4" aria-hidden="true" /> {t.randomName}
                    </button>
                  </div>
                  <Input
                    id="nama-samaran"
                    value={authorPseudonym}
                    onChange={(e) => setAuthorPseudonym(e.target.value)}
                    placeholder={t.pseudonymPlaceholder}
                    required
                  />
                </div>

                {/* Category Domain */}
                <div className="space-y-1">
                  <label htmlFor="story-domain" className="block text-base font-bold text-ink">{t.topicLabel}</label>
                  <select
                    id="story-domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as InterventionDomain)}
                    className="w-full min-h-[52px] rounded-[4px] border-2 border-ink bg-white px-3.5 py-2.5 text-base text-ink shadow-hard-sm transition-shadow duration-200 ease-spring focus:outline-none focus:shadow-[3px_3px_0px_#3357EE] focus-visible:ring-[3px] focus-visible:ring-cobalt focus-visible:ring-offset-2"
                  >
                    {CATEGORY_DOMAINS.map((d) => <option key={d} value={d}>{domainText(d, lang).label}</option>)}
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <div className="flex justify-between gap-2 text-base font-bold text-ink">
                    <label htmlFor="judul-cerita">{t.titleLabel}</label>
                    <span className="text-[#59544D] text-sm font-medium tabular-nums">{title.length}/100</span>
                  </div>
                  <Input
                    id="judul-cerita"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                    placeholder={t.titlePlaceholder}
                    required
                  />
                </div>

                {/* Story Body */}
                <div className="space-y-1">
                  <div className="flex justify-between gap-2 text-base font-bold text-ink">
                    <label htmlFor="isi-cerita">{t.bodyLabel}</label>
                    <span className="text-[#59544D] text-sm font-medium tabular-nums">{body.length}/2500</span>
                  </div>
                  <Textarea
                    id="isi-cerita"
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, 2500))}
                    rows={5}
                    placeholder={t.bodyPlaceholder}
                    required
                  />
                </div>

                <div className="py-1 pl-3 border-l-4 border-cobalt text-base text-[#4A453E] leading-relaxed">
                  <strong className="font-bold text-ink">{t.rulesTitle}</strong> {t.rulesBody}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    icon={<Send className="w-4 h-4" aria-hidden="true" />}
                    disabled={submitting || title.trim().length < 5 || body.trim().length < 20}
                  >
                    {submitting ? t.checking : t.sendStory}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

