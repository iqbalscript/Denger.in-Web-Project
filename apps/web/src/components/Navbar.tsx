'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  CheckCircle2,
  Shield,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Menu,
  X,
  User,
} from 'lucide-react';
import { HelpButton, QuickExitButton } from './ui';
import { getAnonymousSession } from '@/lib/storage';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alias, setAlias] = useState<string | null>(null);

  useEffect(() => {
    const session = getAnonymousSession();
    if (session?.anonymousAlias) {
      setAlias(session.anonymousAlias);
    }
  }, [pathname]);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Compass },
    { href: '/mission', label: 'Misi Harian', icon: CheckCircle2 },
    { href: '/checkin', label: 'Check-in', icon: Shield },
    { href: '/journal', label: 'Jurnal', icon: BookOpen },
    { href: '/chat', label: 'Teman Bicara', icon: MessageSquare },
    { href: '/resources', label: 'Bantuan', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-40 bg-sand-50/90 backdrop-blur-md border-b border-sand-200/80 shadow-soft-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus-visible:outline-terracotta-500 rounded-lg"
              aria-label="Kembali ke Beranda Dengar.in"
            >
              <div className="w-9 h-9 rounded-2xl bg-terracotta-500 flex items-center justify-center text-white shadow-soft-xs transition-transform duration-200 group-hover:scale-105">
                <span className="font-extrabold text-base tracking-tight">D</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base text-sand-900 tracking-tight leading-tight">
                  Dengar.in
                </span>
                <span className="text-[10px] text-terracotta-600 font-semibold tracking-wide uppercase">
                  Ruang Aman & Tenang
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Navigasi Utama">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-terracotta-100/90 text-terracotta-800 font-bold shadow-soft-xs border border-terracotta-200/70'
                      : 'text-sand-700 hover:text-sand-900 hover:bg-sand-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-terracotta-600' : 'text-sand-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Utilities: Alias pill + Quick Exit + Crisis Help Button + Mobile Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Anonymous Alias Badge (Zero PII) */}
            {alias && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sand-100/90 border border-sand-200 text-xs font-semibold text-sand-800">
                <User className="w-3.5 h-3.5 text-terracotta-500" />
                <span className="truncate max-w-[130px]">{alias}</span>
              </div>
            )}

            {/* Persistent Quick Exit (ESC) */}
            <QuickExitButton variant="navbar" />

            {/* Crisis Help Button */}
            <HelpButton variant="compact" />

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl text-sand-700 hover:text-sand-900 hover:bg-sand-100 transition-colors focus-visible:outline-terracotta-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-sand-50/98 backdrop-blur-md border-b border-sand-200 px-4 pt-2 pb-4 space-y-2 shadow-soft-md">
          {alias && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sand-100 text-xs font-semibold text-sand-800 border border-sand-200/80">
              <User className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
              <span>Identitas Anonim: {alias}</span>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-terracotta-100 text-terracotta-800 font-bold'
                      : 'text-sand-800 hover:bg-sand-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-terracotta-600' : 'text-sand-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
