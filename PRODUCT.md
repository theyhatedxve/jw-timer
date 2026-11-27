# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Local meeting timer operators managing Jehovah's Witnesses Midweek and
Weekend meeting programs on their own Android device.

## Product Purpose

Import or open a meeting program, select a timed part, and operate its
countdown locally. Readability and deliberate operator control matter
during a live meeting.

## Stack

Existing Expo, React Native, TypeScript, NativeWind, React Navigation,
and local SQLite implementation. See docs/DIRECTORY_STRUCTURE.md.

## Capabilities and Constraints

- Local PDF import and website-based WOL import create saved programs.
- Each part waits for explicit Start/Resume. Zero does not auto-advance.
- Switching parts retains their individual elapsed time.
- Fullscreen supports portrait and landscape, keep-awake, and Android Back.
- Saved fullscreen color, digit-size, title, and progress preferences remain.
- No mandatory account, cloud database, or live timer synchronization.
- Current behavior and owner decisions are recorded in docs/SCREEN_FLOWS.md.
- The project instruction files under docs remain authoritative.

## Brand Commitments

The owner supplied the Quiet Focus screen references in this conversation.
Fullscreen defaults use the reference's dark background and white digits
in both app themes; the owner explicitly confirmed this on 2026-11-27.
Explicit custom colors override those defaults.

## Accessibility and Inclusion

Respect Android safe areas, 48 dp minimum controls, readable contrast,
font scaling, labelled buttons, and status conveyed by text as well as color.

## Evidence on Hand

Owner-supplied Home, Meetings, Timer, Settings, and portrait/landscape
fullscreen references are in this conversation. Implementation is in src.
Device verification status is recorded separately from source inspection.

## First-use flow

The owner approved a short, skippable three-step introduction before
congregation setup. A saved profile is the existing first-use completion
gate. Existing users bypass the intro; unfinished setup may return to it
on relaunch. No account or additional stored onboarding flag is introduced.

## Reset app

Settings provides a confirmed, permanent reset of programs, profile, timer
progress and preferences, returning to onboarding with installation defaults.
Original PDFs and external backups remain. Interrupted resets resume before
normal startup; a failed reset offers retry without reopening partial data.
