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
  control announces its name, role and selected state; a validation error is announced once and is
  part of the field's name; the confirmation heading takes focus when the screen appears.
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
default, are respected on every screen. And each message with a single spoken channel — the offline
banner, the sending status, a validation error, a failed photo retry — was spoken exactly once.

It also found three accessibility defects, all since fixed. A choice question kept its old error in
its accessible name after being answered, because Android never clears a content description that
goes back to `undefined`. The not-found screen's only way out was an expo-router `Link`, which
renders as text with no role and no click action, so TalkBack skipped it; it is a button now. And a
failed send inserted its error card without scrolling, leaving Try again and Send below the fold;
the card now scrolls into view and takes screen-reader focus.

What Android has still not shown: the wording of any TalkBack utterance, since the shipped release
build logs no text and only utterance counts could be captured; the hint spoken on a disabled Send,
Retry or Continue; the step 1 loading skeleton, which the prefetch always beat to the screen; the
two read faults and the error state they raise; and photo capture, which needs a real phone.

## The design record

- `DECISIONS.md` — the assumptions, the decisions that matter and their rejected alternatives, what
  was traded away and what is deliberately absent.
- `AI-USAGE.md` — how AI was used to build this, what it got wrong, and how that was caught.
- `specs/001-econsult-flow/` — the research record with its verification rounds, the spec, the plan,
  the checker reports, and `how-it-works.md`, the snapshot of the repository this was built into.
- `specs/001-econsult-flow/artifacts/index.html` — a local, offline copy of the process record: the
  progress board, the per-step visual proofs from the simulator, the finish-phase UI-verification
  results with screenshots, and the checker reports. Open it in a browser from the clone.
