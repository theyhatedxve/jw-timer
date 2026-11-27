# Reference-based onboarding

Mode: Operate
Platform: Android
Target: src/frontend/screens/OnboardingScreen.tsx
Visual authority: owner's four-panel onboarding reference, 2026-11-27.

## Composition

- Dark teal welcome with book/stopwatch mark, centered title, three feature
  rows, three-dot progress, and a white Get started button.
- Two light feature pages: program/phone and fullscreen timer previews,
  centered heading and copy, progress dots, paired Skip and Next buttons.
- Final You're Ready page with Set up now and Do it later. Mint meeting
  hall artwork sits below in portrait and beside the copy in landscape.
- Match light reference surfaces; retain readable dark-mode equivalents.
  Welcome stays teal in both themes.
- Reuse outlined AppIcon geometry and render miniature app previews as
  static native UI. Decorative previews never create a saved timer/program.
- Building raster: src/frontend/assets/onboarding/meeting-hall.png.
  Generated with built-in Imagegen using the reference's pale mint style:
  one single-storey meeting hall, glass entrance, shrubs, transparent
  background, no text or symbols. No runtime generation or network request.

## Behavior

Get started advances to program overview, then timer overview, then ready.
Skip jumps to ready. Back, including Android Back, returns one page.
Set up now opens the existing validated congregation form.

Owner explicitly approved optional setup. Do it later saves only an
onboarding_complete preference and opens Main. The choice survives relaunch.
Storage failure keeps the user on ready with a retry message. Preference
read errors block unconfigured startup with Retry, not a false first install.
Saved profiles still bypass onboarding. Home and Meetings show a clear
setup prompt while no profile exists. Setup remains available in Settings.
Creating the first profile after deferral replaces the navigation group
and returns Home. Reset app clears the completion preference too.

## Accessibility and verification

48 dp minimum controls, labelled Back/Next/Skip actions, spoken progress,
font scaling, scrolling on short screens, safe areas, and landscape layouts.
Decorative previews are excluded from the accessibility tree.
Owner runs automated checks and Android visual/navigation verification.
Source inspection is not proof of rendered fidelity.
