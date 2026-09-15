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
`npm run showcase` opens the record of how the app was built; see "How it was built".

## Recording

- [One path through the flow](specs/001-econsult-flow/artifacts/recording/econsult-one-path.mp4) —
  a minute on the iPhone simulator: recipient, questions, message, a photo from the library, send,
  confirmation.

## The fake backend, and how to reach every state

No request leaves the device. `src/api/fake` serves three fixture practices behind the same
`Transport` interface a real client would implement, with a configurable delay and a per-request
fault map, so every state in the flow is reachable without editing code.

### Developer settings

The home screen shows a **Developer settings** link in development mode (`__DEV__`, which is what
`npx expo start` gives you, Expo Go included); a production bundle hides the link and the screen
redirects home:

| Control       | What it does                                                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Practice      | `prc-0421` (three recipients, two questions), `prc-0873` (two recipients, no questions, so the counter reads "of 2"), `prc-0000` (no recipients, no questions) |
| Latency       | Default (config 2000 ms, the rest 1000 ms), None, or Slow (5 seconds), which holds the loading states still                                                    |
| Fail: ...     | Forces one of the four requests (practice config, care team, create message, upload photo) to fail with Network, Server or Timeout                             |
| Force offline | Reports the link as down: the banner appears and Send is disabled with a spoken reason                                                                         |

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
| Copy more than one file speaks                                | `src/lib/copy.ts` — the three shared strings today; copy with one owner stays in that file                    |
| Colour, spacing, type-scale and touch-target tokens           | `src/theme`                                                                                                   |
| A helper the tests share                                      | `src/test`                                                                                                    |
| A screen's test                                               | `src/__tests__/app` — unit tests sit beside their code, but a test under `src/app` would be loaded as a route |

There is one feature, `econsult`, and any other would be laid out the same way:

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

A real Samsung tablet covered the camera path end to end: the permission prompt, capture, preview,
remove and send. One known limit came out of it: while the system camera is in the foreground,
Android may evict the app's process under memory pressure, and the patient then returns to Home with
the draft gone; the app has no recovery path for it in this version.

## How it was built

This was built by AI in a loop with human gates: a human approved the spec and the plan, decided
every product question and looked at each step's preview, while separate AI checkers reviewed the
research, the spec, the plan, the code and the tests. `DECISIONS.md` holds the assumptions, the four
decisions that matter most, what was traded away and what would come next; every decision in full is
in `docs/decisions-log.md`. The dashboard opened by `npm run showcase` holds the detail, stage by
stage with a link to the evidence behind each.

```bash
npm run showcase
```

That opens `specs/001-econsult-flow/index.html` in your browser. It reads from the file system, so
it needs no network, no server and no install beyond `npm install`; opening that file by hand does
the same thing.
