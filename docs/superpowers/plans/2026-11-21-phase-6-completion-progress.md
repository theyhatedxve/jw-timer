# Execution ledger: 2026-11-21-phase-6-completion.md

- Owner approved full direct-edit scope after EggPie planning, explicitly retaining test/build execution.
- Baseline includes uncommitted owner changes and prior Phase 6 snapshots/readers. Preserve them.
- Rollback archive: `.refactor-backups/before-phase6-completion-1795267989562.zip`.
- Native and frontend/QR work delegated to disjoint file scopes under the parallel-work skill. Root owns domain, persistence, application, bootstrap and backup integration.
- Ruling: store each congregation's bounded sync aggregate in one versioned main-database SQLite row. The aggregate contains stable-ID canonical dataset, immutable proof history, inbox/outbox, grants and journal. One validated CAS transaction commits all related state. Legacy draft tables are not overwritten by adoption. This avoids cross-database canonical/head commits; verification remains owner-run.
