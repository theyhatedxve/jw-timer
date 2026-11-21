# JW Meeting Timer — System Design Specification

**Navigation/source update (2026-11-21):** [ADR 0003](adr/0003-react-navigation-and-source-layout.md) supersedes earlier Expo Router and features/infrastructure path references. See [DIRECTORY_STRUCTURE.md](DIRECTORY_STRUCTURE.md). No schema, stored-data format or permission changes are introduced by this source migration; runtime verification remains pending.

**File:** `SYSTEM_DESIGN.md`  
**Version:** 1.0 (design baseline)  
**Date:** 2026-11-20  
**Status:** Proposed; pending approval of open decisions  
**Related:** `TECHNICAL_PLAN.md`, JWMT-SRS-001, JWMT-SAD-002

## 1. Purpose and boundaries

**Phase 6 source update (2026-11-21):** [ADR 0005](adr/0005-trusted-publishing-and-phase-6.md) records approved fixed authority, stable-ID datasets, preserved proposals/conflicts and draft-only restore in fresh scopes. Migration 9 adds bounded `local_sync_documents` aggregates: one SQLite CAS transaction commits accepted snapshot, signed ancestry, journal and receipt work. Legacy draft tables/v1 copies remain preserved. The normalized sync catalog below remains a proposed expansion of this bounded implementation. Owner runtime verification is pending.

**Owner decision update (2026-11-20):** [ADR 0001](adr/0001-timer-operation-and-test-device.md) resolves Q-03, the overtime portion of Q-04 and the confirmation requirement in Q-05. Every part needs Start; zero retains the current part in overtime until operator advance; process-death recovery requires confirmation. This supersedes conflicting provisional timer defaults below. Exact checkpoint mechanics and other open questions remain pending.

This design describes the real-world workflows, target offline Android workflows, data model, business invariants, transaction and authorization boundaries, and unresolved decisions for **JW Meeting Timer**.

**Confirmed scope:** Android-only, React Native + Expo development builds + strict TypeScript, SQLite as persistent source of truth, offline timer (manual/automatic, immersive display, keep awake), Midweek/Weekend meeting programs, manual/PDF/approved-online program entry, people/role assignments, local backup/transfer, and encrypted local-network synchronization of **schedules and assignments** between trusted devices. A single designated device publishes authoritative schedule revisions. **Live timer state is not synchronized.** No user account or mandatory cloud service exists.

**Terminology:** “On-device backend” means application services, domain policies, adapters, and SQLite repositories inside the Android app. It does **not** mean a deployed Python/Node server. “Sync” means passing authorized records across nearby paired devices, not mirroring a running timer.

**Relationship to references:** JW.org publications are prospective sources of public meeting material, subject to permitted technical access. KHMS and JW Time are workflow/UI references, not dependencies or licensed integrations by default.

## 2. Actors, assets, and responsibilities

| Actor | Real-world activity | Authorized digital capability |
|---|---|---|
| Schedule leader device | Coordinates final rosters | Publish signed authoritative schedule revisions, approve follower drafts |
| Schedule editor device | Prepares program and assignment changes | Create/edit local unpublished drafts, submit for leader review |
| Timer operator | Operates timing during meeting | Start/pause/resume/advance local timer; no schedule publishing implied |
| Schedule viewer device | Checks assignments | Read authorized schedule and person summary; no edits |
| Device administrator | Oversees device participation | Initiate/approve pairing, grant/revoke scoped permissions, manage local backup |
| Speaker / microphone attendant / sound operator / reader / chairperson | Receives an assignment | Represented as a **person** in the directory, not automatically an app user |

An individual may perform several real-world duties. **No human identity authentication** is in scope, so permissions are attached to a trusted **device**, and access to an unlocked authorized device inherits its permissions. This residual risk must be documented and mitigated through device screen-lock recommendations and optional local action confirmation, without claiming person-level accountability.

### 2.1 Data classification

- **Public/reference:** meeting program metadata, publication references, official downloadable program structure when legally retrieved.
- **Congregation-private:** person names, role eligibility, availability, assignments, unpublished drafts, leadership records.
- **Secret:** device private keys, backup passphrases and derived keys; never transfer or persist raw in SQLite/logs.
- **Local transient:** active countdown, partial parse candidates, network discovery metadata, UI state.

## 3. Real-world business workflows versus digitized workflows

### 3.1 Meeting program preparation

| Step | Current real-world practice (illustrative; confirm locally) | Target digital flow |
|---|---|---|
| Obtain program | Review official Midweek workbook and Weekend arrangements or notes | Import a saved PDF, fetch supported approved public content, or enter manually |
| Structure parts | Prepare paper/spreadsheet agenda with songs, prayers, sections and times | Create `meeting`, ordered `meeting_sections`/`meeting_parts`, optional references |
| Customize | Annotate local changes on the agenda | Edit local draft; tag edited fields to resist accidental reimport overwrite |
| Verify | Operator or coordinator checks the agenda | Preview normalized import/diff; validation; explicit confirmation |
| Finalize | Share a final paper or message | Leader publishes a numbered, signed schedule revision |

**Target flow:** `Select date/type → Choose template/manual/PDF/online → Normalize to draft → Review/diff → Transactional save → Leader publish → Local distribution`.

### 3.2 Scheduling responsibilities

| Step | Current real-world practice (illustrative) | Target digital flow |
|---|---|---|
| Maintain roster | Names and eligibility remembered or tracked in lists | Local people directory + responsibility catalog + eligibility rules |
| Prepare assignments | Coordinator selects people and dates | Create assignment slots for sound, microphones, timer, reader, etc. |
| Detect clashes | Manually notice multiple overlapping duties | Validate time overlaps, unavailability, duplicate slots, inactive/unsuitable people |
| Communicate | Hand out/screenshot/forward schedule | Publish once on leader; authenticated local peer sync or encrypted file transfer |
| Modify | Coordinator communicates replacement | Draft change, review, publish new revision, retain audit metadata |

**Target flow:** `Choose meeting → Select responsibility/part/slot → Choose eligible person → Check conflicts → Save draft → Publish → Peer verification/acknowledgment`.

### 3.3 Operating the meeting timer

| Step | Real-world | Target digital flow |
|---|---|---|
| Prepare | Read printed timing program | Load saved program into local timer |
| Begin | Manually start a stopwatch/timer | Start manual or approved automatic timing policy |
| Operate | Watch clock and adjust as speakers change | Pause/resume/skip/reset/advance locally; show remaining time/overtime |
| Display | Place stopwatch where operator sees it | Optional immersive fullscreen; screen awake during presentation |
| Finish | End the session | End session, clear wake lock, optionally save local checkpoint/history |

**No live device-to-device countdown mirroring.** Automatic advance **does not imply automatically starting the next speaker** until transition policy is approved.

### 3.4 Synchronizing assignments without cloud

**Real-world:** A revised roster gets circulated, and old copies remain on other phones.  
**Target:** Pair devices in person, assign device capabilities, publish an immutable signed revision, exchange changes over mutually authenticated encrypted LAN sessions, atomically apply or quarantine conflicts, show last accepted revision/time. Offline peers retain readable prior data and pending drafts. No access to a LAN? Use an encrypted versioned manual transfer.

### 3.5 Backup, loss, and recovery

**Real-world:** Paper, spreadsheets, or chat history are manually recopied after a phone change.  
**Target:** Create encrypted versioned backup via Android document picker, copy securely, inspect a dry-run summary and compatibility report, then restore transactionally with safeguards. Hardware-backed private device identity **is not copied**; the restored phone must obtain new keys and be paired again.

## 4. Technology and runtime topology

| Concern | Choice | Design reason |
|---|---|---|
| Android UI | React Native + Expo development build + TypeScript strict | Native Android features with maintained cross-feature component system |
| Routing | Expo Router | Screens/navigation separated from domain logic |
| Design system | Semantic components, tokens, a11y helpers | WCAG 2.2 AA intent, TalkBack, 48dp targets, font scaling |
| Persistent data | SQLite (`expo-sqlite`, verify native behavior) | ACID, FKs, indexes, fully offline |
| UI/transient state | Zustand | Navigation filters, unsaved form controls, presentation preferences only |
| Read models | Reactive SQLite repository queries or thin query-cache adapter | SQLite stays authoritative, invalidate after commit |
| Domain/application | Pure TypeScript entities, use cases, policy services | SOLID, KISS, testable business rules |
| Timer | Pure state machine + monotonic clock adapter | Elapsed independent of dropped interval callbacks |
| PDFs | Android picker + on-device extraction adapter | No private PDF upload; preview before write |
| Online retrieval | Opt-in public source adapter with TLS, bounded cache and provenance | No guarantee of JW.org official API; fail safely |
| Local peer sync | Android NSD + authenticated encrypted LAN protocol | No cloud server, scheduled data only |
| Trust and keys | Android Keystore-backed identity + explicit verified pairing | Least privilege, private key never exported |
| Backup | Versioned, integrity-checked, passphrase-encrypted archive | Portable device-transfer route |
| Distribution | Signed APK; optional Google Play AAB | Android-only delivery |

**Runtime layering:** `Screens → Application use cases → Domain rules ← Infrastructure adapters → SQLite / file store / Android APIs / approved online source / LAN peers`.

The project stays a **single Android app**. Infrastructure services are *internal*, never publicly exposed HTTP endpoints. `TECHNICAL_PLAN.md` specifies the full directory tree and Phase 0–7 backlog. This file fixes the domain and relational design to implement within that tree.

## 5. Data lifecycle and ownership

1. **Writes:** UI input → typed use case → schema validation → device permission check → domain invariant check → **exclusive SQLite unit-of-work** → update rows + associated `change_records` in the *same transaction* → commit → invalidate read model. No in-memory store becomes a durable source of truth.
2. **Reads:** SQLite projection/repository → immutable view model → UI. Filters and draft input are transient Zustand state, not canonical persisted records.
3. **Timer:** State machine owns active state in memory; wall clock is used for timestamps only; monotonic clock measures active durations. Recovery checkpoints never reuse stale process-monotonic reference timestamps.
4. **Import:** Staging and parser diagnostics → human preview and diff → validated commit to canonical meeting data. PDF source files remain local, and temporary staging follows retention limits.
5. **Public content:** User-approved fetch → verified TLS/size/source → normalize + provenance → local diff → explicit acceptance; no person or assignment data sent to the publication source.
6. **Sync:** Peer mutually authenticated → grants evaluated → revision chain/signature/hash checked → schema validation → single transaction apply + checkpoint → acknowledge. Reject unknown protocol versions and unauthorized fields.
7. **Restore:** Decrypt and verify backup → inspect schema compatibility/conflicts → dry-run → protect existing database → transactional replacement or controlled merge → verify FK/integrity → refresh read models. Identity keys are excluded.

### 5.1 Identifier and storage conventions

- Synced entities: app-generated globally unique `TEXT` IDs (UUIDv7 or agreed equivalent). **Do not** rely on per-device row numbers.
- `created_at`, `updated_at`, `published_at`, `started_at`, etc.: `INTEGER` epoch milliseconds in UTC unless explicitly named otherwise.
- Meeting calendar date: `TEXT` ISO `YYYY-MM-DD`, start local time `TEXT` `HH:mm`, IANA time zone in `timezone TEXT`; validate via domain layer since SQLite date checks are limited.
- SQLite booleans: `INTEGER NOT NULL CHECK(field IN (0,1))`.
- `version INTEGER NOT NULL DEFAULT 1` on mutable synchronized entities, with `deleted_at INTEGER NULL` tombstone. Set `updated_by_device_id TEXT` where a mutable synced record needs audit attribution (FK to `devices.id`, nullable on imported seed data).
- Foreign keys enabled on **every connection** (`PRAGMA foreign_keys=ON`). WAL enabled once validated against Expo/Android build behavior.
- Values carrying source data or permissions use allowlists, not arbitrary trusted strings. `*_json TEXT` is allowed only for bounded, validated drafts/metadata.
- The canonical schema uses physical `TEXT`, `INTEGER`, `REAL`, and `BLOB` affinities, not a fictitious native SQLite `BOOLEAN` or `DATETIME` type.

## 6. Complete database schema and relational constraints

The catalog below is the authoritative **proposed logical schema** consistent with the 27 tables in `TECHNICAL_PLAN.md`. Data types are SQLite storage classes. `PK` = primary key, `FK` = foreign key, `UQ` = unique, `NN` = not null. For brevity, `ts` in **table specifications** expands to `created_at INTEGER NN, updated_at INTEGER NN`. `sync` expands to `version INTEGER NN DEFAULT 1 CHECK(version>=1), deleted_at INTEGER NULL, updated_by_device_id TEXT NULL FK→devices.id`. Those expansions are **real columns**, not JSON or virtual fields. If a table lists `ts`, both timestamps are mandatory. Descriptive enum `CHECK` values are specified under the relevant row. Foreign keys use `ON DELETE RESTRICT` by default, apart from explicitly approved local ephemeral cascade rules.

### 6.1 Organization and templates

#### 01. `congregations` (synchronized)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Stable ID |
| `name` | TEXT NN | Display name; no public broadcasting |
| `locale` | TEXT NN DEFAULT 'en' | Locale identifier |
| `timezone` | TEXT NN | IANA timezone |
| `active` | INTEGER NN DEFAULT 1 CHECK(0,1) | Active flag |
| `ts`, `sync` | Expanded columns | Audit, tombstone and version |

Indexes: `idx_congregations_active(active)`; `idx_congregations_name(name)` (optional for multi-profile). Singleton active profile is an **MVP UI restriction**, not a DB cardinality limit.

#### 02. `congregation_settings` (synchronized)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Stable ID |
| `congregation_id` | TEXT NN UQ FK→congregations.id | One configuration per congregation |
| `weekday_meeting_day` | INTEGER NULL CHECK(0..6) | Day convention fixed in ADR |
| `weekend_meeting_day` | INTEGER NULL CHECK(0..6) | Day convention fixed in ADR |
| `default_midweek_start` | TEXT NULL | Validated HH:mm |
| `default_weekend_start` | TEXT NULL | Validated HH:mm |
| `program_language` | TEXT NN | BCP-47 or approved locale identifier |
| `schedule_conflict_policy` | TEXT NN | E.g. `warn`/`block`, enum finalized in ADR |
| `ts`, `version` | Expanded columns | Version NN >=1 |

Index: unique index on `congregation_id` implemented by UQ. Settings intentionally have no deleted tombstone; deleting a congregation requires an explicit administrative lifecycle procedure.

#### 03. `meeting_templates` (local catalog)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Stable local catalog ID |
| `type` | TEXT NN CHECK IN('midweek','weekend','custom') | Meeting template type |
| `name` | TEXT NN | Template label |
| `schema_version` | INTEGER NN CHECK(>=1) | Template format |
| `source_kind` | TEXT NN CHECK IN('builtin','user','imported') | Template origin |
| `is_builtin` | INTEGER NN CHECK(0,1) | Protect bundled templates |
| `ts` | Expanded columns | Audit |

Index: `idx_templates_type(type,is_builtin)`.

#### 04. `meeting_template_parts` (local catalog)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Stable part template ID |
| `template_id` | TEXT NN FK→meeting_templates.id | Parent template |
| `sequence` | INTEGER NN CHECK(>=0) | Part ordering |
| `section_key` | TEXT NULL | Default section category |
| `title` | TEXT NN | Label |
| `default_duration_seconds` | INTEGER NN CHECK(>=0) | Default duration |
| `kind` | TEXT NN | Validated part-kind enum |
| `is_timed` | INTEGER NN CHECK(0,1) | Timing flag |

Constraint/index: `UNIQUE(template_id,sequence)`; `idx_template_parts_template(template_id,sequence)`. Template deletion restricted while referenced by meetings.

### 6.2 Meetings and agenda

#### 05. `meetings` (synchronized)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Stable meeting ID |
| `congregation_id` | TEXT NN FK→congregations.id | Owner |
| `template_id` | TEXT NULL FK→meeting_templates.id | Template provenance (local reference; must degrade gracefully when absent on peer) |
| `meeting_type` | TEXT NN CHECK IN('midweek','weekend','custom') | Kind |
| `meeting_date` | TEXT NN | ISO local date |
| `start_local_time` | TEXT NULL | HH:mm |
| `timezone` | TEXT NN | IANA zone |
| `title` | TEXT NULL | Custom title |
| `status` | TEXT NN CHECK IN('draft','published','cancelled','completed') | Lifecycle |
| `program_source` | TEXT NN CHECK IN('manual','pdf','online','template','mixed') | Aggregate provenance |
| `source_revision` | TEXT NULL | Remote/document revision |
| `ts`, `sync` | Expanded columns | Revision/tombstone |

Indexes: `idx_meetings_calendar(congregation_id,meeting_date,meeting_type)`; `idx_meetings_status(congregation_id,status,meeting_date)`; `idx_meetings_template(template_id)`.

**Important reference rule:** Synced payloads must contain resolved program parts; peers must not need to possess the author's local `meeting_templates` record. When the template ID is unknown, the target sets `template_id=NULL` in the transaction and keeps provenance in source metadata. This avoids cross-device FK failure.

#### 06. `meeting_sections` (synchronized)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Stable section ID |
| `meeting_id` | TEXT NN FK→meetings.id | Parent |
| `sequence` | INTEGER NN CHECK(>=0) | Order |
| `title` | TEXT NN | Section display name |
| `section_key` | TEXT NULL | Canonical category |
| `ts`, `sync` | Expanded columns | |

Index: `idx_sections_order(meeting_id,sequence)`; partial UQ on `(meeting_id,sequence) WHERE deleted_at IS NULL`, if supported by chosen SQLite build. Reordering must assign temporary safe positions or perform an ordered rebuild in one transaction.

#### 07. `meeting_parts` (synchronized)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Stable part ID |
| `meeting_id` | TEXT NN FK→meetings.id | Parent |
| `section_id` | TEXT NULL FK→meeting_sections.id | Parent section if grouped |
| `sequence` | INTEGER NN CHECK(>=0) | Order within meeting |
| `kind` | TEXT NN CHECK IN('song','prayer','talk','study','comments','custom','other') | Extensible through custom |
| `title` | TEXT NN | Display label |
| `duration_seconds` | INTEGER NN CHECK(>=0) | Non-negative |
| `is_timed` | INTEGER NN CHECK(0,1) | Counted in timer |
| `song_number` | TEXT NULL | Keep leading zeros or labels |
| `material_reference` | TEXT NULL | Brief reference; no wholesale publication duplication |
| `notes` | TEXT NULL | Minimize sensitive content |
| `source_item_key` | TEXT NULL | Deduplication hint |
| `manually_edited` | INTEGER NN DEFAULT 0 CHECK(0,1) | Protect from unreviewed imports |
| `ts`, `sync` | Expanded columns | |

Indexes: `idx_parts_order(meeting_id,sequence)`; `idx_parts_section(section_id,sequence)`; partial UQ `(meeting_id,sequence) WHERE deleted_at IS NULL`; `idx_parts_source(meeting_id,source_item_key)` where key non-null. **Cross-row invariant:** `section_id` must refer to a section of `meeting_id`; enforce via application validator and consider composite FK `(section_id,meeting_id)` to a matching unique key on sections.

#### 08. `program_references` (synced where needed)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Reference ID |
| `meeting_part_id` | TEXT NN FK→meeting_parts.id | Parent |
| `reference_kind` | TEXT NN | Validated type (scripture, publication, URL, other) |
| `label` | TEXT NN | Short citation label |
| `uri` | TEXT NULL | Allowlisted URL schemes |
| `source_id` | TEXT NULL | Official reference identifier |
| `ts` | Expanded columns | |

Index: `idx_program_refs_part(meeting_part_id)`. For synchronized use, reference creation/deletion must also be journaled, even if not individually versioned; parent revision controls consistency.

### 6.3 People and assignments

#### 09. `people` (synchronized, private)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Stable person ID |
| `congregation_id` | TEXT NN FK→congregations.id | Owner |
| `display_name` | TEXT NN | Required, trim and nonblank |
| `sort_name` | TEXT NULL | Normalized display order |
| `is_active` | INTEGER NN DEFAULT 1 CHECK(0,1) | Disable rather than destroy history |
| `notes` | TEXT NULL | Discouraged, do not sync unless approved |
| `ts`, `sync` | Expanded columns | |

Index: `idx_people_name(congregation_id,display_name)`; `idx_people_active(congregation_id,is_active)`. Same names **are allowed**; no uniqueness by display name.

#### 10. `responsibility_types` (synchronized)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Role catalog ID |
| `congregation_id` | TEXT NN FK→congregations.id | Owner |
| `code` | TEXT NN | Stable lower-case identifier |
| `label` | TEXT NN | Display name |
| `category` | TEXT NN | Sound, microphones, timer, meeting part, custom |
| `requires_eligibility` | INTEGER NN DEFAULT 0 CHECK(0,1) | Eligible-only role |
| `is_active` | INTEGER NN DEFAULT 1 CHECK(0,1) | Hide new scheduling |
| `ts`, `sync` | Expanded columns | |

Index: partial `UNIQUE(congregation_id,code) WHERE deleted_at IS NULL`; `idx_role_active(congregation_id,is_active)`.

#### 11. `person_eligibilities` (synchronized)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Relationship ID |
| `person_id` | TEXT NN FK→people.id | |
| `responsibility_type_id` | TEXT NN FK→responsibility_types.id | |
| `eligible` | INTEGER NN CHECK(0,1) | Current eligibility |
| `ts`, `sync` | Expanded columns | |

Index: partial UQ `(person_id,responsibility_type_id) WHERE deleted_at IS NULL`; `idx_eligibility_role(responsibility_type_id,eligible)`. **Cross-row invariant:** person and responsibility must belong to same congregation.

#### 12. `person_unavailability` (synchronized; optional feature)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Slot ID |
| `person_id` | TEXT NN FK→people.id | |
| `starts_at` | INTEGER NN | UTC epoch ms |
| `ends_at` | INTEGER NN CHECK(ends_at>starts_at) | UTC epoch ms |
| `reason_code` | TEXT NULL | Non-sensitive enumerated reason only |
| `ts`, `sync` | Expanded columns | |

Index: `idx_unavailability_person_time(person_id,starts_at,ends_at)`. Avoid health or personal free-text reasons.

#### 13. `assignments` (synchronized, private)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Stable assignment ID |
| `meeting_id` | TEXT NN FK→meetings.id | |
| `meeting_part_id` | TEXT NULL FK→meeting_parts.id | Optional program-specific role |
| `responsibility_type_id` | TEXT NN FK→responsibility_types.id | |
| `person_id` | TEXT NN FK→people.id | |
| `slot_label` | TEXT NULL | E.g., microphone left/right |
| `starts_at` | INTEGER NULL | Explicit absolute interval |
| `ends_at` | INTEGER NULL | If set, requires starts_at and ends>starts |
| `status` | TEXT NN CHECK IN('draft','confirmed','cancelled') | |
| `notes` | TEXT NULL | Minimize sensitive text |
| `ts`, `sync` | Expanded columns | |

Indexes: `idx_assignments_meeting_role(meeting_id,responsibility_type_id,status)`; `idx_assignments_person_interval(person_id,starts_at,ends_at)`; `idx_assignments_part(meeting_part_id)`. Domain/transaction checks enforce same-congregation links; referenced part belongs to referenced meeting; eligibility when required; incompatible interval overlaps by policy. Multiple people in one responsibility are valid when distinct slots exist.

### 6.4 Import and provenance

#### 14. `import_jobs` (local only)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Import run |
| `kind` | TEXT NN CHECK IN('pdf','online','manual') | Input channel |
| `source_name` | TEXT NN | Display filename/source |
| `source_uri` | TEXT NULL | Local sandbox URI or permitted public URL |
| `content_sha256` | TEXT NULL | Deduplication/integrity |
| `parser_id` | TEXT NULL | Adapter identifier |
| `parser_version` | TEXT NULL | Parser release |
| `state` | TEXT NN CHECK IN('queued','parsing','review','committed','failed','cancelled') | Workflow |
| `diagnostics_json` | TEXT NULL | Validated bounded diagnostic object |
| `started_at` | INTEGER NN | |
| `completed_at` | INTEGER NULL | |
| `ts` | Expanded columns | |

Indexes: `idx_import_jobs_state(state,created_at)`; `idx_import_jobs_hash(content_sha256)`.

#### 15. `import_candidates` (local only)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Candidate ID |
| `import_job_id` | TEXT NN FK→import_jobs.id | |
| `candidate_type` | TEXT NN | Meeting/section/part |
| `normalized_payload_json` | TEXT NN | Strict validated draft, bounded size |
| `confidence` | REAL NULL CHECK(0<=confidence AND confidence<=1) | Parser estimate, not truth |
| `approved` | INTEGER NN DEFAULT 0 CHECK(0,1) | Human review flag |
| `ts` | Expanded columns | |

Index: `idx_candidates_job(import_job_id,approved)`; `ON DELETE CASCADE` allowed **only** for deleting completed local staging jobs by retention policy.

#### 16. `source_links` (synchronized metadata)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Provenance ID |
| `meeting_id` | TEXT NN FK→meetings.id | |
| `meeting_part_id` | TEXT NULL FK→meeting_parts.id | |
| `source_kind` | TEXT NN CHECK IN('manual','pdf','online','template','mixed') | |
| `source_document_key` | TEXT NULL | Identifies publication/filename hash |
| `source_item_key` | TEXT NULL | Stable item mapping |
| `imported_at` | INTEGER NN | Timestamp |
| `source_hash` | TEXT NULL | Content SHA-256, no text blob |
| `ts` | Expanded columns | |

Index: `idx_source_links_meeting(meeting_id,source_kind)`; `idx_source_links_item(meeting_part_id,source_item_key)`. Cross-row part/meeting consistency must be checked.

### 6.5 Trust, leadership, journal, sync

#### 17. `devices` (local trusted-device registry)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Identity ID |
| `display_name` | TEXT NN | Human-approved device label |
| `public_key` | TEXT NN | Encoded public identity key |
| `key_fingerprint` | TEXT NN UQ | Key digest |
| `trust_state` | TEXT NN CHECK IN('pending','trusted','revoked') | |
| `paired_at` | INTEGER NULL | |
| `revoked_at` | INTEGER NULL | |
| `last_seen_at` | INTEGER NULL | |
| `ts` | Expanded columns | |

Indexes: UQ `key_fingerprint`; `idx_devices_trust(trust_state)`. Private key never stored here. Device creation before initial pairing must be distinguished from imported/claimed identity.

#### 18. `device_grants` (replicated authority)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Grant ID |
| `congregation_id` | TEXT NN FK→congregations.id | |
| `device_id` | TEXT NN FK→devices.id | Subject device |
| `permission` | TEXT NN | Allowlist; e.g. `schedule.read`, `schedule.draft`, `schedule.publish`, `devices.manage`, `backup.export` |
| `granted_by_device_id` | TEXT NN FK→devices.id | Originator |
| `grant_revision_id` | TEXT NULL | Signed authority revision reference; avoid circular migration FK initially |
| `expires_at` | INTEGER NULL | |
| `revoked_at` | INTEGER NULL | |
| `ts` | Expanded columns | |

Index: partial UQ `(congregation_id,device_id,permission) WHERE revoked_at IS NULL`; `idx_grants_device(device_id,expires_at,revoked_at)`. Grant validity requires *trusted device*, unexpired scope, valid signed chain, and policy authorization. Grants must not be self-issued.

#### 19. `leadership_terms` (replicated authority)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Term ID |
| `congregation_id` | TEXT NN FK→congregations.id | |
| `term_number` | INTEGER NN CHECK(>=1) | Monotonic term |
| `leader_device_id` | TEXT NN FK→devices.id | Publishing device |
| `activated_at` | INTEGER NN | |
| `ended_at` | INTEGER NULL | >= activated_at if present |
| `transfer_proof` | TEXT NN | Signed authorization/transfer evidence |
| `ts` | Expanded columns | |

Index: UQ `(congregation_id,term_number)`; partial UQ `(congregation_id) WHERE ended_at IS NULL` on **local accepted** terms. A conflicting remote term must be placed in quarantine, not inserted into this table as another accepted active term.

#### 20. `schedule_revisions` (replicated immutable publication)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Revision ID |
| `congregation_id` | TEXT NN FK→congregations.id | |
| `parent_revision_id` | TEXT NULL FK→schedule_revisions.id | Chain |
| `leadership_term_id` | TEXT NN FK→leadership_terms.id | |
| `publisher_device_id` | TEXT NN FK→devices.id | |
| `revision_number` | INTEGER NN CHECK(>=1) | Sequence within term |
| `payload_hash` | TEXT NN | Canonical data hash |
| `signature` | TEXT NN | Signature over canonical, domain-separated payload |
| `published_at` | INTEGER NN | |
| `ts` | Expanded columns | Immutable after publication |

Indexes: UQ `(congregation_id,leadership_term_id,revision_number)`; `idx_revision_parent(parent_revision_id)`; `idx_revision_published(congregation_id,published_at)`. Genesis revision parent is null. Verify signatures and exact parent ancestry on receipt.

#### 21. `change_records` (transactional journal/outbox)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Change/event ID, stable for replay |
| `congregation_id` | TEXT NN FK→congregations.id | |
| `entity_type` | TEXT NN | Allowlisted synchronized table identifier |
| `entity_id` | TEXT NN | ID of referenced object (polymorphic, no simple FK) |
| `operation` | TEXT NN CHECK IN('upsert','delete') | |
| `base_version` | INTEGER NULL CHECK(>=0) | Expected version |
| `new_version` | INTEGER NN CHECK(>=1) | Applied version |
| `payload_json` | TEXT NN | Canonical validated data, encrypted in transit |
| `author_device_id` | TEXT NN FK→devices.id | |
| `schedule_revision_id` | TEXT NULL FK→schedule_revisions.id | Null for draft |
| `state` | TEXT NN CHECK IN('draft','published','applied','conflict') | |
| `ts` | Expanded columns | |

Indexes: `idx_changes_outbox(congregation_id,state,created_at)`; `idx_changes_entity(entity_type,entity_id,new_version)`; `idx_changes_revision(schedule_revision_id)`; `idx_changes_author(author_device_id)`. No partial commit of entity and journal entry. For published revisions, `state` progression must be controlled by application service. `entity_type` must not include local secrets/timer sessions.

#### 22. `sync_peers` (local only)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Peer record |
| `device_id` | TEXT NN UQ FK→devices.id | |
| `last_accepted_revision_id` | TEXT NULL FK→schedule_revisions.id | Persisted checkpoint |
| `last_connected_at` | INTEGER NULL | |
| `status` | TEXT NN | Allowlisted connecting/synced/error states |
| `ts` | Expanded columns | |

Indexes: UQ `(device_id)`; `idx_sync_peers_status(status)`.

#### 23. `sync_conflicts` (local quarantine)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Conflict ID |
| `congregation_id` | TEXT NN FK→congregations.id | |
| `entity_type` | TEXT NN | |
| `entity_id` | TEXT NN | |
| `local_change_id` | TEXT NULL FK→change_records.id | |
| `remote_change_id` | TEXT NULL FK→change_records.id | Nullable when invalid/untrusted payload not admitted to journal |
| `reason` | TEXT NN | Typed reason code |
| `resolution` | TEXT NULL | Approved resolution code |
| `resolved_at` | INTEGER NULL | |
| `ts` | Expanded columns | |

Index: `idx_conflicts_open(congregation_id,resolved_at,created_at)`. Conflicting raw remote material may need an encrypted bounded quarantine file; never execute it as commands.

#### 24. `sync_sessions` (local diagnostics)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Session ID |
| `peer_device_id` | TEXT NN FK→devices.id | |
| `started_at` | INTEGER NN | |
| `finished_at` | INTEGER NULL | >= started_at if present |
| `result` | TEXT NN | Allowlisted outcome |
| `received_count` | INTEGER NN DEFAULT 0 CHECK(>=0) | |
| `sent_count` | INTEGER NN DEFAULT 0 CHECK(>=0) | |
| `error_code` | TEXT NULL | No person data |
| `ts` | Expanded columns | |

Index: `idx_sync_sessions_peer(peer_device_id,started_at DESC)`.

### 6.6 Timer and local configuration

#### 25. `timer_presets` (local only)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Preset ID |
| `congregation_id` | TEXT NULL FK→congregations.id | Optional local profile association |
| `name` | TEXT NN | |
| `warning_seconds` | INTEGER NN CHECK(>=0) | |
| `critical_seconds` | INTEGER NN CHECK(>=0) | Require critical <= warning |
| `overtime_mode` | TEXT NN | `count_up`, `hold_zero`, etc. after approval |
| `auto_advance_policy` | TEXT NN | Policy identifier, not executable code |
| `ts` | Expanded columns | |

Index: `idx_timer_presets_congregation(congregation_id,name)`.

#### 26. `timer_sessions` (local only, never synchronized)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Session ID |
| `meeting_id` | TEXT NULL FK→meetings.id | Optional loaded meeting |
| `meeting_part_id` | TEXT NULL FK→meeting_parts.id | Must belong to meeting if both set |
| `mode` | TEXT NN CHECK IN('manual','automatic') | |
| `state` | TEXT NN CHECK IN('idle','ready','running','paused','completed') | |
| `duration_ms` | INTEGER NN CHECK(>=0) | |
| `elapsed_before_run_ms` | INTEGER NN CHECK(>=0) | Elapsed accumulated before current run |
| `started_monotonic_ms` | INTEGER NULL | **Valid only in originating process; never replay after restart** |
| `checkpoint_wall_time_ms` | INTEGER NULL | Recovery aid, not authoritative elapsed clock |
| `recovery_state` | TEXT NULL | Enum: pending/restart/resume policy TBD |
| `ts` | Expanded columns | |
| `ended_at` | INTEGER NULL | |

Index: `idx_timer_sessions_meeting(meeting_id,created_at DESC)`; `idx_timer_sessions_state(state,updated_at)`. The active timer state machine is runtime authority; checkpoints are optional conservative recovery aids.

#### 27. `app_preferences` (local only)
| Column | Type / constraints | Notes |
|---|---|---|
| `key` | TEXT PK | Typed allowlisted setting key |
| `value_json` | TEXT NN | Bounded schema-validated value |
| `updated_at` | INTEGER NN | |

No extra index needed. Do not place secrets in preferences.

#### 28. `backup_manifests` (local only)
| Column | Type / constraints | Notes |
|---|---|---|
| `id` | TEXT PK | Backup record |
| `format_version` | INTEGER NN CHECK(>=1) | Archive version |
| `db_schema_version` | INTEGER NN CHECK(>=1) | DB compatibility |
| `created_at` | INTEGER NN | |
| `content_sha256` | TEXT NN | Ciphertext/manifest hash semantics specified by format |
| `encrypted` | INTEGER NN CHECK(0,1) | Production sensitive backups require 1 |
| `file_display_name` | TEXT NN | No full private path needed |
| `restore_status` | TEXT NULL | Enum status |

Index: `idx_backup_manifests_created(created_at DESC)`.

#### 29. `schema_migrations` (local only)
| Column | Type / constraints | Notes |
|---|---|---|
| `version` | INTEGER PK | Schema version |
| `checksum` | TEXT NN | Migration integrity |
| `applied_at` | INTEGER NN | |

No extra index required. Migration tooling may use `PRAGMA user_version` as an additional check, but must not create two independent authoritative schema versions.

### 6.7 Schema reconciliation with `TECHNICAL_PLAN.md`

The technical plan's section 6 enumerates **29 actual tables** (despite its approximate “25+” summary). This specification enumerates the same 29 and adds: explicit SQLite physical types, PK/FK/indexes, enum checks, common column expansion rules, active-row uniqueness, and cross-row validation. This document is the detailed design baseline. If a future technical-plan table definition differs, update both documents through an ADR and migration review.

**Schema design caveats needing implementation ADRs:**

1. `meeting_templates` are local, while `meetings.template_id` is a nullable FK. A receiver lacking that template must resolve the payload to `NULL`; meeting parts contain all details needed to display the program.
2. `devices` is a local trust registry. A remote `device_grants` or `schedule_revisions` payload must securely register and verify the necessary *public* device identity before FK application. Do not trust a peer's submitted self-description.
3. `device_grants.grant_revision_id` is a reference to signed authority material; an optional FK to `schedule_revisions` needs a migration order or separate trusted-authorization ledger. The v1 plan keeps it as text with cryptographic validation.
4. A subset of reference/catalog children use the parent published revision for consistency instead of independent `version` columns. Journal grouping must keep parent and children atomic.
5. Soft deletion means partial unique indexes and tombstone retention tests are needed; never bulk-delete a synced parent with historical assignment children.

## 7. Core domain invariants and business rules

| ID | Rule / invariant | Enforcement layer |
|---|---|---|
| BR-001 | A meeting belongs to exactly one congregation | `meetings.congregation_id` NN FK |
| BR-002 | A program part belongs to one meeting, and its section (if set) belongs to that same meeting | FK + domain check (prefer composite FK) |
| BR-003 | Active parts and sections have deterministic, collision-free sequence positions within their meeting | Partial unique index + reorder transaction |
| BR-004 | Duration is non-negative; non-timed parts are allowed | CHECK + timer policy |
| BR-005 | An assignment's person, role, meeting and optional part belong to the same congregation/meeting | Domain policy in single transaction, with composite FKs where feasible |
| BR-006 | Eligibility rules and active status are validated before confirming assignments | Assignment domain policy |
| BR-007 | Overlaps use absolute time intervals; missing times produce a warning rather than false certainty | Scheduling policy |
| BR-008 | Two identical display names represent distinct people until explicitly deduplicated | Stable IDs, no unique display name |
| BR-009 | Published schedules are immutable revisions; changes create a new child revision | Revision publisher + signature validation |
| BR-010 | One accepted active leadership term per congregation per local trust view | Partial unique index + term-authority validation |
| BR-011 | Only authorized active leader signs/publishes a new revision | Signature, grant, term + parent verification |
| BR-012 | A follower can draft if granted, but never publish directly | Permission evaluation + command segregation |
| BR-013 | Local change and journal record commit atomically | SQLite unit of work |
| BR-014 | Remote revisions apply idempotently and in expected ancestry order | Unique IDs, parent check, atomic peer checkpoint |
| BR-015 | Timer countdown state stays local to the operating device | Data export allowlist; no timer session replication |
| BR-016 | Automatic timer advance follows selected approved policy; never silently guesses a speaker transition | Timer state machine |
| BR-017 | Unapproved import candidates never mutate published meeting program | Import staging vs commit transaction |
| BR-018 | Manually edited fields are not overwritten by import without explicit user selection | Import diff/merge policy |
| BR-019 | Backups exclude Keystore private keys and ephemeral network credentials | Backup serialization allowlist |
| BR-020 | Device revocation blocks future accepted exchanges, not data already saved offline | Grant check + documented residual risk |
| BR-021 | Deleted shared records keep tombstones until all relevant trusted peers can reconcile or an approved rebootstrap occurs | Change journal + compaction policy |
| BR-022 | Meeting dates use local-date semantics, not naive UTC conversion of the date-only field | Domain calendar policy |
| BR-023 | Import, restore, and peer payloads are treated as untrusted data regardless of source | Boundaries: schema, size, types, provenance |
| BR-024 | A device that cannot prove leadership continuity must quarantine conflicting history instead of auto-electing itself | Leadership/reconciliation workflow |

### 7.1 Schedule states

- **Draft meeting / assignment:** Local, editable, not represented as a confirmed shared final roster.
- **Published meeting:** Included in an accepted leader-signed revision; readers see the revision ID and publication time.
- **Cancelled/completed meeting:** Retained for history; does not permit invalid overwrites of older revision history.
- **Draft changes after publication:** Create pending changes; do not mutate the signed historical revision payload. Published projection can be updated only by a new accepted revision.

**Design clarification:** `meetings.status='published'` marks the current accepted projection state; `schedule_revisions` and their canonical journal payloads preserve immutable publication evidence. A live SQLite row is not itself an immutable snapshot.

### 7.2 Timer invariants

- Allowed states: `idle → ready → running ↔ paused → completed`; reset/skip/next are explicit validated commands.
- Elapsed active time uses a monotonic clock; rendering intervals do not accumulate elapsed seconds.
- Running elapsed is `elapsed_before_run_ms + max(0, now_monotonic-started_monotonic_ms)` **within the same process lifetime**.
- Time warning/critical thresholds satisfy `0 <= critical_seconds <= warning_seconds <= configured_duration_seconds` unless special overtime policy permits otherwise.
- Android process death invalidates the monotonic baseline; recovering requires explicit defined policy. Do not blindly subtract persisted monotonic values across reboot.
- A timer may load a published or local meeting program while disconnected; timer controls do not publish or synchronize changes.

### 7.3 Assignment time semantics

The default scheduling interval is the meeting duration when an assignment lacks a start/end. A part-specific assignment uses the part's planned segment only when the meeting has enough timing information to calculate it. **No computed plan represents an exact actual event time.** If intervals are unavailable, flag potential conflicts rather than asserting a clash or availability.

## 8. Security and consistency mapping (ACID + PoLP)

### 8.1 ACID transaction map

| Operation | Transaction boundary | Failure behavior |
|---|---|---|
| Create/edit meeting with ordered sections/parts | All affected meeting/section/part rows + journal events | Roll back on invalid reference, sequence, or journal failure |
| Assign a role | Assignment insert/update + eligibility/overlap checks + change journal | Reject or warn according to policy, no partial assignment |
| Publish a schedule | Verify leader/grants; create immutable revision, sign canonical payload; associate journal records | No published revision without full compatible snapshot and signature |
| Apply peer revision | Validate before write; apply all referenced entities, journal IDs and last accepted peer checkpoint atomically | Preserve old local state if any write fails |
| Commit PDF/online import | Validate approved candidates, diff, upsert full program and source links | Restore previous program on any failure |
| Backup export | Obtain consistent SQLite snapshot and freeze archive manifest input | Do not export partially committed database state |
| Restore archive | Verify/decrypt/check compatibility before write; stage then atomically swap/replace DB under controlled app shutdown | Original database remains recoverable if validation fails |
| Schema migration | Versioned transaction where supported; preflight/backup before incompatible migrations | Abort startup safely, do not claim upgraded version |

**Technical caution:** SQLite transactions are connection-scoped. Expo's non-exclusive async transaction helper is not a general concurrency boundary for unrelated async queries. Use verified exclusive transaction API or serialized single-writer orchestration. Never call long-running network/PDF work inside a database write transaction.

### 8.2 Device permission matrix

| Operation | Viewer | Draft editor | Schedule publisher | Device administrator | Timer operator |
|---|---:|---:|---:|---:|---:|
| Read authorized schedule | Yes | Yes | Yes | By explicit grant | Optional |
| Read private person directory | Explicit grant | Explicit grant | Explicit grant | Explicit grant | No by default |
| Write local schedule draft | No | Yes | Yes | No by default | No |
| Publish authoritative revision | No | No | Yes (active leader only) | No by default | No |
| Manage trusted devices/grants | No | No | No | Yes | No |
| Export private backup | No | No | Explicit grant | Explicit grant | No |
| Operate local timer | Independent local feature | Independent | Independent | Independent | Yes |

“Role” is **device permission scope**, not a sign-in session. Device owners must use Android lock-screen security. Absence of app login means any person holding an unlocked authorized phone can act with its grants. For especially sensitive actions, optional PIN/biometric confirmation remains an open product decision.

### 8.3 Threat → control → verification

| Threat / violation | Default safeguard | Test or evidence |
|---|---|---|
| Unauthorized LAN peer sees assignments | LAN sync disabled until explicit pairing, mutual authentication, scoped read grant | Negative read test from untrusted/revoked peer |
| Peer impersonates publisher | Signed revision + trusted public key + active leadership term + parent chain | Reject unsigned/wrong-term/replayed revision |
| Replay/partial network transfer | Unique record IDs, message nonce, idempotent apply and persisted revision cursor | Duplicate/reordered packet integration tests |
| Rogue grant escalation | Only authorized grant issuer, signed trusted authority, no self-grant | Role matrix and tampered-grant tests |
| Private data in telemetry | No third-party analytics by default, diagnostics sanitized, domain allowlist | Static network-domain inspection on release build |
| Stolen backup | Passphrase-encrypted authenticated archive with random salt and appropriate KDF | Wrong-password and tamper tests |
| Tampered PDF/online payload | File size/type limits, local parser isolation where feasible, strict normalized schema, human confirmation | Fuzz/invalid import fixtures |
| Deleted parent leaves orphan | FKs/RESTRICT + tombstones | FK checks, deletion regression |
| Concurrent edits overwrite silently | Version checks + leader publication + conflict quarantine | Two-device concurrent edit tests |
| Lost paired phone | Revoke future access; protect keys with Android Keystore; advise OS screen lock | Revocation test, device-loss playbook |
| Scaled fonts hide controls | TalkBack labels, dynamic font, adaptable layout | Accessibility audits at maximum supported font scales |

### 8.4 Data privacy and retention

- Minimal person fields by default, with no phone/email mandatory and no sensitive free-text unavailability reasons.
- Import processing and PDF files stay on device. Do not send workbook PDFs to third-party extraction services.
- Devices exchange only records needed by the receiving grant. Full database dumps over LAN are prohibited unless explicitly authorized.
- Diagnostic logs omit people, meeting text, secrets and raw protocol payloads.
- Backup exports are encrypted and use the Android document picker; app must explain that destination storage apps chosen by users may themselves sync files externally.
- Retention/cleanup periods for temporary imports, sync logs and tombstones require a policy decision before release.

## 9. Edge cases and deterministic handling

| Case | Expected behavior / invariant preserved |
|---|---|
| Entirely offline first launch | Templates, local DB and timer work with no network or account creation |
| Public source unavailable/changes format | Explain failure; retain existing agenda; manual and PDF paths remain available |
| PDF is scanned/image-only | Mark unsupported or partial if no local OCR adapter; never fake extracted parts |
| PDF has multiple meeting weeks/languages | Preview candidate dates/languages and require selection/confirmation |
| PDF import duplicates meeting | Compare source hash and date/type, offer merge/create/cancel; no silent replacement |
| User modifies imported part | Set `manually_edited=1`; future imports require explicit merge choice |
| Same speaker name appears twice | Keep separate `people.id` entries until reviewed, avoid name-based merging |
| Inactive person assigned | Warn/block new confirmation according to local policy; preserve historical records |
| No assignment times | Warn “overlap unknown”, avoid false absence of conflict |
| Two roles in same time slot | Validate concurrency policy and explicit slot labels; support multiple attendants per role |
| Device loses LAN mid-sync | Atomic apply only after verified payload; resume from accepted revision |
| Leader disappears | Followers retain data/drafts; no automatic election; approved leadership recovery needed |
| Two incompatible leader branches | Quarantine newer unverified branch, show conflict, preserve current trusted projection |
| Paired device revoked while offline | Revocation becomes effective when learned; cannot erase previously copied data remotely |
| SQLite storage full | Roll back write, show retry/export options; no partially saved agenda |
| App killed during timer | Use approved recovery prompt/policy and safe checkpoint; never trust stale monotonic value |
| Clock/date/time-zone changes | Active timer unaffected; future calendar records retain IANA local semantics |
| Screen rotates/fullscreen exits | Preserve timer engine state, resize UI, release keep-awake on screen exit |
| Wrong backup password/corrupt archive | Fail closed before modifying DB |
| Older/newer schema backup | Preflight version compatibility; migrate on staging copy or refuse safely |
| Restored data moved to another phone | Device private identity not restored; device must pair again |
| Hostile peer sends oversized payload | Bound message sizes, reject early and log only sanitized error code |

## 10. API, protocol and state contracts (design level)

**In-process API:** Screens call application use cases (`CreateMeeting`, `UpdateProgram`, `AssignPerson`, `PublishSchedule`, `StartTimer`, `ImportWorkbook`, `RestoreBackup`) through typed dependency-injected ports. There is **no local HTTP service** required.

**Repository contract:** Domain-specific read projections and write commands share one transaction manager. A transaction must expose a way to update canonical rows **and** append journal entries atomically.

**Peer protocol:** Versioned handshake contains protocol version, ephemeral challenge, verified device public key/identity, approved congregation scopes and most recent accepted revision. The payload contains only authorized change sets, parent revision, term, canonical hash and signature. Every received change is validated before database apply. Session-level transport encryption is mandatory; public discovery advertisements contain no assignment/person data.

**Public program query/cache:** On-demand online refresh, bounded metadata cache with source hash/ETag when supported, strict source allowlist and TLS. Content is always a candidate until user review. Cached public source responses never override a manually edited canonical row by background refresh.

**State ownership:** SQLite = persistent records; pure timer state machine = running countdown; Zustand = transient filters/forms/presentation state. Do not store entire persisted meeting objects in global Zustand as a second mutable authority.

## 11. Testing and approval matrix

| Level | Representative checks | Exit requirement |
|---|---|---|
| Domain unit | Sequence reorder, duration bounds, eligibility, interval overlaps, timer transitions | Deterministic rules and negative cases pass |
| SQLite integration | FKs, check/unique constraints, atomic journal, rollback, migrations | `foreign_key_check` clean; simulated failed writes leave no partial updates |
| Import contract | PDF native text variants, scanned PDF rejection, online parser change, duplicate and manual-merge cases | Preview accurate within supported fixture set; failures preserve DB |
| Peer contract | Handshake version, grant scope, signed ancestry, idempotent replay, revoked key, partitions | Unauthorized data never accepted; no silent branch overwrite |
| Backup integration | Encryption, password failures, tampering, schema mismatch, alternate device restore | Failed restore leaves original intact; new identity pairing required |
| E2E Android | Create meeting, fill roles, run timer offline/fullscreen, backup, pair/sync on LAN | Tested on physical Android devices and emulators |
| Accessibility | TalkBack, large text, portrait/landscape, contrast, focus order, 48dp targets | WCAG 2.2 AA intent and native Android usability validated |
| Security/privacy | Network/domain scan, permission scope, Keystore key lifecycle, data-leak checks | No unapproved cloud transfer or plaintext secret in logs/files |

## 12. Unresolved business/domain questions

| ID | Question | Why it matters | Suggested default / decision owner |
|---|---|---|---|
| Q-01 | Which minimum Android version and physical device models must be supported? | Native module/API feasibility | Phase 0 hardware inventory; owner |
| Q-02 | Which UI/program languages and workbook PDF languages are required first? | Parser, localization and dates | English initially, extend by prioritized languages; owner |
| Q-03 | Does automatic mode **advance and start**, advance but wait, or only notify? | Timer state transitions | Advance but require explicit start; meeting operator |
| Q-04 | What happens to overtime: count up, hold zero, display warning, vibration? | Public timer readability and operator rules | Configurable, silent visual default; owner |
| Q-05 | After app death/reboot, resume elapsed by wall clock or require operator confirmation? | Accuracy/safety | Require confirmation, offer reset/restore estimate; operator |
| Q-06 | What is the exact assignment clash policy for overlapping roles and unspecified times? | Correct roster validation | Block known overlaps unless exception; warn unknown times; scheduler |
| Q-07 | Can a leader device delegate temporary schedule publishing rights while away? | Operational continuity | Explicit time-bound transfer only; owner |
| Q-08 | Who may approve a new leader when the current leader phone is lost? | Avoid split-brain publication | In-person recovery procedure, no automatic election; owner |
| Q-09 | Are follower drafts syncable to the leader, and must the leader approve each? | Revision workflow | Yes, approved editors propose, leader accepts; scheduler |
| Q-10 | Which records are visible to a pure viewer, especially availability and notes? | Data minimization/PoLP | Assignment summary by default, no private notes; owner |
| Q-11 | Should scheduling support one or multiple congregation profiles on a device? | Schema, UX and sync scopes | One active profile in MVP; owner |
| Q-12 | What exact printed/PDF formats and years are must-support? | Parser feasibility | Phase 0 corpus, native-text PDFs first; owner |
| Q-13 | Which publicly permitted JW.org endpoint/feed/files are approved for retrieval? | Access stability, terms and licensing | Keep online adapter optional until verified; owner/technical review |
| Q-14 | Is full KHMS interoperability required, or only comparable scheduling workflow? | API/license complexity | Comparable workflow only until verified; owner |
| Q-15 | How many schedule weeks/months and people must sync efficiently? | Indexing, performance, pagination | Set measurable fixture scale in Phase 0; owner |
| Q-16 | What is the backup passphrase recovery and lost-passphrase policy? | Backup usability/privacy | No silent bypass; document irreversible loss risk; owner |
| Q-17 | Is an additional local PIN/biometric gate needed before sensitive publish/export/pair actions? | No-login residual security risk | Evaluate high-impact action confirmation; owner |
| Q-18 | What are retention periods for import staging, sync logs, revisions and tombstones? | Privacy and convergence | Define before release; owner |
| Q-19 | Is encrypted file transfer allowed to pass through user-selected third-party storage apps? | Interpretation of “not uploaded to cloud” | Make cloud destination risk explicit, default direct local transfer; owner |
| Q-20 | Should completed meetings retain timer history, and who can see it? | Privacy/storage burden | No long-term timing history in MVP; owner |
| Q-21 | What is the final permissible list of responsibilities, eligibility rules and special-event meetings? | Seed catalogs and constraints | Configurable catalog with example roles; coordinator |
| Q-22 | How are signed peer-device grants and leader transfer authority bootstrapped on the very first device? | Trust root | In-person administrator initialization, ADR required; architect |

## 13. Decisions, exclusions, and acceptance gates

**Non-negotiable:** Android only; manual/automatic timer; fullscreen + keep screen on; offline entry/roster/backup; authorized schedule synchronization only; no required cloud or online login; data minimization; ACID transactions; no direct network access from UI; dependency inversion; TalkBack/accessible layouts; peer grants enforced at every boundary.

**Not in initial release:** iOS/web/desktop; remote cross-network cloud sync; synchronized countdown; automatic hardware audio/microphone actuation; arbitrary OCR for all PDFs; guaranteed unsupported public-source APIs; full KHMS source integration without license and documented API; anonymous public roster sharing; unattended leadership election during partitions.

**Acceptance gate before application coding:** Approve this schema and business-rule baseline, decide Q-03/Q-05/Q-06/Q-08/Q-10/Q-13, complete Android/PDF/LAN/Keystore Phase 0 technical spikes, and record ADRs for schema and protocol revisions.

**Document relationship:** `TECHNICAL_PLAN.md` remains the execution/dependency roadmap. `SYSTEM_DESIGN.md` defines domain behavior, relational contract and security semantics. Changes must preserve their consistency and receive an ADR plus migration/test updates before implementation.
