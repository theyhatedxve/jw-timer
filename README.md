# JW Timer — Android app foundation

A local offline app foundation with congregation profile setup, five-tab navigation and the two-part timer feasibility prototype. Production meeting/scheduling features remain unfinished. Earlier owner-reported prototype checks do not verify the current navigation migration.

## Current navigation and folders

The owner-approved migration uses React Navigation 7, TypeScript, `App.tsx` and the registered `index.ts` entry. Source follows the reference categories: screens, components, hooks, context, constants, navigation, state and utils (with maps reserved). Read [DIRECTORY_STRUCTURE.md](docs/DIRECTORY_STRUCTURE.md) and [ADR 0003](docs/adr/0003-react-navigation-and-source-layout.md).

Profile form, timer and diagnostic execution logic live in hooks; views consume values and callbacks. SQLite records, filenames, migration SQL and the pure timer/profile domain modules were preserved in the source migration. Native app configuration has not been regenerated for it.

### Owner verification when ready

The owner requested deferred testing. The agent has not run these commands. Run separately and stop on a failure when you choose to verify:

```powershell
Set-Location 'D:\App Project to build\JW-Timer'
npm.cmd run typecheck
npm.cmd test
npx.cmd expo prebuild --platform android
npm.cmd run android
```

Check all five tabs, first-run setup, profile edit/save/discard/reopen, existing deep links, manual timer start/overtime/Next, fullscreen/Back, recovery and manually triggered diagnostics. Use a later bundled variant for offline cold-start and wake-lock release checks. Preserve installed app data; no uninstall or Clear storage step is required by this refactor.

Include these navigation regressions in the owner checks:

- Cold-open `jwtimer-prototype://settings/profile` with a saved profile. Change a field, cancel and verify Keep editing/Discard work; Back must not reopen the discarded editor. Without a saved profile, setup must remain required.
- With a running practice timer, open `jwtimer-prototype://diagnostics`, then `jwtimer-prototype://timer/prototype`. Verify the same timer resumes presentation, without a second timer session or a reset.
- Cover a fullscreen timer with diagnostics. The diagnostics screen must have normal system bars and Back behavior; the timer's presentation wake lock must release while covered. Returning must preserve timer state.

Rollback source/config is stored locally in ignored `.refactor-backups/2026-11-21-before-react-navigation.zip`; old routes/providers are archived under `.refactor-backups/legacy/`. Restore into a separate folder first and compare deliberately. This archive contains source/config, not installed Android user data.

The remaining sections retain the prototype setup and acceptance history. Their owner reports are historical, and checks affected by this migration must be repeated before calling the new version verified.

## Prepared behavior

- Every part waits for Start. Pause/Resume and Next are explicit controls.
- At zero, the current part continues in overtime as `+MM:SS`.
- Next loads the next part Ready. Finish ends the synthetic program.
- Checkpoints are saved locally in a separate SQLite database, approximately once per second while running and on commands.
- Reopening an interrupted session asks before restoring the saved checkpoint or restarting. Restored elapsed time is paused; press Resume to run. Time while closed is excluded.
- Leaving the foreground pauses the prototype. Background timing policy for production remains undecided.
- Fullscreen requests hidden Android system bars. Back exits fullscreen without resetting the timer. Screen awake is scoped to active fullscreen presentation when enabled.
- Portrait/landscape follows Android's rotation setting. No automatic orientation override is required.

## Local setup

Use PowerShell in `D:\App Project to build\JW-Timer`. Node v24.20.0, npm 11.19.0, Java 17 and Android SDK directories were observed. The owner supplied ADB output confirming an authorized VKJ-NX9 with Android 17 / API 37.

Dependencies were installed with lifecycle scripts disabled. No agent-run type-check, test, build, prebuild or device launch has occurred. To reproduce the dependency installation later, use `npm.cmd ci --ignore-scripts`. Use `.cmd` launchers because this PC blocks the PowerShell npm/npx wrappers.

The prototype uses Expo SDK 58 and matching packages. Native compile/target/minimum defaults have not been validated against this PC. The first build may download Gradle/Maven artifacts or report missing SDK/NDK components. Do not change SDK levels or reinstall Java blindly; retain the first full error for diagnosis.

### Windows native build toolchain

The owner-run build detected the Honor but failed during Reanimated C++ compilation with `ninja: error: mkdir(...): No such file or directory`. Its generated cache selected CMake 3.22.1 / Ninja 1.10.2. Windows long paths are already enabled, but that Ninja version does not support them. This PC also has CMake 3.31.1 / Ninja 1.12.1 installed.

The local ignored `.env` now sets `ORG_GRADLE_PROJECT_android.cmakeVersion=3.31.1`. Expo loads it for `run:android`; Gradle receives `android.cmakeVersion`, and Expo SDK 58's root plugin applies the override to all Android app/library subprojects. No generated Gradle file, dependency source or global machine setting was edited. A fresh checkout on another computer must select its own installed supported CMake version.

Generated native caches that referenced the older toolchain were cleared locally for app, Reanimated and Worklets. The next owner build must regenerate them. Watch for `[ExpoRootProject] Overriding CMake version: 3.31.1`. The configuration change is not a successful-build verdict; retry is pending.

Reference: [Expo Windows long-path troubleshooting](https://docs.expo.dev/troubleshooting/windows-long-paths/).

## Owner checks before building

```powershell
Set-Location 'D:\App Project to build\JW-Timer'
npm.cmd run typecheck
npm.cmd test
```

Expected: type-check exits without errors; timer cases pass. Tests cover explicit start, elapsed time despite dropped ticks, overtime, pause/resume, Next, restart and safe checkpoint recovery. These tests do not prove native SQLite or Android behavior.

Run each check separately and inspect its exit status before proceeding. Pasting multiple commands into PowerShell does not stop later commands when an earlier one fails. TypeScript 6 requires the installed Node types to be explicitly enabled; `tsconfig.json` lists `node` and `react`.

Owner-reported first run: all 10 timer cases passed. The original type-check failed because Node types were not enabled; the configuration has been amended and its rerun is pending. Expo prebuild completed, but device discovery failed before native compilation or installation.

## First local development build

Enable USB debugging, connect the phone, approve the prompt, then run:

If Expo reports no connected device, first run the SDK's ADB directly in the same PowerShell terminal:

```powershell
& 'C:\Android\Sdk\platform-tools\adb.exe' devices -l
```

The phone must appear with state `device`. If the list is empty, unlock and reconnect the phone and check USB debugging. If it says `unauthorized`, approve the prompt on the phone. Do not proceed until it is listed as `device`. An emulator is not required for this physical-phone workflow. If ADB lists the phone but Expo still cannot find it, retain both outputs for diagnosis.

```powershell
Set-Location 'D:\App Project to build\JW-Timer'
$env:EXPO_NO_TELEMETRY = '1'
npm.cmd run android
```

Select the connected Honor if asked. Expo generates `android/`, compiles and installs the development binary, and starts Metro locally. No EAS account or cloud build is used. `android/` is generated and ignored; native configuration changes belong in `app.config.ts` or an explicit config plugin.

For later JS-only changes, keep the existing native build and run:

```powershell
adb reverse tcp:8081 tcp:8081
npm.cmd start
```

If Metro is already running, use that terminal instead of starting another instance. The development client needs Metro; its inability to cold-start disconnected is not an offline-runtime verdict.

## Physical-device acceptance checklist

Owner-reported results are recorded in the Phase 0 progress file under `docs/superpowers/plans/`. Completion reports are distinct from measured values or agent-observed evidence.

1. **Ready:** open the app; it must not count down before Start.
2. **Overtime:** start a 10-second part; wait past zero. The same part displays increasing `+MM:SS`.
3. **Next:** press Next part; part 2 stays Ready until Start. Finish program ends the synthetic run.
4. **Pause/Resume:** pause for 10 seconds. Elapsed must not advance while paused. Resume continues only after the press.
5. **Fullscreen/rotation:** enter fullscreen, rotate and press Android Back. Timer state must survive. Exit fullscreen must remain reachable with TalkBack and gesture navigation.
6. **Screen awake (bundled variant):** Expo's debug tooling holds its own wake lock, so use the bundled variant below to check this feature. With the option enabled, enter fullscreen and wait longer than the phone's screen timeout. Exit fullscreen/background the app; the normal timeout should apply again. With the option disabled, fullscreen must not prevent the normal timeout. A phone configured to never sleep cannot prove wake-lock release.
7. **Background:** press Home during a run, then return. It must be paused and require Resume.
8. **Recovery/persistence:** while running, force-stop from another terminal with `adb shell am force-stop com.jwtimer.feasibility`. Reopen the installed app with Metro available. The prompt shows the saved part, duration, timestamp and uncertainty. Restore checkpoint paused must require Resume; Restart must wait for Start. Repeat after Next but before Start: recovery must offer Restore part ready and keep that part Ready. Do not use Clear storage or uninstall for this check.
9. **SQLite:** the screen reports schema 1, WAL and foreign keys on; the saved checkpoint survives force-stop/reopen. This is basic storage evidence, not FK rollback/concurrency/migration-failure proof.
10. **Accessibility:** enable TalkBack, 200% font scaling and landscape. Essential controls remain reachable; timer state changes are announced without every-second announcements.
11. **Drift:** load 60-minute parts, keep the app foregrounded, and compare against an independent reference for 60 minutes. Record observed drift against the planning target of +/-1 second. Do not infer accuracy from the screen alone.
12. **Storage failure (when reproduced in a controlled test environment):** a failed command save keeps the original part and pauses it at its current elapsed time. Exit fullscreen remains available. After storage is usable, Retry saving preserves that paused state. Do not deliberately fill or damage the everyday phone's storage; full failure injection is a pending separate gate.

## Offline runtime check after the debug build works

Build a local bundled variant:

```powershell
npx.cmd expo run:android --variant release --device
```

This is an internal feasibility artifact, not an approved signed production release. Stop Metro, enable airplane mode, and cold-start that installed variant. Ready, timing, fullscreen and checkpoint recovery must work without a development server. Use synthetic data only. Report offline results separately from debug results.

## Remaining work

### Next: native SQLite checks

A new **Open SQLite checks** button appears when the timer is not running and recovery has been resolved. Its screen runs only after you press **Run SQLite checks**. It uses a disposable database containing synthetic rows, separate from the saved timer checkpoint. No new native dependency is needed, but the bundled app must be rebuilt to include the changed JavaScript.

Run separately, stopping if a command fails:

```powershell
Set-Location 'D:\App Project to build\JW-Timer'
npm.cmd run typecheck
npm.cmd test
npx.cmd expo run:android --variant release --device
```

On the phone: **Open SQLite checks -> Run SQLite checks**. Require PASS for WAL and foreign keys, orphan rejection, data/journal rollback, competing writer rejection with committed-only reads, failed migration rollback, successful migration/reopen, integrity and disposable database cleanup. The first failure stops dependent checks and is displayed with its details; cleanup still runs. Send the result summary or first FAIL. The suite does not run automatically at app launch or when navigating to this screen.

These native checks prove SQLite behavior for this synthetic fixture. They do not prove production migrations, actual disk-full recovery, process death during a migration, arbitrary asynchronous writers or backup encryption. Do not intentionally fill the everyday phone's storage.

Phase 0 still includes full SQLite transaction/migration failure checks, Android Keystore, PDF extraction, LAN transport, security review and unresolved product decisions. The production Android support range is not decided by testing this single phone.

Read all Markdown files under `docs/` before changes. Start with the instruction files, then [timer decisions](docs/adr/0001-timer-operation-and-test-device.md), [prototype decisions](docs/adr/0002-local-phase-0-prototype.md), and the [readiness checklist](docs/superpowers/plans/2026-11-20-phase-0-readiness.md).

Official references: [local Expo builds](https://docs.expo.dev/guides/local-app-development/), [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/), [screen awake](https://docs.expo.dev/versions/latest/sdk/keep-awake/) and [Android navigation bar](https://docs.expo.dev/versions/latest/sdk/navigation-bar/).
