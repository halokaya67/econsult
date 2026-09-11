agent_id: a0a38b0436bb74636
mode: plan · round: 2 · reviewed: plan.md revision 2.1 (working tree) · previous round: checker/plan-r1.md · dispatched in the foreground (recorded as completed in flow-dispatches.jsonl)

## Spec-Checker Report — mode: plan

**Verdict:** FAIL

**Reviewed:** 5/5 artifact files (plan.md 6790 lines in full, working tree; spec.md 216 lines, working tree; how-it-works.md; checker/plan-r1.md; research.md by grep) plus repo `tsconfig.json`, `expo/tsconfig.base.json`, `.expo/types/router.d.ts`, `assets/` listing, `git status` · diff: n/a (mode plan) · canon cited: workflow.md (Coding Canon: size caps, DRY, Testing bar) · decisions log: 1 entry (spec-gate approval), 0 dismissals · Sourcegraph not configured, local tree only; standalone take-home repo, no cross-repo consumers · searches:
- plan.md: `If .* then|fall back` → 1 (the T001 BLOCKED clause only); `TBD|TODO|similar to Task` → 0; `git commit|git add` → 0; `^### Task` → 22
- research.md: `useNetworkState|NetworkState` → 8 (`NetworkState` fields all optional, :144); `randomUUID` → 0 (expo-crypto not unpacked; `Crypto.randomUUID()` in T005 is unverified here, not flagged)
- jest-mock 29.7.0 (packed): `build/index.js:958-961` `restoreAllMocks` restores spies only, never resets `jest.fn` implementations → the plan's `afterEach(restoreAllMocks)` is safe; `replaceProperty` requires an existing configurable property (`:800-820`)
- RNTL 13.3.3: `helpers/accessibility.js:88-100` `isAccessibilityElement` (explicit `accessible` wins, else host Text/TextInput/Switch); `queries/label-text.js:12` + `helpers/matchers/match-label-text.js` + `accessibility.js:147-159` `computeAriaLabel` → label queries have no `accessible` gate; `user-event/type/type.js:34` appends to the current value; `render.d.ts:9` `wrapper?: React.ComponentType<any>`
- expo-router 57.0.21: `testing-library/index.js:29` `Object.assign(exports, rnTestingLibrary)` (runtime has `userEvent`) but `index.d.ts:9` declares only `act, cleanup, fireEvent, waitFor, waitForElementToBeRemoved, within, configure, resetToDefaults, isHiddenFromAccessibility, isInaccessible, getDefaultNormalizer, renderHook` + `export type *`; `testing-library/expect.d.ts` = `export {}`; `grep -rl toHavePathname --include=*.d.ts` → 0; `react-navigation/routers/StackRouter.js:336-376` `POP_TO` replaces the current route when the target is absent; `core/useOnPreventRemove.js` nested `beforeRemove` supported; `useScreens.js:73,78` extraneous/unknown `Stack.Screen` → `console.warn` only
- babel: `babel-preset-expo/build/index.js:59-61` + `common.js:133-150` always yield a runtime version → `@react-native/babel-preset/src/configs/main.js:194-203` enables `@babel/plugin-transform-runtime` `helpers: true` → `_interopRequireWildcard` cache shared, so `jest.replaceProperty(Device, "isDevice", false)` reaches `PhotoPicker`'s `Device` copy
- jest-expo 57.0.5: `src/resolveBabelOptions.js:44-60` falls back to `babel-preset-expo` when no `babel.config.js` (repo has none); `setup.js:189-232` no `expo-image/mocks` → real `requireNativeViewManager`; `@react-native/jest-preset` 0.86.3 (packed) `jest/setup.js:149-151` mocks `NativeComponentRegistry.get` → `mockNativeComponent(name)` (`mockNativeComponent.js:32` renders a host element with all props) so the polyfill's throwing `getViewConfig` (`expo-modules-core/src/polyfill/dangerous-internal.ts:19-21`) is never called and `getByLabelText("Your photo")` matches (`expo-image/src/ExpoImage.tsx:104` forwards `accessibilityLabel`)
- expo-image-picker 57.0.17: `ImagePicker.types.d.ts:48,230-254,420` `MediaType`, asset `uri/width/height`, `mediaTypes` array; `ImagePicker.d.ts:35,47,98-99` 3-tuple hooks, `PermissionResponse`/`PermissionStatus` exported; expo-image-manipulator 57.0.17: `ImageManipulatorContext.d.ts:14,49`, `ImageRef.d.ts:19`
- @expo/cli (under `expo/node_modules`): `customize/customizeAsync.js:42` file args run without prompting; `customize/templates.js:93-102` → `customize/typescript.js` bootstraps typed routes; `lint/lintAsync.js:90-93` `DEFAULT_INPUTS = ['src','app','components']` (root `eslint.config.js` is not linted); eslint-config-expo 57.0.2 (packed) `flat/utils/typescript.js:68-82` `no-undef: off`, `@typescript-eslint/no-unused-vars` warn with `ignoreRestSiblings: true`
- expo-router `package.json` peers: gesture-handler, reanimated, react-native-web, react-dom all `optional: true` (T021 uninstall safe)
- tsc 6.0.3 probes (scratchpad `tscheck2`, repo tsconfig + overlay, `preserveSymlinks` so RNTL resolves from expo-router's d.ts): **fail** — `jest.setup.ts` manipulator factory (TS7022/TS7024), `import { userEvent } from "expo-router/testing-library"` (TS1362), `expect(screen).toHavePathname` (TS2339 on `JestMatchers<Screen>`), T011 `context.renderAsync.mockRejectedValueOnce` (TS2339); **compile** — the three fixes below, `observed!`, `let outcome;`, `withFault`/`withoutKey` computed-key rest, `fieldRefs` map with `Ref<View>`/`Ref<TextInput>` callbacks, `ComponentRef<typeof Text>` cast to `Focusable`, `Permission` tuple from both picker hooks, `denied` with `PermissionStatus.DENIED`, `Image accessibilityLabel/contentFit`, `Switch accessible={false}`, `renderRouter` `wrapper: ({ children })`, `applyPhotoReady` spread, `parseFaults` reduce

| Prior flag | Status | Evidence |
|------------|--------|----------|
| C1 — screen tests inside `src/app` | RESOLVED | plan.md:4993-4994, :5276, :5541, :5750, :6133, :6333 create under `src/__tests__/app/`; :26, :70, :4996 state the rule; :154 excludes it from coverage |
| C2 — real layout shadows the test draft | RESOLVED | plan.md:5213-5232 `flowLayoutWith(draft)`; :5304, :5573, :5808, :6160 register it; :2503-2504 `DraftProvider` takes `initial` |
| C3 — hoist-unsafe mock factories | RESOLVED | plan.md:173, :194 `mockUuidCounter`/`mockGrantedPermission`; the manipulator factory is self-contained (but see new C1) |
| C4 — role queries on plain Views | RESOLVED | plan.md:4036 OfflineBanner, :4641 ErrorState, :6291 sent warning box carry `accessible`; :4263, :4281, :5590-5604 use `*ByLabelText` for the group |
| C5 — zod input type | RESOLVED | plan.md:1367 `parse<S extends z.ZodType>(…): z.output<S>` (probe: `Services` type-checks) |
| C6 — `PermissionStatus` literal, `manipulate()` arity | RESOLVED | plan.md:4722 `ImagePicker.PermissionStatus.DENIED`; :3512 `manipulate(ORIGINAL.uri)` (the replacement line has its own type error, new C4) |
| W1 — decidable hedges | RESOLVED | grep: only the T001 BLOCKED clause remains (:299); :3283 test renamed, `options` assertion gone; :3741 `props.accessibilityHint` |
| W2 — second Home button | RESOLVED | plan.md:5499 header-left only; :5313-5318 test-side `pressHome` fallback |
| W3 — guard never exercised | RESOLVED | plan.md:6157-6168 starts on `/econsult/recipient`, pushes `sent`; :6188 `router.back()` has a target (different route than suggested, same outcome) |
| W4 — Remove unreachable while preparing | RESOLVED | plan.md:4909-4921 preparing branch renders Remove; :4804-4813 test; :4696 states the one-photo rule; spec.md:105/:126 aligned |
| W5 — `__DEV__` in screens | RESOLVED | plan.md:1749-1751 `isDevelopmentBuild`; :5177, :6543 branch on it; :5058, :6430 stub it |
| W6 — verbatim duplicates | RESOLVED | plan.md:2831 `recipientNameFor` (T008), :462 `IDEMPOTENCY_HEADER` (T002), :2090-2135 `src/test/providers.tsx` (T006) |
| W7 — missing tests, tautologies | RESOLVED | plan.md:2719-2725 care-team error; :5359-5369 preselect; no `toBeInstanceOf(ApiError)` constructor test, no `options?.networkMode` |
| I1 — test counts | RESOLVED | recounted every "Expected: PASS, N tests" (T002–T020): all match |
| I2 — File Structure | RESOLVED | plan.md:48-49, :60, :68 |
| I3 — `.prettierignore` fence | RESOLVED | plan.md:271-272 |
| I4 — Switch height, picker while sending | RESOLVED | plan.md:6521-6535 `OfflineToggle` row `minHeight: MIN_TOUCH`; :4873, :6085 `disabled` |

Coverage matrix (spec → tasks): every Screens/Edge Cases/Data model/UX/Non-functional/Integrations item maps to a task (recipient step T016, questions T017, message T018, sent T019, photo lifecycle T007/T011/T014, offline T005/T012/T018, idempotency T003/T004/T007/T018, dev panel T006/T020, cleanup T021, docs T022). Gaps: spec.md:169 radiogroup for recipient cards (W2 below); SC7's 100 % branch thresholds are unreachable with the listed tests (W1 below). Tasks → spec orphans: none (`STALE_TIME_MS`, `presentation: "modal"`, `unstable_settings.anchor` remain justified as in round 1). TDD order holds in every task; every `Files:` block has exact paths and a `T###` id; no commit steps; each scoped verify runs against files that exist at that point in the sequence.

| ID | Severity | Category | Location | Finding |
|----|----------|----------|----------|---------|
| C1 | CRITICAL | tests | plan.md:222-223 (T001 `jest.setup.ts`) | `mockContext` references itself in its initializer → TS7022; `npm run typecheck` fails from T001 Step 7 onward |
| C2 | CRITICAL | tests | plan.md:5008 (T015), :5287, :5552, :5785, :6144, :6345 | `userEvent` is only a type re-export of `expo-router/testing-library` → TS1362 in all six screen-test files |
| C3 | CRITICAL | tests | plan.md:5037 (T015) and 18 more sites | `expect(screen).toHavePathname(…)` has no shipped type augmentation → TS2339 in all six screen-test files |
| C4 | CRITICAL | tests | plan.md:3512-3513 (T011 test) | `context.renderAsync.mockRejectedValueOnce` on the un-mocked return type → TS2339; T011 typecheck fails |
| W1 | WARNING | tests | plan.md:1083, :1098, :1149, :1155, :2859-2862 | Six branches no listed test reaches; the 100 % branch thresholds on `src/api` and `src/features` (:156-158, SC7) fail at the finish-phase coverage run |
| W2 | WARNING | spec-compliance | plan.md:5448-5462 (T016 `RecipientList`) | Recipient cards are not wrapped in a radio group (spec.md:169) |
| W3 | WARNING | standards | plan.md:5992-6100 (`MessageScreen`) | 109-line function; four more at 52-61 lines against the plan's own "functions under 50 lines" (:23) |
| W4 | WARNING | reuse | plan.md:5185-5186, :6304-6305, :6585-6586, :4956, :4655-4656, :4092-4097 | The same `body`/`title` text styles are copied into six files |
| I1 | INFO | consistency | plan.md:3461 (T011 Produces) | `resizeTargetFor` signature omits `\| null` that the implementation (:3573) and tests (:3491) use |
| I2 | INFO | consistency | plan.md:6738, :5 | AI-USAGE hard-codes "three rounds"/"two"; the spec had five checker rounds, the plan at least two |
| I3 | INFO | consistency | spec.md:62 vs plan.md:653-658 | Spec says the care team fixture holds five members; prc-0421 ships four |
| I4 | INFO | tests | plan.md:2120, :5227, :5203-5206 | `TestProviders` builds a new `QueryClient` on every render; `flowLayoutWith`/`EConsultLayout` declare screens absent from test route maps (warn noise) |
| I5 | INFO | tests | plan.md:4789-4791 (T014) | `mockReturnValue` on the library-permission mock outlives the test (`restoreAllMocks` does not reset it); later tests pass only by order |
| I6 | INFO | tests | plan.md:6203-6214 (T019) | The "Try again" test cannot observe a successful retry; the `attached`-after-retry path is screen-untested |
| I7 | INFO | standards | plan.md:6568, :6576 (T020) | `option as LatencyOption` / `as FaultOption` casts where a `string`-keyed lookup needs none |

### C1 — `jest.setup.ts` mock factory does not type-check
- **Severity:** CRITICAL
- **Category:** tests
- **Location:** plan.md:217-231 (self-reference at :222-223)
- **Finding:** `const mockContext = { resize: jest.fn(() => mockContext), … }` is a self-referential initializer; under `strict` tsc 6.0.3 reports TS7022 (`'mockContext' implicitly has type 'any' because … referenced directly or indirectly in its own initializer`) and TS7024 on the arrow. `tsconfig.json` includes `**/*.ts`, so `npm run typecheck` (T001 Step 7) exits non-zero and every later task's verify inherits the failure. Round 1 missed it because C3 checked the hoisting rule, not the type-check of the setup file; the factory was not among C3's rewritten lines.
- **Why:** The first verify of the whole plan fails; the implementer would hunt in the wrong place (the plan blames only the RNTL pin in its BLOCKED clause).
- **Suggested fix:** (probe compiled)
  ```ts
  jest.mock("expo-image-manipulator", () => {
    const mockImage = {
      saveAsync: jest.fn(async () => ({ uri: "file:///cache/processed.jpg", width: 1600, height: 1200 })),
      release: jest.fn(),
    };
    const mockContext: { resize: jest.Mock; renderAsync: jest.Mock; release: jest.Mock } = {
      resize: jest.fn(() => mockContext),
      renderAsync: jest.fn(async () => mockImage),
      release: jest.fn(),
    };
    return {
      SaveFormat: { JPEG: "jpeg", PNG: "png", WEBP: "webp" },
      ImageManipulator: { manipulate: jest.fn(() => mockContext) },
    };
  });
  ```
- **Needs user:** no

### C2 — `userEvent` is not a value export of `expo-router/testing-library`
- **Severity:** CRITICAL
- **Category:** tests
- **Location:** plan.md:5008 (T015 `index.test.tsx`), :5287 (T016), :5552 (T017), :5785 (T018), :6144 (T019), :6345 (T020)
- **Finding:** `node_modules/expo-router/build/testing-library/index.d.ts:9` declares only `act, cleanup, fireEvent, waitFor, waitForElementToBeRemoved, within, configure, resetToDefaults, isHiddenFromAccessibility, isInaccessible, getDefaultNormalizer, renderHook` as values; everything else comes through `export type * from '@testing-library/react-native'`. Probe: `import { … userEvent … } from "expo-router/testing-library"` → TS1362 "'userEvent' cannot be used as a value because it was exported using 'export type'". The runtime works (`index.js:29` `Object.assign(exports, rnTestingLibrary)`), so jest passes and only `npm run typecheck` fails — in every task from T015 on. Round 1 read the d.ts for `renderRouter`'s option shape and did not compile the named imports.
- **Why:** Six tasks' scoped verify (`npm run typecheck`) fail; SC7 ("type-check … pass") cannot be met.
- **Suggested fix:** In all six test files:
  ```tsx
  import { act, renderRouter, screen, waitFor } from "expo-router/testing-library";
  import { userEvent } from "@testing-library/react-native";
  ```
  (same module instance under jest; `screen` from expo-router is a live getter onto RNTL's, so mixing is safe.)
- **Needs user:** no

### C3 — `toHavePathname` has no type declaration
- **Severity:** CRITICAL
- **Category:** tests
- **Location:** plan.md:5037, :5054, :5345, :5356, :5395, :5406, :5607, :5621, :5632, :5831, :5844, :5867, :5879, :5891, :5905, :6190, :6200, :6424, :6433
- **Finding:** expo-router 57.0.21 registers the matchers at runtime (`testing-library/expect.js:19 expect.extend({ toHavePathname… })`) but ships no augmentation: `expect.d.ts` is `export {}` and no `.d.ts` in the package mentions `toHavePathname`. With `@types/jest` 29.5.14 the probe gives TS2339 "Property 'toHavePathname' does not exist on type 'JestMatchers<Screen>'" (with RNTL correctly resolved; `preserveSymlinks` probe). Nineteen assertions across T015–T020 fail `tsc`. Same miss as C2.
- **Why:** Same as C2; together they make every screen task's verify red.
- **Suggested fix:** Add one ambient file in T015 (Files: `Create: src/test/expo-router-matchers.d.ts`; File Structure row; it is a `.d.ts`, so `collectCoverageFrom`'s `!src/test/**` and `moduleDetection: "force"` are unaffected — probe compiled with the repo tsconfig):
  ```ts
  // expo-router registers these matchers at runtime (testing-library/expect.js) but ships no types.
  declare namespace jest {
    interface Matchers<R> {
      toHavePathname(pathname: string): R;
      toHavePathnameWithParams(pathname: string): R;
      toHaveSegments(segments: string[]): R;
      toHaveSearchParams(params: Record<string, string | string[]>): R;
      toHaveRouterState(state: unknown): R;
    }
  }
  ```
  Alternative without the file: `expect(view.getPathname()).toBe("/…")` on the `renderRouter` result, which is typed.
- **Needs user:** no

### C4 — T011 failure test calls a mock method on a plain type
- **Severity:** CRITICAL
- **Category:** tests
- **Location:** plan.md:3512-3513 (`photo.test.ts`)
- **Finding:** `jest.mocked(fn)` (deep by default in @types/jest 29, `index.d.ts:248`) types the *function* as a mock, but a call still returns `ReturnType<typeof manipulate>` = `ImageManipulatorContext`; `context.renderAsync.mockRejectedValueOnce` → TS2339 "Property 'mockRejectedValueOnce' does not exist on type '() => Promise<ImageRef>'" (probe). Round 1's own C6 suggestion introduced this line without type-probing it.
- **Why:** T011's `npm run typecheck` fails; the coverage of the failure branch depends on this test.
- **Suggested fix:** (probe compiled; the shared-context mock makes this the same object `processPhoto` receives)
  ```ts
  const context = jest.mocked(manipulate(ORIGINAL.uri));
  context.renderAsync.mockRejectedValueOnce(new Error("decode failed"));
  ```
- **Needs user:** no

### W1 — Six branches without a test; the 100 % branch thresholds fail
- **Severity:** WARNING
- **Category:** tests
- **Location:** plan.md:1083 (`delay` pre-aborted signal), :1098 (`hangUntilAborted` pre-aborted signal), :1149 (`postJson` unknown path), :1155 (`uploadPhoto` unknown path), :2859-2862 (`combineRecipients.retry`: config-ok/team-error arms); thresholds :156-158
- **Finding:** Every fake-transport test aborts *after* the call starts, so both `if (signal.aborted) return reject(…)` arms stay false; no test posts or uploads to a wrong path; `retry` is only invoked with a config error (:2666-2677), so `if (config.isError)` false and `if (team.isError)` true are never executed. `coverageThreshold` demands 100 % branches on `./src/api/` and `./src/features/`, so `npm run test:coverage` (SC7, run in the flow's finish phase) exits non-zero. Round 1 did not walk branch coverage.
- **Why:** SC7 is unattainable as planned and surfaces only at the end of the flow.
- **Suggested fix:** T003 `fakeTransport.test.ts` (count → 18):
  ```ts
  test("a request started with an already-aborted signal rejects at once", async () => {
    const transport = createFakeTransport();
    const controller = new AbortController();
    controller.abort();
    await expect(transport.getJson("/practices/prc-0421/care-team", controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    const hanging = createFakeTransport({ faults: { config: "timeout" } });
    await expect(hanging.getJson("/practices/prc-0421/econsult-config", controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
  test("posting or uploading to an unknown path is a 404 server error", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });
    await expect(transport.postJson("/nope", {}, key("k"), signal())).rejects.toMatchObject({ kind: "server", status: 404 });
    await expect(transport.uploadPhoto("/nope", PHOTO, signal())).rejects.toMatchObject({ kind: "server", status: 404 });
  });
  ```
  T008 `useRecipients.test.tsx` (count → 21):
  ```ts
  test("retry refetches only the care team when that is the failed request", () => {
    const refetch = jest.fn();
    const result = combineRecipients([fakeResult<PracticeEConsultConfig>({ data: CONFIG }), fakeResult<CareTeamMember[]>({ isError: true, refetch })]);
    if (result.status === "error") result.retry();
    expect(refetch).toHaveBeenCalled();
  });
  ```
- **Needs user:** no

### W2 — Recipient cards are not in a radio group
- **Severity:** WARNING
- **Category:** spec-compliance
- **Location:** plan.md:5448-5462 (`RecipientList` returns a fragment), spec.md:169
- **Finding:** The spec's screen-reader rule says "Recipient cards are grouped as radio buttons in a radio group with `checked` state"; `ChoiceGroup` has the `radiogroup` container (:4483), the recipient step does not. Round 1 saw these lines but concentrated on the environment blockers.
- **Why:** VoiceOver/TalkBack lose the "1 of 3" group context on the first step, the step the spec singles out for radio semantics.
- **Suggested fix:**
  ```tsx
  <View accessibilityRole="radiogroup" accessibilityLabel={STEP_TITLES.recipient} style={styles.list}>
    {result.recipients.map(/* unchanged */)}
  </View>
  // styles: list: { gap: spacing.md }
  // recipient.test.tsx, first test: expect(screen.getByLabelText(STEP_TITLES.recipient)).toBeOnTheScreen();
  ```
  (Do not add `accessible`; the group must stay a container, see :25.)
- **Needs user:** no

### W3 — Functions over the plan's own 50-line cap
- **Severity:** WARNING
- **Category:** standards
- **Location:** plan.md:5992-6100 `MessageScreen` (109 lines); :4891-4951 `PhotoPicker` (61); :1109-1163 `createFakeTransport` (55); :5670-5724 `QuestionsScreen` (55); :5464-5515 `RecipientScreen` (52)
- **Finding:** Global Constraints (:23) and canon (workflow.md "functions < 50 lines") set the cap; the message screen is more than double it. A final-mode review would flag the same lines.
- **Why:** Canon: size caps.
- **Suggested fix:** In `message.tsx`, move send state into a local hook and the feedback into a child, both in the same file (stays under the `src/app` 90 % statement tier, no new Files entry):
  ```tsx
  function useSend(/* draft, dispatch, photo, session, router */) {
    // messageError, status, submit, onMessageChange, onSend  (lines 5999-6048 verbatim)
    return { messageError, status, submit, onMessageChange, onSend, messageRef };
  }
  function SendFeedback({ status, submit, onRetry }: …) {
    return (<>{status ? <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text> : null}
      {submit.isError ? <ErrorState title={ERROR_TITLE} body={sendErrorCopy(submit.error)} onRetry={onRetry} /> : null}</>);
  }
  ```
  For the four marginal ones, extract `PreparingPhoto`/`ReadyPhoto` views from `PhotoPicker`, hoist `create()` out of `createFakeTransport` (pass `state`), and pull the `questions.map` renderer into `QuestionField`.
- **Needs user:** no

### W4 — Text styles copied into six files
- **Severity:** WARNING
- **Category:** reuse
- **Location:** plan.md:5185-5186 (`index.tsx`), :6304-6305 (`sent.tsx`), :6585-6586 (`dev-settings.tsx`), :4956 (`PhotoPicker`), :4655-4656 (`StatusViews`), :4092-4097 (`StepHeader`)
- **Finding:** `body: { color: colors.text, fontSize: fontSize.body, lineHeight: lineHeight.body }` appears five times and the `title` object four times, character for character. Canon DRY ("extract only real repetition"): this is real, cross-task repetition.
- **Why:** A type-scale change has six homes.
- **Suggested fix:** T012 `Create: src/theme/text.ts` (add to Files and File Structure):
  ```ts
  import { StyleSheet } from "react-native";
  import { colors, fontSize, lineHeight } from "./tokens";
  export const text = StyleSheet.create({
    title: { color: colors.text, fontSize: fontSize.title, lineHeight: lineHeight.title, fontWeight: "700" },
    heading: { color: colors.text, fontSize: fontSize.heading, lineHeight: lineHeight.heading, fontWeight: "700" },
    body: { color: colors.text, fontSize: fontSize.body, lineHeight: lineHeight.body },
    muted: { color: colors.muted, fontSize: fontSize.body, lineHeight: lineHeight.body },
  });
  ```
  and `style={text.body}` / `style={text.title}` at the six sites.
- **Needs user:** no

### I1 — Stale interface line for `resizeTargetFor`
- **Severity:** INFO
- **Category:** consistency
- **Location:** plan.md:3461
- **Finding:** The Produces block still reads `: { width: number } | { height: number }`; the implementation (:3573) and tests (:3491) return `| null`.
- **Why:** The implementer is told the block is the contract.
- **Suggested fix:** `export function resizeTargetFor(width: number, height: number): { width: number } | { height: number } | null;`
- **Needs user:** no

### I2 — Document counts fixed in the plan text
- **Severity:** INFO
- **Category:** consistency
- **Location:** plan.md:6738 (AI-USAGE "a spec checker over three rounds and a plan checker over two"); plan.md:5 (header cites round 4 only)
- **Finding:** `checker/` holds spec-r1..r5 and plan-r1 (this is plan round 2); AI-USAGE must be "truthful to how this repository was actually produced".
- **Why:** The hand-in would misstate the process.
- **Suggested fix:** Replace the numbers with "as many rounds as `specs/001-econsult-flow/checker/` records (five for the spec, N for the plan)", to be filled by the T022 implementer from the folder; extend the header to "rounds 4 and 5".
- **Needs user:** no

### I3 — "Five members" versus a four-member fixture
- **Severity:** INFO
- **Category:** consistency
- **Location:** spec.md:62; plan.md:653-658
- **Finding:** Spec: "The care team fixture holds five members with roles"; the prc-0421 team has four (`ct-11`, `ct-12`, `ct-19`, `ct-20`), prc-0873 two.
- **Why:** Minor spec/plan drift.
- **Suggested fix:** Either amend spec.md:62 to "four members (one not writable)" or add `{ id: "ct-21", displayName: "R. de Groot", role: "other" }` to prc-0421 (exercises the `other` → "Care team member" label in the app; also keep it out of `recipientIds`).
- **Needs user:** no

### I4 — Test-infrastructure hygiene
- **Severity:** INFO
- **Category:** tests
- **Location:** plan.md:2120 (`client ?? testClient()`), :5227 (`flowLayoutWith` declares `sent`), :5203-5206 (`EConsultLayout` declares four screens)
- **Finding:** `TestProviders` calls `testClient()` during render, so any `rerender` (T012 uses one) swaps the `QueryClient`; harmless today, a trap later. `useScreens.js:73,78` prints `console.warn` for every `Stack.Screen` whose route is missing from a test route map (T015 `_layout.test.tsx`, T016, T017).
- **Why:** Silent cache resets and warning noise.
- **Suggested fix:** `const [fallback] = useState(testClient); … client={client ?? fallback}`; in `flowLayoutWith`, keep the `sent` screen options only when tests register that route, or accept the noise and say so in the file comment.
- **Needs user:** no

### I5 — T014 denied-permission mock outlives its test
- **Severity:** INFO
- **Category:** tests
- **Location:** plan.md:4789-4791
- **Finding:** jest-mock 29.7 `restoreAllMocks` (`build/index.js:958-961`) restores spies only; `jest.mocked(useMediaLibraryPermissions).mockReturnValue([denied…])` persists for the file's remaining tests, which pass only because none of them picks.
- **Why:** Reordering the tests breaks "a library pick starts a preparing photo".
- **Suggested fix:** `jest.spyOn(ImagePicker, "useMediaLibraryPermissions").mockReturnValue([denied, jest.fn(async () => denied), jest.fn(async () => denied)]);` — a spy, which `restoreAllMocks` does undo (same typing as today).
- **Needs user:** no

### I6 — Retry success is not observable at screen level
- **Severity:** INFO
- **Category:** tests
- **Location:** plan.md:6203-6214
- **Finding:** The fake transport inside `TestProviders` has no e-consult `ec-1`, so "Try again" can only ever resolve `failed`; `waitFor(() => expect(screen.getByRole("alert")).toBeOnTheScreen())` cannot fail. The `attached` outcome after a retry (spec.md:107, :156) is covered only by the hook test in T010.
- **Why:** Testing bar: the assertion does not distinguish a retry that ran from one that did not.
- **Suggested fix:** Add a sibling test that stubs the hook: `jest.spyOn(useSubmitModule, "useRetryAttachment").mockReturnValue({ mutateAsync: jest.fn(async () => "attached"), isPending: false } as unknown as ReturnType<typeof useRetryAttachment>)`, press "Try again", then `expect(await screen.findByText("Your photo was attached.")).toBeOnTheScreen()`.
- **Needs user:** no

### I7 — Narrowing casts in the developer settings screen
- **Severity:** INFO
- **Category:** standards
- **Location:** plan.md:6568, :6576
- **Finding:** `latencyFor(option as LatencyOption)` and `faultFor(option as FaultOption)` cast a `string` because `ChoiceGroup.onChange` yields `string`.
- **Why:** Canon: no unjustified casts.
- **Suggested fix:** Type the lookups on `string`: `const LATENCY_BY_OPTION: Record<string, number | null> = { Default: null, None: 0, "Slow (5 seconds)": SLOW_LATENCY_MS }; export function latencyFor(option: string) { return LATENCY_BY_OPTION[option] ?? null; }` and the same for `FAULT_BY_OPTION: Record<string, FaultKind | undefined>`; the helper tests keep working.
- **Needs user:** no

**Possibly dismissed:** none

**Summary:** Every round-1 flag is genuinely fixed and the revision 2.1 edits (signal-based `withTimeout`, the null resize target, the decisions text) match the current spec, including the T014 preview styling. The plan still fails on four type-check facts the fixes did not probe: the manipulator mock factory's self-reference in `jest.setup.ts` (C1, breaks T001's verify), `userEvent` and `toHavePathname` having no types in `expo-router/testing-library` (C2, C3, break T015–T020), and the T011 failure test's un-mocked context (C4); fix C1 first because every later verify depends on it. Beyond that, add the six missing branch tests before the coverage thresholds bite (W1) and wrap the recipient cards in a radio group (W2); the reducer, transport, services, hooks and the test-only flow layout are sound, and the jest environment facts I checked (spy-only `restoreAllMocks`, shared babel-runtime helpers for `replaceProperty`, the mocked native-component registry for the expo-image preview, non-interactive `expo customize`, `expo lint` inputs) all support the tests as written.
