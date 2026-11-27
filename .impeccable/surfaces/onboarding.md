# First-use onboarding

Mode: Operate
Platform: Android
Target: src/frontend/screens/OnboardingScreen.tsx

## Confirmed flow

The owner chose a short, skippable three-step introduction before the
existing congregation setup. Explain program import, deliberate timer
control, and local profile/offline operation using the established Quiet
Focus design. No automatic timer, demo program, account, or network request.

## Completion and navigation

Only users without a saved profile enter this setup group. Next/Back move
between steps; Skip intro and the final action open SetupProfile. Android
Back moves to the previous intro step, or follows normal platform behavior
on the first step. Saving the profile replaces the setup navigation group.
Existing users bypass onboarding. Incomplete setup may show the intro
again on relaunch. Profile errors retain the existing recovery boundary.

## Acceptance

Three concise steps, visible Skip intro, labelled Back/Next/setup actions,
accessible progress, font scaling, light/dark support, and portrait/landscape
scrolling. No new persistence flag, database migration, or dependency.
Owner typecheck and first-install/returning-user device checks pending.
