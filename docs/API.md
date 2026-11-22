# JW Meeting Timer — API and Integration Contract

**Source mapping update (2026-11-21):** [ADR 0003](adr/0003-react-navigation-and-source-layout.md) supersedes the older Expo Router/features/infrastructure path examples. Current profile, timer and diagnostics source ownership is listed in [DIRECTORY_STRUCTURE.md](DIRECTORY_STRUCTURE.md). This refactor changes no in-process operation semantics, peer protocol, permission or data format. Verification is pending.

**File:** `API.md`  
**Version:** 1.0 (proposed contract, not implemented)  
**Date:** 2026-11-20  
**Platform:** Android, React Native + Expo development build + strict TypeScript  
**Related:** `TECHNICAL_PLAN.md`, `SYSTEM_DESIGN.md`, `SCREEN_FLOWS.md`, `design_guidelines.md`

## 1. Scope and architectural boundaries

**Phase 6 implementation update (2026-11-21):** [ADR 0005](adr/0005-trusted-publishing-and-phase-6.md) specifies protocol-v2 signed complete datasets, proposals and receipts over pinned TLS `sync.exchange`, with stable publisher IDs, explicit fixed authority and transactional acceptance. Earlier REST-like paths remain proposals, not implemented HTTP endpoints. [Owner verification](PHASE_6_OWNER_CHECKS.md) is pending.

This specification distinguishes **three interfaces**:

1. **In-process application API:** React Native screens invoke typed TypeScript use cases. This is the *primary* API for local meeting, timer, people, import, and backup operations. These are **not HTTP endpoints**.
2. **Optional peer-LAN API:** a *proposed*, versioned device-to-device protocol for **meeting programs, people, schedules, and assignments only**. It does **not** synchronize a running timer. Proposed REST-like paths below are transport-neutral contract names until Phase 0 validates an Android-hosted HTTP(S) server or selects a framed secure socket protocol.
3. **Public-source adapter:** a client for permitted public meeting-program retrieval. The upstream provider, methods, URLs and license/terms are **unverified**; no JW.org or KHMS endpoint is asserted or invented here.

**There is no hosted backend, public API, login endpoint, user token service, or mandatory cloud infrastructure.** Each paired device owns a local SQLite database; a single authorized **schedule publishing leader** publishes the accepted revision. Private meeting assignments must not be sent to the internet. The network layer is disabled until the operator explicitly enables trusted local sharing.

### Contract status legend

- **Approved:** reflects a confirmed product behavior.
- **Proposed:** design contract to implement and validate.
- **Blocked:** must await feasibility, security or rights approval.

All endpoint paths, method assignments, response samples, and source file mappings in this document are **proposed, not existing code**.

## 2. Naming, versioning and common conventions

- Proposed peer namespace: `/peer/v1` (local network only), protocol version `1`, JSON encoded UTF-8. If transport changes, preserve semantic operation names and versioned payloads.
- Payload identifiers: stable UUID strings; foreign keys reference authoritative IDs. All date-only meeting values use `YYYY-MM-DD`; instants use ISO 8601 UTC; durations use integer seconds.
- Never assume two devices' wall clocks are synchronized. Use revision parentage and authenticated leader **term/epoch**, not timestamp-based last-write-wins.
- Write requests include `requestId` (idempotency key), `congregationId`, `schemaVersion`, and `expectedRevision` when mutating schedule data.
- Supported query pagination: bounded `limit` and opaque `cursor` on list reads. Query filters must be allowlisted, never interpolated into SQL.
- Expected error envelope: `{ "error": { "code": "REVISION_CONFLICT", "message": "...", "requestId": "...", "retryable": false } }`. Never return private key material, full SQL error traces or sensitive diagnostics.
- Error categories: `VALIDATION_ERROR`, `NOT_PAIRED`, `PERMISSION_DENIED`, `DEVICE_REVOKED`, `INVALID_SIGNATURE`, `REPLAY_DETECTED`, `LEADER_REQUIRED`, `REVISION_CONFLICT`, `UNSUPPORTED_PROTOCOL`, `UNSUPPORTED_SCHEMA`, `NOT_FOUND`, `RATE_LIMITED`, `STORAGE_ERROR`, `SOURCE_UNAVAILABLE`.
- Semantic statuses if HTTP is chosen: `200/201/204` success; `400/422` invalid; `401` untrusted/unauthenticated; `403` insufficient scope; `404` not found; `409` conflict; `410` revoked/expired; `413` oversized payload; `429` rate limit; `500/503` internal/unavailable. A replayed idempotent request must return the original outcome, not reapply changes.
- Secrets, pairing data and personal information must not appear in path segments or network discovery announcements.

## 3. Environment and build-time configuration

Expo `EXPO_PUBLIC_*` variables are **embedded in the application bundle** and **are not secrets**. Use them only for public, non-sensitive values. Prefer typed build configuration plus runtime settings stored locally when changes must occur without rebuilding.

| Reference name | Visibility | Purpose / default | Constraint |
|---|---|---|---|
| `EXPO_PUBLIC_APP_ENV` | Public build-time | `development`, `preview`, `production` | Controls nonsecret diagnostics labels only, not authorization bypasses |
| `EXPO_PUBLIC_DB_SCHEMA_VERSION` | Public build-time | Current migration compatibility number | Must match migration registry, do not manually use it for migration decisions |
| `EXPO_PUBLIC_PEER_PROTOCOL_VERSION` | Public build-time | `1` | Handshake must negotiate supported versions |
| `EXPO_PUBLIC_SOURCE_SYNC_ENABLED` | Public build-time | `false` until approved | Feature gate, not a security control |
| `EXPO_PUBLIC_PEER_SYNC_ENABLED` | Public build-time | `false` during feasibility | Requires separately approved runtime opt-in |
| `EXPO_PUBLIC_DIAGNOSTICS_LEVEL` | Public build-time | `minimal` | Never enables sensitive payload logging in production |
| `JWMT_PUBLIC_SOURCE_ALLOWLIST` | Private build configuration or in-app fixed config | Empty until source reviewed | Domain list is not secret, but enforce approved HTTPS origin at runtime |
| `ANDROID_APPLICATION_ID` | Build config | Stable Android package ID, to be selected | Signatures and app upgrade identity must remain consistent |
| `EAS_BUILD_PROFILE` | CI/build context | `development`, `preview`, `production` | Used only in build pipeline, not trusted as runtime authorization |

**Do not create or ship environment variables for:** device private keys, backup passwords, cryptographic seeds, administrator PINs, congregation access tokens or user identifiers. Generate device identity on-device and keep key references in the Android Keystore. Ask for backup passphrases interactively. Peer addresses and local ports are discovered at runtime, not stored as deployment secrets. If a future supported public source requires credentials, its storage/security design needs a new ADR; never place them in `EXPO_PUBLIC_*`.

**Configuration precedence:** security-critical baked defaults → authorized device-local settings → validated session options. Environment flags cannot elevate pairing or schedule publishing privileges.

## 4. Source file mapping and module contracts

Source locations below are *target paths*, consistent with the planned repository. File names are examples; only the module ownership boundary is normative.

| Module | UI route / entry point | Application use-case location | Adapter / repository mapping |
|---|---|---|---|
| Meetings | `app/(tabs)/meetings.tsx`, `app/meeting/[id].tsx` | `src/features/meetings/application/` | `src/infrastructure/db/repositories/meetings-repository.ts` |
| Program parts | Meeting editor (same route) | `src/features/meetings/application/` | `src/infrastructure/db/repositories/program-repository.ts` |
| People | Assignment/people screens | `src/features/people/application/` | `src/infrastructure/db/repositories/people-repository.ts` |
| Assignments | `app/(tabs)/assignments.tsx` | `src/features/assignments/application/` | `src/infrastructure/db/repositories/assignments-repository.ts` |
| Timer | `app/(tabs)/timer.tsx`, `app/timer/fullscreen.tsx` | `src/features/timer/application/` | `src/infrastructure/clock/`, local timer engine |
| Imports | `app/imports/preview.tsx` | `src/features/imports/application/` | `src/infrastructure/pdf/`, `src/infrastructure/network/public-source/` |
| Pairing/trust | `app/devices/pair.tsx` | `src/features/security/application/` | `src/infrastructure/crypto/`, `src/infrastructure/network/peer-lan/` |
| Schedule sync | Device/sync screens | `src/features/sync/application/` | `src/infrastructure/network/peer-lan/`, `src/infrastructure/db/` |
| Backup | `app/backups/index.tsx` | `src/features/backups/application/` | `src/infrastructure/files/`, `src/infrastructure/crypto/` |
| Settings | `app/(tabs)/settings.tsx` | `src/features/settings/application/` | `src/infrastructure/db/repositories/settings-repository.ts` |

**SOLID boundary:** screens depend on small use-case interfaces, use cases depend on repository and gateway ports, adapters implement those ports. UI components never construct SQL, manage private keys, or issue raw peer writes. Shared authorization, schema validation, transaction orchestration and error mapping are single-use implementations (DRY); keep route handlers thin (KISS).

## 5. In-process application API (no HTTP)

These contracts are callable only inside the installed Android application. Each mutation validates input, authorizes the local device's permissions, performs a single transaction where persistent writes occur, and returns a typed `Result` or a domain error. The eventual function signatures will be specified during implementation without changing user-visible semantics.

| Operation (logical) | Kind | Purpose | Owning source |
|---|---|---|---|
| `ListMeetings` / `GetMeetingProgram` | Query | Retrieve SQLite-backed meeting calendar and agenda | `src/features/meetings/application/` |
| `CreateMeeting` / `UpdateMeeting` / `ReorderParts` / `ArchiveMeeting` | Command | Mutate local meeting draft and agenda | `src/features/meetings/application/` |
| `ListPeople` / `SavePerson` / `DeactivatePerson` | Query/command | Manage participants and role eligibility | `src/features/people/application/` |
| `ListAssignments` / `AssignPerson` / `CancelAssignment` | Query/command | Manage duties with overlap and eligibility checks | `src/features/assignments/application/` |
| `StartTimer` / `PauseTimer` / `ResumeTimer` / `AdvancePart` / `ResetTimer` | Command (in-memory) | Change local timer state; no peer traffic | `src/features/timer/application/` |
| `ParseWorkbook` / `PreviewProgramImport` / `ConfirmProgramImport` | Query/command | Parse file, inspect diff, commit selected changes | `src/features/imports/application/` |
| `RefreshPublicProgramCandidate` | Query | Fetch only approved public content, stage review candidate | `src/features/imports/application/` |
| `GeneratePairingInvitation` / `ApprovePeer` / `RevokePeer` | Command | Create/alter local trust after explicit operator approval | `src/features/security/application/` |
| `CreateScheduleDraft` / `PublishSchedule` / `ResolveScheduleConflict` | Command | Manage schedule revision lifecycle and leader authority | `src/features/sync/application/` |
| `ExportBackup` / `ValidateBackup` / `RestoreBackup` | Command | Encrypted local portable archives and recovery | `src/features/backups/application/` |
| `GetSettings` / `UpdateSettings` | Query/command | Persist authorized local preferences | `src/features/settings/application/` |

**In-process mutations side-effects policy:** every persistent command lists its affected entities, required privilege, expected revision/preconditions, audit/change journal additions, cache invalidation and rollback behavior before implementation. Timer commands update the dedicated runtime state machine only, except explicitly approved local recovery checkpoints. No background UI re-render may accidentally publish a schedule.

## 6. Peer-LAN read and lifecycle endpoints (proposed)

**Important:** Proposed path-method combinations below describe an eventual local HTTP transport **only if** Phase 0 approves one. A non-HTTP transport should expose equivalent versioned messages. Public unauthenticated discovery must not reveal congregation names, people, meetings or assignments.

| Method | Path | Description | Required scope / precondition | Proposed handler mapping |
|---|---|---|---|---|
| `GET` | `/peer/v1/health` | Minimal transport/protocol readiness, no private data | Limited discovery only; rate-limited; no sensitive metadata | `src/infrastructure/network/peer-lan/health-handler.ts` |
| `POST` | `/peer/v1/pairing/challenge` | Begin short-lived authenticated pairing ceremony | Explicit physical initiation; rate limit; single-use invitation | `src/features/security/application/`, `.../peer-lan/pairing-handler.ts` |
| `POST` | `/peer/v1/pairing/confirm` | Verify challenge, display peer identity for approval, grant scoped trust | Mutual confirmation and proof of key possession | Same pairing handler; `src/infrastructure/crypto/` |
| `POST` | `/peer/v1/sessions/open` | Negotiate protocol and authorize encrypted session | Paired, unrevoked device, challenge proof | `src/infrastructure/network/peer-lan/session-handler.ts` |
| `GET` | `/peer/v1/congregations/{id}/revisions/head` | Get latest accepted schedule revision metadata | `schedule:read` for specific congregation | `src/features/sync/application/`, `.../peer-lan/revision-handler.ts` |
| `GET` | `/peer/v1/congregations/{id}/revisions` | Retrieve authorized revision pages since a known cursor | `schedule:read`, authenticated session; limit bounded | Same revision handler |
| `GET` | `/peer/v1/congregations/{id}/revisions/{revisionId}` | Fetch one signed revision and authorized field projection | `schedule:read` and matching scope | Same revision handler |
| `GET` | `/peer/v1/congregations/{id}/sync/status` | Get only caller-relevant ack/pending state | `schedule:read`, trusted session | `.../peer-lan/sync-handler.ts` |
| `GET` | `/peer/v1/devices/self/grants` | Return caller's own grants and expiration metadata | Trusted session | `.../peer-lan/grants-handler.ts` |

**No peer endpoints for live timer start, pause, reset, tick, fullscreen, screen-awake, or device clock changes.** No endpoint exposes unfiltered full database downloads or third-party trackers.

## 7. Peer-LAN mutating endpoints and side-effect checklists (proposed)

These checklists are **required per route**, not optional generic advice. All mutating requests require input size/depth limits, schema validation, authenticated encrypted transport where applicable, operation-specific authorization, idempotency, replay protection, audit metadata without sensitive payloads, and deterministic failures. Pairing bootstrap is the only narrowly scoped exception to established peer authorization.

### M01 — `POST /peer/v1/pairing/challenge`

**Purpose:** Register a short-lived pairing attempt. **Owner:** `src/features/security/application/`, `src/infrastructure/network/peer-lan/pairing-handler.ts`.

- [ ] Operator deliberately opens the pairing flow on both devices; invitation expires quickly.
- [ ] Validate protocol, invitation proof, nonce uniqueness, size, timeout and pairing rate limits.
- [ ] Store **ephemeral** pending challenge only; no permanent device grant or congregation data access.
- [ ] Record minimal attempt outcome without logging invitation, keys or identities beyond required audit metadata.
- [ ] Expire/erase pending state on rejection, failure or timeout; duplicate nonce cannot replay.
- [ ] Return generic failure responses to prevent device or congregation enumeration.

### M02 — `POST /peer/v1/pairing/confirm`

**Purpose:** Complete mutual verification and grant trust. **Owner:** pairing handler + `src/infrastructure/crypto/`.

- [ ] Require cryptographic proof of private-key possession and confirm human-verified peer fingerprint/short code on both sides.
- [ ] Require authorized device administrator approval of exact congregation and minimal permission scopes.
- [ ] Verify invitation unused and peer not revoked; reject trust-on-first-use silently.
- [ ] Atomically persist device record, granted scopes, grant version and trust audit/journal metadata.
- [ ] Do not grant publisher/admin capability by default; pairing defaults to read-only if approved.
- [ ] On failure roll back grants and clear challenge; never leave partially trusted device.
- [ ] Notify user of successful pairing only after commit on both required sides; handle one-sided completion with an untrusted/pending state.

### M03 — `POST /peer/v1/sessions/open`

**Purpose:** Establish authenticated secure session. **Owner:** `src/infrastructure/network/peer-lan/session-handler.ts`.

- [ ] Check peer identity, non-revoked grant, challenge freshness and protocol compatibility.
- [ ] Negotiate session encryption and session-bound congregation scope; enforce short idle timeout.
- [ ] Create ephemeral session entry; **no** meeting/assignment mutation.
- [ ] Bind requests to verified session identity; reject replay and downgrade attempts.
- [ ] Expire and erase session keys on close or authentication failure; avoid logging secrets.

### M04 — `POST /peer/v1/congregations/{id}/drafts`

**Purpose:** Submit an unpublished proposal from an authorized editor to leader. **Owner:** `src/features/sync/application/`, `.../peer-lan/draft-handler.ts`.

- [ ] Require `schedule:draft` grant in congregation; confirm current publishing leader is recipient.
- [ ] Validate `baseRevision`, UUIDs, field scopes, role eligibility, local date representation and payload size.
- [ ] Reject forbidden data (timer runtime state, private keys, unrelated congregation profiles).
- [ ] Atomically store draft, draft items and minimal change/audit journal; do not publish or change accepted head.
- [ ] Return draft ID and `pending_review` status; idempotent retries return same draft.
- [ ] Invalidate draft review projections only, not published schedule caches.
- [ ] On conflict preserve proposal for leader review, with no silent overwrite.

### M05 — `PATCH /peer/v1/congregations/{id}/drafts/{draftId}`

**Purpose:** Update an unpublished draft. **Owner:** same draft handler.

- [ ] Require `schedule:draft` plus draft ownership or explicit leader editing grant.
- [ ] Validate draft is editable and optimistic expected draft version matches.
- [ ] Validate modified assignment/part records and prevent cross-congregation references.
- [ ] Atomically update draft version and journal entry; leave accepted published revision unchanged.
- [ ] Reject stale version with `REVISION_CONFLICT`, preserving both client and server copies.
- [ ] Invalidate only the affected draft read model and pending-review counts.

### M06 — `DELETE /peer/v1/congregations/{id}/drafts/{draftId}`

**Purpose:** Withdraw an unpublished draft. **Owner:** same draft handler.

- [ ] Require ownership or leader-approved deletion scope.
- [ ] Reject deletion of published revisions or drafts under active finalization.
- [ ] Soft-cancel with a tombstone/audit record; do not cascade-delete canonical meetings or assignments.
- [ ] Preserve required ancestry and audit references; invalidate draft lists only.
- [ ] Idempotently return cancelled status for retries; rollback on failure.

### M07 — `POST /peer/v1/congregations/{id}/revisions/publish`

**Purpose:** Publish an authoritative schedule revision. **Owner:** `src/features/sync/application/`, `.../peer-lan/revision-handler.ts`.

- [ ] Require `schedule:publish` and proof of active, non-expired leadership for congregation and term.
- [ ] Validate parent hash/revision exactly equals accepted head; reject concurrent or stale publication.
- [ ] Revalidate meeting dates, part sequencing, person eligibility, overlapping assignments and referenced IDs.
- [ ] Canonicalize approved change set, hash and sign immutable revision; verify private key use via Keystore.
- [ ] Atomically commit canonical schedule rows, new head, revision ancestry, change journal and outbox work.
- [ ] Never transmit or modify live countdown state; never auto-overwrite manually edited imports.
- [ ] Invalidate schedule/assignment projections after commit; queue LAN dissemination, never claim remote delivery before ack.
- [ ] Return accepted revision ID/hash/term; retry with same `requestId` must not double-publish.

### M08 — `POST /peer/v1/congregations/{id}/revisions/apply`

**Purpose:** Apply validated leader revision to follower. **Owner:** `src/features/sync/application/`, `.../peer-lan/sync-handler.ts`.

- [ ] Require verified session from leader (or authorized revision relay under approved policy); confirm grant scope.
- [ ] Verify signature, publisher identity, accepted leader term, parent revision, content hash and idempotency.
- [ ] Validate every entity reference and schema version **before** transaction.
- [ ] Atomically apply canonical rows, tombstones, accepted head, journal, inbox acknowledgment candidate.
- [ ] Preserve local unsubmitted drafts, presenting any divergence as a conflict rather than discarding it.
- [ ] Reject divergent ancestry, stale leader term or revoked publisher; never use last-write-wins.
- [ ] Invalidate relevant read projections only after commit; acknowledge acceptance, not display/render completion.

### M09 — `POST /peer/v1/congregations/{id}/revisions/{revisionId}/ack`

**Purpose:** Record peer's acceptance of a revision. **Owner:** `src/features/sync/application/`, `.../peer-lan/sync-handler.ts`.

- [ ] Require `schedule:read` and verified device identity; revision must exist and match hash.
- [ ] Upsert acknowledgment by `(deviceId, revisionId)` transactionally; no schedule mutation.
- [ ] Reject future/nonexistent revisions and misleading ack claims from other devices.
- [ ] Invalidate status projections; acknowledgments are not permission to publish.
- [ ] Duplicate acknowledgment is harmless and returns same state.

### M10 — `POST /peer/v1/congregations/{id}/leadership/transfer`

**Purpose:** Initiate explicit transfer of schedule publishing authority. **Owner:** `src/features/sync/application/`, `.../peer-lan/leadership-handler.ts`.

- [ ] Require current leader/admin authorization and verified target device with eligible publishing grant.
- [ ] Bind transfer to accepted schedule head and increasing leadership term.
- [ ] Persist **pending transfer** record, signed intent and expiration; do not silently switch leader.
- [ ] Reject concurrent transfers and disconnected stale terms; no automatic majority election presumed.
- [ ] Expose pending status for confirmation and safe cancellation; retain audit history.
- [ ] On network loss, keep previous verified leadership state until explicit completion rules apply.

### M11 — `POST /peer/v1/congregations/{id}/leadership/confirm`

**Purpose:** Complete transfer after target accepts signed authority. **Owner:** leadership handler.

- [ ] Require authorized target device proof and valid non-expired transfer intent.
- [ ] Validate term is strictly increasing and previous accepted revision matches.
- [ ] Atomically record new leader certificate/term, revoke old publishing authority for that term, and journal event locally.
- [ ] Propagate signed leadership certificate on subsequent sync; reject stale publishing devices.
- [ ] If partial/disconnected completion occurs, mark disputed state and block conflicting publishing until reconciliation.
- [ ] Invalidate permissions and leader status caches after commit.

### M12 — `PATCH /peer/v1/congregations/{id}/devices/{deviceId}/grants`

**Purpose:** Narrow or modify a peer's permissions. **Owner:** `src/features/security/application/`, `.../peer-lan/grants-handler.ts`.

- [ ] Require `device:admin`, verify target belongs to same congregation, validate new scopes against allowlist.
- [ ] Disallow privilege escalation through lower-privileged updater and unapproved grant of `schedule:publish`.
- [ ] Atomically write new grant version, audit entry and notification/outbox item.
- [ ] Immediately invalidate local session authorizations/cache; notify peers when reachable.
- [ ] Reject stale grant version; block grants to revoked device identities.
- [ ] Recognize offline peer may remain unaware until reconnection, so limit session lifetime and recheck grant versions.

### M13 — `DELETE /peer/v1/congregations/{id}/devices/{deviceId}/trust`

**Purpose:** Revoke future synchronization trust. **Owner:** same grants handler.

- [ ] Require `device:admin`, explicit destructive confirmation and target-device verification.
- [ ] Prevent accidental loss of last administrative/leader capability without approved recovery process.
- [ ] Atomically tombstone trust, increment revocation/grant version and append audit/outbox record.
- [ ] Disconnect currently reachable sessions, deny future handshakes and remove peer from authorized sync fan-out.
- [ ] Invalidate paired-device and permission caches; retry is idempotent.
- [ ] Clearly state that revocation **cannot erase copies already held offline**.

### M14 — `POST /peer/v1/congregations/{id}/sync/conflicts/{conflictId}/resolve`

**Purpose:** Resolve a divergent proposal or revision conflict. **Owner:** `src/features/sync/application/`, `.../peer-lan/conflict-handler.ts`.

- [ ] Require `schedule:publish` plus active leader proof; require explicit resolution choice from UI.
- [ ] Validate conflict still open, base/head revisions unchanged and references valid.
- [ ] Preserve both competing versions, decision reason and linked new revision.
- [ ] Atomically write chosen canonical change set, signed new revision, conflict resolution and journal/outbox.
- [ ] Fail with `REVISION_CONFLICT` if another resolution landed; do not auto-merge assignment overlaps.
- [ ] Invalidate meeting and assignment projections after commit and send only authorized diff.

### Mutating route coverage inventory

| ID | Method | Path | Persisted state or side effect |
|---|---|---|---|
| M01 | POST | `/peer/v1/pairing/challenge` | Ephemeral pending pairing attempt |
| M02 | POST | `/peer/v1/pairing/confirm` | Device trust and scoped grants |
| M03 | POST | `/peer/v1/sessions/open` | Ephemeral secure session |
| M04 | POST | `/peer/v1/congregations/{id}/drafts` | Unpublished draft and journal |
| M05 | PATCH | `/peer/v1/congregations/{id}/drafts/{draftId}` | Draft update and version |
| M06 | DELETE | `/peer/v1/congregations/{id}/drafts/{draftId}` | Soft-cancelled draft/tombstone |
| M07 | POST | `/peer/v1/congregations/{id}/revisions/publish` | Published schedule revision |
| M08 | POST | `/peer/v1/congregations/{id}/revisions/apply` | Atomic follower schedule update |
| M09 | POST | `/peer/v1/congregations/{id}/revisions/{revisionId}/ack` | Per-device accepted-revision ack |
| M10 | POST | `/peer/v1/congregations/{id}/leadership/transfer` | Pending signed leadership transfer |
| M11 | POST | `/peer/v1/congregations/{id}/leadership/confirm` | New leader term/certificate |
| M12 | PATCH | `/peer/v1/congregations/{id}/devices/{deviceId}/grants` | Permission scope/version update |
| M13 | DELETE | `/peer/v1/congregations/{id}/devices/{deviceId}/trust` | Peer revocation/tombstone |
| M14 | POST | `/peer/v1/congregations/{id}/sync/conflicts/{conflictId}/resolve` | Recorded conflict resolution and revision |

**Implementation note:** M04–M06, M10–M11 and M14 may be expressed as in-process commands plus signed peer events rather than separate HTTP methods. The security and consistency side effects remain mandatory regardless of wire transport. These 14 routes are proposed protocol operations, **not promises of a pre-existing API**.

## 8. Public-source and PDF interface contracts

### 8.1 Permitted online meeting program source (blocked pending validation)

**Logical operation:** `RefreshPublicProgramCandidate(source, period, language)`; adapter: `src/infrastructure/network/public-source/`.

- Before implementation: verify source provenance, permitted access, locale/format stability, rate limits and rights; document an ADR and test fixtures.
- Do not invent official JW.org JSON endpoints, scrape behind access controls or send congregation-private data to publication sites.
- Candidate source query uses HTTPS origin allowlist, strict timeouts, bounded response sizes and limited refresh frequency.
- Prefer conditional requests (`ETag`/`If-Modified-Since`) when supported; cache source metadata and content hash locally.
- On success: validate → normalize → compare against local draft → **user previews and confirms** → transactional import.
- On failure: preserve existing meetings, show last successful source refresh, and allow manual/PDF alternatives.
- No POST/PATCH/DELETE operation is proposed against an upstream publication service.

### 8.2 Local PDF import (no HTTP)

**Logical operations:** `SelectLocalFile` → `ParseWorkbook` → `PreviewProgramImport` → `ConfirmProgramImport`; adapter: `src/infrastructure/pdf/`.

- Enforce document selection via Android picker and bounded file size/page count. No remote upload.
- Parse supported text PDFs on-device; detect scanned/unsupported/corrupt documents, surface reviewable errors.
- Record source hash/provenance; stage normalized candidate and duplicate detection.
- Import only after explicit review, checking meeting dates, part order, duration, locale, custom edits and conflict policy.
- Use a single SQLite transaction for canonical rows, import provenance and change journal.
- Reject malformed payloads without partial meeting mutation. OCR is deferred unless approved.

Watchtower PDF candidates use the existing local preview/editor save path.
Their source metadata is `{ filename, page, parser: 'watchtower-v1' }`.
The page is the physical PDF article-start page. Existing workbook parser
identifiers remain valid; no database migration is required.

Supported Watchtower layouts are the supplied English and Waray study editions.
Contents headings determine program language; song headers must match that language.
Ambiguous contents language is rejected.
Review requires confirmed songs, date, and local start time, using the
saved congregation timezone. No upstream request or automatic save occurs.

### 8.3 Manual encrypted backup and transfer (no HTTP by default)

**Logical operations:** `ExportBackup`, `ValidateBackup`, `RestoreBackup`; adapter: `src/infrastructure/files/` and `src/infrastructure/crypto/`.

- Default to offline encrypted file selected through the Android document provider; validate integrity and schema before restore.
- Backup requires user intent and an encryption/passphrase workflow; neither backup nor passphrase goes to cloud automatically.
- Restore into a staged database or validated transaction with rollback/recovery plan. Do not import trusted peer identities or private keys as transferable authentication.
- Re-pair a restored/new device and require explicit confirmation before replacing or merging local schedules.

## 9. Queries, caching and data consistency

**Local read path:** SQLite repositories → reactive query / read model → UI components. SQLite is the only durable authority for meeting, people and assignment records. Zustand holds only temporary form values, filters and navigation preferences. An active timer uses its own clock-backed state machine, never a polling HTTP API.

**Query strategy:** indexed queries by congregation, meeting date/type, active status, role and schedule revision. Filter and pagination are validated. Return small screen-specific projections rather than entire entity graphs.

**Cache rules:**

| Cache | Source of truth | TTL / invalidation |
|---|---|---|
| Meeting/assignment UI read models | SQLite | Invalidate after committed local write or applied revision; no arbitrary TTL required |
| Public meeting source candidate | Public source + local cached metadata | Bounded age, explicit user refresh, conditional retrieval when supported |
| Peer discovery | Local discovery | Short-lived, expire when peers disappear or sessions close |
| Authorized session grants | SQLite trusted-device/grant records | Refresh each handshake, invalidate immediately on local revocation/grant change |
| Live timer view | Timer engine | Derived from monotonic elapsed time, refresh for display only |

**Atomic write rule:** canonical database edits, their corresponding revision/journal rows and durable sync outbox entries share one SQLite transaction. Do not publish network notifications before successful commit. Imported remote revisions are signature/schema checked first, then applied atomically and acknowledged afterward.

**Sync delivery:** at-least-once retry with idempotent apply and deduplication, not exactly-once network guarantees. Avoid stale-read overwrite using base revision and signed parent hash checks. Conflicts remain visible until explicitly reconciled. Local drafts survive peer updates.

## 10. Authorization matrix and privacy boundary

| Capability | Viewer | Draft editor | Schedule leader | Device admin | Local timer operator |
|---|---:|---:|---:|---:|---:|
| Read authorized published schedule | ✓ | ✓ | ✓ | Configured | No implicit grant |
| View authorized people/assignments | Scoped | Scoped | Scoped | Configured | No implicit grant |
| Create/edit unpublished draft | — | ✓ | ✓ | Configured | — |
| Publish authoritative revision | — | — | ✓ | Only if also leader | — |
| Resolve publication conflict | — | — | ✓ | Only if also leader | — |
| Pair/revoke devices and change grants | — | — | — | ✓ | — |
| Operate own local timer | Device UI policy | Device UI policy | Device UI policy | Device UI policy | ✓ |

**No login is not the same as no security.** All peer-side reads and writes require verified device trust and congregation-scoped authorization. Permission is attached to the device rather than a verified human identity, a risk requiring user-visible safeguards and local OS screen-lock guidance. Data transferred to another authorized device becomes a locally stored copy, not a remote cloud database.

## 11. Known issues, decisions and maintenance rules

| ID | Issue / unresolved point | Effect | Required resolution |
|---|---|---|---|
| API-01 | Android inbound local HTTP(S) hosting and certificate lifecycle not validated in Expo build | Proposed peer routes may change transport | Phase 0 physical-device feasibility spike and ADR |
| API-02 | Offline split-brain leadership during network partitions | Conflicting accepted revisions | Explicit term/certificate and recovery policy before enabling publishing |
| API-03 | No person-level login means unlocked paired phone acts with device grants | Insider misuse, attribution limits | Clear device-bound permissions, screen-lock and confirmation policy |
| API-04 | JW.org upstream program interface and reuse rights unverified | Online import blocked | Source assessment, allowed mechanism, fixture tests and fallback |
| API-05 | Native PDF parsing languages and scanned PDFs vary | Extraction errors | Define supported document versions and review UI; OCR deferred |
| API-06 | Backup restore to replacement device might clone obsolete identity if careless | Trust compromise | Exclude Keystore secrets and peer credentials; require re-pairing |
| API-07 | Role eligibility and double-booking policy not fully settled | Assignments may be invalid | Finalize domain business rules and conflicts before publication |
| API-08 | Permission propagation to long-offline device not instantaneous | Revoked device retains old copies | Session renewal/expiry and explicit non-erasure notice |
| API-09 | Third-party KHMS has no verified integration contract | Integration uncertainty | Treat as design reference until API and license validated |
| API-10 | Exact automatic timer transitions unresolved | Timer state contract incomplete | Finalize mode specification; no peer timer endpoints |
| API-11 | No transport mechanism can guarantee simultaneous online presence | Offline delivery limits | Manual transfer fallback and explicit pending indicators |
| API-12 | Existing schema design includes journal and trust tables, but protocol details need schema reconciliation | Migration mismatch | Compare planned fields against `SYSTEM_DESIGN.md` before implementing migrations |

### Maintenance and versioning rules

1. **Never silently change the meaning of a route or signed field.** Use additive optional fields for compatible changes and a new protocol version for breaking changes.
2. Every new `POST`, `PATCH`, `PUT` or `DELETE` must receive a per-route side-effects checklist: authorization, validation, transaction, journal/outbox, cache invalidation, idempotency, error/recovery and deletion semantics.
3. Maintain a source mapping for every operation as implementation lands. Mark each operation `proposed`, `implemented`, `tested` or `deprecated`; do not imply stubs are working endpoints.
4. Regenerate contract test fixtures whenever schema, revision signing, serialization or error envelopes change. Never use real congregation names in fixtures or logs.
5. Database migrations and peer protocol upgrades require compatibility tests against older devices and backups. Refuse unsupported versions safely.
6. Dependency updates require Android dev-build validation, TalkBack and fullscreen regression tests, and review of network/security permissions.
7. Public-source parsing requires legal/source review, response-size limits, retry/backoff and failure-path regression tests.
8. Production diagnostics omit private people, assignments, full document text, session secrets, QR invitation content and backup data.
9. Avoid speculative microservices, cloud synchronization and new authentication infrastructure without approved architecture changes.
10. Require review of security-sensitive changes by a second maintainer when available; record ADRs and update `TECHNICAL_PLAN.md`, `SYSTEM_DESIGN.md`, and `SCREEN_FLOWS.md` together.

## 12. Verification matrix and release acceptance

| Test tier | Example verification | Gate |
|---|---|---|
| Unit | Validation, idempotency decisions, permission checks, revision ancestry, timeout semantics | All positive and denial paths pass |
| SQLite integration | Draft+audit transaction atomicity, signed revision apply, rollback on FK failure | No partial canonical commit |
| Peer contract | Unsupported version, revoked peer, malformed payload, replay, stale leader term | Reject without data disclosure or corruption |
| Two-device Android E2E | Pair with explicit approval; send revision; disconnect/reconnect; propagate revocation | Only authorized schedule records sync |
| Import contract | Native PDF, invalid PDF, duplicate, manual-edit conflict, unsupported source | No automatic destructive overwrite |
| Backup security | Wrong passphrase, tampered archive, old schema, new-device re-pair | No key cloning or partial restore |
| UI accessibility | TalkBack alerts for sync statuses, 48dp controls, readable contrasts | WCAG 2.2 AA intent, verified on Android |
| Privacy | Monitor all outbound connections with public-source refresh disabled | No unapproved cloud upload |

**Phase 0 gate:** Confirm transport, cryptographic library availability, on-device PDF feasibility and offline split-brain policy before committing to concrete peer route handlers. Until then the routes in Sections 6–7 are a **design proposal**.

**Definition of done for API implementation:** authorization enforced; schemas versioned; each mutation's checklist tested; SQLite transactions and journal consistent; retries idempotent; unauthorized access denied; privacy and offline behavior verified; source mapping updated; accessible error and status messaging implemented.
