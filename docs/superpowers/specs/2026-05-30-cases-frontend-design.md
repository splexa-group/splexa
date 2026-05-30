# Cases Frontend — Design Spec
**Date:** 2026-05-30  
**Status:** Approved  
**Scope:** Cases list page, case detail/edit page (tabs: Case, Client, Hearings, Documents), shared confirm-delete modal

---

## 1. Cases List Page — `/cases`

### 1.1 Layout

| Breakpoint | Layout |
|---|---|
| Mobile (`< md`) | Card list — full-width stacked cards |
| Desktop (`md+`) | Table — structured rows with column headers |

### 1.2 Desktop Table

**Columns (left → right):**
1. Priority stripe — 3 px left border on the row (red = High, orange = Medium, none = Low)
2. **Case / Number** — case title (bold, 13 px) with case number below (11 px, `#d1d5db`)
3. **Client** — client full name
4. **Court** — abbreviated court name
5. **Status** — small dot + plain text (`Active`, `Stayed`, `Disposed`). No pill backgrounds.
6. **Next Hearing** — two-line cell: tiny `NEXT HEARING` uppercase label + value below. Values: `Overdue` (red `#dc2626`), `Today` (amber `#d97706`), `Tomorrow` (blue `#2563eb`), date string (dark `#374151`), `—` (light gray).
7. **⋯** — three-dot icon button, right-aligned. Opens an inline popover menu.

**Column header row:** 10 px, uppercase, `#c4c4c4`. "Next Hearing" column shows a sort indicator (chevron down) — list is sorted by next hearing date ascending, overdue first.

**Row states:**
- Default: white background, `#f5f5f5` bottom border.
- Hover: `#fafafa` background.
- Stayed / Disposed: `opacity: 0.4`.

**Three-dot popover menu (per row):**
- **Edit** — navigates to `/cases/[id]`
- **View Client** — navigates to `/clients/[clientId]`
- **Delete** — opens the reusable `ConfirmDeleteModal`

### 1.3 Mobile Cards

Each case is a white card (`border-radius: 10px`, `border: 1px solid #ececec`) with a 3 px left priority stripe.

**Card layout (top → bottom):**
- Row 1: Case title (bold, 14 px) | Next hearing (right-aligned — tiny `NEXT HEARING` label + coloured value)
- Row 2: Case number (11 px, `#d1d5db`)
- Row 3: Client name · Court (12 px, `#6b7280`)
- Row 4 (footer): Status dot + text · Case type

Urgent cards (Overdue / Today): `border-color: #fecaca`, background `#fffafa`.

### 1.4 Page Controls

```
[Page title: Cases]                       [Add Case button]
[Search input — cases, clients, numbers…] [Priority ▾] [Court type ▾]
[All | Active | Stayed | Disposed]        ← status tab strip with counts
[N cases · sorted by next hearing]        ← list meta line
```

**Status tabs:** All / Active / Stayed / Disposed — each shows a count badge. Active tab underline = `#0f1117`.

**Sorting:** Always by next hearing date ascending (overdue first, then soonest, then no-hearing cases last). No manual sort toggle needed in Phase 1.

---

## 2. Case Detail / Edit Page — `/cases/[id]`

### 2.1 Page Structure

```
[Breadcrumb: Cases / Case title]          [case number] [Status pill]
[Page header: large case title]
[Meta: Client · Court · Case type]
[Tabs: Case | Client | Hearings | Documents]
─────────────────────────────────────────
[Tab content — scrollable]
─────────────────────────────────────────
[Fixed footer]
```

**Breadcrumb bar (46 px):** "Cases" link → separator → current case title. Right side: case number (muted) + status pill.

**Page header:** Large title (20 px, weight 800), meta line below (client · court · type · priority), then tabs. No next-hearing banner on the edit page — that lived on the read-only detail view.

### 2.2 Tabs

| Tab | Content |
|---|---|
| **Case** | Form sections: Case Details, Court Details, Judge Details |
| **Client** | Form sections: Client Info |
| **Hearings** | Date-based timeline of all hearings |
| **Documents** | Uploaded documents with file-type icons |

### 2.3 Case Tab

Three form sections rendered in a 2-column grid (sections side-by-side on desktop, stacked on mobile):

**Case Details section** (full-width, spans both columns):
- Case Title (text, full-width)
- Case Number, Case Type (select), Filing Date — 3-column row
- Stage (select), Status (select), Priority (select) — 3-column row
- Description (textarea, full-width)

**Court Details section:**
- Court Name (text, full-width)
- Court Type (select), Bench No. (text)
- State (text), City (text)

**Judge Details section:**
- Judge Name (text, full-width)
- Designation (text, full-width)

**Opposite Party section** (one card per party; multiple parties supported):
- Name (text), Role (select: Petitioner / Respondent / Accused / Complainant)
- Advocate Name (text, optional), Advocate Phone (text, optional)
- "Add another party" link appends a new card

**All inputs are always editable** (no read-only toggle). `border: 1px solid #e5e7eb`, `border-radius: 7px`, focus ring: `border-color: #a5b4fc` + `box-shadow: 0 0 0 3px rgba(165,180,252,0.15)`.

**Section wrapper style:** White card, `border: 1px solid #ececec`, `border-radius: 10px`. Section title: 11 px uppercase label in `#9ca3af`.

### 2.4 Client Tab

Single section: **Client Info**

The client identity cannot be changed after case creation (not in `updateCaseSchema`). Client fields (name, phone, type) are rendered as **disabled inputs** — showing real data but visually indicating they are not editable. Only `clientRole` is editable.

Fields:
- Full Name (text, **disabled**), Client Type (select, **disabled**)
- Phone (text, **disabled**)
- Role in case (select: Petitioner / Respondent / Accused / Complainant — **editable**)
- Link: "View full client profile →" navigates to `/clients/[clientId]`

Disabled input style: `background: #f9fafb`, `color: #6b7280`, cursor not-allowed. Label shows a small lock icon to communicate non-editable.

### 2.5 Hearings Tab

**Vertical timeline.** Latest hearing at top, oldest at bottom.

**Timeline visual:**
- Vertical line: 1 px, `#e5e7eb`, runs from first dot to last
- Per-hearing dot (14 px circle): colour matches status — Scheduled (blue tint), Completed (green tint), Adjourned (yellow tint), Cancelled (red tint)

**Each hearing card:**
```
[Date  (bold)]          [Status badge]  [⋯]
[Purpose · Room/notes]
─────────────────────
[Notes text — if present]
```

- Date: 13 px bold `#0f1117`
- Status badge: 10 px coloured pill (Scheduled blue, Completed green, Adjourned amber, Cancelled red)
- Notes: 12 px `#6b7280`, separated by a subtle top border

**Three-dot menu per card:**
- **Edit hearing** — opens `HearingEditModal` (see §3)
- **Delete** — opens `ConfirmDeleteModal`

**Older hearings** (> 2 past hearings): `opacity: 0.5`.

**Add Hearing** button: top-right of the hearings panel + duplicated in the fixed footer.

### 2.6 Documents Tab

Grid of document tiles. Each tile shows:
- File-type icon (PDF, DOCX, image, generic) — colour-coded by type
- File name (truncated if long)
- Upload date (small, muted)
- Three-dot menu: Download · Delete

Upload button in fixed footer.

### 2.7 Fixed Page Footer

Sticky bar at the bottom of the page (`height: 60 px`, `border-top: 1px solid #e9eaed`, white background, `z-index: 20`).

**Layout:** danger action left · primary/secondary actions right.

| Tab | Left | Right |
|---|---|---|
| Case | Delete Case (danger) | Cancel · Save Changes |
| Client | — | Cancel · Save Changes |
| Hearings | — | Add Hearing |
| Documents | — | Upload Document |

Button styles:
- **Save Changes / primary action:** `background: #0f1117`, white text
- **Cancel:** ghost — white background, `border: 1px solid #e5e7eb`, gray text
- **Delete Case:** white background, `color: #dc2626`, `border: 1px solid #fecaca`

---

## 3. Shared Components

### 3.1 ConfirmDeleteModal

Reusable modal used for all destructive deletes (cases, hearings, documents).

**Props:** `title`, `entityName`, `onConfirm`, `onCancel`

**Structure:**
```
[Red icon box — trash icon]
[Title: "Delete this {title}?"]
[Body: "You are about to permanently delete {entityName} and all associated data."]
[Warning: "⚠ This cannot be undone." — red text]
[Footer: Cancel · Yes, delete {title}]
```

- Cancel: white button with border
- Confirm: `background: #dc2626`, white text, bold
- Overlay: `rgba(0,0,0,0.4)`, click-outside closes

### 3.2 HearingEditModal

Opens when "Edit hearing" is selected from the hearing card's three-dot menu.

**Fields (all in input format):**
- Hearing Date (date input)
- Purpose (select: Arguments / Evidence / Cross-Examination / Order / Mention / Settlement / Miscellaneous)
- Status (select: Scheduled / Completed / Adjourned / Cancelled)
- Judge Present (text, optional)
- Notes (textarea, optional)
- Next Date (date input — shown only when Status = Adjourned)
- Adjournment Reason (text — shown only when Status = Adjourned)

**Footer:** Cancel · Save Hearing

---

## 4. Navigation & Routing

| Route | View |
|---|---|
| `/cases` | Cases list |
| `/cases/[id]` | Case detail / edit (defaults to Case tab) |
| `/cases/[id]?tab=client` | Client tab active |
| `/cases/[id]?tab=hearings` | Hearings tab active |
| `/cases/[id]?tab=documents` | Documents tab active |

**"Add Case" button** on the list page navigates to `/cases/new` — the creation form is a separate spec and out of scope here. After creation, the form redirects to `/cases/[newId]?tab=case`.  
After deleting a case: navigate back to `/cases`.  
After saving changes: stay on the same page, show success toast.

---

## 5. Design Tokens (summary)

| Token | Value |
|---|---|
| Primary text | `#0f1117` |
| Secondary text | `#6b7280` |
| Muted text | `#9ca3af` |
| Ghost text | `#c4c4c4` |
| Border default | `#ececec` or `#e5e7eb` |
| Background page | `#fafafa` |
| Background card | `#ffffff` |
| Priority High dot | `#ef4444` |
| Priority Medium dot | `#f97316` |
| Overdue / danger | `#dc2626` |
| Today / amber | `#d97706` |
| Tomorrow / blue | `#2563eb` |
| Active status dot | `#22c55e` |
| Stayed status dot | `#93c5fd` |

---

## 6. Out of Scope (Phase 1)

- Case creation wizard / "Add Case" form — separate spec
- Client detail page
- Documents upload flow (S3 integration)
- Bulk actions on cases list
- Case sharing / team assignment UI
- Print / export
