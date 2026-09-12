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

The home screen shows a **Developer settings** link in development builds:

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

### Env seeds

The values the app starts with can be seeded instead:

```bash
cp env.example .env
```

| Variable                  | Value                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_PRACTICE_ID` | `prc-0421`, `prc-0873` or `prc-0000`; anything else falls back to `prc-0421`                       |
| `EXPO_PUBLIC_LATENCY_MS`  | A non-negative delay applied to every request; empty means the defaults above                      |
| `EXPO_PUBLIC_FAULTS`      | Comma-separated `request:kind` pairs, for example `config:timeout,upload:server`; empty means none |

Requests are `config`, `careTeam`, `create` and `upload`; kinds are `network`, `server` and
`timeout`. Unparseable entries are ignored rather than crashing the app.

`EXPO_PUBLIC_*` values are inlined into the bundle at build time, so they are seeds, never a live
toggle: after editing `.env`, reload the app (press `r` in the terminal running `npx expo start`).
Expo's docs say an Expo CLI restart or cache clear is not needed for this; if a change does not show
up, restart `npx expo start` and reload. Developer settings override the seeds at runtime.

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
`src/features` and `src/lib`, and at least 90 % of statements on `src/components` and `src/app`.

## Source layout

| Path                    | What lives there                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `src/api`               | zod contracts, the `Transport` interface, the timeout helper, and the typed services              |
| `src/api/fake`          | The in-process fake transport (latency, faults, abort, idempotency) and the three fixtures        |
| `src/features/econsult` | The draft reducer and provider, validation, the step model, the send path, the hooks screens call |
| `src/lib`               | Query client, network state, announcements, ids, photo processing, developer settings             |
| `src/components`        | The accessible building blocks: scaffold, buttons, text field, choice group, photo picker         |
| `src/theme`             | Colour, spacing, type-scale and touch-target tokens, plus the shared text styles                  |
| `src/app`               | The expo-router routes: home, developer settings, and the four flow screens                       |
| `src/__tests__/app`     | The screen tests, mirroring the route paths                                                       |
| `src/test`              | Test-only helpers: the provider wrapper and a flow layout that presets a draft                    |

Unit tests sit next to the code they cover. Screen tests are the exception: expo-router treats every
`.tsx` under `src/app` as a route and requires each one at start-up in development, so a test file
there would break the app instead of testing it.

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

Verified by hand on the iOS simulator in Expo Go, at the default and the largest accessibility text
size. Two caveats:

- The camera action is offered only when `expo-device` reports a real device, so on a simulator the
  photo block shows a short note and the library path instead. The capture path needs a phone.
- Android has not been run. What to check there: the system back gesture on the confirmation screen
  (it must not leave, since Done is the only exit), TalkBack with the live regions used for errors
  and the offline banner, the emulator's virtual-scene camera for the capture path, and edge-to-edge
  insets, which SDK 57 applies by default.

## The design record

- `DECISIONS.md` — the assumptions, the decisions that matter and their rejected alternatives, what
  was traded away and what is deliberately absent.
- `AI-USAGE.md` — how AI was used to build this, what it got wrong, and how that was caught.
- `specs/001-econsult-flow/` — the research record with its verification rounds, the spec, the plan,
  the checker reports, and `how-it-works.md`, the snapshot of the repository this was built into.
