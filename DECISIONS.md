# Decisions

## Assumptions

- The patient is signed in and their practice id arrives with the session. That session is faked in
  `src/providers/session.ts` — one patient plus the selected fixture practice — and is the only thing
  developer settings really switch.
- The practice inbox can derive a preview from the first line of the message, so the patient is never
  asked for a subject.
- The brief's sample data is English, so the app is English. Internationalisation is out of scope.
- Reviewers run this in Expo Go from a clean clone, with no development build and no local server.

## The four decisions that matter most

**Three steps plus a confirmation.** Recipient, the practice's questions, then the message with its
optional photo and Send. The question step disappears for a practice that configured none, and the
counter says "of 2" rather than lying; a "To: ... · Change" row on step 3 replaces a separate review
screen. Rejected: a wizard with one question per screen, which turns a three-question practice into
an eight-screen flow; and one long form, which at the largest text size becomes a very long page
where the keyboard fights the photo block and errors sit far above the fold.

**The app owns the contract.** `Question.type` became a discriminated union (`choice` with at least
two options, or `text`) with an unknown type coerced to `text`. `CareTeamMember` gained a `role`,
unknown roles coerced to `other`, because a patient cannot choose between two names without knowing
who the GP is. `subject` was removed. The create call carries an `Idempotency-Key`, generated once
per draft and reused on every retry of the same payload, since creating an e-consult is not
idempotent; editing the message, an answer or the recipient after a failed send starts a new key,
because a retry whose body no longer matches the key is answered by a real backend with the original
e-consult or rejected outright. The trade is the rare double create when a create that timed out had
in fact succeeded. Attachments are `POST /econsults/{id}/attachments` with one file part named
`photo`. The attachment note carries a runtime fact: on SDK 57 Expo's own `fetch` is the global one
and rejects React Native's classic `{ uri, name, type }` form-data part, so a real client uploads
through expo-file-system's `File.createUploadTask`, which streams from disk. For the same reason
`withTimeout` (`src/api/transport.ts`) decides on its own aborted signal in the catch rather than on
the error's class: an abort surfaces as a `FetchError` or an `AbortError` depending on timing, and
neither shape is worth depending on.

**An in-process fake behind a `Transport` interface.** Three methods, each taking an `AbortSignal`,
with one shipped implementation: configurable latency, a per-request fault map and real abort
support, so the timeout path is exercised in tests rather than simulated. Rejected: msw, which has
two open, unanswered React Native breakages and would fight SDK 57's replacement of the global fetch;
and a local HTTP server, which needs a second terminal and three base URLs for simulator, emulator
and phone, breaking "clean clone plus `npx expo start`".

**The photo is downscaled at pick time.** The picker runs at `quality: 1`, then
expo-image-manipulator bounds the long edge to 1600 px and re-encodes as JPEG at 0.7, so a
12-megapixel capture becomes a sub-megabyte upload. Rejected: sending the original, which is hostile
on a weak connection, and a client-side byte cap, which rejects the patient's photo instead of fixing
it. If processing fails the original is kept, so no photo is lost to our own optimisation.

### Two behaviours worth defending

- **Offline-first reads, fail-fast send.** Reads use `networkMode: 'offlineFirst'` with one retry, so
  the first attempt always runs and only the retry waits for the link. The send mutation uses
  `networkMode: 'always'` and never auto-retries, so a send can never sit paused behind a spinner
  that lies; our own timeouts (15 s for reads and create, 45 s for the upload) are the authority.
- **A partial failure is an outcome, not an error.** Sending is two calls, and a failed upload
  resolves as the status `failed` (`uploadOrFail` in `src/features/econsult/submit.ts`) instead of
  throwing. The patient reaches the confirmation with "your message was sent, but the photo could not
  be attached" and a retry keyed to the existing e-consult id, so retrying is safe and the message is
  never created twice.

### Two behaviours the simulator changed

Both were found by running the app at the largest accessibility text size, with green unit tests.

- **Scrolling to an invalid field measures against the scroll view's content element.** Under the New
  Architecture `measureLayout` returns early unless its reference is an element, so the numeric node
  handle from `getInnerViewNode()` did nothing at all: an invalid Continue looked like a no-op with
  the error rendered above the viewport.
- **An error renders directly under its label.** `ChoiceGroup` first placed it after the radio
  options, which alone exceed the viewport at the largest text size, so a scrolled-to label never
  showed its error. The text field keeps its error under the short input and exposes a container ref
  as the scroll anchor, so the label scrolls into view while screen-reader focus lands on the input.

## Source layout

**Grouped by ownership first, by kind second.** `src/features/<feature>` holds everything one
feature owns: its reducer, hooks, providers, helpers, copy and feature-only components, whether
those files are hooks or plain functions. Only code with no owner but "everyone" is grouped by kind:
`src/components` for shared primitives, `src/lib` for helpers with no app knowledge (announcements,
development warnings, ids), `src/theme` for tokens, `src/api` for the contract and transport layer,
`src/providers` for the one provider stack. Routes under `src/app` stay thin: copy, single-use
presentational pieces and the screen itself; orchestration hooks live with the feature. Types sit
with the code that owns them, inferred from the zod contracts where a wire type is involved; there
is no `types/`, `constants/`, `utils/` or `hooks/` bucket and no barrel files.

Rejected: the common type-based layout (`components/`, `hooks/`, `context/`, `services/`, `store/`,
`types/`, `utils/`). It answers "where do files of this kind go" and fails the two questions asked
far more often. Deleting a feature means hunting through six folders instead of removing one;
reading a feature means opening six folders instead of one, and a `hooks/` folder with fifteen hooks
from five features says nothing about which belong to what. Each bucket also drifts into a dumping
ground, which is where the "everything is all over the place" feeling comes from.

What was traded away: newcomers who expect the type-based layout have to learn the ownership rule,
and the test for `src/lib` (would this file still make sense in a different app?) needs judgement.
Kind subfolders return inside a feature once it grows; the e-consult feature has `components/` for
that reason and gets a `hooks/` folder only when the hooks outnumber four or five. Route groups
(`(auth)`, `(tabs)`) are the right tool once such groups exist; the `econsult/` segment is a real
path, so it stays a plain folder.

## What was traded away

- No draft persistence across restarts: the draft is created when the flow opens and dies with it.
- No upload progress. The fake has no bytes to report, and real progress needs the upload task above.
- No recovery of an Android camera capture after the system kills the activity.
- One photo at a time. While a photo prepares, the two pick actions are replaced by the preparing
  state, and Remove is the way to start over.
- No HTTP transport is shipped; the real one is described above rather than half-built.
- The developer panel sets one latency for all four requests instead of a value per request.
- Its Force offline row meets the 48-point rule through the row, which carries the switch role and
  label, rather than through the native switch, which is smaller and cannot grow.

## What was deliberately left out

In the brief's own terms: authentication, a real backend, push notifications, offline queueing, draft
persistence, upload progress, Android capture recovery, a design system or component library,
internationalisation, app store builds, the GP-side interface, the reply and inbox flow, dark
appearance, multiple photos or video, photo editing and cropping, a client-side byte cap, analytics
and web support.

Nothing planned was cut. The delivery order made the developer settings screen the first candidate,
with the env seeds as its fallback, and the dependency and asset cleanup the second; both shipped.
The absence worth confirming in the code is the transport: `src/` contains no `fetch(` call and no
`createUploadTask`, and expo-file-system is not a dependency, so the fake really is the only
implementation.

## Platform

Run and verified by hand on the iOS simulator in Expo Go, at the default and the largest accessibility
text size. The camera path can only be verified on a real device, because the action is offered only
when `expo-device` reports one. Not run on Android; what to check there: the system back gesture on
the confirmation screen, TalkBack with the live regions used for errors and the offline banner, the
emulator's virtual-scene camera, and edge-to-edge insets.

## With another two weeks

Draft persistence with a resume prompt; the real transport with byte-accurate upload progress; Dutch
copy, checked for VoiceOver pronunciation and tested with TalkBack on an emulator; an inbox so the
practice's reply closes the loop; and Detox-style end-to-end coverage of the flow on both platforms.
