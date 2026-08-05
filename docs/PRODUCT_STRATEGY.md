# Mail Agent — AI-Native Product Strategy & Full UX Redesign

> **Document type:** Product strategy + UX architecture proposal  
> **Scope:** Complete redesign — product vision through implementation phases  
> **Status:** Approved and in progress

---

## 1. Product Vision

**Mail Agent is not an email client. It is a command center for your communication.**

The job is not to display email. The job is to reduce the time between "email arrives" and "email is resolved" — whether resolution means reading, replying, delegating, archiving, extracting a task, or ignoring it entirely.

The product should feel like having a capable assistant who has already read your inbox, flagged what matters, drafted your replies, and connected everything to your workspace — before you even open the app.

**One-line positioning:**

> The AI-native mail workspace that turns email overload into a resolved queue.

**What makes this different from Gmail, Outlook, or Notion Mail:**

- It does not treat all email as equal. It has opinions about what matters.
- It does not just display email. It suggests what to do next.
- It works across every account simultaneously, not as a per-account view.
- It connects email to action, not just to storage.
- AI is the structure, not a feature bolted on.

---

## 2. Core User Problems

Ordered by frequency and severity.

### P1 — Inbox as attention sink
The inbox demands attention constantly but delivers low signal. Users check email compulsively because they cannot trust the system to tell them what is actually important. **Resolution:** AI-driven priority surfacing that earns trust through accuracy.

### P2 — Multi-account fragmentation
Professionals manage 2–5 email accounts across work, school, personal, and side projects. Each account has a different client, different rules, different mental overhead. **Resolution:** True unified inbox with clear account identity at the row level.

### P3 — Reply latency as a professional liability
Important emails sit unread because drafting a reply requires context-switching and mental effort. **Resolution:** AI drafting that generates a good-enough reply in 10 seconds, requires only review and send.

### P4 — Email as opaque archive
Finding anything older than a week is painful. Email search is broken. Context is lost. **Resolution:** Semantic search across all accounts, plus structured threading and automatic context enrichment.

### P5 — Newsletter and low-priority mail pollution
Receipts, newsletters, and automated messages dilute the inbox. They don't require action but they consume visual space and attention. **Resolution:** Automatic classification and digest consolidation.

### P6 — Email → task gap
Action items in email are invisible unless manually transferred to a task system. **Resolution:** Inline action extraction with one-click push to workspace or task list.

### P7 — No continuity between email and work context
A critical email thread has no connection to the project it belongs to. **Resolution:** Notion-style workspace linking that connects threads to knowledge bases.

---

## 3. Target Users

### Primary: The Overwhelmed Professional

- Manages 2–3 email accounts (work + personal, or work + school)
- Receives 40–150 emails per day
- Has important emails that require thoughtful replies
- Misses deadlines and follow-ups because email is buried
- Uses Notion, Linear, or similar tools for work
- Wants speed, not features

**What they need:** Triage at speed. Trust that what's surfaced matters. Draft replies that don't sound like AI. One-click connection to their workspace.

### Secondary: The Academic or Student Professional

- Has a school/university email + personal Gmail
- Receives a mix of professor emails, automated system alerts, and newsletters
- Deadline-driven, not response-time-driven
- Wants to extract action items (assignments, meetings, deadlines) from email
- May use Notion as a second brain

**What they need:** Classification by type (academic, administrative, personal). Action extraction. Thread summaries to catch up fast.

### Tertiary: The Indie Developer / Freelancer

- Manages client email + personal + possibly a domain email
- Email is often a contract negotiation, invoice, or project update tool
- Needs to find old emails fast
- May want to link email context to a project or invoice tracking system

**What they need:** Powerful search. Thread history. Good email drafting. Receipt/invoice extraction.

---

## 4. Main Jobs-to-Be-Done

| Job | Trigger | Outcome | Current Tool Failure |
|---|---|---|---|
| Triage inbox | Open app | Know what matters right now | All emails look equal |
| Read important message | Select from list | Understand context, know what's needed | Full context requires reading entire thread |
| Draft reply | Read message | Send reply in < 60 seconds | Writing takes 5–15 minutes |
| Archive noise | See newsletter | Remove from view permanently | One-by-one archiving |
| Extract action | Read email | Add to task list without switching apps | Manual copy-paste |
| Find old email | Can't remember where | Locate email in < 30 seconds | Search fails; wrong account; wrong terms |
| Track follow-up | Send email | Know if reply was received | No native reminder system |
| Connect to workspace | Read project email | Link thread to Notion page | Manual, requires context switch |
| Catch up on thread | Long thread | Know current state without reading all | Must read every message |
| Manage newsletters | Daily digest | Get signal without noise | Unsubscribe one by one |

---

## 5. Reference System Analysis

### 5.1 Notion Mail

**What it gets right:**
- Email as structured knowledge, not just a list of items
- Database-style grouping and filtering (group by sender, date, project)
- Visual calm — no aggressive color coding
- Deep Notion integration as a first-class feature

**What it gets wrong:**
- Feels slow for high-volume triage (too structured for raw speed)
- AI features feel surface-level (summarize button, not ambient intelligence)
- Calendar integration is absent
- Multi-account handling is underdeveloped
- Too Notion-branded — it assumes everyone lives in Notion

**Transferable:** Email as a structured object with filterable properties. Grouping by project, not just by time.

**Do not copy:** The database metaphor taken literally. The assumption that all users are Notion users.

---

### 5.2 Microsoft Outlook

**What it gets right:**
- Calendar/task integration as a first-class feature
- Multi-account management is mature
- Focused Inbox (algorithmic priority) is directionally correct
- Reading pane and thread handling are solid conventions

**What it gets wrong:**
- UI is cluttered — ribbon, sidebar, multiple toolbars
- AI features (Copilot) are visible as distinct mode switches, not ambient
- Feels enterprise, not personal

**Transferable:** Calendar/task panel integration. Per-account folder management as secondary view. Focused Inbox concept.

**Do not copy:** The ribbon. Three competing toolbars. AI as a distinct "Copilot mode."

---

### 5.3 Gmail

**What it gets right:**
- Conventions are so familiar they remove cognitive load (star, archive, reply)
- Categories (Primary, Social, Promotions) handle classification passively
- Keyboard shortcuts are excellent — `e` to archive, `r` to reply, `j/k` to navigate
- Search is industry standard for email
- Labels as flexible tagging system

**What it gets wrong:**
- No multi-account unification — tabs are per-account
- AI (Smart Reply, Smart Compose) feels gimmicky, not trustworthy
- No task extraction or workspace integration

**Transferable:** Keyboard shortcut conventions. Star as quick flag. Archive as primary resolution action. Category-based passive classification.

**Do not copy:** Per-account tab switching. The smart reply UI (pill buttons). The promotional tab graveyard.

---

### 5.4 Superhuman

**What it gets right:**
- Every action has a keyboard shortcut
- Command palette (`⌘K`) is the power user's primary interface
- Triage is the core loop, not reading
- "Inbox Zero" as a defined, achievable state
- Performance is a feature — instant UI, instant search

**What it gets wrong:**
- Expensive and requires onboarding
- Lacks deep workspace integration
- Still fundamentally a Gmail client with a better UI

**Transferable:** Command palette as primary navigation. Speed as a product value. Triage-first inbox. Follow-up reminder (snooze).

**Do not copy:** White-glove onboarding requirement. AI replies as a novelty, not as ambient assistance.

---

### 5.5 Spark Mail

**What it gets right:**
- Smart inbox grouping (People, Notifications, Newsletters) is intuitive
- "Email Like a Human" prioritization actually works for most users
- Quick Reply at the bottom is fast for short responses

**What it gets wrong:**
- Privacy concerns around email stored on Spark's servers
- Smart inbox grouping is not configurable enough
- Collaboration features bloat the UI for solo users

**Transferable:** Grouped inbox sections as a classification model. Quick Reply inline. Pin/snooze as triage actions.

**Do not copy:** Team collaboration as a primary feature. Server-side email storage dependency.

---

### 5.6 Raycast / Linear

**What it gets right:**
- Raycast: Command palette as the entire UI. Search everything, do anything.
- Linear: Issue list is dense, scannable, and action-ready. Status is always visible.
- Both: Keyboard-first without sacrificing discoverability
- Both: Perceived quality is very high — micro-animations, spacing, font choices

**Transferable:** Command palette architecture. List density similar to Linear. Keyboard-first as a design constraint.

**Do not copy:** Issue/project metaphor applied directly to email. Command-only interface.

---

## 6. Transferable Patterns (Synthesis)

| Pattern | Source | Application |
|---|---|---|
| Keyboard shortcuts as primary UX | Gmail + Superhuman | Full shortcut coverage. `⌘K` command palette. |
| Triage-first inbox | Superhuman | Default view is "what needs action today", not chronological |
| Smart grouping by type | Spark | People / Notifications / Newsletters sections, collapsible |
| Command palette | Raycast + Superhuman | `⌘K` opens full action search: find email, apply label, create task, switch account |
| Email as structured object | Notion Mail | Each message has properties: priority, category, linked project, action required |
| Calendar/task integration | Outlook | Action extraction creates task in sidebar. Meetings auto-extract time/attendees. |
| Keyboard shortcut conventions | Gmail | `e` archive, `r` reply, `u` mark unread, `c` compose, `j/k` navigate |
| Speed as design constraint | Superhuman + Linear | Every action ≤ 2 clicks or 1 shortcut. Optimistic updates. |
| Thread summary | Notion Mail | AI inline summary at top of thread |
| Density and scannability | Linear | Compact mail rows. Status visible at glance. |

---

## 7. Patterns to Avoid

| Pattern | Source | Why |
|---|---|---|
| Three competing toolbars | Outlook | Fragments attention |
| AI as a distinct mode | Outlook Copilot | AI should be ambient, not a separate panel |
| Per-account tab switching | Gmail | Defeats unified inbox purpose |
| Smart Reply pill buttons | Gmail | Gimmicky, low trust |
| Server-side email dependency for AI | Spark | Privacy concern |
| Group header rows in list | Spark | Visually heavy, interrupts scan flow |
| Dashboard widget layout | Generic SaaS | This is not an analytics product |
| Aggressive AI surfaces | Any | If AI is wrong, trust is destroyed |
| Irreversible AI actions | Any | Every AI action must be reviewable |

---

## 8. Product Positioning

**Positioning statement:**

Mail Agent is the AI-native mail command center for professionals who manage multiple accounts and want email to become resolved, not just read. Unlike Gmail or Outlook, it unifies all accounts, classifies automatically, drafts intelligently, and connects email to your existing workspace — without requiring you to learn a new system.

**Competitive differentiation:**

| Capability | Gmail | Outlook | Notion Mail | Superhuman | Mail Agent |
|---|---|---|---|---|---|
| Multi-account unified inbox | ✗ | Partial | Partial | Gmail only | ✓ |
| AI priority ranking | Weak | Focused Inbox | Weak | ✓ | ✓ |
| AI reply drafting | Weak | Copilot | ✗ | ✓ | ✓ |
| AI thread summary | ✗ | Partial | Partial | ✗ | ✓ |
| Command palette | ✗ | ✗ | ✗ | ✓ | ✓ |
| Keyboard-first triage | ✓ | ✗ | ✗ | ✓ | ✓ |
| Workspace integration | ✗ | Teams | Notion | ✗ | Notion + extensible |
| Action extraction | ✗ | Tasks | ✗ | ✗ | ✓ |
| Newsletter digest | Categories only | Rules | ✗ | ✗ | ✓ |
| Search quality | ✓ | ✓ | ✗ | Fast | Semantic |

---

## 9. Core Information Architecture

```
Mail Agent
│
├── Command Palette (⌘K) — global, accessible from anywhere
│
├── Sidebar (persistent navigation)
│   ├── Logo / Brand
│   ├── Primary Views
│   │   ├── Inbox (unified, all accounts)
│   │   ├── Priority (AI-ranked, needs action)
│   │   ├── Starred
│   │   ├── Snoozed
│   │   ├── Sent
│   │   ├── Archive
│   │   └── Trash
│   ├── Smart Views (AI-generated groupings)
│   │   ├── Reply Needed
│   │   ├── Awaiting Reply
│   │   ├── Newsletter Digest
│   │   └── Action Required
│   ├── Labels (user-defined)
│   ├── Accounts (per-account views)
│   │   ├── Gmail (work) — status dot
│   │   ├── School Email — status dot
│   │   └── + Add Account
│   └── Settings / Profile
│
├── List Column (main content list — always visible)
│   ├── View Header (current view title + count + Compose)
│   ├── Search Input (real, always focused with ⌘K)
│   ├── Group Headers (optional — People / Notifications / Newsletters)
│   └── Message Rows
│       ├── [Priority indicator] [Sender] [Account badge] [Timestamp]
│       ├── [Subject] [AI category tag if relevant]
│       └── [Snippet] [Attachment icon] [Star] [Action indicator]
│
└── Detail Panel (toggleable right overlay — opens from the list)
    ├── Detail Toolbar (sticky — subject + action bar)
    ├── Thread Header (from/to/date — collapsed by default)
    ├── Thread View (messages in chronological order)
    │   └── Per Message: sender → body → AI summary (inline)
    ├── AI Panel (below thread — summary, priority, suggested actions)
    ├── Attachments (below AI panel)
    ├── Action Extraction (inline — extracted tasks/meetings)
    └── Workspace Link (Notion integration — conditional)
```

---

## 10. Main Navigation Model

### 10.1 Navigation Hierarchy

- **Level 1 — Sidebar navigation:** Switches the active view
- **Level 2 — List column:** Shows messages for the current view
- **Level 3 — Detail panel:** Shows full message + thread + AI context when opened from the list
- **Level 0 — Command palette:** Cross-cuts all levels. Every action reachable here.

### 10.2 Navigation Rules

- There is no "back" in the desktop layout. Navigation is spatial.
- Switching sidebar views resets the list to the top.
- The search bar in the list column is local to the current view. Global search uses the command palette.
- Account switching is NOT a primary navigation action — accounts are a filter applied to any view.

### 10.3 Sidebar Collapse Behavior

| State | Width | Shows |
|---|---|---|
| Expanded | `240px` | Icon + Label + Count badge |
| Collapsed (icon rail) | `52px` | Icon + Count badge (no label) |
| Hidden (mobile) | `0` | Slide-over drawer on hamburger tap |

Auto-collapse at `≤1199px`. User can pin either state.

---

## 11. Multi-Account Inbox Model

### 11.1 Unified vs. Per-Account View

- Default view is unified (all accounts merged, sorted by received time or AI priority).
- Per-account view is accessible via sidebar account section or by filtering in the list column.
- Switching to per-account view changes the view header and filters the list — no layout change.

### 11.2 Account Identity in Mail Rows

Every mail row must communicate which account it belongs to.

```
[●] [Sender Name]                    [Gmail · work]    10:32 AM
    [Subject line]
    [Snippet preview]                              [📎] [★]
```

- `●` = unread indicator (blue, 8px)
- `[Gmail · work]` = account badge: provider icon + account label. Right-aligned, muted.
- Color-coding accounts is an option but not mandatory (user-configurable per account).

### 11.3 Account Status in Sidebar

Each account row in the sidebar shows:
- Status dot: green (connected), blue (syncing), yellow (warning), red (error)
- Last synced timestamp (hover tooltip)
- Unread count badge
- Error state: inline "Reconnect" button replaces count badge

### 11.4 Adding New Accounts

- "Add Account" in sidebar opens a settings sheet (not a new route)
- Supported: Gmail (OAuth), IMAP/SMTP (credentials), Outlook/Exchange (OAuth)
- After connection: initial sync runs in background. Sidebar shows syncing state. No blocking UI.

---

## 12. AI Classification Model

AI classification is the structural backbone of the product. It runs on every incoming message and produces a set of structured properties.

### 12.1 Classification Properties

| Property | Values | Used For |
|---|---|---|
| `priority` | high / medium / low | Priority inbox, row indicator |
| `category` | personal / work / academic / newsletter / receipt / notification / automated | Grouping, filtering, digest |
| `requiresReply` | true / false | Reply Needed smart view |
| `requiresAction` | true / false | Action Required smart view |
| `awaitingReply` | true / false | Awaiting Reply smart view |
| `extractedTasks` | array of strings | Action panel |
| `extractedMeetings` | array (time, attendees) | Calendar integration |
| `summary` | 1–3 sentence string | AI panel |
| `suggestedReply` | draft string (optional) | Reply drafting |
| `suggestedLabel` | string (optional) | Label suggestion |
| `confidence` | 0.0–1.0 | Display cues |

### 12.2 Classification Display Rules

- High confidence → shown directly (priority badge, category tag)
- Low confidence (< 0.7) → shown with a muted indicator, user can override
- `requiresReply: true` → orange dot replaces blue unread dot
- `extractedTasks` present → task icon appears at row level
- AI panel shown when confidence ≥ 0.6; hidden when < 0.4

### 12.3 User Override

Every AI classification is overridable:
- Right-click on row → override classification panel
- In detail view AI panel → each property has an inline edit control
- Overrides stored per message and used to improve future classification

### 12.4 Privacy Model

- Classification runs server-side. Email content processed by AI model.
- User must consent explicitly during onboarding (not buried in ToS).
- Per-account AI opt-out available in settings.
- No email content stored in AI training data by default (opt-in only).
- AI panel clearly labels outputs as AI-generated.

---

## 13. Email Thread Reading Experience

### 13.1 Thread Layout

```
┌─ Detail Toolbar (sticky, 48px) ────────────────────────────────────┐
│  [Thread subject, truncated]  [Reply ▾] [Archive] [Snooze] [···]  │
└────────────────────────────────────────────────────────────────────┘

┌─ Thread Meta (32px, collapsed) ────────────────────────────────────┐
│  3 messages · John Smith, Sarah Lee, you · Jul 2 – Jul 3           │
└────────────────────────────────────────────────────────────────────┘

┌─ AI Thread Summary (appears if thread ≥ 2 messages) ───────────────┐
│  ✦ Team agreed on Q3 deadline. Action needed: confirm by Friday.   │
└────────────────────────────────────────────────────────────────────┘

┌─ Message 1 (oldest — collapsed if read) ───────────────────────────┐
│  John Smith · Jul 2 · [Expand ▾]                                   │
└────────────────────────────────────────────────────────────────────┘

┌─ Message 2 (collapsed) ────────────────────────────────────────────┐
│  Sarah Lee · Jul 3 · [Expand ▾]                                    │
└────────────────────────────────────────────────────────────────────┘

┌─ Message 3 (latest — expanded by default) ─────────────────────────┐
│  [Sender] [Account badge] [Timestamp]                               │
│  ─────────────────────────────────────────────                     │
│  [Full message body — HTML or plaintext]                            │
│  [Attachments section — if present]                                 │
└────────────────────────────────────────────────────────────────────┘
```

### 13.2 Thread Display Rules

- Latest message is always expanded. Previous messages are collapsed.
- Clicking a collapsed message expands it inline (no navigation).
- Thread has "Show all X messages" if thread > 5 messages.
- HTML email rendered in a sandboxed iframe with external images blocked by default. "Load images" available.
- Quote chains collapsed with a "Show quoted text" toggle.

### 13.3 Read State

- Message marked read automatically after 2 seconds of visibility (configurable).
- Manual override: "Mark Unread" in `···` overflow or `u` shortcut.

---

## 14. Email Triage Experience

### 14.1 Triage Flow (Keyboard)

```
Open app → Priority inbox loads
  ↓
j / k — navigate messages
  ↓
Space — expand detail / read
  ↓
r — reply (AI draft pre-filled)
  OR
e — archive
  OR
h — snooze (→ Later today / Tomorrow / Next week)
  OR
s — star
  OR
t — create task
  ↓
Auto-advances to next message
```

### 14.2 Bulk Triage

- Select multiple messages: `Shift + j/k` or checkbox click
- Bulk actions: Archive all, Mark read all, Move label, Create digest summary
- Bulk action bar appears above mail list when ≥ 2 selected
- No destructive bulk action (Delete) without confirmation

### 14.3 Snooze / Defer

- Snoozed messages disappear from inbox until selected time
- Options: Later today (4pm), Tomorrow (9am), Next week, Custom
- Snoozed messages appear in "Snoozed" smart view
- Row shows snooze date instead of received date when approaching

### 14.4 Priority Inbox Logic

Shows messages where: `priority === 'high'` OR `requiresReply === true` OR `requiresAction === true`

Sorted by AI-determined urgency, not by time alone.

---

## 15. AI Reply Drafting Experience

### 15.1 Design Principles

- The draft is a starting point, never a finished product.
- The user is always in control of the final text.
- AI-generated text must be visually marked as AI-generated before editing.
- The user can delete the AI draft and write from scratch in one action.
- Tone controls: Shorter / Longer / More formal / More casual.

### 15.2 Reply Flow

```
User presses 'r' (or clicks Reply button)
  ↓
Reply area opens inline below message body
  ↓
If AI draft available:
  → Shows draft text in compose field
  → Top of field: [✦ AI draft · Edit freely · Regenerate · Discard]
  → Draft text is editable immediately (not read-only)
  ↓
If AI draft not available or rejected:
  → Empty compose field
  → [✦ Generate draft] button visible in compose toolbar
  ↓
Send: ⌘↵
Discard: Esc (with confirmation if text was edited)
```

### 15.3 AI Draft Display

```
┌─ Reply ────────────────────────────────────────────────────────────┐
│  To: john.smith@company.com                   From: Gmail (work)  │
│  ─────────────────────────────────────────────────────────────── │
│  ✦ AI draft  [Shorter] [Formal] [Regenerate] [Discard]            │
│                                                                    │
│  Hi John,                                                         │
│                                                                    │
│  Thanks for the update — confirmed for Friday.                    │
│                                                                    │
│  Best,                                                             │
│  [Your name]                                                      │
│                                                                    │
│  ─────────────────────────────────────────────────────────────── │
│                             [Discard] [Send  ⌘↵]                 │
└────────────────────────────────────────────────────────────────────┘
```

### 15.4 AI Draft: Full Feature Specification

| Attribute | Specification |
|---|---|
| Problem solved | Reply latency; blank-page anxiety |
| Input | Full message thread (last N messages, configurable) |
| Output | Plain text draft, pre-filled in compose field |
| User control | Freely editable, rejectable, regeneratable |
| Failure case | Draft not generated → empty field + "Generate draft" button |
| Privacy | Thread content sent to AI provider; user consented at onboarding |
| UI placement | Inline in reply area, below compose field top bar |
| MVP? | No — Phase 4 |

---

## 16. Search and Command Palette Design

### 16.1 Search

**Local search** (list column search bar):
- Searches within the current view
- Filters by: sender, subject, body keyword, label, account, date range
- Instant filtering with debounce (200ms)

**Global search** (command palette `⌘K`):
- Searches across all accounts and all views
- Ranked by relevance (semantic) + recency
- Supports operators: `from:`, `to:`, `subject:`, `has:attachment`, `after:`, `before:`, `account:`

**Semantic search:**
- Query "meeting about Q3 budget" finds emails semantically related even without exact keyword match
- Visual indicator: search result shows matched reason

### 16.2 Command Palette (`⌘K`)

```
┌─ ⌘K ───────────────────────────────────────────────────────────────┐
│  🔍  Type a command or search...                                   │
│  ──────────────────────────────────────────────────────────────── │
│  Recent actions:                                                   │
│  ▸ Archive last message                                            │
│  ▸ Reply to John Smith                                             │
│  Suggested:                                                        │
│  ▸ Go to Priority Inbox                                            │
│  ▸ Compose new                                                     │
└────────────────────────────────────────────────────────────────────┘
```

**Command categories:**

| Category | Examples |
|---|---|
| Navigation | "Go to Inbox", "Go to Starred", "Switch to Gmail account" |
| Message actions | "Archive", "Reply", "Forward", "Mark unread", "Snooze", "Delete" |
| Compose | "Compose new", "Compose to [contact]" |
| Search | "Search for...", "Find emails from..." |
| AI actions | "Summarize this thread", "Generate reply", "Extract tasks" |
| Labels | "Apply label [name]", "Create new label" |
| Workspace | "Link to Notion", "Create task from this email" |
| Settings | "Open settings", "Add account", "Manage labels" |

**Keyboard behavior:** `⌘K` open → type to filter → `↑/↓` navigate → `Enter` execute → `Esc` close

---

## 17. Labels, Folders, Categories, and Smart Views

### 17.1 Organizational Model

Mail Agent uses a flat label system (like Gmail), not a folder hierarchy (like Outlook).

**System labels (auto-managed):** `INBOX`, `SENT`, `ARCHIVE`, `TRASH`, `SPAM`, `STARRED`, `SNOOZED`
Not shown as labels — expressed through sidebar views.

**AI-assigned categories (automatic):** `work`, `personal`, `academic`, `newsletter`, `receipt`, `notification`, `automated`

**User-defined labels:** Created via command palette or `···` overflow menu. Displayed in sidebar.

### 17.2 Smart Views

| Smart View | Logic |
|---|---|
| Priority | `priority = high` OR `requiresReply = true` OR `requiresAction = true` |
| Reply Needed | `requiresReply = true` AND `isRead = true` AND not in Sent |
| Awaiting Reply | `awaitingReply = true` (AI detected you sent, no response yet) |
| Newsletter Digest | `category = newsletter`, grouped by sender, consolidated |
| Action Required | `requiresAction = true`, with extracted tasks visible |
| Receipts | `category = receipt`, sorted by date |

### 17.3 Grouping Mode

Within any view, group by: Date (default) / Account / Category / Priority / No grouping

Group headers are minimal — `12px` muted label, no card border. List flows continuously beneath them.

---

## 18. Notion-like Workspace Integration

### 18.1 Integration Model

Optional and progressive — does not require Notion to use Mail Agent.

**Connection:** OAuth-based Notion connection in Settings. User selects which workspace to connect.

**What the integration enables:**
1. Link any email thread to a Notion page (database item)
2. Push extracted action items as Notion tasks
3. View linked Notion context in the detail column
4. Enrich AI summaries with Notion page context (bi-directional)

### 18.2 Thread → Notion Link

```
┌─ Workspace ────────────────────────────────────────────────────────┐
│  Link to Notion page                                               │
│  [Search Notion pages...]                                          │
│  ─────────────────────────────────────────────────                │
│  ✓ Project Alpha — Task Database              [Open ↗] [Unlink]   │
│  ─────────────────────────────────────────────────                │
│  + Create new Notion page from this email                         │
└────────────────────────────────────────────────────────────────────┘
```

When linked: Thread summary pushed to Notion page. Linked thread visible in mail row as small `N` indicator.

### 18.3 Email → Task Push

```
┌─ AI Analysis ──────────────────────────────────────────────────────┐
│  ✦ Summary: Team confirmed Q3 deadline. Budget approved.           │
│                                                                    │
│  Action Items:                                                     │
│  ☐ Confirm final headcount by Friday                [+ Task]      │
│  ☐ Share updated budget spreadsheet                 [+ Task]      │
│                                                                    │
│  [+ Add all to Notion]        [Dismiss]                           │
└────────────────────────────────────────────────────────────────────┘
```

---

## 19. Calendar / Task / Action Extraction Flow

### 19.1 Meeting Detection

AI extracts: Date/time, Attendees, Location or video link, Meeting title.

```
┌─ Meeting Detected ─────────────────────────────────────────────────┐
│  📅 Q3 Planning Call                                               │
│  Friday, July 10 · 2:00 PM – 3:00 PM                             │
│  John Smith, Sarah Lee, You                                       │
│  meet.google.com/abc-def-ghi                                      │
│  ─────────────────────────────────────────────────                │
│  [Add to Calendar]    [Join Link]    [Dismiss]                    │
└────────────────────────────────────────────────────────────────────┘
```

### 19.2 Action Item Extraction

Each action item: checkbox (mark complete inline) + `[+ Task]` button + editable + dismissible.

### 19.3 Follow-up Reminder

When user sends email and no reply received within user-configurable time (default: 3 days), thread resurfaces in "Awaiting Reply" smart view with "No reply yet — follow up?" banner.

---

## 20. Notification and Priority Strategy

### 20.1 Notification Philosophy

Notifications are the enemy of focus. **Default: notify only for Priority messages.**

- Push notification: Only `priority === 'high'` AND `requiresReply === true`
- Badge count: Unread count in Priority view only (not total inbox count)
- Sound: Off by default
- Notification content: Sender + subject only (no body preview — privacy)

User configurable: Per-account notification settings. Can expand to "all unread."

### 20.2 In-App Priority Surfacing

- Priority inbox is the default landing view on app open
- Messages with `priority === 'high'` have left border accent (orange, 2px)
- `requiresReply` indicator: reply icon in row right-side (orange)

### 20.3 Daily Briefing (Post-MVP)

A brief AI summary of the inbox at a user-configured time:
- Top 3 priority messages
- Number of newsletters received (consolidated)
- Number of action items pending

---

## 21. Screen-by-Screen UX Proposal

### 21.1 Priority Inbox (Default Landing)

```
┌─ Sidebar ──┬─ List Column ────────────────────────┬─ Detail Column ───────┐
│ ● Inbox    │ Priority           [7]  [Compose ✎]  │ [No message selected] │
│   Priority │ ────────────────────────────────────  │                        │
│   Starred  │ 🔍 Search messages...       [⌘K]      │  Select a message      │
│   Snoozed  │ ────────────────────────────────────  │  or press j/k to       │
│   Sent     │ Today                                │  navigate              │
│   Archive  │                                      │                        │
│   Trash    │ [●][★] John Smith · Gmail   10:32am  │  ↑↓ to navigate        │
│ ──────── │ Re: Q3 Planning deadline             │  r to reply            │
│ Views:     │ Can we confirm the headcount...      │  e to archive          │
│ · Priority │                                      │                        │
│ · Reply ⚡ │ [●][!] Prof. Kim  · School  09:14am  │                        │
│ · Waiting  │ Assignment submission deadline       │                        │
│ · Digest   │ Please confirm your submission b..   │                        │
│ ──────── │                                      │                        │
│ Accounts:  │ Earlier                              │                        │
│ ● Gmail    │                                      │                        │
│ ● School   │ [✉] Newsletter · Gmail  Yesterday    │                        │
│ ⚠ IMAP    │ [Digest: 4 newsletters] [Expand]     │                        │
│            │                                      │                        │
│ [Settings] │                                      │                        │
└────────────┴──────────────────────────────────────┴────────────────────────┘
```

---

### 21.2 Thread Detail View

```
┌─ Sidebar ──┬─ List Column ────────────────────────┬─ Detail Column ──────────────────────┐
│ [same]     │ [list with one row selected]         │ Re: Q3 Planning deadline              │
│            │                                      │ ──────────────────────────────────── │
│            │ ★ John Smith · Gmail    10:32am      │ [Reply ▾] [Archive] [Snooze] [···]   │
│            │ [selected, highlighted]              │ ──────────────────────────────────── │
│            │                                      │ 3 messages · John, Sarah, you         │
│            │                                      │                                        │
│            │                                      │ ✦ Team aligned on Q3 deadline.        │
│            │                                      │   You need to confirm headcount.      │
│            │                                      │                                        │
│            │                                      │ John Smith · Jul 1 [Collapse ▴]       │
│            │                                      │ [message body]                        │
│            │                                      │                                        │
│            │                                      │ Sarah Lee · Jul 2 [Expand ▾]          │
│            │                                      │                                        │
│            │                                      │ John Smith · Jul 3 [Expand ▾]         │
│            │                                      │                                        │
│            │                                      │ Action Items:                         │
│            │                                      │ ☐ Confirm headcount     [+ Task]      │
│            │                                      │ ☐ Reply by Friday       [+ Task]      │
│            │                                      │                                        │
│            │                                      │ Workspace:                            │
│            │                                      │ ✓ Linked: Q3 Planning [Open ↗]       │
└────────────┴──────────────────────────────────────┴────────────────────────────────────────┘
```

---

### 21.3 Inline Reply / Compose

```
(Below thread body in Detail Column)

┌─ Reply to John Smith ──────────────────────────────────────────────┐
│  To: john.smith@company.com              From: Gmail (work) ▾     │
│  ────────────────────────────────────────────────────────────────  │
│  ✦ AI draft  [Shorter] [More formal] [Regenerate] [Discard]       │
│                                                                    │
│  Hi John,                                                         │
│                                                                    │
│  Confirmed — headcount is 12. Full breakdown by Thursday.         │
│                                                                    │
│  Best,                                                            │
│  [Name]                                                           │
│                                                                    │
│  ────────────────────────────────────────────────────────────────  │
│  [📎 Attach] [Formatting ▾]                [Discard] [Send ⌘↵]   │
└────────────────────────────────────────────────────────────────────┘
```

Mail list column remains fully visible and scrollable while composing.

---

### 21.4 Command Palette

```
           ┌─ ⌘K ────────────────────────────────────────────────────┐
           │  🔍  Find email, run command, or search...             │
           │  ────────────────────────────────────────────────────── │
           │  RECENT                                                 │
           │  ↩ Archive thread — Q3 Planning                        │
           │  ↩ Reply to Prof. Kim                                   │
           │  ────────────────────────────────────────────────────── │
           │  ACTIONS                                                │
           │  ✎  Compose new email                            C      │
           │  ↩  Reply                                        R      │
           │  ▣  Archive                                      E      │
           │  🕐  Snooze                                       H      │
           │  ★  Star / Unstar                                S      │
           │  ────────────────────────────────────────────────────── │
           │  NAVIGATION                                             │
           │  ▸  Go to Priority Inbox                               │
           │  ▸  Switch to Gmail account                            │
           └─────────────────────────────────────────────────────────┘
```

---

### 21.5 Settings (Slide-over Sheet)

Opens as a slide-over sheet from the right. Inbox remains visible.

**Sections:** Accounts · AI Preferences · Notifications · Labels · Keyboard Shortcuts · Workspace Integration · Privacy

---

### 21.6 Newsletter Digest View

```
┌─ List Column ──────────────────────────────┐
│ Newsletter Digest          [Mark all read] │
│ ──────────────────────────────────────────│
│ 🔍 Search newsletters...                  │
│                                            │
│ Morning Brew              5 unread        │
│ [Latest: AI news roundup] [Unsubscribe?]  │
│                                            │
│ HackerNews Digest         3 unread        │
│ [Latest: Show HN: ...]    [Unsubscribe?]  │
│                                            │
│ ProductHunt Daily         2 unread        │
│ [Latest: Top products...] [Unsubscribe?]  │
└────────────────────────────────────────────┘
```

---

### 21.7 Account Error State

```
┌─ Accounts ─────────────────────────────────┐
│ ● Gmail (work)          89 unread          │
│ ⚠ IMAP (personal)       Error              │
│   ──────────────────────────────────────  │
│   Last synced: 2 days ago                 │
│   Error: Authentication expired           │
│   [Reconnect account]                     │
│   [Dismiss warning]                       │
└────────────────────────────────────────────┘
```

---

### 21.8 Empty Inbox State

```
┌─ Detail Column ──────────────────────────────────────────────────┐
│                                                                    │
│                       ✓ Inbox Zero                               │
│                                                                    │
│             All messages are handled. Nice work.                 │
│                                                                    │
│             [Check all mail]    [View snoozed]                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 22. Component System Proposal

### 22.1 Core Layout Components

| Component | Description | Variants |
|---|---|---|
| `<AppShell>` | Outermost grid container | — |
| `<AppSidebar>` | Persistent left navigation | expanded, collapsed (icon-rail), mobile (drawer) |
| `<ListColumn>` | Middle list panel with header, search, and list | — |
| `<DetailColumn>` | Right detail panel — toggleable overlay on desktop, full-screen on small screens | idle, loading, ready, error |
| `<CommandPalette>` | Fullscreen overlay, `⌘K` triggered | open, closed |
| `<SettingsSheet>` | Slide-over settings panel | open, closed |

### 22.2 Navigation Components

| Component | Description |
|---|---|
| `<NavItem>` | Sidebar nav row: icon + label + count badge |
| `<AccountRow>` | Per-account row: status dot + name + count. States: connected, syncing, error |
| `<SmartViewItem>` | Smart view nav item. Inherits NavItem. |
| `<LabelItem>` | User label nav item. Color dot + name. |

### 22.3 List Components

| Component | Description |
|---|---|
| `<MailList>` | Scrollable list container. Handles grouping logic. |
| `<GroupHeader>` | Section divider for grouped lists |
| `<MailRow>` | Individual message row. Variants: default, unread, selected, priority, skeleton. |
| `<DigestRow>` | Collapsed newsletter digest row with count. |
| `<BulkActionBar>` | Appears above list when ≥2 messages selected. |
| `<FilterBar>` | Single-row filter UI below search. Active filters as chips. |
| `<SearchInput>` | Real `<input>` with icon, shortcut indicator, clear button. |

### 22.4 Detail Components

| Component | Description |
|---|---|
| `<DetailToolbar>` | Sticky top bar: subject + Reply + Archive + Snooze + overflow |
| `<ThreadMetaBar>` | Collapsed participants/date bar. Expandable. |
| `<AISummaryBanner>` | Thread summary from AI. Loading → content. Dismissible. |
| `<ThreadMessage>` | Individual message in thread. Variants: expanded, collapsed. |
| `<MessageBody>` | HTML or plaintext renderer. Sandboxed. Load-images toggle. |
| `<AttachmentList>` | Attachment cards below body. |
| `<AIPanelSection>` | AI analysis: summary + action items + suggested labels. |
| `<ActionItem>` | Extracted task with checkbox + push-to-workspace button. |
| `<WorkspacePanel>` | Notion link panel. States: not-linked, linked, loading, error. |
| `<MeetingCard>` | Extracted meeting card with Add to Calendar. |
| `<ReplyComposer>` | Inline reply/compose area. AI draft pre-fill. Tone controls. |

### 22.5 Shared / Primitive Components

| Component | Description |
|---|---|
| `<Button>` | Variants: primary, secondary, ghost, danger, icon |
| `<Badge>` | Count badge (sidebar). Variants: neutral, priority (orange). |
| `<Chip>` | Filter chip / label chip. States: active, inactive. Optionally dismissible. |
| `<StatusDot>` | 8px circle. Variants: unread (blue), priority (orange), connected (green), syncing (pulse), error (red). |
| `<AccountBadge>` | Account identifier in mail row. Provider icon + label. |
| `<InlineAlert>` | Warning / success banner inline. Not a toast. |
| `<Toast>` | Action feedback (3s auto-dismiss). Variants: success, error. |
| `<Skeleton>` | Shimmer skeleton. Variants: row, subject, body, meta. |
| `<EmptyState>` | Centered: icon + heading + body + CTA buttons. |
| `<KbdShortcut>` | Keyboard shortcut display: `⌘K`. Monospace, bordered. |

---

## 23. Visual Design Direction

### 23.1 Core Aesthetic

**Calm, intelligent, fast.** If Linear is the benchmark for a task tool, Mail Agent should be to email what Linear is to issues. Dense, purposeful, polished without being decorative.

### 23.2 Color System

```css
/* Surfaces */
--surface-app:        #F4F6F9;
--surface-panel:      #FFFFFF;
--surface-recessed:   #F0F3F7;
--surface-overlay:    rgba(23, 33, 43, 0.36);

/* Text */
--text-primary:       #1A2433;
--text-secondary:     #4A5568;
--text-muted:         #718096;
--text-placeholder:   #A0AEC0;

/* Blue — primary actions, active state, links */
--accent-blue:        #1D7AFC;
--accent-blue-hover:  #1567D8;
--accent-blue-tint:   rgba(29, 122, 252, 0.08);

/* Orange — priority, reply-needed, snooze */
--accent-orange:      #D97706;
--accent-orange-tint: rgba(217, 119, 6, 0.08);

/* Semantic */
--success:            #059669;
--success-tint:       rgba(5, 150, 105, 0.08);
--warning:            #D97706;
--danger:             #DC2626;
--danger-tint:        rgba(220, 38, 38, 0.08);

/* Borders */
--border-default:     #E2E8F0;
--border-strong:      #CBD5E1;
--border-focus:       #1D7AFC;

/* AI indicator — restrained purple */
--ai-accent:          #7C3AED;
--ai-tint:            rgba(124, 58, 237, 0.06);
```

**AI indicator color note:** Purple (`#7C3AED`) is used *only* for AI-generated content markers (`✦` symbol, AI summary border, draft indicator). Never used as a background fill or primary accent.

### 23.3 Typography

**Fonts:** UI: `Geist` (current) · Mono: `JetBrains Mono` or `IBM Plex Mono`

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `text-2xl` | 22px | 650 | 30px | Thread subject in detail toolbar |
| `text-xl` | 18px | 600 | 26px | Panel section headings |
| `text-lg` | 16px | 600 | 24px | Column view title |
| `text-base` | 14px | 400/600 | 20px | Mail row primary text |
| `text-sm` | 13px | 400 | 18px | Snippet, body support |
| `text-xs` | 12px | 400–600 | 16px | Timestamps, labels, meta |
| `text-2xs` | 11px | 500 | 14px | Keyboard shortcuts only |

**Mail row hierarchy:**
- Sender: `14px / 600` (unread) or `14px / 500` (read) — `text-primary`
- Subject: `14px / 600` (unread) or `14px / 400` (read) — `text-primary` / `text-secondary`
- Snippet: `13px / 400 / text-muted`
- Timestamp: `12px / 400 / text-muted / mono`

### 23.4 Spacing

Scale: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 48px`

| Context | Value |
|---|---|
| Inside compact component (chip, badge) | 4–8px |
| Mail row internal padding | `11px 12px` vertical, `12px 14px` horizontal |
| Panel internal padding | `16px` or `20px` |
| Between distinct sections within panel | `24px` |
| Column header height | `48px` |
| Sidebar nav item height | `36px` |

### 23.5 Radius

| Component | Radius |
|---|---|
| App shell panels (outer) | `16px` |
| Cards, meta grids, AI panels | `10px` |
| Buttons (default) | `8px` |
| Inputs | `8px` |
| Chips, badges, status pills | `999px` |
| Status dots | `50%` |

### 23.6 Elevation

No decorative shadows. Separation through border and surface contrast.

| Level | Use | Value |
|---|---|---|
| 0 | All persistent panels | Border only, no shadow |
| 1 | Focused input, dropdown | `0 2px 8px rgba(15,23,42,0.05)` |
| 2 | Composer sheet, floating toolbar | `0 8px 24px rgba(15,23,42,0.08)` |
| 3 | Command palette overlay | `0 24px 48px rgba(15,23,42,0.16)` |

---

## 24. Interaction States

### 24.1 Mail Row States

| State | Background | Left border | Text weights |
|---|---|---|---|
| Default (read) | `transparent` | None | Normal |
| Unread | `--accent-blue-tint` | None | Sender + subject `600` |
| Priority (unread) | `--accent-orange-tint` | `2px --accent-orange` | `600` |
| Hover | `--surface-recessed` | None | — |
| Selected | `--accent-blue-tint` | `2px --accent-blue` | — |
| Selected + Unread | `rgba(29,122,252,0.12)` | `2px --accent-blue` | Bold |
| Skeleton | shimmer gradient | — | — |

### 24.2 Action Button States

| State | Visual |
|---|---|
| Hover | `8%` darkened bg or border |
| Active (pressed) | `12%` darkened, scale `0.98` |
| Loading | Text replaced by `...` + spinner |
| Disabled | `opacity: 0.45`, `cursor: not-allowed` |
| Success | Brief: border-color → `--success`, returns in 2s |
| Error | Border-color → `--danger` |

### 24.3 Transition Specs

| Interaction | Duration | Easing |
|---|---|---|
| Row hover/select | `140ms` | `ease` |
| Detail content fade | `120ms` | `ease-out` |
| Sidebar collapse | `180ms` | `ease-in-out` |
| Command palette open | `150ms` | `ease-out` |
| Command palette close | `100ms` | `ease-in` |
| Composer open (inline) | `160ms` | `ease-out` |
| Toast enter/exit | `160ms` | `ease` |
| Skeleton → content | `120ms` | `ease-out` |

---

## 25. Empty / Loading / Error States

### 25.1 Loading States

| Component | Loading Treatment |
|---|---|
| Mail list (initial) | 6 skeleton rows: dot + badge + sender + time + subject + snippet |
| Detail column (loading) | Skeleton: title 65%, meta bar 45%, body 4 lines, AI panel 2 lines |
| AI panel (loading) | Pulsing shimmer ("Analyzing message...") |
| Account sync | Status dot pulses in sidebar |
| Command palette search | Spinner for API-backed results |

### 25.2 Empty States

| Screen | Content |
|---|---|
| Priority inbox — no priority mail | "You're all caught up." + [Check All Inbox] |
| All inbox — no mail | "Your inbox is empty." + [Add Account] |
| Filtered inbox — no results | "No messages match these filters." + [Clear filters] |
| Search — no results | "No results for '[query]'. Try a broader term." |
| Detail column — no selection | "Select a message to read it" + keyboard hint |
| Snoozed — nothing snoozed | "Nothing snoozed. Use H to snooze a message for later." |

### 25.3 Error States

| Error Scenario | Treatment |
|---|---|
| Inbox fetch failed | In-list banner: "Couldn't load inbox. [Retry]" |
| Detail fetch failed | In-detail: "Couldn't load this message. [Retry]" |
| AI draft failed | Empty field + "Generate draft" button — no error shown |
| AI summary failed | AI panel section hidden silently |
| Account sync error | `⚠` in sidebar + inline reconnect action |
| Action failed | Toast: "Action failed. [Retry]" + optimistic update reverted |
| Send failed | Inline error in compose area + [Retry send] |
| Notion link failed | Workspace panel: "Couldn't connect to Notion. [Retry]" |

---

## 26. Privacy and Trust UX Considerations

### 26.1 AI Transparency

Every AI-generated output must be visually marked:
- `✦` symbol preceding any AI-generated text
- Tooltip on `✦`: "Generated by AI · [Edit] [Dismiss]"
- AI panel header: "AI Analysis · review before acting"

### 26.2 Data Processing Consent

- Explicit consent during onboarding: "To analyze your emails, Mail Agent sends message content to [AI provider]." with opt-out option.
- Per-account opt-out in Settings → Account → "AI features: On / Off"
- If AI disabled: no AI panel, no AI draft, all other features work.

### 26.3 Action Reversibility

Every AI action must be reversible:
- Archive: "Undo" toast (5 seconds), then permanent
- Apply label: Removable inline
- Create task: Shows created tasks with delete option
- Notion link: Unlinkable from workspace panel
- Delete: Moves to Trash (not permanent delete)

**No AI action executes automatically without user trigger.**

### 26.4 Trust Signals

- Confidence indicator for AI classifications (subdued text hint)
- Low-confidence: `?` indicator and override option
- AI errors are silent — incorrect high-confidence outputs are the real trust risk
- Override is remembered and applied to similar future messages

---

## 27. MVP Scope

The MVP delivers the core triage-and-reply workflow. No AI classification in MVP — structure first, AI second.

### 27.1 MVP Feature Set

**Must have:**
- [x] 2-column base layout with toggleable right detail panel
- [x] Unified inbox from connected accounts (Gmail + IMAP)
- [x] Mail row: sender, subject, snippet, timestamp, unread state, account badge
- [x] Detail view: thread subject, from/to, message body (HTML + text), attachments list
- [x] Actions: Reply, Reply All, Forward (inline composer), Archive, Mark Read/Unread, Delete
- [x] Composer: reply overlay anchored in the detail panel, new compose as bottom sheet in detail column
- [x] Search: local search within current view (client-side filter)
- [x] Account sync status in sidebar
- [x] Filter bar: account filter + unread toggle + attachments toggle
- [x] Empty, loading, and error states for all list and detail states
- [ ] Keyboard shortcuts: `e`, `r`, `u`, `s`, `j`, `k`, `c`, `Esc`, `⌘K` (basic commands)
- [x] Command palette: basic navigation + actions (no full search yet)

**Out of MVP:**
- AI classification, summarization, reply drafting
- Smart views (Priority, Reply Needed, etc.)
- Newsletter digest
- Notion integration
- Calendar/task extraction
- Snooze/defer
- Semantic search
- Bulk actions
- Notifications system
- Mobile responsive layout

### 27.2 MVP Success Metrics

- User triages 10 emails in under 2 minutes using only keyboard shortcuts
- Zero layout shift when selecting/deselecting messages
- Reply sends successfully within 3 clicks or 1 keyboard flow
- Account sync error is visible and actionable within 5 seconds of app open
- Loading state visible within 200ms of navigation action

---

## 28. Post-MVP Features

Ordered by expected user impact:

| Phase | Feature | Impact |
|---|---|---|
| P1 | AI thread summary | Very high |
| P1 | AI reply drafting | Very high |
| P1 | Priority inbox (AI ranking) | High |
| P1 | Keyboard shortcut system (full) | High |
| P2 | Command palette (full search) | High |
| P2 | Snooze / defer | High |
| P2 | Bulk triage actions | Medium |
| P2 | Newsletter digest view | Medium |
| P3 | Smart views (Reply Needed, Awaiting) | Medium |
| P3 | Notion workspace integration | Medium |
| P3 | Action item extraction | Medium |
| P3 | AI label suggestions | Low |
| P4 | Calendar integration (meeting extraction) | Medium |
| P4 | Daily briefing | Low |
| P4 | Mobile-responsive layout | Medium |
| P4 | Semantic search | High |
| P5 | Receipt/order extraction | Low |
| P5 | Custom AI model selection | Low |

---

## 29. Implementation Phases

### Phase 1 — Shell and Structure (Week 1–2)

**Goal:** Ship the correct layout. Eliminate all layout shift. Componentize.

1. Extract `page.tsx` into: `<AppShell>`, `<AppSidebar>`, `<ListColumn>`, `<DetailColumn>`
2. Remove `top-notice` banner, `toolbar__title`, `status-banner`
3. Finalize 2-column workspace + toggleable detail overlay behavior
4. Add idle/placeholder state to `<DetailColumn>`
5. Redesign `<MailRow>`: sender weight, subject weight, remove footer chips
6. Merge `filter-rail` + `filterbar` → single `<FilterBar>` component
7. Add `<SearchInput>` as a real functional `<input>`
8. Move CSS to CSS Modules per component

### Phase 2 — Detail and Actions (Week 2–3)

**Goal:** Correct action hierarchy in detail. Correct thread display.

1. Redesign `<DetailToolbar>`: Reply (primary), Archive (secondary), `···` overflow menu
2. Implement overflow menu: Mark Unread, Delete (danger), Apply Label, Forward
3. Collapse sender meta bar; expand on click
4. Thread view: last message expanded, others collapsed
5. Reply composer as a right-bottom overlay inside the detail panel
6. Bottom-sheet compose for new messages
7. Keyboard shortcuts: `e`, `r`, `u`, `s`, `j`, `k`, `c`, `Esc`
8. Success/error inline toast system

### Phase 3 — Navigation and Polish (Week 3–4)

**Goal:** Sidebar complete. Command palette basic. All states complete.

1. Sidebar redesign: icon + label + count. Smart views as nav items.
2. Account rows: status dot, sync state, error state + inline reconnect
3. Command palette (`⌘K`): basic navigation + message actions
4. Skeleton states for all loading scenarios
5. Empty states for all list conditions
6. Error recovery flows (inline retry)
7. `prefers-reduced-motion` support
8. WCAG AA contrast fixes

### Phase 4 — AI Features (Week 4–6)

**Goal:** AI classification and drafting integrated.

1. AI panel component: summary, action items, priority indicator
2. AI reply draft: pre-fill composer, tone controls
3. Priority inbox view: AI-ranked list
4. Smart views: Reply Needed, Awaiting Reply
5. AI classification visible in mail rows: priority indicator, category tag
6. Override controls

### Phase 5 — Workspace and Power Features (Week 6–8)

**Goal:** Notion integration, snooze, bulk actions, semantic search.

1. Notion connection (OAuth + database picker)
2. Thread → Notion link panel
3. Action item → Notion task push
4. Snooze: time picker, snoozed view, auto-resurface
5. Bulk selection + bulk action bar
6. Newsletter digest view
7. Semantic search (command palette global search)
8. Meeting card extraction

---

## 30. Risks and Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI draft quality is poor → users lose trust | Medium | Very High | Show as suggestion, never force. Allow reject + write-from-scratch instantly. |
| Wide inbox plus detail overlay feels cramped at 1280px | High | Medium | Sidebar auto-collapses to icon rail at ≤1440px. Detail remains toggleable instead of always occupying space. |
| Inline reply composer is unfamiliar | Medium | Low | Subtle expand animation. Keyboard hint visible. Modal option via expand icon. |
| Command palette discoverability is low | High | Medium | Visible `⌘K` shortcut in search bar. Button in sidebar footer. |
| Multi-account sync latency makes unified inbox feel inconsistent | Medium | High | Per-account sync status visible. Optimistic UI for local changes. |
| Notion integration scope creep | High | Medium | Ship Notion as Phase 5. Define strict scope: link + push only. |
| AI classification errors damage user trust | Medium | Very High | Low-confidence = hidden or muted. User override always available. |
| Privacy concerns around email content sent to AI | High | Very High | Explicit consent. Per-account opt-out. Clear documentation. |
| Korean/English mixed UI copy in current codebase | Low | Medium | Standardize on English. Use i18n library if Korean UI is needed. |

---

## 31. Final Design Checklist

### Architecture
- [x] Monolithic `page.tsx` extracted into component tree
- [x] 2-column base layout with toggleable right detail overlay
- [x] No layout shift on message select / deselect
- [x] Command palette accessible from any context (`⌘K`)
- [x] Settings as slide-over sheet (not a new page)

### Sidebar
- [x] Icon + label + count badge for all nav items
- [x] Account rows with status dots (connected / syncing / error)
- [x] Inline error + reconnect action for account errors
- [x] Collapses to icon rail at ≤1440px
- [x] Smart views listed as navigable items (not static chips)

### Mail List
- [x] Column header: view title + count + Compose button
- [x] Real `<input>` search (not a div)
- [x] Single `<FilterBar>` row (no filter-rail, no status-banner)
- [x] Mail rows: sender (weight varies), subject (weight varies), snippet, timestamp, account badge
- [x] Unread: blue tint bg + bold sender/subject + dot
- [x] Priority: orange tint bg + orange left border
- [x] Selected: blue tint bg + blue left border
- [x] No footer chip section in rows

### Detail Column
- [x] Toggleable detail panel with closed-by-default inbox focus
- [x] Sticky detail toolbar: subject + Reply (primary) + Archive (secondary) + Snooze + `···`
- [x] `···` overflow: Mark Unread, Delete (danger), Apply Label, Forward
- [x] Collapsed thread meta bar (expandable)
- [ ] Thread: last message expanded, older collapsed
- [x] Reply composer overlay anchored in the detail panel
- [x] AI panel inline below body (not a right-side panel)
- [x] Action items with push-to-workspace button
- [x] Workspace panel conditional (Notion linked / not linked)
- [x] Failure state as inline banner, not separate panel

### Composer
- [x] New compose: bottom sheet anchored to detail column
- [x] Reply: overlay composer anchored inside detail panel
- [ ] AI draft pre-filled when available, editable immediately
- [ ] `✦` indicator marking AI-generated text
- [ ] Tone controls: Shorter / Formal / Casual / Regenerate
- [x] `⌘↵` to send, `Esc` to discard (with confirmation if edited)

### AI Features
- [ ] Every AI output marked with `✦` indicator
- [x] AI panel: summary + action items + suggested label
- [ ] AI draft: rejectable + regeneratable
- [ ] Classification override available on every message
- [ ] Low-confidence outputs visually dimmed or hidden
- [ ] Per-account AI opt-out in settings
- [x] No AI action executes without user trigger

### States
- [x] Mail list: loading (skeleton), empty, filtered-empty, error
- [x] Detail: idle, loading, ready, error
- [x] Actions: loading (inline spinner), success (brief highlight), error (inline banner + retry)
- [x] Account: connected, syncing, error (sidebar + inline reconnect)
- [ ] AI panel: loading, ready, failed (silent), disabled

### Design System
- [x] CSS variables: surface tokens, tint tokens, border tokens, AI accent token
- [x] Button variants: primary, secondary, ghost, danger, icon
- [ ] Status dot variants: unread, priority, connected, syncing, error
- [x] Focus ring: `2px solid --border-focus` with `outline-offset: 2px`
- [x] `prefers-reduced-motion` respected
- [ ] `text-muted` contrast passes WCAG AA at 12px+

### Keyboard
- [ ] `e` archive, `r` reply, `u` mark unread, `s` star, `c` compose
- [x] `j` / `k` navigate messages
- [ ] `h` snooze
- [x] `⌘K` command palette
- [x] `⌘↵` send
- [x] `Esc` dismiss/deselect
- [ ] Shortcuts visible in tooltips and `···` overflow menu

### Accessibility
- [x] `role="list"` on mail list, `role="listitem"` on rows
- [x] `aria-selected` on selected row
- [x] `aria-live="polite"` on action feedback zones
- [x] `aria-label="Unread"` on status dot
- [x] Focus management on message select → detail toolbar → Reply button
- [x] Focus management on composer open → first input
- [ ] All interactive elements ≥ 44px touch target on mobile

### Privacy
- [ ] AI consent shown on onboarding (not buried in settings)
- [ ] Per-account AI opt-out available
- [ ] All AI actions reversible (undo within 5 seconds for destructive)
- [x] No AI action executes automatically
- [ ] Privacy documentation linked from AI panel

---

> **What to build first:** Lock the 2-column workspace with a toggleable right detail panel, remove the banner and heading noise, and redesign the action hierarchy in the detail toolbar. These three changes make the product feel like a real tool, not a prototype — before a single AI feature is implemented.
