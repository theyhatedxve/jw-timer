# JW Meeting Timer — Coding Principles and Engineering Standards

**Owner-approved layout update (2026-11-21):** [ADR 0003](adr/0003-react-navigation-and-source-layout.md) supersedes Expo Router and feature-folder naming references with [DIRECTORY_STRUCTURE.md](DIRECTORY_STRUCTURE.md). Logical presentation/application/domain/infrastructure boundaries, inward dependencies and data/security requirements continue to apply. Owner-requested deferred checks remain required before verified completion or release.

**File:** `CODING_PRINCIPLES.md`  
**Version:** 1.0  
**Status:** Proposed implementation policy, subject to team approval  
**Date:** 2026-11-20  
**Applies to:** Android app, native integrations, local SQLite schema, tests, CI, and optional tooling  
**Companion documents:** `TECHNICAL_PLAN.md`, `SYSTEM_DESIGN.md`, `SCREEN_FLOWS.md`, `design_guidelines.md`, `API.md`, `CI_CD_ROADMAP.md`

## 1. Purpose and normative language

This document establishes reviewable engineering rules for the **offline-first Android JW Meeting Timer**. It is a coding policy, **not application source code**.

- **MUST / MUST NOT:** required for merging production code; exceptions need an approved Architecture Decision Record (ADR).
- **SHOULD / SHOULD NOT:** strong default; deviations require a reason in the pull request (PR).
- **MAY:** permitted when it does not violate higher-priority constraints.

**Non-negotiable product boundaries:** The timer works locally; only schedules, meeting programs, people, and assignments are eligible for trusted-device synchronization. No live countdown synchronization. No mandatory login, hosted backend, cloud database, telemetry, or data upload. Manual entry, approved online import, and local workbook PDF import coexist. Each device owns an authoritative local SQLite database; one authorized schedule leader publishes revisions.

## 2. Engineering priorities

| Priority | Principle | Enforceable rule | Evidence |
|---|---|---|---|
| P0 | Safety and privacy | Deny untrusted peers; never publish private records to unapproved endpoints | Negative authorization and network tests |
| P0 | Data integrity | All related durable mutations occur in one SQLite transaction | Rollback and foreign-key tests |
| P0 | Offline-first | Core timer and schedule functions work with all radios disabled | Airplane-mode E2E tests |
| P0 | Accessibility | WCAG 2.2 AA-aligned Android behavior; TalkBack and large text | Accessibility audit |
| P1 | SOLID | Pure domain policies; narrow ports; dependency inversion | Architecture dependency tests |
| P1 | DRY | One canonical domain rule per invariant | Rule ownership checks |
| P1 | KISS | Prefer small, testable modules and minimal abstraction | PR review |
| P1 | Composition over inheritance | Compose hooks, components, and injected services | PR review |
| P1 | Single source of truth | SQLite for durable data; timer engine for active countdown | State ownership tests |
| P2 | Maintainability | Explicit names, focused functions, stable contracts | Lint, type check, tests |

## 3. Layering and dependencies

Use the modular Clean Architecture boundaries defined in `TECHNICAL_PLAN.md`:

1. **Presentation:** Expo Router screens, accessible components, UI hooks, user feedback.
2. **Application:** use cases, transaction coordination, permission checks, orchestration.
3. **Domain:** pure entities, policies, invariants, timer state machine, revision rules.
4. **Infrastructure:** SQLite repositories, network transport, cryptography, PDF parser, online source adapter, backup.
5. **Composition root:** constructs concrete implementations and injects domain/application ports.

**MUST:** dependencies point inward; the domain MUST NOT import `expo-*`, React, navigation, SQL drivers, or sockets. **MUST:** screens invoke use cases, not raw repository writes. **MUST:** infrastructure validate untrusted inputs before passing values into the domain. **SHOULD:** use feature folders and public barrel exports sparingly, with explicit contracts. **MUST NOT:** introduce a local HTTP server for internal UI calls when a typed in-process use case suffices.

### 3.1 SOLID applied

- **Single Responsibility:** separate timer calculation, visual timer rendering, schedule validation, and persistence. A screen MUST NOT combine PDF extraction with SQLite updates.
- **Open/Closed:** implement a new workbook source as an adapter behind the importer interface; avoid adding source-specific branches to every screen.
- **Liskov Substitution:** injected repository or source adapters MUST honor the same validation, error, and transaction contracts; test with shared contract tests.
- **Interface Segregation:** expose read-only schedule queries separately from schedule publishing. Viewer code MUST NOT receive mutation capability merely because it reads schedules.
- **Dependency Inversion:** application use cases reference repository, clock, crypto, and transport **ports**, not concrete libraries.

### 3.2 DRY, KISS, and composition

- **MUST:** define durations and time calculations in one domain module, not screen-specific copies.
- **MUST:** centralize DB invariants, validation schemas, permission identifiers, and design tokens.
- **MUST NOT:** create generic repositories, event buses, or factories solely for hypothetical future features.
- **SHOULD:** keep functions focused, with early returns and descriptive names.
- **SHOULD:** compose accessible UI primitives and hooks instead of deeply nested inheritance hierarchies.
- **MUST NOT:** reuse UI state as the source for persistence decisions without re-reading and validating the authoritative database state.

**Acceptable pattern:** `PublishSchedule` uses injected `ScheduleRepository`, `AuthorizationPolicy`, and `RevisionWriter` ports inside one transaction.  
**Unacceptable pattern:** `ScheduleScreen` builds SQL strings, changes a Zustand list, and sends a peer request directly from a button event.

## 4. TypeScript and React Native conventions

### 4.1 Type safety

- **MUST:** enable TypeScript `strict` mode, `noUncheckedIndexedAccess` where compatible, and lint rules against unchecked `any`.
- **MUST:** validate runtime inputs at all boundaries: PDF parsing, network payloads, backups, device discovery, imported JSON, and route parameters.
- **MUST:** model timer modes, schedule publication states, sync status, and error categories using discriminated unions or explicit enumerations.
- **MUST:** use stable opaque IDs or branded identifier types for persisted entity keys to reduce cross-entity mistakes.
- **SHOULD:** use `unknown` for untrusted inputs and narrow via schemas; avoid unsafe casts and non-null assertions.
- **MUST:** express time durations using a named unit (`durationSeconds`, `elapsedMilliseconds`), not ambiguous numeric fields.
- **MUST:** use UTC timestamps for audit events and an explicit IANA timezone / local meeting date for scheduling semantics.
- **MUST:** distinguish optional, absent, and explicitly cleared values in patch operations.

### 4.2 Naming and file scope

- **Components/types:** `PascalCase`; **variables/functions/hooks:** `camelCase`; **constants:** descriptive `UPPER_SNAKE_CASE` when immutable global config.
- **Hooks:** begin with `use`; **use cases:** action-focused names, such as `AssignResponsibility` or `ImportMeetingProgram`.
- **Route filenames:** follow Expo Router conventions, not arbitrary custom route naming.
- **Database:** `snake_case` table/column names, named constraints where supported, explicit schema migration versions.
- **MUST:** avoid hardcoded screen text, color values, and timings when they belong to localization, tokens, or configured domain rules.

### 4.3 React composition

- **MUST:** keep render functions side-effect free. Never write to SQLite or transmit a sync message during render.
- **MUST:** unsubscribe listeners, cancel stale requests, and release keep-awake claims on screen unmount/disposal.
- **MUST:** use stable list keys from entity IDs. **MUST NOT:** use array indices for editable meeting parts or assignments.
- **MUST:** separate editing drafts from committed records and provide save, discard, and conflict behavior.
- **SHOULD:** memoize only where profiling demonstrates a benefit.
- **MUST:** handle Android lifecycle transitions and process recreation for timer/session screens.

## 5. State ownership and query strategy

| Data | Single authoritative owner | UI consumption |
|---|---|---|
| Meetings, parts, people, assignments | SQLite | Repository-backed reactive queries/read models |
| Trust records, revisions, sync journal | SQLite + keystore for key secrets | Read-only derived status |
| Active countdown | Timer engine with monotonic clock | Timer view-model subscription |
| Ephemeral form draft, dialogs, tab selection | Component state / Zustand | Local UI state |
| Remote public program cache | Validated local cache/storage | Source adapter and freshness metadata |
| Device credentials | Android Keystore-backed secure storage | Operations via crypto service, never direct screen access |

**MUST NOT:** mirror entire SQLite tables in Zustand and mutate the mirror as a separate authority. **MUST:** invalidate or refresh read models only after a successful commit. **MUST:** identify source and cache timestamps for online program data; never silently treat cached public content as current. **SHOULD:** debounce user search operations, not domain mutations.

### 5.1 Data mutation sequence

1. Parse and validate input.
2. Load current authoritative records and expected revision.
3. Authorize operation and enforce domain invariants.
4. Execute related writes and revision/change-journal entries **atomically**.
5. Commit transaction; only then emit a success notification or local event.
6. Refresh repository-backed queries and mark eligible changes pending publication.
7. If external delivery fails, preserve the committed local record and a retryable outbox entry.

**Never** show “synced” simply because a request was queued or sent. Require a valid acknowledgment of the committed revision.

## 6. SQLite, ACID, and schema rules

- **MUST:** enable SQLite foreign keys on every relevant connection, not merely declare FKs in schema.
- **SHOULD:** use WAL mode when compatible with the chosen runtime and migration/backup strategy.
- **MUST:** implement SQLite repository operations using parameterized statements. **MUST NOT:** interpolate untrusted values into SQL.
- **MUST:** use a transaction mechanism proven to isolate the intended operations. Expo SQLite transaction APIs have differing exclusivity guarantees; confirm correct behavior with integration tests and prefer exclusive transaction support where needed.
- **MUST:** wrap multi-table edits, import commits, published revisions, and change-journal append operations in one atomic transaction.
- **MUST:** define unique indexes, check constraints, FK actions, and nullable relationships according to `SYSTEM_DESIGN.md`.
- **MUST:** distinguish soft deletion/tombstones from hard deletion for records already synchronized.
- **MUST:** never reuse a migration version. Migrations need deterministic ordering, forward compatibility rules, and failure tests.
- **MUST:** perform backup validation and compatible schema checks before restore; never overwrite without explicit user approval.
- **SHOULD:** test integrity via `PRAGMA foreign_key_check` and `PRAGMA integrity_check` in diagnostic and migration suites.

**ACID mapping:** atomicity via transaction scope; consistency via DB constraints plus domain validation; isolation via transaction behavior and revision preconditions; durability via committed SQLite writes with appropriate storage behavior. **MUST NOT:** claim cross-device ACID transactions: LAN sync uses revision validation and recovery, not a distributed SQLite transaction.

## 7. Timer implementation rules

- **MUST:** derive elapsed time from a monotonic time source while active, not decrement a counter on every render interval.
- **MUST:** separate `IDLE`, `READY`, `RUNNING`, `PAUSED`, and `COMPLETED` states; all actions require explicit valid transitions.
- **MUST:** include manual start/pause/resume/reset/next/previous, configurable duration and warning thresholds, and selectable automatic mode.
- **MUST:** handle negative/zero durations, overtime, rapid repeated taps, double starts, screen rotation, and background/resume transitions.
- **MUST:** distinguish elapsed active time from wall-clock downtime when restoring a session. The recovery policy remains an open decision; never infer it silently.
- **MUST:** keep timer operation independent from Wi-Fi, PDF parsing, and schedule publication.
- **MUST:** make keep-screen-awake an explicit scoped lifecycle effect, with cleanup on exit.
- **MUST NOT:** synchronize live timer state between devices under the approved scope.

## 8. Offline import and external data boundaries

### 8.1 PDF workbook imports

- **MUST:** import locally and show a preview with identified meeting dates, parts, titles, and durations before commit.
- **MUST:** validate file format, type, size, parsing limits, and extracted content before persistence.
- **MUST:** treat all PDF text as untrusted data, never as executable instructions.
- **MUST:** preserve user edits, track provenance, and avoid silent duplicate overwrites.
- **MUST:** reject unsupported or malformed documents without modifying existing records.
- **SHOULD:** degrade gracefully if scanned PDF OCR is unavailable rather than pretending extraction succeeded.

### 8.2 Online public sources

- **MUST:** use documented/approved access paths, check licenses/terms and source reliability, and identify source metadata.
- **MUST:** provide predictable timeout, cancellation, retry with backoff, and manual fallback.
- **MUST:** keep congregation people/assignments and private notes out of online source requests.
- **MUST NOT:** claim an official JW.org API exists without validation, or scrape protected/undocumented endpoints as an assumed architecture dependency.
- **MUST:** require user review for imports that would overwrite existing meeting parts.

## 9. Local peer synchronization rules

- **MUST:** use authenticated, encrypted communication with verified device identity and replay protection; local Wi-Fi is not automatically trusted.
- **MUST:** keep LAN discovery and serving disabled until users explicitly enable or authorize pairing/sync.
- **MUST:** scope grants to congregation and operation, with default-deny for reading private records, editing, publishing, pairing, leadership changes, and revocation.
- **MUST:** enforce permissions within the receiving application service, not only by hiding UI controls.
- **MUST:** distinguish **draft**, **published**, **pending**, **acknowledged**, and **conflicted** revisions.
- **MUST:** enforce a single active authoritative publisher under the approved leader policy; validate leader epoch/term and revision ancestry when implemented.
- **MUST:** detect split-brain leadership and concurrent incompatible edits; do not silently apply last-write-wins for private assignment schedules.
- **MUST:** use idempotency keys or stable operation IDs for retryable mutations; duplicate deliveries must not duplicate assignments.
- **MUST:** commit received valid records and revision metadata atomically, then acknowledge.
- **MUST:** keep an explicit revocation and re-pairing path; old offline copies cannot be remotely erased.
- **MUST NOT:** send live timer state, arbitrary app files, or private data outside the approved sync scope.

## 10. Security and privacy standards (PoLP)

- **MUST:** minimize Android permissions; request runtime permissions only where required for the action in progress.
- **MUST:** store device private keys and sensitive credentials using Android Keystore-backed mechanisms; never store secrets in `EXPO_PUBLIC_*`, code, Git, crash logs, or unencrypted preferences.
- **MUST:** encrypt portable backups using an approved authenticated encryption scheme and protect keys/recovery secrets.
- **MUST:** verify message size, schema version, sender identity, grant, and revision before applying peer data.
- **MUST:** use secure random IDs and nonces for security-sensitive flows.
- **MUST:** redact names, assignments, device identifiers, tokens, and imported workbook text from routine telemetry/log output unless explicitly needed in protected diagnostics.
- **MUST:** keep external analytics/crash upload opt-in or excluded, preserving the no-mandatory-cloud product constraint.
- **MUST:** fail closed on missing permissions, invalid signatures, unsupported schema versions, and unverified pairing.
- **MUST:** document backup loss/recovery and device compromise limitations honestly.
- **SHOULD:** perform dependency/license/security auditing in CI and review native plugin permissions before adoption.

### 10.1 Authorization test matrix (minimum)

| Operation | Unpaired | Viewer | Authorized editor | Active leader | Device administrator |
|---|---|---|---|---|---|
| Read permitted schedules | Deny | Allow scoped | Allow scoped | Allow scoped | As granted |
| Create local draft | Deny | Deny | Allow | Allow | As granted |
| Publish authoritative revision | Deny | Deny | Deny by default | Allow | Only with publish grant |
| Pair/revoke devices | Deny | Deny | Deny | Deny by default | Allow |
| Run local timer | Local device policy | Allow if enabled | Allow if enabled | Allow if enabled | Allow if enabled |

Specific role bundling needs sign-off in `SYSTEM_DESIGN.md`; grants always override assumptions based on titles.

## 11. Accessibility and design-system standards

- **MUST:** use tokens from `design_guidelines.md`; do not scatter hard-coded colors, typography, shadows, or spacing across screens.
- **MUST:** support screen-reader labels, roles, state announcements, logical focus order, and accessible errors.
- **MUST:** target at least 48 × 48 dp touch targets and readable text under Android font scaling.
- **MUST:** target WCAG 2.2 AA contrast relevant to native UI; timer danger/success states need text or shape, not color alone.
- **MUST:** avoid forced orientation globally; immersive timer orientation behavior is a documented exception with accessible exit.
- **MUST:** show loading, success, error, empty, offline, stale, and sync-conflict states where applicable.
- **MUST:** use confirmation or reversible recovery for destructive deletion, restoration, and schedule publication.
- **MUST:** keep controls usable with TalkBack, hardware back navigation, and reduced-motion preferences.
- **SHOULD:** test low-end Android devices, smaller screens, tablet layouts, and large-text display settings.

## 12. Error handling, observability, and resilience

- **MUST:** return typed domain/application errors, not raw database exceptions to screens.
- **MUST:** surface actionable error messages without leaking internals or private information.
- **MUST:** differentiate invalid input, permission denial, conflict, offline/unavailable, integrity failure, and unexpected faults.
- **MUST:** roll back failed mutations, retain import drafts and offline outbox entries where safe, and expose retry/recovery actions.
- **MUST:** bound network retries, parser work, cache sizes, and background processing.
- **MUST:** make failure paths testable by injecting clocks, repositories, file readers, and network adapters.
- **SHOULD:** use structured, privacy-safe local diagnostic events that users control and export explicitly if support is needed.

## 13. Testing obligations

| Test layer | Mandatory coverage |
|---|---|
| Unit | Timer transitions, duration math, meeting rules, assignment conflicts, authorization, import normalization, sync revision logic |
| Repository integration | FK/check constraints, atomic rollback, migrations, concurrent/competing mutations, tombstones, outbox integrity |
| Adapter/contract | PDF fixtures, invalid files, online-source failure handling, encrypted peer payload schema, backup compatibility |
| Component | Forms, accessible labels, focus/validation errors, loading/offline/conflict UI |
| Android E2E | First launch, manual meeting setup, timer fullscreen/awake, assignments, airplane mode, PDF import preview, backup/restore |
| Multi-device E2E | Pairing, invalid peer rejection, publication, retry, deduplication, leader disconnect/rejoin, conflicts, revoke access |
| Security | Permission bypass attempts, replay attacks, malformed peer messages, log leakage, backup tampering |
| Performance | Timer drift target, large schedule queries, PDF processing limits, sync payload volume, cold startup |

**MUST:** tests include negative and edge cases, not only successful paths. **MUST:** use deterministic fake clocks for timer unit tests and real Android devices/emulators for lifecycle verification. **MUST:** test with networks disabled, interrupted, and restored. **SHOULD:** document minimum coverage targets in Phase 0, prioritizing critical-domain branch coverage over a single aggregate percentage.

## 14. CI, source control, and change management

- **MUST:** use short-lived branches and reviewed PRs for changes to domain, DB, security, networking, and release workflows.
- **MUST:** keep a lockfile; CI must use reproducible dependency installation.
- **MUST:** block merges on TypeScript errors, lint failures, unit tests, relevant integration tests, and migration validation.
- **MUST:** scan dependencies and secrets; never commit keystores, API credentials, private certificates, or user data fixtures.
- **MUST:** require an ADR for deviations from architecture boundaries, database ownership, security posture, or data-sharing scope.
- **MUST:** require schema + migration + rollback/restore testing in the same PR as a persistent model change.
- **MUST:** update `API.md`, `SYSTEM_DESIGN.md`, `SCREEN_FLOWS.md`, and/or `design_guidelines.md` when a change modifies their contracts.
- **MUST:** keep app version and database schema version distinct; test upgrade paths across supported releases.
- **MUST:** sign Android release artifacts using protected credentials; do not treat optional Docker/VPS deployment as a prerequisite for Android operation.
- **SHOULD:** use staged rollout or an internal test track before broad release.

## 15. Code review checklist

A reviewer must confirm the applicable items before approval:

- [ ] Feature matches approved user workflow and scope; no new cloud dependency or live timer syncing.
- [ ] Presentation, application, domain, and infrastructure boundaries are respected.
- [ ] SOLID responsibilities are clear; no duplicated domain policy or speculative abstraction.
- [ ] TypeScript strict checks pass; untrusted inputs are validated at boundaries.
- [ ] Persistent changes use ACID-safe transactions; constraints and change journal are updated together.
- [ ] SQLite remains the durable source of truth; transient Zustand state is not a competing record store.
- [ ] Permissions are checked server-side **within the receiving peer application service** and fail closed.
- [ ] Secrets and private assignment data are excluded from logs, public network calls, and builds.
- [ ] Offline, retry, conflict, migration, and recovery paths are explicitly handled.
- [ ] Timer uses monotonic time and performs lifecycle cleanup; no live peer timer state transfer.
- [ ] UI is accessible: labels, focus, contrast, 48 dp targets, scaling, and non-color alerts.
- [ ] Tests cover success, invalid input, disconnected state, permission denial, and rollback.
- [ ] Documentation, migration notes, and release implications are updated where affected.

## 16. Merge blockers and exception process

**Automatic rejection / merge blockers:**

1. SQL concatenation with untrusted values or multi-table mutations outside required transactions.
2. Network transfer of congregation-private data to unauthorized or cloud endpoints.
3. An unauthenticated LAN endpoint that exposes or mutates schedules or assignments.
4. Client-only authorization checks for a protected peer mutation.
5. Persistent record ownership duplicated between SQLite and independently mutable Zustand stores.
6. Timer based solely on UI interval ticks, or live timer synchronization introduced without a new approved scope decision.
7. Shipping private keys, signing credentials, or personal data in repository/build artifacts.
8. Unreviewed destructive restore or import behavior with silent overwrites.
9. Breaking accessibility of a critical timer or scheduling workflow without remediation.
10. Schema changes without migration and restore validation.

**Exception process:** Open an ADR documenting problem, alternatives, risks, mitigations, owner, expiration/review date, and approval. Exceptions MUST NOT waive privacy or core security requirements without an explicit product scope and threat-model revision.

## 17. Open decisions and future refinements

The following require an ADR or approved product decision before related production code:

| ID | Decision | Why it matters |
|---|---|---|
| CP-01 | Minimum Android SDK and supported devices | Native API compatibility and testing matrix |
| CP-02 | Exact timer automatic transitions and recovery policy | Deterministic timer behavior |
| CP-03 | Peer discovery/transport and crypto protocol | Security, permissions, Android constraints |
| CP-04 | Leader handoff, term/epoch, and partition handling | Split-brain and sync integrity |
| CP-05 | PDF library and supported workbook formats/languages | Offline parser limits and licensing |
| CP-06 | Permitted public online source integration | Legal/technical reliability |
| CP-07 | Backup encryption, key recovery, and format versions | Restore and device loss scenarios |
| CP-08 | Conflict rules, people directory merge and tombstone retention | Cross-device consistency |
| CP-09 | Localization and calendar/timezone conventions | Correct meeting dates and accessibility |
| CP-10 | App distribution channel, build signing, and update support | Release and migration compatibility |

## 18. Definition of done

A feature is **done** only when it has a clear specification and acceptance criteria, an accessible UI if user-facing, domain/application boundaries, validated inputs, transaction/permission enforcement where applicable, appropriate offline/error handling, automated tests at the relevant layers, documentation updates, and passing CI checks. A demonstrated happy path is not sufficient.

---

**Document precedence:** Approved product decisions and safety/privacy constraints take precedence. `SYSTEM_DESIGN.md` owns detailed entity schema and domain invariants; `API.md` owns peer/in-process contracts; `design_guidelines.md` owns UI tokens; `CI_CD_ROADMAP.md` owns release pipelines. Any contradictory requirement must be resolved explicitly, not guessed in code.
