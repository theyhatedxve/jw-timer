# App logo

Mode: Operate
Platform: Android
Asset: assets/app-icon.png
Configuration: app.config.ts

The owner supplied a teal rounded-square logo with an open meeting
workbook and stopwatch above a JW Meeting Timer wordmark. The launcher
and in-app mark use the symbol without the wordmark or surrounding canvas.

Built-in Imagegen prepared the transparent square icon asset. Final
prompt: preserve the supplied teal tile, white checklist workbook and
stopwatch; remove only the surrounding canvas and wordmark; center the
rounded tile with a small transparent margin; no new text or symbols.

The shipped master is normalized to 1024x1024 PNG with Expo image-utils.
App config uses this path for future native generation. Current local
Android launcher and round-launcher PNGs use mdpi through xxxhdpi sizes:
48, 72, 96, 144 and 192 px. The original generated Android WEBP resources
were replaced with PNGs using the same resource names. Android resources
remain generated/ignored by Git, per the existing project policy.

OnboardingMark displays the same bundled image on welcome and ready
screens, replacing the assembled book/timer icon. General UI controls
continue to use Lucide.

Asset generation is not an app build or runtime test. Owner checks remain:
typecheck, native rebuild/install, launcher/app drawer icon, onboarding
welcome/ready, both themes and offline launch. Metro reload alone cannot
replace an installed Android launcher resource.
