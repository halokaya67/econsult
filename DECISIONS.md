# Decisions

The four decisions that shape the app; every decision, four lines each, is in `docs/decisions-log.md`.

## Assumptions

- The patient is signed in and the practice id comes with the session (faked in `src/hooks/useSession.ts`).
- The brief's sample data is English, so the app is English.

## The four decisions that matter most

**Offline-first reads, fail-fast send.** A send must never sit paused behind a spinner, and a timed-out create may have succeeded.
Decided: the send never auto-retries; one idempotency key per payload, reused on retries and replaced on edit; a failed upload is its own retryable state against the same e-consult.
Alternatives: the library's online mode (a false offline reading pauses the send forever); no key (every retry can duplicate); a failed upload as a failed send (a second create).
Traded off: the confirmation explains a half-success.

**The cache is what the patient sees.** A blip must not hide a list the patient saw a second ago.
Decided: a five-minute stale time; a failed refresh keeps cached data, with the error card only when nothing is cached; reads time out, never cancel, so a walked-away read still warms the cache.
Alternatives: error over stale data (hides the whole flow on every blip); aborting a read on unmount (throws away paid-for work).
Traded off: stale data for up to five minutes.

**Accessibility by structure, not announcements.** Two channels for one sentence means hearing it twice.
Decided: an error is folded into its field's accessible name and focus moves there, spoken once; every message has one channel, a focus move or one announcement, never a live region.
Alternatives: a separate error announcement (spoken twice with the focus move); a live region (Android only, silent for VoiceOver).
Traded off: a longer spoken label; no backup for a one-off announcement.

**The draft lives and dies in memory.** A photo of a rash must not outlive the message on the device.
Decided: no persistence; Cancel in every step's header unwinds to Home, guarded once a recipient is chosen; every file the draft named is deleted when the flow ends.
Alternatives: saving the draft with a resume prompt (no acceptance criterion asks for it); deleting the photo after upload (breaks Try again on the confirmation).
Traded off: any exit loses the text; a crash leaves its files behind.

## What was traded away

- A question changed in the last five minutes is asked in its old form.
- A patient may write to a member who left since the last load.
- Any exit loses the draft; an Android camera eviction loses it too.
- Header buttons and the step chip cap their text, as the native bar cannot grow.
- Screens are not guarded against cold links.
- No landscape layout; light appearance only.

## Platform

Verified by hand, with the evidence under `specs/001-econsult-flow/artifacts/ui-verification/`:

- iOS simulators (iPhone and iPad) at the default and the largest text size, with a clean
  Accessibility Inspector audit on every screen.
- An Android 16 emulator with TalkBack, its speech captured word for word.
- A real Samsung tablet: camera capture, the header labels under TalkBack, the read faults and the
  loading skeleton.
- A real iPad: VoiceOver with the caption panel, the nine accessibility options, camera capture.

## With another two weeks

- Draft persistence with a resume prompt, which also recovers an Android camera capture.
- A review step with Edit and Send before the confirmation.
- Deep links from the practice's messages and notifications.
- Landscape layouts, and a dark appearance.
- A warning when the list on screen is a cached one whose refresh failed.
- An exit confirmation on the back gesture from Home.
- The real transport, with upload progress.
- Dutch copy, tested with TalkBack.
- An inbox, so the practice's reply closes the loop.
- End-to-end tests on both platforms.
