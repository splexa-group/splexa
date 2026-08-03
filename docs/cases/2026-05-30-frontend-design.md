# Cases Frontend — Design Spec
**Date:** 2026-05-30  
**Status:** Approved  
**Scope:** Cases list (`/cases`), case detail/edit page (`/cases/[id]`), case creation (`/cases/new`), shared modal components, design token additions

---

## 0. Design Tokens

All color values used in this feature reference CSS custom properties from `globals.css`. **Never use raw hex values in components — always use a token class or CSS variable.**

### 0.1 Existing tokens (already in `globals.css`)

| Tailwind class | CSS var | Value | Use |
|---|---|---|---|
| `text-dark` | `--text-dark` | `#0f172a` | Primary text, headings, input values |
| `text-label` | `--text-label` | `#334155` | Form labels, body copy |
| `text-secondary` | `--text-secondary` | `#475569` | Captions, meta text |
| `text-placeholder` | `--text-placeholder` | `#94a3b8` | Muted, ghost text |
| `text-disabled` | `--text-disabled` | `#94a3b8` | Disabled field text |
| `bg-page` | `--page` | `#f8fafc` | Page/tab body background |
| `bg-card` | `--card` | `#ffffff` | Card, section, modal backgrounds |
| `bg-subtle` | `--subtle` | `#f1f5f9` | Column headers, toolbar backgrounds |
| `border-line` | `--line` | `#e2e8f0` | All borders and dividers |
| `text-negative` | `--negative` | `#dc2626` | Delete actions, overdue, danger text |
| `bg-negative-muted` | `--negative-muted` | `#fee2e2` | Danger backgrounds |
| `text-amber` | `--amber` | `#d97706` | Today warnings, amber date text |
| `bg-amber-muted` | `--amber-muted` | `#fef3c7` | Amber/warning backgrounds |
| `text-positive` | `--positive` | `#16a34a` | Success |
| `bg-positive-muted` | `--positive-muted` | `#dcfce7` | Success backgrounds |
| `text-brand` | `--brand` | `#1e40af` | Tomorrow date, brand accents |
| `bg-brand-soft` | `--brand-soft` | `#dbeafe` | Blue tint backgrounds |
| `text-brand-light` | `--brand-light` | `#60a5fa` | Stayed status dot color |

### 0.2 New tokens — add to `globals.css`

Add to `@theme inline`:
```css
--color-priority-high:         var(--priority-high);
--color-priority-high-muted:   var(--priority-high-muted);
--color-priority-medium:       var(--priority-medium);
--color-priority-medium-muted: var(--priority-medium-muted);
```

Add to `:root`:
```css
--priority-high:         #ef4444;   /* red-500  — High priority stripe + dot */
--priority-high-muted:   #fee2e2;   /* red-100  — reuse existing negative-muted */
--priority-medium:       #f97316;   /* orange-500 — Medium priority stripe + dot */
--priority-medium-muted: #ffedd5;   /* orange-100 */
```

### 0.3 Token usage rules

- **Priority High stripe / dot** → `bg-priority-high`
- **Priority Medium stripe / dot** → `bg-priority-medium`
- **Overdue** → `text-negative`
- **Today** → `text-amber`
- **Tomorrow** → `text-brand`
- **Active status dot** → `bg-positive`
- **Stayed status dot** → `bg-brand-light`
- **Hearing Scheduled badge** → `bg-brand-soft text-brand`
- **Hearing Completed badge** → `bg-positive-muted text-positive`
- **Hearing Adjourned badge** → `bg-amber-muted text-amber`
- **Hearing Cancelled badge** → `bg-negative-muted text-negative`
- **Section background** → `bg-page`
- **Card/section wrapper** → `bg-card border-line`
- **Input focus ring** → `ring-brand`

---

## 1. Cases List Page — `/cases`

### 1.1 Layout

| Breakpoint | Layout |
|---|---|
| Mobile (`< md`) | Card list — full-width stacked cards |
| Desktop (`md+`) | Table — structured rows with column headers |

### 1.2 Desktop Table

**Columns (left → right):**
1. Priority stripe — 3 px left border on the row (`bg-priority-high` / `bg-priority-medium` / transparent)
2. **Case / Number** — case title (bold, 13 px, `text-dark`) with case number below (11 px, `text-placeholder`)
3. **Client** — client full name (`text-label`)
4. **Court** — abbreviated court name (`text-secondary`)
5. **Status** — small dot + plain text. Dot: `bg-positive` (Active), `bg-brand-light` (Stayed), `bg-placeholder` (Disposed)
6. **Next Hearing** — two-line cell: tiny `NEXT HEARING` label (`text-placeholder`, uppercase 10 px) + value: `text-negative` Overdue · `text-amber` Today · `text-brand` Tomorrow · `text-label` date · `text-placeholder` —
7. **⋯** — three-dot icon button. Opens popover menu.

**Column header row:** 10 px uppercase, `text-placeholder`. "Next Hearing" column shows chevron-down sort indicator.

**Row states:**
- Default: `bg-card`, `border-b border-line`
- Hover: `bg-subtle`
- Stayed / Disposed: `opacity-40`

**Three-dot popover menu:**
- **Edit** — navigate to `/cases/[id]`
- **View Client** — navigate to `/clients/[clientId]`
- **Delete** — open `ConfirmDeleteModal`

### 1.3 Mobile Cards

White card (`bg-card rounded-xl border border-line`), 3 px left priority stripe.

**Card layout:**
- Row 1: Case title (bold 14 px `text-dark`) | "NEXT HEARING" label + colored value (right-aligned)
- Row 2: Case number (11 px `text-placeholder`)
- Row 3: Client · Court (12 px `text-secondary`)
- Row 4: Status dot + text · Case type

Urgent cards (Overdue / Today): `border-negative-muted bg-[#fffafa]`

### 1.4 Page Controls

```
[Cases]                              [Add Case]
[Search…] [Priority ▾] [Court type ▾]
[All | Active | Stayed | Disposed]
[N cases · sorted by next hearing]
```

**Sorting:** overdue first → soonest upcoming → no-hearing cases last.

---

## 2. Case Detail / Edit Page — `/cases/[id]`

### 2.1 Page Structure

```
[Breadcrumb bar]                     [case no.] [Status pill]
[Case title — 20 px bold]
[Meta: client · court · type · priority]
[Tabs: Case | Client | Hearings | Documents | Important Dates]
─────────────────────────────────────────────────────────────
[Tab content — scrollable, bg-page padding]
─────────────────────────────────────────────────────────────
[Fixed footer — bg-card, border-t border-line]
```

### 2.2 Tabs

| Tab | Content |
|---|---|
| **Case** | Case Details · Court Details · Judge Details · Opposite Party — all editable inputs |
| **Client** | Client Info — mostly disabled inputs; only Role is editable |
| **Hearings** | Date-based timeline, latest first |
| **Documents** | File grid with type icons |
| **Important Dates** | List of key dates with type labels |

### 2.3 Case Tab

Sections in a 2-column grid (desktop), stacked (mobile):

**Case Details** (full-width):
- Case Title (text)
- Case Number · Case Type (select) · Filing Date — 3 cols
- Stage (select) · Status (select) · Priority (select) — 3 cols
- Description (textarea)

**Court Details:**
- Court Name (text, full-width)
- Court Type (select) · Bench No. (text)
- State (text) · City (text)

**Judge Details:**
- Judge Name (text) · Designation (text)

**Opposite Party** (one section-card per party; support multiple):
- Name (text) · Role (select)
- Advocate Name (text, optional) · Advocate Phone (text, optional)
- "＋ Add another party" link below appends a new card
- "Remove" link on each card removes it

**Input style:** `border border-line rounded-md`, focus: `ring-2 ring-brand border-brand`.  
**Section wrapper:** `bg-card border border-line rounded-xl` with 11 px uppercase `text-placeholder` section title.

### 2.4 Client Tab

Single section. Client identity is fixed after creation — fields come from the related `clients` record and are **disabled**. Only `clientRole` is editable.

Fields:
- Full Name (disabled) · Client Type (disabled)
- Phone (disabled)
- Role in case (select — **editable**)
- "View full client profile →" link → `/clients/[clientId]`

Disabled style: `bg-subtle text-secondary cursor-not-allowed`. Label shows a small lock icon.

### 2.5 Hearings Tab

Vertical timeline — latest on top, oldest at bottom.

**Timeline rail:** 1 px `border-line` vertical line connecting all dots.  
**Dot** (14 px circle): `bg-brand-soft border-brand` (Scheduled) · `bg-positive-muted border-positive` (Completed) · `bg-amber-muted border-amber` (Adjourned) · `bg-negative-muted border-negative` (Cancelled).

**Each hearing card:**
```
[Date bold]             [Status badge] [⋯]
[Purpose · Court room]
──────────────────────
[Notes — if present]
```

**Three-dot menu:**
- Edit hearing → opens `HearingEditModal`
- Delete → opens `ConfirmDeleteModal`

**Opacity:** hearings beyond the 2 most recent past ones render at `opacity-50`.

**Add Hearing** button: top-right of panel + fixed footer.

### 2.6 Documents Tab

Grid (`grid-cols-2 md:grid-cols-4`) of file tiles. Each tile:
- File-type icon: PDF (red), DOCX (blue), image (green), generic (gray)
- File name (truncated, `text-label text-sm`)
- Upload date (`text-placeholder text-xs`)
- ⋯ menu: Download · Delete

Upload button in fixed footer.

### 2.7 Important Dates Tab

Chronological list of important dates tied to this case. Uses the `important-dates` backend module.

**Date types** (`ImportantDateType`): HearingDate · Limitation · BailExpiry · StayExpiry · AppealDeadline · InjunctionValidity · Other

**Each item displayed as a row:**
```
[Type badge]  [Date — bold]  [Description/notes]  [⋯]
```

- Type badge: small pill, `bg-brand-soft text-brand` (default), `bg-negative-muted text-negative` for BailExpiry/StayExpiry/Limitation (time-critical types)
- Date: `text-dark font-semibold`. If date < today → `text-negative` (expired). If date = today → `text-amber`.
- Description: `text-secondary text-sm`
- ⋯ menu: Edit · Delete

**Add Important Date** button: top-right + fixed footer.  
**Empty state:** "No important dates added yet" with an Add button.

### 2.8 Fixed Page Footer

`position: sticky bottom-0`, `h-[60px] bg-card border-t border-line z-20`.  
Danger action on the left · primary/cancel on the right.

| Tab | Left | Right |
|---|---|---|
| Case | Delete Case (danger) | Cancel · Save Changes |
| Client | — | Cancel · Save Changes |
| Hearings | — | Add Hearing |
| Documents | — | Upload Document |
| Important Dates | — | Add Important Date |

**Button styles:**
- Primary (Save / Add): `bg-dark text-white` (uses `--text-dark` as background)
- Cancel: `bg-card border border-line text-secondary`
- Danger (Delete): `bg-card border border-negative-muted text-negative`

---

## 3. Shared Components

### 3.1 ConfirmDeleteModal

**File:** `components/ui/confirm-delete-modal.tsx`  
Used for all destructive actions: delete case, delete hearing, delete document, delete important date.

**Props:**
```ts
interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;           // e.g. "case", "hearing"
  entityName: string;      // e.g. "Sharma v State of AP"
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}
```

**Layout:**
```
[Trash icon in bg-negative-muted box]
[Delete this {title}?]
[You are about to permanently delete "{entityName}" and all its data.]
[⚠ This cannot be undone.]
[Cancel]  [Yes, delete {title}]
```

- Confirm button: `bg-negative text-white`, shows spinner when `isPending`
- Overlay: `bg-black/40`, click-outside triggers `onCancel`

### 3.2 HearingEditModal

**File:** `components/cases/hearing-edit-modal.tsx`  
Opens from the ⋯ menu on each hearing card.

**Fields:**
- Hearing Date (date)
- Purpose (select — `HearingPurpose` enum)
- Status (select — `HearingStatus` enum)
- Judge Present (text, optional)
- Notes (textarea, optional)
- Next Date (date — **conditionally shown** when Status = Adjourned)
- Adjournment Reason (text, optional — shown when Status = Adjourned)

**Footer:** Cancel · Save Hearing (primary, shows spinner while saving)

### 3.3 ImportantDateModal

**File:** `components/cases/important-date-modal.tsx`  
Used for both Add and Edit important dates.

**Fields:**
- Date type (select — `ImportantDateType` enum)
- Date (date input)
- Description / notes (textarea, optional)

**Footer:** Cancel · Save Date

---

## 4. Case Creation — `/cases/new`

### 4.1 Philosophy

An advocate must be able to create a case in under 60 seconds with just a title and a client. Every other field is optional. The form must never block creation because of missing optional data.

### 4.2 Page Layout

Full page (same shell as `/cases/[id]` — breadcrumb + header + content + fixed footer). No tabs.

```
[Breadcrumb: Cases / New Case]
[Page title: New Case]
─────────────────────────────
[Required section — always expanded]
[Optional sections — collapsed by default, expandable]
─────────────────────────────
[Footer: Cancel · Create Case]
```

### 4.3 Required Section

Always visible, no toggle. Marked clearly: "Required to create a case".

**Fields:**
1. **Case Title** (text, required) — placeholder: "e.g. Sharma v State of AP"
2. **Client** (required) — a search-and-select component:
   - Type to search existing clients by name or phone
   - Results appear as a dropdown list
   - If no match: "＋ Create new client" option at the bottom of the dropdown
   - Selecting "Create new client" **expands an inline form** (not a separate page):
     - Full Name (text, required)
     - Phone (text, required)
     - Client Type (select: Individual / Company / NGO / Government)
3. **Client Role** (select: Petitioner / Respondent / Accused / Complainant, required)

### 4.4 Optional Sections

Collapsed by default. Each section has a toggle/chevron header. Expanding one does not collapse others.

**Case Details** (optional):
- Case Number, Case Type (select), Filing Date
- Stage (select), Priority (select)
- Description (textarea)

**Court Details** (optional):
- Court Name, Court Type (select), State, City, Bench No.

**Judge Details** (optional):
- Judge Name, Designation

**Opposite Party** (optional):
- Same as edit page — Name, Role, Advocate Name, Advocate Phone
- "＋ Add party" to add more

### 4.5 Validation

- "Create Case" button is **disabled** until: title is non-empty AND a client is selected/created.
- All optional fields validate on blur (not on submit) — show inline errors.
- On submit: show spinner on button, disable form.

### 4.6 After Creation

- On success: navigate to `/cases/[newId]?tab=case` — the full edit page
- Show success toast: "Case created"
- On error: stay on form, show error toast, preserve all input

### 4.7 Mobile Behavior

Same page, fully responsive. Optional sections default to collapsed (saves scroll). Client search opens a bottom drawer on mobile instead of a dropdown.

---

## 5. Navigation & Routing

| Route | View |
|---|---|
| `/cases` | Cases list |
| `/cases/new` | Create new case |
| `/cases/[id]` | Case detail / edit — defaults to Case tab |
| `/cases/[id]?tab=client` | Client tab |
| `/cases/[id]?tab=hearings` | Hearings tab |
| `/cases/[id]?tab=documents` | Documents tab |
| `/cases/[id]?tab=important-dates` | Important Dates tab |

After save on edit page: stay on same URL, show success toast.  
After delete case: navigate to `/cases`.  
After delete hearing/document/date: stay on current tab, remove item from list.

---

## 6. Out of Scope (Phase 1)

- Client detail page (`/clients/[id]`)
- Documents upload to S3 (UI shell only — upload button present, wired up separately)
- Bulk actions on cases list
- Case assignment / team member UI
- Print / export
