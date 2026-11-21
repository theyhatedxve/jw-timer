# ADR 0005: Trusted publishing and Phase 6 preservation

Date: 2026-11-21
Status: Owner approved design and direct implementation in chat. Source applied; all owner-run checks pending. Phase 7 stays on hold for redesign.

## Approved policy

- Same private Wi-Fi, explicit foreground hosting/discovery. QR and NSD only populate input; neither creates trust, starts a timer, approves pairing or adopts authority.
- One manually initialized/adopted fixed leader per local congregation scope; term 1, no automatic takeover or leader replacement. An unreachable leader leaves accepted data readable. A different leader cannot replace a binding through reapproval.
- Preserve legacy programs and publishers as local editable drafts and preserve v1 received copies. Never match publishers by display name.
- Existing schedule.read permission is required for every protected RPC. A separate explicit editor grant is bound to the current trusted peer revision. Neither grants publishing authority.
- Proposals are complete replacement candidates. The leader reviews current/proposed programs, stable identities, eligibility and four duties before approving. Conflicts preserve both versions; accepted history remains retained.
- Restore content as drafts, never authority. Restore freezes bindings, disables draft grants, blocks pending delivery, and assigns the restored profile a fresh congregation ID. Existing read grants cannot apply to the new scope. Replacement devices require a new Keystore identity, pairing and explicit authority approval.

## Storage and contract

Main migration 9 adds `local_sync_documents`; migrations 1–8 are unchanged. Each scope has one owner-bound, versioned, bounded aggregate containing the canonical accepted dataset, immutable signed history, proposals, grants, receipt work, persistent request outcomes, quarantine and journal. The repository reads/validates/changes/CAS-writes it inside one SQLite transaction. A failed write cannot commit a head without its dataset, journal and receipt work. This is the current bounded implementation of the previously proposed normalized sync catalog; legacy tables remain draft editing storage. There is no cross-database canonical commit.

Protocol v2 carries publisher IDs, names, activity and technical eligibility; stable meeting/section/part IDs; and exactly four duty slots with explicit nulls for unassigned slots. Omission in a complete accepted snapshot removes an entity from that revision's current projection. Old signed snapshots remain in ancestry, and stale content requires a new explicitly approved child revision. No timestamp-based last-write-wins.

Proofs sign UTF-8 `JW-Timer/sync-proof/v2\n` followed by exact canonical JSON, using the existing nonexportable P256 Keystore key. SHA-256 hashes those same bytes. Receivers check pinned identity, signature, parent and increasing sequence. Proposals are signed by the TLS-authenticated author. Codecs validate IDs/references, role eligibility and nonoverlapping/verifiable assigned intervals. Private PDF source filenames are not transferred.

The existing pinned TLS transport adds `sync.exchange` for application protocol v2. `session.check` and `schedule.read` remain supported. Old peers reject the new operation and need rebuilding. TCP frames, JSON nesting, deadlines and history are bounded. Live timer state never transfers.

Limits: 25 meetings, 1,000 publishers, 196,608 dataset characters, 262,144 message characters, 1 MiB sync frames, 512 revisions, 4,096 entries per aggregate collection and 32 MiB aggregate state. Incoming proposals reserve control/recovery capacity and allow at most 16 open proposals per peer / 64 total. No automatic deletion of signed history occurs when full: retain a content backup and explicitly establish a fresh scope. Archival/compaction is a later design decision.

## Delivery and recovery

Signed history is the durable revision outbox. Followers pull, verify and atomically save before queuing acknowledgments. `revision-served` means offered; only `peer-acknowledged` records an authenticated receipt. Proposal retries reuse signed request IDs and exact canonical requests. Conflicting reuse fails. Canonical acknowledgment IDs equal their revision hash's 64 hex characters; immutable history reconstructs replies without unbounded acknowledgment inbox growth.

Queues distinguish pending, delivered for review, approved, rejected, conflicted, blocked and done. Foreground operator retries recheck identity, scope, trust and grants. Pending work respects backoff; blocked work needs another explicit command. Network interruption preserves the accepted head and drafts. Invalid/divergent revisions are quarantined without replacing the head.

## Content backup compatibility

Encryption/container format stays unchanged. JSON archive v2 adds bounded plain `syncDrafts`; v1 remains readable. Content schema 8 and the first eight migration checksums describe the ten legacy content tables, not physical app schema 9. No binding, key, grant, signature, signed head or outbox authority is imported. Staged and real restore use the same transactional reset. Restore tokens include sync state, so an intervening revision invalidates stale approval.

## Verification and rollback

No agent tests, typechecks, native compilation, launches or two-phone checks were run. Static parsing/import inspection and independent source review do not prove runtime success. Follow [owner checks](../PHASE_6_OWNER_CHECKS.md). The explicit Sync storage checks screen uses isolated real SQLite; synthetic proof fields do not prove crypto interoperability.

Source rollback: `.refactor-backups/before-phase6-completion-1795267989562.zip`. After migration 9 runs, do not install old schema-8 code over that database; it must reject newer schema. Retain a content backup/current build, and use an explicitly approved clean-install/content-restore recovery if rollback is necessary. Private keys/authority are never recreated from backups.
