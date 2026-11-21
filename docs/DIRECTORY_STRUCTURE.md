# JW-Timer source layout and naming

Frontend and backend are folder groups inside the Android app.
Both run locally on the device. No backend server is introduced.

## Structure

```text
src/
  frontend/
    components/
    screens/
    hooks/
    styles/
    navigation/
    context/

  backend/
    domain/
      meetings/
      profile/
      timer/
    services/
      diagnostics.types.ts
      meetingService.ts
      profileService.ts
    database/
      appDatabase.ts
      diagnostics/
      repositories/

  bootstrap/
    meetingDependencies.ts
    profileDependencies.ts

  constants/
    theme.ts
    strings/

  maps/
  utils/
```

## Responsibilities

- frontend/components: render UI and forward callbacks.
- frontend/screens: assemble views, hooks and dependencies.
- frontend/hooks: editing state, interaction flow and lifecycle.
- frontend/styles: static styles grouped by feature.
- frontend/navigation: typed routes, navigators and links.
- frontend/context: shared React projections and operations.
- backend/domain: pure types, validation and timer rules.
- backend/services: application operations and repository contracts.
- backend/database: SQLite initialization, migrations and adapters.
- bootstrap: connect services to concrete repositories.
- constants: shared tokens and interface text.
- maps: reserved reference category.
- utils: shared pure helpers when needed.

## Dependency rules

1. UI components receive data and callbacks.
2. Hooks invoke services rather than writing SQL.
3. Services depend on domain rules and repository contracts.
4. SQLite adapters implement repository contracts.
5. Domain modules import no React, Expo, navigation or SQLite.
6. Backend modules must not import frontend modules.
7. Bootstrap connects concrete implementations.
8. SQLite owns durable data; form drafts remain temporary state.

## Naming

- Screens: PascalCase + Screen.tsx.
- Components: PascalCase.tsx, optionally Form or View.
- Hooks: use + camelCase.ts.
- Services: camelCase + Service.ts.
- Repositories: camelCase + Repository.ts.
- Storage adapters: camelCase + Storage.ts.
- Types: camelCase.types.ts.
- Stylesheets: camelCase.styles.ts.
- Folders: lowercase.

## Preservation boundary

This grouping changes folder locations and import paths only.
It preserves styles, business logic, database filenames,
migration SQL, checksums, saved-data formats and timer rules.

Source backups are stored under .refactor-backups/.
They do not include the installed phone database.

Verification remains owner-run. Earlier checks do not
automatically verify this rearranged source.

This layout extends ADR 0003. Older folder diagrams are
historical; their business and privacy requirements still apply.
