# JW Meeting Timer — Screen Flows and Navigation Specification

**Navigation/source update (2026-11-21):** [ADR 0003](adr/0003-react-navigation-and-source-layout.md) replaces Expo Router route files with typed React Navigation 7 stacks/tabs. Existing URL paths are retained through `src/navigation/linking.ts`; current files are mapped in [DIRECTORY_STRUCTURE.md](DIRECTORY_STRUCTURE.md). First-run guards are profile-based, not publishing/sharing authorization. Runtime verification is pending.

**File:** `SCREEN_FLOWS.md`  

**Phase 6 source update:** Home and Settings open `Sync`; Settings also opens explicit isolated `SyncChecks`. Device requests, signed pairing and LAN hosting add QR helpers; discovery only fills an unverified connection code. Sync requires fixed-leader adoption, separate draft grants and complete CURRENT/PROPOSED review before publish/submit. Received schedules prefer verified signed data and retain the legacy-copy fallback. See [ADR 0005](adr/0005-trusted-publishing-and-phase-6.md) and [owner checks](PHASE_6_OWNER_CHECKS.md). No new tabs or timer auto-start behavior are introduced. Phase 7 stays on hold.
**Version:** 1.0 (proposed design baseline)  
**Date:** 2026-11-20  
**Status:** Draft for product and accessibility review  
**Companion documents:** `TECHNICAL_PLAN.md`, `SYSTEM_DESIGN.md`, JWMT-SRS-001, JWMT-SAD-002

## 1. Purpose, scope, and conventions

**Owner decision update (2026-11-20):** Apply [ADR 0001](adr/0001-timer-operation-and-test-device.md) to Timer, Fullscreen and recovery flows: explicit Start for every part, overtime until operator advance, and a checkpoint recovery prompt after unexpected closure. Earlier automatic mode controls are provisional and must not enable automatic start or automatic advance at zero.

This specification defines **Android-first screen hierarchy, Expo Router paths, individual screen contracts, and multistep user workflows** for the offline-first JW Meeting Timer. It describes user experience and navigation, **not application code**.

**Confirmed requirements:** Android only; Midweek and Weekend meeting programs; manual, PDF, and conditionally supported online program input; manual/automatic **local** timer; immersive fullscreen and screen-awake operation; people and meeting-duty scheduling; no accounts; trusted-device pairing; local schedule/assignment synchronization; single authoritative schedule publisher; offline-first SQLite storage; manual backup and transfer. **A running countdown is never synchronized across devices.**

**Terms:** A *person* is an individual in the assignment directory, not a signed-in app account. A *device role* authorizes application operations. A *draft* is editable locally; a *published revision* is an authoritative schedule snapshot signed by the current leader. A *viewer* reads data authorized for its device.

**Route notation:** Paths beginning `/` are public-facing navigation destinations, not network APIs. Expo Router route groups such as `(tabs)` and `(setup)` do not appear in the user-facing URL. Dynamic keys use `[id]`. All route names remain proposals until navigation prototyping.

**Permission labels:** `schedule.read`, `schedule.draft`, `schedule.publish`, `people.manage`, `devices.manage`, `backup.export`, `backup.restore`, `timer.use`. On-device checks and receiving-peer checks both apply. The initial device's setup authority is local and must be bootstrapped securely; it does not imply person-level authentication.

## 2. Information architecture

### 2.1 Primary route map

```text
/                              Bootstrap / loading / recovery router
├── /welcome                   First-use introduction
├── /setup/profile             Congregation profile and locale
├── /setup/device              Local device name and secure identity
├── /setup/permissions         Explain local network, files and display options
├── /setup/finish              Review and complete offline setup
├── /(tabs)/                   Main tab navigation
│   ├── /                       Home / next meeting overview
│   ├── /meetings               Meetings calendar and list
│   ├── /assignments            Assignment calendar, role and person views
│   ├── /timer                  Local meeting timer
│   └── /settings               Settings and administration entry
├── /meetings/new              Select date, type, and creation method
├── /meetings/[id]             Meeting detail and full agenda
├── /meetings/[id]/edit        Program and part editing
├── /meetings/[id]/parts/[partId]  Edit a single agenda part
├── /meetings/[id]/assignments  Assignment roster for a meeting
├── /meetings/[id]/publish     Validate, compare, publish (leader only)
├── /meetings/[id]/history     Revisions / local draft status
├── /assignments/new          Add a responsibility assignment
├── /assignments/[id]/edit    Edit or cancel an assignment
├── /people                   People directory
├── /people/new               Add a person
├── /people/[id]              Person detail, eligibility and duties
├── /people/[id]/edit         Edit person / availability
├── /imports/source           Choose PDF, online, or manual source
├── /imports/parse            Parsing progress and error state
├── /imports/preview          Review extracted parts, edits and diffs
├── /imports/result           Commit result and warnings
├── /timer/fullscreen         Immersive countdown display
├── /timer/settings           Timing rules, alerts and keep-awake preferences
├── /devices                  Paired devices, trust and sync status
├── /devices/pair             Pair by QR / verified invitation
├── /devices/[id]             Device detail, grants, last sync, revoke
├── /devices/leadership       Leader status, transfer and recovery information
├── /sync                     Sync inbox / outbox and conflict summaries
├── /sync/conflicts/[id]      Compare and resolve schedule edit conflict
├── /backups                  Manual backups and transfers
├── /backups/export           Scope, encryption and file destination
├── /backups/restore          Select, validate, preview and confirm restore
└── /settings/profile         Congregation settings and local preferences
```

**Tab hierarchy:** `Home | Meetings | Assignments | Timer | Settings`. People management is reached through Assignments or Settings, not a sixth tab. Import is launched from Meetings. Pairing and backups are reached through Settings. A deep link must never skip setup, trust, permissions, or transaction confirmation checks.

### 2.2 Grouped Expo Router file layout (proposed extension)

```text
app/
├── _layout.tsx
├── index.tsx
├── (setup)/
│   ├── welcome.tsx
│   └── setup/{profile,device,permissions,finish}.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── meetings.tsx
│   ├── assignments.tsx
│   ├── timer.tsx
│   └── settings.tsx
├── meetings/
│   ├── new.tsx
│   └── [id]/{index,edit,assignments,publish,history}.tsx
├── meetings/[id]/parts/[partId].tsx
├── assignments/{new,[id]/edit}.tsx
├── people/{index,new,[id]/index,[id]/edit}.tsx
├── imports/{source,parse,preview,result}.tsx
├── timer/{fullscreen,settings}.tsx
├── devices/{index,pair,leadership,[id]}.tsx
├── sync/{index,conflicts/[id]}.tsx
├── backups/{index,export,restore}.tsx
└── settings/profile.tsx
```

Routes are thin adapters, not feature implementations. Feature screens live under `src/features/*/presentation`. The tree above **extends**, rather than replaces, the baseline structure in `TECHNICAL_PLAN.md`; actual nesting syntax should be verified against the chosen Expo Router version. Navigation groups do not themselves grant authorization.

### 2.3 Navigation rules

1. **Cold launch:** initialize database, migrations, local crypto identity and settings; check `setup_complete`; route to first-use setup or Home. Database corruption enters a read-only recovery screen, not a destructive reset.
2. **Back behavior:** Android Back closes the top modal, returns to the previous detail screen, then returns to the selected tab; fullscreen Back first restores standard timer display without resetting the timer.
3. **Unsaved forms:** Back or tab change prompts `Keep editing / Discard`, unless a save has committed. Form input is transient until a confirmed transaction.
4. **Deep links:** validate IDs, congregation scope, active device grants and local data availability. Invalid, revoked, or deleted targets show accessible error states with a safe destination.
5. **No internet:** no forced authentication or internet blockers. Optional online import displays offline-retry guidance; other functions remain available.
6. **Role changes:** immediately reevaluate authorization before every destructive action and on returning to the foreground; hide or disable privileged controls with meaningful explanations.
7. **Loading:** show skeleton/progress for asynchronous local reads, parsing, decryption and sync; never present an inert interface without status.
8. **Primary timer:** use a locally owned timer session, not timer values mirrored in navigation params or duplicated Zustand stores.
9. **Sensitive routes:** minimize content in Android app-switcher previews where practical; avoid personally identifying data in notification and diagnostic text.
10. **Screen reader navigation:** each screen announces a meaningful title; focus moves predictably after route transitions, errors and dialogs.

## 3. Screen-level specification

Fields below provide **path | purpose | components | actions | states / authorization**. Each screen must have a TalkBack name and accessible actions. Primary action labels must describe the operation, not merely say “OK”.

### 3.1 Bootstrap and onboarding

| Path / screen | Purpose and key UI components | Primary actions | States, guard, and outcomes |
|---|---|---|---|
| `/` Bootstrap | Logo/status, initialization steps, accessible progress | Retry non-destructive initialization; view recovery guidance | DB migration, Keystore access, and setup state. Do not navigate until invariants pass. |
| `/welcome` Welcome | Brief offline/privacy explanation; choice of new setup or restore | `Set up this device`, `Restore a backup` | First install only; no login prompt, no cloud signup. |
| `/setup/profile` Profile | Congregation label, locale, timezone, meeting days, meeting type defaults | Validate and continue | Confirm data entered is local. No unsupported automatic locale assumptions. |
| `/setup/device` Identity | Device display name, generated fingerprint, pairing explanation | Create local identity; continue | Secure identity creation; no raw private key display/storage in SQLite. |
| `/setup/permissions` Capabilities | Contextual descriptions for local network discovery, document picker, keep awake, fullscreen | Continue, request permission when action requires | Denied LAN permission must not block offline timer or manual scheduling. |
| `/setup/finish` Review | Profile summary, security/privacy reminders, setup checklist | `Finish setup`, `Back` | Atomic commit of initial profile/preferences and setup completion; navigate Home. |

**Bootstrap constraints:** An unpaired initial device has local setup authority for its own store. Creating a second device profile must not create a competing schedule leader in the same trusted network without an explicit join/restore flow. Restore as part of onboarding routes to the backup validation workflow with first-run semantics.

### 3.2 Home and meetings

| Path / screen | Purpose and key UI components | Primary actions | States, guard, and outcomes |
|---|---|---|---|
| `/` Home tab | Next Midweek/Weekend meeting cards, upcoming duty summaries, draft/published badges, sync age | Open meeting, launch timer, view assignments, open pending sync | Empty calendar CTA; no internet warning only when relevant; hide private assignments without `schedule.read`. |
| `/meetings` | Month/week/list switch, type filters, date jump, offline-first search | Select meeting, create, import, view calendar | Distinguish cancelled/draft/published; preserve filter/navigation state transiently. |
| `/meetings/new` | Type, date/time, timezone, template/source choice | `Create from template`, `Enter manually`, `Import workbook`, `Retrieve online` | `schedule.draft` required. Prevent accidental duplicates but allow explicitly confirmed special meetings. |
| `/meetings/[id]` | Title, date, sections and ordered parts, planned durations, song/prayer references, assigned people, revision status | Edit, assign, load into timer, publish, history | `schedule.read` for display, `schedule.draft` for edit, `schedule.publish` for publish. |
| `/meetings/[id]/edit` | Program section editor, reordering, add/delete part, duration validation, import provenance badges | Save draft, revert draft, open part detail | On Save perform a single domain validation and ACID transaction; warn when local edits diverge from published revision. |
| `/meetings/[id]/parts/[partId]` | Part type/title, sequence, duration, timed flag, optional song/material reference, notes | Save part, remove part | Validate non-negative duration, meeting ownership, unique ordering, optional reference safety. |
| `/meetings/[id]/assignments` | Duty slots, people, eligibility, date/time conflicts, statuses | Add assignment, reassign, cancel, review conflicts | `schedule.read` to view, appropriate edit grants for modification. Conflict warnings do not silently auto-resolve. |
| `/meetings/[id]/publish` | Preflight checklist, change diff, conflict warnings, final revision preview | `Publish revision`, `Cancel` | Leader + `schedule.publish` + valid active leadership term required; no publish if another canonical revision supersedes base. |
| `/meetings/[id]/history` | Published revision timeline, draft indicators, change summaries, device attribution | Open read-only revision, inspect differences | Do not label device attribution as identity of a human editor. |

**Meeting detail states:** Loading, missing, locally modified, pending leader approval, published, completed, cancelled, conflicting, and read-only. Destructive actions require confirmation and a reversible record/tombstone policy, not wholesale cascading deletes.

### 3.3 People and assignments

| Path / screen | Purpose and key UI components | Primary actions | States, guard, and outcomes |
|---|---|---|---|
| `/assignments` | Calendar/roster view, filter by responsibility/meeting/date/person, upcoming duty list | Open roster, add assignment, open people | Display role, time, meeting, status, and conflict indicators; viewer read-only. |
| `/assignments/new` | Meeting and optional part, person search, responsibility picker, optional slot/time, status | Validate overlap, save draft | `schedule.draft`; eligibility and person active status checked before commit. |
| `/assignments/[id]/edit` | Existing assignment details, change person/role/time, cancellation control | Save, cancel assignment | Detect conflicting changes, stale version and permission revocation; transactional save. |
| `/people` | Local directory, search, active filter, eligibility chips | Add person, open person, filter | Limit personally identifiable data; no email or phone required. |
| `/people/new` | Name and optional eligibility | `Save person` | `people.manage`; duplicate-name warning is advisory, not automatic deduplication. |
| `/people/[id]` | Person details, eligibility, assigned duties, future conflicts/availability | Edit person, view assignments, deactivate | `schedule.read` for authorized detail, `people.manage` for updates; no permanent deletion with historical links. |
| `/people/[id]/edit` | Editable name, status, eligible roles, optional availability intervals | Save, deactivate | Validate times, prohibit free-form sensitive notes by default. |

**Assignment collision policy:** Present warnings and blocking severity according to a congregation setting. A conflict must be explained in text and not conveyed by color alone. Even when a collision is allowed by policy, the user must explicitly acknowledge it.

### 3.4 Timer

| Path / screen | Purpose and key UI components | Primary actions | States, guard, and outcomes |
|---|---|---|---|
| `/timer` | Meeting and part selector, remaining time, progress and overtime, mode switch, Start/Pause/Resume/Reset/Next/Previous controls | Start, pause, resume, reset, advance, enter fullscreen | `timer.use` locally; session is never a peer-sync record. Confirm destructive Reset and mode change while running. |
| `/timer/fullscreen` | Immersive digits, part title, visual warnings, minimal accessible controls, exit affordance | Pause/resume, exit fullscreen, optional next | Keep awake only while requested; Android Back exits immersive view without ending session. Do not rely only on color. |
| `/timer/settings` | Manual/automatic defaults, warning thresholds, overtime behavior, visual presentation, screen-awake toggle | Save preferences, test warning display | Local-only configuration by default; automatic advance rule requires agreed policy and clear operator control. |

**Timer state presentation:** `Idle → Ready → Running ↔ Paused → Completed`, with valid reset and part transitions. Remaining time is computed from a monotonic time source in the active process; UI render cadence is never the timekeeping authority. On app restart, conservative recovery explains uncertainty and requires an operator choice until a verified policy is approved. A timer continues locally even if the network is unavailable.

### 3.5 Import wizard

| Path / screen | Purpose and key UI components | Primary actions | States, guard, and outcomes |
|---|---|---|---|
| `/imports/source` | PDF file selection, optional permitted online source, fallback manual entry, supported format explanation | Choose file, fetch approved source, cancel | No permissions until document picker/network action; internet unavailable disables only online fetch. |
| `/imports/parse` | Progress, file identity, parser diagnostics and cancel | Cancel, retry with another file | Readable/unsupported/scanned/corrupt PDF cases; parser does not mutate meeting records. |
| `/imports/preview` | Extracted meeting date/type, part list, warnings, editable fields, existing-vs-new diff | Correct data, select destination, confirm import | Require manual review, handle multiple meetings and duplicates, protect manually modified fields. |
| `/imports/result` | Created/updated records, skipped entries, errors, source provenance | View meeting, import another | Commit is atomic; errors retain existing database. Never claim complete accuracy for unverified extraction. |

**Online source caveat:** This workflow remains conditional on a legally permitted, reliable machine-readable source. If none is validated, show a clear explanation and retain manual/PDF flows instead of displaying a broken “Sync with JW.org” action.

### 3.6 Devices, synchronization, and leadership

| Path / screen | Purpose and key UI components | Primary actions | States, guard, and outcomes |
|---|---|---|---|
| `/devices` | Trusted device list, last seen, trust state, local sync status, current leader | Pair device, open details, sync, leadership | `devices.manage` for administrative operations; viewer devices see only permitted status. |
| `/devices/pair` | Invitation QR, fingerprint verification, pairing progress, consent and requested grants | Scan/show invitation, compare fingerprint, approve/deny | Require human approval and authenticated key exchange; reject expired, mismatched or reused requests. |
| `/devices/[id]` | Public fingerprint, grants, last sync, trust history | Change grants, revoke, retry sync | Only device administrator; revocation prevents future sync but not deletion of data already copied offline. |
| `/devices/leadership` | Current leader/term, last accepted revision, transfer preflight, split-brain warnings | Initiate authorized handover, accept transfer | No autonomous offline election; unresolved leadership conflict blocks publication without blocking local drafts. |
| `/sync` | Pending drafts, outgoing revisions, latest accepted revision, peer connectivity, errors | Sync now, inspect queued changes, resolve conflicts | User-visible status: local draft / pending / syncing / current / conflict / unavailable. |
| `/sync/conflicts/[id]` | Side-by-side local/remote changes, base revision, ownership and term information | Keep local draft, accept published, manually merge and submit | No silent last-write-wins; permissions and revision guards required for final commit/publication. |

**Pairing screens do not ask for an online username or password.** App-layer authorization is device based; the OS screen lock is a recommended additional safeguard. Schedule readers receive only fields permitted for their grants. Online publication retrieval never uploads private people/assignment records.

### 3.7 Settings and backup

| Path / screen | Purpose and key UI components | Primary actions | States, guard, and outcomes |
|---|---|---|---|
| `/settings` | Profile, timers, device trust, backups, data privacy, app info, troubleshooting | Open settings area | Show local/offline storage indicators; no cloud sync toggle or login. |
| `/settings/profile` | Congregation name, locale/timezone, meeting defaults, conflict policy, accessibility preferences | Save allowed preferences | Validate role and schedule-impacting changes; identify proposed changes requiring leader publication. |
| `/backups` | Last backup metadata, backup scope, retention guidance, local transfer, restore entry | Export, restore, inspect history | Offline; exclude private keys from exports unless a separately approved secure migration flow exists. |
| `/backups/export` | Data categories, manifest preview, encrypted backup passphrase entry, Android file destination | Create encrypted backup, choose destination | `backup.export`; warn about passphrase loss, never log secrets; verify file/hash. |
| `/backups/restore` | File picker, password entry, integrity/schema checks, compatibility and conflict preview | Validate, confirm restore, cancel | `backup.restore`; atomic or carefully staged replacement and rollback; trusted-device identity requires separate re-pairing. |

## 4. Detailed end-to-end workflows

Notation: `→` next screen or step; **commit point** is the operation where persisted data changes; **recovery** describes a reversible failure path.

### F01 — First-run offline onboarding

1. Open app → `/` checks database schema and Keystore availability.
2. Fresh install → `/welcome` explains local storage, offline use, privacy and backup.
3. User selects `Set up this device` → `/setup/profile` enters congregation name, language, timezone and default meeting days.
4. `/setup/device` assigns a display name, creates a hardware-backed or Android Keystore-protected identity where supported, and displays the public fingerprint.
5. `/setup/permissions` explains optional permissions and permits skipping unrelated functions.
6. `/setup/finish` summarizes entered data; user confirms.
7. **Commit point:** local profile, preferences and setup completion written together; local default device authority initialized under the bootstrap policy.
8. Navigate Home with `Create meeting`, `Import workbook`, and `Add people` entry points.

**Edge paths:** Setup cancellation keeps incomplete steps local without marking the app ready; denied LAN permission still allows offline use; Keystore failure blocks pairing only if local timer/database remain safely usable. No network requirement.

### F02 — Create a Midweek or Weekend meeting manually

1. Home/Meetings → `/meetings/new`.
2. Select `Midweek` or `Weekend`, date, time and timezone; choose blank or configured template.
3. Validate collisions and optionally acknowledge an existing meeting of the same type/date.
4. Open `/meetings/[id]/edit` in local draft mode; add sections, songs/prayers, talks/study parts, durations and optional material references.
5. Reorder parts; check nonnegative duration and part ownership; preview full agenda.
6. Save draft. **Commit point:** meeting, sections, parts and local outbox records in one SQLite transaction.
7. Return to `/meetings/[id]`, marked `Draft`; the timer is immediately able to load its local program.
8. If the device is the schedule leader, choose `/meetings/[id]/publish`, inspect diff and publish a signed authoritative revision. Otherwise keep draft for leader review.

**Edge paths:** back prompts for unsaved edits; import or another editor changing the base produces a comparison rather than overwriting; duplicate date is warn-and-confirm, not universally forbidden.

### F03 — Assign microphone, timer, sound, and other duties

1. Open `/assignments` or a meeting's roster.
2. Select `Add assignment`, meeting, responsibility, slot and relevant time/part.
3. Choose active person from `/people` directory or add a new one if authorized.
4. System checks role eligibility, availability and overlapping assignments.
5. On conflict, show involved meetings, roles and times; resolve or acknowledge only if policy permits.
6. Save assignment. **Commit point:** assignment plus local `change_records` journal entry transactionally.
7. Draft status appears in local roster; leader can publish the schedule revision.
8. Paired authorized devices later receive the published revision, not timer runtime state.

**Edge paths:** same-name people remain distinct IDs; inactive person blocked from new assignment by default; unknown time interval displays `Overlap not fully evaluated` rather than claiming no conflict.

### F04 — Start and operate a meeting timer

1. Open `/timer`; select meeting and agenda part from locally saved records.
2. Review configured duration, warning thresholds and manual/automatic mode.
3. Press Start; timer state moves `Ready → Running`, storing its monotonic start reference locally.
4. Display updates from elapsed-time calculations. Pause/resume and next/previous obey valid state transitions.
5. Select Fullscreen → `/timer/fullscreen`; request keep-awake while screen is active if preference enabled.
6. At zero, overtime/alert behavior follows the selected policy. In automatic mode, only approved transition rules run.
7. Exit fullscreen without stopping the countdown; finishing or resetting a session requires deliberate controls.

**Edge paths:** networking failure does nothing to countdown. Foreground/background and device reboot recovery must be explicit and tested. On unexpected restart, display recovered checkpoint and operator action, not a potentially false precise remaining time.

### F05 — Import a downloaded meeting workbook PDF

1. Meetings → `Import` → `/imports/source` → choose PDF through Android document picker.
2. Read the selected document into an app-controlled temporary space only as needed; calculate a content hash.
3. `/imports/parse` performs local extraction and produces structured candidates and diagnostics. No meeting rows change.
4. `/imports/preview` displays meeting dates, sections, songs, prayers, part titles/durations, parser warnings and collisions with existing records.
5. User edits uncertain fields, chooses create/update/skip for each meeting and reviews replacement of manually edited values.
6. Confirm. **Commit point:** accepted meetings/parts/provenance and journal records stored atomically.
7. `/imports/result` summarizes imported, updated, skipped and unresolved items; open resulting meeting.

**Edge paths:** scanned-only files may be unsupported without on-device OCR; encrypted/corrupt PDFs are rejected; canceled import deletes staging; duplicates are deduplicated by source identity plus explicit user choices rather than title matching alone.

### F06 — Retrieve a supported online meeting program

1. Meetings → `Retrieve online` → `/imports/source`.
2. Check internet availability and whether a **permitted, validated** source adapter exists.
3. User selects supported publication/language/week; download only public program content, not private assignment data.
4. Normalize online response to the same `import_candidates` contract used by PDF import.
5. Review/diff → confirm → atomic commit → result.

**Edge paths:** no source permission/adapter → clear disabled state with PDF/manual alternatives; offline/timeout → retry later, keep local records; changed source version → compare before applying. No undocumented JW.org API dependency assumed.

### F07 — Pair two devices and give schedule-reading access

1. On administrative device, Settings → Devices → `Pair device`.
2. Target Android device enters `Join trusted device` onboarding/pair route.
3. Establish local discovery or manual QR invitation, exchange public keys and verify displayed fingerprints/short code using user confirmation.
4. Administrative device chooses the requested congregation scope and minimal permissions (`schedule.read` initially).
5. Both parties approve a short-lived, authenticated pairing session.
6. **Commit point:** trusted peer identities and scoped grants stored transactionally on each device; relevant authorization proof distributed.
7. Target syncs only permitted published schedule and assignment records and displays the accepted revision.

**Edge paths:** reused/expired QR, mismatched fingerprint, wrong congregation, unauthorized inviter, interrupted handshake and revoked devices produce explicit rejection. Pairing does not upload data to the cloud.

### F08 — Publish and sync schedule edits

1. Editor modifies a local draft in `/meetings/[id]/edit` or `/assignments/[id]/edit`.
2. SQLite persists the domain change and local journal in one transaction; UI marks pending publication.
3. Current leader examines incoming drafts and the base-revision diff.
4. Leader accepts/merges allowed changes, passes validation, then publishes revision `N+1` with parent `N` and active leadership proof.
5. Peer opens `/sync` or local discovery triggers an authorized sync; both authenticate and compare accepted revisions.
6. Peer validates signature, parent chain, grants, schema and record invariants, then applies changes atomically.
7. Peer updates accepted revision and shows `Up to date` with a meaningful revision timestamp.

**Edge paths:** interrupted transfer resumes from last committed revision; stale base or concurrent edits enter `/sync/conflicts/[id]`; a disconnected device keeps drafts; revocation stops future sync. Never overwrite local edits silently, and never treat a received timer state as schedule data.

### F09 — Transfer publishing leadership

1. Existing leader opens `/devices/leadership` and selects target trusted device.
2. Review target grants, recent revision, pending conflicts and connectivity.
3. Start an explicit signed transfer; target confirms and verifies the term and parent head.
4. **Commit point:** accepted new `leadership_terms` authority changes with a unique increasing term number and transfer proof.
5. Old leader relinquishes publish authority. Devices later learn the new term during sync.

**Edge paths:** offline target, incomplete proof or competing terms → halt publication and show recovery path; never automatically elect another leader during partition. Lost-leader recovery remains an unresolved governance decision.

### F10 — Resolve a schedule conflict

1. `/sync` shows a conflict badge and lists affected records.
2. Open `/sync/conflicts/[id]`; inspect local value, accepted published value and common ancestor/base.
3. Choose `Keep local as unpublished draft`, `Accept published version`, or `Edit merge draft` if permitted.
4. Validate changed meeting/assignments and current leader term.
5. **Commit point:** resolution record and resulting draft or accepted revision updated transactionally.
6. Only leader then publishes an authoritative new revision; peers synchronize it.

**Edge paths:** device lacks `schedule.draft` → read-only explanation; deletion/edit conflict keeps tombstone history; stale conflict view reloads latest revision before confirming.

### F11 — Create encrypted backup and move to another device

1. Settings → Backups → `/backups/export`.
2. Select permitted data categories, encrypted format, destination and strong passphrase.
3. Export a consistent SQLite snapshot and versioned manifest; omit Android Keystore private keys.
4. Encrypt and integrity-check the resulting file, then hand it to Android file sharing/document storage by explicit user action.
5. Receiving device opens `/backups/restore`, selects file, supplies passphrase and previews included congregation, schema version, time and records.
6. User chooses safe restoration mode; **commit point:** validated staging and atomic database swap or safeguarded migration with rollback strategy.
7. Require re-pairing/re-authorization where device identity has changed.

**Edge paths:** wrong passphrase, tampered file, unsupported future schema, insufficient space and conflicting newer local records → abort or present safe options; never silently overwrite or transfer device private keys.

### F12 — Edit or cancel an assignment after publication

1. Leader/editor opens meeting roster → specific assignment.
2. Change person, responsibility or status. The app presents previous values and any conflicts.
3. Save as a new draft, retaining published history.
4. Leader reviews diff and publishes a subsequent revision.
5. Paired devices receive and validate updated records; the schedule and agenda stay coherent even if a timer is running locally.

**Edge paths:** viewer cannot edit; change referencing inactive/deleted person is rejected; stale version triggers conflict review; cancellation is a status/tombstone change, not hard deletion.

## 5. Interaction contracts and consistency rules

### 5.1 Write path and authoritative sources

```text
User input
  → screen/form state (temporary, Zustand only when useful)
  → application use case
  → permission + schema + domain invariants
  → SQLite transaction (domain rows + change journal)
  → commit event / query invalidation
  → fresh database-backed screen projection
  → optional leader publish / peer sync
```

- **SQLite** is the only durable authoritative source for meetings, people and assignments.
- **Timer domain engine** is the runtime source of truth for elapsed time; optional local checkpoints support conservative recovery. It is not part of schedule sync.
- **Zustand** holds UI presentation state, navigation filters, in-progress form values and nonauthoritative indicators; it must not maintain a conflicting schedule database.
- **Import candidates** remain staged until an explicit user approval and ACID commit.
- **Sync** applies only authenticated, authorized published revisions, preserving local drafts/conflicts separately.

### 5.2 Domain invariants reflected in screens

1. An assignment's part, when provided, must belong to its referenced meeting.
2. A timed part's duration must be nonnegative; zero-time/untimed semantics are explicit.
3. Only the active authorized leader publishes schedule revisions.
4. Missing or stale base revisions trigger conflict handling, not last-write-wins.
5. Deleting/deactivating a person does not erase historical assignments.
6. Publishing requires a valid agenda and enforceable configured assignment policies.
7. Importing never automatically overwrites manually edited fields.
8. Network connectivity is never a prerequisite for an active timer or reading saved programs.
9. Pairing, sync and restore verify integrity and identity before changes are committed.
10. A device without a relevant grant cannot access a privileged route's data through deep linking or background requests.

### 5.3 Status vocabulary (consistent across screens)

| Label | Meaning | Presentation guidance |
|---|---|---|
| `Draft` | Local unpublished edits | Local edit icon plus readable description |
| `Pending` | Awaiting leader review/publish or sync | Explain which step is pending |
| `Published` | Authoritative revision on leader | Show revision identifier when relevant |
| `Up to date` | Peer accepted current known revision | Show last verified sync time; do not claim worldwide freshness |
| `Offline` | No usable online/source or peer transport | Explain which function remains available |
| `Conflict` | Divergent records/terms need review | Text status + link to comparison |
| `Revoked` | Device no longer authorized | No further network access |
| `Unsupported` | Source/document cannot be processed | Safe alternatives and reason |

## 6. Navigation, accessibility, security and error standards

### 6.1 Mobile-first visual hierarchy

- Use a bottom tab bar with five main destinations; no nested horizontal tab crowding on small Android devices.
- Each screen exposes one obvious primary action; secondary actions use concise menus where appropriate.
- Lists support empty-state guidance, searching/filtering where meaningful, and predictable back navigation.
- Timer remains readable in portrait and landscape, at large type scales, with non-color status text.
- Long programs and rosters use virtualized lists with stable keys and accessible ordering.
- Actions changing persistent records expose explicit `Save`, `Publish`, `Restore`, `Revoke`, or `Cancel` labels.

### 6.2 Accessibility acceptance gates

- Target applicable WCAG 2.2 AA outcomes and Android TalkBack behavior.
- Minimum preferred touch area 48 × 48 dp, accessible name/role/value/state, focus restoration after navigation.
- Honor large system fonts (test 200% text scale), adequate contrast, reduced motion, landscape use and error summaries.
- Never represent conflicts, elapsed/remaining time, sync status, or required fields with color only.
- Use accessible countdown announcements sparingly (threshold changes, pause/resume/complete), not every rendering tick.
- If fullscreen hides system bars, provide clear reversible exit action and validate Android gestures and assistive access.

### 6.3 Least-privilege and privacy UX

- Disabled privileged actions display meaningful restrictions when safe; inaccessible data is not fetched for display.
- Device grant changes and revocations require deliberate confirmation; no cloud account is implied.
- Private data should not appear in crash logs, debug telemetry or insecure exported files.
- Any Android permissions are requested contextually when the related feature is used.
- Export/restore flow uses encrypted backups and should avoid exposing private encryption secrets in UI history.

### 6.4 Failure states and recovery

| Situation | Screen response | Safe user action |
|---|---|---|
| Empty congregation | Explain no meetings exist | Create meeting or import PDF |
| Meeting not found | Show missing/cancelled explanation | Back to Meetings |
| Read-only device | Show view-only access | Return to list; request appropriate pairing/grant via administrator |
| No internet for online source | Keep local records usable | Import PDF or enter manually |
| No LAN during sync | Pending status with local change retention | Retry when peers are reachable |
| Corrupt/unsupported PDF | Preserve database unchanged | Choose other file or manual entry |
| Duplicate or overlapping assignment | Show affected records and severity | Change role/time/person or policy-approved override |
| Import conflicts with manual edits | Diff each affected field | Explicit keep/replace/skip |
| Competing leaders | Freeze publication, preserve drafts | Authorized leadership recovery procedure |
| Invalid backup | No destructive write | Retry another file |
| App restart during timer | Show conservative checkpoint and uncertainty | Resume/restart/abandon based on approved recovery policy |
| Migration/DB integrity issue | Recovery state, no wipe-by-default | Verify backup; restore with consent |

## 7. Phase-to-screen delivery map

| Phase | Screens / journeys | Exit gate |
|---|---|---|
| **0 Feasibility** | Clickable route map, timer orientation mock, pairing and PDF import spike prototypes | Navigation, Android native capabilities, a11y and security assumptions evaluated |
| **1 Foundation** | Bootstrap, Welcome, Setup, Home, tabs, Settings, empty states | Offline startup and navigation tests, schema migration integrity |
| **2 Meetings + timer** | Meetings list/new/detail/edit/parts, Timer, Fullscreen, Timer Settings | Create/modify meeting offline and operate manual/approved automatic timer reliably |
| **3 People + scheduling** | Assignments, assignment form/edit, People directory/forms, meeting roster | Eligibility/conflicts, permission checks, transactional writes |
| **4 Backup** | Backup index/export/restore, first-run restore | Encrypted export and tamper-safe restore tested |
| **5 Imports** | Import source/parse/preview/result, source provenance in program detail | Offline PDF review, safe commit, online adapter only if permitted |
| **6 LAN device sync** | Device list/pair/detail, Leadership, Sync, Conflict review, Publish/History | Authenticated trust, scoped grants, signed revisions, conflict-safe convergence |
| **7 Release hardening** | All screens, TalkBack/contrast/large-text, device loss/recovery states | Stable APK/AAB, accessibility and end-to-end regression acceptance |

## 8. Screen and flow testing plan

### 8.1 Unit / domain tests

- Field validation for dates, meeting types, timed durations and assignment role eligibility.
- Timer state transitions and monotonic elapsed-time math; automatic transition policy matrix.
- Permission decision table for viewer/editor/leader/admin roles.
- Import diffs preserving manually edited fields; conflict classifications.
- Navigation state helpers, form dirty-state and status mapping.

### 8.2 Integration tests

- Create/edit/reorder meeting parts in a single SQLite transaction and verify rollback on failure.
- Assignment save with journal entry and stale-version rejection.
- PDF parse candidates → review → transactional import.
- Backup staged restore with bad password/schema and unchanged prior state.
- Peer trust, grant enforcement, signed schedule revision and interrupted transfer resume.

### 8.3 Android end-to-end journeys

1. Clean install → offline onboarding → create Midweek meeting → close and reopen → data persists.
2. Create Weekend program → operate timer → fullscreen → screen awake → exit without losing session.
3. Add people and assign microphone/sound/timer roles → trigger collision → resolve and save.
4. Import test PDF → correct title/duration → commit → verify agenda and provenance.
5. Two Android devices pair → leader publishes → peer syncs schedule while timers stay independent.
6. Editing on two devices offline → reconnect → conflict review → leader publishes valid revision.
7. Export encrypted backup → restore on another test device → verify data and required re-pairing.
8. Toggle airplane mode during every core workflow; only online and live LAN actions fail gracefully.
9. Enable TalkBack, increase font scale, rotate device, and exercise hardware/system Back throughout.
10. Revoke pairing → rejected future sync; attempt privileged deep link → denied.

## 9. Unresolved UX/domain decisions

These must be decided before their dependent screens are considered final. They do **not** block preparation of screen wireframes or early offline features.

| ID | Decision required | Affected screens / flow | Provisional behavior |
|---|---|---|---|
| UX-01 | Android minimum version and tablet expectations | All, fullscreen | Responsive phone-first layouts; test tablets as additional form factor |
| UX-02 | Supported program languages | Setup, import, meetings | Configurable locale with English baseline |
| UX-03 | Automatic timer transitions including zero-time parts and overtime | Timer, settings, F04 | Explicit user-selected policy; never assume silent auto-advance |
| UX-04 | Background/restart timer recovery | Timer, F04 | Conservative checkpoint, operator confirmation |
| UX-05 | Assignment overlapping times with unknown durations | Assignments, F03 | Warn `not fully evaluated`; prevent silent approval |
| UX-06 | Which device grants manage people versus schedule edit | People, assignments, devices | Separate permission scopes; no implicit escalation |
| UX-07 | Whether a non-leader editor submits a draft to leader over LAN or by file | Publish, sync, F08 | Preserve draft pending transport approval |
| UX-08 | Lost-leader recovery / quorum policy | Leadership, F09 | No automatic election; freeze publishing on conflict |
| UX-09 | Officially permitted online program access and update cadence | Import, F06 | Conditional feature; PDF and manual always work |
| UX-10 | PDF languages, scanned documents, OCR requirement | Import, F05 | Native-text PDF extraction first; explicit unsupported status |
| UX-11 | Backup encryption and recovery-key UX | Backup, F11 | Encrypted passphrase file; key never logged |
| UX-12 | Multiple congregation profiles | Setup, Settings, Meetings | One active congregation initially; future extension |
| UX-13 | Exact duration/meeting-part defaults for future workbook changes | Meeting templates, Timer | Configurable templates; source metadata retained |
| UX-14 | Leader publication UI for partial updates and privacy scopes | Publish, Sync | Atomic revision with authorized payload filter |

## 10. Acceptance checklist for SCREEN_FLOWS.md

- [x] Five-tab Android navigation, route map and hierarchy established.
- [x] Every screen specifies a path, purpose, components, actions, permissions and states.
- [x] Onboarding, creation, editing, import, timer, people/assignment, pairing, publication, sync, conflict, backup and restore flows documented.
- [x] Local timer and schedule synchronization remain independent.
- [x] Offline-first, no-login, PoLP, ACID and single-source-of-truth boundaries mapped to interactions.
- [x] Accessibility, errors, destructive-action safeguards and deep-link guards covered.
- [x] Phase-to-screen delivery order and testing journeys supplied.
- [ ] Unresolved decisions reviewed and approved by project owner.
- [ ] Wireframes and component interaction prototypes validated on Android devices.

**Next design deliverable:** Wireframes and UI component specification, using these navigation and action contracts. Application coding should begin only after Phase 0 feasibility decisions and relevant security constraints are validated.


## Home and navigation redesign — 2026-11-22

The approved redesign adds Home, Meetings, Assignments, Timer, and Settings
tabs. Internal tab names are Home, Meetings, Assignments, Timer, and
SettingsTab. Existing root Settings and MeetingPrograms routes remain
available for compatibility.

Home selects the earliest local program dated today or later using the
congregation profile time zone. Programs sharing a date use an identifier
tie-break. Selection refreshes on focus, foreground, and local midnight.

Home shows actual part count, timed duration, and filled technical-duty
slots for that program. Filled slots do not imply eligibility approval.
Received schedules remain separate and open through their existing reader.

Opening a program opens its existing editor. No timer starts automatically.
Sync, backup, trust, and publication rules are unchanged.

Source application and owner verification must be reported separately.

## Meetings redesign — 2026-11-22

Meetings supports Midweek/Weekend filtering and Monday-based week
navigation. Initial week selection uses the congregation profile time
zone. A validated YYYY-MM-DD date selects its containing week.

Every matching local program remains selectable. Selection survives
editor visits. Data reloads on focus, foreground, and explicit retry.
Empty weeks remain visible instead of silently jumping to another week.

Program sections retain saved titles and part order. Expandable cards
show every part and identify untimed items. Program totals include every
part but sum duration only for timed parts.

Create and Edit retain their existing editor behavior. Open timer retains
the existing timer-loading and recovery flow; it never starts timing
automatically. Received schedules remain separate.

Source applied; owner typecheck, tests, and device verification pending.

## Timer presentation redesign — 2026-11-22

The Timer tab presents existing program-management and current-timer
entry actions using shared themed components.

The session screen shows large countdown digits, current status,
elapsed/allotted progress, current and next parts, and expandable
access to the virtualized program agenda. Controls remain scrollable
when large text requires more space.

Progress reads existing monotonic timer state and caps at 100 percent.
It never advances, starts, resets, or otherwise changes the timer.

Start/Pause/Resume, Next/Finish, confirmed Restart, recovery choices,
part menus, snapshot editing behavior, and fullscreen exit retain their
existing handlers. Keep-awake remains limited to active fullscreen
presentation when enabled.

Recovery choices remain explicit. Backgrounding and navigation keep
their existing pause/checkpoint behavior. No timer state is synchronized.

Source applied; owner typecheck, tests, and device verification pending.

## Assignments presentation redesign — 2026-11-22

Assignments and Manage assignments share meeting-week navigation and
single-meeting selection. Initial week selection uses the congregation
profile time zone. Multiple meetings remain individually selectable.

Each selected meeting displays exactly four cards: Mic Server,
Sound Operator, Laptop Operator, and Microphone Adjuster.

The Assignments tab remains read-only. Edit and publisher-management
actions remain exclusive to Manage assignments. Received schedules
retain their separate trusted-reader entry.

All meetings and publishers are loaded and reviewed before display-week
filtering. Filtering must never hide cross-week overlap, missing or
inactive publisher, eligibility, duplicate-duty, or unverifiable-time
warnings.

Meetings and Assignments share the existing validated date dialog through
MeetingWeekPicker. Data refreshes on focus, foreground, and explicit retry.

Source applied; owner typecheck, tests, and device verification pending.

## Settings presentation redesign — 2026-11-22

Both Settings entry routes use the same grouped Settings view.

Groups are General, Programs, Connections, Backups, and Diagnostics.
Existing navigation callbacks remain owned by useSectionScreen.
No setting changes, checks, transfers, or permission grants execute merely
by opening Settings.

Appearance displays the active preference: System, Light, or Dark.
Existing development-only visibility for Design preview is preserved.

Unrecognized actions remain accessible under Other tools rather than
being silently omitted.

Source applied; owner typecheck and device verification pending.

## Profile and publisher presentation — 2026-11-22

Profile setup and editing use shared themed fields and cards.
Validation, review-before-save, conflict handling, and unsaved-change
confirmation retain their existing hooks and handlers.

Publisher search remains virtualized. Empty data, no filter matches,
inactive publishers, loading, and errors retain distinct presentation.

The publisher editor exposes only the four existing technical duties.
Saving, reload confirmation, revision conflicts, and discard protection
retain their existing behavior.

No database schema, assignment eligibility, or synchronization rule changes.
Source applied; owner typecheck, tests, and device verification pending.

## Meeting and duty editor presentation — 2026-11-22

Meeting editor styling resolves the current appearance palette.
Shared themed inputs, radio choices, buttons, and timing toggles retain
the existing form model and handlers.

Section and part ordering, removal confirmation, duration validation,
save conflicts, and unsaved-change protection remain unchanged.

The four-duty editor uses themed cards and a virtualized eligible-publisher
list. Assign, clear assignment, reload, and return actions retain their
existing handlers and checks.

The shared MeetingField also themes workbook-import fields.
The separate legacy part-assignment editor is not changed by this batch.

Source applied; owner typecheck, tests, and device verification pending.

## Import and received-schedule presentation — 2026-11-22

Workbook selection, extraction, candidate review, and extracted-page
previews use themed presentation. PDF limits, warnings, candidate
confirmation, and editor navigation retain their existing handlers.

Received-device lists and schedule details use themed cards.
Trust checks and separate read-only received copies remain unchanged.

The shared received-schedule preview also updates within LAN and Sync
screens. Their surrounding screens remain scheduled for later redesign.

Source applied; owner typecheck, tests, and device verification pending.

## Device and Sync presentation — 2026-11-22

Device identity, pairing, permissions, LAN, discovery, and Sync views
use shared themed document styles and buttons.

Existing trust checks, full fingerprint comparison, grants, fixed-leader
adoption, proposal review, publishing confirmations, and cancellation
handlers remain unchanged.

QR helpers retain existing scan bounds and camera lifecycle behavior.
Opening a screen never grants trust or initiates publishing.

Source applied; owner typecheck, tests, and device verification pending.

## Backup and diagnostic presentation — 2026-11-22

Backup forms and backup/sync storage-check results use themed document
styles and buttons. SQLite diagnostics use shared themed cards.

Password masking, preview, restore confirmation, post-restore restart,
and explicit diagnostic execution retain their existing handlers.

Source applied; owner typecheck and device verification pending.

## Remaining presentation states — 2026-11-22

Profile loading and error states follow the resolved appearance palette.
Retry retains its existing handler.

The legacy part-assignment editor receives themed presentation only.
No route, supported duty, or permission is added. Existing selection,
validation, save, and discard handlers remain unchanged.

Source applied; owner typecheck, tests, and device verification pending.

## Import-first program entry — 2026-11-22

Meetings opens WorkbookImport instead of creating a blank local program.
Existing programs remain editable. PDF candidates still require review
and explicit saving through the existing editor.

Midweek import compares printed minute values with imported timed parts.
Missing or mismatched values and unexpected song counts produce warnings.
Unprinted durations are never invented. Review remains necessary for titles,
order, column extraction, and missing content.

WOL retrieval and Weekend import are separate pending batches.
Source applied; owner typecheck, tests, and device verification pending.

## Watchtower PDF review — 2026-11-22

The existing local PDF importer lists study candidates from the supported
Waray Watchtower layout. Selecting a candidate opens confirmation fields
for the article title, three song numbers, meeting date, and local start time.

The congregation profile supplies the scheduling timezone. Missing profile
data blocks review. The printed study week is displayed for comparison;
it does not determine the actual meeting date or start time.

Opening song requires local confirmation. Missing or ambiguous study songs
remain blank. A valid preview contains five timed parts totaling 105 minutes:
opening song 5, Public Talk 30, middle song 5, Watchtower study 60,
and closing song 5.

Opening the existing editor does not save. Its existing validation,
duplicate protection, and explicit Save action remain responsible for
persistence. Leaving a staged review or replacing its PDF requires
discard confirmation.

Source metadata adds the watchtower-v1 parser identifier. Existing PDF
identifiers remain supported. Older app builds cannot read the new
Watchtower source identifier in local drafts or restored backups.
Local PDF provenance remains excluded from shared schedules.

Source applied; owner verification pending.

## English Watchtower PDF support — 2026-11-22

The existing importer recognizes the supplied English and Waray layouts.
Contents headings determine program language. English uses SONG headers;
Waray uses KARANTAHON. Missing or ambiguous song numbers remain unassigned.

Both languages use the same review form, saved congregation timezone,
105-minute program builder, PDF provenance, duplicate protection,
and explicit editor save. No database migration is required.

Source applied; owner verification pending.


## PDF import checkpoint closed — 2026-11-22

Status: complete based on owner-reported verification.

The owner reported completing typecheck, targeted tests, and device checks
for the supplied English and Waray Watchtower PDFs, including study
detection, song pairs, language, and the 105-minute review preview.

The owner also reported completing saved-program timer checks:
five parts, explicit Start/Next, continued overtime at zero, and offline
operation. Test-device backup/restore retained title, songs, and timezone.

The agent did not run tests, builds, or device checks.
Earlier pending statements remain historical checkpoints.

Scope: supported local PDF layouts. Direct online retrieval remains deferred.

## Assignment and device-sharing retirement: batch 1

Per ADR 0006, active navigation retains Home, Meetings, Timer, and Settings.
Assignment, publisher, device-management, received-schedule, and sync
screens are unregistered. Their Home and Settings entry points are removed.

Home shows meeting details, part count, and timed duration.
Existing meeting import, editor, timer, appearance, profile, and backup
flows remain registered.

Retired source files and legacy route declarations remain temporarily
for the next removal batch. This checkpoint does not claim complete
source or dependency removal.

Source applied; owner verification pending.

## Assignment retirement: shared dependency separation

The owner reported completing batch 1 navigation checks.

Meeting-week calculation moves into the meeting domain. Retired assignment
code temporarily re-exports that function. Home no longer reads or exposes
assignment counts.

Historical sync codecs and types move into domain/legacy. Backup capture
and restore use legacySyncBackup directly. Temporary exports at the old
sync paths keep remaining retired feature files typecheckable.

Backup versions, validation, restoration rules, migration history, and
stored data are unchanged. Some historical validators still depend on
assignment/device helpers; compatibility extraction precedes their deletion.

Feature-source deletion remains pending.
Source applied; owner verification pending.

## Assignment retirement: UI source removal

The owner reported completing the shared-dependency separation checks.

This batch removes 51 retired assignment, publisher, device, pairing,
received-schedule, and sync UI files, including their screens, components,
hooks, and dedicated styles.

Navigation types now contain only registered screens and the four retained
tabs. Assignment section metadata and its temporary action-map entry
are removed.

The dutyOverview utility remains temporarily because its existing test
imports it. Backend feature removal, historical-validator extraction,
native networking removal, dependency cleanup, and obsolete-test cleanup
remain pending.

Stored data, migration history, and legacy backup compatibility are preserved.

Source applied; owner verification pending.

## Assignment retirement: historical validator separation

The owner reported completing the UI source-removal checks.

Historical publisher, duty, device-fingerprint, shared-schedule, and overlap
validation is owned by legacy compatibility modules. Temporary re-exports
preserve remaining retired callers.

Backup publisher reads and duty decoding use legacyStoredRecords directly,
without importing publisher or duty CRUD repositories. Existing validation,
error behavior, backup formats, transactions, and stored data are preserved.

Remaining assignment-dependent meeting-editor constraints are addressed
during backend retirement. This batch preserves their existing behavior.

Backend/native feature deletion and final dependency cleanup remain pending.
Source applied; owner verification pending.

## Assignment retirement: backend and native sharing removal

The owner reported completing historical-validator separation checks.

This batch removes 64 retired backend/bootstrap, utility, string, and test
files, plus the native device-identity module. Active assignment editing,
publisher management, pairing, permissions, received-schedule delivery,
synchronization, LAN transport, and their native adapters are removed.

Historical publisher, shared-schedule, overlap, and sync-format tests point
directly at legacy compatibility modules. Live synchronization mutation
tests are retired; historical document-chain validation remains covered.

Meeting conflict safeguards move to legacyMeetingConflictCheck.
Existing assignment-linked meeting-edit restrictions remain until a
separate preservation-safe data change addresses those links.

Backup encryption, local PDF extraction, migration history, stored data,
and legacy backup capture/restore are preserved.

Unused camera/QR dependencies, remaining obsolete labels, and final
documentation reconciliation remain pending. Rebuild the Android app
to remove the native sharing module from the installed application.

Source applied; owner verification pending.

## Assignment retirement: dependency and label cleanup

Removed the unused camera hook, Expo camera plugin, camera and QR
packages, and retired Home and Settings labels. Updated the npm lockfile.

Legacy backup compatibility and historical assignment safeguards remain.
Owner verification pending.

## Assignment retirement: meeting edits

Retired technical duties no longer block rescheduling. When a program part
is removed, its assignment rows move to the existing legacy archive within
the meeting save transaction. Schema and backup formats are unchanged.
Owner verification pending.

## Assignment and device-sharing retirement closed — 2026-11-26

The owner reported completing typecheck, tests, the Android rebuild,
and the Backup checks diagnostic for meeting edits and restore.

Retired duties no longer block rescheduling. Removing a program part
archives its assignment records in the same save transaction.
Existing databases and backup formats remain compatible.

Earlier pending notes record the status at each batch.

## Fullscreen timer layout update - 2026-11-27

Fullscreen places the current part title above a larger centered countdown,
subject to the current-part visibility preference. Compact Start/Pause/Resume
and Restart controls sit below it. A small list icon opens the timer picker;
selection stays disabled while running. The picker retains Finish program
for the final part. A small exit icon sits in the top-right corner.
All controls retain at least 48 dp touch targets.

The standard Timer view retains its layout. Fullscreen size, color, progress,
per-part elapsed time, restart, and recovery behavior remain supported.
The Settings preview uses the same fullscreen face. No rotation control is added.
Owner typecheck and Android portrait/landscape verification remain pending.

## Estimated meeting finish update - 2026-11-27

The finish estimate follows the live projection described in the
[JW Time manual](https://jwtime.github.io/jwtime/en/manual.html#schermata-principale).
It remains visible while paused and ready between parts. It stays fixed
during a normal running countdown and uses the active and later parts'
remaining durations, including saved elapsed time. While a part is paused,
its elapsed time stops but the finish moves later with the pause duration.
Waiting to start another part also moves the finish later. Running overtime
extends the finish without reducing later parts' allotted time.
Resume continues the projection without adding the pause twice.
Completion freezes the final estimate; loading another program creates a
fresh estimate. Formatting remains time-only in the program/profile time zone.
Owner regression tests, typecheck, and Android verification remain pending.

## Agenda: reset all timers - 2026-11-27

The agenda offers Reset all timers while paused, ready, or completed.
Confirmation reloads the program currently saved in Meetings, restores
its allotted durations, clears elapsed history for every part, and selects
the first timer in Ready. Saved meeting records remain unchanged.
A practice program resets to its current allotted durations.
Cancellation or an unavailable saved meeting preserves session progress.
The existing checkpoint save path persists the reset; save failures retain
the previous session through its existing recovery behavior.
Owner typecheck and Android verification remain pending.

## Local PDF automatic timer import - 2026-11-27

Selecting a local workbook or supported English/Waray Watchtower study PDF
now extracts, validates, and saves its complete weekly programs automatically.
There is no extracted-text review, song/date form, or Meeting Editor step.
The importer reports saved, already-saved, and incomplete/failed weeks.
Open Meetings selects a saved program; timers can be edited there as usual.

Midweek uses the same completeness checks, song durations, and counsel
timers as online import. Weekend shares the online layout: opening song,
30-minute public talk, study song, 60-minute Watchtower study, closing song.
The opening song remains unnamed when the publication does not specify it.
Watchtower study dates use the printed year; workbook dates use the original
publication filename. The local profile supplies the time zone.
Incomplete dates/songs/durations are reported without guessing.
Existing programs of the same week, type, and language are preserved.
Each save uses the existing transactional MeetingService path.
Leaving during extraction prevents subsequent saves. Online import continues
to use website content only. PDF selection/extraction stays local.
Owner typecheck, parser/service tests, and Android verification remain pending.

## Meetings calendar popup - 2026-11-27

Tapping the meeting week opens a calendar popup instead of a date text field.
The popup shows a Monday-first month grid, previous/next month controls,
and the selected day. Show this week applies that day's existing week
selection; Cancel and Android Back close without changing the selected week.
Calendar dates remain independent of UTC/device time conversions.
The popup supports portrait/landscape scrolling and 48 dp day targets.
No new native dependency or Android rebuild is required for this UI change.
Owner typecheck, calendar tests, and device verification remain pending.

## Home cards for online and PDF imports - 2026-11-27

Home treats programs without a scheduled start time as weekly programs.
Their Monday date identifies the week, so they remain eligible throughout
that week in the profile time zone. This applies equally to WOL, PDF,
Midweek, and Weekend programs. Past scheduled meetings and previous-week
programs remain excluded. Existing card counts, timed duration, and
Open program routing use the selected saved meeting as before.
Owner typecheck, Home regression tests, and Android verification remain pending.
