# React Navigation and source organization implementation plan

**Goal:** Apply the owner's approved migration from Expo Router to React Navigation 7 with the at-byahe source organization and separated UI/controller code.
**Spec:** The approved migration instructions in this conversation; CODING_PRINCIPLES.md; ADR 0001 timer behavior; ADR 0002 data/privacy boundaries.
**Method:** Inline execution with a final fresh read-only source review. No agent-run tests, type-checks, lint, builds, prebuild, app launches or device checks. The owner will run them.

## Constraints and rulings

- The owner directly clarified that Pandecoco authorizes edits for this specific chat step. That instruction supersedes the older stopping-word meaning in Specific-Chat-Step-Instructions-Only.md. Leave the existing instruction files intact.
- No Git repository exists. Work in the named workspace and create a local rollback ZIP instead of inventing branches or commits.
- Preserve TypeScript, the Android package/scheme, SQLite filenames, preference keys, stored records, migration SQL/checksum inputs, timer transition behavior and offline boundaries.
- Use screens/components/hooks/context/constants/navigation/state/utils and the reference's reserved maps directory. Keep native generated files outside the source migration.
- Package lifecycle scripts disabled during dependency operations. No native generation by the agent.
- No production meeting, pairing, PDF, cryptography or synchronization feature work in this refactor.

## Tasks

1. Back up app/, src/, tests/, docs and relevant package/config files before edits; record original file hashes for data adapters and pure timer/profile modules.
2. Move unchanged modules into constants/, components/common and state/{profile,timer,db,diagnostics}; update imports, retaining migration SQL byte-for-byte.
3. Extract the shared profile context and consumer hook; separate loading/error UI. Extract profile form flow into useProfileForm with React Navigation 7 removal prevention.
4. Extract timer state/effects/handlers into useTimerSession; keep UI in TimerSessionView and the wake-lock presentation primitive. Extract diagnostic execution state into useSqliteChecks and UI into DiagnosticsView. Keep checks manually triggered.
5. Replace section routing with typed React Navigation actions, separate screen wrappers and view-only section component; add typed tabs/root navigators, preserved linking paths, App.tsx and index.ts.
6. Install direct React Navigation 7 dependencies and remove Expo Router; change package entry/plugin/type includes; update tests' import paths without running them.
7. Add ADR 0003, architectural notices, directory/naming documentation and revised owner commands. Archive obsolete route/source owners and remove only empty migrated folders.
8. Inspect source and installed declarations; compare preserved migration SQL and domain source hashes; obtain fresh source review and fix important findings. Report runtime verification as pending.

## Review focus

- First-run setup remains unavailable as an edit route until a local profile exists; profile editing preserves revision checks and unsaved-input confirmation.
- Timer fullscreen/Back, pause/resume, Next/Ready and checkpoint recovery remain local and process-monotonic.
- No UI view accesses SQLite; provider and hook state does not become a second durable authority.
- Uninstalling Expo Router leaves no active source imports or generated-type requirements.
- Existing deep-link paths and database migration/checksum input remain compatible.

## Owner verification, deferred

Run type-check, existing timer tests, Expo prebuild and local Android build only when the owner chooses to verify. Then check setup/reopen/edit/discard, all five tabs, deep links, SQLite diagnostics, timer fullscreen/recovery/offline behavior. Preserve installed app data. APK downgrade/reinstall is not a data-recovery procedure.
