# Phase 0 Readiness Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for future prototype implementation. The owner runs all tests. This plan records preparation and pending work; it does not declare Phase 0 complete.

**Goal:** Prepare and validate a minimal Android feasibility prototype before building the application foundation.

**Architecture:** One offline Android app with a local timer engine and SQLite. Native feasibility uses an Expo development build. No hosted backend is required.

**Tech Stack:** React Native, Expo development builds, strict TypeScript, SQLite. Dependency versions are not selected yet.

**Spec:** ../../TECHNICAL_PLAN.md, ../../SYSTEM_DESIGN.md, ../../SCREEN_FLOWS.md and ../../adr/0001-timer-operation-and-test-device.md.

## Global constraints

- Android only; primary test device is owner-reported Honor 600 5G with Android 17.
- Every part requires Start; zero means overtime until operator advances.
- Saved checkpoints require explicit recovery confirmation after process death.
- SQLite owns durable records; monotonic timing owns active elapsed time.
- The owner runs tests, builds and physical-device acceptance checks for this work. Provide commands once their target project exists.
- No private records, PDFs or keys uploaded; no analytics or automatic remote updates.
- Planning baseline approval and feasibility gates remain in force before application source implementation.

## Review focus

- Reaching zero must preserve the current part and count overtime.
- Next must leave the next part Ready until Start.
- Rotation/fullscreen exit must preserve active timing.
- Process death must not reuse a stale monotonic clock reference.
- Failed SQLite writes/migrations must preserve existing records.

## Task 1: Record confirmed decisions and inspect readiness

**Files:** docs/adr/0001-timer-operation-and-test-device.md; this plan; decision notices in the three core specifications.

- [x] Record the owner's timer decisions and reported test device.
- [x] Inspect command availability and installed SDK directories without running tests.
- [x] Check Node, npm.cmd, Git and Java versions.
- [x] Owner supplied ADB output confirming authorized VKJ-NX9, Android 17, SDK/API 37.

### Observed on this PC

| Item | Observed result |
|---|---|
| Node | v24.20.0; compatibility with the eventual Expo SDK is not yet assessed |
| npm | 11.19.0 via npm.cmd; PowerShell blocks npm.ps1 |
| Git | 2.55.0.windows.5; this workspace has no .git directory |
| Java/Javac | Temurin 17.0.20.1 / javac 17.0.20.1 |
| Android SDK | C:/Android/Sdk; platform directories android-36 and android-37.0; build tools 36.0.0 and 37.0.0 |
| ADB | Agent invocation failed creating its configuration directory; owner separately supplied successful authorized device output: VKJ-NX9 / Android 17 / API 37 |
| Android Studio | Not found at its default Program Files location; other installation locations were not searched |

Installed directory names alone do not prove build compatibility, valid licenses or Android 17 support. No tests, builds, dependency installation or device commands succeeded as validation of app behavior.

### Owner device check

Enable Developer options and USB debugging, connect the phone, and approve its USB debugging prompt. Run in a normal PowerShell terminal:

```powershell
adb devices -l
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
adb shell getprop ro.build.version.sdk
```

Expected: exactly the intended phone listed as `device`, followed by its reported model, OS release and SDK level. If multiple devices are listed, use `adb -s <serial> shell ...` for the intended phone. `unauthorized`, `offline`, no device, or an ADB error leaves this check pending. These are device-readiness commands, not application tests.

## Task 2: Select a reproducible development build

- [ ] Verify the current official Expo/React Native requirements before choosing versions.
- [x] Owner chose local Android builds. No EAS hosted build or source upload.
- [ ] Record minimum SDK, target SDK, app identifier and development-only identifier.
- [ ] Resolve the absent CODING_PRINCIPLES.md reference before the chat-code workflow is invoked; current technical-plan engineering principles remain applicable.
- [x] Prepared ADR 0002 and the Phase 0 native prototype plan; native acceptance remains pending.

## Task 3: Prove the native prototype on hardware

- [x] Owner reported successful local development build and completed the requested basic timer, fullscreen/rotation, background-pause and recovery checks. Agent did not observe runtime execution.
- [ ] Owner runs ADR 0001 timer checks with deterministic clock cases plus real-device observation.
- [x] Owner reported completing the 60-minute foreground drift comparison. Exact measured difference was not supplied; do not invent a numerical result or claim independently verified accuracy.
- [x] Owner reported completing fullscreen exit, keep-awake release, portrait/landscape, TalkBack and 200% font scaling checks. These are owner-reported outcomes.
- [ ] Owner checks SQLite persistence, exclusive-write rollback, foreign keys, migration failure and WAL behavior.
- [ ] Record actual results and failures; no unchecked item may be described as passing.

Native SQLite checks are now prepared in the prototype under Open SQLite checks. Their synthetic rollback/migration/isolation results remain pending owner execution; production schema and actual storage-exhaustion/process-kill failure coverage remain separate.

## Remaining Phase 0 gates

- [ ] Evaluate local PDF extraction with lawfully obtained samples and supported languages.
- [ ] Assess public-source permission and feasibility; no online adapter is approved yet.
- [ ] Evaluate LAN discovery, authenticated transport and Android Keystore feasibility.
- [ ] Resolve assignment conflict rules, viewer data scope, lost-leader recovery and backup/key policy before dependent implementation.
- [ ] Create the threat model and dependency/telemetry review.
- [ ] Classify each integration as feasible, explicitly deferred or blocked, with owner-visible evidence.

**Next phase:** Phase 1 foundation and accessible navigation, only after the applicable Phase 0 gates are satisfied.
