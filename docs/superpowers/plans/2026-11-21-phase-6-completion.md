# Phase 6 completion implementation plan

Approved by the owner in chat, including direct implementation of all remaining Phase 6 work. Phase 7 remains on hold for redesign.

## Constraints

- Owner runs all tests, typechecks, builds and device checks. Agents may inspect source and parse syntax/imports only.
- Preserve all legacy drafts, publishers, timers and read-only received copies. No matching publishers by display name.
- Same private Wi-Fi; explicit fixed leader and explicit follower adoption. No automatic takeover.
- Default-deny draft submission separately from schedule.read. Native TLS authenticates the caller; application services authorize operations.
- Signed, complete stable-ID datasets; monotonic sequence and exact parent hash. Preserve divergent candidates for review.
- Commit accepted dataset, revision history, durable acknowledgment work and journal in one main SQLite transaction.
- Restore content as untrusted local drafts; freeze existing authority, disable editor grants, block pending work and create a fresh local congregation scope.
- Private keys remain nonexportable. No live timer transfer, cloud service or telemetry.

## Work units

1. Domain: bounded stable-ID dataset, canonical proof/request codecs, durable state and acceptance/idempotency policies.
2. Persistence: append migration 9 without changing migrations 1–8; main-database synchronization document per local scope; transactional read/validate/change/CAS. Legacy editable tables remain draft storage.
3. Backup: version 2 content extension, still accepting version 1 content schema 8. Export only plain sync datasets as draft candidates, never identity, grants, authority or signed heads.
4. Native: Keystore proof signing/verification; bounded sync.exchange RPC over existing pinned mutual TLS; foreground Android NSD registration/discovery with lifecycle cleanup.
5. Application: manual leader initialization/adoption, explicit editor grants, preview/publish, follower proposals, conflict review/rejection, durable retry/ack/status and offline readable accepted data.
6. UI: QR input/display for existing pairing/connection flows; discovery helper; Sync screen with source selection, explicit confirmations, current/proposed comparison, queues and recovery status. Main remains first root route.
7. Review: independent source review, syntax/import inspection, tests added but not executed, owner check commands and two-phone checklist.

## Acceptance work retained by owner

Migration/rollback and old/new backup restore, duplicate names retain separate IDs, invalid signatures/parents and revoked/editor-denied peers rejected, no partial head/ack commit, retry deduplication, wrong scope and interrupted transfers, QR permission denial/manual fallback, foreground cleanup and two-phone offline exchange. Phase 6 remains unverified until these pass.
