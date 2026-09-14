# E-consult

An Expo app where a patient sends a non-urgent question to their GP practice: pick a recipient,
answer the practice's questions, write the message, optionally add a photo, and land on a
confirmation that says what was sent and what happens next.

## Requirements

- Node 20 or later, with npm.
- Expo Go on a phone, or the iOS simulator (Xcode with an iOS runtime installed).
- Nothing else: no development build, no native folders, no server to start. Every dependency runs
  inside Expo Go on SDK 57.

## Run it from a clean clone

```bash
npm install
npx expo start
```

Press `i` to open the iOS simulator, or scan the QR code with the Camera app on iOS or with Expo Go
on Android. The backend is faked in process, so there is no server to configure or start.

## The fake backend, and how to reach every state

No request leaves the device. `src/api/fake` serves three fixture practices behind the same
`Transport` interface a real client would implement, with a configurable delay and a per-request
fault map, so every state in the flow is reachable without editing code.

### Developer settings

The home screen shows a **Developer settings** link in development mode (`__DEV__`, which is what
`npx expo start` gives you, Expo Go included); a production bundle hides the link and the screen
redirects home:

| Control       | What it does                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Practice      | `prc-0421` (three recipients, two questions), `prc-0873` (two recipients, no questions, so the counter reads "of 2"), `prc-0000` (no recipients, which is the empty state) |
| Latency       | Default (config 2000 ms, the rest 1000 ms), None, or Slow (5 seconds), which holds the loading states still                                                                |
| Fail: ...     | Forces one of the four requests (practice config, care team, create message, upload photo) to fail with Network, Server or Timeout                                         |
| Force offline | Reports the link as down: the banner appears and Send is disabled with a spoken reason                                                                                     |

**Apply and go home** applies the settings, clears the query cache and returns home, so the next
entry into the flow fetches fresh for the chosen practice. **Cancel**, in the header, leaves the
current settings alone.

The partial failure worth seeing — message sent, photo not attached — is `Fail: Upload photo` set
to any kind, then a send with a photo added.

## Quality commands

```bash
npm test              # jest, jest-expo preset
npm run test:coverage  # the same suite with the coverage thresholds enforced
npm run typecheck      # regenerates the typed routes, then tsc
npm run lint           # expo lint (ESLint flat config, prettier as a rule)
npm run format         # prettier --write .
npm run format:check   # prettier --check .
```

Coverage is enforced per area: 100 % of statements, branches, functions and lines on `src/api`,
`src/features`, `src/hooks`, `src/lib` and `src/providers`, and at least 90 % of statements on `src/components`
and `src/app`.

## Where to find things

The first layer of `src` groups by responsibility — what a folder is for — and the second groups by
kind, so a feature always has the same shape inside it.

| I'm looking for…                                              | Look in                                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| A screen                                                      | `src/app` — routes only, nothing else; expo-router requires every file here at start-up                       |
| The backend contract, the transport, and the fake behind them | `src/api`                                                                                                     |
| App-wide context and the wiring that mounts it                | `src/providers` — the provider stack and the providers it mounts, each with its context hook                  |
| Something the patient does, end to end                        | `src/features/<name>`                                                                                         |
| A UI building block more than one feature uses                | `src/components`                                                                                              |
| A shared hook that is not a context's accessor                | `src/hooks`                                                                                                   |
| Shared logic that is not UI                                   | `src/lib`                                                                                                     |
| Copy more than one screen speaks                              | `src/lib` — the shared constants, such as `retryLabel` for the one retry wording                              |
| Colour, spacing, type-scale and touch-target tokens           | `src/theme`                                                                                                   |
| A helper the tests share                                      | `src/test`                                                                                                    |
| A screen's test                                               | `src/__tests__/app` — unit tests sit beside their code, but a test under `src/app` would be loaded as a route |

Every feature is laid out the same way:

```
src/features/econsult/
  api/         reads and writes
  state/       the draft reducer
  hooks/       what screens call
  components/  UI used here
  utils/       pure rules, and copy with more than one reader
```

No loose files at a feature root: everything belongs to one of those five kinds. Copy a single
component or hook owns stays in that file.

A file lives inside a feature only while that feature is its sole owner; the moment a second one
needs it, it moves out to `src/components` or `src/lib`. Two exceptions are deliberate:

- a generic building block with no domain vocabulary stays in `src/components` or `src/lib` even
  while one feature uses it, as the id generator does;
- a context's accessor hook lives with whatever mounts the context (a provider file or a component).

## Accessibility

Every control has an accessible name, a 48-point minimum touch target, and font scaling left on.
Worth checking by hand:

- **VoiceOver** (Settings > Accessibility > VoiceOver, or Command-Option-F5 on the simulator): each
  control announces its name, role and selected state; a validation error is part of the field's
  name and is spoken once, by focus moving to the first invalid field rather than by a separate
  announcement; on the confirmation, the heading (or the photo-failed notice) takes focus once the transition ends.
- **Largest text size** (Settings > Accessibility > Display & Text Size > Larger Text, slider at the
  maximum): nothing clips or overlaps, layouts stack instead of shrinking, and an invalid Continue or
  Send scrolls the offending field and its error into view.
- **Accessibility Inspector** (Xcode > Open Developer Tool > Accessibility Inspector): run the audit
  on each screen; it should report no issues.

## Platform

Verified by hand in Expo Go on both platforms: the iOS simulator at the default and the largest
accessibility text size, and the Android 16 emulator (Pixel, API 36) at the default font scale and
at 2.0, with TalkBack enabled.

The camera action is offered only when `expo-device` reports a real device, so on a simulator or an
emulator the photo block shows a short note and the library path instead. The capture path needs a
phone.

The Android run settled the questions this app needed a device for. The back key and the back
gesture both hold on the confirmation screen, where Done is the only exit. The emulator shows the
camera note and the library path, as it should. Edge-to-edge insets, which SDK 57 applies by
default, are respected on every screen. With TalkBack's speech shown on screen, the exact wording of
nine spoken events was recorded: the recipient cards, the disabled Continue with its hint, the
validation errors, the sending status, the confirmation, the photo-failed line, the offline banner
with the disabled Send and its reason, and the error card.

It found five accessibility defects, all since fixed. A choice question kept its old error in its
accessible name after being answered, because Android never clears a content description that goes
back to `undefined`. The not-found screen's only way out was an expo-router `Link`, which renders as
text with no role and no click action, so TalkBack skipped it; it is a button now. A failed send
inserted its error card without scrolling, leaving Try again and Send below the fold; the card now
scrolls into view and takes screen-reader focus. The required-question error was spoken twice, once
as an announcement and once as the focused field's name; a validation error is now spoken by the
focus move alone. And "Message sent" was spoken twice on the confirmation, as a status and as the
heading; the heading alone speaks it now.

A real Samsung tablet then covered what the emulator could not: the camera path end to end (the
permission prompt, capture, preview, remove, send), the header's back, Home and Cancel labels under
TalkBack, the two read faults with their error state and recovery, and the loading skeleton. One
known limit came out of it: while the system camera is in the foreground, Android may evict the
app's process under memory pressure, and the patient then returns to Home with the draft gone. That
happened on four of five captures in Expo Go, whose footprint is about three times a standalone
build's; the app has no recovery path for it in this version.

## How it was built

This was built by AI, in a loop designed around the ways AI fails. Research first, with every platform
claim verified against the installed SDK rather than recalled; then a spec through five review rounds
and a plan through three; then one commit per plan task, tests first, inside a declared file fence,
with a simulator preview per screen and a re-check after every fix; then a three-round review of the
finished change; then the flow driven end to end on a phone simulator, a tablet simulator, an Android
emulator with TalkBack and a real iPad; then a pre-PR and a post-PR review, seven axes each. AI wrote
the research, the spec, the plan, the code and the tests, and separate AI checkers reviewed all of it,
while a human approved the spec and the plan, decided every product question and looked at each step's
preview — `AI-USAGE.md` has the detail, including what the AI got wrong and what it took to catch it.

```bash
npm run showcase
```

That opens `specs/001-econsult-flow/artifacts/index.html` in your browser: a dashboard of the loop in
the order it ran, from the research to the reviews that followed the pull request, with every count on
it traced to the file it was counted from and a link to the evidence behind each stage. It reads from
the file system, so it needs no network, no server and no install beyond `npm install`; opening that
file by hand does the same thing.

### The control points, and what each one guards against

| Control point                                  | What it guards against                                            | The evidence in this repo                                                                                                                                                     |
| ---------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research with source verification              | Library behaviour recalled confidently and wrongly                | `research.md` — a verdict and an unverified list per topic; it caught that the classic form-data file part it first recommended is rejected by Expo's `fetch` on SDK 57       |
| Spec and plan checker rounds                   | Drift from the brief, and plans that cannot be built              | `checker/spec-r1.md`–`spec-r5.md` and `checker/plan-r1.md`–`plan-r3.md` — one round caught screen tests placed under `src/app`, where expo-router loads every file as a route |
| One commit per task, tests first, file-fenced  | Scope creep, and code that ships without a test                   | The execution log at the end of `plan.md`, and the 100 % coverage thresholds in `package.json`                                                                                |
| A simulator preview and re-check per screen    | Defects a unit test cannot see — layout, text scaling, focus      | `artifacts/visuals/` — five of the six screen steps needed a re-check page before they passed                                                                                 |
| The final three-round implementation review    | Regressions across the whole diff rather than inside one step     | `checker/final-r1.md`, `checker/final-r2.md`, `checker/final.md`                                                                                                              |
| UI verification on four device lanes           | Platform-specific and real-device behaviour                       | `artifacts/ui-verification/` — TalkBack held a stale error in a question's accessible name; a photo pick blanked the screen on a real iPad                                    |
| A pre-PR and a post-PR review, seven axes each | Code quality, source structure, and tests that only look thorough | The review-fix commits in the branch history                                                                                                                                  |
| The human gates                                | An AI settling product questions, or grading its own work         | `DECISIONS.md` for the decisions and their cost; `AI-USAGE.md` for the approvals and the checks a person had to make by hand                                                  |

### The record under `specs/001-econsult-flow/`

| Path                         | What it is                                                                                                                                                                                          | When to read it                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `artifacts/index.html`       | The entry page: every page below links from it, and it needs no network                                                                                                                             | Start here — open it in a browser from the clone         |
| `artifacts/board.html`       | The step timeline: each task in order, why it exists, how many files it touched, and its simulator evidence                                                                                         | To follow the build in the order it happened             |
| `artifacts/visuals/`         | One page per screen step: what the simulator run found, the fix it forced, and the re-check that passed                                                                                             | After a step's commit, to see what the preview caught    |
| `artifacts/ui-verification/` | The finish-phase runs; its `index.html` links the device lanes, each with screenshots, accessibility-tree dumps and its own report                                                                  | For the evidence behind the platform claims above        |
| `artifacts/checker/`         | The review rounds, rendered from the markdown in `checker/`                                                                                                                                         | To read a verdict and what it blocked                    |
| `research.md`                | The platform facts checked before planning, with the adversarial re-checks that overturned some of them                                                                                             | Before questioning a platform choice                     |
| `how-it-works.md`            | The repository as it stood before this feature                                                                                                                                                      | To see what the plan had to build on                     |
| `spec.md`                    | The agreed behaviour, settled after the five spec rounds                                                                                                                                            | Before reading the code                                  |
| `plan.md`                    | Twenty-two test-first steps with their file fences and verify commands; the execution log at the end names each step's commit, its amendment and its visual outcome, and a decision index closes it | To map a commit back to the step that produced it        |
| `checker/`                   | The rounds themselves: five on the spec, three on the plan, three on the finished change                                                                                                            | When a rendered report raises something you want in full |

Three quick lookups:

- A product decision, its rejected alternatives and what it cost → `DECISIONS.md`.
- Why a screen looks the way it does → that step's page under `artifacts/visuals/`.
- What was verified on which device → `artifacts/ui-verification/`.
