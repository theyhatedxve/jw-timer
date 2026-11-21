# ADR 0004: Read-only LAN schedule copies

Date: 2026-11-21
Status: Owner-approved in chat; source applied; owner verification pending.

## Decision

Extend the pinned mutual TLS foreground connection with schedule.read.
Authorize the TLS-derived peer fingerprint and congregation scope for
each request. Recheck permission immediately before releasing the payload.

Transfer meeting programs and assigned names for exactly four duties:
Mic Server, Sound Operator, Laptop Operator, Microphone Adjuster.

Limit each transfer to 25 meetings and 65,536 JSON characters.
Control frames remain limited to 1,024 bytes. Response frames have
a 262,144-byte ceiling. Existing connection and host deadlines remain.

## Received data

Validate before preview. Require explicit Save.

Store one received copy per local identity, local congregation scope,
and sending device in jw-timer-received-schedules.db, schema version 1.
Saving replaces that sender's previously received copy.

Received copies remain separate from editable programs and publishers.
They are excluded from the current backup format.

These are manually requested snapshots, not authoritative published
revisions or automatic synchronization. No leader election, merging,
remote writes, or live timer transfer is introduced.

## Revocation

Recheck current local trust before downloading or saving.
Revocation prevents subsequent authorized transfers. It cannot erase
copies already received by another device.

## Verification

Owner runs typecheck, unit tests, native build, and two-phone checks.
Verify denied access sends no schedule, malformed payloads are rejected,
Save is explicit, cached copies reopen offline, and interrupted transfers
do not replace the saved copy.

## Rollback

Revert this step's source changes. The main application and trust
database schemas remain unchanged. A pre-edit source archive is stored at
`.refactor-backups/before-schedule-transfer-1795264654254.zip`.
