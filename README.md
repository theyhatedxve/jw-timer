# JW Timer

JW Timer is an Android app for running Midweek and Weekend meeting timers. Import a program, adjust its parts, and use a digital or analog countdown during the meeting.

The app stores its data locally. Timing, saved programs, and supported local PDF imports work offline. Online imports retrieve public meeting pages from WOL.

## Features

- Home dashboard with quick access to Meetings and Timer.
- Midweek and Weekend programs with calendar-based week selection.
- Current-week online import from the Watchtower Online Library.
- Local Meeting Workbook and Watchtower PDF imports.
- Program editing, including adding, changing, and deleting timer parts.
- Start, pause, resume, restart, part selection, overtime, and estimated finish time.
- Fullscreen Digital, Digital + Analog, and Analog displays.
- Custom fullscreen colors, digit sizes, current-part title, and progress visibility.
- Congregation name, content language, and time-zone settings.
- Light, Dark, and System appearance.
- Password-protected local backups, restore, and app reset.

## Install

Download a published APK from GitHub Releases. Open it on your Android phone and allow installation from that source when Android prompts you.

For an update, install the newer APK over the existing app. Project builds must keep the same Android package and release signing key to preserve update compatibility.

[Download releases](https://github.com/theyhatedxve/jw-timer/releases)

## First use

1. Follow onboarding. Choose **Set up now**, or complete setup later from Settings.
2. Enter the congregation name and time zone. Use `Asia/Manila` for the Philippines.
3. Choose English or Waray-Waray for supported meeting-content imports. The interface currently uses English.
4. Open **Meetings** and choose Midweek or Weekend.

Profile setup supplies the time zone and content language used by meeting imports.

## Import and edit a program

### Online

Use **WOL** in Meetings to import the current meeting week for the configured time zone and language. The app reads the website and creates the timers automatically. Browsing another week still lets you open its saved programs.

### Local PDF

Use **PDF** in Meetings, or **Import meeting PDF** in Settings, and select a supported Meeting Workbook or Watchtower PDF. Recognized programs are saved automatically. Existing matching programs are skipped.

Weekend programs include song parts, a 30-minute public talk, and a 60-minute Watchtower study.

### Edit

Open a saved program's actions in Meetings to edit its parts, add a timer, or delete a program. Import source choices identify PDF and WOL programs.

## Run a meeting

1. Open the program in Timer.
2. Tap **Start** for the selected part.
3. Use **Pause/Resume** or **Restart part** as needed.
4. Pause before using the program picker to select a different part. Each part retains its elapsed time.
5. At zero, timing continues into overtime until you advance or finish the program.

The timer keeps running when you switch app tabs. Leaving the app pauses it. Saved checkpoints let you recover the previous session after reopening. Abrupt interruptions can recover from the most recent checkpoint.

The agenda shows all parts and an estimated finish time. **Reset all timers** reloads saved meeting defaults and clears session progress.

## Fullscreen display

Open **Settings > Fullscreen display** to choose a display style and save it.

- **Digital** shows the numeric countdown.
- **Digital + Analog** stacks Digital above Analog in portrait and places them side by side in landscape.
- **Analog only** shows the countdown dial.

The thick hand shows minutes and the thin hand shows seconds. Longer parts include an hour count. The colored sector represents the remaining portion of the current part.

Digit size and analog remaining-time color have separate settings. The dial has a transparent background. Overtime uses the configured overtime color.

Landscape fullscreen includes an overtime Next action and a Close button beside the status badge. The regular Timer screen returns to portrait after leaving fullscreen.

## Backup and reset

Use **Settings > Backups and restore** to export a password-protected backup or restore saved meeting data. Backup passwords must contain 12 to 128 characters. Keep the backup file and password somewhere safe.

Restore asks for confirmation before replacing local data. **Reset app** erases local app data and returns to onboarding. Original PDFs and backups saved outside the app remain in their chosen locations.

## Development

The project uses TypeScript, React Native, Expo native modules, React Navigation, SQLite, NativeWind, and Lucide React Native.

Install dependencies and run checks from the project root.

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd test
```

The default test command selects the core suites. Run the complete test-file set when preparing a release.

```powershell
npx.cmd --no-install tsx --test tests/*.test.ts
```

Local Android development requires the Android SDK, a compatible Java installation, and an emulator or connected device.

```powershell
npm.cmd run android
```

Build a release APK from the generated Android project after configuring the permanent signing key and supplying its password.

```powershell
cd android
.\gradlew.bat assembleRelease
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`.

Keep keystores and credentials outside version control. Each update needs a higher Android version code and consistent version values in `app.config.ts` and the generated `android/app/build.gradle`.

Project architecture and working instructions are in `docs/`. The app is under active development. Release notes identify tested changes and known issues for each published APK.
