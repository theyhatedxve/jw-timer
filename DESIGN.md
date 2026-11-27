# Quiet Focus design system

The owner-supplied Quiet Focus references are the visual authority for the
current screen redesigns. This records the established app identity; it
does not authorize unrelated changes.

## Visual language

Soft app surfaces, teal actions, mint accents, muted secondary text,
generous grouping, and simple outlined SVG icons. Native platform sans
and tabular countdown digits suit the operating interface. Home's meeting
card and the Timer card use dark ink surfaces.

## Fullscreen display

- The supplied portrait and landscape references govern this surface.
- Use a plain dark stage, huge centered countdown, meeting/part identity,
  a text status badge, allotted time, and optional elapsed progress.
- Portrait: exit/status at the top, centered content, two control buttons,
  followed by a full-width View program action.
- Landscape: meeting/part at top-left, status at top-right, centered digits,
  and Resume/Pause, Restart part, Program, and Exit on the bottom row.
- Keep the normal Timer screen unchanged by fullscreen layout work.
- Use existing handlers and saved preferences. No automatic start or advance.
- Dark defaults are independent of app light/dark appearance. Explicit
  background, digit, and overtime customizations retain precedence.
- Tokens live in src/constants/timerTheme.ts; avoid decorative effects
  that compete with countdown legibility.

## Responsive and accessible behavior

Use the measured digit region and font scale to fit numerals without
clipping. Support long part titles and scrolling on short displays.
Controls retain 48 dp minimum touch targets. Program selection stays
unavailable while timing is running. Android Back always exits fullscreen.
Status text and overtime prefixes supplement color.

## Verification

The owner runs tests, builds, emulator/device interaction, and screenshot
verification under docs/Specific-Chat-Step-Instructions-Only.md.
Source checks are not proof of visual fidelity or Android runtime behavior.

## Onboarding reference

The owner's 2026-11-27 onboarding image governs this surface: teal welcome
with a book/stopwatch mark and feature rows; two centered feature pages
with large native UI previews; and a ready page with mint building artwork.
Use src/constants/onboardingTheme.ts for reference colors. Light feature
pages use a near-white surface; dark mode preserves readable equivalents.
Welcome stays dark teal. Three progress dots represent the intro pages;
the final setup choice is separate. Landscape places artwork beside copy.

## Congregation profile reference

The owner's 2026-11-27 profile reference uses an illustrated mint header,
rounded bordered field groups, icon-led inputs, full-width language radio
choices and a teal primary action. Reuse the existing meeting-hall asset.
Keep review summaries in the same visual system. Current appearance tokens
govern both themes; narrow screens and large text stack the header artwork.
