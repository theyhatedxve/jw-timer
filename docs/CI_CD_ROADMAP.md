# JW Meeting Timer — CI/CD and Release Roadmap

**Entry/source update (2026-11-21):** [ADR 0003](adr/0003-react-navigation-and-source-layout.md) changes the JavaScript entry to `index.ts`/`App.tsx` and replaces Expo Router with React Navigation 7. See [DIRECTORY_STRUCTURE.md](DIRECTORY_STRUCTURE.md). Expo local Android generation/signing/distribution boundaries are unchanged. No pipeline, build or release was executed for this migration.

**File:** `CI_CD_ROADMAP.md`  
**Document ID:** JWMT-CICD-006  
**Version:** 1.0 (proposed implementation plan)  
**Date:** 2026-11-20  
**Status:** Planning only; no pipeline, container, server, or application code is deployed  
**Related specifications:** `TECHNICAL_PLAN.md`, `SYSTEM_DESIGN.md`, `SCREEN_FLOWS.md`, `design_guidelines.md`, `API.md`

## 1. Executive decision and deployment boundaries

JW Meeting Timer is an **Android-only, offline-first React Native + Expo development-build application**. Its backend is an **on-device** application/domain/infrastructure layer and SQLite database, **not** a centrally deployed API. Its peer API, if feasible, is a **trusted local-network protocol for schedules and assignments**, not a public service. Live countdown timers stay local. No account system or mandatory cloud storage is permitted.

**Primary deployment:** sign, test, and distribute an Android APK to approved testers/installers, and optionally publish an Android App Bundle (AAB) to Google Play. An AAB is a store distribution artifact; use an APK for direct installation. An installed device does not depend on GitHub, Expo's build infrastructure, a VPS, or a continuous network connection to operate.

**Secondary, optional deployment:** a containerized *developer toolchain* or a strictly nonessential, explicitly opted-in public-content relay, if an approved source requires one. Such a relay must **never** receive congregation people, private assignments, device identities/keys, backup contents, timers, or schedules. A VPS is **not required for the MVP**. Any future VPS scope requires an architecture decision record (ADR), privacy review, threat model, and a separate opt-in setting.

**No silent telemetry:** no analytics, crash forwarding, push service, OTA update, or private-data uploads by default. Build platforms may process source code and signing/build artifacts if used. Evaluate and disclose this separately from app-data transfer. Local Android builds are an alternative if build-service use is undesirable.

### 1.1 Definitions

- **CI:** repeatable checks for every change: types, lint, unit tests, contract/schema validation, dependency auditing, and packaging smoke tests.
- **CD:** gated, signed Android artifact publishing to a test track or production. Optional VPS delivery is a separate pipeline.
- **Environment:** developer, staging/test, or production *build configuration*. It does not imply different servers.
- **Release:** immutable artifact + version + source commit + checksums + approval + documented recovery path.
- **Migration:** upgrades a local SQLite database **on each installed device** when the application starts. CI never migrates private device databases remotely.

## 2. Architecture and artifact topology

```text
Git repository (one Android app)
  ├─ app/, src/                    Expo Router + domain + infrastructure
  ├─ assets/, android?             Assets; generated native code when applicable
  ├─ tests/                        Unit, integration, contract, E2E
  ├─ scripts/                      Reproducible build and verification tools
  ├─ .github/workflows/            Proposed CI and release workflows
  ├─ eas.json / app.config.ts      Build profiles and native/runtime configuration
  ├─ docs/ or root *.md            Architecture and operations specifications
  └─ deploy/optional-relay/        NOT created unless an ADR authorizes relay
                  │
         CI checks and approvals
                  │
       Android release build
        ├─ signed APK → controlled direct install / internal distribution
        └─ signed AAB → optional Google Play tracks
                  │
    installed Android devices
        ├─ on-device app logic + SQLite
        ├─ encrypted local backup / manual transfer
        └─ authenticated local LAN peer schedule sync

Optional independent branch (future ADR only):
  public-content relay source → OCI image → private registry → optional VPS
    (public-source material only; never private congregation records)
```

## 3. Twelve-Factor App compliance and applicability checklist

The Twelve-Factor methodology primarily targets services. The table distinguishes **applicable mobile release practices** from **optional VPS service requirements**. Do not distort an offline Android app into a stateless server simply to claim compliance.

| Factor | Android app applicability and check | Optional relay/VPS checklist | Evidence / gate |
|---|---|---|---|
| I. Codebase | [ ] One repository and traceable builds per release; app code, native config, migrations version-controlled | [ ] Service code versioned in same repo or its own explicitly managed repo | Tagged SHA and release manifest |
| II. Dependencies | [ ] Lockfile committed; native dependencies pinned/verified; reproducible installation | [ ] Pinned image digest and dependencies | Lockfile verification and SBOM |
| III. Config | [ ] Separate public build settings from on-device secrets; never embed private keys in `EXPO_PUBLIC_*` | [ ] Secrets provided through VPS secret store/CI secrets, not source | Static secret scan |
| IV. Backing services | [ ] SQLite is an embedded, durable local database, not a detachable cloud service | [ ] External dependencies explicit and replaceable | Dependency list and threat model |
| V. Build/release/run | [ ] Differentiate compile, sign, distribute, install; preserve exact artifact checksum | [ ] Build image once, deploy same digest | Signed release manifest |
| VI. Processes | [ ] Mobile lifecycle is stateful by necessity; keep durable state in SQLite, transient state in memory | [ ] Relay processes stateless | Recovery and restart tests |
| VII. Port binding | **N/A** for routine app UI; peer LAN listener only if Phase 0 validates it | [ ] Service listens on private container port behind proxy | Connectivity/security test |
| VIII. Concurrency | [ ] Single-writer SQLite orchestration; idempotent commands; avoid concurrent timer writers | [ ] Stateless replica-safe operation | Stress and database tests |
| IX. Disposability | [ ] Recover after activity kill, app restart, power loss, interrupted imports/sync | [ ] Graceful SIGTERM/drain | Failure injection |
| X. Dev/prod parity | [ ] Same domain code/schema; preview matches release flavor where practical | [ ] Same image across staging/prod; config differs | Build provenance comparison |
| XI. Logs | [ ] On-device privacy-safe diagnostic logs; no default external log export | [ ] Structured stdout/stderr; centralized aggregation optional and sanitized | PII redaction tests |
| XII. Admin processes | [ ] Versioned on-device migration and backup verifier are explicit tools | [ ] One-off migration job before traffic swap | Migration rehearsals |

**Compliance posture:** adopt Twelve-Factor principles where appropriate; mobile factors IV, VI, VII, and XI are intentionally adapted. Do not label the Android app “fully Twelve-Factor compliant” without this qualification.

## 4. Repository and build scaffolding

Suggested planned files (not created as implementation by this roadmap):

```text
.github/
  CODEOWNERS
  dependabot.yml
  workflows/
    pr-checks.yml            # safe, non-secret PR checks
    android-preview.yml      # protected test/preview APK
    android-release.yml      # signed production APK/AAB
    dependency-review.yml    # supply-chain review
    optional-relay.yml       # only after VPS ADR
app.config.ts                # typed public config; no secret key material
eas.json                    # EAS build profiles
package.json
package-lock.json            # choose one supported lockfile manager
scripts/
  verify-schema.*
  verify-doc-consistency.*
  verify-release-manifest.*
  migration-test.*
tests/
  unit/
  integration/
  contracts/
  e2e/
  fixtures/
release/
  manifest.schema.json
  checksums/                 # nonsecret metadata only
ops/
  RUNBOOK.md
  RELEASE_CHECKLIST.md
  ROLLBACK_RUNBOOK.md
  INCIDENT_RESPONSE.md
  ADR/
deploy/optional-relay/     # future-only
  Dockerfile
  compose.yaml
  proxy/
```

Correct final build file name: **`eas.json`**. No Python runtime is required for the Android app. Docker images are developer tools or optional relay services, **not APK runtime containers**.

## 5. Build environments and configuration

| Property | Development | Staging / preview | Production |
|---|---|---|---|
| Purpose | Local implementation and debugging | QA, internal install, migration rehearsal | Released Android binary |
| Distribution | Development client / local debug APK | Signed internal APK | Signed APK or Play AAB |
| App identifier | Separate `*.dev` flavor if practical | Separate `*.staging` flavor if practical | Stable final Android application ID |
| Label/icon | Visibly marked DEV | Visibly marked STAGING | Production branding |
| Data location | Local disposable/test SQLite | Separate sandboxed local app database | Private production SQLite on device |
| Pairing | Test peers only | Test peers only; **no production pairing** | Explicit trusted production peers |
| Online program retrieval | Mock and approved test source | Approved source with test fixtures/fallback | Approved source, optional |
| LAN discovery | Off until manually enabled | Restricted test environment | Off until trusted pairing enables it |
| Telemetry | Developer local logs | Local/export-on-consent diagnostic output | Local logs only by default |
| Build channel | Development | Preview/staging | Production |
| Secrets | Never in bundle | Build signing credentials only in protected builder | Production signing credentials only in protected release context |

**Isolation:** Android `applicationId` variants produce independent app sandboxes, avoiding accidental production-person transfers to staging. Pairing between environments should be denied. Test data must be synthetic, not exported congregation records.

### 5.1 Environment variables (reference, not a mandatory `.env` file)

| Name | Scope | Purpose | Security classification |
|---|---|---|---|
| `EXPO_PUBLIC_APP_ENV` | Bundled mobile | `development` / `staging` / `production` label | Public |
| `EXPO_PUBLIC_RELEASE_CHANNEL` | Bundled mobile | UI/build diagnostics | Public |
| `EXPO_PUBLIC_PUBLIC_SOURCE_URL` | Bundled mobile, only after approved source | Base URL of public program source | Public; never a secret |
| `EXPO_PUBLIC_ENABLE_ONLINE_IMPORT` | Bundled mobile | Feature gate for approved public source | Public; not authorization |
| `CI` | CI runner | Noninteractive mode | Nonsecret |
| `EAS_BUILD_PROFILE` | EAS builder context | Build profile label | Nonsecret; not trusted as permission proof |
| `EXPO_TOKEN` | Protected CI only, if EAS is used | EAS authentication | Secret, never bundled |
| `ANDROID_KEYSTORE_*` | Protected release builder only, if local signing | Keystore bytes/location/password/alias | Secret, never bundled or printed |
| `VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER` | Optional protected VPS deployment only | Remote deploy | Secret/sensitive deployment context |
| `RELAY_*` | Optional VPS container at runtime only | Public relay settings | Public/secret classified individually |

**Forbidden in app environment variables or CI artifacts:** device private identities, congregation membership/assignment data, backup passphrases, local encryption keys, administrator PINs, production DB snapshots. Android Keystore-generated key material remains device local. Config is **not** an authorization control. Refer to `API.md` for the source-of-truth configuration contract.

### 5.2 Build profiles

- **development:** Expo development client, debug convenience, test-only app ID; never receive production signing identity.
- **preview:** internal Android APK, production-like minification/native config, separate staged app ID and trust namespace.
- **production-apk:** signed APK for controlled direct distribution if approved.
- **production-play:** signed AAB and Play track submission if Play distribution is selected.
- Keep versions and channels compatible; native changes require a new native binary. Avoid automatic remote code updates until an opt-in policy, offline behavior, signature/trust, rollback, and privacy analysis is approved.

## 6. Containerization strategy (optional, non-mobile)

### 6.1 Decision table

| Workload | Docker? | Reason |
|---|---|---|
| Installed Android application | **No** | Native APK/AAB executes on Android; private data is on device |
| JS unit/test/lint worker | Optional | Reproducible Node toolchain for CI/local tests |
| Android emulator and native build | Usually no Docker requirement | Host/Android SDK/Gradle or EAS builder more reliable for native toolchain |
| Mock public-source adapter | Optional | Integration testing of HTTP and error conditions |
| Optional public-content relay | Conditional | Only if reviewed and authorized; no private data |
| SQLite production database | **No server database** | Private per-device embedded SQLite; no central DB to deploy |

### 6.2 Multi-stage Dockerfile blueprint for a *non-mobile* public-content relay

This is a **specification**, not an instruction to deploy a relay now.

| Stage | Base and task | Constraints |
|---|---|---|
| `deps` | Fixed-digest Node LTS image; install locked production/development dependencies | Network only during build; fail if lockfile differs |
| `test` | Copy source, type-check, lint, test, scan vulnerabilities | No production secrets, synthetic fixtures |
| `build` | Compile TypeScript or bundle service; produce immutable output | Strip source maps unless intentionally retained securely |
| `runtime` | Distroless or minimal nonroot image; copy production output only | Read-only root filesystem, dropped Linux capabilities, no shell if unnecessary |

- Pin base image digests and keep them patched; generate an SBOM, scan OS/npm packages, sign images if supported.
- Add a `.dockerignore` excluding `.env`, `.git`, signing keys, device data, backups, `node_modules`, Android build directories, and test secrets.
- `HEALTHCHECK` or orchestrator probe should verify a fast internal `/health/ready` endpoint. Readiness requires required nonprivate dependencies only.
- Expose only an internal unprivileged port. Terminate TLS at an independently hardened reverse proxy.
- No SQLite private meeting database, peer-device identity service, or user tracking inside the container.
- Container must run as a nonroot UID with constrained CPU/memory/pids, read-only filesystem, and a small writable ephemeral directory if necessary.

### 6.3 Docker Compose blueprint (staging or optional VPS)

```text
services:
  relay:           # optional, stateless public-content relay
    image: registry.example/jwmt-public-relay@sha256:<approved-digest>
    environment: nonsecret settings only; sensitive settings via secrets
    networks: [private]
    healthcheck: GET /health/ready
    restart: unless-stopped
    read_only: true
    user: nonroot
    cap_drop: [ALL]
  proxy:
    image: pinned reverse-proxy digest
    ports: [443:443]              # 80 only for managed redirect/challenge
    depends_on: healthy relay
    networks: [private, ingress]
secrets:
  optional_service_credentials: external or protected server-managed file
networks:
  private: internal
  ingress: external ingress attachment
```

The above is a *conceptual Compose topology*, not a runnable YAML file. Service credentials should not be environment-expanded into published Compose config or logs. Prefer managed secrets mounted with restrictive permissions. Docker Compose alone does **not** guarantee zero-downtime deployments or automated blue/green failover.

## 7. Git branching, governance, and release versioning

- `main`: protected, releasable branch with mandatory CI and review.
- `feature/*` and `fix/*`: short-lived branches; merge via reviewed PRs.
- `release/vX.Y.Z`: optional stabilization branch only if release cadence requires it.
- Tags: `android-vX.Y.Z+N` or consistent SemVer plus monotonically increasing Android `versionCode`.
- Increment the Android version code for each released store build; never reuse an already distributed version code.
- Record: Git SHA, dependency lockfile hash, app version/build code, Expo SDK and React Native versions, native runtime identifier, build profile, artifact SHA-256, signing-key fingerprint, test evidence, approver, and distribution channel.
- Protect `CODEOWNERS` and files controlling signing, security, database migrations, CI, synchronization, and external integrations.
- Use an ADR for any hosted service, telemetry, OTA update channel, native runtime change, new network permission, or privacy-sensitive dependency.

## 8. GitHub Actions workflow requirements

### 8.1 `pr-checks.yml`: untrusted PRs, no release secrets

**Trigger:** pull requests to `main`, changes to application, migrations, CI, dependencies, and docs; optional manual dispatch for maintainers.

1. Check out pinned SHA with `persist-credentials: false` where possible.
2. Set `permissions: contents: read`, increase only for a narrowly scoped job.
3. Install pinned Node and package manager, with lockfile validation.
4. Type-check (`tsc --noEmit`), lint, format checks; enforce architecture/dependency boundary rules.
5. Run unit and integration tests; coverage and accessibility component tests.
6. Validate schema migration chain on fresh DB and historical fixture DB; exercise rollback-safe upgrade behavior.
7. Run contract tests for import normalization and peer sync envelope schemas.
8. Run dependency review, secret scanning, license review, and optional CodeQL/SAST for TypeScript/native code.
9. Run Android compile/build smoke test on a suitable runner or approved build service for PRs from trusted contributors; avoid secrets on external forks.
10. Publish only sanitized test summaries, never customer DB fixtures or real backup files.

**Gate:** No failed test, new high/critical untriaged vulnerability, migration breakage, unresolved architecture boundary violation, or missing required review.

### 8.2 `android-preview.yml`: staging distribution

**Trigger:** merge to protected branch or maintainer-approved manual dispatch.

1. Require successful PR checks and protected staging environment.
2. Build *preview APK* using EAS or a reproducible local Gradle runner.
3. Verify staged app ID is isolated from production.
4. Sign with staging-specific key. Store signing secrets only in protected runner/EAS credentials store.
5. Run smoke tests for install/launch, no-network timer, database initialization, PDF fallback, schedule editor, and screen-awake on actual Android devices or a supported device farm with synthetic data.
6. Publish APK, SHA-256, manifest, release notes, and test report to access-controlled artifacts.
7. Have at least one tester verify native capabilities on representative low/mid-range Android devices.

**Gate:** Preview must pass acceptance checks, including airplane-mode operation and no automatic private-data network traffic.

### 8.3 `android-release.yml`: production APK/AAB

**Trigger:** signed/tagged release and explicit environment approval; never direct execution from untrusted PRs.

1. Verify the tag points to reviewed protected-branch commit and tests are green.
2. Lock dependency versions, native toolchain, signing identity, app ID, and version code.
3. Generate release notes, dependency SBOM, and release manifest; confirm known privacy/security deviations have approval.
4. Build signed production APK and/or AAB, depending on distribution decision. Do not treat AAB as directly installable.
5. Verify signing certificate identity, artifact SHA-256, package ID, native version/runtime compatibility, and target/min SDK.
6. Execute release candidate smoke tests on signed artifact, including upgrade from previous release with an existing local SQLite database.
7. Publish to restricted APK download channel or Google Play internal testing first; promote after manual sign-off.
8. Archive artifacts and manifests under retention policy, excluding credentials and real device data.
9. Publish release notes with documented migration effects, rollback limitations, and support procedure.

**Approval separation:** the actor who initiates a production release should not unilaterally bypass required protected environment approval when governance allows separation.

### 8.4 Pipeline hardening

- Pin third-party GitHub Actions to full commit SHA; periodically refresh pinned hashes.
- Default `GITHUB_TOKEN` permissions to read only; grant `id-token: write` only for an explicitly authorized OIDC integration.
- Do not expose EAS tokens, Android keystores, or VPS SSH keys to PRs from forks.
- Use protected environments and required reviewers for production.
- Do not use unchecked PR titles/branch names directly in shell commands.
- Concurrency groups prevent overlapping production release jobs.
- Mask secrets; prohibit workflow debug logs with sensitive environment values.
- Dependabot updates require the same checks as human changes.
- Retain audit trail of who approved a release and which artifact was distributed.

## 9. Android signing, distribution, and updates

### 9.1 Signing and key custody

- Decide whether to use EAS-managed signing, a secured local keystore, and/or Play App Signing. Document who controls the key, recovery procedure, and backup custody before production release.
- Separate staging and production keys. Never commit keystores, passwords, EAS tokens, or recovery material.
- Restrict release secret access to approved maintainers and protected workflows.
- Verify app signing identity on every upgrade. A mismatched certificate blocks normal upgrade and must not be worked around by uninstalling production apps without a verified backup/recovery plan.

### 9.2 Distribution policy

| Channel | Artifact | Audience | Approval |
|---|---|---|---|
| Development | Development client/debug APK | Developers | Local |
| Internal preview | Signed APK | Testers | Staging checks |
| Controlled sideload | Signed release APK | Approved Android installers | Production release approval |
| Google Play | Signed AAB | Managed Play tracks / public if authorized | Production + store review |

**User data stays local:** installing an app update must not delete the SQLite store. The updater/migrator must preserve on-device records. A backup should be offered before major schema changes.

### 9.3 Over-the-air (OTA) update position

**Default:** disabled until specifically approved. Native module changes require a new Android binary. If EAS Update is eventually adopted, define runtime versions, update channels, code-signing/trust requirements, staged rollouts, offline fallback, explicit privacy disclosure, and rollback behavior. OTA update delivery would contact an external update service, which is separate from transferring schedules. No self-updating background dependency is part of the approved MVP.

## 10. SQLite migration and client-data safety choreography

Each Android device owns its SQLite database. CI can verify migration scripts but cannot reach and migrate users' private databases.

1. Define schema version, explicit forward migrations, default and constraint policy, and test fixtures from all supported prior versions.
2. On startup, open the local DB through a single migration coordinator; acquire appropriate serialized/exclusive transaction behavior.
3. Validate schema version and available storage. For risky upgrades, offer a local encrypted backup and obtain explicit confirmation if necessary.
4. Apply **short**, forward-only, transactional migrations where SQLite DDL supports it; no network/PDF work within a DB transaction.
5. Run `PRAGMA foreign_key_check` and relevant integrity checks; verify expected schema version.
6. On failure, roll back the active transaction where possible, keep an uncorrupted recoverable copy/backup, and show an actionable recovery screen. Never reset the DB silently.
7. Resume application only after migration success; sync/import commands remain blocked until local schema is valid.
8. Test upgrades using databases created by *every supported prior release*. Test interrupted migration, low storage, corrupt backup, clock changes, and app process death.

**Rollback caveat:** downgrading the APK does not guarantee an older version understands a newly migrated schema. Prefer forward fixes or validated user-controlled backup restore. Do not recommend uninstalling/reinstalling as a routine rollback: uninstalling risks local database loss.

**Data consistency:** schedule mutations and corresponding change/audit records commit together; peer sync updates apply atomically; import preview is separate from final commit; avoid non-exclusive async transaction interleaving; coordinate writes using a validated exclusive transaction/serialized writer.

## 11. Verification matrix and quality gates

| Suite | Scope | When | Release threshold |
|---|---|---|---|
| Unit | Timer state machine, domain invariants, validation, ACL | Every PR | All pass |
| Integration | SQLite migrations, ACID rollback, repository functions | Every PR | All pass |
| Contract | LAN envelopes, protocol versions, PDF normalized model | Every PR | All pass |
| Accessibility | TalkBack labels, touch targets, scaling, contrast, error feedback | PR + preview device | No critical defects |
| Security | Untrusted device, replay, tampering, revoked pairing, secret leakage | PR for changed area + preview | No unresolved critical/high exposure |
| Offline | Airplane-mode timer/programs; backup/restore without internet | Preview/release | All critical paths pass |
| Sync resilience | Packet loss, leader switch, duplicate revision, stale peer, split-brain | Preview/release after transport exists | No silent data loss or overwrite |
| PDF | Native-text, corrupt, scanned unsupported, duplicate, different workbook layouts | Preview after importer exists | Safe preview/rejection; no silent replacement |
| E2E Android | Onboarding → meeting → assignment → timer → backup; later pair/sync | Preview + release | All critical journeys pass |
| Update | Previous APK with local DB → new signed APK, migration, retained data | Every release | Zero critical data loss |
| Supply chain | SBOM, lockfile, package scan, secret scan, provenance | PR/release | Approved findings only |

**Release-blocking invariants:** no mandatory internet dependency; no cloud upload of private meeting/assignment data; no privilege escalation; no unauthorized LAN reads; no timer dependence on peer state; no silent destructive import, migration, or schedule update; privacy-safe diagnostics.

## 12. Release choreography (Android primary)

### 12.1 Normal release

1. Merge approved PRs to protected `main`.
2. Cut a release candidate and freeze database schema/permissions changes.
3. Build preview APK; test on real Android devices, including disconnected operation.
4. Rehearse upgrade from prior production version, inspect local data and foreign keys.
5. Review dependency/software bill of materials, licensing, source adapter permissions, native permissions, and privacy statements.
6. Approve release, tag immutable commit, and build signed APK/AAB from that commit.
7. Verify checksum and signing certificate; publish release manifest.
8. Distribute to limited group/internal track first. Collect opt-in, sanitized feedback only.
9. Promote to broader approved distribution after acceptance.
10. Preserve signed previous release artifact and migration fixtures for incident response.

### 12.2 Failed Android release / rollback

- **Pre-distribution failure:** stop release and discard failed artifact; nothing to roll back on devices.
- **Fault without schema change:** halt distribution, ship corrected build with greater version code; store rollback or prior package requires compatible signing and data format.
- **Fault after schema migration:** halt rollout, use forward repair or a validated encrypted backup restore. Never silently install older APK or delete device data.
- **Security compromise:** revoke exposed CI tokens/signing material where possible, stop distribution, notify affected testers, investigate artifact provenance, issue new protected build under verified key policy.
- **OTA (future only):** update-channel rollback only if specifically enabled and native runtime-compatible; it cannot undo arbitrary database migrations.

## 13. VPS deployment choreography — conditional future-only

> **Gate:** do not implement or provision a VPS until an ADR explicitly defines an allowed, nonessential public-content service. An optional relay is unrelated to local peer sync. It must remain unavailable without affecting core meeting/timer/scheduler operation. A public relay must never store or receive congregation/private assignment information.

### 13.1 Preconditions

- Written ADR and privacy/data-flow review approve a public-only relay.
- Domain and TLS certificates established; restrictive firewall allows only SSH from trusted admin addresses and HTTPS ingress.
- Deploy service account has minimal permissions, no root login, key-only SSH authentication with host-key verification and audited key rotation.
- Registry image is built in CI, scanned, immutable, and referenced by digest; no `docker build` from mutable source on production VPS.
- Reverse proxy supports selecting active blue/green instance and probing readiness.
- Backups cover *only* relay configuration/public cache if needed. Do not centralize mobile data.
- Monitoring is sanitized, local/VPS-scoped; logs exclude query parameters or device identifiers tied to individuals.

### 13.2 Pull-over-SSH release (optional approved service)

1. CI builds, tests, signs/scans and pushes immutable image digest to private registry.
2. Approved production job establishes short-lived/least-privileged SSH connection, verifies pinned host key (or approved SSH certificate).
3. Server pulls the **specific approved image digest**, not `latest` and not live source code.
4. Deploy script verifies manifest and free disk space, creates new **green** Compose project/instance on an unused internal port/network alias.
5. Run any necessary *service-owned, public-data* migration as a dedicated one-off job. Never access Android SQLite. If schema changes are required, make them backward-compatible (expand-then-contract).
6. Start green; wait for readiness and perform smoke tests against green only.
7. Atomically switch reverse-proxy upstream from blue to green and reload gracefully; test external HTTPS endpoint and error rates.
8. Keep blue running for a bounded rollback window. Observe latency, error rate, freshness and security indicators.
9. If healthy, retire blue and prune only approved unused images; record release SHA/digest and approval.
10. If unhealthy, switch upstream back to blue. Revert *service* migrations only through explicitly compatible forward-repair or validated restore procedures.

**Zero-downtime qualification:** this is a blue/green *design target*, not a guarantee. A single-VPS host restart, reverse-proxy crash, incompatible schema migration, or DNS/tunnel failure still introduces outage. Standard `docker compose up -d` on one service instance does not ensure zero downtime. Document acceptance criteria (health probes, connection drain, rollback time, error budget) before adoption.

### 13.3 VPS staging vs production

| Concern | Staging VPS, if approved | Production VPS, if approved |
|---|---|---|
| Role | Validate only public-content relay | Serve optional public program content |
| Data | Synthetic/public fixtures | Public/approved content only |
| Domain | Separate staging subdomain | Stable production subdomain |
| Registry | Preview digest | Signed/reviewed production digest |
| Secrets | Separate minimal staging credentials | Protected production credentials |
| Access | Restricted staging testers | Public read access only to permitted public data |
| Deployment | Automated after staging approval | Protected manual approval |
| Rollback | Swap to previous digest | Swap upstream after health failure |

### 13.4 Optional VPS security and maintenance

- Apply OS security updates, image digest upgrades, dependency scans and host firewall rules on a defined monthly cadence and immediately for urgent fixes.
- Rotate credentials; test certificate renewal, disaster recovery, disk pressure, traffic spikes and incident response.
- Enforce rate limiting and outbound allowlists where appropriate; do not bypass source robots/terms or access restrictions.
- Prefer no persistent service DB. If one is approved, specify explicit backup and migration plan unrelated to personal app data.
- Public relay down: app must continue offline and retain cached approved programs, manual entry and local PDF import.

## 14. Pipeline tasks and ownership backlog

| Phase | CI/CD deliverable | Dependencies | Acceptance gate |
|---|---|---|---|
| 0 | Decide distribution (APK/Play), build platform (EAS/local), privacy, signing custody, optional VPS necessity | Architecture ADRs | Decisions and threat model signed off |
| 1 | Repo protections, `CODEOWNERS`, deterministic dependencies, PR checks, test fixtures | Project scaffold | CI passes without secrets |
| 2 | Android development/preview build, isolated staging app ID, signed APK smoke tests | Android native capability validation | Offline foreground timer and DB pass |
| 3 | Migration CI and upgrade fixtures; backup integrity checks | SQLite schema and repository | No data loss on supported upgrades |
| 4 | Import adapter contract checks, PDF fixture matrix, approved-source tests | Import design approved | Safe failed import behavior |
| 5 | LAN protocol security contract/integration tests, physical two-device matrix | Pairing transport and conflict ADR | Unauthorized peer denied; atomic sync |
| 6 | Protected production signing pipeline; release manifest/SBOM and staged rollout | All critical E2E | First reproducible signed release |
| 7 | Operational runbooks, key rotation/recovery drills, update and release cadence | Release candidate | Release rehearsal accepted |
| Future | Dockerized public relay and VPS blue/green (if approved) | Separate privacy/security ADR | Optional service is noncritical to app |

**Ownership suggestions:** Android/build maintainer, database/domain maintainer, security/release reviewer, QA/device-test owner. In a small team, one person may hold multiple technical roles, but production approvals should be independently reviewed when staffing allows.

## 15. Known issues and unresolved decisions

| ID | Question / risk | Proposed default | Decision owner |
|---|---|---|---|
| CICD-01 | EAS hosted builds versus fully local builds | EAS preview for speed; local reproducibility check | Project owner + security |
| CICD-02 | Direct APK versus Play distribution | Controlled signed APK first | Project owner |
| CICD-03 | Minimum/target Android SDK and native libraries | Phase 0 feasibility determines baseline | Android maintainer |
| CICD-04 | Signing key custodian and recovery process | Protected production credential store | Project owner + release reviewer |
| CICD-05 | OTA code updates permitted? | Disabled by default | Project owner + privacy |
| CICD-06 | Any optional VPS/public relay needed? | No VPS in MVP | Architecture owner |
| CICD-07 | JW.org or reference-site legal/technical integration | No unsupported scraping; validate separately | Source integration owner |
| CICD-08 | Specific local LAN transport | Contract stays transport-neutral until Phase 0 | Android/security |
| CICD-09 | SQLite migration rollback and low-storage procedure | Forward-safe migrations + verified manual backup | Data owner |
| CICD-10 | Supported prior versions for upgrades | Define policy before v1 public release | Release owner |
| CICD-11 | Crash/telemetry tools | No remote telemetry by default | Privacy owner |
| CICD-12 | GitHub repo organization/branch protections | Protected `main` + review | Project owner |
| CICD-13 | External build artifact retention and access | Limit retention, protect artifacts | Release owner |
| CICD-14 | Secure backup restore across Android devices | User-mediated encrypted transfer | Security/data owner |
| CICD-15 | Zero-downtime feasibility on a single VPS | No uptime guarantee; blue/green only if relay exists | Infra owner |

## 16. Release readiness checklist

### Mandatory Android release gate

- [ ] Requirements and ADRs approved; out-of-scope cloud/VPS features remain disabled.
- [ ] Domain model, schema migrations, source adapters, and permission boundaries have reviewed owners.
- [ ] Reproducible lockfile build, lint, type-check, unit/integration/contract and Android E2E tests pass.
- [ ] Airplane-mode timer, schedules, assignments, import fallback, backup/restore pass.
- [ ] SQL foreign keys and ACID boundaries validated; upgrade from previous version preserves all records.
- [ ] Trusted pairing and encrypted LAN sync pass only when those modules ship; disabled before ready.
- [ ] No cloud collection or external logging of private assignments; optional public retrieval is disclosed.
- [ ] Accessibility audit complete: TalkBack, text scaling, ≥48dp preferred targets, contrast, fullscreen timer.
- [ ] Dependency/license/security review has no unapproved high-severity issues.
- [ ] Signed APK/AAB has correct ID, version code, certificate fingerprint and checksum.
- [ ] Release manifest, rollback/runbook, operator instructions and approver are recorded.
- [ ] Release tested on representative Android devices, including older/low-resource supported devices.

### Conditional VPS gate (only with a signed ADR)

- [ ] Public-only service purpose and privacy data-flow reviewed; mobile app remains fully functional without it.
- [ ] Multi-stage pinned Docker image, SBOM, secrets controls, health endpoints and TLS implemented.
- [ ] Compose blue/green staging deployment and health-based proxy switch rehearsed.
- [ ] SSH deploy account and host-key validation reviewed; immutable digest deployment enforced.
- [ ] Service migrations, backward-compatible rollout, rollback and operational alerting tested.

## 17. Reference standards and current vendor documentation

- Twelve-Factor App: https://12factor.net/
- Expo Android APK and internal distribution: https://docs.expo.dev/build-reference/apk/ ; https://docs.expo.dev/build/internal-distribution/
- Expo Android Play AAB: https://docs.expo.dev/submit/android/
- Expo updates/runtime versioning (future option only): https://docs.expo.dev/eas-update/runtime-versions/ ; https://docs.expo.dev/eas-update/deployment/
- GitHub Actions secure use: https://docs.github.com/en/actions/reference/security/secure-use
- Android app signing: https://developer.android.com/studio/publish/app-signing
- Docker build best practices: https://docs.docker.com/build/building/best-practices/
- Docker Compose health and startup: https://docs.docker.com/compose/how-tos/startup-order/

---

**Final implementation boundary:** CI/CD automates quality checks and **Android artifact distribution**. A VPS is an **optional future service deployment**, never the location of private scheduling data or live timer state. No server, Docker environment, CI workflow or app implementation is created by this planning document.
