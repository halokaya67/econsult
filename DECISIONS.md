# Decisions

Each entry: what the question was, what was decided, and what that trades away.

## Assumptions

- The patient is signed in and the practice id comes with the session. The session is faked in
  `src/hooks/useSession.ts`.
- The practice can preview a message from its first line, so there is no subject field.
- The brief's sample data is English, so the app is English.
- Reviewers run it in Expo Go from a clean clone, with no development build and no local server.

## Product

**How many screens.** A three-question practice should not become an eight-screen wizard, and one
long form breaks at the largest text size.
Decided: three steps (recipient, questions, message with photo) plus a confirmation; the question
step disappears when the practice has none.
Traded off: no separate review screen; a "To: ... Change" row on the last step stands in for it.

**No subject field.** The brief's data has one, but a patient writing to their GP should not have to
title the message.
Decided: the practice derives a preview from the first line.
Traded off: an inbox that needs a real subject has to add it on its side.

**One photo.** The brief asks for a photo, not a gallery.
Decided: one photo at a time; Remove is how you start over.
Traded off: multiple photos, video, editing and cropping.

## Contract

**The app owns the contract.** The brief gives sample data, not an API, so the shape had to be chosen.
Decided: questions are a union of choice and text; care-team members carry a role so the patient
knows who the GP is; unknown values fall back to safe defaults instead of failing.
Traded off: a real backend must match these shapes or the mapping layer grows.

**Sending is never duplicated.** Creating an e-consult is not idempotent and a timed-out create may
have succeeded.
Decided: one idempotency key per draft, reused on every retry of the same payload; editing the
message, an answer or the recipient after a failed send starts a new key.
Traded off: the rare double create when a create that timed out had in fact succeeded and the
patient then edited the message.

**Sending is two calls.** Create the e-consult, then upload the photo.
Decided: a failed upload is a partial outcome, not an error; the patient sees "sent, but the photo
could not be attached" and can retry the photo against the existing e-consult.
Traded off: the confirmation screen has to explain a half-success.

**How the real upload would work.** On SDK 57 Expo's own `fetch` rejects React Native's classic
form-data file part.
Decided: the real client uploads through expo-file-system's upload task; the timeout helper decides
on its own abort signal rather than on the error's class.
Traded off: no HTTP transport ships; only the description does.

## Networking

**Reads are offline-first, the send fails fast.** A send must never sit paused behind a spinner.
Decided: reads run once and retry once when the link is back; the send runs in "always" mode with no
automatic retry, and the app's own timeouts (15 s create, 45 s upload) are the authority.
Traded off: an offline send fails immediately instead of waiting for the connection.

**An in-process fake behind a transport interface.** The app must run from a clean clone with no
server.
Decided: one interface with abort support and one fake with configurable latency, per-request faults
and real aborts, so the timeout path is tested rather than simulated.
Traded off: msw (open React Native breakages, fights the SDK 57 fetch) and a local server (a second
terminal and three base URLs).

## Photo

**Downscale at pick time.** A 12-megapixel capture is hostile on a weak connection.
Decided: pick at full quality, bound the long edge to 1600 px, re-encode as JPEG at 0.7, keep the
original if processing fails.
Traded off: a client-side byte cap, which would reject the patient's photo instead of fixing it.

## Accessibility

**Errors live in the field's name.** Neither VoiceOver nor TalkBack supports a separate error link
on inputs.
Decided: the error is folded into the field's accessible name and announced once; focus moves to the
first invalid field and the screen scrolls it and its error into view.
Traded off: the error text is spoken as part of the label, which is longer.

**Errors render under their label.** At the largest text size the radio options alone exceed the
viewport.
Decided: the error sits directly under the label, so a scrolled-to field always shows it.
Traded off: the error is above the options instead of where a sighted user might expect it.

## Source layout

**Grouped by owner, not by kind.** The common layout with global `hooks/`, `utils/`, `types/`
folders scatters one feature across six places.
Decided: the first layer groups by responsibility and the second by kind — inside a feature every
file sits in `api`, `state`, `hooks`, `components` or `utils`, never loose at its root; app-wide
context lives in `src/providers`; shared hooks in `src/hooks`, while a context's accessor hook stays
with whatever mounts the context; shared components go in `src/components` and shared logic with no
single owner in `src/lib`, where a generic building block with no domain vocabulary stays even while
one feature uses it; routes under `src/app` stay thin; types sit with the code that owns them; no
barrel files.
Traded off: newcomers expecting the type-based layout have to learn the ownership rule, and screen
tests live under `src/__tests__/app` because expo-router treats every file under `src/app` as a route.

**No types folder.** A type kept apart from the code that gives it meaning drifts.
Decided: wire types are inferred from the zod schemas in the contracts module, so validation and
type are one definition; every other type sits with its owner (the reducer, the settings module, the
component), and a shared type would get a `types.ts` inside the feature that owns it.
Traded off: no single place to browse all types; a reader follows the import instead.

## Left out

Authentication, a real backend, push notifications, offline queueing, draft persistence, upload
progress, Android capture recovery, a component library, internationalisation, store builds, the
GP side, the inbox and reply flow, dark appearance, analytics and web. Nothing planned was cut.

## Platform

Verified by hand on the iOS simulator in Expo Go, at the default and the largest text size, with the
Accessibility Inspector audit clean on every screen. Not run on Android. The camera path needs a
real device.

## With another two weeks

Draft persistence with a resume prompt, the real transport with upload progress, Dutch copy tested
with TalkBack, an inbox so the practice's reply closes the loop, and end-to-end tests on both
platforms.
