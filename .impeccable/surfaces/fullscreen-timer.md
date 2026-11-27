# Fullscreen timer

Mode: Operate
Platform: Android
Target: src/frontend/components/timer/FullscreenTimerView.tsx

## Task

Read the current countdown at a distance and deliberately pause/resume,
restart the selected part, choose a program part, or leave fullscreen.

## Direction

Build directly from the owner's portrait and landscape Quiet Focus
references. Match their hierarchy and controls without copying example
meeting data. The owner confirmed dark reference defaults while preserving
explicit custom colors.

## States and constraints

Ready waits for Start; Paused waits for Resume; Running disables program
selection; overtime retains its prefix and custom color; completion and
checkpoint recovery use existing handlers. Portrait/landscape follows
device orientation. Do not add a rotation control or force orientation.
Normal Timer appearance and behavior remain unchanged.

## Acceptance

Huge fitted centered digits; real meeting and part titles; state badge;
allotted duration and optional progress; Resume/Pause and Restart part;
View program/Program opens the existing pause-safe picker including its
Finish program action; accessible exit in both orientations; keep-awake
and custom color/visibility/digit-size settings preserved.

## Pending owner checks

Android portrait and landscape, long titles, font scale 1.3, light/dark app
appearance, explicit custom colors, hidden title/progress, overtime, picker
lock, restart confirmation, Finish program, and hardware Back.
