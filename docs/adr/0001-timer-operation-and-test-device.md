# ADR 0001: Timer operation and primary test device

Date: 2026-11-20
Status: Timer behavior accepted by the owner in this chat; hardware details owner-reported, not device-verified.

## Context

The planning baseline leaves timer transition, overtime and restart behavior open. The owner confirmed these choices before authorizing the next Phase 0 step.

## Decisions

- Primary physical test device: Honor 600 5G, Android 17, as reported by the owner. This does not decide the minimum supported Android version or target SDK.
- Every part requires an explicit Start action. Loading, advancing, returning to the foreground or reopening the app must never automatically start a countdown.
- At zero, keep the current part active and count overtime as `+MM:SS` until the operator advances. Do not automatically advance at zero.
- Advancing loads the next part in Ready state. The operator presses Start to begin it.
- After unexpected process closure, show the last safe saved checkpoint and ask whether to resume or restart. Do not resume automatically.
- Recovery must explain that a checkpoint can be older than the interruption. Never reuse a previous process's monotonic timestamp or claim precise elapsed time while the app was closed.

## Consequences

This decision takes precedence over earlier provisional automatic transition rules in TECHNICAL_PLAN.md, SYSTEM_DESIGN.md, SCREEN_FLOWS.md and dependent timer UI/API proposals. The earlier manual/automatic mode distinction needs review before exposing a mode selector; it must never enable automatic start.

The exact checkpoint persistence cadence, timer background behavior, warning thresholds and optional sound/vibration remain implementation decisions or open product questions. A specific recovery estimate algorithm has not been approved.

No application behavior has been implemented or tested by this record. SQLite schema and peer protocol remain unchanged. Timer sessions remain local and excluded from schedule synchronization.

## Owner acceptance checks for the later prototype

1. Load a part and wait: it stays Ready.
2. Press Start and pass zero: the same part displays increasing overtime.
3. Press Next: the next part stays Ready until Start.
4. Exit fullscreen or rotate: no implicit start or reset occurs.
5. Kill and reopen the app: a checkpoint/recovery prompt appears; neither choice executes before confirmation.
6. Confirm recovery: Resume uses the disclosed saved checkpoint; Restart resets the part and leaves it Ready until Start.
