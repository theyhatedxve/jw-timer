# JW Meeting Timer — Technical Implementation Plan

**Navigation/source update (2026-11-21):** [ADR 0003](adr/0003-react-navigation-and-source-layout.md) supersedes earlier Expo Router and features/infrastructure path references. The current TypeScript/React Navigation layout is documented in [DIRECTORY_STRUCTURE.md](DIRECTORY_STRUCTURE.md). Domain, SQLite, timer, privacy and security constraints remain applicable. Runtime verification of this migration is pending.

**File:** `TECHNICAL_PLAN.md`  
**Version:** 1.0 (planning baseline)  
**Date:** 2026-11-20  
**Status:** Proposed technical plan, not implementation approval  
**Platform:** Android only  
**Primary stack:** React Native, Expo development builds, TypeScript (strict), SQLite

## 1. Executive architecture decision

**Owner decision update (2026-11-20):** [ADR 0001](adr/0001-timer-operation-and-test-device.md) governs timer transitions and recovery: explicit Start for every part, overtime until operator advance, and confirmed checkpoint recovery. It supersedes provisional automatic-transition choices below. Primary test hardware is owner-reported Honor 600 5G / Android 17; minimum and target SDK remain undecided. See the [Phase 0 readiness plan](superpowers/plans/2026-11-20-phase-0-readiness.md) for pending checks.

Build a **single offline-first Android application** with a **front-end presentation layer** and an **on-device back-end (application/domain/data/integration layers)**. A hosted server is **not required**. Devices exchange *meeting programs, schedules, people, and assignments* using authenticated peer-to-peer communication over a local Wi-Fi network or encrypted manual file transfer. **Live timer state does not synchronize.** Each installed app maintains its own SQLite store. One authorized device is the *active schedule publishing leader* for a congregation profile. Other paired devices may read revisions and, if permitted, create unpublished drafts.

This architecture honors the approved requirements: manual entry, optional permitted online meeting source retrieval, locally imported PDFs, Midweek and Weekend Meeting programs, manual/automatic timing, full-screen display, screen awake, local assignments for timer operators, microphone attendants, sound operators, and other roles, no account login, and secure local backup and restore.

**Distinction:** The proposed architecture is a design decision, not proof of a stable unofficial JW.org or KHMS integration. The KHMS and JW Time sites are UX/workflow references. Their internals, APIs, licenses, and reuse permissions require evaluation before any integration.

## 2. Non-negotiable engineering principles

| Principle | Enforced by | Verification |
|---|---|---|
| Mobile-first and a11y | Android adaptive layouts, scalable text, semantic labels, focus order, minimum 48dp targets, contrast ≥4.5:1 for normal text, non-color indicators | TalkBack/manual audits, automated a11y checks, small/large screen tests |
| SOLID | Domain contracts, ports/adapters, dependency inversion, interfaces defined by consumers | Dependency rule checks, code review, unit tests |
| DRY | Shared domain rules and validators, common design tokens/components | Lint rules, review, duplicate-domain-logic checks |
| KISS | Vertical feature slices, no server, no speculative distributed infrastructure | Architectural decision records (ADRs), scope review |
| Composition over inheritance | Stateless feature components, composable services and hooks | Review rules |
| ACID | SQLite foreign keys, exclusive transactions for related writes, committed change journal, schema migrations | Transaction rollback/concurrency/integrity tests |
| Single source of truth | SQLite for persisted data, timer engine for active timer state, Zustand for transient UI state only | Repository integration tests and state audit |
| Principle of least privilege | Scoped device grants, permission checks at every sync command, no sensitive data in logs | Authorization matrix and negative security tests |
| Secure by default | LAN sync off until pairing, encrypted authenticated links, encrypted portable backups, explicit import review, no analytics/cloud upload by default | Threat model, release security checklist |

**Accessibility target:** WCAG 2.2 AA where applicable, translated to Android accessibility semantics and Material guidance. UI shall remain operable with large fonts and TalkBack. Timer warnings require labels/patterns or text, not color alone.

## 3. Layered architecture and deployment topology

```
Android device
┌──────────────────────────────────────────────────────┐
│ FRONTEND: Expo Router screens, reusable UI, a11y     │
│ React Query-like read hooks / reactive SQLite reads  │
│ Zustand: transient screen/session preferences        │
├──────────────────────────────────────────────────────┤
│ APPLICATION: typed use cases and command handlers   │
│ validation, authorization, unit-of-work, orchestration│
├──────────────────────────────────────────────────────┤
│ DOMAIN: entities, policies, timer state machine,     │
│ assignment conflict rules, revision semantics       │
├──────────────────────────────────────────────────────┤
│ ON-DEVICE BACKEND / INFRASTRUCTURE                   │
│ SQLite repositories + migrations + change journal   │
│ file/PDF adapter | online import adapter             │
│ LAN peer transport | cryptography | backup/restore   │
└──────────────────────────────────────────────────────┘
         ↕ authenticated LAN only / encrypted file transfer
    Other paired Android device(s), each with local SQLite
         ↘ optional outbound fetch of public meeting content

No persistent hosted application backend and no cloud database.
```

**Frontend** means Android screens and presentation logic. **Backend** means local business logic, database, import and peer networking services, not a Python/Node server. Optional online source retrieval makes network requests only to approved public sources and writes validated data locally following review. Network telemetry and inadvertent third-party analytics must be disabled or omitted.

### 3.1 Package/module dependency rules

- `app/` imports feature UI, never repositories directly.
- `features/*/presentation` imports application use cases and domain read models; no SQL or socket access.
- `features/*/application` imports domain ports; infrastructure injects adapters.
- `features/*/domain` imports only shared pure primitives, never React, Expo or SQLite.
- `infrastructure/*` implements domain contracts; the composition root wires dependencies.
- Feature-to-feature communication goes through published use cases or domain events, not private tables or stores.
- Use an internal typed command/event boundary. No network or in-process HTTP API is needed to connect the app to its local back end.

## 4. Proposed directory structure

```text
jw-meeting-timer/
├── TECHNICAL_PLAN.md
├── README.md
├── docs/
│   ├── adr/                    # architectural decision records
│   ├── threat-model.md
│   ├── data-dictionary.md
│   ├── sync-protocol.md
│   └── release-checklist.md
├── app/                         # Expo Router, Android frontend routes
│   ├── _layout.tsx
│   ├── (tabs)/
│   │   ├── index.tsx            # home
│   │   ├── meetings.tsx
│   │   ├── assignments.tsx
│   │   ├── timer.tsx
│   │   └── settings.tsx
│   ├── meeting/[id].tsx
│   ├── timer/fullscreen.tsx
│   ├── imports/preview.tsx
│   ├── devices/pair.tsx
│   └── backups/index.tsx
├── src/
│   ├── bootstrap/               # dependency composition root, initialization
│   ├── design-system/           # tokens, components, accessibility helpers
│   ├── shared/
│   │   ├── domain/              # IDs, Result, Clock, common errors
│   │   ├── application/         # transaction and permission ports
│   │   └── presentation/        # reusable view hooks
│   ├── features/
│   │   ├── meetings/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   └── presentation/
│   │   ├── timer/{domain,application,presentation}/
│   │   ├── people/{domain,application,presentation}/
│   │   ├── assignments/{domain,application,presentation}/
│   │   ├── imports/{domain,application,presentation}/
│   │   ├── sync/{domain,application,presentation}/
│   │   ├── security/{domain,application,presentation}/
│   │   ├── backups/{domain,application,presentation}/
│   │   └── settings/{domain,application,presentation}/
│   ├── infrastructure/          # local backend implementations
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   ├── repositories/
│   │   │   ├── queries/
│   │   │   └── transaction-manager.ts
│   │   ├── clock/
│   │   ├── pdf/
│   │   ├── network/
│   │   │   ├── public-source/
│   │   │   └── peer-lan/
│   │   ├── crypto/
│   │   ├── files/
│   │   └── android/             # native adapters when required
│   └── state/                   # UI-only Zustand stores
├── assets/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   ├── security/
│   ├── fixtures/                # synthetic meeting and PDF fixtures
│   └── e2e/
├── app.config.ts
├── eas.json
├── package.json
├── tsconfig.json
└── eslint.config.js
```

This is a **single app repository**, not a monorepo of separately deployed front-end and back-end services. If native Android modules are necessary, Expo config plugins and reproducible prebuild configuration will manage them. Generated Android artifacts should not be edited without an ADR.

## 5. Module scaffolding and contracts

| Module | Scaffolding deliverables | Main contract / boundary | MVP? |
|---|---|---|---|
| Bootstrap | DI composition, readiness checks, migrations, error boundary | `initializeApplication` | Yes |
| Design system | Theme/tokens, accessible buttons, fields, timer typography, dialogs | Reusable presentation components | Yes |
| Meetings | Types, template catalog, form, program ordering, repositories | `CreateMeeting`, `EditMeeting`, `PublishMeeting` | Yes (publish local initially) |
| Timer | Pure clock interface, reducer/state machine, display, alert policy | `Start`, `Pause`, `Resume`, `Reset`, `Advance` | Yes |
| People | Directory CRUD, eligibility, active/inactive handling | `UpsertPerson` | Yes |
| Assignments | Role catalog, overlap detection, calendar and rosters | `AssignResponsibility`, `ValidateRoster` | Yes |
| PDF Import | Picker, sandbox file copy, parser, normalized preview, diagnostics | `ParseWorkbook`, `CommitImport` | Later |
| Online Source | Approved source adapter, versioned parser, caching | `FetchPublishedProgram` | Later |
| Security | Identity keys, pairing, scoped grants, revocation | `AuthorizeOperation`, `PairPeer` | Later, before sync |
| Peer Sync | Discovery, authenticated session, revision protocol, conflicts | `ExchangeRevisions`, `AcceptRevision` | Later |
| Backup | Versioned manifest, archive, encryption, dry-run restore | `CreateBackup`, `RestoreBackup` | Yes (initial offline backup) |
| Settings | Congregation profiles, timing preferences, accessibility | `UpdateSettings` | Yes |

### 5.1 Patterns

- **Clean Architecture / Ports and Adapters:** Domain owns interfaces; persistence, online fetch, clock, file import and LAN communication implement them.
- **Repository and Unit of Work:** Transactions coordinate related writes and change journal entries; repositories do not independently commit partial schedule edits.
- **State Machine:** Timer states are `idle`, `ready`, `running`, `paused`, `completed`; transition commands are validated in one pure engine.
- **Strategy:** Manual and automatic transition policies share one timer engine; workbook parsers vary by supported format/language.
- **Adapter:** Public-source and PDF inputs normalize to one internal `MeetingProgramDraft` model.
- **Outbox / change journal:** Local schedule mutations and sync change records share one SQLite transaction.
- **Dependency Injection:** Explicit constructor/function dependencies, not global service locators.
- **Schema validation:** Validate all imported, restored or peer-supplied payloads at boundaries.

Avoid inheritance hierarchies, mirrored business rules in UI, an HTTP server inside the app, and blanket caching of sensitive records outside SQLite.

## 6. Database schema: field specification

**Storage contract:** SQLite, `PRAGMA foreign_keys=ON`, WAL where tested, indexed foreign keys, prepared statements, `NOT NULL` and `CHECK` constraints. UUIDv7 or equivalent generated stable text IDs for synced records. UTC timestamps use integer epoch milliseconds; local meeting dates use ISO `YYYY-MM-DD`, time uses `HH:mm` plus an IANA timezone where relevant. Booleans use `INTEGER CHECK(value IN (0,1))`. `JSON` fields appear only for bounded, validated configuration or metadata, not core relationships.

Common conventions: `id TEXT PRIMARY KEY`, `created_at INTEGER NOT NULL`, `updated_at INTEGER NOT NULL`. Synced mutable entities additionally have `version INTEGER NOT NULL DEFAULT 1`, `deleted_at INTEGER NULL` (tombstone; retain until safe compaction), and `updated_by_device_id TEXT NULL` for audit. FK names below imply foreign key constraints. Only the tables identified as synchronized are included in the peer protocol.

### 6.1 Congregation and profile

**congregations** [synced]: `id TEXT PK`, `name TEXT NOT NULL`, `locale TEXT NOT NULL DEFAULT 'en'`, `timezone TEXT NOT NULL`, `active INTEGER NOT NULL DEFAULT 1`, `created_at`, `updated_at`, `version`, `deleted_at`. One local profile can start with a single congregation; multi-profile UI deferred.

**congregation_settings** [synced]: `id TEXT PK`, `congregation_id TEXT NOT NULL UNIQUE FK`, `weekday_meeting_day INTEGER NULL CHECK(weekday_meeting_day BETWEEN 0 AND 6)`, `weekend_meeting_day INTEGER NULL CHECK(...)`, `default_midweek_start TEXT NULL`, `default_weekend_start TEXT NULL`, `program_language TEXT NOT NULL`, `schedule_conflict_policy TEXT NOT NULL`, `created_at`, `updated_at`, `version`.

### 6.2 Meeting program

**meeting_templates** [local catalog]: `id TEXT PK`, `type TEXT NOT NULL CHECK(type IN ('midweek','weekend','custom'))`, `name TEXT NOT NULL`, `schema_version INTEGER NOT NULL`, `source_kind TEXT NOT NULL`, `is_builtin INTEGER NOT NULL`, `created_at`, `updated_at`.

**meeting_template_parts** [local catalog]: `id TEXT PK`, `template_id TEXT NOT NULL FK`, `sequence INTEGER NOT NULL`, `section_key TEXT NULL`, `title TEXT NOT NULL`, `default_duration_seconds INTEGER NOT NULL CHECK(default_duration_seconds>=0)`, `kind TEXT NOT NULL`, `is_timed INTEGER NOT NULL`, `UNIQUE(template_id,sequence)`.

**meetings** [synced]: `id TEXT PK`, `congregation_id TEXT NOT NULL FK`, `template_id TEXT NULL FK`, `meeting_type TEXT NOT NULL CHECK(...midweek,weekend,custom...)`, `meeting_date TEXT NOT NULL`, `start_local_time TEXT NULL`, `timezone TEXT NOT NULL`, `title TEXT NULL`, `status TEXT NOT NULL CHECK(...draft,published,cancelled,completed...)`, `program_source TEXT NOT NULL CHECK(...manual,pdf,online,template,mixed...)`, `source_revision TEXT NULL`, `created_at`, `updated_at`, `version`, `deleted_at`. INDEX `(congregation_id,meeting_date,meeting_type)`; prevent accidental duplicates at application layer because special meetings may coexist.

**meeting_sections** [synced]: `id TEXT PK`, `meeting_id TEXT NOT NULL FK`, `sequence INTEGER NOT NULL`, `title TEXT NOT NULL`, `section_key TEXT NULL`, `created_at`, `updated_at`, `version`, `deleted_at`, `UNIQUE(meeting_id,sequence)` for active section ordering, implemented with careful reorder transaction strategy.

**meeting_parts** [synced]: `id TEXT PK`, `meeting_id TEXT NOT NULL FK`, `section_id TEXT NULL FK`, `sequence INTEGER NOT NULL`, `kind TEXT NOT NULL CHECK(...song,prayer,talk,study,comments,custom,other...)`, `title TEXT NOT NULL`, `duration_seconds INTEGER NOT NULL CHECK(duration_seconds>=0)`, `is_timed INTEGER NOT NULL`, `song_number TEXT NULL`, `material_reference TEXT NULL`, `notes TEXT NULL`, `source_item_key TEXT NULL`, `manually_edited INTEGER NOT NULL DEFAULT 0`, `created_at`, `updated_at`, `version`, `deleted_at`; indexes `(meeting_id,sequence)`, `(section_id,sequence)`.

**program_references** [synced only if needed]: `id TEXT PK`, `meeting_part_id TEXT NOT NULL FK`, `reference_kind TEXT NOT NULL`, `label TEXT NOT NULL`, `uri TEXT NULL`, `source_id TEXT NULL`, `created_at`, `updated_at`. Do not download/copy copyrighted study material unless permitted.

### 6.3 People, roles, scheduling

**people** [synced, sensitive]: `id TEXT PK`, `congregation_id TEXT NOT NULL FK`, `display_name TEXT NOT NULL`, `sort_name TEXT NULL`, `is_active INTEGER NOT NULL DEFAULT 1`, `notes TEXT NULL` (discouraged), `created_at`, `updated_at`, `version`, `deleted_at`; index `(congregation_id,display_name)`. No phone/email required by default.

**responsibility_types** [synced]: `id TEXT PK`, `congregation_id TEXT NOT NULL FK`, `code TEXT NOT NULL`, `label TEXT NOT NULL`, `category TEXT NOT NULL`, `requires_eligibility INTEGER NOT NULL DEFAULT 0`, `is_active INTEGER NOT NULL DEFAULT 1`, `created_at`, `updated_at`, `version`, `deleted_at`; unique `(congregation_id,code)` for active records. Seeds include microphone attendant, sound operator, timer operator, chairperson, speaker, reader, and custom.

**person_eligibilities** [synced]: `id TEXT PK`, `person_id TEXT NOT NULL FK`, `responsibility_type_id TEXT NOT NULL FK`, `eligible INTEGER NOT NULL`, `created_at`, `updated_at`, `version`, `deleted_at`; unique active `(person_id,responsibility_type_id)`.

**person_unavailability** [synced, optional]: `id TEXT PK`, `person_id TEXT NOT NULL FK`, `starts_at INTEGER NOT NULL`, `ends_at INTEGER NOT NULL`, `reason_code TEXT NULL`, `created_at`, `updated_at`, `version`, `deleted_at`, `CHECK(ends_at>starts_at)`. Avoid sensitive free-form reasons.

**assignments** [synced, sensitive]: `id TEXT PK`, `meeting_id TEXT NOT NULL FK`, `meeting_part_id TEXT NULL FK`, `responsibility_type_id TEXT NOT NULL FK`, `person_id TEXT NOT NULL FK`, `slot_label TEXT NULL`, `starts_at INTEGER NULL`, `ends_at INTEGER NULL`, `status TEXT NOT NULL CHECK(...draft,confirmed,cancelled...)`, `notes TEXT NULL`, `created_at`, `updated_at`, `version`, `deleted_at`; indexes `(meeting_id,responsibility_type_id)`, `(person_id,starts_at,ends_at)`; validate optional part belongs to same meeting via transaction/domain rule; reject overlap by policy, not an impossible simple UNIQUE constraint.

### 6.4 Import provenance

**import_jobs** [local only]: `id TEXT PK`, `kind TEXT NOT NULL CHECK(...pdf,online,manual...)`, `source_name TEXT NOT NULL`, `source_uri TEXT NULL`, `content_sha256 TEXT NULL`, `parser_id TEXT NULL`, `parser_version TEXT NULL`, `state TEXT NOT NULL CHECK(...queued,parsing,review,committed,failed,cancelled...)`, `diagnostics_json TEXT NULL`, `started_at INTEGER`, `completed_at INTEGER NULL`, `created_at`, `updated_at`.

**import_candidates** [local only]: `id TEXT PK`, `import_job_id TEXT NOT NULL FK`, `candidate_type TEXT NOT NULL`, `normalized_payload_json TEXT NOT NULL`, `confidence REAL NULL CHECK(confidence BETWEEN 0 AND 1)`, `approved INTEGER NOT NULL DEFAULT 0`, `created_at`, `updated_at`. Validate structure before use; delete staging after retention period.

**source_links** [synced for program provenance]: `id TEXT PK`, `meeting_id TEXT NOT NULL FK`, `meeting_part_id TEXT NULL FK`, `source_kind TEXT NOT NULL`, `source_document_key TEXT NULL`, `source_item_key TEXT NULL`, `imported_at INTEGER NOT NULL`, `source_hash TEXT NULL`, `created_at`, `updated_at`. Store provenance, not full copyrighted publication text.

### 6.5 Device identity, authorization, revisions, synchronization

**devices** [local trust registry; trusted subset shared by protocol]: `id TEXT PK`, `display_name TEXT NOT NULL`, `public_key TEXT NOT NULL`, `key_fingerprint TEXT NOT NULL UNIQUE`, `trust_state TEXT NOT NULL CHECK(...pending,trusted,revoked...)`, `paired_at INTEGER NULL`, `revoked_at INTEGER NULL`, `last_seen_at INTEGER NULL`, `created_at`, `updated_at`. Private keys are stored by Android Keystore, never in this table.

**device_grants** [trusted shared authority]: `id TEXT PK`, `congregation_id TEXT NOT NULL FK`, `device_id TEXT NOT NULL FK`, `permission TEXT NOT NULL` (e.g., `schedule.read`, `schedule.draft`, `schedule.publish`, `devices.manage`, `backup.export`), `granted_by_device_id TEXT NOT NULL FK`, `grant_revision_id TEXT NULL`, `expires_at INTEGER NULL`, `revoked_at INTEGER NULL`, `created_at`, `updated_at`; unique active `(congregation_id,device_id,permission)`.

**leadership_terms** [synced authority metadata]: `id TEXT PK`, `congregation_id TEXT NOT NULL FK`, `term_number INTEGER NOT NULL`, `leader_device_id TEXT NOT NULL FK`, `activated_at INTEGER NOT NULL`, `ended_at INTEGER NULL`, `transfer_proof TEXT NOT NULL`, `created_at`, `updated_at`; unique `(congregation_id,term_number)`. Conflicting active terms are quarantined; offline peers must not self-elect without agreed recovery policy.

**schedule_revisions** [synced]: `id TEXT PK`, `congregation_id TEXT NOT NULL FK`, `parent_revision_id TEXT NULL FK`, `leadership_term_id TEXT NOT NULL FK`, `publisher_device_id TEXT NOT NULL FK`, `revision_number INTEGER NOT NULL`, `payload_hash TEXT NOT NULL`, `signature TEXT NOT NULL`, `published_at INTEGER NOT NULL`, `created_at`, `updated_at`; unique `(congregation_id,leadership_term_id,revision_number)`.

**change_records** [local outbox + replicated journal]: `id TEXT PK`, `congregation_id TEXT NOT NULL FK`, `entity_type TEXT NOT NULL`, `entity_id TEXT NOT NULL`, `operation TEXT NOT NULL CHECK(...upsert,delete...)`, `base_version INTEGER NULL`, `new_version INTEGER NOT NULL`, `payload_json TEXT NOT NULL`, `author_device_id TEXT NOT NULL FK`, `schedule_revision_id TEXT NULL FK`, `state TEXT NOT NULL CHECK(...draft,published,applied,conflict...)`, `created_at`, `updated_at`; indexes `(congregation_id,state,created_at)`, `(entity_type,entity_id)`.

**sync_peers** [local only]: `id TEXT PK`, `device_id TEXT NOT NULL UNIQUE FK`, `last_accepted_revision_id TEXT NULL FK`, `last_connected_at INTEGER NULL`, `status TEXT NOT NULL`, `created_at`, `updated_at`.

**sync_conflicts** [local only]: `id TEXT PK`, `congregation_id TEXT NOT NULL FK`, `entity_type TEXT NOT NULL`, `entity_id TEXT NOT NULL`, `local_change_id TEXT NULL FK`, `remote_change_id TEXT NULL FK`, `reason TEXT NOT NULL`, `resolution TEXT NULL`, `resolved_at INTEGER NULL`, `created_at`, `updated_at`.

**sync_sessions** [local only]: `id TEXT PK`, `peer_device_id TEXT NOT NULL FK`, `started_at INTEGER NOT NULL`, `finished_at INTEGER NULL`, `result TEXT NOT NULL`, `received_count INTEGER NOT NULL DEFAULT 0`, `sent_count INTEGER NOT NULL DEFAULT 0`, `error_code TEXT NULL`, `created_at`, `updated_at`. Keep technical diagnostics free of personal data.

### 6.6 Timer and user/device preferences

**timer_presets** [local configurable]: `id TEXT PK`, `congregation_id TEXT NULL FK`, `name TEXT NOT NULL`, `warning_seconds INTEGER NOT NULL`, `critical_seconds INTEGER NOT NULL`, `overtime_mode TEXT NOT NULL`, `auto_advance_policy TEXT NOT NULL`, `created_at`, `updated_at`.

**timer_sessions** [local only]: `id TEXT PK`, `meeting_id TEXT NULL FK`, `meeting_part_id TEXT NULL FK`, `mode TEXT NOT NULL CHECK(mode IN ('manual','automatic'))`, `state TEXT NOT NULL`, `duration_ms INTEGER NOT NULL`, `elapsed_before_run_ms INTEGER NOT NULL`, `started_monotonic_ms INTEGER NULL` (process-scoped), `checkpoint_wall_time_ms INTEGER NULL`, `recovery_state TEXT NULL`, `created_at`, `updated_at`, `ended_at INTEGER NULL`. A monotonic baseline is invalid across process restart; use explicit conservative recovery policy.

**app_preferences** [local only]: `key TEXT PRIMARY KEY`, `value_json TEXT NOT NULL`, `updated_at INTEGER NOT NULL`; keys limited by typed schema, including UI theme, default timer view, keep-awake preference, accessibility preferences.

**backup_manifests** [local history only]: `id TEXT PK`, `format_version INTEGER NOT NULL`, `db_schema_version INTEGER NOT NULL`, `created_at INTEGER NOT NULL`, `content_sha256 TEXT NOT NULL`, `encrypted INTEGER NOT NULL`, `file_display_name TEXT NOT NULL`, `restore_status TEXT NULL`.

**schema_migrations** [local only]: `version INTEGER PRIMARY KEY`, `checksum TEXT NOT NULL`, `applied_at INTEGER NOT NULL`.

### 6.7 Database invariants and deletion policy

- Use `ON DELETE RESTRICT` for parent entities with historical assignments, plus tombstones for records that sync. Do not cascade-delete people with linked assignments.
- Transactions must include both actual data mutation and `change_records` insertion.
- Test SQLite `withExclusiveTransactionAsync()` or equivalent documented exclusive writes for atomic multi-step operations. Do not assume non-exclusive async transactions isolate unrelated queries.
- Use `PRAGMA integrity_check`, foreign-key checks, migration backup/restore tests, and idempotent replay verification.
- Never sync timer sessions, private keys, raw backup keys, local cache metadata, or parsed temporary files.
- Retain minimal audit metadata, with an explicit policy for tombstone compaction once all active trusted peers acknowledge the revision.

## 7. Data flow, state management, querying and caching

### 7.1 Write path

`Screen → typed command → input validation → authorization → domain policy → SQLite exclusive unit-of-work (entity mutation + change journal) → reactive query invalidation → screen update`.

Only the active schedule publisher may create *published* revision records. Offline draft edits on authorized followers remain `draft`, and the leader reviews or accepts them before publication. Conflict resolution never silently discards either version.

### 7.2 Read path

`SQLite query/projection → repository observable/query hook → presentation view model → screen`. SQLite is the authoritative cache for meetings, people and assignments. Define indexes for the month calendar, meeting program parts, and person rosters. Avoid duplicating durable data in Zustand. Pagination for long histories.

### 7.3 Timer state

The in-memory timer engine is the authority for the *currently active* countdown. It calculates elapsed time from a monotonic clock and stored elapsed duration, not accumulated JavaScript interval ticks. UI animation frames repaint the current value. Persist only safe recovery checkpoints. On restart, ask the operator to resume/restart or follow a preapproved recovery rule; never trust a stale monotonic timestamp across process lifetime.

### 7.4 Network online source policy

`Connectivity available → explicitly requested/approved refresh → adapter fetch → TLS and source validation → bounded local document cache → parse/normalize → diff against edited local records → user review → atomic commit`. Suggested default is on-demand retrieval with a 24-hour metadata freshness hint (configurable, not a guarantee). ETag/Last-Modified if source supports it. Apply timeouts, retry with capped backoff, size limits, and verified parser versions. Never automatically overwrite local edits or send private assignment data to public sources. Online source integration remains gated by permission/feasibility verification.

### 7.5 PDF import policy

`Android document picker → copy into app sandbox → verify magic bytes, size and file access → extract native PDF text locally → parse language/template variant → produce candidate rows + confidence and diagnostics → human review → diff/merge → transactional commit`. Scanned PDFs without an on-device OCR adapter yield an actionable unsupported/partial-extraction response. Do not upload PDFs for parsing.

### 7.6 Local schedule synchronization

`Discover LAN peer → mutual identity verification → establish authenticated encrypted session → exchange authorized congregation IDs + revision metadata → verify signatures and expected parent → transfer minimal change payloads → validate permissions/schema → apply atomically → acknowledge revision → update peer checkpoint`. Use a versioned protocol and strict replay/idempotency checks. LAN discovery broadcasts no personal names or assignments. Peer discovery and receive service are inactive until explicitly enabled and paired.

**Offline partition rule:** Followers can retain local drafts but cannot declare authoritative publication. The designated leader can publish locally while isolated; a second disconnected device cannot simultaneously become leader without an explicit, verifiable recovery/transfer procedure. If branches conflict, stop auto-merge and surface a reconciliation workflow.

### 7.7 Cache ownership and invalidation

- SQLite: canonical programs, schedules, people, grants, revision journal.
- Temporary import cache: bounded local sandbox file and parser staging rows, cleared after completion/retention deadline.
- Remote metadata cache: public source response metadata and hashes only, never uploaded private data.
- Zustand: transient filters, selected IDs, UI panel state, non-authoritative draft input until submit.
- Timer engine: active countdown state, separate from the database cache and schedule sync.
- Invalidate reactive queries only after successful transaction commit, restore, migration or accepted peer revision.

## 8. Security and privacy threat controls

| Threat | Control |
|---|---|
| Unauthorized device reads assignments | Mutual authentication, explicit pairing approval, scoped `schedule.read` grant |
| Impersonated leader / replayed revision | Device signatures, term number, parent revision checks, nonce/replay protection |
| Tampered LAN packet | Authenticated encryption; verify all inbound payloads |
| Lost phone | Android storage protections, protected Keystore secrets, revoke future sync access; cannot remote-wipe offline data |
| Backup theft | Passphrase-based authenticated encryption, random salt, memory-hard KDF where supported, validated manifest; never include device private key |
| Import payload abuse | PDF/document size limits, schema validation, parser timeout/memory safeguards |
| Excessive permissions | Ask only for Android capabilities needed; disable discovery until requested; no contacts/location permissions unless justified and disclosed |
| Data leakage | No cloud sync, analytics, crash-report upload, or remote logging by default; local redacted diagnostics |
| Malicious restore | Version/checksum/authentication checks, dry run, backup existing DB, atomic replace |
| Role escalation | Permission check both on sending and receiving sync operations; grants signed/authorized |

**Privacy qualification:** Optional online publication fetch and optional remote build tooling contact external services for their explicit functions. They are not application data synchronization. Production builds must be reviewed for dependency telemetry. Device-to-device sync is limited to authorized LAN peers or explicit manual transfer.

## 9. UX and accessibility information architecture

Primary screens: **Home**, **Meetings**, **Assignments**, **Timer**, **Settings**. Secondary flows: program editor, people directory, import wizard, pairing/trust manager, backups, and fullscreen timer.

- **Home:** next meeting, local schedule state, upcoming assignments; no requirement to be online.
- **Meetings:** calendar/list switch, Midweek/Weekend filter, program editing, import entry.
- **Assignments:** person view, role view, schedule collision indicators, draft/published badge.
- **Timer:** accessible mode selector, loaded part, remaining/over time, pause/resume/advance, fullscreen/keep-awake.
- **Settings:** profiles, language, timer preferences, peer pairing, encryption and restore, permissions.

Accessibility gates: font scaling to at least 200% without hiding essential actions, TalkBack accessible names and status announcements, usable portrait and landscape timer views, 48dp minimum targets, keyboard/focus behavior where supported, reduced-motion behavior, proper empty/disabled/error states, and WCAG 2.2 AA contrast targets where applicable.

## 10. Sequenced implementation backlog

Phases are ordered by dependency, not fixed calendar time. Every phase has a completion gate.

### Phase 0 — Feasibility, decisions and security baseline

- Confirm Android min SDK/target SDK and supported physical devices.
- Prototype native Expo development build, foreground monotonic timing, immersive fullscreen, keep-awake and orientation.
- Verify SQLite exclusive transaction behavior; test schema migration and WAL.
- Evaluate PDF extraction on sample *lawfully obtained* workbook PDFs in target language(s).
- Inspect legal and technical viability of approved public online program source.
- Evaluate trusted LAN discovery and native networking dependencies in Expo development builds.
- ADRs: Android targets, PDF parser, transport, key storage, encryption format, timer automatic-transition rules, restart recovery.
- Threat model and no-telemetry dependency review.

**Exit gate:** Critical native integrations are proven on Android hardware; unknowns explicitly classified as feasible, deferred or blocked.

### Phase 1 — Foundation and accessible navigation

- Expo/TypeScript strict, lint, format, CI, test runner, signed development builds.
- Design tokens and semantic reusable components; navigation.
- SQLite bootstrap, migrations, permission-denied and failure UI, repository/unit-of-work abstraction.
- Synthetic fixtures, feature module boundaries, CI dependency rules.

**Exit gate:** Offline app boots and migrations/tests pass on clean and upgraded installs; TalkBack smoke test passes.

### Phase 2 — Meetings and timer MVP

- Meeting templates, sections, parts, duration editor, custom parts.
- Deterministic timer engine, manual controls, configurable automatic policy.
- Fullscreen presentation, warning/overtime text + visuals, screen awake.
- App background/foreground and process-death recovery behavior.

**Exit gate:** One full Midweek and one Weekend program run offline; timer drift within agreed test threshold and no crash across lifecycle tests.

### Phase 3 — People and scheduling MVP

- People CRUD, responsibility catalog, eligibility, assignments, calendars.
- Overlap validation, missing-assignment feedback, schedule editing and statuses.
- Local authority profile, read/draft/publish permission policy in preparation for sync.

**Exit gate:** Users build, edit and view rosters fully offline; conflicting assignments are surfaced.

### Phase 4 — Backup and restore hardening

- Versioned encrypted backup, explicit export/import through Android document picker.
- Backup integrity, passphrase recovery guidance, restore dry-run, migration compatibility.
- Manual device-transfer workflow via securely transferred backup file.

**Exit gate:** Full offline dataset restores correctly on a second device; corruption, wrong key and outdated schema tests preserve current data.

### Phase 5 — Workbook ingestion and online source

- PDF picker/parser candidate model, confidence/diagnostics, preview and merge.
- Public source adapter only if permitted and technically stable.
- Source provenance, duplicate detection, imported vs manually edited precedence.

**Exit gate:** Supported PDFs import locally without private uploads; unsupported/scanned PDFs fail safely; remote source absence does not break core app.

### Phase 6 — Trusted devices and LAN schedule sync

**Implementation status (2026-11-21):** The owner approved and applied the bounded [ADR 0005](adr/0005-trusted-publishing-and-phase-6.md) batch, resolving D-05 through D-08 for same-Wi-Fi, explicit fixed leader, reviewed follower proposals and content-only restore with fresh authority approval. QR/NSD, signed stable-ID snapshots, queues/receipts and conflict preservation are implemented in source. [Owner checks](PHASE_6_OWNER_CHECKS.md) remain pending; this is not verified Phase 6 completion. Phase 7 is on hold for owner redesign.

- Keystore device keys, QR-assisted pairing, verified trust, grants/revocation.
- LAN discovery/session authentication, protocol versioning, snapshots and change log.
- Single leader publishing, follower drafts, signed revisions, conflict quarantine.
- Local sync progress and readable recovery actions.

**Exit gate:** Two or more devices exchange schedules and assignments offline on LAN; timer state stays independent; untrusted devices are rejected.

### Phase 7 — Hardening, usability and production release

- Android device matrix testing; a11y audits; timer stress/rotation/sleep tests.
- Restore/sync interoperability, database integrity, security review, performance profiling.
- User instructions, privacy statement, third-party license review, release signing.
- Reproducible APK for private installation and optional AAB if distribution through Google Play is chosen.

**Exit gate:** Release checklist passes, signing keys protected, tested backup/restore and rollback plan documented.

## 11. Testing strategy

| Test level | Focus | Examples / pass criteria |
|---|---|---|
| Static | Lint, strict TS, schema validation, dependency rules | No any-escape paths in business contracts, no infrastructure imports from domain |
| Unit | Pure meeting/scheduling/timer logic | Boundary times, pauses, overtime, transitions, assignment collisions, role eligibility |
| Property-based | Invariants across generated event sequences | Elapsed never decreases while running; revision replay idempotent; no orphan assignment |
| Integration | SQLite transaction, query, migrations, file/PDF adapter | Rollback on mid-write failure; FK invalid write rejected; reopen persistence |
| Contract | Peer protocol and external-source parsers | Reject incompatible version, unsigned payload, invalid schema, duplicate revision |
| Security | Pairing, authz, integrity and restore | Untrusted reads denied; revoked grant denied; tampered backups fail authentication |
| E2E | Physical Android workflows | Build a program, time parts, fullscreen, import, schedule, backup/restore, pair/sync |
| Accessibility | TalkBack, scale, contrast, targets | Full timer workflow without visual cues, large font and landscape |
| Performance | Timer drift and dataset responsiveness | Foreground drift target ±1 sec over 60 min; test against monotonic reference |
| Resilience | Network partition, process kill, low battery/storage | No DB corruption or silent overwrite; clear user recovery paths |

**Test fixtures:** synthetic people names and congregation profiles, licensed or independently created PDF-like samples, deterministic clocks, randomized network partition schedules. No real congregation personnel in CI or public repositories.

**Device matrix proposal:** oldest approved Android version, common midrange phone, small phone, large phone/tablet, slow storage and reduced memory; all on device (not solely emulator). CI includes unit/integration and build validation; manual device release checklist includes pairing and offline recovery.

## 12. Deployment and packaging

1. **Development:** Expo development builds, not Expo Go, for native pairing/network/cryptography and immersive screen adapters. Lock versions, review npm dependency provenance, and use a controlled `eas.json` build profile.
2. **Private distribution:** Signed **APK** for direct Android installation/testing. Verify installer integrity and supply trusted distribution instructions.
3. **Optional Google Play:** Signed **AAB** for Play submission if selected later. Keep app data local even if build tooling or a store hosts binaries.
4. **Build privacy:** Prefer local builds for sensitive/restricted environments; never bundle private schedules, device keys or actual backups into build artifacts. EAS cloud builds are optional tooling and distinct from runtime cloud data storage.
5. **Signing and upgrades:** Protect release signing key, increment versionCode, test schema upgrade from every supported prior version, maintain rollback/export support as practical.
6. **Updates:** Use signed release distributions and explicit versioned migrations; disable automatic runtime remote JavaScript update mechanisms unless reviewed and approved under privacy policy.
7. **Permissions:** Audit the Android manifest after build. Request only justified permissions (network, network-state, relevant local peer capabilities or document-picker access), avoiding broad file and location access where possible.
8. **Release validation:** Full offline acceptance, data-safe migration, encrypted backup round trip, no unexpected network domains, no production debug endpoints, accessibility pass, and license/attribution review.

## 13. Assumptions, constraints, deferred and out of scope

### Confirmed constraints

- Android only; offline-first; local SQLite canonical records.
- No user login or mandatory hosted database.
- Device sync is for **schedule/assignment records**, **not live countdown**.
- Multiple authorized editors with **one active schedule publishing leader**.
- Local manual backup/restore and device transfer.
- Manual meeting entry, optional online meeting program retrieval, and local PDF import.
- Full program: songs, prayers, study reference fields, custom items; preserve modified entries.
- Manual and automatic timer modes, fullscreen and keep-awake.

### Working assumptions (require decision/validation)

- Single congregation profile in the MVP, with schema allowing future multi-profile support.
- Initial locale English, extensible localization for workbook PDFs.
- Local Wi-Fi peer connectivity for automated sync; separate manual encrypted export works without LAN.
- Permission roles and grants are device-level, not person login identities.
- QR pairing requires explicit human verification and cryptographic key exchange.
- Automatic timer does **not** auto-start the next part until the configured policy allows it.
- Direct online JW.org integration is neither assumed supported nor guaranteed. No scraping workaround is approved by default.
- Imported PDF parser supports text-based known layouts first. On-device OCR deferred.
- Privacy-first telemetry: disabled by default.

### Explicitly out of scope for initial release

- iOS, web, Windows and desktop versions.
- Cloud databases, hosted identity service, phone-number/email accounts, remote internet-based cross-network synchronization.
- Real-time countdown synchronization, remote controlling another device's timer, smart display or Bluetooth presentation control.
- Automatic microphone/audio hardware control, JW Library app modification or unofficial internal API access.
- Uploading copyrighted workbook documents to third-party PDF/AI parsing services.
- Automatic OCR for all scanned PDFs, arbitrary language templates, or guarantees of perfect PDF extraction.
- Automatic leadership election across disconnected network partitions.
- Full KHMS source-code integration without documented interface, license and explicit approval.

## 14. Open decisions and change control

| ID | Decision needed | Impact |
|---|---|---|
| D-01 | Minimum Android API level and device range | Dependencies, permission behavior, QA |
| D-02 | Supported workbook language(s), PDF samples | Parser design and localization |
| D-03 | Automatic timer advance/start rules, overtime behavior | State machine and operator safety |
| D-04 | Timer process-death recovery: pause, resume estimate or confirmation | Clock/session design |
| D-05 | Local network types permitted: same Wi-Fi only, hotspot, Wi-Fi Direct | Transport implementation |
| D-06 | Leader handover and lost-leader recovery approval process | Split-brain defense |
| D-07 | Can followers edit and request leader approval? | Authorization/workflow |
| D-08 | Backup key recovery and device migration ceremony | Data loss and confidentiality |
| D-09 | Online source legal/technical feasibility | Feature availability |
| D-10 | Private APK distribution only or Play Store too | Release procedure |
| D-11 | Number of congregation profiles and minimum collected personal fields | Data model and privacy |

Any new requirement modifying these decisions receives an ADR, migration impact assessment, updated tests, and changed acceptance gate. **Do not begin synchronization protocol implementation before D-05 through D-08 are resolved.**

## 15. Definition of done

A feature is done only when its typed use cases, schema changes (if any), SQLite transactions, failure handling, privacy/security controls, accessible UI, automated tests and offline behavior are verified. Production release additionally requires signing, upgrade/migration validation, backup restore on a clean device, release APK inspection, and an audited network/permission footprint.

## 16. Reference materials for validation

- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Expo KeepAwake: https://docs.expo.dev/versions/latest/sdk/keep-awake/
- Expo Android APK: https://docs.expo.dev/build-reference/apk/
- Expo Play Store submission: https://docs.expo.dev/submit/android/
- KHMS reference: https://jezzar042015.github.io/khms/
- JW Time user manual: https://jwtime.github.io/jwtime/pt_BR/manual.html

**Next approval gate:** Review this plan and resolve Phase 0 architecture decisions before generating application source code.
