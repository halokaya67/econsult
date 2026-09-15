# Working in this repository

An Expo app where a patient sends a non-urgent question to their GP practice: pick a recipient,
answer the practice's questions, write the message, optionally add a photo, land on a confirmation.
An in-process fake backend, no server. Below is what the code already does: follow it, or change a
rule deliberately and record it in `DECISIONS.md`.

## The one hard constraint

The app must run in Expo Go on SDK 57 from a clean clone: `npm install`, `npx expo start`, nothing
else. No development build, no `ios/` or `android/` folder, no config plugin that needs one.

Before adding a package:

- If `node_modules/expo/bundledNativeModules.json` lists it, add the pinned version with
  `npx expo install <name>`.
- If it is not there and the package ships native code, it cannot be used: find another way, or
  describe the real implementation in `DECISIONS.md` and fake it, as the HTTP transport is faked.
- Pure JavaScript is allowed but still needs a reason; the dependency list is short on purpose.
- Check behaviour against the versioned SDK 57 documentation and the installed source under
  `node_modules`, not recall; Expo's `fetch` rejects the form-data upload the research recommended.

## Where things live

The first layer of `src` groups by responsibility — what a folder is for — and the second by kind,
so every feature has the same shape inside it.

| Looking for                                     | Look in                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| A screen                                        | `src/app` — routes only; expo-router loads every file here at start |
| The backend contract, the transport, the fake   | `src/api`                                                           |
| App-wide context and the wiring that mounts it  | `src/providers`                                                     |
| Something the patient does, end to end          | `src/features/<name>`                                               |
| A UI building block more than one feature uses  | `src/components`                                                    |
| A shared hook that is not a context's accessor  | `src/hooks`                                                         |
| Shared logic that is not UI                     | `src/lib`                                                           |
| Copy more than one file speaks                  | `src/lib/copy.ts`; copy with one owner stays in that file           |
| Colour, spacing, type scale, touch-target sizes | `src/theme`                                                         |
| A helper the tests share                        | `src/test`                                                          |
| A screen's test                                 | `src/__tests__/app`                                                 |

`econsult` is the one feature. A feature is five kinds and nothing else: `api/` for its reads and
writes, `state/` for its reducer and provider, `hooks/` for what the screens call, `components/` for
UI only it uses, `utils/` for pure rules and for copy with more than one reader. Nothing sits loose
at a feature's root.

A file lives inside a feature only while that feature is its sole owner; the moment a second one
needs it, it moves to `src/components` or `src/lib`. Two exceptions are deliberate: a generic
building block with no domain vocabulary stays shared even with one user, as the id generator does,
and a context's accessor hook lives with whatever mounts it. A screen's sub-component
graduates into `src/features/<name>/components/` when a second screen needs it, when it owns state
or copy of its own, or when its file passes about 200 lines; until then it stays in the route file.

Screen tests live under `src/__tests__/app`, mirroring the route path, because every `.tsx` under
`src/app` is loaded as a route. No barrels: import the module, not an `index.ts` that re-exports it.
No `types/` folder: wire types come from the zod schemas, every other type sits with its owner.

## Inside a file

One order, top to bottom: imports, exported types, local types, constants, pure helpers, hooks,
sub-components, the one export, styles. A route file has exactly one export, its default screen
component; a module exports the one thing it is named for, plus whatever a test needs by name.

Imports go in three groups with no blank line between them — bare packages, then `@/` paths, then
relative paths — alphabetical within each group, and `import/order` enforces it. Use `@/` across
areas, relative paths inside the feature you are in.

Copy is module constants above the component, `const FIELD_HINT = "..."`, never a literal in JSX.
Export it when a test needs the exact words; move it to `src/lib/copy.ts` when a second file speaks it.

Comments explain why, not what, and run to two sentences at most: a constraint, a platform gotcha or
an invariant the next reader would otherwise delete. Doc comments follow their format's conventions.

Functions stay under 50 lines, nesting under four levels, early returns preferred; a file past about
200 lines is a signal to move a piece out.

Names: `PascalCase.tsx` for a component or provider file, `useThing.ts` for a hook, `camelCase.ts`
for everything else, `<name>.test.ts(x)` beside the file it covers. `UPPER_SNAKE_CASE` for module
constants, `camelCase` otherwise, booleans as predicates (`is`, `has`, `should`, `can`), reducer
actions as past-tense events (`recipientSelected`) rather than commands.

## Code rules

- Return new objects; never mutate. The draft reducer spreads, and so does everything else.
- No `any`. TypeScript is strict, and a type describing a payload comes from its zod schema.
- Validate at the boundary: every response is parsed in `src/api/services.ts`, and a parse failure
  becomes an `ApiError("validation")` instead of a crash three screens later.
- Nothing above `Transport` knows about HTTP. The interface is `getJson`, `postJson` and
  `uploadPhoto`, each taking an `AbortSignal`; `ServicesProvider` is the only place that picks an
  implementation; `withTimeout` decides on its own signal, not on the shape of the error.
- The React Compiler is on and its lint rules are errors: rewrite the pattern it rejects, never
  silence the rule. Three patterns follow. A `try`/`finally` bails it out of the whole component or
  hook, so an in-flight guard uses `runOnce` from `src/lib/inFlight.ts`; a value expression inside a
  `try` does the same, so the photo picker hoists its permission ternary above the block; reading a
  ref in render trips `react-hooks/refs`, so a ref setter is wrapped: `ref={(node) => set(node)}`.
- Keyboard and scrolling belong to `ScreenScaffold`: it owns the scroll view, the offline banner,
  the safe-area padding and the keyboard inset, and provides `useScrollToField`. A screen puts its
  primary action in the `action` slot, never pins a footer, and never asks for automatic insets.
- Reads are offline-first: one retry after a second, a five-minute stale time, a 15-second timeout,
  and a failed refetch replaces the recipient list with the error card rather than showing a
  stale medical list, while the questions step keeps the questions it already has. The send mutation runs in `always` mode and never retries itself, so it fails fast instead
  of pausing behind a spinner; create times out at 15 seconds, the photo upload at 45.
- One idempotency key per payload: the first send mints it, every retry reuses it, an edit before
  the create lands retires it, and once the create has landed the key belongs to that e-consult.
- Sending is two calls, create then upload. A failed upload is a partial outcome the patient sees,
  "sent, photo not attached"; its retry uploads to the same e-consult id, never a second create.
- The photo's files belong to the flow: the draft provider deletes every `file://` uri the draft
  named when it unmounts, so nothing removes a photo mid-flow, not even Remove or a replacement.

## Accessibility rules

- Every interactive element has an accessible name, a role, its state and at least 48 by 48 points
  (`MIN_TOUCH`). A `View` gets `accessible` only when it groups text alone; it swallows children.
- Font scaling is never disabled. Two caps exist and no more: the step chip at 2× and the native bar
  buttons at 1.3×, because neither can grow with the page.
- An error is folded into its field's accessible name with `accessibleName(label, error)`, and there
  is no separate error announcement. On a failed submit the field is scrolled into view and then
  focused, after the commit carrying the error; focus alone leaves the screen looking untouched.
- One spoken channel per message:

  | Message                                     | Channel                                       |
  | ------------------------------------------- | --------------------------------------------- |
  | Validation errors, and a screen's heading   | A focus move; the element's name carries it   |
  | Progress the app reports, such as "Sending" | One `announce()` call, next to the event      |
  | Anything already spoken by one of the above | Nothing — no live region, no second mechanism |

  No live regions at all: `accessibilityLiveRegion` is Android-only, so a note that relied on it was
  silent for VoiceOver. A note that appears on its own (a denied permission, a failed pick, the
  thin-message nudge) is announced once where it is set.

- Selection is never colour alone: border weight, fill and a filled dot change together.
- Three shared focus hooks, one situation each. `useFocusAfterCommit` focuses a node after the
  render that changed its accessible name — validation errors. `useFocusOnLayout` focuses a view
  just inserted, since Fabric mounts it a commit later — the error card. `useFocusOnArrival`
  focuses a heading once a pushed screen's transition ends — the confirmation.
- Name the wrapper view, not the text: Android never clears a content description set back to
  `undefined`, iOS caches the name it first read off a `Text`, and an answered error must disappear.
- An error renders directly under its label, above the options.

## Testing rules

Write the test first and watch it fail for the reason you expect: no red run, no evidence.

- Use `test()`, named as a sentence about behaviour ("flags a required question that has no
  answer"), and structure the body as arrange, act, assert, separated by blank lines.
- Query by role and accessible name, `screen.getByRole("button", { name: "Send" })`; a `testID` is
  a last resort, for a container with no role of its own.
- Mount the app's real provider stack through `renderWithProviders`, `hookWrapper` or
  `TestProviders` from `src/test/renderWithProviders`, so no test can pass against wiring the app
  does not have. Router tests use `renderRouter` with `flowLayoutWith(draft)` as `econsult/_layout`.
- `jest.setup.ts` is the global mock world: uuids from a counter, a real device, a connected
  network, granted photo permissions with cancelled launchers, a working image manipulator, a
  working file system whose deletions `src/test/photoFiles` reads back. Opt out
  inside the test that needs it (`jest.mocked`, `jest.replaceProperty`, `jest.spyOn`), never here.
- Coverage is enforced per area: 100 % of statements, branches, functions and lines on `src/api`,
  `src/features`, `src/hooks`, `src/lib` and `src/providers`, 90 % of statements on `src/components`
  and `src/app`. Run `npm test` while working, `npm run test:coverage` before calling it done.
- No test may pass on broken code. Reviewers apply three checks: break the source deliberately and
  the test must fail; assert what a patient would notice, not that your own mock was called; a test
  whose only assertion is `toHaveBeenCalled` proves nothing. No snapshots.
- Fake-timer hygiene: wrap a promise you expect to reject in `handled()` before the timers run, use
  `advanceTimersByTimeAsync`, restore real timers in `afterEach`. The test query client sets
  `gcTime: 0` so its collection timers cannot hold jest open.

## Tooling and verification

| Command                 | What it does                                                   |
| ----------------------- | -------------------------------------------------------------- |
| `npm test`              | jest with the jest-expo preset                                 |
| `npm run test:coverage` | the same suite with the coverage thresholds enforced           |
| `npm run typecheck`     | regenerates the typed routes, then `tsc`                       |
| `npm run lint`          | `expo lint`; Prettier runs as a lint rule, so style fails lint |
| `npm run format`        | `prettier --write .`                                           |
| `npm run format:check`  | `prettier --check .`                                           |
| `npm run showcase`      | opens the process record's dashboard in a browser              |

Formatting failing lint is deliberate, so run `npm run format` rather than aligning by hand. After
touching a component or a hook, check that the compiler still takes the tree with
`npx react-compiler-healthcheck@latest --src "src/**/*.{ts,tsx}"` — a bail-out loses memoisation.

Done means lint, typecheck, `test:coverage` and `format:check` all green and, for anything that
changes the UI, device or simulator evidence: the screen at the default and the largest text size,
plus the screen-reader behaviour if you touched names, focus or announcements. Jest renders no
layout and speaks nothing — five screens here passed their unit tests and failed on the simulator.

## Records

`DECISIONS.md` holds decisions we made, not requirements the brief imposed. Add an entry under the
matching heading, four lines, one each: why it was needed, what was decided, the alternatives and
why each lost, what it costs us.

`AI-USAGE.md` holds incidents, not process: a bold one-line title, then the problem, the human or
checker intervention, and why it was needed — "Needed because ...".

Verification evidence goes under `specs/<flow>/artifacts/ui-verification/<lane>/` as a `report.md`
and numbered screenshots per state; report results — observed, passed, failed, fixed — not tooling.

`specs/` is the historical record of how this feature was built and is not rewritten. When something
it describes stops being true, add a `> **Since then.**` note at the top of that file saying what
changed, and leave the original text as it was written.

## Git

- Conventional commits: `<type>(<scope>)?: <description>`, scope optional, type one of `feat`,
  `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `style`, `i18n`, `build`, `revert`.
- One commit per unit of work: a step, a fix, a refactor. Not one per file, not one per day.
- Never commit `.env` or any other secret; this app needs none.
- Nothing here may point outside the repository: no session links, no artifact URLs, no ticket keys,
  in code, documents or commit messages. A clone has to stand on its own.
- `Co-Authored-By` is the only trailer, and never force-push unless you are asked to.

## Things not to do

Each of these was considered and rejected; the reasoning is in `DECISIONS.md`.

- No state library. The draft is a reducer in a context mounted by the flow's layout.
- No UI or styling library. Controls are hand-built on the tokens in `src/theme`.
- No icon set and no icon-only control; every control says what it does in words.
- No automatic keyboard insets — the scaffold pads for the keyboard itself.
- No live region for anything already spoken, and no separate error announcement.
- No `types/` or `utils/` bucket at the top level, and no barrel files.
- No dark palette and no landscape layout unless a decision says otherwise; light and portrait.
- No environment seeds: no `.env`, no `EXPO_PUBLIC_*`; developer settings are the only knob.
- No end-to-end harness, no msw, no local server; unit tests plus device passes are the bar.
- No draft persistence, no subject field, and no way back from the confirmation.
