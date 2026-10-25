# Design System: AACOMSOFT (SYSGPYA) — InsurTech & Agency Management SaaS
**Platform:** Responsive WebApp & Mobile PWA (iOS Safari, Android Chrome, Desktop Web)
**Methodology:** Google Stitch Semantic Design System (`design-md` + `taste-design`)

---

## 1. Visual Theme & Atmosphere
AACOMSOFT is a high-trust, executive financial and insurance advisory workspace used daily on the field (iOS/Android phones and iPads) and at the desk (PC/Mac).
The atmosphere is **"Executive Fintech Precision"** — clean, airy daylight surfaces paired with deep slate ink, whisper-quiet borders, and a single authoritative emerald-teal brand accent (dynamically adaptable to each agency's `--primary` token).
- **Density:** 6/10 (Balanced Daily Cockpit — scannable in 3 seconds on a phone between client meetings, rich and structured on desktop).
- **Variance:** 6/10 (Asymmetric Bento hierarchy on dashboards; strict tabular alignment on financial portfolios).
- **Motion:** 5/10 (Tactile, hardware-accelerated `transform`/`opacity` micro-feedback; zero distracting idle loops).

---

## 2. Color Palette & Roles
Strict neutral foundation with **one active semantic accent at a time** (eliminating multi-color "rainbow icon" fatigue in navigation bars):

- **Alabaster Canvas** (`#F8FAFC` / `slate-50`) — Primary application background surface in Light Mode; reduces eye strain compared to pure white.
- **Pure Elevation Surface** (`#FFFFFF`) — Elevated cards, modals, sheets, and interactive rows.
- **Obsidian Slate Canvas (Dark Mode)** (`#09090B` / `zinc-950`) — Primary dark mode background (never pure `#000000`).
- **Deep Slate Ink** (`#0F172A` / `slate-900`) — Primary headings, policy numbers, and financial figures.
- **Muted Graphite** (`#475569` / `slate-600`) — Secondary body text, table headers, and form labels.
- **Subtle Pewter** (`#94A3B8` / `slate-400`) — Captions, timestamps, and inactive navigation icons.
- **Whisper Hairline** (`#E2E8F0` / `slate-200/80`) — 1px structural dividers and card borders.
- **AACOM Emerald Teal (Primary Accent)** (`#0D9488` / `teal-600`, overrideable via `--primary` per agency) — Primary CTAs, active navigation indicator, focus rings, and key progress bars.
- **Semantic Status Tokens (Reserved strictly for real data states, never for decorative menu icons):**
  - **Coverage Active / Paid:** `#059669` (`emerald-600`) on `#ECFDF5` (`emerald-50`)
  - **Grace Period / Renewal Due:** `#D97706` (`amber-600`) on `#FFFBEB` (`amber-50`)
  - **Cancellation Risk / Overdue:** `#E11D48` (`rose-600`) on `#FFF1F2` (`rose-50`)

---

## 3. Typography Rules
- **Display & Headings:** `Plus Jakarta Sans` or `Geist` — Tight tracking (`tracking-tight`), bold/extrabold weights (`600`–`800`), controlled responsive scale (`clamp(1.25rem, 2.5vw, 1.75rem)` for page titles).
- **Body & UI Controls:** `Plus Jakarta Sans` / `Geist` — Minimum `14px` (`0.875rem`) on mobile controls, `16px` (`1rem`) on inputs (prevents iOS Safari auto-zoom on focus), relaxed line height.
- **Financial Figures & Policy Codes (Mandatory):** `Geist Mono` or `JetBrains Mono` with `font-variant-numeric: tabular-nums` (`tabular-nums`) for all annual premiums (`$MXN`), UDI values, policy numbers, renewal dates, and 25-Point daily scores.

---

## 4. Component Stylings
- **Navigation Shell (Hybrid Responsive):**
  - **Desktop (`>= 1024px`):** Clean translucent top bar (`bg-white/85 backdrop-blur-md border-b border-slate-200/80`) without heavy color gradients. Monochrome icons (`slate-500`) that turn `--primary` only when active.
  - **Mobile iOS & Android (`< 768px`):** Fixed **Bottom Tab Bar** (`h-16` + `pb-[env(safe-area-inset-bottom)]`) with the 4–5 most frequent daily actions (*Inicio*, *25 Puntos*, *Cartera*, *Asistente IA*, *Más*) within thumb reach, replacing the 22-link hamburger list for primary tasks.
- **Cards & Containers:**
  - Generously rounded corners (`rounded-2xl` / `16px`) with 1px subtle border (`border-slate-200/80`) and whisper shadow (`shadow-xs`).
  - **Single-Container Padding Rule:** Never nest `<div className="p-4 md:p-8">` inside `<main className="p-4 md:p-8">`. Mobile screens (`375px`–`430px`) must preserve `16px` (`px-4`) outer horizontal gutters so cards get `92%+` of viewport width.
- **Buttons & Touch Targets:**
  - Minimum `44px × 44px` (`h-11`) touch target on iOS and Android.
  - Tactile `active:scale-[0.98]` feedback on press.
  - One primary filled CTA per view; secondary actions use `variant="outline"` or subtle surface pills.
- **Inputs & Forms:**
  - Always `text-base` (`16px`) on `<input>`, `<select>`, and `<textarea>` on mobile viewports to prevent iOS Safari from zooming in and breaking the layout when typing.

---

## 5. Layout & Mobile PWA Principles (iOS & Android First)
- **Dynamic Viewport Height:** Always use `100dvh` (`min-h-dvh`) instead of `100vh` (`min-h-screen`) to avoid iOS Safari address-bar clipping.
- **Safe Area Insets:** Respect `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` on iPhone Dynamic Island and Home Indicator bars.
- **Responsive Data Presentation:**
  - **Desktop:** High-density table view with sticky headers, `tabular-nums`, and inline quick actions.
  - **Mobile (`< 768px`):** Automatic transformation of wide tables (like *Mi Cartera* and *Proyecto 200*) into compact **Actionable Policy Cards** with one-tap WhatsApp / Call / PDF actions—zero horizontal scrolling required.

---

## 6. Anti-Patterns (Strictly Banned)
- ❌ **No Rainbow Navigation Bars:** Do not assign 9 different Tailwind colors (`pink`, `orange`, `green`, `purple`, `amber`, `rose`, `indigo`) to top-level navigation icons simultaneously.
- ❌ **No Heavy Header Gradients:** Avoid opaque `bg-gradient-to-l from-primary` across the top navigation bar that clashes with agency logos and reduces text contrast.
- ❌ **No Double Padding Wrappers:** Pages inside `(dashboard)` must not re-apply `p-4 md:p-8` on top of the layout's `<main>` padding.
- ❌ **No Sub-16px Mobile Inputs:** Never use `text-xs` or `text-sm` directly on `<input>` elements without `md:text-sm` (`text-base md:text-sm`), as iOS Safari forces an unwanted page zoom on focus.
- ❌ **No Unformatted Currency Columns:** All currency and point counters must use `tabular-nums`.
