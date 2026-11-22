# JW Meeting Timer — Design Guidelines

**File:** `design_guidelines.md`  
**Version:** 1.0 (design proposal)  
**Date:** 2026-11-20  
**Status:** Proposed, pending accessibility and Android-device validation  
**Related specifications:** `TECHNICAL_PLAN.md`, `SYSTEM_DESIGN.md`, `SCREEN_FLOWS.md`

## 1. Scope and governing rules

These guidelines govern the **Android-only, React Native + Expo + TypeScript** application, including its meeting timer, Midweek/Weekend programs, assignment scheduler, PDF import, local device pairing, and backup flows. They describe a **native mobile design system**. CSS custom properties below are documentation aliases for design tools or a future web preview; **React Native does not execute CSS variables directly**. Implement the same values as typed TypeScript tokens, scaled in density-independent pixels (dp) and scale-independent font units (sp). Do not create a web backend or desktop shell to satisfy CSS terminology.

The product remains offline-first; there is no login, no cloud account, no required hosted service, and no live timer synchronization. Synchronization concerns meeting schedules, assignments, and permitted supporting records **only**. One paired device is the active schedule publisher. Access controls depend on trusted devices and scoped grants; screen visibility alone never proves permission.

**Engineering constraints:** mobile-first, accessible by default, clear visual hierarchy, SOLID, DRY, KISS, composition over inheritance, transactional SQLite as persistent source of truth, least privilege, secure defaults, and minimal personal-data exposure.

**Accessibility target:** WCAG 2.2 AA principles as relevant to native Android, with Android TalkBack and large-text testing. Where Android and WCAG definitions differ, document the applicable platform behavior and test against both intentions.

## 2. Visual foundation

### 2.1 Design intent

- Functional and restrained, optimized for clarity in live meetings rather than decorative effects.
- High-visibility countdown. Distinguish active, paused, warning, overtime and completed using **text plus shape or icon**, never color alone.
- Modest density on forms and scheduling screens, exceptionally large figures in timer presentation.
- Respect system dark mode and accessibility settings, while allowing an explicit light/dark preference.
- Keep administrative actions secondary to primary meeting tasks. Avoid clutter, animation overload, and unnecessary confirmations.
- All appearance choices in this file are **proposed** design decisions, not an approved JW.org brand system; no official affiliation or trademark representation is implied.

### 2.2 Semantic colors, light theme

All hexadecimal values are proposed tokens. Verify final token pairs against contrast requirements on-device, including selected/disabled/overlay states.

| Token | Value | Intended use |
|---|---|---|
| `color.brand.600` | `#1C5D75` | Primary active elements, selected navigation |
| `color.brand.700` | `#14465B` | Pressed primary states, strong emphasis |
| `color.brand.100` | `#DCECF1` | Subtle brand background |
| `color.canvas` | `#F5F7F8` | App background |
| `color.surface` | `#FFFFFF` | Cards, modal sheets, fields |
| `color.surfaceAlt` | `#EAF0F2` | Alternate grouped surfaces |
| `color.text.primary` | `#172A34` | Main text |
| `color.text.secondary` | `#425A65` | Descriptions, labels |
| `color.text.inverse` | `#FFFFFF` | Text over sufficiently dark primary colors |
| `color.border` | `#AABAC2` | Input and card boundaries |
| `color.focus` | `#174F9E` | Visible focus indication |
| `color.success` | `#216744` | Positive status, accompanied by text/icon |
| `color.warning` | `#7C4A00` | Warning text or icon |
| `color.warningBg` | `#FFF2D6` | Warning surface |
| `color.danger` | `#A12A30` | Destructive actions and error states |
| `color.dangerBg` | `#FDE9EA` | Error surface |
| `color.disabledBg` | `#E2E7E9` | Disabled surface (pair with readable label) |
| `color.scrim` | `#111F2A` (60% opacity) | Modal backdrop; avoid text on scrim |

### 2.3 Semantic colors, dark theme

| Token | Value | Intended use |
|---|---|---|
| `color.brand.600` | `#8BC8DC` | Primary action labels or emphasis on dark surfaces |
| `color.brand.700` | `#B3DEEB` | Prominent information |
| `color.brand.100` | `#183A4A` | Brand-tinted surfaces |
| `color.canvas` | `#0D171D` | App background |
| `color.surface` | `#172830` | Cards and sheets |
| `color.surfaceAlt` | `#223640` | Grouped surfaces |
| `color.text.primary` | `#F0F5F7` | Main text |
| `color.text.secondary` | `#C0D0D6` | Secondary text |
| `color.text.inverse` | `#102530` | Text on light primary fills |
| `color.border` | `#5B727F` | Dividers and input borders |
| `color.focus` | `#A9D0FF` | Focus indication |
| `color.success` | `#89D9AC` | Status text/icon |
| `color.warning` | `#F7CE7B` | Warning text/icon |
| `color.warningBg` | `#433218` | Warning surface |
| `color.danger` | `#FF9CA1` | Error text/icon |
| `color.dangerBg` | `#49252C` | Error surface |
| `color.disabledBg` | `#2A3A42` | Disabled surface |
| `color.scrim` | `#000000` (70% opacity) | Modal backdrop |

**Semantic mapping rules:** Never couple components to a literal hexadecimal color. Use roles such as `background`, `foreground`, `action`, `status`, `divider`, `focusRing`. On a dark canvas, a light-colored `brand.600` serves as *foreground* or uses a dark foreground when serving as a filled button background. Status indicators always carry explicit text (e.g. “Pending sync”, “Overtime 00:12”). Confirm real foreground/background contrast before release.

### 2.4 Timer-specific palette and states

| Timer state | Primary treatment | Text / spoken equivalent |
|---|---|---|
| Ready | Neutral high-contrast digits | “Ready to start” |
| Running | Default brand emphasis, stable digits | “Running” |
| Paused | Pause icon plus outlined status pill | “Paused at 04:32” |
| Warning | Amber secondary accent, warning icon | “1 minute remaining” |
| Overtime | Danger accent with `+` elapsed label | “Overtime by 00:12” |
| Completed | Check icon with final status | “Part completed” |
| Sync pending | Clock/upload icon | “Schedule changes waiting to sync” |
| Sync conflict | Alert icon with action | “Conflict requires review” |

Do not flash rapidly or animate the full screen during warnings. Respect reduced-motion settings.

### 2.5 CSS design-token reference (documentation only)

```css
:root {
  --jw-color-brand-600: #1c5d75;
  --jw-color-brand-700: #14465b;
  --jw-color-canvas: #f5f7f8;
  --jw-color-surface: #ffffff;
  --jw-color-text-primary: #172a34;
  --jw-color-text-secondary: #425a65;
  --jw-color-border: #aabac2;
  --jw-color-danger: #a12a30;
  --jw-color-warning: #7c4a00;
  --jw-color-success: #216744;
  --jw-space-0: 0px;
  --jw-space-1: 4px;
  --jw-space-2: 8px;
  --jw-space-3: 12px;
  --jw-space-4: 16px;
  --jw-space-5: 20px;
  --jw-space-6: 24px;
  --jw-space-8: 32px;
  --jw-space-10: 40px;
  --jw-space-12: 48px;
  --jw-radius-sm: 6px;
  --jw-radius-md: 10px;
  --jw-radius-lg: 16px;
  --jw-radius-xl: 24px;
  --jw-radius-pill: 999px;
  --jw-elevation-low: 0 2px 6px rgb(0 0 0 / 10%);
  --jw-elevation-medium: 0 6px 18px rgb(0 0 0 / 14%);
  --jw-elevation-high: 0 12px 32px rgb(0 0 0 / 18%);
}
```

On Android, translate elevations to React Native `elevation` and compatible shadow styles where needed; do not assume CSS `box-shadow` behavior or identical cross-version rendering. Prefer borders and spacing to excessive elevation.

### 2.6 Typography

**Typeface:** Android system sans (Roboto or device default), with font scaling enabled. Avoid downloading or bundling external fonts unless licensing, offline packaging, and a11y testing justify them. Numerals use tabular or monospaced digits where available to prevent countdown jitter.

| Text role | Base size (sp) | Weight | Line height target (sp) | Use |
|---|---:|---|---:|---|
| Display timer | 64–120 adaptive | 700 | ~1.05× | Fullscreen countdown |
| Hero number | 44 | 700 | 52 | Dashboard counts |
| H1 screen | 28 | 700 | 36 | Major screen title |
| H2 section | 22 | 700 | 30 | Section headings |
| H3 card | 18 | 600 | 26 | Card titles |
| Body | 16 | 400 | 24 | Main copy and form values |
| Body emphasis | 16 | 600 | 24 | Important labels |
| Supporting | 14 | 400 | 20 | Descriptions |
| Caption | 12 | 500 | 18 | Supplementary metadata only |
| Button | 16 | 600 | 22 | Interactive control labels |

**Scaling policy:** Do not globally disable font scaling or force fixed heights on text containers. Allow wrapping, scrollable forms, and responsive rearrangement. Countdown must fit at maximum configured system text size by reducing the *base display size* responsively, without clipping accessibility labels. Use relative measurements and measure text in actual devices.

### 2.7 Spacing, radii, elevation, icons, motion

**Spacing scale (dp):** `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64` named `space.0`, `space.1`, `space.2`, `space.3`, `space.4`, `space.5`, `space.6`, `space.8`, `space.10`, `space.12`, `space.16`.

**Radii (dp):** `sm 6`, `md 10`, `lg 16`, `xl 24`, `pill 999`. Use consistent form/card rounding; fullscreen timer is predominantly flat.

**Elevation levels:** `none 0`, `low 2`, `medium 6`, `high 12` (Android elevation approximations). Use low on cards, medium for floating actions, high sparingly for modal surfaces. Never use shadows as the only boundary cue.

**Icons:** 20–24dp default artwork, 48dp minimum touch region. Pair icons with visible labels for essential actions. Decorative icons are hidden from TalkBack; meaningful icons expose accessible names.

**Motion:** subtle transitions of 120–220ms for ordinary UI feedback; no timer value tweening. Reduce or remove nonessential animations under Android reduced-motion preferences. Do not rely on animation to communicate completion or errors.

## 3. Layout architecture

### 3.1 Mobile-first adaptive widths

Android layouts are based on **available window width in dp**, not web viewport pixels and not physical screen diagonal. These bands are design breakpoints to validate during Phase 0; window insets, keyboard appearance, rotation, split-screen and device font settings take precedence.

| Window width | Pattern | Navigation | Content |
|---|---|---|---|
| Compact: `<600dp` | Phone, single column | Bottom tabs | 16dp side padding, full-width forms |
| Medium: `600–839dp` | Large phone / small tablet | Navigation rail if feasible | 24dp margin, optional two-pane lists |
| Expanded: `≥840dp` | Tablet / landscape | Navigation rail or persistent side panel | 32dp margins, master-detail or two-column editor |

An Android app does **not** require a permanent desktop-style sidebar. Use a **bottom navigation bar** for Home, Meetings, Assignments, Timer, Settings on compact windows; use a **navigation rail** on larger widths. A **sidebar/panel** is allowed for expanded tablet screens only if supported by tested window width. Never expose a web-only menu hamburger as the sole navigation path.

### 3.2 Screen chrome and structural regions

- **App shell:** safe areas / system-bar insets → app header → primary content → bottom tabs or navigation rail → system navigation.
- **Header:** screen title, optional concise subtitle and up to two relevant actions; overflow contains infrequent actions. Avoid multiple competing primary calls to action.
- **Content:** standard horizontal padding 16dp compact, 24dp medium, 32dp expanded; max reading/form column width about 640dp; broad scheduling views may use wider columns.
- **Footer / bottom action area:** sticky primary action only when it will not obscure content or keyboard. Honor gesture navigation insets.
- **Sheets / dialogs:** concise decision prompts; critical destructive and restore operations require explicit confirmation.
- **Keyboard:** forms scroll and keep the active field and validation message visible; do not bury buttons behind the software keyboard.
- **Orientation:** timer supports portrait and landscape. Other screens adapt rather than forcibly rotate. Use fold/split-screen safe layouts.
- **Loading/recovery:** provide a labeled progress state and an actionable recovery path on each asynchronous screen.

### 3.3 Layout by major route

| Route / screen | Compact layout | Medium/expanded layout |
|---|---|---|
| `/` Home | Upcoming meeting card, quick actions, pending sync | Meeting overview + side-by-side schedule summary |
| `/meetings` | Segmented list/calendar with filters | Calendar plus details pane |
| `/meetings/[id]` | Stacked agenda cards | Agenda with info/assignments side panel |
| `/meetings/[id]/edit` | Step sections, reorder affordance | Form + ordered parts side by side |
| `/assignments` | Role/date filters and list cards | Matrix/table with fixed row labels |
| `/people` | Searchable person list | List and detail panel |
| `/timer` | Timer card, part title, large controls | Prominent countdown, adjacent controls/agenda |
| `/timer/fullscreen` | Countdown occupies safe display region | Maximum-size countdown with secondary metadata |
| `/imports/preview` | Candidate-by-candidate review | Side-by-side source vs interpreted program |
| `/devices` | Trusted-device cards | Device list and permission details |
| `/sync/conflicts/[id]` | Stacked before/after comparison | Two-column comparison and decision summary |
| `/backups/restore` | Stepper + verification result | Same workflow with wider review area |
| `/settings` | Grouped settings sections | Rail and detail panel |

### 3.4 Fullscreen timer invariants

1. Countdown numerals remain the primary focal point, with part title and mode/state as secondary information.
2. Screen-awake requests are activated only in the configured presentation context and released on exit.
3. Android Back leaves immersive presentation without resetting or pausing the timer unless explicitly requested.
4. Always provide a reachable, labeled **Exit fullscreen** action compatible with gesture navigation and TalkBack.
5. Keep the countdown readable at distance in landscape with strong contrast; prevent clipping at 200% font scale and device display size changes.
6. Display overtime with a clear `+MM:SS` format and label, never red color alone.
7. Announce timer start, pause, warning threshold and completion selectively; **do not announce every second**.
8. No live countdown network mirroring is implied by fullscreen mode.

## 4. Reusable component library and contracts

Build small, composable primitives in a shared UI package. Feature-specific components live inside their feature modules. Components consume semantic theme tokens, accept accessible names, expose disabled/loading/error states, and never contain SQL or authorization logic. Authorization must be checked again by the use case, not trusted from disabled controls alone.

### 4.1 Buttons

| Variant | Use | Behavior |
|---|---|---|
| Primary | One dominant action per surface | Filled brand, minimum 48dp target |
| Secondary | Alternate action | Outline/tonal, visible focus state |
| Text | Low-emphasis action | No deceptive affordance; labeled |
| Destructive | Delete, unpair, revoke, overwrite | Danger semantics + confirmation as appropriate |
| Icon button | Pause, refresh, more actions | Accessible name, 48dp target, tooltip/help where useful |

**States:** default, pressed, keyboard/accessibility focus, disabled, loading. A loading button must not submit twice. Do not distinguish destructive vs ordinary only through color. Use verbs such as **Save schedule**, **Publish revision**, **Start timer**, **Unpair device**, not generic “OK”.

### 4.2 Cards

- Use `MeetingCard`, `AssignmentCard`, `PersonCard`, `DeviceCard`, and `StatusCard` as **compositions** of a reusable `Card` container.
- Standard card padding 16dp, gap 8–12dp, radius `lg`, border visible in both themes.
- Include primary title, secondary description, state indicator when needed, and at most one prominent primary action.
- Avoid nested interactive surfaces that confuse TalkBack or make taps ambiguous.
- Loading and empty states must retain an understandable heading and next action.
- Do not render private names or assignment details in notifications, logs, or shared previews without explicit authorization.

### 4.3 Data tables and scheduling grids

React Native has no built-in browser `<table>` semantics. Build an accessible scheduling presentation using a virtualized list or responsive grid, with row labels and column header context represented in accessible labels.

- Compact widths: convert each row to a vertical detail card rather than forcing horizontal scrolling across many columns.
- Expanded widths: allow assignment matrix view, sticky date/role labels where practical, and explicit header context.
- Provide sort, filter, and search only where the data size warrants them; preserve current sort/filter in transient UI state.
- Every row action must be individually labeled, e.g. “Edit sound operator assignment for November 25”.
- Do not depend on swipe gestures, drag and drop, or color-coded cells as the only route to act.
- Distinguish `Draft`, `Published`, `Pending sync`, `Conflict`, and `Canceled` via text and icons.
- Apply virtualization for large rosters while ensuring screen reader navigation and focus recovery.

### 4.4 Badges, chips, and status indicators

| Component | Semantic use | Requirement |
|---|---|---|
| Status badge | Draft, Published, Conflict, Pending | Plain-language label plus optional icon |
| Filter chip | Meeting type, duty, date | Selected state exposed to accessibility services |
| Role chip | Microphone, Sound, Timer, Reader | May be long; wrap/truncate with full accessible name |
| Sync status row | Last confirmed revision, pending drafts | Include actionable explanation where necessary |

Badges must not be the only communication channel for critical outcomes. Avoid bright pill badges for ordinary metadata.

### 4.5 Forms and controls

- Use reusable labeled `TextField`, `SelectField`, `DateField`, `DurationField`, `PersonPicker`, `RolePicker`, `SwitchField`, and `FormErrorSummary` components.
- Render visible labels rather than relying on placeholders.
- Show field hints before input; show validation close to the field and as a summary after submit.
- Apply locale-aware dates and 12/24-hour preferences. Store canonical dates/times separately from display formatting.
- Use appropriate keyboard types. Duration is entered as hours/minutes or `MM:SS` with explicit constraints, not free-form ambiguous numbers.
- For program part ordering, provide accessible Move up / Move down controls in addition to gesture reordering.
- For destructive edits, display what will change and whether a published schedule revision is affected.
- Do not autosave schedules into authoritative published revisions. Form drafts persist only through the defined workflow.
- Keep sensitive values out of clipboard and preview surfaces by default.

### 4.6 Dialogs, sheets, feedback, and empty states

- **Confirmation dialogs:** name the affected record and precise consequence. Primary label names the action; safe cancel is available.
- **Error banners:** concise cause and recovery action; persist until read or dismissed when impact is significant.
- **Snackbars/toasts:** supplementary confirmation only, never the exclusive success/error explanation.
- **Progress:** descriptive labels for PDF parsing, backup validation, and syncing. Avoid falsely precise percentages when the duration is indeterminate.
- **Empty states:** explain whether no records exist, filters hide records, or data is awaiting sync. Offer contextual action if authorized.
- **Offline state:** show clearly for optional online import; do not make it block local timer/scheduler workflows.

## 5. Shared component API guidance (specification, not implementation)

Suggested conceptual component contracts:

| Component | Inputs | Outputs / events | A11y contract |
|---|---|---|---|
| `AppHeader` | title, subtitle?, actions[] | back/action | Heading announced on navigation |
| `ActionButton` | variant, label, state | press | Button role, label, disabled/busy state |
| `StatusBadge` | status, label | none | Status text, not color alone |
| `MeetingCard` | meeting summary | open/details | Descriptive accessible action |
| `AssignmentRow` | person, duty, date, status | edit/view | Contextual row/action names |
| `DurationField` | draft duration, constraints | change/validation | Units and errors exposed |
| `TimerDisplay` | derived remaining, status, title | none | Selective announcements, stable numerals |
| `TimerControls` | allowed local commands | start/pause/resume/reset/next | Reachable controls in logical order |
| `SyncStatusPanel` | revision/status metadata | retry/open conflict | Clear distinction pending vs confirmed |
| `ImportDiffCard` | current vs imported part | accept/reject/edit | Explicit before/after labels |
| `PermissionNotice` | required grant, safe alternative | request/details | Explains limitation without leakage |

**Single-source-of-truth rule:** Screens consume query-backed SQLite read models and authoritative timer-engine snapshots. Shared UI components never maintain independent copies of authoritative meeting, assignment, device-trust, or timer state. Zustand may hold open panels, draft text, filters, selection and temporary view preferences.

## 6. Visual examples / screen blueprints

### 6.1 Home

1. Header: “Home”, congregation profile subtitle, settings/sync-status entry.
2. Primary “Next meeting” card: date, meeting type, time, current schedule status.
3. Quick actions: Open meeting, Start timer, Assign duties (permission-dependent).
4. Compact “My scheduled duties” display only when an individual filter has been explicitly configured. Device pairing does not establish a personal identity.
5. Last synchronized revision with separate “Pending changes” notice where relevant.

### 6.2 Meeting editor

1. Screen title and Draft/Published context.
2. Meeting details section: type, date, optional start time.
3. Ordered program parts with title, category, duration, speaker/assignment reference.
4. Move up/down, add, edit and remove controls.
5. Persistent, clearly distinguished **Save draft** and leader-only **Publish revision** actions.
6. Before publishing, review conflicts, validations and differences from last published revision.

### 6.3 Timer

1. Selected meeting and part, or independent manual timer configuration.
2. Large countdown; running/paused/overdue state.
3. Primary Start or Pause/Resume action; Reset and Next are secondary actions.
4. Selectable Manual/Automatic mode with confirmation if switching affects a running session.
5. Fullscreen action and keep-awake preference entry.
6. Ensure no assignment syncing controls appear to control the live timer.

### 6.4 Assignments

1. Date and meeting-type filters.
2. Duties organized by responsibility, e.g. microphones, sound, timer, readers.
3. Person and duty details plus conflict indicators.
4. Add/edit actions visible according to trusted device grants.
5. Clear status for unpublished drafts and published revisions.

### 6.5 Import and sync safety views

- **Import preview:** distinguish source text, extracted candidate, missing fields, manual edits, and overwrite/deduplication effects. Commit requires explicit confirmation.
- **Device pairing:** readable device identity, local verification code and permissions being granted. No silent trust approval.
- **Conflict resolution:** two versions with identifiers/time and affected assignments; do not auto-select destructive resolution.
- **Restore review:** file integrity, encryption status, scope, record counts, and impact on current records before replacement.

## 7. Accessibility checklists

### 7.1 Per-component checklist

- [ ] Accessible name, role and state/value are exposed through React Native accessibility properties.
- [ ] Interactive touch region is at least 48×48dp even if the visual icon is smaller.
- [ ] Normal text contrast is at least 4.5:1 and large text at least 3:1; inspect meaningful non-text UI contrast against the applicable 3:1 target.
- [ ] Information is not conveyed through color alone.
- [ ] Text remains legible and controls remain available with enlarged Android font/display settings.
- [ ] Component is usable by TalkBack, keyboard / switch access when relevant, and touch.
- [ ] Pressed, selected, disabled, loading and error states have appropriate labels.
- [ ] Errors describe the problem and the corrective action.
- [ ] Motion is nonessential or reduced when the system prefers reduced motion.
- [ ] Icons have meaningful labels or are hidden from accessibility when decorative.

### 7.2 Per-screen checklist

- [ ] Screen announces a unique title and sensible focus destination after navigation.
- [ ] Focus order follows visual and task order; dialogs trap focus appropriately and restore focus on close.
- [ ] Content does not disappear behind system bars, keyboard, device cutouts or gesture regions.
- [ ] Primary and destructive actions are distinct and reachable.
- [ ] Loading, empty, offline, permission-denied and failed states contain an accessible message and next step.
- [ ] A navigation path to leave the screen exists, including fullscreen timer.
- [ ] Sensitive data is not accidentally visible to unauthorized device roles.
- [ ] Long lists remain navigable by assistive technology, including after filters update.
- [ ] Landscape, small windows, tablet widths, and 200% text scaling are tested.
- [ ] No timer announcements occur every second; state changes and meaningful thresholds are announced.

### 7.3 Flow-level checklist

- [ ] Onboarding works fully offline and does not ask for an online account.
- [ ] Program creation and publishing show draft vs confirmed data distinctly.
- [ ] Import errors preserve existing records, offer correction, and announce failures.
- [ ] Device pairing explains scope and obtains explicit confirmation.
- [ ] A viewer does not see edit or publish actions, and underlying use cases deny those operations.
- [ ] Offline schedule changes are labeled pending until published or synchronized.
- [ ] Sync conflicts provide side-by-side or sequential accessible comparisons.
- [ ] Backup/restore confirmation explains the privacy and overwrite consequences.
- [ ] Countdown remains usable with screen reader and high-contrast settings.

### 7.4 Interaction checklist

- [ ] Tap action shows immediate feedback and blocks accidental double submission.
- [ ] Long operations provide progress and a safe cancellation strategy where feasible.
- [ ] Destructive operations require confirmation proportional to impact.
- [ ] Repeated actions are idempotent where the domain permits it.
- [ ] Swipe and drag shortcuts have alternative visible buttons.
- [ ] Forms preserve unfinished drafts across accidental navigation, when safe.
- [ ] Error message persists long enough to read; essential messages are not toast-only.
- [ ] Offline/online changes do not reset a running local timer.
- [ ] Permission requests occur at point of use and offer an alternative path when possible.
- [ ] Haptic, sound and visual warnings respect user choice and are not disruptive during meetings.

## 8. Secure-by-default and data-consistency UI rules

| Risk | Required UX treatment | Enforcement boundary |
|---|---|---|
| Unauthorized schedule publication | Hide/disable publish for non-leader, explain restriction | Domain permission check + sync receiver validation |
| Invalid assignment | Show inline conflict and prevent invalid publication | Domain invariant + SQLite transaction |
| Duplicate import | Preview exact affected meeting/parts, ask for explicit action | Import use case + transaction |
| Offline pending change | Show Pending vs Published distinctly | Revision journal / query read model |
| Device revocation | Confirm device name and effect, no undo claim | Trust store + authorization |
| Backup export | Show data scope and passphrase/encryption status | Backup cryptographic service |
| Backup restore | Preview changes and support safe validation before write | Transactional restore coordinator |
| Personal data disclosure | Limit person fields by device grants and context | Scoped repository/query projections |
| Fullscreen exit | Provide accessible exit, preserve timer state | Timer controller + Android activity layer |
| Network unavailable | Explain local-only operation and deferred sync | Sync service, no dependency on cloud |

Never display an action as completed until the underlying transaction or authenticated sync acknowledgment succeeds. Avoid success status based only on optimistic local UI updates. For offline drafts, explicitly label local save separately from publication and remote synchronization.

## 9. Design-system ownership and implementation conventions

- Centralize all primitive tokens in `src/design/tokens/` (or equivalent agreed shared UI location) and semantic themes in `src/design/theme/`. Route files stay thin.
- Create primitives under `src/design/components/` and feature-specific compositions under `src/features/<feature>/presentation/components/`.
- Centralize formatting helpers for date, duration, number, accessibility copy and status labels.
- Do not embed authorization checks solely in components; pass allowed actions from use cases and validate again on execution.
- Keep data access in feature repositories and application services. UI components should only receive normalized view models.
- Use TypeScript discriminated unions for UI states, such as `idle | loading | loaded | empty | error`, rather than unrelated booleans.
- Add each component to a preview/catalog screen with light/dark, font-scale, loading, error and disabled examples; catalog is internal development tooling, not a public feature.
- Changes to tokens require contrast review, visual regression review, and evaluation of timer readability on physical devices.

## 10. Verification and acceptance gates

| Gate | Checks | Required evidence |
|---|---|---|
| Token review | Semantic coverage, theme completeness | Light/dark token matrix |
| Component review | Visual states, touch targets, accessible props | Component tests + preview captures |
| Layout review | Compact/medium/expanded, keyboard, rotation | Android emulator/device screenshots |
| Timer review | Readability at distance, fullscreen exit, state labels | Real-device accessibility walkthrough |
| Scheduling review | Card vs table equivalence, conflict clarity | Task-based usability sessions |
| Security UX review | Device grants, publication/backup confirmations | Negative-permission tests and review |
| Release accessibility review | TalkBack, large text, contrast, alternative gestures | Audit checklist with tracked exceptions |

## 11. Assumptions, unresolved design decisions, out of scope

| ID | Decision pending | Current provisional treatment |
|---|---|---|
| DG-01 | Final visual brand or congregation-specific theming | Neutral original theme proposed here |
| DG-02 | Android minimum version | Use adaptive dp patterns; validate supported API range in Phase 0 |
| DG-03 | Tablet support and expected display sizes | Tablet/landscape responsive support, Android only |
| DG-04 | Preferred UI language(s) | Externalize strings, support locale-aware formatting |
| DG-05 | Exact automatic timer advance policy | Display configurable mode, require workflow approval |
| DG-06 | Timer alert colors, sound and vibration policy | Non-disruptive visual indicators, optional additional cues |
| DG-07 | Whether a schedule viewer filters “my assignments” | No implicit user identity; optional explicit person filter |
| DG-08 | Detailed pairing verification and leader transfer UI | Confirmation required, no implicit trust |
| DG-09 | PDF language/layout support | Import review UI works without assuming perfect extraction |
| DG-10 | Table presentation on tablets | Validate assistive-tech behavior and performance |

**Out of scope for this document:** final pixel-perfect mockups, licensed JW.org branding/assets, iOS/desktop/web builds, hosted APIs or cloud accounts, live countdown synchronization across devices, official JW.org or KHMS API integration guarantees, and application implementation code.

## 12. Design definition of done

A screen or component is ready for implementation review when it uses semantic tokens, fits compact and expanded Android windows, is understandable through TalkBack, uses reachable 48dp interactive targets, handles disabled/loading/error/offline states, avoids duplicated authority over stored data, respects least-privilege actions, and preserves existing meeting/assignment records on failed mutations. No purely visual approval substitutes for domain authorization and transactional validation.

---

**Next possible artifact:** Screen wireframes and component inventory keyed to the route map in `SCREEN_FLOWS.md`, after these proposed tokens and navigation adaptations are approved.

## Appearance foundation update — 2026-11-22

The owner-approved redesign uses shared dark and light palettes in
`src/constants/appearanceTheme.ts`. These palettes govern migrated
components and navigation; they supersede earlier proposed values for
those surfaces.

Appearance supports System, Light, and Dark. System is the default.
The preference is device-local and stored under the `appearance` key
in the existing `app_preferences` table. It is not synchronized.

NativeWind components consume semantic `app` color variables.
React Navigation consumes the same resolved palette. Legacy screens
retain their existing styles until their scheduled redesign batch.

Current backup export and restore remain content-only: appearance is
not exported, and restoring content preserves the receiving device's
appearance preference.

Source application and owner verification must be reported separately.


## Home navigation tokens — 2026-11-22

Selected navigation backgrounds use the selection palette role:
dark #093C3F and light #D9EFF0.

Dashboard statistic cells use a 96dp minimum width and wrap when needed.
Bottom navigation retains scaled labels and uses existing layout tokens.
Icons use the installed react-native-svg dependency.

Only Home and navigation receive this batch's redesign. Remaining screen
bodies keep their existing appearance until their scheduled batches.

## Meeting section presentation — 2026-11-22

Section tokens are centralized in `src/constants/meetingProgramTheme.ts`.
Recognized English and Waray Treasures, Ministry, and Christian Living
headings receive teal, amber, and red presentation respectively.

Custom, opening, closing, and other headings use neutral surfaces.
Color mapping never renames sections or changes saved content.

Section controls expose expanded state and preserve 48dp touch targets.
Date selection uses a validated date-entry dialog without a new dependency.
Both themes, large text, TalkBack, and keyboard behavior require owner
device verification.

## Timer presentation tokens — 2026-11-22

Timer presentation uses shared appearance palettes and section colors.
Its additional tokens are centralized in timerTheme.ts.

Countdown digits use tabular numbers and the existing responsive size.
Single-line fitting accommodates long overtime values. Font scaling
remains enabled.

Status labels and signed overtime digits provide meaning beyond color.
Progress and changing digits do not produce live announcements on every
tick; existing timer status announcements remain in place.

The red Restart action retains confirmation. Fullscreen has a visible
exit control and existing Android Back handling. Scrolling keeps controls
reachable at large text sizes.

Device verification is required for both themes, long overtime values,
large text, TalkBack, fullscreen, recovery, and screen-awake behavior.

## Assignment cards — 2026-11-22

Assignment cards use shared appearance palettes and card spacing.
The four technical duties have distinct vector icons in AppIcon.

Role labels, publisher names, unassigned text, and review notices remain
visible text. Icons do not replace labels or communicate permission.

Large text wraps without fixed card heights. The read-only Assignments
tab has no per-card editing controls. Management retains its existing
explicit editing route.

## Grouped Settings presentation — 2026-11-22

Settings uses themed grouped surfaces, section icons, descriptive rows,
and decorative chevrons. Appearance shows its current preference.

Rows retain at least 48dp touch targets and have no fixed height.
Labels, values, and descriptions wrap for large text. TalkBack receives
one combined label for each actionable row.

No placeholder switches or unsupported settings are introduced.

## Profile and publisher forms — 2026-11-22

AppInput and AppToggleRow provide shared themed form presentation.
Fields and controls retain 48dp minimum touch targets and text scaling.

Profile language choices announce radio selection. Publisher toggles
announce their labels and checked state. Errors retain visible text
and accessible announcements.

Keyboard avoidance and scrolling keep form actions reachable.
Publisher lists remain virtualized and cards have no fixed height.

## Meeting and duty editor styling — 2026-11-22

Meeting editor styles are generated from the resolved appearance palette.
Fields use AppInput, timing controls use AppToggleRow, and buttons use
AppButton. Radio choices expose checked and disabled states.

Duty cards preserve visible role names, assigned names, and review notices.
Eligible publishers remain in a virtualized list.

Existing layout tokens, font scaling, keyboard avoidance, and minimum
touch targets remain applicable. Both themes and large-text keyboard
flows require owner device verification.

## Document and received-schedule surfaces — 2026-11-22

useDocumentStyles centralizes themed document text, cards, and spacing.
Import pages retain virtualization and selectable extracted text.
Full device fingerprints remain selectable and are not truncated.

Controls use AppButton. Cards have no fixed height and preserve text
scaling. Both themes and TalkBack require owner device verification.

## Device and Sync surfaces — 2026-11-22

Device and Sync views use useDocumentStyles and AppButton.
Shared input styling resolves the current appearance palette.

Fingerprints, connection codes, review details, errors, and disabled states
remain visible. QR codes preserve dark modules on a light background.

Both themes, large text, TalkBack, and two-device flows require owner
verification.

## Backup and diagnostic surfaces — 2026-11-22

Backup inputs resolve shared appearance colors and retain password masking.
Diagnostic results include visible PASS/FAIL text and selectable details.

Both themes, large text, keyboard access, and TalkBack require owner
verification. Styling changes do not establish backup or recovery safety.

## Remaining state presentation — 2026-11-22

Profile loading/error content uses shared themed components.
Legacy assignment choices use themed surfaces and checked radio states.

Unreferenced legacy views are not evidence of active-screen coverage.
Final completion requires owner verification of registered screens.
