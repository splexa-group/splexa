# Frontend Auth Design Spec

**Date:** 2026-05-16
**Branch:** chore/authentication
**Scope:** Login page + Signup page — auth flow frontend

---

## Overview

Two-page passwordless OTP auth flow. Each page splits into two columns:
- **Left (40%)** — brand panel, dark navy gradient, static trust/feature content. Different content on login vs signup.
- **Right (60%)** — white form panel, centered form, all interaction happens here.

The left panel never changes while the user is on a page. It is not a form — it is a trust signal.

On mobile (< 768px): left panel collapses to a compact header bar. Form takes full screen.

---

## Color Tokens

### Brand

| Token | Hex | Usage |
|---|---|---|
| `--color-panel` | `#0c1445` | Left panel gradient start (darkest) |
| `--color-panel-mid` | `#1e3a8a` | Left panel gradient end |
| `--color-primary` | `#1e40af` | Buttons, links, nav active, focus rings |
| `--color-primary-hover` | `#1e3a8a` | Button hover, pressed state |
| `--color-primary-mid` | `#3b82f6` | Icons on dark backgrounds |
| `--color-primary-light` | `#60a5fa` | Sidebar icons, nav accent on dark |
| `--color-primary-tint` | `#dbeafe` | Selected row bg, tag bg, hover bg |

Left panel gradient: `linear-gradient(160deg, #0c1445 0%, #1e3a8a 100%)`

### Neutral / Surface

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#f8fafc` | Page background |
| `--color-surface` | `#ffffff` | Cards, form panels, modals |
| `--color-surface-raised` | `#f1f5f9` | Table row hover, subtle backgrounds |
| `--color-border` | `#e2e8f0` | Card borders, dividers, input borders |
| `--color-text` | `#0f172a` | Body text, headings, primary content |
| `--color-text-secondary` | `#475569` | Labels, sub-headings, captions |
| `--color-text-muted` | `#94a3b8` | Placeholders, helper text, timestamps |

### Status

| State | Background | Text | Usage |
|---|---|---|---|
| Success | `#dcfce7` | `#15803d` | Active, verified, completed, paid |
| Error | `#fee2e2` | `#dc2626` | Failed, overdue, rejected, closed |
| Warning | `#fef3c7` | `#b45309` | Adjourned, pending, due soon, draft |
| Info | `#dbeafe` | `#1d4ed8` | Scheduled, in progress, sent |
| Neutral | `#f1f5f9` | `#475569` | Archived, inactive, not started |
| Urgent | `#fef2f2` + border `#fecaca` | `#991b1b` | Emergency / deadline passed |
| Action Needed | `#eff6ff` + border `#bfdbfe` | `#1e40af` | Requires user attention |

### Sidebar Navigation

| Element | Value |
|---|---|
| Sidebar background | `#0c1445` |
| Default item text | `#94a3b8` |
| Hover item bg | `rgba(255,255,255,0.07)` |
| Hover item text | `#cbd5e1` |
| Active item bg | `#1e40af` |
| Active item text | `#ffffff` |
| Icons | `#60a5fa` |
| Badge (count) bg / text | `#1e40af` / `#93c5fd` |
| Badge (urgent) bg / text | `#7f1d1d` / `#fca5a5` |
| Dividers | `rgba(255,255,255,0.08)` |

---

## Typography

**Font:** Inter (already installed via `next/font/google`)
No second typeface — Inter handles everything cleanly at all weights.

| Role | Size | Weight | Colour |
|---|---|---|---|
| Page heading (auth) | 28px / 1.75rem | 700 | `#0f172a` |
| Section heading | 18px | 600 | `#0f172a` |
| Body / form label | 14px | 500 | `#374151` |
| Helper / caption | 13px | 400 | `#475569` |
| Placeholder | 13px | 400 | `#94a3b8` |
| Button | 14px | 500 | — |
| Badge / tag | 11px | 600 | — |
| Left panel brand | 22px | 700 | `#ffffff` |
| Left panel body | 13px | 400 | `#bfdbfe` |

---

## Buttons

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| Primary | `#1e40af` | `#fff` | — | Main CTA (Continue, Verify, Submit) |
| Primary hover | `#1e3a8a` | `#fff` | — | — |
| Secondary | `#fff` | `#1e40af` | `#1e40af` | Secondary actions (Cancel, Back) |
| Ghost | `transparent` | `#1e40af` | — | Tertiary (Skip, Learn more) |
| Danger | `#dc2626` | `#fff` | — | Destructive (Delete, Revoke) |
| Danger ghost | `transparent` | `#dc2626` | `#dc2626` | Soft destructive (Remove) |
| Disabled | `#e2e8f0` | `#94a3b8` | — | Any loading / inactive state |

All buttons: `border-radius: 6px`, `padding: 9px 16px`, `font-size: 14px`, `font-weight: 500`

---

## Form Inputs

| State | Border | Shadow / Ring |
|---|---|---|
| Default | `#e2e8f0` | — |
| Focused | `#1e40af` | `0 0 0 3px rgba(30,64,175,0.12)` |
| Error | `#dc2626` | `0 0 0 3px rgba(220,38,38,0.10)` |
| Disabled | `#e2e8f0` | — (bg: `#f8fafc`) |

All inputs: `border-radius: 6px`, `padding: 9px 12px`, `font-size: 14px`

---

## Auth Pages

### Layout (both pages)

```
┌────────────────────────────────────────────────────────┐
│  LEFT PANEL (40%)          │  RIGHT PANEL (60%)         │
│  bg: linear-gradient navy  │  bg: #ffffff               │
│                            │                            │
│  Logo + name               │  ← form centered here →   │
│                            │                            │
│  Heading                   │                            │
│  Body text                 │                            │
│                            │                            │
│  Feature list / content    │                            │
│                            │                            │
│  Trust badges              │                            │
│  (bottom of panel)         │                            │
└────────────────────────────────────────────────────────┘
```

Right panel form is horizontally + vertically centered. Max width: 400px.

---

### Login Page — Left Panel

**Purpose:** Reassure a returning user. They already know what Splexa is. Show what is waiting for them inside.

**Content:**

```
[Logo] Splexa

"Welcome back.
Your practice is waiting."

──────────────────────

✓  Never miss a hearing date again
✓  All courts and tribunals supported
✓  1,200+ advocates trust Splexa daily

──────────────────────

"Splexa has saved me hours every week.
Hearing reminders alone are worth it."
— Adv. Ramesh Iyer, Chennai

──────────────────────

🔒 256-bit SSL   ✓ BCI Aligned   🇮🇳 Made in India
```

**Tone:** Familiar, warm, "your work is here." Not salesy.

---

### Login Page — Right Panel (Form)

```
Sign in to Splexa

Enter your email to receive a one-time code.

[Email address input]

[Continue with email — Primary button]

──────────────────────
Don't have an account? Create one →
```

**Step 2 (after email submitted — same page, animated transition):**

```
Check your email

We sent a 6-digit code to a***@gmail.com

[  ][  ][  ][  ][  ][  ]   ← 6 individual OTP boxes

[Verify code — Primary button]

Didn't receive it? Resend code (in 30s)
← Back to email
```

---

### Signup Page — Left Panel

**Purpose:** Convert a new user who has never used Splexa. Show value, build trust, reduce hesitation.

**Content:**

```
[Logo] Splexa

"Built for Indian advocates.
Not adapted — built."

──────────────────────

✓  Hearing date reminders — never miss a date
✓  All courts and tribunals supported
✓  Client portal for sharing case updates
✓  Secure encrypted document storage
✓  Works on mobile, tablet, and desktop

──────────────────────

"1,200+ advocates across India
use Splexa every day."

[Bar chart / stat graphic — illustrative]

──────────────────────

🔒 256-bit SSL   ✓ BCI Aligned   🇮🇳 Made in India
```

**Tone:** Persuasive but honest. Specific to Indian courts. Not generic SaaS marketing.

---

### Signup Page — Right Panel (Form)

Multi-step — never show all fields at once. Each step is one screen.

**Step 1 — Email:**

```
Create your account

Start with your email address.

[Email address input]

[Continue — Primary button]

──────────────────────
Already have an account? Sign in →
```

**Step 2 — OTP verify:**

```
Verify your email

We sent a 6-digit code to a***@gmail.com

[  ][  ][  ][  ][  ][  ]

[Verify & continue — Primary button]

Didn't receive it? Resend (30s)
← Back
```

**Step 3 — Personal details:**

```
Tell us about yourself

First name        Last name
[____________]    [____________]

Designation
[Advocate ▾]

Phone number (for reminders)
[+91 __________]

[Continue — Primary button]
```

**Step 4 — Practice details:**

```
About your practice

Firm / chamber name
[____________]

Practice type
[Criminal  ▾]

City
[____________]

[Create account — Primary button]
```

On submit → `POST /api/v1/auth/signup` → OTP sent (already done in Step 1/2) → redirect to `/dashboard`.

---

## SEO Metadata

### Login Page (`/login`)

```ts
export const metadata: Metadata = {
  title: 'Sign in — Splexa',
  description: 'Sign in to Splexa to manage your cases, hearings, and clients. Secure passwordless login for Indian advocates.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Sign in — Splexa',
    description: 'Legal practice management for Indian advocates.',
    type: 'website',
  },
}
```

`robots: noindex` — no reason to index the login page.

### Signup Page (`/signup`)

```ts
export const metadata: Metadata = {
  title: 'Start free — Splexa | Legal Practice Management for Indian Advocates',
  description: 'Join 1,200+ Indian advocates using Splexa to manage cases, track hearings, and never miss a court date. Free to start.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Splexa — Legal Practice Management for Indian Advocates',
    description: 'Manage cases, hearings, and clients in one place. Built for Indian courts.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Splexa — Built for Indian Advocates',
    description: 'Never miss a hearing date again.',
  },
}
```

`robots: index` — signup page is the acquisition entry point. Should be discoverable.

### Root Layout

```ts
export const metadata: Metadata = {
  title: { default: 'Splexa', template: '%s — Splexa' },
  description: 'Legal practice management for Indian advocates.',
  metadataBase: new URL('https://splexa.in'),
}
```

---

## Toasts / Feedback Messages

| Event | Type | Message |
|---|---|---|
| OTP sent | Info | "Code sent to a\*\*\*@gmail.com" |
| OTP invalid | Error | "That code is incorrect. X attempts remaining." |
| OTP expired | Error | "Code expired. Request a new one." |
| OTP locked | Error | "Too many attempts. Request a new code." |
| Rate limited | Warning | "Too many requests. Try again in a few minutes." |
| Network error | Error | "Something went wrong. Please try again." |
| Account created | Success | "Welcome to Splexa!" |
| Signed in | Success | "Welcome back." |

---

## What Is Out of Scope (This PR)

- Dashboard page (redirect target only — stub page is enough)
- Forgot email flow
- Invite flow
- Social login
- Animated transitions between OTP steps (Phase 2 polish)
- PWA / offline support
