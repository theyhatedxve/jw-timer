# Phase 0 Native Prototype Implementation Plan

**Goal:** Prepare the authorized local-build prototype for owner-run native checks.
**Spec:** ../../adr/0001-timer-operation-and-test-device.md and ../../adr/0002-local-phase-0-prototype.md.

## Tasks

1. Create a minimal strict TypeScript Expo Router app, Android-only config and lockfile. Use current official template package versions and Expo's native dependency map.
2. Write owner-run pure timer tests for explicit start, pause/resume, overtime, next and checkpoint recovery. Implement a pure domain engine with injected monotonic timestamps. No React/SQLite imports in domain.
3. Implement a private SQLite checkpoint adapter with schema version checks, WAL and foreign keys. Validate recovered rows before use; do not reuse persisted monotonic references.
4. Compose a small synthetic timer screen with a runtime controller, accessible controls, fullscreen, scoped wake lock and responsive rotation. Route files remain thin.
5. Write the local build/run guide and device acceptance checklist. Review source without running tests, type-checks, builds or app checks. Leave verification pending for the owner.

## Files and interfaces

- app.config.ts, package.json, tsconfig.json, app/_layout.tsx and app/index.tsx: configuration and routing.
- src/features/timer/domain/timer.ts: TimerState, start, pause, next, elapsed, checkpoint and recover pure functions.
- src/infrastructure/db/prototype-store.ts: private SQLite connection; load/save validated TimerCheckpoint.
- src/features/timer/presentation/PrototypeScreen.tsx: controller and capability UI.
- tests/timer.test.ts: deterministic Node assertions with tsx runner, executed by owner only.
- README.md: exact owner commands and acceptance checks.

## Acceptance

No implicit start; overtime retains current part; next is Ready; recovery requires confirmation; no stale clock reuse; fullscreen exit and rotation preserve state; failed checkpoint writes display an error. Owner checks include timer cases, SQLite reopen, TalkBack, font scaling, wake-lock release and foreground drift. DB FK/concurrency/migration-failure, PDF, Keystore and LAN feasibility remain separate pending gates.
