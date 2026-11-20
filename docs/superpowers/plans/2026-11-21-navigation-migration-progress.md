# Execution ledger: 2026-11-21-navigation-migration.md

Authorization: Owner's latest direct Pandecoco definition enables edits for this specific migration step. Tests/builds remain owner-run.

Baseline: Expo Router main/plugin and original features/infrastructure layout present. No Git repository. No navigation migration was already applied.

Pre-flight: Profile service/repository/domain contracts retain the same names and schema; timer engine/checkpoint contracts remain unchanged. Navigation adapters alone change route APIs from Expo Router to React Navigation 7. UI extraction consumes the existing hook/state interfaces with callbacks instead of SQL or route strings.

Progress: Preparing rollback archive and source manifest. No tests or builds run.

Task 1: Created ignored .refactor-backups/2026-11-21-before-react-navigation.zip with original source/config/package files, plus navigation-preservation.json for pure domain and migration-input comparison. No Git state was created.

Tasks 2-4: Moved existing domain/storage/localization/token owners; extracted ProfileContext/useLocalProfile, useProfileForm, useTimerSession, useSqliteChecks and useSectionScreen. Views are ProfileForm, TimerSessionView, DiagnosticsView, SectionView and ProfileBoundary. Screens assemble these with hooks; original rendering styles are retained except the timer now reuses the common ActionButton.

Tasks 5-6: Added typed React Navigation 7 root/tabs/linking, App.tsx and index.ts. Installed direct native 7.5.2, bottom-tabs 7.22.0 and native-stack 7.21.1. Removed expo-router after archiving old app/ and remaining owners. Package operations used --ignore-scripts --no-audit. The Android package/scheme, local CMake override and native generated project were not modified.

Task 7: Added ADR 0003 and DIRECTORY_STRUCTURE.md, focused notices in affected specs, and current owner commands in README. Kept instruction files and historical checkpoints intact.

Task 8: Fresh read-only source review in progress. No app execution, type-check, tests, lint, prebuild or native build run. Source comparisons and final review findings will be recorded separately.

Fresh source review: navigation_migration_review identified important cold-link editor history/discard behavior, duplicate timer routes from warm links, and fullscreen effects surviving route focus loss. Reviewer confirmed domain bytes and the SQLite adapters' non-import content matched the original source. No execution checks were run.

Fix pass: Added a Main anchor for cold links, guarded reset fallbacks instead of pushing Main over a dirty editor, stable PracticeTimer getId to reuse a single runtime, and focus-scoped fullscreen system bars/Back/wake-lock presentation. Timer elapsed/checkpoint semantics are retained. Fixes are source changes, not runtime-verified.

Minor (deferred): TimerSessionView retains four unused legacy button styles after adopting the common ActionButton. Cosmetic cleanup is outside this pass; it does not own timer state.

Final source inspection: SHA-256 comparisons matched the original profile domain, timer domain, exact profile migration SQL and import-normalized timer storage adapter. A static file scan found no missing relative imports or obsolete Router/old-layer imports in active TypeScript source. expo-router is absent from both direct dependencies and lockfile packages; root dependency declarations match the lockfile. These comparisons read source text only and do not establish compile or runtime success.

Implementation handoff: This migration step is applied. Owner verification remains pending, including the cold-link discard, single warm-linked timer and covered-fullscreen regressions documented in README. No type-check, tests, lint, prebuild, native build, app launch or device commands were run by the agent.
