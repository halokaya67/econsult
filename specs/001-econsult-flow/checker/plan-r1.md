agent_id: a507214efedc1197c
mode: plan · round: 1 (preliminary, dispatched before the plan phase transition) · plan reviewed: 6587 lines · spec: after checker rounds 1 to 3

## Spec-Checker Report — mode: plan

> **Since then.** The plan this round reviewed was executed, and the tree was restructured afterwards. Two things it relies on have changed:
>
> - The paths it names have moved: `src/test/providers.tsx` is `src/test/renderWithProviders.tsx`, the flat `src/features/econsult/*.ts` modules went into `api/`, `state/`, `hooks/` and `utils/`, and the screen tests it moved out of the route directory live under `src/__tests__/app/`.
> - The `accessibilityLiveRegion="polite"` in the `OfflineBanner`, `ErrorState` and `PhotoPicker` code it quotes was removed: an error is spoken once by the focus move to the field, and no error surface is a live region.

**Verdict:** FAIL

**Reviewed:** 6/6 artifact files (plan.md 6587 lines in full; spec.md; how-it-works.md; the brief `case-study-mobile.md`; checker/spec-r3.md; research.md by grep as dispatched) plus package.json, tsconfig.json, app.json, .gitignore, .claude/settings.json, .vscode/settings.json · diff: n/a (mode plan) · canon cited: workflow.md (Coding Canon: DRY, Testing bar, "Errors & inputs"; Commit Policy) · decisions log: 1 entry (spec-gate approval), `grep -in dismiss` → 0 · Sourcegraph not configured, local Grep only; standalone take-home repo, no cross-repo consumers · searches:
- `src/` reuse greps (2 placeholder files): `Transport|ApiError|withTimeout` → 0; `useDraft|DraftProvider|draftReducer` → 0; `useRecipients|joinRecipients|roleLabel` → 0; `PrimaryButton|TextButton|TextField|ChoiceGroup|ScreenScaffold|PhotoPicker` → 0; `processPhoto|photoFileFor|devWarn|announce|newId` → 0; `Idempotency-Key` → 0
- plan.md self-duplication: `recipients.recipients.find(...)?.displayName ?? "your practice"` → 2; `const IDEMPOTENCY_HEADER = "Idempotency-Key"` → 2; `{ practiceId: "prc-0421", latencyMs: 0, faults: {}, forceOffline: false }` → 3; `accessibilityRole="alert"` on Views → 3; `*ByRole("alert")` → 11; `*ByRole("radiogroup")` → 7
- expo-router 57.0.21 (installed): `_ctx.ios.js` context regex → matches every `.tsx` under the app root; `getRoutesCore.js:30-33` (`validateRouteTreeExports` in dev when import mode is `sync` and `ignoreRequireErrors` is unset) + `:498-517` (requires every route module) + `useStore.js:28-34` (no `ignoreRequireErrors`) + `:538-540` (`test` is not a platform suffix → file kept as a route) + `:350-355` (second `_layout.*` in a directory throws); `usePreventRemove` → `build/react-navigation/core/usePreventRemove.d.ts:8` (exported via `expo-router/react-navigation`); `dismissTo` → `global-state/router.d.ts:8`; `headerBackButtonDisplayMode` → `native-stack/types.d.ts:409`; `unstable_settings.anchor` → `getRoutesCore.js:655`; `renderRouter` options = RNTL `RenderOptions` (has `wrapper`) + `initialUrl` → `testing-library/index.d.ts`; `headerLeft` consumed by `native-stack/views/useHeaderConfigProps.js`
- react-native 0.86.3: `Switch.js:255` defaults `accessibilityRole` to `switch`; `Pressable.js:252` sets `accessible`; `AccessibilityInfo.d.ts:174` `sendAccessibilityEvent(handle: HostInstance, …)`; expo-modules-core `PermissionsInterface.d.ts:1-13` string enum `PermissionStatus`; `expo/package.json` depends on `expo-font` and `expo-file-system` (T021 uninstall is safe)
- not-installed packages, fetched to the scratchpad with `npm pack`: RNTL 13.3.3 `helpers/accessibility.js:88-100` (`isAccessibilityElement`: `accessible` prop or host Text/TextInput/Switch only), `queries/role.js:32` (role query gated on it), `index.js:7` (matchers auto-registered; no `toHaveAccessibilityHint` in `build/matchers`); babel-jest 29.7 `build/index.js:101,210` (always adds babel-preset-jest) + babel-plugin-jest-hoist 29.6.3 `build/index.js:142-176` (out-of-scope variable rule); jest-expo 57.0.5 `jest-preset.js` (babel-jest transform); expo-image-picker 57.0.17 `ImagePicker.d.ts:35,47` (hooks return a 3-tuple); react-query 5.102.8 `useQueries.d.ts:52` (`combine`), `UseMutationResult` has no `options`; expo-image-manipulator 57.0.17 `ImageRef extends SharedRef` (`release()` exists)
- `tsc` 6.0.3 probes (scratchpad, repo `tsconfig` + overlay `node_modules`): 16 plan idioms checked; compile: `Platform.OS = "android"`, `let outcome;` assigned in an `act` callback, `observed!` after closure assignment, `React.ReactNode` without import, `View`/`TextInput` refs into `Focusable`, `ref` prop on function components, `wrapper: ({ children }) => …`, `useQueries({ combine })`, `getByRole(…, { disabled, busy })`, `release()`; fail: zod `parse<T>(schema: z.ZodType<T>)` (infers the input type), `useMediaLibraryPermissions` mock with `status: "denied"` literal, `manipulate()` with no argument, `toHaveAccessibilityHint`, `result.current.options`

| ID | Severity | Category | Location | Finding |
|----|----------|----------|----------|---------|
| C1 | CRITICAL | spec-compliance | plan.md:4883 (T015 Files) | Screen tests placed inside `src/app` become expo-router routes; dev boot requires them and `_layout.test.tsx` throws a layout conflict |
| C2 | CRITICAL | tests | plan.md:5084 (T015 `_layout.tsx`) | `EConsultLayout` mounts a fresh `DraftProvider` that shadows the test draft, so every preset-draft screen test in T016–T019 fails |
| C3 | CRITICAL | tests | plan.md:161-192 (T001 `jest.setup.ts`) | `jest.mock` factories reference module-scope `uuidCounter` / `grantedPermission`; babel-plugin-jest-hoist rejects the setup file, every suite fails |
| C4 | CRITICAL | tests | plan.md:3970 (T012 `OfflineBanner.tsx`) | `getByRole("alert")` / `getByRole("radiogroup")` target plain `View`s; RNTL 13.3.3 only matches roles on accessibility elements |
| C5 | CRITICAL | standards | plan.md:1337 (T004 `services.ts`) | `parse<T>(schema: z.ZodType<T>)` infers zod 4's input type; `Services` return types are wrong and `tsc` fails |
| C6 | CRITICAL | tests | plan.md:4638 (T014 test) | `status: "denied"` literal is not a `PermissionStatus`; T011 test calls `manipulate()` with no argument — both fail `tsc` |
| W1 | WARNING | ambiguity | plan.md:274 (first "If … then" hedge) | Six conditional fallbacks are decidable now; two point at APIs that do not exist |
| W2 | WARNING | spec-compliance | plan.md:5361 (T016 Step 4) | Fallback adds a second Home button in the body, contradicting spec.md:72 (header-left action) |
| W3 | WARNING | tests | plan.md:5993 (T019 route map) | "cannot be left by going back" has no screen to go back to; the guard is never exercised |
| W4 | WARNING | spec-compliance | plan.md:4809-4818 (T014 preparing branch) | Remove and a newer pick are unreachable while a photo is `preparing`, contradicting spec.md:105/126 |
| W5 | WARNING | consistency | plan.md:5060 (T015 `index.tsx`) | `__DEV__` read directly in two screens although spec SC7 and `devWarn.ts` say it lives in one helper; the `Redirect` branch is untestable |
| W6 | WARNING | reuse | plan.md:5843 (T018 `recipientName`) | Verbatim duplicates across tasks: recipient-name lookup, `IDEMPOTENCY_HEADER`, settings literal and four wrapper helpers |
| W7 | WARNING | tests | plan.md:2606 (T008 useRecipients tests) | SC6 "care team error" and spec:113 single-recipient preselect have no test; two assertions are tautologies |
| I1 | INFO | consistency | plan.md:640 (T002 Step 8) | Expected test counts are wrong in T002, T005, T006, T012, T013 |
| I2 | INFO | consistency | plan.md:26-60 (File Structure) | Table omits `errorCopy.ts` and `src/test/providers.tsx`; line 60 will conflict with C1's fix |
| I3 | INFO | scope-creep | plan.md:238-248 (`.prettierignore`) | `prettier --write .` reaches `.claude/` and `.serena/`, outside T001's fence |
| I4 | INFO | spec-compliance | plan.md:6381 (T020 `Switch`) | Dev-settings `Switch` is under 48 pt; `PhotoPicker` stays interactive while sending |

### C1 — Test files inside `src/app` are routes; the dev build requires them at startup
- **Severity:** CRITICAL
- **Category:** spec-compliance
- **Location:** plan.md:4883 (T015 Files), also :4886, :5137, :5381, :5584, :5969, :6164 and the rule at :60
- **Finding:** T015–T020 create `src/app/index.test.tsx`, `src/app/econsult/_layout.test.tsx`, `recipient.test.tsx`, `questions.test.tsx`, `message.test.tsx`, `sent.test.tsx`, `dev-settings.test.tsx`. expo-router's route context (`node_modules/expo-router/_ctx.ios.js`) is `require.context(APP_ROOT, true, /^(?:\.\/)(?!…\+api|\+html|\+middleware…).*\.[tj]sx?$/)` — every `.tsx` under `src/app` is a route candidate; `getRoutesCore.js:538-540` only strips a suffix when it is a platform (`validPlatforms.has("test")` is false), so `index.test.tsx` becomes route `index.test`, and `_layout.test.tsx` is classified as a layout (`filenameWithoutExtensions === "_layout"`) that shares specificity 0 with `_layout.tsx` → `getRoutesCore.js:355` throws `The layouts "./econsult/_layout.test.tsx" and "./econsult/_layout.tsx" conflict`. Even without that file, `useStore.js:28-34` calls `getRoutes` without `ignoreRequireErrors`, so in development with the default `sync` import mode `validateRouteTreeExports` (`getRoutesCore.js:30-33, 498-517`) `require`s every route module at boot — the test modules run `describe(...)` with no jest globals and crash the app. Metro also bundles `expo-router/testing-library` and RNTL into the app.
- **Why:** The deliverable is "runs from a clean clone with `npx expo start`" (spec.md:18); after T015 the app no longer starts in Expo Go. The per-task verify (`npx jest src/app`, `tsc`, lint) cannot catch it because nothing runs the router context.
- **Suggested fix:**
  ```
  # Keep screens in src/app; move their tests to a mirror directory jest already matches:
  src/__tests__/app/index.test.tsx                (was src/app/index.test.tsx)
  src/__tests__/app/dev-settings.test.tsx
  src/__tests__/app/econsult/_layout.test.tsx
  src/__tests__/app/econsult/recipient.test.tsx
  src/__tests__/app/econsult/questions.test.tsx
  src/__tests__/app/econsult/message.test.tsx
  src/__tests__/app/econsult/sent.test.tsx
  # In those files replace the relative screen imports:
  import HomeScreen from "@/app/index";
  import EConsultLayout, { unstable_settings } from "@/app/econsult/_layout";
  import RecipientScreen from "@/app/econsult/recipient";   # etc.
  # Update the Files blocks of T015–T020, every "Run: npx jest src/app/..." line
  # (→ npx jest src/__tests__/app/...), and plan.md:60:
  "Tests sit next to the file they test as <name>.test.ts(x), except route files: expo-router
  treats every .tsx under src/app as a route, so screen tests live under src/__tests__/app/."
  # collectCoverageFrom already excludes *.test.tsx, so the src/app coverage threshold is unchanged.
  ```
- **Needs user:** no

### C2 — `EConsultLayout`'s own `DraftProvider` shadows the draft the tests preset
- **Severity:** CRITICAL
- **Category:** tests
- **Location:** plan.md:5084 (`src/app/econsult/_layout.tsx`), plan.md:3644 (`TestProviders`), consumers at :5226, :5406-5417, :5635-5652, :5989-5998
- **Finding:** `TestProviders` wraps the whole `renderRouter` tree in `<DraftProvider initial={draft}>`, but every screen test also registers the real `"econsult/_layout": EConsultLayout`, which mounts `<DraftProvider>` with `initialDraft` *inside* the router. `useDraft()` resolves the nearest provider, so `recipientId: "ct-11"`, preset answers, `photo`, `econsultId` and `message` never reach the screens. Concretely: T016 "leaving with a typed message" has no message so the guard is off; T017 "an optional question can be left empty" loses its preset answer and fails validation; all nine T018 tests wait for "To: Dr. J. de Vries" but render "To: your practice" and `onSend` returns early on `!draft.recipientId`; all five T019 tests render `Reference: null` and no attachment state. Only `_layout.test.tsx` (expects "no recipient") passes.
- **Why:** Sixteen of the plan's twenty-five screen tests cannot pass as written; the implementer of T016 hits it first with no hedge in the plan.
- **Suggested fix:**
  ```tsx
  // src/test/providers.tsx (T012): drop `draft` from ProviderOptions and add
  import { Stack } from "expo-router";
  // The real EConsultLayout mounts its own DraftProvider, which would shadow a test draft,
  // so router tests mount this layout with the preset draft instead.
  export function flowLayoutWith(draft?: DraftState) {
    return function TestFlowLayout() {
      return (
        <DraftProvider initial={draft}>
          <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
            <Stack.Screen name="sent" options={{ headerBackVisible: false, gestureEnabled: false }} />
          </Stack>
        </DraftProvider>
      );
    };
  }
  // T016–T019 route maps:
  "econsult/_layout": flowLayoutWith(draft),   // instead of EConsultLayout
  // and the wrapper becomes <TestProviders settings={settings} client={client}> (no draft).
  // _layout.test.tsx keeps covering the real EConsultLayout and unstable_settings.anchor.
  ```
- **Needs user:** no

### C3 — `jest.setup.ts` mock factories reference out-of-scope variables
- **Severity:** CRITICAL
- **Category:** tests
- **Location:** plan.md:161-168 (`uuidCounter`), plan.md:182-192 (`grantedPermission`)
- **Finding:** jest-expo's transform is `babel-jest` (jest-expo 57.0.5 `jest-preset.js`), which always appends `babel-preset-jest` (`babel-jest/build/index.js:101,210`), whose hoist plugin rejects a `jest.mock` factory that reads a module-scope binding not prefixed with `mock` (`babel-plugin-jest-hoist/build/index.js:142-176`: "The module factory of `jest.mock()` is not allowed to reference any out-of-scope variables. Invalid variable access: uuidCounter"). The `expo-crypto` factory reads `uuidCounter`; the `expo-image-picker` factory reads `grantedPermission`. The setup file fails to transform, so T001 Step 6 and every later suite fail before the first assertion — and neither of Step 6's two hedges covers this error.
- **Why:** The whole test strategy is gated on T001's smoke test; the implementer would report `BLOCKED` on a misdiagnosis (the plan tells them the RNTL pin is at fault).
- **Suggested fix:**
  ```ts
  let mockUuidCounter = 0;
  jest.mock("expo-crypto", () => ({
    randomUUID: jest.fn(() => {
      mockUuidCounter += 1;
      return `uuid-${mockUuidCounter}`;
    }),
  }));
  const mockGrantedPermission = { granted: true, status: "granted", canAskAgain: true, expires: "never" };
  jest.mock("expo-image-picker", () => ({
    useCameraPermissions: jest.fn(() => [mockGrantedPermission, jest.fn(async () => mockGrantedPermission), jest.fn(async () => mockGrantedPermission)]),
    useMediaLibraryPermissions: jest.fn(() => [mockGrantedPermission, jest.fn(async () => mockGrantedPermission), jest.fn(async () => mockGrantedPermission)]),
    launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: null })),
    launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: null })),
    PermissionStatus: { GRANTED: "granted", UNDETERMINED: "undetermined", DENIED: "denied" },
  }));
  ```
  (The `PermissionStatus` export is needed by C6's fix; the hooks return three elements per `ImagePicker.d.ts:35,47`.)
- **Needs user:** no

### C4 — Role queries on plain `View`s cannot match in RNTL 13.3.3
- **Severity:** CRITICAL
- **Category:** tests
- **Location:** plan.md:3970 (`OfflineBanner`), :4408 (`ChoiceGroup` radiogroup), :4564 (`ErrorState`), :6123 (`sent.tsx` warning box); assertions at :3743, :3794, :3813, :3823, :4189, :4207, :4267, :5212, :5424, :5434, :5438, :5447, :5462, :5735, :5747, :6036, :6038, :6042
- **Finding:** `queries/role.js:32` requires `isAccessibilityElement(node)`, which (`helpers/accessibility.js:88-100`) is true only when `props.accessible` is set or the host is `Text`/`TextInput`/`Switch`/`Image` with `alt`. The four `View`s above carry `accessibilityRole` but not `accessible`, so `getByRole("alert")` and `getByRole("radiogroup")` return nothing. research.md:974 already records this rule. Note that simply adding `accessible` to `ErrorState`, the sent warning box or the `ChoiceGroup` group would merge their buttons/radios into one VoiceOver element, so the fix must keep interactive children as siblings.
- **Why:** Eleven `*ByRole("alert")` and seven `*ByRole("radiogroup")` assertions across T012, T013, T016, T017, T018, T019 fail; SC3 ("accessibility-first test queries") depends on the queries being right.
- **Suggested fix:**
  ```tsx
  // OfflineBanner.tsx — text only, safe to group:
  <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.banner}>
  // StatusViews.tsx ErrorState — group the texts, keep the button a sibling:
  <View style={[styles.stack, styles.errorBox]}>
    <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.stack}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
    <PrimaryButton label={RETRY_LABEL} onPress={onRetry} />
  </View>
  // sent.tsx — same shape: <View accessible accessibilityRole="alert"><Text>{PHOTO_FAILED}</Text></View>
  // followed by the two buttons as siblings inside styles.warning.
  // ChoiceGroup.tsx — do NOT add `accessible` (radios must stay focusable); query by label instead:
  expect(screen.getByLabelText("How long? (required)")).toBeOnTheScreen();          // T013
  expect(screen.getByLabelText(`How long?. Error: ${REQUIRED_ERROR}`)).toBeOnTheScreen();
  await screen.findByLabelText(CHOICE);                                             // T017 (all five sites)
  expect(screen.getByLabelText(`${CHOICE}. Error: ${REQUIRED_ERROR}`)).toBeOnTheScreen();
  ```
- **Needs user:** no

### C5 — `parse<T>(schema: z.ZodType<T>)` infers zod 4's *input* type
- **Severity:** CRITICAL
- **Category:** standards
- **Location:** plan.md:1337-1343 (`src/api/services.ts`)
- **Finding:** With zod 4.6.2 (`v4/classic/schemas.d.ts:7`: `ZodType<out Output, out Input, out Internals extends $ZodTypeInternals<Output, Input>>`), `tsc` 6.0.3 infers `T` from `practiceConfigSchema` as `{ practiceId: string; recipientIds: string[]; questions: unknown[] }` and from `careTeamMemberSchema.array()` as `{ id: string; displayName: string; role?: unknown }[]` — the pre-`preprocess`/pre-`catch` input shapes — so `getPracticeConfig`/`getCareTeam` do not satisfy `Services` (TS2322, reproduced in the scratch probe). `withTimeout`'s `T` then carries the wrong type into every consumer.
- **Why:** T004's `npm run typecheck` fails; if the implementer "fixes" it with a cast, the typed contract the spec promises (spec.md:41) is silently lost.
- **Suggested fix:**
  ```ts
  function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new ApiError("validation", "The server sent a response the app could not read");
    }
    return result.data;
  }
  ```
  (verified: both call sites then type-check against `PracticeEConsultConfig` and `CareTeamMember[]`; `import type { z } from "zod"` stays valid.)
- **Needs user:** no

### C6 — Two test files fail strict `tsc`: `PermissionStatus` literal and `manipulate()` arity
- **Severity:** CRITICAL
- **Category:** tests
- **Location:** plan.md:4638 and :4702 (`PhotoPicker.test.tsx`); plan.md:3422 (`photo.test.ts`)
- **Finding:** `const denied = { …, status: "denied", … } as const` is not assignable to `PermissionResponse` because `PermissionStatus` is a string enum (`expo-modules-core/build/PermissionsInterface.d.ts:1-13`); `jest.mocked(useMediaLibraryPermissions).mockReturnValue([denied, jest.fn(async () => denied), jest.fn()])` produces two TS2322 errors (reproduced). In `photo.test.ts`, `manipulate.mock.results[0]?.value ?? manipulate()` calls `ImageManipulator.manipulate` with zero arguments → TS2554 (reproduced). The deep-mock property access `context.renderAsync.mock…` does type-check, so only these lines are wrong.
- **Why:** `tsconfig.json` includes `**/*.tsx`, so both tasks' `npm run typecheck` verify exits non-zero.
- **Suggested fix:**
  ```ts
  // PhotoPicker.test.tsx
  const denied = { granted: false, status: ImagePicker.PermissionStatus.DENIED, canAskAgain: false, expires: "never" as const };
  jest.mocked(ImagePicker.useMediaLibraryPermissions).mockReturnValue([denied, jest.fn(async () => denied), jest.fn(async () => denied)]);
  // photo.test.ts
  const context = manipulate("file:///cache/original.jpg");
  context.renderAsync.mockRejectedValueOnce(new Error("decode failed"));
  ```
  (C3's mock must export `PermissionStatus` for the first line.)
- **Needs user:** no

### W1 — Conditional fallbacks that are decidable now, two of them pointing at APIs that do not exist
- **Severity:** WARNING
- **Category:** ambiguity
- **Location:** plan.md:274 (T001), :2791 (T008), :3342 (T010), :4094 (T012), :4862 (T014), :5564 (T017)
- **Finding:** Every "if X fails, do Y" was verified against the installed or packed sources: (1) T001 — RNTL 13.3.3 registers its matchers in `build/index.js:7`; the fallback path `@testing-library/react-native/matchers` does not exist (the real subpath is `extend-expect`), so following it produces a module-not-found. (2) T008 — `combine: combineRecipients` type-checks as written; drop the cast hedge. (3) T010 — `UseMutationResult` has no `options` (TS2339 reproduced); at runtime `undefined ?? "always"` makes the assertion a tautology, so the failure surfaces only in Step 5's `tsc`. (4) T012 — `toHaveAccessibilityHint` does not exist (TS2551 reproduced); the fallback is the only option. (5) T014 — the hook returns three elements; keep the mock, drop the hedge. (6) T017 — `View`/`TextInput` refs are assignable to `Focusable` (`HostInstance`, probe compiled); drop the widening hedge.
- **Why:** Canon: no placeholders in a plan; each hedge is a decision pushed onto an implementer who sees one task, and two of them lead to a dead end.
- **Suggested fix:**
  ```
  T001 Step 6: delete the `@testing-library/react-native/matchers` sentence (keep the BLOCKED clause).
  T008 Step 4 / T014 Step 4 / T017 Step 4: delete the hedge sentences.
  T010 useSubmit.test.tsx: delete `expect(result.current.options?.networkMode ?? "always").toBe("always");`
    and rename the test to "resolves the outcome and reports the created id".
  T012 PrimaryButton.test.tsx: expect(button.props.accessibilityHint).toBe("Choose a recipient first");
  ```
- **Needs user:** no

### W2 — T016's fallback puts a second Home button in the body
- **Severity:** WARNING
- **Category:** spec-compliance
- **Location:** plan.md:5361 (T016 Step 4)
- **Finding:** If the header-left button is not in the jest tree, the plan tells the implementer to also render the `TextButton` "as the first child inside the scaffold" — a production UI change (two Home controls on step 1) triggered by a test-environment doubt, and the sentence itself is garbled ("when `result.status !== "ready"` is false"). The vendored native stack does render `headerLeft` through `views/useHeaderConfigProps.js` → `ScreenStackHeaderLeftView`, so the button is likely present, but the fallback must not change the screen either way.
- **Why:** spec.md:72 and :101 define one labelled Home action in the header; a duplicate control also doubles the VoiceOver swipe order.
- **Suggested fix:**
  ```
  Replace the Step 4 hedge with a test-side fallback:
  "If the header button is not in the test tree, drive the guard directly:
     import { router } from "expo-router";
     act(() => router.dismissTo("/"));
   and keep the Alert / pathname assertions. Do not change the screen."
  ```
- **Needs user:** no

### W3 — The confirmation screen's back-guard test has nothing to go back to
- **Severity:** WARNING
- **Category:** tests
- **Location:** plan.md:5993 (T019 route map), :6013-6020, :6144 (hedge)
- **Finding:** The route map registers only `index` and `econsult/sent`; `unstable_settings.anchor = "recipient"` cannot insert a `recipient` route that does not exist in the context, so the nested stack is `[sent]` and `testRouter.back()` has no target. The test passes (or, per the hedge, is reduced to `not.toThrow()`) without `usePreventRemove` ever preventing anything — the one behaviour spec.md:107/141 singles out for the Android back gesture.
- **Why:** A test that cannot fail is not evidence; this is the guard the platform lens (spec.md:175) calls out as iOS-only otherwise.
- **Suggested fix:**
  ```tsx
  // T019 renderSent: register a step under the confirmation so back has a target
  { index: Home, "econsult/_layout": flowLayoutWith(draft), "econsult/recipient": () => <Text>recipient</Text>, "econsult/sent": SentScreen }
  // and render with initialUrl "/econsult/recipient", then act(() => router.replace("/econsult/sent"))
  // before the assertions; the "cannot be left" test then does
  act(() => router.back());
  expect(screen).toHavePathname("/econsult/sent");
  // and a sibling test proves the guard is what held: after user.press(Done) → pathname "/".
  ```
- **Needs user:** no

### W4 — Remove and a newer pick are unreachable while a photo is preparing
- **Severity:** WARNING
- **Category:** spec-compliance
- **Location:** plan.md:4809-4818 (`PhotoPicker` preparing branch), test at :4715-4720
- **Finding:** spec.md:105 and :126: "Remove during preparation discards the result when it arrives; a newer pick supersedes an older one, so only the latest pick's result is kept." The reducer (T007) implements both, but the component renders only a spinner and the label in the `preparing` state — no Remove button, no pick buttons — and the test asserts `CHOOSE_PHOTO_LABEL` is absent. Two spec'd behaviours have no UI path and therefore no screen-level test; a slow manipulator leaves the patient with nothing to do but wait.
- **Why:** Coverage gap spec → tasks; the reducer tests for `photoRemoved`/superseded picks cover code the app never triggers.
- **Suggested fix:**
  ```tsx
  if (photo?.status === "preparing") {
    return (
      <View style={styles.stack}>
        <View style={styles.row}>
          <ActivityIndicator color={colors.primary} />
          <Text accessibilityLiveRegion="polite" style={styles.body}>{PREPARING_LABEL}</Text>
        </View>
        <TextButton label={REMOVE_PHOTO_LABEL} onPress={onRemove} />
      </View>
    );
  }
  // test: "shows the preparing state as a live region and still offers Remove" →
  // expect(screen.getByRole("button", { name: REMOVE_PHOTO_LABEL })).toBeOnTheScreen();
  // Superseding: keep the pick buttons hidden (one photo at a time, spec.md:125) and state that in DECISIONS.md,
  // or render them too — either way the plan must say which and test it.
  ```
- **Needs user:** no

### W5 — `__DEV__` is read in two screens although the spec pins it to one helper
- **Severity:** WARNING
- **Category:** consistency
- **Location:** plan.md:5060 (`index.tsx`), plan.md:6343 (`dev-settings.tsx`), plan.md:1709 (`devWarn.ts` comment "The one __DEV__ guard in the app")
- **Finding:** spec.md:207 (SC7): "the `__DEV__` guard lives in the single `src/lib/devWarn.ts` helper, whose test sets `globalThis.__DEV__ = false`". The plan's own `devWarn.ts` comment repeats it, then `index.tsx` and `dev-settings.tsx` branch on `__DEV__` directly; the `Redirect` branch and the hidden link are untestable without toggling the global in screen tests, and the plan's coverage self-review does not mention them.
- **Why:** Internal contradiction between T005 and T015/T020; the release-only branches stay unexercised.
- **Suggested fix:**
  ```ts
  // src/lib/devWarn.ts
  export function isDevelopmentBuild(): boolean { return __DEV__; }
  export function devWarn(message: string): void { if (!isDevelopmentBuild()) return; console.warn(message); }
  // devWarn.test.ts gains: test("isDevelopmentBuild follows __DEV__", …) for both values.
  // index.tsx / dev-settings.tsx: import { isDevelopmentBuild } and branch on isDevelopmentBuild();
  // screen tests: jest.spyOn(devWarnModule, "isDevelopmentBuild").mockReturnValue(false) to cover the Redirect.
  ```
- **Needs user:** no

### W6 — Verbatim duplication between tasks
- **Severity:** WARNING
- **Category:** reuse
- **Location:** plan.md:5843-5846 and :6103-6106 (`recipientName`), :1040 and :1325 (`IDEMPOTENCY_HEADER`), :1473-1477 / :1802-1806 / :2535-2542 / :3167-3175 (`wrapperWith`), :2532 / :3168 / :3633 (settings literal)
- **Finding:** The three-line recipient-name lookup is copied character-for-character into `message.tsx` and `sent.tsx`; the `Idempotency-Key` header name — a contract detail — is declared in both `fakeTransport.ts` and `services.ts`; four tests hand-roll a `wrapperWith` provider stack and three repeat the `{ practiceId: "prc-0421", latencyMs: 0, faults: {}, forceOffline: false }` literal before `src/test/providers.tsx` (`testSettings`, `TestProviders`) appears in T012. The reuse map's claim "no task creates a helper an earlier task already provides" holds only because the shared helper arrives late.
- **Why:** Canon DRY ("extract only real repetition" — this is real, and cross-task); a change to the header name or the recipient fallback copy now has two homes.
- **Suggested fix:**
  ```ts
  // src/features/econsult/recipients.ts (T008)
  export const UNKNOWN_RECIPIENT = "your practice";
  export function recipientNameFor(result: RecipientsResult, recipientId: string | null): string {
    if (result.status !== "ready") return UNKNOWN_RECIPIENT;
    return result.recipients.find((r) => r.id === recipientId)?.displayName ?? UNKNOWN_RECIPIENT;
  }
  // src/api/contracts.ts (T002): export const IDEMPOTENCY_HEADER = "Idempotency-Key"; import it in T003 and T004.
  // Move src/test/providers.tsx (minus DraftProvider, see C2) into T006, right after DevSettingsProvider exists;
  // T008 and T010 tests then use TestProviders/testSettings instead of their own wrappers.
  ```
- **Needs user:** no

### W7 — Two spec'd states without a test, two assertions that cannot fail
- **Severity:** WARNING
- **Category:** tests
- **Location:** plan.md:2606-2612 (T008 useRecipients error test), plan.md:5319-5324 (T016 preselect effect), plan.md:3150-3152 (T010 "ApiError is the only error class"), plan.md:3198 (T010 `options` tautology)
- **Finding:** SC6 (spec.md:206) lists "care team error" as a state "covered by a test"; the only hook/screen-level fault test is `config: "server"` (T008, T016) — the care-team branch of `combineRecipients.retry` is reached only through the transport test. spec.md:113 "exactly one writable recipient … preselected" has a dedicated effect in `recipient.tsx` but no fixture has one writable recipient and no test mocks one, so the effect's dependency logic is unverified. `expect(new ApiError(...)).toBeInstanceOf(ApiError)` tests the constructor, not `retryAttachment`; the `options?.networkMode ?? "always"` assertion always passes.
- **Why:** Canon Testing bar ("tests that read like acceptance criteria", spec.md:16); tautologies inflate the count the plan reports.
- **Suggested fix:**
  ```tsx
  // useRecipients.test.tsx
  test("reports an error when the care team request fails", async () => {
    const { result } = renderHook(() => useRecipients(), { wrapper: wrapperWith(settings({ faults: { careTeam: "server" } })) });
    await waitFor(() => expect(result.current.status).toBe("error"));
  });
  // recipient.test.tsx
  test("preselects the only writable recipient", async () => {
    jest.spyOn(useRecipientsModule, "useRecipients").mockReturnValue({ status: "ready", questions: [], recipients: [{ id: "ct-44", displayName: "Dr. A. Visser", role: "gp" }] });
    renderFlow();
    expect(await screen.findByRole("radio", { name: "Dr. A. Visser, GP", checked: true })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled();
  });
  // submit.test.ts: delete "ApiError is the only error class it converts" (the TypeError test already proves it).
  ```
- **Needs user:** no

### I1 — Expected test counts are wrong
- **Severity:** INFO
- **Category:** consistency
- **Location:** plan.md:640 (T002 "10" → 11), :1729 (T005 "13" → 17), :2035 (T006 "15" → 16), :4094 (T012 "9" → 10), :4586 (T013 "20" → 21)
- **Finding:** Counting the `test`/`test.each` cases in the listed files gives the numbers on the right (T002: 1+3+3+4; T005: 4+5+2+3+2+1; T006: 7+2+1+1+5; T012: 4+1+1+1+3; T013: 10+3+3+2+3). An implementer who sees 11 where 10 is "expected" may hunt for a duplicate.
- **Why:** Self-contained tasks should carry correct expectations.
- **Suggested fix:** Replace the five numbers as above.
- **Needs user:** no

### I2 — File Structure table and the colocation rule are incomplete
- **Severity:** INFO
- **Category:** consistency
- **Location:** plan.md:26-60
- **Finding:** `src/features/econsult/errorCopy.ts` (T018) and `src/test/providers.tsx` (T012) are created but not in the table; line 60's "tests sit next to the file they test" needs the exception from C1. Orphans checked against the spec and found justified: `STALE_TIME_MS` (not in spec, harmless with the cache-clear on Apply), `presentation: "modal"` for dev-settings, `unstable_settings.anchor`.
- **Why:** The table is the implementer's map.
- **Suggested fix:** Add the two rows; amend line 60 per C1.
- **Needs user:** no

### I3 — `npm run format` reaches outside T001's fence
- **Severity:** INFO
- **Category:** scope-creep
- **Location:** plan.md:238-248 (`.prettierignore`), plan.md:80 (fence)
- **Finding:** `prettier --write .` will visit the tracked `.claude/settings.json` (not in the fence; currently already prettier-shaped, so probably a no-op) and the untracked, globally-ignored `.serena/*.yml` (YAML is formatted by prettier). Neither is listed in `.prettierignore`.
- **Why:** A rewritten out-of-fence file stops the step.
- **Suggested fix:** Append `.claude` and `.serena` to `.prettierignore`.
- **Needs user:** no

### I4 — Two small touch/sending gaps
- **Severity:** INFO
- **Category:** spec-compliance
- **Location:** plan.md:6381-6385 (`Switch`), plan.md:5918-5923 (`PhotoPicker` during send)
- **Finding:** The dev-settings `Switch` row has no 48-pt minimum (spec.md:149 "every interactive element"; development-only screen, so arguably exempt — say so in DECISIONS.md or wrap the row in a `Pressable` with `minHeight: MIN_TOUCH` that toggles the value). While `submit.isPending` the text field is read-only but `PhotoPicker` still accepts picks/removes (spec.md:105 "the fields are read-only"); pass `disabled={submit.isPending}` through to its buttons.
- **Why:** Minor; listed so the choice is explicit.
- **Suggested fix:** As above.
- **Needs user:** no

**Possibly dismissed:** none

**Summary:** The plan is unusually complete — every task is genuinely self-contained, TDD order holds throughout, no task commits, the transport's abort/timeout semantics (T003) and the services (T004) agree, `usePreventRemove`/`dismissTo`/`headerBackButtonDisplayMode`/`anchor`/`renderRouter` `wrapper` all exist in the vendored expo-router, and the T007 reducer covers the whole photo lifecycle. It fails because of environment facts it never checked: screen tests placed inside `src/app` become routes and crash the dev build (C1), the real `EConsultLayout` shadows every preset test draft (C2), and the jest setup file trips the hoist plugin (C3) — fix those three first, then the RNTL role gate (C4), the zod generic (C5) and the two typing slips (C6); the coverage matrix is otherwise sound (gaps: W4, W7), and no task creates what an earlier task already provides beyond the W6 duplicates.
