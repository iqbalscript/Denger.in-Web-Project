# Dengar.in — Design Product Requirements Document (Design PRD)

> **Document Status:** Active / Canonical Design Specification  
> **Target Audience:** Stitch, UI/UX Designers, Frontend Engineers, Visual Reviewers, Design QA  
> **Scope:** Pure Visual Language, Interaction Principles, Design System, Layouts, Components, Responsive Behavior, States, and Screen Specifications.  
> *Note: This is a standalone design specification. For product strategy, backend architecture, or AI models, refer to [PRD.md](file:///c:/Users/Iqbal%20Dovandra/Project%20Code/Kompe/Denger.in/docs/PRD.md) and [API_SPEC.md](file:///c:/Users/Iqbal%20Dovandra/Project%20Code/Kompe/Denger.in/docs/API_SPEC.md).*

---

## 1. Design PRD Scope

This document defines the complete visual and interactive design system for **Dengar.in**. It governs all frontend visual implementations, component libraries, screen layouts, and design QA criteria.

### Included in this Document:
- Visual identity & art direction
- Design principles & product north star
- Typography & typographic rules
- Color system & screen-level color assignments
- Spacing, grid, border, shadow, and corner radius tokens
- Component specifications & tactile interaction design
- Navigation architecture (strictly anonymous, zero-profile)
- Screen-by-screen layout specifications
- Responsive breakpoints and recomposition rules
- Accessibility (a11y) standards & contrast compliance
- Motion, animation durations, and transitions
- Component UI states (Default, Hover, Active, Focus, Disabled, Loading, Success, Error, Empty)
- Dedicated Crisis-Mode design system
- Design QA checklist

### Explicitly Excluded from this Document:
- Product business model and market strategy
- Backend database schema and SQL migrations
- Server-side routing, API protocols, and repository code
- LLM provider fallback logic and API orchestration
- Technical infrastructure and deployment pipelines

---

## 2. Product Design North Star

Dengar.in is an anonymous mental well-being companion. When a user arrives, they may be stressed, emotionally overwhelmed, anxious, or exhausted.

### The Primary Design Goal:
> **MAKE THE INTERFACE DISAPPEAR.**

A stressed user must instantly understand:
1. **Where they are**
2. **What is happening**
3. **What to do next**

without needing to learn or navigate a complex UI paradigm.

### Core Design Statement:
> **“BOLD ENOUGH TO BE MEMORABLE.  
> SIMPLE ENOUGH TO BE CALM.”**

---

## 3. Core Design Direction: Simplified Brutalism

The aesthetic style of Dengar.in is **Colorful Minimalist Brutalism** (Simplified Brutalism).

### What Simplified Brutalism IS:
- **Flat, grounded colors:** Warm paper backgrounds, rich inks, and expressive single accents.
- **Bold, unpretentious typography:** High readability, human warmth, and editorial confidence.
- **Strong, decisive contrast:** Dark strokes separating functional areas clearly.
- **Solid structural borders:** 2px crisp borders defining interactive surfaces.
- **Subtle hard-offset shadows:** Direct, physical, tactile feel with zero blur.
- **Compact corner radiuses:** Tight (4–8px) geometry that feels structural and intentional.
- **Rectangular, physical buttons:** Buttons that look like tangible pressable keys.
- **Generous whitespace:** Massive breathing room allowing stressed minds to rest.
- **Deliberate visual tension:** Clean alignment contrasted with bold focal points.

### What Simplified Brutalism IS NOT (Anti-Patterns):
- ❌ **NO Extreme Web Brutalism:** No chaotic layouts, no deliberately jarring clashing fonts, no unreadable neon walls.
- ❌ **NO Glassmorphism:** No frosted glass, no backdrop blurs, no translucent layers.
- ❌ **NO Gradient Backgrounds:** No multi-color pastel or iridescent gradient blobs.
- ❌ **NO Floating Soft Drop Shadows:** No diffuse, blurry, or gigantic ambient shadows.
- ❌ **NO Pill-Shaped Primary UI:** Never use `border-radius: 9999px` for main buttons or cards.
- ❌ **NO Excessive Borders:** Do not outline every paragraph, icon, or label.
- ❌ **NO Dense Information Dashboards:** No micro-charts, complex metric tiles, or analytics overloads.

---

## 4. Visual References & Inspiration

Dengar.in blends four distinct influences into a singular identity:

```
┌─────────────────────────────────────────────────────────────┐
│                     DENGAR.IN IDENTITY                      │
├──────────────────────────────┬──────────────────────────────┤
│ A. Neo-Brutalism             │ B. Contemporary Editorial    │
│ • Solid 2px borders          │ • Space Grotesk typography   │
│ • Hard offset shadows (3px)  │ • Confident editorial titles │
│ • Flat color fields          │ • Thoughtful text pacing     │
├──────────────────────────────┼──────────────────────────────┤
│ C. Modern Consumer Apps      │ D. Japanese / Swiss Design   │
│ • Single primary action      │ • Disciplined 8px spacing    │
│ • Low cognitive load         │ • Uncluttered composition    │
│ • Obvious visual affordances │ • Restrained, calm balance   │
└──────────────────────────────┴──────────────────────────────┘
```

*Note: These references serve as inspiration, not templates. The resulting interface must feel uniquely Dengar.in.*

---

## 5. Color System

The palette is rooted in a warm, physical paper base, anchored by deep charcoal ink, and activated by vivid, flat accents.

### 5.1 Palette Specification

| Token Name | Hex Code | Role | Description |
|---|---|---|---|
| `bg-paper` | `#FFF8EF` | Base Background | Warm, soothing cream/paper base. Reduces eye strain. |
| `surface-white` | `#FFFFFF` | Surface / Card | Crisp white for raised content cards and input fields. |
| `ink-main` | `#151515` | Ink / Text / Stroke | Deep neutral charcoal. Used for text, 2px borders, and hard shadows. |
| `accent-primary` | `#4169FF` | Primary Accent | Electric Cobalt. Used for missions, calm focus, and primary highlights. |
| `accent-positive` | `#B8F34A` | Positive / Action CTA | Lime Green. High-energy affirmation, primary start buttons. |
| `accent-attention`| `#FFD84D` | Attention / Warning | Sunny Yellow. Used for neutral check-in and reflective highlights. |
| `accent-warm` | `#FF8A3D` | Warm Accent | Vibrant Tangerine. Used for journaling, emotional warmth, and creative outlet. |
| `accent-crisis` | `#FF5252` | Crisis / Emergency | Urgent Coral Red. Reserved exclusively for safety, crisis alerts, and emergency hotlines. |
| `border-subtle` | `#D8D3C9` | Secondary Border | Muted warm grey. Used for subtle dividers and inactive states. |

### 5.2 Color Usage Rules

1. **Flat Colors Only:** Strictly forbidden to apply linear or radial gradients to backgrounds or cards.
2. **One Dominant Accent Per Screen:** Do not use all accent colors simultaneously. Each screen has a clear color identity:
   - **Landing:** Cream (`#FFF8EF`) + Cobalt (`#4169FF`) + Lime CTA (`#B8F34A`)
   - **Dashboard (Today):** Cream (`#FFF8EF`) + Cobalt (`#4169FF`) + Lime (`#B8F34A`)
   - **Check-in:** Cream (`#FFF8EF`) + Sunny Yellow (`#FFD84D`)
   - **Mission:** Cream (`#FFF8EF`) + Cobalt Blue (`#4169FF`)
   - **Journal:** Cream (`#FFF8EF`) + Warm Tangerine (`#FF8A3D`)
   - **Ruang Cerita (Forum):** Cream (`#FFF8EF`) + Cobalt (`#4169FF`)
   - **Crisis Mode:** Cream (`#FFF8EF`) + Urgent Coral (`#FF5252`)
3. **No Translucency:** Opacity changes are reserved exclusively for disabled states or subtle hover transitions. Never use semi-transparent backgrounds over text.

---

## 6. Typography

### 6.1 Font Family

- **Primary Font:** `Space Grotesk` (Google Fonts)
- **Fallback Stack:** `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Characteristics:** Geometric, slightly quirky, highly legible, authoritative yet friendly.

### 6.2 Typographic Hierarchy

| Level | Size (Desktop) | Size (Mobile) | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|---|
| **Display** | 56px – 64px | 36px – 40px | 700 (Bold) | 1.05 – 1.10 | -0.03em | Hero headlines, major emotional statements |
| **Heading 1** | 36px – 40px | 28px – 32px | 700 (Bold) | 1.15 – 1.20 | -0.02em | Screen titles, mission titles |
| **Heading 2** | 24px – 28px | 20px – 22px | 700 (Bold) | 1.25 | -0.01em | Section headers, card titles |
| **Subheading** | 18px – 20px | 16px – 17px | 500 (Medium) | 1.40 | 0 | Supporting lead paragraphs |
| **Body** | 16px | 15px – 16px | 400 (Regular) | 1.50 – 1.60 | 0 | General reading text, reflections, forum posts |
| **Label** | 13px – 14px | 12px – 13px | 700 (Bold) | 1.20 | +0.05em (Caps) | Category badges, step indicators, metadata tags |
| **Metadata** | 12px – 13px | 11px – 12px | 400 (Regular) | 1.40 | 0 | Timestamps, privacy disclaimers |

---

## 7. Typographic Rules & Composition

1. **Hierarchy Before Decoration:** Establish clear priority through font size, weight, and whitespace before adding badges, borders, or colors.
2. **Selective Oversized Headlines:** Use oversized Display text only for the single primary message of a screen.
   - *Example:*
     ```
     [ DISPLAY ]
     GAK HARUS
     BERES SEMUANYA
     HARI INI.

     [ BODY ]
     Mulai dari satu hal kecil.

     [ CTA BUTTON ]
     [ MULAI TANPA AKUN → ]
     ```
3. **The "Single Thought" Principle:** Avoid stacking multiple headlines or cluttering a screen with competing messages. Every view must have one dominant typographic anchor.
4. **Uppercase for Micro-Copy:** Use uppercase exclusively for short labels (`MISI HARI INI`, `5 MENIT`, `PRIVAT`). Never set long body text in all-caps.

---

## 8. Spacing System

Based on an **8px grid**, with 4px half-steps for micro-alignments.

```
4px   (0.5x) : Micro-gaps, icon-to-text spacing
8px   (1.0x) : Tight padding, badge padding, internal chip gaps
12px  (1.5x) : Input internal vertical padding, compact card gaps
16px  (2.0x) : Standard card padding, standard gap between form fields
24px  (3.0x) : Medium section spacing, stack separation
32px  (4.0x) : Large card padding, separation between major card groups
48px  (6.0x) : Major section gap on mobile
64px  (8.0x) : Major section gap on desktop, hero vertical whitespace
96px  (12.0x): Page top/bottom breathing margin on desktop
```

### Spacing Principles:
- **Mental health screens must breathe:** Never cram content into the viewport. If a user needs to scroll, let them scroll through generous, uncluttered space.
- **Negative Space as Calming Agent:** Generous whitespace around input areas and mission steps lowers perceived pressure.

---

## 9. Border System

Borders provide structural clarity and tactile definition.

| Token | Specification | Application |
|---|---|---|
| **Border Primary** | `2px solid #151515` | Interactive buttons, active cards, inputs, dialog modals, selected chips |
| **Border Secondary** | `1px solid #D8D3C9` | Inactive cards, subtle list dividers, unselected options |
| **Border Focus** | `2px solid #151515` + `2px outline #4169FF` | Keyboard navigation and accessibility focus ring |

### Border Rules:
- Hard borders must be used **selectively**. Do not draw a border around plain text or purely informative containers.
- The 2px dark border is the signature mark of interactive elements in Dengar.in.

---

## 10. Shadow System (Hard Offset)

Dengar.in strictly uses **hard-offset shadows**. No blur, no diffusion, no soft drop shadows.

```
┌────────────────────────────┐
│      CARD / BUTTON         │
│                            │
└────────────────────────────┘ 
  █ 3px / 4px Solid #151515
```

| Token | CSS Value | Application |
|---|---|---|
| `shadow-sm` | `2px 2px 0px #151515` | Small chips, category tags, interactive badges |
| `shadow-default` | `3px 3px 0px #151515` | Standard buttons, primary cards, mood selector blocks |
| `shadow-lg` | `4px 4px 0px #151515` | Hero cards, active mission cards, modal dialogs |
| `shadow-none` | `0px 0px 0px transparent` | Pressed/active button states, flat containers |

---

## 11. Corner Radius

Corners are tight, compact, and structural.

| Element | Radius | Rationale |
|---|---|---|
| **Buttons** | `4px – 6px` | Tactile, rectangular, pressable look |
| **Inputs & Textareas** | `4px – 6px` | Crisp paper-like feel |
| **Cards & Containers** | `6px – 8px` | Structural containment without looking bubbly |
| **Dialog Modals** | `8px` | Grounded, solid architectural feel |
| **Chips / Badges** | `4px` | Sharp, legible categorization |

> ⚠️ **CRITICAL RULE:** NEVER use pill-shaped primary UI (`border-radius: 9999px` or `rounded-full`). All primary buttons, cards, and inputs must remain decisively rectangular.

---

## 12. Button Design

Buttons must feel physical, mechanical, and tactile—like tangible keys on an analog device.

### 12.1 Button Variants

1. **Primary Action Button (CTA):**
   - Background: `#B8F34A` (Positive Lime) or `#4169FF` (Cobalt)
   - Text: `#151515` (Bold, 15px, Space Grotesk)
   - Border: `2px solid #151515`
   - Shadow: `3px 3px 0px #151515`
   - Radius: `4px`
   - Padding: `14px 28px`
2. **Secondary Button:**
   - Background: `#FFFFFF` (Surface White)
   - Text: `#151515` (Bold, 15px)
   - Border: `2px solid #151515`
   - Shadow: `3px 3px 0px #151515`
   - Radius: `4px`
   - Padding: `12px 24px`
3. **Emergency / Crisis Button:**
   - Background: `#FF5252` (Coral Red)
   - Text: `#FFFFFF` (White, Bold, 14px)
   - Border: `2px solid #151515`
   - Shadow: `3px 3px 0px #151515`
   - Radius: `4px`
   - Padding: `10px 18px`

### 12.2 Button Interactive States

```
[ DEFAULT ]  ──────────────────> [ HOVER ] ──────────────────> [ ACTIVE / PRESSED ]
Border: 2px #151515              Transform: translate(-1px, -1px)  Transform: translate(2px, 2px)
Shadow: 3px 3px 0px #151515      Shadow: 4px 4px 0px #151515       Shadow: 1px 1px 0px #151515
```

- **Hover:** Button translates `-1px, -1px` with shadow expanding to `4px 4px 0px #151515`.
- **Active / Pressed:** Button translates `+2px, +2px` with shadow collapsing to `1px 1px 0px #151515`.
- **Focus:** 2px dark border + 2px offset ring in `#4169FF`.
- **Disabled:** Background `#D8D3C9`, text `#7A756D`, border `2px solid #7A756D`, shadow `none`, cursor `not-allowed`.

---

## 13. Input & Form Design

Inputs must feel calm, spacious, and inviting—never intimidating.

### Specifications:
- **Background:** `#FFFFFF`
- **Text:** `#151515` (16px to prevent mobile iOS zoom)
- **Border:** `2px solid #151515`
- **Radius:** `4px – 6px`
- **Padding:** `14px 16px`
- **Shadow:** `2px 2px 0px #151515`
- **Focus State:** Border remains `2px solid #151515`, shadow becomes `3px 3px 0px #4169FF`, background remains `#FFFFFF`.
- **Placeholder:** `#8A857D` (Readable, clear, friendly).
- **Textarea for Journal:** Generous minimum height (`240px`), line-height `1.6`, clean top-left alignment.
- **Rules:** No floating labels, no animated underline tricks, no glass effects. Keep labels static, bold, and placed 6px above the field.

---

## 14. Navigation Design (Strictly Anonymous)

> 🛑 **THE ZERO-PROFILE MANDATE:**  
> Dengar.in has **NO USER ACCOUNTS, NO AVATARS, NO PROFILE DROPDOWNS, AND NO SOCIAL HANDLES.** The navigation must reflect pure utility and emotional companionship.

### 14.1 Desktop Navigation Bar (Top)
- **Container:** Sticky header, height `64px`, background `#FFF8EF`, border-bottom `2px solid #151515`.
- **Left:** Brand wordmark `Dengar.in` (Bold, 20px, Space Grotesk, `#151515`).
- **Center / Links:**
  - `Home` (`/`)
  - `Misi` (`/mission`)
  - `Check-in` (`/checkin`)
  - `Jurnal` (`/journal`)
  - `Ruang Cerita` (`/forum`)
  - `Bantuan` (`/resources`)
- **Right:** Persistent emergency action button:  
  `[ 🚨 BANTUAN DARURAT ]` (Red accent, 13px bold, triggers `/crisis`).

### 14.2 Mobile Navigation (Bottom Bar + Lightweight Drawer)
- **Bottom Navigation Bar:** Fixed bottom, height `60px`, background `#FFFFFF`, border-top `2px solid #151515`.
- **4 Main Icons + 1 More Button:**
  1. `Home` (`/`)
  2. `Misi` (`/mission`)
  3. `Check-in` (`/checkin`)
  4. `Jurnal` (`/journal`)
  5. `Menu` (Opens lightweight slide-up sheet)
- **"More" Sheet Content:**
  - `Ruang Cerita` (`/forum`)
  - `Direktori Bantuan` (`/resources`)
  - `Refleksi Mingguan` (`/report`)
  - `Pemulihan Sesi (12-Kata)` (`/recovery`)
  - `Hapus Data Lokal` (Destructive action)
  - `[ HUBUNGI BANTUAN DARURAT ]` (Always pinned at top of mobile sheet)

---

## 15. Screen Layout: Landing Page (`/`)

### Purpose:
Instant reassurance, immediate value, zero sign-up friction.

### Layout Structure (Desktop):
- **Hero Section (Two Columns):**
  - **Left Column (60%):**
    - Micro-badge: `[ 🔒 100% ANONIM • TANPA DAFTAR ]`
    - Headline (Display, 56px):  
      **GAK HARUS  
      BERES SEMUANYA  
      HARI INI.**
    - Subtitle (20px, `#4A453E`):  
      *Tempat aman buat rehat, cerita tanpa takut dihakimi, dan kembali melangkah pelan-pelan.*
    - Action Group:
      - Primary CTA: `[ MULAI SEKARANG → ]` (Lime `#B8F34A`, 16px bold)
      - Secondary CTA: `[ LIHAT CARA KERJA ]` (White surface, 15px)
  - **Right Column (40%):**
    - A single, bold, abstract geometric neo-brutalist illustration:
      - Cream and cobalt intersecting geometric shapes.
      - Hard 2px borders, 4px offset shadow.
      - Zero generic stock photos or cliché sad-face illustrations.
- **Value Props Row (Three Distinct Cards):**
  1. **Tanpa Akun:** "Semua data tersimpan di perangkatmu sendiri."
  2. **AI Pendengar:** "Bukan diagnosis medis. Teman refleksi yang objektif dan tenang."
  3. **Ruang Cerita:** "Dengar dan berbagi rasa bersama sahabat senasib tanpa identitas."

---

## 16. Screen Layout: Dashboard / "Today" (`/dashboard` or `/`)

### Purpose:
A calm, focused "Today" view. It is **NOT** an analytics dashboard or gamified tracker.

```
┌─────────────────────────────────────────────────────────────┐
│ "Gimana keadaanmu hari ini?"                                │
├─────────────────────────────────────────────────────────────┤
│ [ SANGAT BAIK ] [ BAIK ] [ NETRAL ] [ BERAT ] [ KEWALAHAN ] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MISI HARI INI • 5 MENIT                        [ COBALT ]  │
│  "BERHENTI SEBENTAR."                                       │
│  Tarik napas 4 detik, lepas 4 detik. Cukup satu putaran.    │
│                                                             │
│  [ KERJAKAN MISI INI → ]                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [ ✍️ Tulis Jurnal ]   [ 💬 Ruang Cerita ]   [ 📊 Refleksi ]  │
└─────────────────────────────────────────────────────────────┘
```

### Visual Elements:
1. **Greeting & Mood Selector:**
   - Top Title: "Gimana keadaanmu hari ini?" (Heading 1, 32px)
   - 5 Horizontal Mood Blocks (Mobile: 5 horizontal buttons or 2-row grid).
2. **Dominant Mission Card (Hero of the Dashboard):**
   - Background: `#FFFFFF` with `#4169FF` top color stripe or solid cobalt header.
   - Border: `2px solid #151515`, Shadow: `4px 4px 0px #151515`.
   - Title: "BERHENTI SEBENTAR." (24px bold)
   - Description: Short, actionable 2-line instruction.
   - Action: `[ KERJAKAN MISI INI → ]`
3. **Quick Utility Row (Secondary):**
   - 3 clean, simple rectangular cards: `Tulis Jurnal`, `Ruang Cerita`, `Refleksi`.
   - No badges, no streak numbers, no level indicators.

---

## 17. Screen Layout: Check-in (`/checkin`)

### Purpose:
Quick, low-friction emotional temperature taking.

### Layout Structure:
1. **Step 1: Mood Selection (5 Large Stacked Blocks):**
   - Each block has a distinct accent and clear typography:
     - `SANGAT BAIK` (Accent: `#B8F34A`)
     - `BAIK` (Accent: `#8BE9FD` / Light Sky)
     - `NETRAL` (Accent: `#FFD84D`)
     - `BERAT` (Accent: `#FF8A3D`)
     - `KEWALAHAN` (Accent: `#FF5252`)
   - Unselected: White background, 2px border, 2px shadow.
   - Selected: Solid accent background, 3px shadow, clear checkmark indicator.
2. **Step 2: Tingkat Energi (1 — 10 Slider / Segmented Bar):**
   - Segmented buttons from `1` (Habis Total) to `10` (Penuh Semangat).
   - High-contrast selected state.
3. **Step 3: Sumber Beban (Tag Selector Chips):**
   - Chips: `Pekerjaan`, `Keluarga`, `Finansial`, `Hubungan`, `Kesehatan`, `Kesepian`, `Lainnya`.
   - Multi-select, rectangular chips (border 2px, radius 4px).
4. **Primary Action:**
   - Sticky or bottom button: `[ SIMPAN CHECK-IN ]` (Positive Lime, full width on mobile).

---

## 18. Screen Layout: Mission (`/mission`)

### Purpose:
A guided, pressure-free worksheet.

### Structure & Content:
- **Header:**
  - Label: `MISI HARI INI • 5 MENIT`
  - Title: **“BERHENTI SEBENTAR.”**
  - Subtitle: *Tidak ada skor atau target yang harus dicapai.*
- **Step-by-Step Worksheet Cards (01 to 04):**
  - Each step is a clean white card with a bold numeric tag:
    - `01. LETAKKAN GADGET` — "Taruh ponsel di meja, pandang satu titik selama 30 detik."
    - `02. TARIK NAPAS` — "Tarik napas perlahan lewat hidung (4 detik), tahan (4 detik), hembuskan (4 detik)."
    - `03. IDENTIFIKASI SUASANA` — "Sebutkan 3 suara yang terdengar di sekitarmu sekarang."
    - `04. UCAPKAN TERIMA KASIH` — "Beri apresiasi kecil ke dirimu karena sudah bertahan hari ini."
- **Completion Flow:**
  - Button: `[ TANDAI SELESAI ]`
  - Post-completion state:
    - Banner: *"Terima kasih sudah meluangkan 5 menit untuk dirimu."*
    - Follow-up question: *"Gimana rasanya sekarang?"* (3 simple mood options).

---

## 19. Screen Layout: Journal (`/journal`)

### Purpose:
Distraction-free, therapeutic free-writing space.

### Visual Architecture:
- **Header:**
  - Headline: **“TULIS AJA.”**
  - Sub-line: *“Gak perlu dirapiin, gak ada yang menilai.”*
- **Writing Surface:**
  - Generous full-width textarea.
  - White surface, `2px solid #151515`, shadow `3px 3px 0px #151515`.
  - Placeholder: *“Apa yang lagi muter-muter di kepala kamu sekarang? Tumpahin semuanya di sini...”*
- **Footer Toolbar:**
  - Left indicator: `🔒 Privat di perangkat ini (Terenkripsi)`
  - Right action: `[ SIMPAN JURNAL ]` (Tangerine `#FF8A3D` or Lime `#B8F34A`).
- **Rules:**
  - Zero word-count pressure (word count is hidden or subtle).
  - No formatting bars (no bold/italic/underline toolbar cluttering the view).

---

## 20. Screen Layout: AI Companion / Conversation (`/chat`)

### Purpose:
Editorial conversation for reflective empathy, debiasing, and calm guidance.

> 🛑 **ANTI-CHATGPT MANDATE:**  
> Do NOT use rounded messaging bubbles, robot avatars, "Ask me anything" prompts, or technical model tags.

```
┌─────────────────────────────────────────────────────────────┐
│ [ DENGAR ]                                                  │
│ Kayaknya hari ini semuanya datang barengan. Wajar kalau     │
│ kamu ngerasa kewalahan.                                     │
├─────────────────────────────────────────────────────────────┤
│ [ KAMU ]                                                    │
│ Iya, gue bingung harus mulai dari mana.                      │
├─────────────────────────────────────────────────────────────┤
│ [ DENGAR ]                                                  │
│ Gak perlu mulai dari semuanya sekaligus.                    │
│ Mau kita pilih satu hal paling kecil dulu?                  │
├─────────────────────────────────────────────────────────────┤
│ Tindakan yang bisa dicoba:                                  │
│ [ ⚡ COBA SATU LANGKAH KECIL ]   [ ✍️ TULIS DI JURNAL ]      │
└─────────────────────────────────────────────────────────────┘
```

### Visual Specifications:
- **Conversation Blocks:** Flat editorial containers with distinct square nameplates:
  - `[ DENGAR ]`: Tagged with Cobalt `#4169FF`, card background `#FFFFFF`, border `2px solid #151515`.
  - `[ KAMU ]`: Tagged with Neutral Ink `#151515`, card background `#FFF8EF`, border `2px solid #151515`.
- **Integrated Action Cards:** Directly suggested actions appear as pressable cards below the AI response:
  - `[ COBA SATU LANGKAH KECIL ]`
  - `[ TULIS DI JURNAL ]`
  - `[ REHAT SEBENTAR ]`

---

## 21. Screen Layout: Ruang Cerita / Anonymous Forum (`/forum`)

### Purpose:
Empathy through shared human stories without social ego or vanity metrics.

### Key Rules:
- **No Avatars, No User Profiles, No Follower Counts.**
- Stories are authored under dynamic anonymous aliases (e.g., `Pengelana Teduh #4821`).

### Post Card Anatomy:
```
┌─────────────────────────────────────────────────────────────┐
│ [ KELUARGA ]                                   14 Sep 2026  │
│                                                             │
│ Sulitnya Menjelaskan Rasa Capek ke Orang Tua                │
│                                                             │
│ "Kadang bukan karena gak bersyukur, tapi rasanya standar    │
│ yang mereka taruh terlalu berat untuk dipikul sendirian..."  │
│                                                             │
│ [ 💜 14 Merasa Dikuatkan ]                     [ BACA → ]   │
└─────────────────────────────────────────────────────────────┘
```

- **Top Row:** Topic badge (`[ KELUARGA ]`, `[ PEKERJAAN ]`, `[ FINANSIAL ]`) + relative timestamp.
- **Title:** Bold 20px Space Grotesk.
- **Excerpt:** 2 lines of preview text.
- **Bottom Bar:** Support counter (`Merasa Dikuatkan`) + primary action `[ BACA → ]`.
- **Post Action CTA:** Sticky button on desktop/mobile: `[ + CERITA SECARA ANONIM ]`.

---

## 22. Screen Layout: Help & Resource Directory (`/resources`)

### Purpose:
Quick, calm access to professional emergency contacts, counseling, and crisis shelters.

### Categorization Blocks:
1. **DARURAT (Crisis Hotline):** Urgent Coral `#FF5252` accent.
2. **KONSELING GRATIS / TERJANGKAU:** Cobalt `#4169FF` accent.
3. **PERLINDUNGAN HUKUM & KEKERASAN:** Tangerine `#FF8A3D` accent.
4. **KOMUNITAS DUKUNGAN:** Lime `#B8F34A` accent.

### Resource Card Specification:
- **Name:** Professional institution name (e.g., `Layanan Sejiwa 119 ext. 8`).
- **Badge:** `24/7`, `Bebas Pulsa`, or `WhatsApp`.
- **Description:** Concise scope of assistance.
- **Action Button:** `[ HUBUNGI SEKARANG ↗ ]` (Direct `tel:` or `https:` link).

---

## 23. Crisis Design System (Emergency Mode)

Crisis mode is a **SPECIAL SYSTEM STATE** triggered automatically by the Crisis Gatekeeper or explicitly via the emergency button.

```
┌─────────────────────────────────────────────────────────────┐
│ 🚨 BANTUAN DARURAT                                          │
│                                                             │
│ JANGAN HADAPI INI SENDIRIAN.                                │
│ Hidupmu sangat berharga. Ada bantuan gratis dan rahasia     │
│ yang siap mendengarkanmu sekarang.                          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ LAYANAN SEJIWA (KEMENKES RI)                            │ │
│ │ Siaga 24 Jam • Bebas Pulsa                              │ │
│ │                                                         │ │
│ │ [ 📞 HUBUNGI 119 EXT 8 ]                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ YAYASAN PULIH (KONSULTASI KRISIS)                       │ │
│ │ [ 💬 HUBUNGI VIA WHATSAPP ]                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [ ← KEMBALI KE BERANDA ]                                    │
└─────────────────────────────────────────────────────────────┘
```

### Crisis UI Strict Requirements:
1. **Remove Distractions:** Strip away navigation links, journal prompts, forum feeds, and playful elements.
2. **Color Dominance:** Deep charcoal text with bold `#FF5252` (Crisis Red) accents on a clean white/cream surface.
3. **Typography:** Unambiguous, high-contrast, large display text:  
   **“JANGAN HADAPI INI SENDIRIAN.”**
4. **Primary Action:** Massive, direct call buttons (`[ 📞 HUBUNGI 119 EXT 8 ]`) with minimum 52px height.
5. **Calm, Serious, Direct Tone:** Zero jargon, zero clinical evaluation scores displayed.

---

## 24. Screen Layout: Weekly Reflection (`/report`)

### Purpose:
A compassionate review of the user’s emotional journey. Not a KPI performance dashboard.

### Specifications:
- **No Clinical Scores:** Never display "Mental Health Grade: B+" or "Depression Score: 78%".
- **Summary Metrics (Simple Counter Blocks):**
  - `07 CHECK-IN` (Minggu ini)
  - `04 MISI` (Terselesaikan)
  - `MOOD TERBANYAK: BERAT` (Fase yang paling sering dirasakan)
- **Reflective Observation (Editorial Paragraph):**
  - *"Minggu ini terlihat cukup melelahkan di pertengahan minggu, terutama seputar pekerjaan. Tapi kamu tetap menyempatkan waktu untuk 4 misi rehat. Itu sebuah langkah nyata."*
- **Action:** `[ TULIS REFLEKSI MINGGUAN ]`

---

## 25. Screen Layout: Session Recovery & Privacy (`/recovery`)

### Purpose:
Cryptographic, anonymous session management. Gives the user complete control over their local data without requiring personal identity.

### Sections:
1. **Status Sesi Lokal:** "Semua data tersimpan secara lokal di peramban ini."
2. **Frasa Pemulihan 12-Kata (E2EE):**
   - 12 boxed words with numeric markers (e.g., `01. samudra`, `02. lentera`, etc.).
   - Action: `[ SALIN FRASA PEMULIHAN ]`.
3. **Pulihkan Sesi di Perangkat Lain:**
   - 12-word input field to restore an existing session.
4. **Zona Bahaya / Hapus Data:**
   - Red-bordered card: `Hapus Semua Data Lokal`.
   - Action: `[ HAPUS SEMUA DATA ]` (Requires explicit confirmation modal).

---

## 26. Responsive Breakpoints & Recomposition

| Breakpoint | Viewport Width | Layout Strategy |
|---|---|---|
| **Mobile Small** | `360px – 389px` | Single-column, 16px padding, stacked buttons, compact mood blocks |
| **Mobile Standard** | `390px – 429px` | Single-column, 16px padding, touch targets min 44px |
| **Mobile Large** | `430px – 767px` | Single-column, 20px padding, generous breathing room |
| **Tablet** | `768px – 1023px` | 2-column grid for dashboard and cards, top navigation bar appears |
| **Desktop Standard**| `1024px – 1439px`| Max content container `1120px`, 2 to 3-column layout |
| **Desktop Wide** | `1440px+` | Max content container `1200px`, centered, generous margins (`96px`) |

### Recomposition Rules:
- **Never simply scale down desktop:** On mobile, side-by-side elements (such as Landing Hero copy vs. illustration) must cleanly stack into a single vertical narrative.
- **Touch Target Integrity:** All clickable items on mobile viewports must maintain a minimum bounding box of `44px x 44px`.

---

## 27. Accessibility (A11y) Standards

1. **Contrast Ratio:** All text on background surfaces must exceed WCAG 2.1 AA standards:
   - Body text (`#151515` on `#FFF8EF`): Contrast ratio **16.1:1** (Exceeds AAA).
   - Primary CTA text (`#151515` on `#B8F34A`): Contrast ratio **12.4:1** (Exceeds AAA).
   - Crisis text (`#FFFFFF` on `#FF5252`): Contrast ratio **4.5:1** (Meets AA).
2. **Keyboard Navigation:** Every interactive element must be reachable via `Tab` and display a clear, 2px focus ring.
3. **Screen Readers:** All icon-only buttons (such as the Close Dialog icon) must have explicit `aria-label` attributes.
4. **Non-Color Indicators:** Color is never the sole conveyor of information (e.g., mood selections include both color backgrounds and clear text labels).

---

## 28. Motion & Micro-Interactions

Motion must feel crisp, mechanical, and grounded—never floaty or distracting.

| Property | Value | Rationale |
|---|---|---|
| **Standard Duration** | `120ms – 160ms` | Fast, tactile, responsive |
| **Timing Function** | `cubic-bezier(0, 0, 0.2, 1)` | Crisp ease-out |
| **Button Press** | `translate(2px, 2px)` | Simulates physical key actuation |
| **Card Hover** | `translate(-2px, -2px)` | Subtle elevation with hard shadow expansion |

> 🚫 **BANNED MOTION:** No parallax scrolling, no floating decorative orbs, no bouncing badges, no slow fading overlays. Respect `prefers-reduced-motion: reduce` by disabling all translations.

---

## 29. Component UI States Matrix

Every component must rigorously implement the following 9 states:

| Component | Default | Hover | Active / Pressed | Focus | Disabled | Loading | Success | Error | Empty |
|---|---|---|---|---|---|---|---|---|---|
| **Button** | 2px border, 3px shadow | -1px translate, 4px shadow | +2px translate, 1px shadow | 2px focus ring | Muted grey, no shadow | Spinner inside, text hidden | Green tick indicator | Red border outline | N/A |
| **Input / Textarea** | White bg, 2px border, 2px shadow | Border darkens | Unchanged | 3px cobalt shadow | Grey bg, cursor blocked | Subtle pulse outline | Green border | Red 2px border + error text below | Placeholder visible |
| **Card** | White bg, 2px border, 3px shadow | Optional -2px hover | Unchanged | Focus ring | Muted opacity | Shimmer block | N/A | N/A | Empty illustration & copy |
| **Chip / Tag** | Cream bg, 1px border | 2px border | Solid accent fill | Focus ring | Grey text | N/A | Solid accent fill | Red border | N/A |

---

## 30. Component Library Specification

The core component set is strictly minimal and focused:

1. `Button` (Primary, Secondary, Emergency, Ghost)
2. `IconButton` (44px square, tactile offset)
3. `Input` (Text, Password, Mnemonic phrase input)
4. `Textarea` (Auto-expanding, generous padding)
5. `Chip` (Selectable topic/filter tag)
6. `Card` (Standard white content card with 2px border and 3px shadow)
7. `Section` (Spaced structural container with semantic `<section>` tag)
8. `Navigation` (Desktop sticky bar + Mobile bottom dock)
9. `MoodSelector` (5-state interactive mood block)
10. `MissionCard` (Dominant guided activity container)
11. `ActionCard` (Suggested action pill inside AI companion)
12. `ResourceCard` (Emergency contact and helpline card)
13. `ForumCard` (Anonymous story card with empathy counter)
14. `Dialog` (Modal container with 8px radius and backdrop overlay)
15. `Toast` (Non-intrusive bottom-right notification pill)
16. `LoadingState` (Crisp geometric loading skeleton)
17. `EmptyState` (Clean, encouraging message for empty lists)
18. `ErrorState` (Clear explanation with a single retry button)

---

## 31. Design Tokens Reference

### Tailwind / CSS Variables Mapping

```css
:root {
  /* Colors */
  --color-bg-paper: #FFF8EF;
  --color-surface: #FFFFFF;
  --color-ink: #151515;
  --color-accent-primary: #4169FF;
  --color-accent-positive: #B8F34A;
  --color-accent-attention: #FFD84D;
  --color-accent-warm: #FF8A3D;
  --color-accent-crisis: #FF5252;
  --color-border-subtle: #D8D3C9;

  /* Typography */
  --font-primary: 'Space Grotesk', system-ui, -apple-system, sans-serif;

  /* Borders & Shadows */
  --border-primary: 2px solid #151515;
  --border-subtle: 1px solid #D8D3C9;
  --shadow-sm: 2px 2px 0px #151515;
  --shadow-default: 3px 3px 0px #151515;
  --shadow-lg: 4px 4px 0px #151515;

  /* Radius */
  --radius-btn: 4px;
  --radius-input: 6px;
  --radius-card: 8px;
  --radius-dialog: 8px;

  /* Motion */
  --duration-fast: 140ms;
  --ease-tactile: cubic-bezier(0, 0, 0.2, 1);
}
```

---

## 32. Screen Specification Details

### 32.1 Landing Page
- **Route:** `/`
- **Purpose:** Provide instant solace and allow entry without any friction.
- **Primary Action:** `[ MULAI SEKARANG → ]`
- **Secondary Actions:** `[ LIHAT CARA KERJA ]`
- **Dominant Color:** Cream `#FFF8EF` with Cobalt `#4169FF` and Lime `#B8F34A`.
- **Key Headline:** `GAK HARUS BERES SEMUANYA HARI INI.`

### 32.2 Dashboard (Today)
- **Route:** `/dashboard`
- **Purpose:** Serve as a grounding daily touchpoint.
- **Primary Action:** `[ KERJAKAN MISI INI → ]`
- **Secondary Actions:** Mood logging (5 blocks), `Tulis Jurnal`, `Ruang Cerita`.
- **Dominant Color:** Cobalt `#4169FF` (Mission focus).

### 32.3 Check-in
- **Route:** `/checkin`
- **Purpose:** Express emotional state in under 30 seconds.
- **Primary Action:** `[ SIMPAN CHECK-IN ]`
- **Dominant Color:** Sunny Yellow `#FFD84D`.

### 32.4 Mission
- **Route:** `/mission`
- **Purpose:** Complete a 5-minute micro-exercise.
- **Primary Action:** `[ TANDAI SELESAI ]`
- **Dominant Color:** Cobalt `#4169FF`.

### 32.5 Journal
- **Route:** `/journal`
- **Purpose:** Therapeutic brain-dump without judgment.
- **Primary Action:** `[ SIMPAN JURNAL ]`
- **Dominant Color:** Tangerine `#FF8A3D`.

### 32.6 AI Conversation
- **Route:** `/chat`
- **Purpose:** Thoughtful reflection and debiasing through dialogue.
- **Primary Action:** Direct text input + contextual action cards.
- **Dominant Color:** Cobalt `#4169FF` and White `#FFFFFF`.

### 32.7 Ruang Cerita (Forum)
- **Route:** `/forum`
- **Purpose:** Read and share empathetic anonymous stories.
- **Primary Action:** `[ + CERITA SECARA ANONIM ]`
- **Dominant Color:** Cobalt `#4169FF`.

### 32.8 Resource Directory
- **Route:** `/resources`
- **Purpose:** Quick access to professional help lines.
- **Primary Action:** `[ 📞 HUBUNGI SEKARANG ]`
- **Dominant Color:** Coral `#FF5252` and Cobalt `#4169FF`.

### 32.9 Crisis Mode
- **Route:** `/crisis`
- **Purpose:** Emergency intervention for users in critical distress.
- **Primary Action:** `[ 📞 HUBUNGI 119 EXT 8 ]`
- **Dominant Color:** Urgent Coral `#FF5252` (High contrast).

### 32.10 Weekly Reflection
- **Route:** `/report`
- **Purpose:** Reflective retrospective of the user's emotional week.
- **Primary Action:** `[ TULIS REFLEKSI MINGGUAN ]`
- **Dominant Color:** Sunny Yellow `#FFD84D`.

### 32.11 Recovery & Privacy
- **Route:** `/recovery`
- **Purpose:** Mnemonic-based session backup and local data deletion.
- **Primary Action:** `[ SALIN FRASA PEMULIHAN ]`
- **Destructive Action:** `[ HAPUS SEMUA DATA ]` (Red outline, confirmation modal).

---

## 33. Design QA Checklist

Before shipping or approving any screen implementation, verify the following checklist:

- [ ] **No Profile UI:** Are there zero avatars, username displays, or account dropdowns?
- [ ] **No Pill-Shaped Buttons:** Are all buttons rectangular with 4–6px radius?
- [ ] **No Gradients:** Are all backgrounds and surfaces 100% flat colors?
- [ ] **No Glassmorphism:** Are backdrop-filter and translucent overlays completely absent?
- [ ] **One Dominant Accent:** Does each screen clearly highlight one primary accent color?
- [ ] **One Dominant CTA:** Is there an obvious, unambiguous primary action on the page?
- [ ] **Hard Shadows Only:** Are all shadows offset with 0px blur (`3px 3px 0px #151515`)?
- [ ] **2px Dark Borders:** Do interactive components feature a crisp 2px dark border?
- [ ] **Space Grotesk Typography:** Is Space Grotesk loaded and rendered cleanly?
- [ ] **Generous Whitespace:** Does the layout breathe without crowded cards?
- [ ] **44px Touch Targets:** Are all mobile buttons and clickable chips at least 44px tall?
- [ ] **Mobile-First Recomposition:** Does the layout stack cleanly on a 360px viewport?
- [ ] **Crisis Distinctiveness:** Is `/crisis` immediately recognizable, urgent, and distraction-free?
- [ ] **Instant Comprehension:** Can a stressed user understand the screen within 3 seconds?

---

## 34. Final Design Target

Dengar.in should visually feel like:

> **A modern, anonymous emotional utility  
> with colorful neo-brutalist craftsmanship  
> and extreme simplicity.**

### Visual Personality:
- **BOLD**
- **COLORFUL**
- **PLAYFUL**
- **HONEST**
- **CALM**
- **SIMPLE**

The user should remember the comforting colors and distinctive typography, not struggle with a complicated interface.

```
==================================================
           FINAL MANDATORY DIRECTIVE:
                  NO PROFILE.
                  NO AVATAR.
                  NO ACCOUNT.
                  NO USERNAME.
              NO SOCIAL IDENTITY.
==================================================
```
