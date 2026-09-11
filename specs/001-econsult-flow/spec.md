# Spec: E-consult submission in the app

Feature `001-econsult-flow` · branch `feat/econsult-flow` · written 2026-09-11, revised after checker rounds 1 to 5 and the platform research critique

How it works today: how-it-works.md (rendered copy: `artifacts/how-it-works.html`). Platform facts behind the choices below: research.md (rendered copy: `artifacts/research.html`).

## Problem & Goals

Patients drop out of the current e-consult because it asks too much, while GPs receive messages too thin to act on. The ticket asks for a flow that feels light and quick for the patient yet arrives at the practice with enough to work with. Practices differ: each decides who patients may write to and whether patients answer a set of questions first, and that comes from the practice's configuration.

Goals, in priority order:

1. One complete path a patient can finish in under two minutes: choose a recipient, answer the practice's questions, write the message, optionally add a photo, see a clear confirmation.
2. Every real state, not just the happy one: loading, empty, error, sending, offline, and the partial failure where the message is sent but the photo is not.
3. Usable by the actual audience: screen readers, the largest text sizes, unsteady hands, poor connections, older phones.
4. Code a reviewer could work in: small units with one purpose each, typed contracts, tests that read like acceptance criteria.

The deliverable is a repository that runs from a clean clone with `npx expo start` in Expo Go on the iOS simulator, plus DECISIONS.md and AI-USAGE.md. The screen recording is made by hand after the flow finishes. DECISIONS.md states that the app was run on the iOS simulator and lists what to check on Android: the back gesture on the confirmation screen, TalkBack live regions, the virtual-scene camera, and edge-to-edge insets.

## Users & Scenarios

- **Ria, 74, iPhone, text size at the largest accessibility setting, VoiceOver on some days.** She has had a painful knee for two weeks. She wants to reach her own GP without phoning. She must be able to hear every label, every error, and the confirmation.
- **Ahmed, 45, older Android phone on a weak mobile connection.** He has a rash and wants to send a photo. The config takes seconds to arrive; the upload may fail. He must never lose his message because the photo failed.
- **A practice with no questions configured (prc-0873).** The flow must feel just as complete with the question step absent, and the step counter must not lie.
- **The reviewer.** Clones the repo, runs it, switches practice and injects failures without editing code, and reads the decision record.

## Chosen Approach

Three approaches were weighed for the flow shape.

**A. One screen per question (wizard).** Recipient, then each practice question on its own screen, then message, then photo, then review, then sent. Each screen is minimal, but a practice with three questions becomes an eight-screen flow. Patients lose their place, progress is hard to convey, and the review screen repeats what they just typed. Rejected: it optimises the wrong thing.

**B. Three steps plus a confirmation (chosen).** Step 1 "Who are you writing to?" lists the practice's care team. Step 2 "A few questions from your practice" shows all configured questions on one scrollable screen and is skipped entirely when the practice configured none. Step 3 "Your message" holds the free-text field, the optional photo block and the Send button; a "To: Dr. X · Change" row at the top replaces a separate review screen. The confirmation screen states what was sent, to whom, and what happens next. The step counter reads "Step 1 of 3" or "Step 1 of 2" depending on the practice.

**C. One long form.** Everything on one scrollable screen. Fewest screens, but at large text sizes it becomes a very long page, the keyboard fights the photo block, and errors far above the fold go unnoticed. It also reads as a web page in a shell, which the brief explicitly does not want. Rejected.

Supporting choices, each weighed against alternatives in the research record:

- **Navigation and draft state.** expo-router native stack. A nested `src/app/econsult/_layout.tsx` mounts a `DraftProvider` (a pure `useReducer` plus context) around its own `Stack`, so the draft lives exactly as long as the flow and dies with it. The root stack hides its own header for the `econsult` group, so the nested stack owns titles and back buttons. Alternatives considered: route params (would serialise the answer map and break typed routes), a module-level store such as zustand (would need a manual reset and outlives the flow), react-hook-form (built for large uncontrolled forms; three to five practice-configured fields do not justify it). The draft is rebuilt from scratch on every entry; persistence across app restarts is out of scope.
- **Data fetching.** TanStack Query v5. The recipient step runs `useQueries` with `combine` over the practice config and the care team, so two parallel requests render as one loading, one error and one empty state. Sending is one `useMutation` whose function creates the e-consult and then uploads the photo. Reads use `networkMode: 'offlineFirst'` with `retry: 1, retryDelay: 1000`: the first attempt always runs (the fake transport is in-process; a real request fails fast) and only the retry pauses until the device is back online. The send mutation uses `networkMode: 'always'` and never retries automatically, so a send can never sit paused with a spinner that lies; our own timeout is the authority. Alternative: hand-rolled `useEffect` fetching would need its own state machine, cancellation and dedupe per screen and still leave offline handling to us.
- **Contracts.** zod schemas at the network boundary with TypeScript types inferred from them, one source of truth. A malformed payload maps onto the same error state as a failed request instead of crashing the screen.
- **Fake backend.** A `Transport` interface (`getJson`, `postJson`, `uploadPhoto`, each taking an `AbortSignal`) with one shipped implementation: an in-process fake with configurable latency, a per-request fault map and abort support, three typed services on top of it, fixtures imported statically. The fake honours `AbortSignal` by rejecting with an `AbortError`, so the timeout path is exercised for real in tests. No HTTP implementation is shipped; DECISIONS.md names the real one (Expo's `fetch` for JSON, expo-file-system's upload task for the photo, see The Contract) so the seam is explicit. Alternatives: msw has two open, unanswered React Native breakages (empty bodies since 2.14, interception failing in Expo runtimes) and SDK 57 swaps the global fetch for its own native-backed implementation; a local HTTP server needs a second terminal and three different base URLs for simulator, emulator and phone, which breaks "clean clone plus `npx expo start`".
- **Practice switching and failure injection.** A committed `.env` seeds the fake through `EXPO_PUBLIC_PRACTICE_ID` (default practice), `EXPO_PUBLIC_LATENCY_MS` and `EXPO_PUBLIC_FAULTS` (comma-separated `request:kind` pairs, for example `config:timeout`). A development-only settings screen switches between the three fixture practices at runtime, sets latency, forces any of the four requests to fail (network, server or timeout) and forces offline. Applying the settings clears the query cache and returns home, so the next entry into the flow fetches fresh. Env values are inlined at build time, so they are seeds, never the live toggle.
- **Photo.** expo-image-picker for both camera and library, included in Expo Go, so no development build is needed. The picker runs at `quality: 1`; expo-image-manipulator then bounds the long edge to at most 1600 px and re-encodes as JPEG at 0.7, releasing its native handles, so a 12-megapixel capture becomes a sub-megabyte upload on a poor connection instead of a multi-megabyte one. A brief "Preparing photo" state covers the processing; if processing fails the original asset is kept and a development warning is logged. The result is previewed with expo-image and can be removed. The camera action is offered only when `Device.isDevice` from expo-device (already installed) is true; on a simulator a one-line note takes its place, and the library path works everywhere.
- **Keyboard and safe areas.** Core React Native only: one `ScrollView` per step with the primary button as the last child inside the scroll content, `keyboardShouldPersistTaps="handled"`, `automaticallyAdjustKeyboardInsets` on iOS, and bottom insets from `useSafeAreaInsets`. expo-router already mounts the safe-area provider and the header consumes the top inset. react-native-keyboard-controller was considered and rejected: the Expo docs contradict themselves on its Expo Go status, and the baseline needs no native module.
- **Offline.** expo-network's `useNetworkState`, fail-open: only an explicit `isConnected === false` counts as offline, unknown counts as online. A banner inside the screen scaffold below the header, the Send button disabled with a spoken reason while the link is reported down, and TanStack Query's online manager wired to the same source so the UI and the cache agree. The banner is advisory; the request itself is the real check. No queueing.
- **Copy and appearance.** English, matching the brief's sample data; internationalisation is out of scope. Light appearance only (`userInterfaceStyle: "light"`), system font so Dynamic Type and Android font scaling work without configuration. No design system: a small token file for colour, spacing, type scale and the 48-point minimum touch target.

## The Contract (owned by the app)

The brief's draft types are changed as follows. All schemas live in `src/api/contracts.ts`.

| Type | Change | Why |
|---|---|---|
| `Question.type: string` | Discriminated union: `{ type: 'choice', options: string[] (at least 2) }` or `{ type: 'text' }`. An unknown `type` from the backend is coerced to `text`. | A bare string cannot drive rendering safely; coercing unknown types keeps the patient moving instead of blocking on a config the practice got wrong. |
| `CareTeamMember` | Adds `role: 'gp' \| 'nurse' \| 'assistant' \| 'other'`; unknown roles are coerced to `other`. | A patient cannot choose between two names without knowing who the GP is and who the nurse is. |
| `CreateEConsultRequest.subject` | Removed. | No acceptance criterion asks the patient for a subject, and asking is exactly the kind of extra field that makes the flow feel heavy. Assumption: the practice inbox can derive a preview from the first line of the body. If it cannot, the client derives `subject` from the first sentence without asking the patient. |
| `CreateEConsultRequest` | Adds an `Idempotency-Key` request header, generated once per draft and reused on every retry of the create call. | Creating an e-consult is not idempotent; a retry after a timeout must not create two messages. |
| Attachments | New: `POST /econsults/{id}/attachments` takes multipart form data with one file part named `photo` and returns `{ attachmentId: string }`. Implementation note: on SDK 57 Expo's own `fetch` is the global one and rejects the classic React Native `{ uri, name, type }` form-data part, so the real client uploads through expo-file-system's `File.createUploadTask` (multipart, field `photo`, `AbortSignal`, progress), which streams from disk. Expo's `fetch` surfaces an abort as a `FetchError` or, once the body is streaming, as an `AbortError` DOMException depending on timing, so the timeout helper decides on its own aborted signal in its catch rather than on the error's class or `cause`, and a real HTTP transport would map any rejection under that signal onto the same timeout error the fake produces. This iteration ships only the fake transport; the real path is recorded in DECISIONS.md. | The brief names the endpoint but gives no shape, and the obvious client code does not work on this SDK. |
| `PracticeEConsultConfig`, `PatientSession`, `answers[]`, `CreateEConsultResponse` | Unchanged. | They already serve the interface. |

Three practices are shipped as fixtures: `prc-0421` (three recipients, one required choice question and one optional text question), `prc-0873` (two recipients, no questions) and `prc-0000` (no recipients, no questions), which exists only to exercise the empty state and is selectable from the developer settings screen like the other two. The care team fixture for `prc-0421` holds four members with roles, one of them not writable; `recipientIds` selects who is writable.

## Affected Areas & Behavior Changes

Today the app is a blank screen (see how-it-works.md). Everything below is new behaviour; there are no consumers elsewhere and no cross-repo impact.

| Area | Change |
|---|---|
| `src/app/_layout.tsx` | Wraps the stack in the query client, session and development-settings providers; sets stack defaults (minimal back button); declares `headerShown: false` for the `econsult` group so the nested stack owns the header. |
| `src/app/index.tsx` | Becomes the home screen: greets the patient by name, one primary action "Write to your practice", a development-only link to the settings screen. Prefetches the practice config and care team so the first step is usually instant; the loading state stays visible when the flow is entered inside the latency window or after raising latency in developer settings, and the recording enters the flow immediately. |
| `src/app/econsult/_layout.tsx` (new) | Draft provider and a nested stack that owns titles and back buttons for the four flow screens; step 1 sets a labelled Home button as its header-left action. The offline banner renders inside the screen scaffold below the header, so the header keeps the top inset. |
| `src/app/econsult/recipient.tsx`, `questions.tsx`, `message.tsx`, `sent.tsx` (new) | The four steps. |
| `src/app/dev-settings.tsx` (new) | Development-only panel: practice (all three fixtures), latency, per-request faults, force offline. Applying it clears the query cache and returns home. Not rendered in release builds. |
| `src/api/` (new) | Contracts, the transport interface, the fake transport, three services, fixtures. |
| `src/features/econsult/` (new) | Draft reducer and provider, validation, submission function, the two hooks that screens call. |
| `src/components/` (new) | Screen scaffold, buttons, text field, choice group, recipient card, photo picker, step header, offline banner, loading, empty and error states. |
| `src/lib/` (new) | Query client, network state hook, accessibility announcement helper, session, photo processing, `devWarn`. |
| `src/theme/` (new) | Tokens. |
| `app.json` | `userInterfaceStyle` becomes `light`; the expo-image-picker plugin is added with English usage strings and `microphonePermission: false`; the `web` block is removed. |
| `package.json` | Adds expo-image-picker, expo-image-manipulator, expo-network, expo-crypto, @tanstack/react-query and zod 4; adds the test, lint, format and type-check tooling with hand-pinned versions where Expo's install command would fetch incompatible ones (@testing-library/react-native 13.3.3 exact, jest on the 29 line, @react-native/jest-preset ^0.86.3); removes packages the app never imports (expo-font, react-native-web, react-dom, react-native-gesture-handler, react-native-reanimated, react-native-worklets) and the `web` script. expo-device stays: it is the source of `isDevice`. |
| `README.md`, `AGENTS.md`, `CLAUDE.md`, `DECISIONS.md`, `AI-USAGE.md` | Rewritten or created for the submission. |
| `assets/` | The template's fourteen unused demo images are deleted; every file `app.json` references stays, including `assets/expo.icon/`, except `favicon.png`, which goes with the removed `web` block. |

### Delivery order

The brief expects two to four hours and says a bigger submission will not score higher, so the work is ordered so that a cut still leaves something complete:

1. Tooling first, because every later task is test-driven: jest-expo, Testing Library, lint, format, type-check, and one smoke test proving Testing Library 13 renders on React 19 before anything depends on it.
2. One complete path for `prc-0421`: contracts, fake API, draft state, the four screens, sending with a create failure, tests.
3. The states that make it real: partial upload failure, offline, the `prc-0873` question skip, the `prc-0000` empty state.
4. The developer settings screen. Until it exists, the `.env` seeds switch practice, latency and faults.
5. Dependency and asset cleanup, then the three documents.

If time runs out, item 4 is cut first (the `.env` seeds remain), then the cleanup inside item 5. The three documents are never cut, and DECISIONS.md names whatever was.

## Screens

**Home.** "Hello, {displayName}." (no time-of-day branch.) One primary button. In development a small "Developer settings" link. The screen prefetches config and care team on mount.

**Step 1: Who are you writing to?** Loading: three placeholder cards with an accessible "Loading your practice's care team" label. Loaded: one card per writable care team member, name in large type with the role beneath, radio semantics, 48-point minimum height, selected state visible and spoken. Continue is disabled until a recipient is chosen and says why in its accessibility hint. Error: "We couldn't load your practice's details" with Retry, shown whenever either request has failed, even when an earlier fetch left stale data. Empty: "Your practice hasn't switched on e-consults in the app yet" with a way back home.

**Step 2: A few questions from your practice.** Skipped when the practice configured no questions. Each question shows its label with "(required)" or "(optional)" in words. Choice questions render as a group of large radio buttons; text questions render as a multiline field. Continue validates required questions; an unanswered required question gets an inline error tied to the field, the first invalid field receives screen-reader focus, and the error is announced.

**Step 3: Your message.** A "To: Dr. J. de Vries · Change" row; Change dismisses back to step 1 (`router.dismissTo`), the draft keeps answers, message and photo, and Continue re-walks step 2 (if any) and step 3 intact. A multiline field labelled "What would you like to ask?" with a hint listing what helps the GP: where, since when, what you have tried. Under twenty characters a soft, non-blocking nudge appears; only an empty message blocks sending. The photo block offers "Take a photo" and "Choose from library" (the camera action only on a real device), and, once a photo is picked, replaces both actions with the photo block's current state: "Preparing photo" beside a labelled "Remove photo" button while the image is downscaled, then the preview with the same "Remove photo" button. Remove is the only way to replace a photo; it returns the block to the two source actions. The draft records the photo as soon as the picker returns an asset, with status `preparing`, so `hasPhoto` is true before processing finishes; Send is disabled while a photo is `preparing`, with the reason in its hint; Remove during preparation discards the pending result when it arrives, and a pick started after that Remove supersedes it, so only the result whose `pickId` matches the draft's current pick is kept. Send sits inside the scroll content below the photo block. While sending, the button is busy, the fields are read-only and a live status line reads "Sending your message" and then "Message sent, adding your photo". While the link is reported down, Send is disabled with the reason in its hint.

**Sent.** A large heading "Message sent" that receives screen-reader focus, then "Sent to Dr. J. de Vries", "Your practice usually replies within two working days", and the reference number. When the photo upload failed: "Your message was sent, but the photo could not be attached" with "Try again" (re-uploads to the existing e-consult) and "Continue without the photo". Back navigation is prevented while the screen is showing (`usePreventRemove(!isLeaving)`). Done sets `isLeaving`; an effect then calls `router.dismissTo('/')` (not `dismissAll`, which only reaches step 1 of the nested stack). Leaving the group unmounts the draft provider, which is what clears the draft.

## Edge Cases

**Functional scope**

- Exactly one writable recipient: the step still shows, with one preselected card, so the flow has one shape.
- Zero writable recipients (config lists none, or none match the care team): empty state; the flow cannot continue.
- `recipientIds` naming an id absent from the care team: that id is dropped silently; a development warning is logged through `devWarn`.
- Care team members not listed in `recipientIds`: not shown.
- Zero questions: step 2 is skipped and the counter reads "of 2".
- Unknown question type: rendered as a text question.
- Choice question with fewer than two options: schema rejects it, which surfaces as the config error state.
- Required text answered with whitespace only: invalid.
- Message with whitespace only: invalid; message under twenty characters: soft nudge, not blocking.
- Photo picker cancelled: no change to the draft.
- Camera or library permission denied: an inline explanation with an "Open Settings" action; the other source stays available.
- Camera unavailable (`Device.isDevice` is false, as on the iOS simulator): the camera action is not offered, with a one-line note.
- Photo picked, removed, picked again: the last pick wins; only one photo is ever attached.
- Photo still preparing: Send is disabled with reason; the source actions are hidden; Remove discards the pending result and shows the source actions again, so a pick started after Remove supersedes the pending one. The draft holds `photo` as `{ status: 'preparing', pickId }` or `{ status: 'ready', pickId, uri, width, height }`, and a processing result is ignored unless its `pickId` matches the draft's. The preview renders at the block's fixed height and full width with `contentFit: 'cover'` and never sizes itself from `width` and `height`, so a `ready` photo carrying a 0 dimension still shows.
- Photo processing fails: the draft moves to `ready` with the picker's original `uri`, `width` and `height` (there is no failed status) and a development warning is logged.
- Photo of any size: downscaled at pick time to at most 1600 px on the long edge and re-encoded as JPEG at quality 0.7; no byte cap is enforced beyond that. When the picker reports a 0 width or height, the long edge is unknown; rather than ask the manipulator for a bound that could enlarge a small image, `processPhoto` skips the downscale and keeps the original asset with a development warning, the same outcome as a processing failure.

**Data model & lifecycle**

- The draft is created when the flow opens and discarded when the group unmounts; it is not persisted across app restarts.
- The idempotency key is generated on the first Send and reused for every retry of the create call; a new draft gets a new key.
- After a successful create, the e-consult id is kept in the draft so a failed upload can be retried without re-creating the message, and so the step 1 leave guard knows the message is already safe.
- Changing the recipient after answering questions keeps the answers.
- Going back from step 3 to step 2 keeps the typed message and the photo.

**UX flows**

- Back from step 1 (the labelled Home button, or swipe-back) returns home immediately when the draft has no message and no photo, or when the e-consult has already been created; otherwise a "Discard your message?" confirmation guards it (`usePreventRemove((hasMessage || hasPhoto) && econsultId == null)`). Leaving unmounts the group and discards the draft.
- The confirmation screen cannot be left by swipe-back, header back, or the Android back gesture; Done is the only way out, and Done lowers the guard before it navigates.
- The step counter and the screen heading are announced when each step appears, because neither platform reliably announces route changes.

**Non-functional**

- Default simulated latency: config 2000 ms, care team 1000 ms, create 1000 ms, upload 1000 ms, each adjustable from the developer settings screen or seeded from `.env`.
- Request timeouts: fifteen seconds for reads and the create, forty-five seconds for the upload, implemented with `AbortController` plus `setTimeout` rather than `AbortSignal.timeout`: the helper owns the controller whose `signal.aborted` it checks in its catch (see The Contract), so neither the fake's `AbortError` nor a real transport's `FetchError` is ever inspected, and nothing depends on Expo's runtime patch being present under jest. Worst-case time to a read error state is two attempts of fifteen seconds plus the one-second retry delay: 31 seconds.
- Photos are bounded to 1600 px on the long edge and re-encoded as JPEG at quality 0.7 at pick time.
- Every interactive element is at least 48 by 48 points; font scaling is never disabled; layouts stack vertically at large font scales instead of shrinking text.
- Read scale from `useWindowDimensions().fontScale`, never `PixelRatio.getFontScale()`, which returns the device pixel ratio when no scale is set.

**Integrations & failure modes**

- Config fails, care team fails, or both: one error state with Retry that refetches whichever failed.
- Create fails with a network error, a server error or a timeout: inline error near Send, Retry re-sends with the same idempotency key. Nothing is auto-retried for the create call.
- Create succeeds and upload fails: the flow moves to the confirmation with the partial-failure variant; upload retry is safe because it is keyed to the e-consult id.
- Offline before Send: Send disabled with reason. Offline mid-send: surfaces as a network error with Retry.
- Malformed response bodies: schema failure is treated exactly like a server error.
- The fake transport can be told, per endpoint, to fail with `network`, `server` or `timeout`, and to add latency, from the development settings screen or the `.env` seeds. Query keys include the practice id, so switching practice never serves another practice's cached data.

**Terminology**

- "e-consult" is the product term and appears in the confirmation and the README; the patient-facing verb is "write to your practice".
- "Care team" for the group; "GP", "practice nurse" and "practice assistant" for roles, and "care team member" for the role `other`.
- "Message" for the free text, "photo" for the attachment, "Send" for the action, "Sent" for the outcome.

## UX/UI Patterns & Platform Lens (React Native)

- **Screen readers.** Every control has an accessible name; errors are tied to their field by folding the error into the field's accessible name, marking the visible error as a polite live region (Android) and announcing it once (both platforms). Recipient cards are grouped as radio buttons in a radio group with `checked` state. Form fields are never grouped, so each stays individually focusable. Headings use the header role. Screen-reader focus moves to the first invalid field on validation failure and to the heading on the confirmation screen.
- **Large text.** `allowFontScaling` stays on everywhere; `maxFontSizeMultiplier` is used only on the step counter chip. Buttons grow with their text. The native header keeps a short title; the real heading sits in the scrollable body where it can wrap.
- **Touch.** 48-point minimum on every pressable, real `minHeight` rather than `hitSlop`, generous spacing between recipient cards and radio options.
- **Keyboard.** Scroll content with the primary button inside it, taps on the button do not first dismiss the keyboard, drag to dismiss, bottom inset padding so the last field clears the home indicator.
- **Safe areas.** Header consumes the top inset via the native stack; screens apply only bottom and horizontal insets. Android is edge-to-edge by default on SDK 57, so the same rule applies there.
- **Permissions.** Camera and library permission is requested at the moment of use through expo-image-picker's hooks. Denied permission gets an explanation and an Open Settings action. Expo Go shows its own permission prompt text; the English usage strings in `app.json` take effect in a real build.
- **iOS versus Android.** `gestureEnabled: false` only works on iOS, so the confirmation screen also uses `usePreventRemove` for Android's back gesture. Live regions are Android only; announcements are used on both. The iOS simulator has no camera; the Android emulator has a virtual scene camera that can be fed an image. `keyboardDismissMode` is `interactive` on iOS and `on-drag` on Android.
- **Offline.** Fail-open detection, a persistent banner announced on transition, Send disabled with reason only while the link is reported down, and Query's online manager driven by the same state.

## Reuse Map

Seeded from how-it-works.md. Nothing in the current tree can be extended because the tree holds two placeholder files; every new unit is justified against what the platform already provides.

| Need | Reused from the platform or template | New because |
|---|---|---|
| Navigation, header, back handling | expo-router `Stack`, `router.replace`, `router.dismissTo`, `usePreventRemove` from `expo-router/react-navigation` | nothing to write beyond screen options |
| Safe areas | `useSafeAreaInsets` from react-native-safe-area-context; provider already mounted by expo-router | no provider of our own |
| Photo preview | expo-image (already installed) | no image component of our own |
| Photo downscaling | expo-image-manipulator (new dependency, included in Expo Go) | one small `processPhoto` function in `src/lib` |
| Camera availability | expo-device `isDevice` (already installed, included in Expo Go) | |
| Networking primitives | `AbortController` for timeouts; Expo's `fetch` for JSON and expo-file-system's upload task for the photo are the named real path, not shipped | the fake transport honours `AbortSignal`, so the timeout path is exercised in tests |
| Accessibility | `AccessibilityInfo.announceForAccessibility`, `AccessibilityInfo.sendAccessibilityEvent(ref, 'focus')`, `accessibilityRole`, `accessibilityState`, `useWindowDimensions().fontScale`, `Pressable` | one tiny helper for announcements, nothing else |
| Data cache and states | @tanstack/react-query (new dependency) | Query's paused, pending, error and success states cover loading, offline, error and success without a hand-written machine |
| Schema validation | zod 4 (new dependency; a zod 3 copy already exists transitively for Expo's CLI and is not what the app imports) | typed contracts with runtime checks at the boundary |
| Photo capture | expo-image-picker (new dependency, included in Expo Go) | |
| Network state | expo-network (new dependency, included in Expo Go) | first-party, no third-party reachability probe |
| Idempotency key | expo-crypto `randomUUID` (new dependency, included in Expo Go) | |
| Tests | jest-expo, @testing-library/react-native 13.3.3 (expo-router's `renderRouter` calls render and act synchronously, which version 14 breaks; the tooling task proves 13.3.3 renders on React 19 with a smoke test before anything depends on it), `expo-router/testing-library` | |
| Lint and format | `npx expo lint` generated flat config plus eslint-plugin-prettier; React Compiler rules ship inside eslint-config-expo on SDK 57 | |

## Success Criteria

1. Both fixture practices with recipients complete the flow end to end in Expo Go on the iOS simulator from a clean clone with `npm install && npx expo start`; `prc-0873` skips the question step and its counter reads "of 2"; the recorded happy path for `prc-0421` takes under two minutes of patient time.
2. Each of the six acceptance criteria maps to at least one automated test whose name states the behaviour, and the whole suite passes.
3. Every interactive element has an accessible name, verified by accessibility-first test queries (`getByRole`, `getByLabelText`), a `minHeight` and `minWidth` of 48 verified with `toHaveStyle`, and an Accessibility Inspector audit on the simulator with zero errors.
4. With the simulator's text size at the largest accessibility setting, every screen remains readable and operable without clipped text or overlapping controls, evidenced by screenshots.
5. With the keyboard open on the question and message screens, the focused field and the primary button are both visible, evidenced by screenshots.
6. Each of these states is reachable from the development settings screen and covered by a test: loading, empty (through the `prc-0000` fixture), config error, care team error, create error, upload failure after a successful create, offline before send (force offline, Apply, enter the flow: step 1 still loads because reads are offline-first; step 3 shows the banner and the disabled Send).
7. Type-check, lint, format check and tests all pass; coverage on `src/api`, `src/features` and `src/lib` is 100 percent of statements and branches; `src/components` and `src/app` reach at least 90 percent of statements, with `Platform.OS` branches exercised by mocking the platform per test; the `__DEV__` guard lives in the single `src/lib/devWarn.ts` helper, whose test sets `globalThis.__DEV__ = false` to exercise the release branch.
8. A message can never be created twice by retrying: the same idempotency key is sent on every retry of the create call, and the fake API returns the original id for a repeated key.

## Out of Scope

Authentication, a real backend or a shipped HTTP transport, push notifications, offline queueing or draft persistence across app restarts, upload progress, recovery of a camera capture after Android kills the activity, a design system or component library, internationalisation, app store builds, the GP-side interface, the reply and inbox flow, dark appearance, multiple photos or video, photo editing or cropping, a client-side byte cap, analytics, web support.

## Open Questions

None. Decisions the reviewer may reasonably overturn are recorded in the Chosen Approach and in DECISIONS.md with their alternatives.
