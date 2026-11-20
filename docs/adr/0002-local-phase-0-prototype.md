# ADR 0002: Local Phase 0 prototype

Date: 2026-11-20
Status: Local builds accepted by the owner. Prototype implementation authorized by the ongoing Phase 0 request. Native acceptance remains pending.

## Confirmed evidence

The owner supplied successful ADB output: model VKJ-NX9, Android release 17, API 37, connection state `device`. This is owner-run evidence, not an agent-run device check. The owner chose local builds instead of EAS hosted builds.

## Scope and approach

Use the current official Expo template baseline: Expo 58.0.26, React 19.3.0, React Native 0.88.1 and strict TypeScript. Resolve Expo native packages against its bundled version map and preserve the npm lockfile. The installed Node v24.20.0 satisfies Expo's registry engine range.

Create a small development-only app at the workspace root, keeping the existing docs. Use Expo Router with one thin route and a Phase 0 screen. Test two synthetic parts, explicit Start/Pause/Resume/Next, overtime, safe SQLite checkpoints, fullscreen, screen awake and rotation. No production schedules, PDF parsing, LAN sharing or private data are included.

Use a development-only Android application ID `com.jwtimer.feasibility`. Use Expo's SDK defaults for native API levels until native prebuild is inspected; this does not settle the production minimum or target API. Local build commands are run by the owner.

## Prototype decisions, not owner requirements

- Checkpoint once per second while running and immediately on commands. A killed process may lose the most recent second or a pending write; show the checkpoint timestamp and uncertainty.
- When the app leaves the foreground, pause and save a checkpoint. Foreground return does not resume. This conservative prototype behavior avoids assuming background timing policy.
- Resume after process death restores saved elapsed time into Paused state. A separate Resume press starts the clock. Restart resets the part into Ready state.
- Use two synthetic 10-second parts and a 60-minute option for drift observation. No live meeting templates are asserted.
- Fullscreen requests hidden system bars and a wake lock only while the app is active and the option is enabled. Release both on exit/background.
- Use one SQLite connection, synchronous short transactions and no exposed database handle. Serialize writes naturally on the JS thread. Enable foreign keys before transactions; use WAL. This avoids Expo's separate-connection exclusive transaction foreign-key caveat. Revisit performance for production datasets.

## Boundaries

This is a feasibility prototype, not Phase 1 completion. No automatic start or transition at zero. No cloud build, telemetry, OTA service, peer sync or source upload. The dev client/Metro uses local development networking; package/Gradle downloads need internet during setup. Offline runtime acceptance uses a locally built bundled release variant after the debug path works.

No production schema migration is introduced. The prototype uses a separate database and rejects unknown schema versions. The app checks and initializes that schema when the owner launches it; the agent does not run it.

## Sources consulted

### Local Windows toolchain update

The next owner build detected VKJ-NX9 and reached native compilation, then failed in Reanimated's Ninja mkdir operation. The log and generated CMake cache select CMake 3.22.1 / Ninja 1.10.2. Source inspection and the official Expo troubleshooting guide identify older Ninja's long-path limitation as the leading cause. Tool version checks found installed CMake 3.31.1 bundles Ninja 1.12.1, and the Windows LongPathsEnabled setting is already 1.

Set the ignored local `.env` Gradle environment property `ORG_GRADLE_PROJECT_android.cmakeVersion=3.31.1`. Expo SDK 58 source reads `android.cmakeVersion` and applies it across Android app and library modules. Clear only project-local generated native caches before the owner retries. This is a local build-tool selection, not a production platform change. No Gradle/AGP/React Native downgrade, source patch or machine registry edit is required. Build success remains pending owner verification.

- https://docs.expo.dev/guides/local-app-development/
- https://docs.expo.dev/versions/latest/sdk/sqlite/
- https://docs.expo.dev/versions/latest/sdk/keep-awake/
- https://docs.expo.dev/versions/latest/sdk/navigation-bar/
- npm registry: expo and expo-template-blank-typescript metadata on 2026-11-20.
- https://docs.expo.dev/troubleshooting/windows-long-paths/
