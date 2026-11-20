# Phase 0 SQLite native checks

Status: Added to the authorized Phase 0 prototype. Owner runs all checks; no agent-run tests, type-checks, builds or app launches.

## Scope

Extend the prototype with an explicitly triggered diagnostic screen and real on-device SQLite checks. Use a separate unique disposable database with synthetic rows; never open the timer checkpoint database. This continues the Phase 0 SQLite feasibility task in TECHNICAL_PLAN.md and ADR 0002, not production schema implementation.

## Design and implementation

- `src/features/diagnostics/application/contracts.ts`: typed runner/result boundary.
- `src/infrastructure/db/sqlite-diagnostics.ts`: one short synchronous native suite. Fail fast after dependent checks; close connections and delete only its own scratch database. Unexpected errors and cleanup failures appear as FAIL.
- `src/bootstrap/diagnostics.ts`: native adapter composition.
- `app/diagnostics.tsx`: thin route injecting the runner.
- `src/features/diagnostics/presentation/DiagnosticsScreen.tsx`: user-triggered run and readable PASS/FAIL output. No automatic checks on navigation/startup.
- Timer entry disabled while timing or awaiting recovery. Existing timer behavior and schema unchanged.

## Owner acceptance

Run type-check and existing timer tests separately. Build/install the changed app, then use Open SQLite checks -> Run SQLite checks. Require observed PASS for WAL/FKs, orphan rejection, atomic canonical/child/journal rollback, one writer with committed-only reads, failed migration rollback, successful migration with reopen persistence, integrity and scratch cleanup. Report the first FAIL exactly.

The suite uses two genuinely separate native connections with `useNewConnection`. It verifies a second writer fails while the first has a write transaction, and succeeds after commit. This supports the serialized-write approach without claiming arbitrary async transaction isolation.

Power loss, actual disk-full behavior, production schema/migration coverage, process-kill during a migration, backup encryption, PDF and LAN are not proven by this suite and retain separate gates.
