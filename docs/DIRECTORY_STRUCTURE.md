# JW-Timer source layout and naming

Current source organization: ADR 0003, approved 2026-11-21. Implementation is source-reviewed; runtime verification is pending.

```text
JW-Timer/
  App.tsx                         Provider/navigation composition
  index.ts                        Expo root registration
  app.config.ts                   Android/native configuration
  src/
    components/
      common/                     ActionButton, SectionView, ProfileBoundary
      profile/                    ProfileForm
      timer/                      TimerSessionView and presentation wake-lock primitive
      diagnostics/                DiagnosticsView
    constants/
      theme.ts                    Existing color/spacing/type/layout tokens
      strings/                    en.ts, profileEn.ts
    context/
      ProfileContext.tsx          Profile snapshot and injected service
    hooks/
      useLocalProfile.ts
      useProfileForm.ts
      useTimerSession.ts
      useSqliteChecks.ts
      useSectionScreen.ts
    maps/                         Reserved reference category; no map feature
    navigation/
      types.ts                    Root/tab route parameter lists
      tabs.ts                     Tab definitions
      linking.ts                  Existing scheme/path compatibility
      TabNavigator.tsx
      AppNavigator.tsx
    screens/                      Home, Meetings, Assignments, Timer, Settings,
                                  Profile, TimerSession, Diagnostics
    state/
      profile/
        profile.ts                Pure types/validation
        profileService.ts         Application use case and repository port
        profileRepository.ts      SQLite implementation
        profileDependencies.ts    Concrete composition
      timer/timer.ts              Pure monotonic countdown engine
      db/
        timerStorage.ts           Private checkpoint database connection
        sqliteDiagnostics.ts      Manually triggered scratch-database checks
      diagnostics/
        diagnostics.types.ts      Diagnostic runner/result boundary
    utils/                        Reserved shared pure helpers
  tests/timer.test.ts              Existing deterministic timer cases
  docs/                           Specs, ADRs, plans and owner evidence
  android/                        Generated native project; owner regenerates/builds
  .refactor-backups/               Ignored local rollback ZIP, manifest, legacy source
```

## Naming conventions

| Purpose | Convention | Example |
|---|---|---|
| App page | PascalCase + Screen.tsx | ProfileScreen.tsx |
| UI component | PascalCase.tsx, optionally Form/View | ProfileForm.tsx, TimerSessionView.tsx |
| React hook/controller | use + camelCase.ts | useProfileForm.ts |
| Context | PascalCase + Context.tsx | ProfileContext.tsx |
| Business service | camelCase + Service.ts | profileService.ts |
| SQLite adapter | camelCase + Repository/Storage.ts | profileRepository.ts, timerStorage.ts |
| Pure domain module | camelCase.ts | profile.ts, timer.ts |
| Types-only contract | camelCase.types.ts | diagnostics.types.ts |
| Navigation config | camelCase.ts / PascalCase navigator | tabs.ts, AppNavigator.tsx |
| Documentation | Existing project MD convention | CODING_PRINCIPLES.md, ADR files |

Folders use lowercase names. Functions/variables/hooks use camelCase; components/types use PascalCase; immutable configuration catalogs may use UPPER_SNAKE_CASE. Do not create duplicate case-only filenames on Windows.

## Dependency boundaries

1. Screens assemble view components and hooks. Views consume data/callbacks; no SQL, business validation or navigation state mutations in JSX.
2. Hooks call application services or a deliberately injected diagnostic runner. Context exposes read-only committed projections plus service operations.
3. Pure domain files import no React, Expo, navigation or SQLite. Do not move business rules into utility dumping grounds.
4. Repository adapters validate stored data and perform transactions. Preserve SQLite as durable authority; form drafts remain transient.
5. Navigation and dependency composition wire concrete implementations. Folder names do not change the existing privacy, authorization or transaction contracts.
6. Do not preserve obsolete file-based route folders inside active source. Keep rollback material outside TypeScript includes.

## Refactor boundary

No schema change, data reset, app ID change, automatic timer start, hosted service, AsyncStorage migration, travel feature or new publishing authority is part of this directory change. Source layouts in older spec sections are historical baselines superseded by ADR 0003; the business rules still apply.
