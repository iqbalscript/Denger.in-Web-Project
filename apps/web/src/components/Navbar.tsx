'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { HelpButton } from './ui/HelpButton';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Compass },
    { href: '/mission', label: 'Misi Harian', icon: CheckCircle2 },
    { href: '/checkin', label: 'Check-in', icon: Shield },
    { href: '/journal', label: 'Jurnal', icon: BookOpen },
    { href: '/chat', label: 'Teman Bicara', icon: MessageSquare },
    { href: '/resources', label: 'Bantuan', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-40 bg-sand-50/80 backdrop-blur-md border-b border-sand-200/80 shadow-soft-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus-visible:outline-calm-700 rounded-lg"
              aria-label="Kembali ke Beranda Dengar.in"
            >
              <div className="w-9 h-9 rounded-2xl bg-calm-700 flex items-center justify-center text-white shadow-soft-xs transition-transform duration-200 group-hover:scale-105">
                <span className="font-bold text-base tracking-tight">D</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-sand-900 tracking-tight leading-tight">
                  Dengar.in
                </span>
                <span className="text-[10px] text-calm-700 font-medium tracking-wide uppercase">
                  Ruang Tenang & Aman
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5" aria-label="Navigasi Utama">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-calm-100/90 text-calm-900 font-semibold shadow-soft-xs border border-calm-200/60'
                      : 'text-sand-700 hover:text-calm-900 hover:bg-sand-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-calm-700' : 'text-sand-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Crisis Quick Access + Mobile Toggle */}
          <div className="flex items-center gap-2">
            <HelpButton variant="compact" />

            <button
              type="button"
              className="md:hidden p-2 rounded-xl text-sand-700 hover:text-sand-900 hover:bg-sand-100 transition-colors focus-visible:outline-calm-700"
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
        <div className="md:hidden bg-sand-50/95 backdrop-blur-md border-b border-sand-200 px-4 pt-2 pb-4 space-y-1 shadow-soft-md">
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
                    ? 'bg-calm-100 text-calm-900 font-semibold'
                    : 'text-sand-800 hover:bg-sand-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-calm-700' : 'text-sand-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
