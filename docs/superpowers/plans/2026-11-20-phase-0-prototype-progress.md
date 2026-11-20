# Execution ledger: 2026-11-20-phase-0-prototype.md

Ruling: Work in the existing workspace without a worktree or commits because no Git repository exists; avoid creating repository history by assumption.

Ruling: Owner instructions prohibit agent-run tests. Write meaningful timer tests and provide commands; do not run tests, type-checks, builds or the app. Installation and source inspection are preparation, not acceptance verification.

Ruling: The authorized Phase 0 spike can proceed before production architecture gates. It does not approve production implementation or resolve the remaining product decisions.

Ruling: The user chose local builds; no EAS configuration, account or cloud source upload is needed.

Pre-flight: Domain exports TimerState and TimerCheckpoint; the SQLite adapter stores only checkpoints; the screen owns runtime state and injects performance.now(). No database API is imported by the domain.

Progress: Dependency selection started. No verification executed.

Task 1: Expo 58 dependencies installed with lifecycle scripts disabled; npm lockfile written. npm initially selected react-dom 19.3.1 against React 19.3.0; pinned react-dom 19.3.0 from Expo's bundled map. Installation then succeeded without forcing peer resolution.

Task 2: Pure timer engine and ten owner-run timer cases written. Tests not run.

Task 3: Separate prototype SQLite store written with short synchronous transactions on one private connection. Schema migration/failure checks remain pending.

Task 4: Prototype UI, theme tokens, fullscreen and wake-lock scope written. Expo dev tooling has its own wake lock; README directs wake-lock release acceptance to the bundled variant.

Task 5: Local build guide and device checklist written. Fresh read-only review requested; type-check, tests, native build and runtime acceptance not run by agent.

Ruling: Installed React Native source lists minSdk 24, targetSdk 36, compileSdk/buildTools 37 and NDK 27.1.12297006. These are dependency defaults, not validated generated-project settings or an owner-approved production support policy.

Final review: Fresh read-only reviewer prototype_review inspected source and installed API declarations. No checks were run. Review found recovery bypass for Ready, string coercion in stored status, debug wake-lock acceptance interference and locked fullscreen exit after a storage error.

Final: Fixed those source findings. Unfinished Ready checkpoints now prompt; status must be a literal string; bundled-only wake-lock acceptance is documented; fullscreen exit is independent of timer command locks. Added malformed-status and exact-zero assertions for owner execution. Recovery shows saved part/duration instead of an unrelated default timer. Aligned zero with overtime and constrained display width for the centered container. These changes are source-reviewed, not test-verified.

Final: minor (deferred): The prototype's 100 ms display interval also wakes when idle; it is not the timekeeping authority. Scope this scheduling more tightly before production. No accuracy or power-use acceptance claimed.

Final: Ruling: Production migrations, Keystore, PDF and LAN remain outside this prototype and retain their Phase 0 gates. The reviewer did not judge them as implemented.

Handoff: Files and dependency lockfile prepared. Owner must run npm.cmd run typecheck, npm.cmd test, then npm.cmd run android with telemetry disabled. No native project generated or application executed by the agent.

Owner verification update: Owner ran the first checks. All 10 pure timer cases passed. TypeScript 6.0.3 reported TS2591 for node:assert/strict and node:test. @types/node is installed, but TS 6 defaults automatic ambient types to an empty list. Added explicit node/react types in tsconfig.json; rerun pending. No package installation or test execution needed for this edit.

Owner build update: Expo prebuild completed and generated android/. CLI then reported no connected Android device and a missing emulator executable. No successful native compile/install is evidenced. Earlier authorized ADB output remains historical evidence; current connection requires a fresh owner check using the SDK ADB in the build terminal. README includes that check. Agent has not run tests, type-checks, builds or device checks.

Workspace update: The project was found moved into D:/App Project to build/JW-Timer during this turn. Applied the configuration fix there and updated README commands to that path. No agent move was performed.

Owner native-build update: Device selection now succeeds. Native compilation fails in react-native-reanimated buildCMakeDebug[arm64-v8a] with Ninja mkdir failure, before APK installation. Gradle deprecation and cross-drive hard-link fallback messages are warnings, not the terminating error.

Investigation: The failing CMake cache selects 3.22.1 with Ninja 1.10.2. Version inspection found installed 3.31.1 with Ninja 1.12.1. Windows LongPathsEnabled is already 1. Official Expo/Reanimated Windows guidance matches this failure and recommends newer Ninja for long paths. SDK 58's root plugin source confirms support for android.cmakeVersion across all modules, and runAndroidAsync loads the local env file before building.

Change: Set ignored local .env ORG_GRADLE_PROJECT_android.cmakeVersion=3.31.1. Remove only verified project-local generated app/Reanimated/Worklets native build caches. README and ADR 0002 record the toolchain choice and owner retry. No builds/tests run by agent; the next owner build must confirm the override and whether native compilation succeeds.

Owner confirmation: Owner reported the local development build completed after the toolchain change. Owner then confirmed completion of the requested phone checks: explicit Start, overtime, Next remaining Ready, Pause/Resume, fullscreen/rotation/Android Back preserving timing, background pause, and force-stop recovery requiring a choice. These are owner-reported passes, not agent-observed runtime results. No numerical drift result or separate type-check rerun output was supplied.

Next owner gate: Build the bundled release variant locally, stop Metro, cold-start in airplane mode, verify local timing/recovery and verify screen-awake enabled/disabled/exit behavior without Expo debug tooling's own wake lock. Accessibility, drift, full SQLite failure checks and remaining native integrations stay pending unless separately reported.

Owner bundled-build confirmation: Release APK generation reached installation; an ADB transport replacement interrupted Expo installation. Agent confirmed the APK file existed and supplied a serial-targeted adb install -r command. Owner subsequently reported all requested checks complete: installation, offline cold-start/timing/recovery without Metro, and fullscreen screen-awake enabled/disabled/exit behavior. These are owner-reported passes; no agent-run install or runtime checks occurred.

Next prototype gate: Accessibility (TalkBack, 200% text scaling, portrait/landscape) and a measured 60-minute foreground timing comparison. No drift measurement has been supplied. Full SQLite failure/migration, PDF, Keystore, LAN and security/decision gates remain pending before Phase 1.

Owner accessibility/timing update: Owner reported all requested accessibility and 60-minute timing checks complete and asked to proceed. Record accessibility as owner-reported completion. No numerical time difference was supplied, so measured drift and independent accuracy verification are not claimed.

Next work prepared: Added manual SQLite native checks in a separate unique scratch database. Checks cover WAL/FKs, invalid FK denial, atomic parent/child/journal rollback, separate-connection write contention with committed-only reads, failed schema migration rollback, successful migration with reopen persistence, integrity and scratch cleanup. Timer checkpoint database is not opened by the suite. Timer entry is disabled while running or awaiting recovery. See 2026-11-20-phase-0-sqlite-checks.md for design and scope.

Verification status: Source review requested. Agent has not run type-checks, tests, the diagnostic suite, a build or the app. Owner must rebuild the bundled variant and explicitly run checks on the phone. Production migrations, disk-full and process-kill behavior, PDF, Keystore, LAN and security gates remain pending.

SQLite source-review result: Fresh reviewer sqlite_checks_review reported no Critical/Important findings after inspecting the new files and installed native adapter signatures/transaction implementation. Confirmed separate connections, rollback assertions, isolation of the timer database, user-triggered execution and cleanup. This is source review only; no commands exercising app behavior were run. SQL-engine-triggered failure inside the multi-write transaction could broaden later coverage beyond the intentional exception and separately tested FK rejection.
