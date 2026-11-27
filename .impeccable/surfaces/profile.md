# Congregation profile

Mode: Operate
Platform: Android
Target: src/frontend/components/profile/ProfileForm.tsx
Authority: owner-supplied Congregation profile reference, 2026-11-27.

## Design

Custom Back/title header with a decorative settings badge. A split hero
pairs the profile title and local-storage copy with the existing pale mint
meeting-hall image and waves. Stack the artwork below copy on narrow
screens or large font scales. Rounded bordered sections group congregation
details and language. Icon-led fields, a timezone dropdown, full-width
radio choices with a checkmark, and a teal Review profile action follow
the reference. The review step uses matching read-only summary sections.
Dark appearance retains the same hierarchy with existing palette tokens.

## Behavior

Both SetupProfile and EditProfile share this view. Draft defaults,
name/IANA timezone validation, Waray-Waray and English, review-before-save,
revision-aware saving and unsaved-change protection retain their owners.

Timezone selection opens a searchable, keyboard-aware modal. Use native
Intl timezone enumeration where available, with common-zone fallback and
custom IANA entry. Choosing updates only the draft. Custom values are
validated with the rest of the profile on Review. Closing without choosing
preserves the draft. No dependency, network request or schema change.

Back on review returns to editing. Back on edit uses the existing guarded
navigation. First-use fallback returns to onboarding when no previous
route exists; edit fallback retains the existing Main/Settings destination.
The existing profile-save navigation handles both first-use and deferred setup.

## Verification

Owner runs typecheck and Android/device checks. Pending: profile creation
from onboarding and after Do it later, editing an existing profile, timezone
search/custom/invalid values, review/save/keep editing, discard protection,
TalkBack, both themes, large text, keyboard and landscape. Static diff
checks alone do not prove rendered fidelity or runtime behavior.
