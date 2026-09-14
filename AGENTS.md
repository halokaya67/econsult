# Working in this repository

Read the versioned Expo docs at https://docs.expo.dev/versions/v57.0.0/ before writing code; this app targets SDK 57 and must run in Expo Go from a clean clone, so only packages pinned in `node_modules/expo/bundledNativeModules.json` or pure JavaScript may be added.

## Shape

The first layer of `src` groups by responsibility, the second by kind: every feature has the same
five folders inside it and nothing loose at its root.

- `src/api`: contracts (zod), the `Transport` interface, the in-process fake, and the four typed services. The real client is described in `DECISIONS.md`; nothing here does HTTP.
- `src/providers`: the one provider stack, mounted by the root layout and by the test wrapper, together with the query client it is handed. `ServicesProvider` is the composition root: the only place that chooses the fake transport. `NetworkProvider` holds the link state, `session.ts` the faked patient session.
- `src/features/econsult`: the flow, in five parts — `state/` for the draft reducer and its provider, `api/` for the query options and the send path, `hooks/` for what the screens call, `components/` for the pieces only this flow uses, `utils/` for its pure rules and copy. Sending is two calls: create the e-consult, then upload the photo; a failed upload is a partial outcome the patient sees, never a reason to create the message again.
- `src/features/devSettings`: `utils/` with the settings shape, its defaults, and the option tables the developer-settings screen renders.
- `src/lib`: the helpers with no app knowledge — announcements, `devWarn` and `isDevelopmentBuild`, ids, field labels.
- `src/components`: small accessible building blocks; `src/app`: expo-router screens that compose them.
- A file belongs to a feature only while that feature is its sole owner; once a second one needs it, it moves to `src/components` or `src/lib`.
- Screen tests live under `src/__tests__/app/`: every `.tsx` under `src/app` is a route, so no test may sit there.
- Developer settings (a modal from the home screen in development mode, `__DEV__`) are the only way to change the fixture practice, the latency, the forced faults and forced offline.

## Rules

- Every interactive element: accessible name, at least 48 by 48 points, `allowFontScaling` never disabled.
- Errors are folded into the field's accessible name and announced once.
- Reads: offline-first with one retry. The send mutation runs in `always` mode with no retry; the create call times out at 15 seconds and the photo upload at 45.
- Return new objects; keep functions under 50 lines; no `any`; validate at the boundary with zod.
- Tests sit next to the code as `*.test.ts(x)` (screens excepted, see above) and query by role and label; a `View` gets `accessible` only when it groups text alone. `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check` must pass.
- `npm run typecheck` regenerates the typed routes before `tsc`.
