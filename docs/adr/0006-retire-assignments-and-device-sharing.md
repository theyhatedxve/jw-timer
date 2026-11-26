# ADR 0006: Retire assignments and device sharing

Status: Assignment and device-sharing retirement complete. Owner reported completing verification on 2026-11-26.

## Decision

Remove assignment management, publisher management, device identity UI,
device requests, pairing, permissions, received schedules, and LAN sync.

The retained product has Home, Meetings, Timer, and Settings tabs,
local meeting PDF imports, profile/appearance settings, and local backups.

This supersedes the active product direction in ADRs 0004 and 0005.
Those documents remain historical records.

## Staging

1. Remove screen registrations, tab/deep-link entry points, Home shortcuts,
   assignment statistics, and Settings actions.
2. Remove retired feature files and route types. Separate shared calendar,
   meeting, and backup dependencies before deleting their former owners.
3. Remove unused dependencies/tests and reconcile current documentation.

## Data compatibility

Preserve migration history and existing stored data.
Do not drop legacy tables or rewrite applied migration checksums.
Retain only the compatibility code needed to safely read existing
databases and supported backups.

## Verification

The owner runs typecheck, relevant tests, builds, and device checks.
No agent-run verification is claimed.
