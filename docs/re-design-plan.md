# Mail Agent — Full UI/UX Redesign Proposal

> **Status:** Approved and in progress. MVP UI implementation is underway.

---

## 1. Product / Feature Summary

**Mail Agent** is a desktop-first, unified inbox workspace that aggregates email from multiple accounts (Gmail + IMAP), applies AI-powered triage, links messages to Notion, and surfaces quick actions for fast processing. The core user loop is: **scan → judge → act**.

The current implementation lives entirely in a single `page.tsx` (1,650 lines) with all layout, state, and logic co-located. There are no routes beyond the root. The design system is defined in `globals.css` (~1,189 lines) with no component abstraction.

---

## 2. Current UI/UX Diagnosis

### 2.1 Structural Problems

| Problem | Severity | Location |
|---|---|---|
| Entire app is a single monolithic page component | Critical | `page.tsx` |
| No routing — all views live in one render tree | High | All |
| `top-notice` banner occupies prime vertical space with marketing copy | High | Mail column header |
| Toolbar has a Korean-language `h2` ("최근 메일을 한 흐름으로 확인") as a visible heading | High | `.toolbar__title` |
| `status-banner` repeats state info already expressed in the list | Medium | Mail column |
| `filter-rail` shows redundant active filter tokens directly below search, but can't be interacted with | Medium | Mail column |
| Filter UI is split across three rows: filter-rail, status-banner, filterbar | High | Mail column |
| Smart Views are chip-only, non-navigable, non-functional | High | Sidebar |
| Detail column disappears completely when no message is selected, creating a jarring layout shift | High | Workspace grid |
| Sidebar "Accounts" section and Sidebar "Mailboxes" section duplicate account context shown in mail rows | Medium | Sidebar |
| AI Panel, Labels Panel, and Failure State Panel are three separate utility panels visible simultaneously as stacked sections | High | Right utility panel |
| Composer opens as a full-screen modal, blocking access to the mail list | High | Composer |
| Action buttons (Reply, Reply All, Forward, Mark Read, Archive, Delete, Retry) are all equal-weight secondary buttons in a horizontal row | Critical | Detail header |
| Label application is buried in the right utility panel, below AI and above Failure panels | Medium | Right panel |
| `detail-meta-grid` (From/To/Cc/Account/Received) repeats information already in `detail-header__title` area | Medium | Detail main |

### 2.2 Information Hierarchy Problems

- The `toolbar__eyebrow` ("Unified Inbox") + `toolbar__title` (Korean heading) are the **largest text on screen** but convey zero actionable information. This is pure visual noise at the most valuable position.
- **Sender and subject have equal font weight** in the mail row (`font-size: 14px` for both), making it hard to scan quickly.
- The **unread dot** is 8px and positioned in a separate 18px column, making it easy to miss.
- The `account-badge` in the row footer is **below** the snippet — it's the least prominent element, yet it's critical for multi-account users.
- The **timestamp** is the correct size (`12px`) but is in the top-right of the row, competing with the sender name and losing.
- In the detail view, the **subject** is `28px` — appropriate — but it sits next to a `detail-header__eyebrow` label ("Read message" / "Unread message") in the accent color, adding unnecessary decorative labeling.
- The action bar in the detail view has **7 equal-weight buttons** in a horizontal row. There is no visual distinction between primary (Reply), secondary (Archive, Mark Read), and destructive (Delete) actions.

### 2.3 Missing States

| Missing State | Impact |
|---|---|
| No skeleton for the right utility panel during detail load | Jarring blank area |
| No "No message selected" state for the detail column — it simply disappears | Layout shift on deselect |
| AI Panel is always "Pending" — no real empty state design | Misleading placeholder |
| Composer has no character/size indicator | UX gap |
| No sync progress indicator tied to individual accounts | Hidden information |
| No star/flag toggle in the mail row | Missing quick action |
| No keyboard shortcut indicators for primary actions | Blocks power user flow |

### 2.4 Worst Friction Points (Ranked)

1. **Layout collapse** when no message is selected — the 3-pane grid drops to 2-pane, causing full-width reflow of the mail list.
2. **7 equal-weight action buttons** in the detail header — no clear primary action.
3. **3-row filter UI** (filter-rail + status-banner + filterbar) collapses context and adds scroll cost.
4. **Marketing banner** ("top-notice") above the mail list consuming real estate on every load.
5. **AI and Labels panels** always visible even when empty/inactive.
6. **Composer as blocking modal** — breaks the reading context.

---

## 3. Target User Experience

The user opens Mail Agent. The inbox is immediately visible, dense, and scannable. There is no welcome copy, no dashboard widget, no marketing panel.

The user scans by **sender + subject + status indicator** (unread dot, attachment flag, reply-needed badge). They click a message. The detail panel slides in **without any layout shift** — it was always there as a column. Actions are immediately obvious: one primary "Reply" button, smaller secondary buttons for Archive and Mark Read, a single icon for Delete.

The AI panel exists **inside** the detail column, below the message body — not as a competing right-side panel. It loads after the body. The Notion link panel only appears if a Notion integration exists.

When the user is done with a message, they hit Archive (keyboard: `e`). The next message auto-advances. Zero layout shift. Zero hesitation.

---

## 4. New Information Architecture

```
App Shell
├── Sidebar (persistent, collapsible)
│   ├── Brand / Logo
│   ├── Navigation
│   │   ├── All Inbox (count)
│   │   ├── Unread
│   │   ├── Reply Needed
│   │   ├── Starred
│   │   ├── Archive
│   │   └── Trash
│   ├── Smart Labels (collapsible)
│   └── Accounts (status indicators only, collapsible)
│
├── Mail List Column (fixed width, always visible)
│   ├── Column Header (title + Compose button)
│   ├── Search Bar (integrated, not a fake div)
│   ├── Filter Bar (single row, chip-style, collapsible)
│   └── Mail List
│       └── Mail Row (sender + subject + snippet + timestamp + status dots)
│
└── Detail Column (fixed width, always present — shows placeholder when empty)
    ├── Detail Header (subject + quick actions toolbar)
    ├── Sender Meta Bar (from / to / date — single inline row, collapsed by default)
    ├── Message Body (reading area)
    ├── Attachments (inline, below body)
    ├── AI Panel (inline, below attachments — loads async)
    └── Notion Link Panel (inline, conditional on integration)
```

**Removed from IA:**
- `top-notice` banner
- `toolbar__title` Korean heading
- `status-banner` (redundant state display)
- `filter-rail` (merged into filter bar)
- Separate right-side utility panel column
- "Failure State" as a standalone panel (becomes inline alert in detail header)
- "Labels" as a standalone panel (becomes inline in detail header actions)

---

## 5. New Screen Flow

```
[App Load]
   → Fetch inbox + accounts in parallel
   → Show skeleton mail list immediately
   → Detail column shows "Select a message" placeholder (fixed)
   → Accounts in sidebar show sync status dots

[Message Selection]
   → Mail row selected (instant highlight, no layout shift)
   → Detail panel loads content in-place (skeleton → content)
   → Scroll position in detail resets to top
   → Read state marked automatically (or via toggle)

[Quick Action]
   → Action button clicked → optimistic UI update → server confirm
   → Success: inline toast in detail header (dismisses after 3s)
   → Failure: inline error banner in detail header (persists, with Retry button)
   → Archive/Delete: auto-advances to next message

[Compose]
   → Compose opens as a SPLIT-PANE within the detail column (not a modal)
   → Or as a slide-up bottom sheet at ≤1199px
   → Mail list remains fully visible and interactive

[Reply/Forward]
   → Opens in detail column bottom section, pushing body up
   → Context-aware: shows original message snippet above compose area

[Filter Change]
   → No page reload — instant client filter
   → Active filters shown as inline chips below search
   → "Clear all" chip appears when filters active

[Account Sync Error]
   → Account in sidebar shows warning dot
   → Clicking account shows brief reconnect action inline
```

---

## 6. Layout Strategy

### 6.1 Grid Structure

```
.workspace {
  display: grid;
  grid-template-columns: [sidebar] 240px [list] 360px [detail] 1fr;
  grid-template-rows: 100vh;
}
```

**Critical change: The detail column is ALWAYS rendered.** When no message is selected, it shows a neutral "Select a message" placeholder. This eliminates the jarring layout shift caused by the current 2-pane ↔ 3-pane toggle.

### 6.2 Column Responsibilities

| Column | Width | Scrolls? | Overflow behavior |
|---|---|---|---|
| Sidebar | `240px` | Yes (section list) | Collapses to icon-only at `≤1199px` |
| Mail List | `360px` (min) | Yes (message list only) | Fixed width, mail list scrolls |
| Detail | `1fr` | Yes (detail content) | Always present |

### 6.3 Vertical Zones

**Mail List Column:**
- Column Header (48px fixed): title + compose button
- Search + Filter Bar (48–80px): search input + optional filter chips
- Mail List (remainder, scrollable)

**Detail Column:**
- Detail Toolbar (48px fixed): subject line + action buttons
- Sender Meta Bar (32px, collapsed by default, expand on click)
- Message Body (scrollable reading area)
- Inline panels (AI, Attachments, Notion — stacked below body)

---

## 7. Visual Direction

### 7.1 What Changes

The current design is **directionally correct** (neutral surfaces, ink text, blue accent) but **structurally flawed**. The color system is kept; the component structure and information hierarchy are replaced.

**Replace:**
- Korean language UI copy with English (interface language consistency)
- `toolbar__title` decorative heading with a functional column header
- Equal-weight action buttons with a clear action hierarchy
- Stacked right-side panels with inline sequential sections
- Decorative `top-notice` gradient banner with nothing

**Keep:**
- Neutral surface system (bg-app, bg-panel, bg-panel-muted)
- Blue accent for active states and primary actions
- Ink-scale text hierarchy (text-strong → text-muted)
- Border-based separation over shadow
- Shimmer skeleton animations

### 7.2 Typography Refinements

| Current Problem | Fix |
|---|---|
| Sender and subject same weight (14px) in mail row | Sender: `14px / 600`, Subject: `14px / 450`, Snippet: `13px / 400` |
| `toolbar__title` 28px Korean heading in mail column | Removed. Replace with `16px / 600` column title |
| `detail-header__title` 28px always rendered even while loading | Skeleton shown during load; title appears after |
| `sidebar__eyebrow` all-caps blue label | Removed; use `12px / 600` muted label instead |
| German/English mixed in action labels | English only throughout |

### 7.3 Motion Refinements

| Current | Proposed |
|---|---|
| No transition on 2→3 pane toggle | Remove toggle entirely (always 3 pane) |
| `160ms ease` for row hover/select | Keep |
| Modal composer entrance | Replace with slide-in detail panel section |
| No loading transition between detail states | Fade: `120ms` between skeleton and content |

---

## 8. Design System Proposal

### 8.1 Color Roles

The existing CSS variables are **retained**. These additions and clarifications are required:

```css
/* NEW: Semantic surface roles */
--surface-app:        #F5F7FA;   /* outermost background */
--surface-panel:      #FFFFFF;   /* panel background */
--surface-raised:     #FFFFFF;   /* tooltips, dropdowns */
--surface-recessed:   #F1F4F8;   /* inputs, secondary areas */

/* NEW: State tints (background use only) */
--tint-unread:        rgba(29, 122, 252, 0.06);
--tint-selected:      rgba(29, 122, 252, 0.08);
--tint-warning:       rgba(217, 130, 43, 0.08);
--tint-danger:        rgba(214, 69, 69, 0.08);
--tint-success:       rgba(31, 157, 104, 0.08);

/* CLARIFIED: Border roles */
--border-default:     #E2E8F0;   /* all panel boundaries */
--border-strong:      #CBD5E1;   /* inputs, emphasized dividers */
--border-focus:       #1D7AFC;   /* focus rings */
```

**Removed:** `--bg-selected: #E8F1FF` (replaced by `--tint-selected`)

### 8.2 Typography Scale

| Token | Size / Line-height | Weight | Use |
|---|---|---|---|
| `--text-xs` | `11px / 16px` | 500 | Avoid. Keyboard shortcuts only |
| `--text-sm` | `12px / 18px` | 400–600 | Timestamps, labels, meta |
| `--text-base` | `14px / 20px` | 400–600 | Body text, row content |
| `--text-md` | `15px / 22px` | 500 | Descriptions |
| `--text-lg` | `18px / 26px` | 600 | Section titles |
| `--text-xl` | `22px / 30px` | 650 | Panel headings |
| `--text-2xl` | `28px / 36px` | 700 | Detail subject line |

**Mail Row Hierarchy (specific):**
- Sender name: `14px / 600` → `text-strong`
- Subject (unread): `14px / 600` → `text-strong`
- Subject (read): `14px / 450` → `text-primary`
- Snippet: `13px / 400` → `text-secondary`
- Timestamp: `12px / 400` → `text-muted`, `font-family: mono`

### 8.3 Spacing Scale

Unchanged from existing. Emphasize usage rules:
- `4px`: icon-to-label gaps, dot positioning
- `8px`: within a field group, between chips
- `12px`: between row sections, field padding
- `16px`: panel internal padding (default)
- `20px`: panel padding for reading areas
- `24px`: between distinct sections
- `32px`: major section breaks

### 8.4 Border / Radius Rules

| Component | Radius |
|---|---|
| App panels, columns | `16px` outer |
| Cards within panels (meta grid, attachment, failure) | `10px` |
| Buttons (default) | `8px` |
| Filter chips, badges | `999px` |
| Input fields | `8px` |
| Tooltips, dropdowns | `10px` |

**Rule:** `16px` is only used for the outermost shell panels. Everything inside uses `10px` or less.

### 8.5 Shadow / Elevation Rules

| Level | Use | Value |
|---|---|---|
| `elevation-0` | App panels, mail rows | No shadow. Border only. |
| `elevation-1` | Search bar focus, filter dropdowns | `0 2px 8px rgba(15,23,42,0.06)` |
| `elevation-2` | Composer bottom sheet, tooltips | `0 8px 24px rgba(15,23,42,0.10)` |
| `elevation-3` | (Removed: no full-screen modals) | N/A |

### 8.6 Icon Usage Rules

- Use **Lucide** or **Radix Icons** (16px, stroke-width: 1.5)
- Icons in action buttons: **always accompanied by a text label** (not icon-only) except for toggle/close buttons
- Status dots remain (8px circles), not icons
- No decorative icons in panels
- Attachment icon: `Paperclip`, Archive: `ArchiveBox`, Trash: `Trash2`, Reply: `CornerUpLeft`, Star: `Star`

### 8.7 Component Variants

#### Button Hierarchy

```
Primary:    Filled blue — Reply (1 per view max)
Secondary:  Outlined — Archive, Mark Read, Forward
Ghost:      No border, no bg — Mark Unread, Label, Retry
Danger:     Ghost + danger color text — Delete
Icon:       36px square, ghost — keyboard shortcut buttons
```

#### Status Indicators

```
Dot (8px):  Unread state in mail row
Pill:       Account sync status (connected / syncing / error)
Badge:      Count (unread count in sidebar nav)
Chip:       Labels, active filters (dismissible with ×)
```

---

## 9. Component Redesign Plan

### 9.1 `<Sidebar>` → `<AppSidebar>`

**Remove:**
- `sidebar__eyebrow` ("MAIL AGENT" all-caps label)
- `sidebar__title` + `sidebar__copy` (full description text)
- `chip`-only Smart Views section (non-functional)

**Redesign:**
- Brand mark: Compact logo/wordmark, `20px`
- Navigation: Vertical nav list with **icon + label + count badge**. Nav items are real navigation targets (even if client-side filtered).
- Smart Filters as nav items under a collapsible "Views" group:
  - Unread, Reply Needed, Starred, Notion Linked
- Accounts section: condensed. Each account = one row with status dot + account name. Click to filter list.
- Compose button: **moved to top of mail column header** (not in sidebar)
- Footer: minimal — settings link only

**States needed:** collapsed (icon-only), expanded, account error (warning dot)

### 9.2 `<MailColumn>` → `<InboxColumn>`

**Remove:**
- `top-notice` banner entirely
- `toolbar__eyebrow` + `toolbar__title` (28px Korean heading)
- `status-banner` (redundant state indicator)
- `filter-rail` (merge into filter bar)

**Redesign:**
- **Column header** (48px, sticky): Title (e.g., "All Inbox") + message count + Compose button (right-aligned)
- **Search bar** (real `<input>`, not a presentational div): full-width, icon left, `⌘K` shortcut right
- **Filter bar** (single row, below search): Account select chip + toggle chips (Unread, Attachments, Hide Archived). Collapses by default. Expands when `⌘F` or filter icon is pressed. Active filters persist as dismissible chips.
- **Mail list**: no change to core structure, but refined row design (see 9.3)

### 9.3 `<MailRow>`

**Remove:**
- `mail-row__footer` chip section (Unread / Inbox / Trash labels are redundant with visual state)
- Chips rendering "Unread", "Inbox", "Trash" — these are state, expressed through visual treatment

**Redesign:**

```
[unread dot] [sender · account badge · timestamp]
             [subject (strong if unread)]
             [snippet · attachment icon if hasAttachments · starred icon if isStarred]
```

Sender row: `sender` (bold/semibold) + `account badge` (pill, dimmed) + `timestamp` (right-aligned, mono)

Subject: full width, bold if unread, normal weight if read

Footer: `snippet` text only (no chip clutter). Attachment `📎` icon + star icon rendered inline at right of footer.

**Unread state:** entire row has `--tint-unread` background (very subtle). Sender + subject are `600` weight. Dot visible.

**Selected state:** `--tint-selected` background + `2px` left border in `--accent-primary`. Smooth `160ms` transition.

**Hover state:** `--bg-hover` background. Only on non-selected rows.

### 9.4 `<DetailColumn>`

**Always rendered.** Never disappears.

**Placeholder state** (no message selected):
- Centered, muted copy: "Select a message to read it here"
- Optional keyboard hint: `↑↓ to navigate`

**Loading state:**
- Skeleton: title block (60%), meta bar (40%), body block (full width, 4 lines)

**Ready state:**

```
┌─ Detail Toolbar (sticky, 48px) ──────────────────────────────┐
│  [subject, truncated]          [Reply▼] [Archive] [···]       │
└───────────────────────────────────────────────────────────────┘
   ↳ Expandable: Reply All, Forward, Mark Unread, Delete (ghost)

┌─ Sender Meta Bar (32px, collapsed) ──────────────────────────┐
│  From: John Smith <john@...>  ·  To: me  ·  2026-07-03       │
└───────────────────────────────────────────────────────────────┘
   ↳ Click to expand full From/To/Cc/Account/Received grid

┌─ Message Body ────────────────────────────────────────────────┐
│  [HTML or text content]                                        │
└───────────────────────────────────────────────────────────────┘

┌─ Attachments (conditional) ──────────────────────────────────┐
│  📎 filename.pdf  ·  2.3 MB  ·  [Download]                    │
└───────────────────────────────────────────────────────────────┘

┌─ AI Analysis (async, below body) ────────────────────────────┐
│  Summary: ...                                                  │
│  Action needed: Reply by Friday  Priority: High                │
└───────────────────────────────────────────────────────────────┘

┌─ Notion Link (conditional, if integrated) ───────────────────┐
│  ✓ Linked to "Project Alpha" task  [Open in Notion]           │
└───────────────────────────────────────────────────────────────┘
```

**Action button hierarchy in Detail Toolbar:**
- `Reply` → Primary button (filled blue)
- Dropdown arrow on Reply → expands to Reply All, Forward
- `Archive` → Secondary button (outlined)
- `···` (overflow) → Ghost icon button → shows: Mark Read/Unread, Delete (danger), Apply Label

**Failure State:** Appears as an inline warning banner **inside** the detail toolbar zone, not as a separate panel.

### 9.5 `<Composer>` — Replace Modal with Inline Sheet

**Current problem:** Full-screen modal blocks the inbox.

**Proposal — Context-aware Compose Modes:**

**Compose new:** Opens as a **bottom sheet** anchored to the detail column. The mail list remains fully scrollable and selectable.

**Reply / Forward:** Opens as an **inline section below the message body** within the detail column. User can scroll back up to re-read the original message while composing.

**Keyboard dismiss:** `Esc`
**Send:** `⌘↵`

### 9.6 `<FilterBar>` — Merge 3 Rows into 1

**Remove:** `filter-rail` (passive tokens) + `status-banner` (verbose state copy)

**Redesign:** Single `40px` bar below search:
- Left: Active filter chips (dismissible with `×`)
- Right: Account selector (dropdown) + filter toggle chips (Unread, Attachments)
- Count shown next to inbox title in column header, not in a separate status pill

### 9.7 `<AccountsPanel>` in Sidebar

**Remove:** `account-card` with full meta copy in sidebar

**Redesign:** Compact account row:
```
● Gmail (work)     [synced]
⚠ IMAP (personal) [error → Reconnect]
```

Clicking the account filters the mail list. No detail expansion in sidebar.

---

## 10. Screen-by-Screen Redesign Plan

### 10.1 Inbox (Main View)

| Zone | Before | After |
|---|---|---|
| Top of mail column | `top-notice` marketing banner | Column header: "All Inbox · 14 messages" + Compose |
| Below header | `toolbar` with 28px Korean heading | Search bar (functional `<input>`) |
| Below search | `filter-rail` passive tokens | Filter bar: single row, active chips only |
| Below filter | `status-banner` verbose status | Removed. Status = row count in header |
| Below status | `filterbar` (selects + chips) | Merged into filter bar above |
| Mail list | Rows with footer chips | Rows without footer chips; status via visual treatment |
| Right side (empty) | Panel disappears | Persistent placeholder column |

### 10.2 Mail Detail View

| Zone | Before | After |
|---|---|---|
| Detail header | `eyebrow` label + 28px subject + 7 equal buttons | Sticky toolbar: truncated subject + Reply (primary) + Archive (secondary) + `···` overflow |
| Sender meta | Inline `from / date / account` in 3 spans | Collapsed meta bar (expandable) |
| Content | Meta grid + Labels section + Body + Attachments | Body first → Attachments → AI panel → Notion |
| Right panel | 3 separate panel sections (AI, Labels, Failure) | All moved inline, below body |
| Label application | Input + button in right panel | In `···` overflow menu dropdown |
| Failure state | Separate panel with card | Inline banner in detail header |

### 10.3 Compose View

| Before | After |
|---|---|
| Full-screen modal, blocks inbox | Bottom sheet docked to detail column |
| Reply opens same modal | Inline section below message body |
| Korean heading in composer | English label only |
| Separate Cancel / Send buttons at bottom | Send at bottom-right, Esc to dismiss |

---

## 11. Interaction and State Design

### 11.1 State Matrix

| Component | States Required |
|---|---|
| Mail Row | default, unread, hover, selected, selected+unread, skeleton |
| Mail List | loading (skeleton), empty (no messages), filtered-empty, ready |
| Detail Column | idle (no selection), loading, ready, error |
| Action Buttons | default, loading (spinner), disabled, success (brief), error |
| Account Row in Sidebar | connected, syncing, error, disconnected |
| AI Panel | not-loaded, loading, ready, failed, unavailable (no integration) |
| Notion Panel | not-linked, linked, loading-link, failed |
| Composer | closed, open-new, open-reply, open-forward, sending, sent, error |
| Filter Chips | inactive, active, hover |
| Search Bar | empty, focused, has-query, loading-results |

### 11.2 Keyboard Shortcuts (to surface in UI)

| Shortcut | Action |
|---|---|
| `r` | Reply to selected message |
| `e` | Archive selected message |
| `#` | Delete selected message |
| `u` | Mark unread |
| `s` | Star/unstar |
| `c` | Compose new |
| `↑ / ↓` | Navigate messages |
| `⌘K` | Focus search |
| `Esc` | Close composer / deselect message |

These shortcuts should be **visible** in action tooltips and the overflow (`···`) menu.

---

## 12. Accessibility Considerations

- **Focus management:** When a message is selected via keyboard, focus moves to the detail toolbar's primary action (Reply). When composer opens, focus moves to first input field.
- **ARIA:** `role="list"` on mail list, `role="listitem"` on rows. `aria-selected` on selected row. `aria-live="polite"` on action feedback areas.
- **Color-only state:** Unread state currently uses only a dot (color). Add `aria-label="Unread"` to the dot element, and use font-weight to reinforce visually.
- **Keyboard focus visibility:** Current `outline: 2px solid rgba(29, 122, 252, 0.18)` is too low contrast. Use `outline: 2px solid #1D7AFC` with `outline-offset: 2px`.
- **Touch targets:** All interactive elements minimum `44px` in mobile view.
- **Motion:** Respect `prefers-reduced-motion`. Disable shimmer animations and transitions.
- **Contrast:** Verify `text-muted (#7B8794)` on `bg-panel (#FFFFFF)` — it currently fails WCAG AA at small sizes. Darken to `#6B7685` or increase size.

---

## 13. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| `≥1440px` | Full 3-pane: sidebar 240px + list 380px + detail 1fr |
| `1200–1439px` | Sidebar collapses to icon rail (52px). List 360px. Detail 1fr. |
| `1024–1199px` | Icon-rail sidebar. List 320px. Detail 1fr. AI/Notion panels stack below body. |
| `768–1023px` | Sidebar hidden (hamburger). List or Detail shown — tap to switch. No 3-pane. |
| `≤767px` | Mobile: List view. Tap row → full-screen detail. Compose is bottom sheet. |

**Key mobile changes:**
- Sidebar becomes a slide-over drawer
- Detail replaces list (push navigation)
- Filter bar becomes a modal sheet
- Reply/Forward becomes a bottom sheet covering 75vh

---

## 14. Implementation Phases

### Phase 1 — Structure and Navigation (No visual change to most users)

1. Extract monolithic `page.tsx` into separate component files
2. Replace 2-pane/3-pane toggle with permanent 3-column grid
3. Add "Select a message" idle state for detail column
4. Move all CSS into co-located module files per component

**Files:**
- `apps/web/app/components/AppShell.tsx`
- `apps/web/app/components/Sidebar/index.tsx`
- `apps/web/app/components/InboxColumn/index.tsx`
- `apps/web/app/components/DetailColumn/index.tsx`
- `apps/web/app/layout.css` (shell only)

### Phase 2 — Information Hierarchy Fix

1. Remove `top-notice` banner
2. Remove `toolbar__title` Korean heading
3. Remove `status-banner`
4. Merge `filter-rail` + `filterbar` into single `<FilterBar>` component
5. Redesign `<MailRow>` — remove footer chips, refine font weights and spacing
6. Add star/attachment icons to mail row footer

### Phase 3 — Detail View Restructure

1. Make detail toolbar sticky within column
2. Collapse sender meta bar (expandable on click)
3. Restructure action hierarchy: Reply (primary) + Archive (secondary) + `···` overflow
4. Move Labels and Failure State into detail toolbar zone
5. Move AI Panel and Notion Panel inline below body (no separate right column)
6. Remove right utility panel entirely

### Phase 4 — Composer Redesign

1. Replace full-screen modal with bottom-sheet composer for new compose
2. Replace reply modal with inline-section composer below message body
3. Add keyboard shortcuts: `⌘↵` to send, `Esc` to dismiss

### Phase 5 — Design System Formalization

1. Add CSS variables for new tint roles
2. Fix focus ring contrast
3. Add `prefers-reduced-motion` rules
4. Darken `text-muted` to pass WCAG AA
5. Formalize button hierarchy in CSS (primary / secondary / ghost / danger)
6. Add keyboard shortcut tooltip system

### Phase 6 — State Design Completion

1. Add skeleton for right panel (or inline AI section)
2. Add complete empty states for all list conditions with action CTAs
3. Add success / error inline toast system in detail toolbar
4. Add sync progress in account row (sidebar)

---

## 15. Risks and Trade-offs

| Risk | Mitigation |
|---|---|
| Permanent 3-column layout may feel cramped at 1280px | Sidebar auto-collapses to icon rail at ≤1440px; list has min-width |
| Inline composer removes "full focus" compose experience | Offer optional full-width mode triggered by expand icon |
| Removing the right utility panel kills the AI/Notion section discoverability | AI panel anchored with a section heading below body; always visible as placeholder "Analysis pending" |
| Merging all actions into `···` overflow hides infrequently-used actions | Only Reply + Archive exposed at top level; rest in overflow. Power users use keyboard shortcuts. |
| Polish phase could increase CSS complexity | Use CSS Modules or co-located styles per component to prevent global leakage |
| Korean/English mixed UI copy currently present | Standardize on English. If Korean UI is required for product, use a proper i18n solution — not ad-hoc mixed strings. |

---

## 16. Final Checklist for Implementation

### Layout
- [ ] 3-column grid is permanent (no 2↔3 toggle)
- [x] Sidebar collapses to icon rail at ≤1440px
- [ ] Detail column shows idle placeholder when no message selected
- [x] No layout shift when selecting or deselecting a message

### Mail List
- [x] `top-notice` banner removed
- [x] `toolbar__title` Korean heading removed
- [x] `status-banner` removed
- [ ] Filter UI consolidated to single row below search
- [x] Mail row shows: sender (bold), subject, snippet, timestamp, attachment icon, star icon
- [x] Footer chip section (Unread/Inbox/Trash labels) removed
- [x] Unread row uses `--tint-unread` background + `600` weight text
- [x] Selected row uses `--tint-selected` + left accent border

### Detail View
- [x] Detail toolbar is sticky
- [x] Reply is the only primary button (filled, blue)
- [x] Archive is secondary button (outlined)
- [x] Delete is in `···` overflow, ghost + danger color
- [x] Label apply is in `···` overflow
- [x] Sender meta bar is collapsed by default, expandable
- [x] AI panel renders inline below body
- [ ] Notion panel renders inline below AI (conditional)
- [x] Failure state is an inline banner inside detail, not a separate panel
- [x] All states covered: idle, loading, ready, error

### Composer
- [x] Compose new: bottom sheet (not blocking modal)
- [x] Reply: inline section below message body
- [x] `⌘↵` sends
- [x] `Esc` dismisses

### Design System
- [x] CSS tint variables added
- [x] Focus rings pass WCAG AA (`2px solid #1D7AFC`, offset `2px`)
- [ ] `text-muted` value passes WCAG AA at `12px+`
- [x] `prefers-reduced-motion` respected
- [x] Font weights defined per component (not ad-hoc in JSX)

### Accessibility
- [x] `aria-selected` on selected mail row
- [x] `aria-live="polite"` on action feedback zones
- [ ] All interactive elements ≥ 44px touch target on mobile
- [x] Keyboard navigation fully functional (↑↓ in list, r/e/c shortcuts)
- [ ] Focus management on message selection and composer open

### States
- [x] Mail list: loading skeleton, empty, filtered-empty, error
- [x] Detail: idle placeholder, loading skeleton, ready, error
- [x] Actions: loading, success, error (with retry)
- [ ] Account: connected, syncing, error, disconnected
- [ ] AI panel: pending, loading, ready, failed

### Responsive
- [ ] ≥1440px: full 3-pane
- [ ] 1200–1439px: icon-rail sidebar
- [ ] 1024–1199px: icon-rail + reduced list width
- [ ] ≤1023px: 2-pane (sidebar hidden)
- [ ] ≤767px: mobile single-pane with drill-in

---

> **What to redesign first for largest impact:** Remove the `top-notice` banner, merge the 3-row filter into one, and fix the permanent 3-column grid. These three changes eliminate the most friction with the least code change.
