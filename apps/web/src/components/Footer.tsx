'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Key } from 'lucide-react';
import { LanguageSwitch, commonText, useText } from '@/i18n';

const footerLink =
  'inline-flex items-center gap-1.5 min-h-[44px] text-base font-semibold text-[#151515] underline underline-offset-4 decoration-2 decoration-[#D8D3C9] hover:decoration-[#151515] transition-colors duration-200 ease-spring rounded-[4px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2';

// Kontak darurat: nama di atas, nomor di bawah (tidak pernah terpotong di tengah).
const contactLink =
  'flex flex-col py-1.5 min-h-[44px] rounded-[4px] group focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE] focus-visible:ring-offset-2';
const contactName = 'text-sm font-semibold text-[#59544D]';
const contactNumber =
  'text-base font-bold tabular-nums whitespace-nowrap underline underline-offset-4 decoration-2 decoration-[#D8D3C9] group-hover:decoration-current';

export function Footer() {
  const common = useText(commonText);
  const t = common.footer;
  const nav = common.nav;
  const contacts = common.contacts;

  // Nama tautan footer sama persis dengan nama di navigasi (satu hal, satu nama).
  const links = [
    { href: '/chat', label: nav.chatWriteFull },
    { href: '/ruang-ngobrol', label: nav.chatVoiceFull },
    { href: '/dashboard', label: nav.home },
    { href: '/mission', label: nav.mission },
    { href: '/checkin', label: nav.checkin },
    { href: '/journal', label: nav.journal },
    { href: '/resources', label: nav.resources },
    { href: '/report', label: nav.report },
    { href: '/forum', label: nav.forum },
    // Di navigasi atas tautan ini baru tampil mulai 1536px; di sini
    // selalu ada supaya tetap terjangkau di laptop.
    { href: '/care-passport', label: nav.carePassport },
  ];

  return (
    <footer className="bg-[#FFF8EF] border-t-2 border-[#151515] mt-20 text-[#151515] text-base">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-20 md:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-12 md:mb-16">
          {/* Col 1: Identity */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[4px] bg-[#3357EE] border-2 border-[#151515] flex items-center justify-center text-white text-base font-bold shadow-[2px_2px_0px_#151515]" aria-hidden="true">
                D
              </div>
              <span className="font-bold text-xl text-[#151515] tracking-[-0.02em]">{common.brand}</span>
            </div>
            <p className="text-[#59544D] text-base leading-relaxed max-w-[44ch]">{t.tagline}</p>
            <div className="flex items-center gap-2 text-base text-[#151515] font-semibold pt-1">
              <ShieldCheck className="w-5 h-5 text-[#3357EE] shrink-0" aria-hidden="true" />
              <span>{t.noSignup}</span>
            </div>
            <LanguageSwitch idPrefix="bahasa-footer" className="max-w-[22rem] pt-2" />
          </div>

          {/* Col 2: Fitur & Navigasi */}
          <nav className="md:col-span-3 md:col-start-7 space-y-3" aria-labelledby="footer-akses">
            <h2 id="footer-akses" className="text-lg font-bold text-[#151515]">{t.links}</h2>
            <ul className="space-y-0.5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Col 3: Keamanan & Kontak Darurat */}
          <div className="md:col-span-3 space-y-3">
            <h2 className="text-lg font-bold text-[#151515]">{t.emergency}</h2>
            <ul className="space-y-0.5">
              <li>
                <a href="tel:119,8" className={contactLink}>
                  <span className={contactName}>{contacts['healing119-kemenkes'].short}</span>
                  <span className={`${contactNumber} text-[#B3261E]`}>119 ext 8</span>
                </a>
              </li>
              <li>
                <a href="https://wa.me/628113855472" target="_blank" rel="noopener noreferrer" className={contactLink}>
                  <span className={contactName}>{contacts['lisa-helpline'].short}</span>
                  <span className={`${contactNumber} text-[#151515]`}>0811-3855-472</span>
                </a>
              </li>
              <li>
                <a href="tel:1500771" className={contactLink}>
                  <span className={contactName}>{contacts['tepsa-kemensos'].short}</span>
                  <span className={`${contactNumber} text-[#151515]`}>1500-771</span>
                </a>
              </li>
              <li>
                <a href="tel:157" className={contactLink}>
                  <span className={contactName}>{contacts['satgas-pasti-ojk'].short}</span>
                  <span className={`${contactNumber} text-[#151515]`}>157</span>
                </a>
              </li>
              <li className="pt-2">
                <Link href="/recovery" className={`${footerLink} text-[#2B51E6] decoration-[#2B51E6]`}>
                  <Key className="w-4 h-4 text-[#A3480B]" aria-hidden="true" />
                  <span>{t.recoveryKey}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Medical Disclaimer Boundary */}
        <div className="border-t border-[#D8D3C9] pt-8 md:pt-10 text-sm text-[#59544D] space-y-5">
          <div className="bg-white p-4 sm:p-6 rounded-[6px] hairline">
            <p className="leading-relaxed max-w-[90ch] text-base">
              <strong className="text-[#151515] font-bold">{t.legalTitle}</strong> {t.legalA}{' '}
              <strong className="text-[#151515] font-bold">{t.legalB}</strong>
              {t.legalC}{' '}
              <a href="tel:119,8" className="text-[#B3261E] font-bold tabular-nums underline underline-offset-4 decoration-2 rounded-[2px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3357EE]">{t.legalLink}</a>{' '}
              {t.legalD}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-sm text-[#59544D]">
            <span>{t.copyright}</span>
            <span className="inline-flex items-center gap-1">{t.credit}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
