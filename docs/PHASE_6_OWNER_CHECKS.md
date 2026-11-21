# Phase 6 owner verification

Source is applied, not runtime-verified. Phase 7 stays on hold for redesign. Agents did not run these commands or device checks.

## Commands

```powershell
Set-Location 'D:\App Project to build\JW-Timer'
npm.cmd run typecheck
npx.cmd --no-install tsx --test tests/syncProtocol.test.ts tests/syncAuthorization.test.ts tests/syncRecovery.test.ts tests/backupFormat.test.ts tests/devicePermissions.test.ts tests/sharedSchedule.test.ts tests/lanConnection.test.ts tests/profileScope.test.ts
npm.cmd test
npm.cmd run android
```

Rebuild/install both phones. QR dependencies were installed with package scripts disabled and locked. Camera access is optional and requested only on Scan. Existing target SDK is 36; a future target-37 upgrade requires a local-network permission/picker decision. Native calls fail closed if required permission is absent.

In Settings run **Sync storage checks** and **Backup recovery checks**. They use isolated in-memory SQLite, not saved app databases. They do not prove two-phone signing/network behavior.

## Two-phone flow

1. Back up content and install the new native build on A and B. Check legacy local programs, publishers and explicit timer controls.
2. Exchange invitation/challenge/approval QR codes in Device requests. Scanning must only fill input. Compare full fingerprints and approve pairing explicitly. Denied camera access leaves paste usable.
3. A initializes itself as fixed leader in Schedule synchronization, previews its local draft and approves/publishes the complete snapshot.
4. A grants B schedule.read. Select B, open LAN hosting, prepare/share its connection code and Start hosting. Keep A on that screen; use the same private Wi-Fi without internet.
5. B selects trusted A, scans/pastes/discovers its code, and explicitly adopts A as fixed leader. Discovery never creates trust or authority.
6. B synchronizes and opens the signed copy through Home/Assignments → Open received schedules. Reopen with Wi-Fi off. Local editable drafts/publishers remain separate and intact.
7. A separately grants B draft-proposal permission. B edits its local drafts through existing editors, previews the complete candidate, queues it and explicitly retries delivery while A hosts. Read alone must not authorize proposals.
8. A stops hosting, returns to Sync and reviews CURRENT versus PROPOSED programs, stable publisher identities, activity, eligibility and duties. Publish/reject explicitly. A reopens hosting; B synchronizes and polls proposal outcome. Delivered or approved is not proof that a verified revision was accepted by B.

## Negative and recovery checks

- Unknown/wrong fingerprint, wrong scope, missing read grant, removed editor grant and revoked/re-paired peers must not accept new data or inherit old permissions/adoption.
- Duplicate publisher names keep distinct IDs. Publication requires valid dates/times, active eligible assignees, exactly four duties and no overlapping/unverifiable assigned intervals.
- Deliver an older-base proposal after a newer publication. Preserve a visible conflict; explicit approval creates a new signed child of the current head. No silent overwrite.
- Duplicate proposal/ack retries do not duplicate effects. Invalid signature/parent/sequence is rejected/quarantined. An offered revision is not a confirmed receipt.
- Disconnect before/during download, before acknowledgment, and after proposal commit before reply. Restart/retry preserves accepted data and recovers queued work idempotently.
- Leave/background camera, discovery, hosting and Sync. They stop; stale results/dialogs cannot save/publish. Old screen cleanup must not stop a newer owned host/client.
- Discovery failure/expiry exits finding state and permits fallback. Older Android resolver cancellation may require process restart; manual QR/paste remains available.
- With A unavailable, B keeps its last verified copy and cannot promote itself or replace the fixed leader automatically.
- Test v2 and legacy v1 restore, on the same and a replacement device using synthetic/duplicate data first. Content becomes drafts in a fresh scope. Authority freezes, pending work blocks, grants need reapproval; replacement devices must pair again. Do not restore destructively over the only real data copy.
- Recheck explicit Start, pause/resume, overtime and Next-ready: no automatic starts and no live countdown transfer.

## Boundary

Phase 6 stays in verification until owner commands, storage diagnostics and two-phone checks pass. Phase 7 redesign/hardening/release has not started. Automatic leader handover, distribution and release signing are outside this batch.
