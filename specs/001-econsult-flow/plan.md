# E-consult Submission Flow Implementation Plan

> **For agentic workers:** this plan is executed by the `/lets-implement` flow, one task per implementer dispatch, inside a hook-enforced file fence. Each task's implementer sees only that task's text, so every task is self-contained: exact files, the interfaces it consumes from earlier tasks, the interfaces it produces for later ones, tests first, then the implementation, then the scoped verify commands. Steps use checkbox (`- [ ]`) syntax. **No task commits**: the flow commits at its gates.

Revision 2, after plan-checker round 1 (`checker/plan-r1.md`): screen tests moved out of the route directory, a test-only flow layout that carries a preset draft, hoist-safe jest mocks, role queries only on accessibility elements, the zod output type in the services, and the smaller findings. Revision 2.1, after spec-checker round 4 (`checker/spec-r4.md`): the timeout helper decides on its own aborted signal instead of the error's name (`isAbortError` removed), the photo processor keeps the original when the picker reports a zero dimension instead of asking for a bound that could upscale, and the decisions text no longer claims a `FetchError` on every abort. Revision 3, after plan-checker round 2 (`checker/plan-r2.md`): a typed manipulator mock, `userEvent` imported from Testing Library, ambient types for expo-router's runtime matchers, a typed failure test in the photo task, six branch tests for the coverage thresholds, a radio group around the recipient cards, shared text styles in `src/theme/text.ts`, and every function under fifty lines. Revision 3.1, after plan-checker round 3 (`checker/plan-r3.md`): the missing `STEP_TITLES` import in the recipient test, a typed `ready` result in the recipients test, two more `src/api` coverage tests, `text.muted` at its last three sites, and the photo views renamed so they do not shadow the draft's `ReadyPhoto` type.

**Goal:** One complete e-consult path in Expo Go on the iOS simulator, from a clean clone with `npx expo start`: choose a recipient, answer the practice's questions, write the message, optionally add a downscaled photo, see a clear confirmation, with loading, empty, error, sending, offline and partial-failure states, usable with VoiceOver and the largest text sizes.

**Architecture:** expo-router native stack with a nested `econsult` group whose layout owns the draft (a pure reducer in React context) and the flow's header. TanStack Query over a typed `Transport` interface with one shipped implementation, an in-process fake with latency, faults and abort support; zod schemas at the boundary. Screens are thin: they compose a small set of accessible components and call feature hooks. A development-only settings screen switches practice, latency, faults and offline at runtime.

**Tech Stack:** Expo SDK 57 (expo 57.0.22, expo-router 57.0.21), React Native 0.86.3, React 19.2.3, TypeScript 6.0.3, @tanstack/react-query 5, zod 4, expo-image-picker, expo-image-manipulator, expo-network, expo-crypto, expo-device, expo-image; jest-expo 57 with @testing-library/react-native 13.3.3; eslint-config-expo 57 with prettier.

**Spec:** `specs/001-econsult-flow/spec.md` (how the code works today: `specs/001-econsult-flow/how-it-works.md`; platform facts: `specs/001-econsult-flow/research.md`).

## Global Constraints

- Runs in Expo Go on SDK 57: only packages pinned in `node_modules/expo/bundledNativeModules.json` or pure JavaScript may be added; no development build, no config plugin that must take effect for the app to work.
- Copy is English. Light appearance only. System font. Every interactive element has `minHeight` and `minWidth` of at least 48 (`MIN_TOUCH` in `src/theme/tokens.ts`); `allowFontScaling` is never set to false; `maxFontSizeMultiplier` is used only on the step counter chip and on buttons inside the native navigation bar (`HEADER_BUTTON_MAX_FONT_SCALE`), whose height iOS fixes.
- Every control has an accessible name; errors are folded into the field's accessible name, shown in a polite live region, and announced once.
- Reads: `networkMode: 'offlineFirst'`, `retry: 1`, `retryDelay: 1000`. The send mutation: `networkMode: 'always'`, `retry: 0`. Timeouts: 15 000 ms for reads and create, 45 000 ms for the upload, via `AbortController` plus `setTimeout`.
- Latency defaults: config 2000 ms, care team 1000 ms, create 1000 ms, upload 1000 ms. Fixtures: `prc-0421`, `prc-0873`, `prc-0000`.
- Photos: picker `quality: 1`; long edge bounded to 1600 px; JPEG at 0.7; a 0 width or height skips the downscale and keeps the original with a development warning.
- Coding canon: immutability (return new objects), functions under 50 lines, files under 400 lines, nesting at most 4 with early returns, no magic numbers (named constants), no `any`, no swallowed errors, boundary validation with zod.
- Tests: AAA structure, behaviour-describing names, accessibility-first queries (`getByRole`, `getByLabelText`). Coverage: 100 % statements and branches on `src/api`, `src/features`, `src/lib`; at least 90 % statements on `src/components` and `src/app`.
- Testing Library 13.3.3 matches `*ByRole` only on accessibility elements: a `Text`, `TextInput`, `Switch`, or a `View` with `accessible`. A `View` that groups only text may take `accessible`; a `View` that contains buttons or radios must not, because that would collapse its children into one element. Such groups are found with `*ByLabelText`.
- expo-router treats every `.tsx` under `src/app` as a route and requires each one at start-up in development, so no test file may live under `src/app`; screen tests live under `src/__tests__/app/`, mirroring the route path.
- Jest hoists `jest.mock` factories above imports; any module-scope variable a factory reads must be named with the `mock` prefix.
- The one `__DEV__` read in the app is `isDevelopmentBuild()` in `src/lib/devWarn.ts`; screens branch on that function so tests can stub it.
- Test tooling is hand-pinned (see Task 1); never run `npx expo install` for jest, Testing Library or the jest preset.
- Never commit. Never edit outside the task's file fence; an out-of-fence need is reported as `DIVERSION_NEEDED`.

## File Structure

| File | Responsibility |
|---|---|
| `src/api/contracts.ts` | zod schemas, inferred types and the `Idempotency-Key` header name for everything that crosses the wire |
| `src/api/transport.ts` | `Transport` interface, `ApiError`, `withTimeout` |
| `src/api/fake/fixtures.ts` | wire-shaped fixture data for three practices and their care teams |
| `src/api/fake/fakeTransport.ts` | in-process `Transport` with latency, faults, abort, idempotent create |
| `src/api/services.ts` | the four typed calls the app makes, with timeouts and zod parsing |
| `src/lib/queryClient.ts` | query client defaults |
| `src/lib/network.tsx` | `NetworkProvider`, `useIsOffline`, online-manager wiring |
| `src/lib/announce.ts` | screen-reader announcement and focus helpers |
| `src/lib/devWarn.ts` | `isDevelopmentBuild` and the single `__DEV__`-guarded warning helper |
| `src/lib/ids.ts` | `newId` over expo-crypto |
| `src/lib/devSettings.tsx` | env seeds, `DevSettingsProvider`, `ServicesProvider`, `useServices`, `useSession` |
| `src/lib/photo.ts` | `processPhoto` (downscale) and `photoFileFor` |
| `src/test/providers.tsx` | test-only provider stack (`TestProviders`, `renderWithProviders`, `hookWrapper`, `testSettings`) |
| `src/test/flowLayout.tsx` | test-only flow layout that mounts a preset draft (`flowLayoutWith`) |
| `src/test/expo-router-matchers.d.ts` | ambient types for the jest matchers expo-router registers at runtime (`toHavePathname` and friends) |
| `src/features/econsult/draft.ts` | draft state, actions, reducer, selectors |
| `src/features/econsult/DraftProvider.tsx` | context and `useDraft` |
| `src/features/econsult/queries.ts` | query options for config and care team (shared keys) |
| `src/features/econsult/recipients.ts` | `joinRecipients`, `roleLabel`, `recipientNameFor` |
| `src/features/econsult/useRecipients.ts` | combined loading, error, empty, ready result |
| `src/features/econsult/useQuestions.ts` | the practice's questions from the cached config |
| `src/features/econsult/validation.ts` | answer and message validation, the thin-message nudge |
| `src/features/econsult/steps.ts` | step count and numbering |
| `src/features/econsult/submit.ts` | create-then-upload, partial outcome, attachment retry |
| `src/features/econsult/useSubmit.ts` | the send mutation and the attachment retry mutation |
| `src/features/econsult/errorCopy.ts` | plain-language copy for send failures |
| `src/theme/tokens.ts` | colours, spacing, type scale, `MIN_TOUCH` |
| `src/theme/text.ts` | shared text styles (`text.title`, `text.heading`, `text.body`, `text.muted`) |
| `src/components/*.tsx` | `ScreenScaffold`, `PrimaryButton`, `TextButton`, `OfflineBanner`, `StepHeader`, `TextField`, `ChoiceGroup`, `RecipientCard`, `StatusViews`, `PhotoPicker` |
| `src/app/_layout.tsx` | providers and the root stack |
| `src/app/index.tsx` | home |
| `src/app/dev-settings.tsx` | developer settings |
| `src/app/econsult/_layout.tsx` | draft provider and the nested stack |
| `src/app/econsult/{recipient,questions,message,sent}.tsx` | the four steps |
| `src/__tests__/app/**` | the screen tests, mirroring `src/app` |

Tests sit next to the file they test as `<name>.test.ts` or `<name>.test.tsx`, except screen tests, which live under `src/__tests__/app/` because every `.tsx` under `src/app` is a route.

## Reuse Map (with evidence)

The tree holds two placeholder files (`src/app/_layout.tsx`, `src/app/index.tsx`), so there is nothing to extend. Searches run on 2026-09-11 over `src/`: `Grep` for `Transport|ApiError|useDraft|DraftProvider|useRecipients|PrimaryButton|TextField|ChoiceGroup|ScreenScaffold|processPhoto|devWarn|announce` → 0 hits each. Platform reuse follows the spec's Reuse Map exactly: expo-router `Stack`, `router.replace`, `router.dismissTo`, `usePreventRemove` from `expo-router/react-navigation`; `useSafeAreaInsets` (provider already mounted by expo-router); expo-image for the preview; `AccessibilityInfo`, `Pressable`, `useWindowDimensions` from React Native; TanStack Query, zod, expo-image-picker, expo-image-manipulator, expo-network, expo-crypto, expo-device. Every `Create:` below names a unit the platform does not provide. Shared helpers arrive before their first consumer: the test provider stack in Task 6, the recipient-name lookup in Task 8, the `Idempotency-Key` name in Task 2.

---

### Task 1: Test, lint, format and type-check tooling

**T001** · **Visual:** none — configuration only; the recorded verify runs are the evidence.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `jest.setup.ts`
- Create: `eslint.config.js`
- Create: `.prettierrc`
- Create: `.prettierignore`
- Create: `src/smoke.test.tsx`
- Modify (formatting only, by `npm run format`): `README.md`, `app.json`, `tsconfig.json`, `.vscode/settings.json`, `.vscode/extensions.json`, `src/app/_layout.tsx`, `src/app/index.tsx`, `AGENTS.md`, `CLAUDE.md`

**Interfaces:**
- Consumes: nothing.
- Produces: npm scripts `test`, `test:coverage`, `lint`, `format`, `format:check`, `typecheck`; the jest setup with module mocks for `expo-image-picker` (including a `PermissionStatus` enum object), `expo-image-manipulator`, `expo-network`, `expo-device`, `expo-crypto` that every later test relies on; the runtime dependencies `@tanstack/react-query`, `zod`, `expo-image-picker`, `expo-image-manipulator`, `expo-network`, `expo-crypto`.

- [ ] **Step 1: Add the runtime dependencies**

Run from the repo root:

```bash
npx expo install expo-image-picker expo-image-manipulator expo-network expo-crypto
npm install @tanstack/react-query@^5.102.8 zod@^4.6.2
```

Expected: `package.json` gains `expo-image-picker ~57.0.17`, `expo-image-manipulator ~57.0.17`, `expo-network ~57.0.2`, `expo-crypto ~57.0.3`, `@tanstack/react-query ^5.102.8`, `zod ^4.6.2`.

- [ ] **Step 2: Hand-write the dev dependencies and scripts**

Replace the `devDependencies` and `scripts` objects in `package.json` with exactly these (keep every other key), then run `npm install`:

```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "lint": "expo lint",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "expo customize tsconfig.json && tsc",
  "test": "jest",
  "test:coverage": "jest --coverage"
},
"devDependencies": {
  "@react-native/jest-preset": "^0.86.3",
  "@testing-library/react-native": "13.3.3",
  "@types/jest": "^29.5.14",
  "@types/react": "~19.2.2",
  "eslint": "^9.0.0",
  "eslint-config-expo": "~57.0.2",
  "eslint-config-prettier": "^10.1.8",
  "eslint-plugin-prettier": "^5.5.6",
  "jest": "~29.7.0",
  "jest-expo": "~57.0.5",
  "prettier": "^3.9.6",
  "react-test-renderer": "19.2.3",
  "typescript": "~6.0.3"
}
```

Why these pins: `@testing-library/react-native` 14 makes `render` and `act` asynchronous, and expo-router's `renderRouter` calls them synchronously; npm's latest `@react-native/jest-preset` is 0.87, outside jest-expo's `^0.86.3` peer; jest-expo's internals are on the Jest 29 line. `npx expo install --check` validates only the Expo-versioned packages, so these pins are enforced by the lockfile.

Add the Jest configuration as a top-level `"jest"` key in `package.json`:

```json
"jest": {
  "preset": "jest-expo",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.ts"],
  "collectCoverageFrom": [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/smoke.test.tsx",
    "!src/test/**",
    "!src/__tests__/**"
  ],
  "coverageThreshold": {
    "./src/api/": { "statements": 100, "branches": 100, "functions": 100, "lines": 100 },
    "./src/features/": { "statements": 100, "branches": 100, "functions": 100, "lines": 100 },
    "./src/lib/": { "statements": 100, "branches": 100, "functions": 100, "lines": 100 },
    "./src/components/": { "statements": 90 },
    "./src/app/": { "statements": 90 }
  }
}
```

- [ ] **Step 3: Write the jest setup with real-shaped, hoist-safe mocks**

`jest.setup.ts` (every module-scope value a factory reads is prefixed `mock`, which is what Jest's hoisting rule requires):

```ts
// jest-expo stubs the native modules but returns undefined from every call, so tests need
// real-shaped payloads. Individual tests override these with jest.mocked(...).mockResolvedValue.
let mockUuidCounter = 0;

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => {
    mockUuidCounter += 1;
    return `uuid-${mockUuidCounter}`;
  }),
}));

jest.mock("expo-device", () => ({ isDevice: true }));

jest.mock("expo-network", () => ({
  useNetworkState: jest.fn(() => ({ isConnected: true, isInternetReachable: true, type: "WIFI" })),
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
  getNetworkStateAsync: jest.fn(async () => ({
    isConnected: true,
    isInternetReachable: true,
    type: "WIFI",
  })),
}));

const mockGrantedPermission = {
  granted: true,
  status: "granted",
  canAskAgain: true,
  expires: "never",
};

jest.mock("expo-image-picker", () => ({
  useCameraPermissions: jest.fn(() => [
    mockGrantedPermission,
    jest.fn(async () => mockGrantedPermission),
    jest.fn(async () => mockGrantedPermission),
  ]),
  useMediaLibraryPermissions: jest.fn(() => [
    mockGrantedPermission,
    jest.fn(async () => mockGrantedPermission),
    jest.fn(async () => mockGrantedPermission),
  ]),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: null })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: null })),
  PermissionStatus: { GRANTED: "granted", UNDETERMINED: "undetermined", DENIED: "denied" },
}));

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

- [ ] **Step 4: Write the lint and format configuration**

`eslint.config.js`:

```js
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  { ignores: ["dist/*", ".expo/*", "coverage/*", "specs/*"] },
]);
```

`.prettierrc`:

```json
{
  "printWidth": 100,
  "singleQuote": false,
  "semi": true,
  "trailingComma": "all"
}
```

`.prettierignore` (the last two keep the formatter inside this task's fence):

```
node_modules
.expo
coverage
dist
package-lock.json
specs
assets
.claude
.serena
```

- [ ] **Step 5: Write the failing smoke test**

`src/smoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

test("renders a button with an accessible name and a 48 point touch target", () => {
  render(
    <Pressable accessibilityRole="button" style={{ minHeight: 48, minWidth: 48 }}>
      <Text>Send</Text>
    </Pressable>,
  );

  const button = screen.getByRole("button", { name: "Send" });

  expect(button).toHaveStyle({ minHeight: 48, minWidth: 48 });
});
```

- [ ] **Step 6: Run the smoke test and make it pass**

Run: `npx jest src/smoke.test.tsx`
Expected: PASS. This proves Testing Library 13.3.3 renders on React 19.2.3 under jest-expo 57; its matchers register themselves on import, so nothing else is needed. If the render itself fails with a react-test-renderer error, stop and report `BLOCKED` with the full error, because the whole test strategy depends on this pin.

- [ ] **Step 7: Format the tree once and verify**

Run each as its own command from the repo root, output redirected to the verify log directory given in your dispatch:

```bash
npm run format
npm run typecheck
npm run lint
npm run format:check
npm test
```

Expected: all exit 0. `npm run format` rewrites the template files listed in the fence; that is expected and they are in the fence for exactly that reason.

---

### Task 2: Wire contracts and fixtures

**T002** · **Visual:** none — types and data only.

**Files:**
- Create: `src/api/contracts.ts`
- Create: `src/api/contracts.test.ts`
- Create: `src/api/fake/fixtures.ts`
- Create: `src/api/fake/fixtures.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: the schemas `questionSchema`, `careTeamMemberSchema`, `practiceConfigSchema`, `createEConsultRequestSchema`, `createEConsultResponseSchema`, `attachmentResponseSchema`; the types `Question`, `ChoiceQuestion`, `TextQuestion`, `CareTeamMember`, `CareTeamRole`, `PracticeEConsultConfig`, `Answer`, `CreateEConsultRequest`, `CreateEConsultResponse`, `AttachmentResponse`, `PatientSession`; the constant `IDEMPOTENCY_HEADER = "Idempotency-Key"`; the fixtures `rawPractices: Record<string, unknown>`, `rawCareTeams: Record<string, unknown>`, `FIXTURE_PRACTICE_IDS`.

- [ ] **Step 1: Write the failing contract tests**

`src/api/contracts.test.ts`:

```ts
import {
  careTeamMemberSchema,
  createEConsultRequestSchema,
  IDEMPOTENCY_HEADER,
  practiceConfigSchema,
  questionSchema,
} from "./contracts";

describe("questionSchema", () => {
  test("rejects a question that is not an object or has no type", () => {
    expect(questionSchema.safeParse("q-duration").success).toBe(false);
    expect(questionSchema.safeParse({ id: "q1", label: "x", required: true }).success).toBe(false);
  });

  test("keeps a choice question with at least two options", () => {
    const result = questionSchema.parse({
      id: "q-duration",
      label: "How long?",
      type: "choice",
      options: ["A", "B"],
      required: true,
    });

    expect(result).toEqual({
      id: "q-duration",
      label: "How long?",
      type: "choice",
      options: ["A", "B"],
      required: true,
    });
  });

  test("rejects a choice question with fewer than two options", () => {
    const result = questionSchema.safeParse({
      id: "q1",
      label: "Pick",
      type: "choice",
      options: ["Only"],
      required: true,
    });

    expect(result.success).toBe(false);
  });

  test("coerces an unknown question type to text and drops its options", () => {
    const result = questionSchema.parse({
      id: "q-date",
      label: "When?",
      type: "date",
      options: ["x", "y"],
      required: false,
    });

    expect(result).toEqual({ id: "q-date", label: "When?", type: "text", required: false });
  });

  test("rejects a question without an id", () => {
    const result = questionSchema.safeParse({ label: "x", type: "text", required: true });

    expect(result.success).toBe(false);
  });
});

describe("careTeamMemberSchema", () => {
  test("keeps a known role", () => {
    const result = careTeamMemberSchema.parse({ id: "ct-1", displayName: "Dr. A", role: "gp" });

    expect(result.role).toBe("gp");
  });

  test("coerces an unknown role to other", () => {
    const result = careTeamMemberSchema.parse({ id: "ct-1", displayName: "Dr. A", role: "vet" });

    expect(result.role).toBe("other");
  });
});

describe("practiceConfigSchema", () => {
  test("parses a config with mixed question types", () => {
    const result = practiceConfigSchema.parse({
      practiceId: "prc-1",
      recipientIds: ["ct-1"],
      questions: [
        { id: "q1", label: "A", type: "choice", options: ["x", "y"], required: true },
        { id: "q2", label: "B", type: "text", required: false },
      ],
    });

    expect(result.questions.map((q) => q.type)).toEqual(["choice", "text"]);
  });

  test("rejects a config whose recipientIds is not an array", () => {
    const result = practiceConfigSchema.safeParse({ practiceId: "p", recipientIds: "ct-1", questions: [] });

    expect(result.success).toBe(false);
  });
});

describe("createEConsultRequestSchema", () => {
  test("rejects an empty body", () => {
    const result = createEConsultRequestSchema.safeParse({
      patientId: "p",
      recipientId: "r",
      body: "",
      answers: [],
    });

    expect(result.success).toBe(false);
  });
});

test("the idempotency header name is part of the contract", () => {
  expect(IDEMPOTENCY_HEADER).toBe("Idempotency-Key");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/api/contracts.test.ts`
Expected: FAIL with "Cannot find module './contracts'".

- [ ] **Step 3: Write the contracts**

`src/api/contracts.ts`:

```ts
import { z } from "zod";

const KNOWN_QUESTION_TYPES = ["choice", "text"] as const;
const MIN_CHOICE_OPTIONS = 2;

export const IDEMPOTENCY_HEADER = "Idempotency-Key";

const nonEmpty = z.string().min(1);

// The backend may send question types this app does not render; a text field keeps the patient moving.
function coerceUnknownQuestionType(input: unknown): unknown {
  if (typeof input !== "object" || input === null || !("type" in input)) return input;
  const { type, options: _dropped, ...rest } = input as { type: unknown; options?: unknown };
  const isKnown = KNOWN_QUESTION_TYPES.some((known) => known === type);
  return isKnown ? input : { ...rest, type: "text" };
}

const choiceQuestionSchema = z.object({
  id: nonEmpty,
  label: nonEmpty,
  type: z.literal("choice"),
  options: z.array(nonEmpty).min(MIN_CHOICE_OPTIONS),
  required: z.boolean(),
});

const textQuestionSchema = z.object({
  id: nonEmpty,
  label: nonEmpty,
  type: z.literal("text"),
  required: z.boolean(),
});

export const questionSchema = z.preprocess(
  coerceUnknownQuestionType,
  z.discriminatedUnion("type", [choiceQuestionSchema, textQuestionSchema]),
);

export const careTeamRoleSchema = z.enum(["gp", "nurse", "assistant", "other"]).catch("other");

export const careTeamMemberSchema = z.object({
  id: nonEmpty,
  displayName: nonEmpty,
  role: careTeamRoleSchema,
});

export const practiceConfigSchema = z.object({
  practiceId: nonEmpty,
  recipientIds: z.array(nonEmpty),
  questions: z.array(questionSchema),
});

export const answerSchema = z.object({ questionId: nonEmpty, value: z.string() });

export const createEConsultRequestSchema = z.object({
  patientId: nonEmpty,
  recipientId: nonEmpty,
  body: nonEmpty,
  answers: z.array(answerSchema),
});

export const createEConsultResponseSchema = z.object({ econsultId: nonEmpty });

export const attachmentResponseSchema = z.object({ attachmentId: nonEmpty });

export type ChoiceQuestion = z.infer<typeof choiceQuestionSchema>;
export type TextQuestion = z.infer<typeof textQuestionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type CareTeamRole = z.infer<typeof careTeamRoleSchema>;
export type CareTeamMember = z.infer<typeof careTeamMemberSchema>;
export type PracticeEConsultConfig = z.infer<typeof practiceConfigSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type CreateEConsultRequest = z.infer<typeof createEConsultRequestSchema>;
export type CreateEConsultResponse = z.infer<typeof createEConsultResponseSchema>;
export type AttachmentResponse = z.infer<typeof attachmentResponseSchema>;

export type PatientSession = {
  patientId: string;
  practiceId: string;
  displayName: string;
};
```

- [ ] **Step 4: Run the contract tests to verify they pass**

Run: `npx jest src/api/contracts.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Write the failing fixture tests**

`src/api/fake/fixtures.test.ts`:

```ts
import { careTeamMemberSchema, practiceConfigSchema } from "../contracts";
import { FIXTURE_PRACTICE_IDS, rawCareTeams, rawPractices } from "./fixtures";

describe("fixtures", () => {
  test("ships exactly the three spec practices", () => {
    expect(FIXTURE_PRACTICE_IDS).toEqual(["prc-0421", "prc-0873", "prc-0000"]);
  });

  test.each(FIXTURE_PRACTICE_IDS)("practice %s parses as a config", (practiceId) => {
    const result = practiceConfigSchema.safeParse(rawPractices[practiceId]);

    expect(result.success).toBe(true);
  });

  test.each(FIXTURE_PRACTICE_IDS)("care team of %s parses as members", (practiceId) => {
    const result = careTeamMemberSchema.array().safeParse(rawCareTeams[practiceId]);

    expect(result.success).toBe(true);
  });

  test("prc-0421 has one required choice question and one optional text question", () => {
    const config = practiceConfigSchema.parse(rawPractices["prc-0421"]);

    expect(config.questions.map((q) => [q.type, q.required])).toEqual([
      ["choice", true],
      ["text", false],
    ]);
  });

  test("prc-0873 has recipients but no questions", () => {
    const config = practiceConfigSchema.parse(rawPractices["prc-0873"]);

    expect(config.recipientIds.length).toBeGreaterThan(0);
    expect(config.questions).toEqual([]);
  });

  test("prc-0000 has no recipients and no questions", () => {
    const config = practiceConfigSchema.parse(rawPractices["prc-0000"]);

    expect(config.recipientIds).toEqual([]);
    expect(config.questions).toEqual([]);
  });

  test("every recipient id of prc-0421 and prc-0873 exists in its care team", () => {
    for (const practiceId of ["prc-0421", "prc-0873"]) {
      const config = practiceConfigSchema.parse(rawPractices[practiceId]);
      const team = careTeamMemberSchema.array().parse(rawCareTeams[practiceId]);
      const teamIds = team.map((m) => m.id);

      for (const id of config.recipientIds) expect(teamIds).toContain(id);
    }
  });
});
```

- [ ] **Step 6: Run the fixture tests to verify they fail**

Run: `npx jest src/api/fake/fixtures.test.ts`
Expected: FAIL with "Cannot find module './fixtures'".

- [ ] **Step 7: Write the fixtures**

`src/api/fake/fixtures.ts`:

```ts
// Wire-shaped data, typed as unknown on purpose: the services parse it exactly as they would a
// real response, so the fixtures exercise the schemas instead of bypassing them.
export const FIXTURE_PRACTICE_IDS = ["prc-0421", "prc-0873", "prc-0000"] as const;

export type FixturePracticeId = (typeof FIXTURE_PRACTICE_IDS)[number];

export const rawPractices: Record<string, unknown> = {
  "prc-0421": {
    practiceId: "prc-0421",
    recipientIds: ["ct-11", "ct-12", "ct-19"],
    questions: [
      {
        id: "q-duration",
        label: "How long have you had this problem?",
        type: "choice",
        options: ["Less than a week", "1 to 4 weeks", "Longer than a month"],
        required: true,
      },
      {
        id: "q-medication",
        label: "Are you already taking anything for it?",
        type: "text",
        required: false,
      },
    ],
  },
  "prc-0873": {
    practiceId: "prc-0873",
    recipientIds: ["ct-44", "ct-45"],
    questions: [],
  },
  "prc-0000": {
    practiceId: "prc-0000",
    recipientIds: [],
    questions: [],
  },
};

export const rawCareTeams: Record<string, unknown> = {
  "prc-0421": [
    { id: "ct-11", displayName: "Dr. J. de Vries", role: "gp" },
    { id: "ct-12", displayName: "M. Bakker", role: "nurse" },
    { id: "ct-19", displayName: "S. Jansen", role: "assistant" },
    { id: "ct-20", displayName: "Dr. P. Mulder", role: "gp" },
  ],
  "prc-0873": [
    { id: "ct-44", displayName: "Dr. A. Visser", role: "gp" },
    { id: "ct-45", displayName: "L. Smit", role: "nurse" },
  ],
  "prc-0000": [],
};
```

`ct-20` is deliberately in the care team but not in `recipientIds`, so the "not listed, not shown" rule has real data to run against.

- [ ] **Step 8: Run the fixture tests to verify they pass**

Run: `npx jest src/api/fake/fixtures.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 9: Scoped verify**

Run each as its own command, output redirected to the verify log directory:

```bash
npx jest src/api
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 3: Transport interface, errors, timeout helper and the fake transport

**T003** · **Visual:** none — no renderable output; the fake is exercised by its tests.

**Files:**
- Create: `src/api/transport.ts`
- Create: `src/api/transport.test.ts`
- Create: `src/api/fake/fakeTransport.ts`
- Create: `src/api/fake/fakeTransport.test.ts`

**Interfaces:**
- Consumes: `rawPractices`, `rawCareTeams`, `IDEMPOTENCY_HEADER` from Task 2.
- Produces:

```ts
// src/api/transport.ts
export type ApiErrorKind = "network" | "server" | "timeout" | "validation";
export class ApiError extends Error { readonly kind: ApiErrorKind; readonly status?: number; }
export function isApiError(error: unknown): error is ApiError;
export type PhotoFile = { uri: string; name: string; type: string };
export interface Transport {
  getJson(path: string, signal: AbortSignal): Promise<unknown>;
  postJson(path: string, body: unknown, headers: Record<string, string>, signal: AbortSignal): Promise<unknown>;
  uploadPhoto(path: string, photo: PhotoFile, signal: AbortSignal): Promise<unknown>;
}
export function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T>;

// src/api/fake/fakeTransport.ts
export type RequestName = "config" | "careTeam" | "create" | "upload";
export type FaultKind = "network" | "server" | "timeout";
export type Faults = Partial<Record<RequestName, FaultKind>>;
export type FakeTransportOptions = { latencyMs?: number | null; faults?: Faults };
export const DEFAULT_LATENCY_MS: Record<RequestName, number>;
export const REQUEST_NAMES: readonly RequestName[];
export const FAULT_KINDS: readonly FaultKind[];
export function createFakeTransport(options?: FakeTransportOptions): Transport;
```

- [ ] **Step 1: Write the failing transport tests**

`src/api/transport.test.ts`:

```ts
import { ApiError, isApiError, withTimeout } from "./transport";

describe("ApiError", () => {
  test("carries its kind and status and is recognised by isApiError", () => {
    const error = new ApiError("server", "Boom", 500);

    expect(isApiError(error)).toBe(true);
    expect(error.kind).toBe("server");
    expect(error.status).toBe(500);
    expect(error.name).toBe("ApiError");
  });

  test("isApiError rejects plain errors", () => {
    expect(isApiError(new Error("x"))).toBe(false);
  });
});

describe("withTimeout", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("resolves with the value when the work finishes in time", async () => {
    const result = await withTimeout(1000, async () => "done");

    expect(result).toBe("done");
  });

  test("aborts the signal and throws a timeout ApiError when the work takes too long", async () => {
    let observed: AbortSignal | null = null;
    const work = (signal: AbortSignal) =>
      new Promise<string>((_, reject) => {
        observed = signal;
        signal.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      });

    const pending = withTimeout(1000, work);
    await jest.advanceTimersByTimeAsync(1000);

    await expect(pending).rejects.toMatchObject({ kind: "timeout" });
    expect(observed!.aborted).toBe(true);
  });

  test("maps any rejection after the timeout fired onto the timeout error", async () => {
    const work = (signal: AbortSignal) =>
      new Promise<string>((_, reject) => {
        signal.addEventListener("abort", () => reject(new Error("fetch failed: Fetch request has been canceled")));
      });

    const pending = withTimeout(1000, work);
    await jest.advanceTimersByTimeAsync(1000);

    await expect(pending).rejects.toMatchObject({ kind: "timeout" });
  });

  test("rethrows errors that are not aborts unchanged", async () => {
    const failure = new ApiError("server", "Boom", 500);

    await expect(withTimeout(1000, async () => Promise.reject(failure))).rejects.toBe(failure);
  });
});
```

- [ ] **Step 2: Run the transport tests to verify they fail**

Run: `npx jest src/api/transport.test.ts`
Expected: FAIL with "Cannot find module './transport'".

- [ ] **Step 3: Write the transport module**

`src/api/transport.ts`:

```ts
export type ApiErrorKind = "network" | "server" | "timeout" | "validation";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export type PhotoFile = { uri: string; name: string; type: string };

export interface Transport {
  getJson(path: string, signal: AbortSignal): Promise<unknown>;
  postJson(
    path: string,
    body: unknown,
    headers: Record<string, string>,
    signal: AbortSignal,
  ): Promise<unknown>;
  uploadPhoto(path: string, photo: PhotoFile, signal: AbortSignal): Promise<unknown>;
}

// AbortController + setTimeout rather than AbortSignal.timeout: Expo's runtime patches the latter in, but it
// aborts with a TimeoutError reason. The catch decides on the signal, not the error's shape, because a real
// client surfaces an abort as an AbortError or a cause-less FetchError depending on timing.
export async function withTimeout<T>(
  ms: number,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await run(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw new ApiError("timeout", `The request took longer than ${ms} ms`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 4: Run the transport tests to verify they pass**

Run: `npx jest src/api/transport.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write the failing fake transport tests**

`src/api/fake/fakeTransport.test.ts`:

```ts
import { IDEMPOTENCY_HEADER } from "../contracts";
import { ApiError } from "../transport";
import { createFakeTransport, DEFAULT_LATENCY_MS } from "./fakeTransport";

const signal = () => new AbortController().signal;
const PHOTO = { uri: "file:///cache/a.jpg", name: "photo.jpg", type: "image/jpeg" };
const key = (value: string) => ({ [IDEMPOTENCY_HEADER]: value });

describe("createFakeTransport", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("returns the practice config after the default config latency", async () => {
    const transport = createFakeTransport();

    const pending = transport.getJson("/practices/prc-0421/econsult-config", signal());
    await jest.advanceTimersByTimeAsync(DEFAULT_LATENCY_MS.config);

    await expect(pending).resolves.toMatchObject({ practiceId: "prc-0421" });
  });

  test("returns the care team after the default care-team latency", async () => {
    const transport = createFakeTransport();

    const pending = transport.getJson("/practices/prc-0873/care-team", signal());
    await jest.advanceTimersByTimeAsync(DEFAULT_LATENCY_MS.careTeam);

    await expect(pending).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "ct-44" })]),
    );
  });

  test("a latency override applies to every request", async () => {
    const transport = createFakeTransport({ latencyMs: 5000 });

    const pending = transport.getJson("/practices/prc-0421/care-team", signal());
    await jest.advanceTimersByTimeAsync(4999);
    let settled = false;
    void pending.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    await jest.advanceTimersByTimeAsync(1);

    await expect(pending).resolves.toBeDefined();
  });

  test("an unknown practice is a 404 server error", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });

    const pending = transport.getJson("/practices/prc-9999/econsult-config", signal());
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 404 });
  });

  test("an unknown practice's care team is a 404 server error", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });

    const pending = transport.getJson("/practices/prc-9999/care-team", signal());
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 404 });
  });

  test("an unknown path is a 404 server error", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });

    const pending = transport.getJson("/nope", signal());
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 404 });
  });

  test("a network fault rejects with a network ApiError", async () => {
    const transport = createFakeTransport({ latencyMs: 0, faults: { config: "network" } });

    const pending = transport.getJson("/practices/prc-0421/econsult-config", signal());
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "network" });
  });

  test("a server fault rejects with a 500 server ApiError", async () => {
    const transport = createFakeTransport({ latencyMs: 0, faults: { careTeam: "server" } });

    const pending = transport.getJson("/practices/prc-0421/care-team", signal());
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 500 });
  });

  test("a timeout fault never resolves and rejects with AbortError once the signal aborts", async () => {
    const transport = createFakeTransport({ latencyMs: 0, faults: { create: "timeout" } });
    const controller = new AbortController();

    const pending = transport.postJson("/econsults", {}, key("k"), controller.signal);
    await jest.advanceTimersByTimeAsync(60_000);
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  test("aborting during latency rejects with AbortError", async () => {
    const transport = createFakeTransport();
    const controller = new AbortController();

    const pending = transport.getJson("/practices/prc-0421/econsult-config", controller.signal);
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  test("creating an e-consult returns an id and repeating the idempotency key returns the same id", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });
    const body = { patientId: "p", recipientId: "ct-11", body: "Hi", answers: [] };

    const first = transport.postJson("/econsults", body, key("k1"), signal());
    await jest.advanceTimersByTimeAsync(0);
    const second = transport.postJson("/econsults", body, key("k1"), signal());
    await jest.advanceTimersByTimeAsync(0);
    const third = transport.postJson("/econsults", body, key("k2"), signal());
    await jest.advanceTimersByTimeAsync(0);

    const [a, b, c] = (await Promise.all([first, second, third])) as { econsultId: string }[];
    expect(a.econsultId).toMatch(/^ec-/);
    expect(b.econsultId).toBe(a.econsultId);
    expect(c.econsultId).not.toBe(a.econsultId);
  });

  test("creating without an idempotency key is a 400 server error", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });

    const pending = transport.postJson("/econsults", {}, {}, signal());
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 400 });
  });

  test("uploading to an existing e-consult returns an attachment id", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });
    const created = transport.postJson("/econsults", {}, key("k"), signal());
    await jest.advanceTimersByTimeAsync(0);
    const { econsultId } = (await created) as { econsultId: string };

    const pending = transport.uploadPhoto(`/econsults/${econsultId}/attachments`, PHOTO, signal());
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toMatchObject({ attachmentId: expect.stringMatching(/^att-/) });
  });

  test("uploading to an unknown e-consult is a 404 server error", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });

    const pending = transport.uploadPhoto("/econsults/ec-missing/attachments", PHOTO, signal());
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 404 });
  });

  test("an upload fault applies only to the upload request", async () => {
    const transport = createFakeTransport({ latencyMs: 0, faults: { upload: "server" } });

    const pending = transport.getJson("/practices/prc-0421/econsult-config", signal());
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toBeDefined();
  });

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

  test("errors are ApiError instances", async () => {
    const transport = createFakeTransport({ latencyMs: 0, faults: { config: "server" } });

    const pending = transport.getJson("/practices/prc-0421/econsult-config", signal());
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toBeInstanceOf(ApiError);
  });
});
```

- [ ] **Step 6: Run the fake transport tests to verify they fail**

Run: `npx jest src/api/fake/fakeTransport.test.ts`
Expected: FAIL with "Cannot find module './fakeTransport'".

- [ ] **Step 7: Write the fake transport**

`src/api/fake/fakeTransport.ts`:

```ts
import { IDEMPOTENCY_HEADER } from "../contracts";
import { ApiError, type PhotoFile, type Transport } from "../transport";
import { rawCareTeams, rawPractices } from "./fixtures";

export type RequestName = "config" | "careTeam" | "create" | "upload";
export type FaultKind = "network" | "server" | "timeout";
export type Faults = Partial<Record<RequestName, FaultKind>>;
export type FakeTransportOptions = { latencyMs?: number | null; faults?: Faults };

export const REQUEST_NAMES: readonly RequestName[] = ["config", "careTeam", "create", "upload"];
export const FAULT_KINDS: readonly FaultKind[] = ["network", "server", "timeout"];
export const DEFAULT_LATENCY_MS: Record<RequestName, number> = {
  config: 2000,
  careTeam: 1000,
  create: 1000,
  upload: 1000,
};

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVER_ERROR = 500;

const CONFIG_PATH = /^\/practices\/([^/]+)\/econsult-config$/;
const CARE_TEAM_PATH = /^\/practices\/([^/]+)\/care-team$/;
const CREATE_PATH = /^\/econsults$/;
const UPLOAD_PATH = /^\/econsults\/([^/]+)\/attachments$/;

function abortError(): Error {
  const error = new Error("The request was aborted");
  error.name = "AbortError";
  return error;
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(abortError());
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function hangUntilAborted(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) return reject(abortError());
    signal.addEventListener("abort", () => reject(abortError()), { once: true });
  });
}

function notFound(what: string): ApiError {
  return new ApiError("server", `${what} was not found`, HTTP_NOT_FOUND);
}

type FakeState = { nextId: number; byIdempotencyKey: Map<string, string>; econsults: Set<string> };

function create(state: FakeState, headers: Record<string, string>): { econsultId: string } {
  const idempotencyKey = headers[IDEMPOTENCY_HEADER];
  if (!idempotencyKey) throw new ApiError("server", "Missing Idempotency-Key", HTTP_BAD_REQUEST);
  const existing = state.byIdempotencyKey.get(idempotencyKey);
  if (existing) return { econsultId: existing };
  const econsultId = `ec-${state.nextId}`;
  state.nextId += 1;
  state.byIdempotencyKey.set(idempotencyKey, econsultId);
  state.econsults.add(econsultId);
  return { econsultId };
}

export function createFakeTransport(options: FakeTransportOptions = {}): Transport {
  const state: FakeState = { nextId: 1, byIdempotencyKey: new Map(), econsults: new Set() };
  const faults = options.faults ?? {};

  async function simulate(name: RequestName, signal: AbortSignal): Promise<void> {
    const latency = options.latencyMs ?? DEFAULT_LATENCY_MS[name];
    const fault = faults[name];
    if (fault === "timeout") return hangUntilAborted(signal);
    await delay(latency, signal);
    if (fault === "network") throw new ApiError("network", "Could not reach the server");
    if (fault === "server") throw new ApiError("server", "The server had a problem", HTTP_SERVER_ERROR);
  }

  return {
    async getJson(path, signal) {
      const config = CONFIG_PATH.exec(path);
      if (config) {
        await simulate("config", signal);
        return rawPractices[config[1]] ?? Promise.reject(notFound("Practice"));
      }
      const team = CARE_TEAM_PATH.exec(path);
      if (team) {
        await simulate("careTeam", signal);
        return rawCareTeams[team[1]] ?? Promise.reject(notFound("Practice"));
      }
      throw notFound("Path");
    },
    async postJson(path, _body, headers, signal) {
      if (!CREATE_PATH.test(path)) throw notFound("Path");
      await simulate("create", signal);
      return create(state, headers);
    },
    async uploadPhoto(path, _photo: PhotoFile, signal) {
      const match = UPLOAD_PATH.exec(path);
      if (!match) throw notFound("Path");
      await simulate("upload", signal);
      if (!state.econsults.has(match[1])) throw notFound("E-consult");
      const attachmentId = `att-${state.nextId}`;
      state.nextId += 1;
      return { attachmentId };
    },
  };
}
```

- [ ] **Step 8: Run the fake transport tests to verify they pass**

Run: `npx jest src/api/fake/fakeTransport.test.ts`
Expected: PASS, 18 tests.

- [ ] **Step 9: Scoped verify**

```bash
npx jest src/api
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 4: Typed services with timeouts and boundary validation

**T004** · **Visual:** none — no renderable output.

**Files:**
- Create: `src/api/services.ts`
- Create: `src/api/services.test.ts`

**Interfaces:**
- Consumes: `Transport`, `withTimeout`, `ApiError`, `PhotoFile` (Task 3); schemas, types and `IDEMPOTENCY_HEADER` from `src/api/contracts.ts` (Task 2); `createFakeTransport` for tests (Task 3).
- Produces:

```ts
export const READ_TIMEOUT_MS = 15_000;
export const UPLOAD_TIMEOUT_MS = 45_000;
export type Services = {
  getPracticeConfig(practiceId: string): Promise<PracticeEConsultConfig>;
  getCareTeam(practiceId: string): Promise<CareTeamMember[]>;
  createEConsult(request: CreateEConsultRequest, idempotencyKey: string): Promise<CreateEConsultResponse>;
  uploadAttachment(econsultId: string, photo: PhotoFile): Promise<AttachmentResponse>;
};
export function createServices(transport: Transport): Services;
```

- [ ] **Step 1: Write the failing tests**

`src/api/services.test.ts`:

```ts
import { IDEMPOTENCY_HEADER } from "./contracts";
import { createFakeTransport } from "./fake/fakeTransport";
import { createServices, READ_TIMEOUT_MS, UPLOAD_TIMEOUT_MS } from "./services";
import type { Transport } from "./transport";

const PHOTO = { uri: "file:///cache/a.jpg", name: "photo.jpg", type: "image/jpeg" };
const REQUEST = { patientId: "pat-1", recipientId: "ct-11", body: "My knee hurts", answers: [] };

function malformedTransport(payload: unknown): Transport {
  return {
    getJson: async () => payload,
    postJson: async () => payload,
    uploadPhoto: async () => payload,
  };
}

describe("createServices", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test("getPracticeConfig returns a parsed config", async () => {
    const services = createServices(createFakeTransport({ latencyMs: 0 }));

    const pending = services.getPracticeConfig("prc-0421");
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toMatchObject({ practiceId: "prc-0421" });
  });

  test("getCareTeam returns parsed members with roles", async () => {
    const services = createServices(createFakeTransport({ latencyMs: 0 }));

    const pending = services.getCareTeam("prc-0421");
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "ct-11", role: "gp" })]),
    );
  });

  test("createEConsult sends the idempotency key and returns the id", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });
    const spy = jest.spyOn(transport, "postJson");
    const services = createServices(transport);

    const pending = services.createEConsult(REQUEST, "key-1");
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toMatchObject({ econsultId: expect.stringMatching(/^ec-/) });
    expect(spy).toHaveBeenCalledWith(
      "/econsults",
      REQUEST,
      { [IDEMPOTENCY_HEADER]: "key-1" },
      expect.any(AbortSignal),
    );
  });

  test("uploadAttachment posts the photo to the e-consult and returns the attachment id", async () => {
    const services = createServices(createFakeTransport({ latencyMs: 0 }));
    const created = services.createEConsult(REQUEST, "key-2");
    await jest.advanceTimersByTimeAsync(0);
    const { econsultId } = await created;

    const pending = services.uploadAttachment(econsultId, PHOTO);
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).resolves.toMatchObject({ attachmentId: expect.stringMatching(/^att-/) });
  });

  test("a malformed config payload is a validation ApiError", async () => {
    const services = createServices(malformedTransport({ practiceId: 1 }));

    await expect(services.getPracticeConfig("prc-0421")).rejects.toMatchObject({ kind: "validation" });
  });

  test("a malformed create response is a validation ApiError", async () => {
    const services = createServices(malformedTransport({ nope: true }));

    await expect(services.createEConsult(REQUEST, "k")).rejects.toMatchObject({
      kind: "validation",
    });
  });

  test("a read that exceeds the read timeout is a timeout ApiError", async () => {
    const services = createServices(createFakeTransport({ faults: { config: "timeout" } }));

    const pending = services.getPracticeConfig("prc-0421");
    await jest.advanceTimersByTimeAsync(READ_TIMEOUT_MS);

    await expect(pending).rejects.toMatchObject({ kind: "timeout" });
  });

  test("an upload that exceeds the upload timeout is a timeout ApiError", async () => {
    const services = createServices(createFakeTransport({ latencyMs: 0, faults: { upload: "timeout" } }));
    const created = services.createEConsult(REQUEST, "key-3");
    await jest.advanceTimersByTimeAsync(0);
    const { econsultId } = await created;

    const pending = services.uploadAttachment(econsultId, PHOTO);
    await jest.advanceTimersByTimeAsync(UPLOAD_TIMEOUT_MS);

    await expect(pending).rejects.toMatchObject({ kind: "timeout" });
  });

  test("a server fault surfaces as a server ApiError", async () => {
    const services = createServices(createFakeTransport({ latencyMs: 0, faults: { careTeam: "server" } }));

    const pending = services.getCareTeam("prc-0421");
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 500 });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/api/services.test.ts`
Expected: FAIL with "Cannot find module './services'".

- [ ] **Step 3: Write the services**

`src/api/services.ts`:

```ts
import type { z } from "zod";
import {
  attachmentResponseSchema,
  careTeamMemberSchema,
  createEConsultResponseSchema,
  IDEMPOTENCY_HEADER,
  practiceConfigSchema,
  type AttachmentResponse,
  type CareTeamMember,
  type CreateEConsultRequest,
  type CreateEConsultResponse,
  type PracticeEConsultConfig,
} from "./contracts";
import { ApiError, withTimeout, type PhotoFile, type Transport } from "./transport";

export const READ_TIMEOUT_MS = 15_000;
export const UPLOAD_TIMEOUT_MS = 45_000;

export type Services = {
  getPracticeConfig(practiceId: string): Promise<PracticeEConsultConfig>;
  getCareTeam(practiceId: string): Promise<CareTeamMember[]>;
  createEConsult(
    request: CreateEConsultRequest,
    idempotencyKey: string,
  ): Promise<CreateEConsultResponse>;
  uploadAttachment(econsultId: string, photo: PhotoFile): Promise<AttachmentResponse>;
};

// Generic over the schema so the return type is zod's OUTPUT type (after preprocess and catch),
// not the input type a plain `ZodType<T>` parameter would infer.
function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError("validation", "The server sent a response the app could not read");
  }
  return result.data;
}

export function createServices(transport: Transport): Services {
  return {
    getPracticeConfig: (practiceId) =>
      withTimeout(READ_TIMEOUT_MS, async (signal) =>
        parse(
          practiceConfigSchema,
          await transport.getJson(`/practices/${practiceId}/econsult-config`, signal),
        ),
      ),
    getCareTeam: (practiceId) =>
      withTimeout(READ_TIMEOUT_MS, async (signal) =>
        parse(
          careTeamMemberSchema.array(),
          await transport.getJson(`/practices/${practiceId}/care-team`, signal),
        ),
      ),
    createEConsult: (request, idempotencyKey) =>
      withTimeout(READ_TIMEOUT_MS, async (signal) =>
        parse(
          createEConsultResponseSchema,
          await transport.postJson("/econsults", request, { [IDEMPOTENCY_HEADER]: idempotencyKey }, signal),
        ),
      ),
    uploadAttachment: (econsultId, photo) =>
      withTimeout(UPLOAD_TIMEOUT_MS, async (signal) =>
        parse(
          attachmentResponseSchema,
          await transport.uploadPhoto(`/econsults/${econsultId}/attachments`, photo, signal),
        ),
      ),
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/api/services.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Scoped verify**

```bash
npx jest src/api
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 5: Query client, network state, announcements, dev warning, ids

**T005** · **Visual:** none — library code with no renderable output.

**Files:**
- Create: `src/lib/queryClient.ts`
- Create: `src/lib/queryClient.test.ts`
- Create: `src/lib/network.tsx`
- Create: `src/lib/network.test.tsx`
- Create: `src/lib/announce.ts`
- Create: `src/lib/announce.test.ts`
- Create: `src/lib/devWarn.ts`
- Create: `src/lib/devWarn.test.ts`
- Create: `src/lib/ids.ts`
- Create: `src/lib/ids.test.ts`

**Interfaces:**
- Consumes: the jest mocks for `expo-network` and `expo-crypto` from `jest.setup.ts` (Task 1).
- Produces:

```ts
// src/lib/queryClient.ts
export const READ_RETRY_COUNT = 1; export const READ_RETRY_DELAY_MS = 1000; export const STALE_TIME_MS = 30_000;
export function createQueryClient(): QueryClient;
// src/lib/network.tsx
export function isLinkDown(isConnected: boolean | undefined, forceOffline: boolean): boolean;
export function NetworkProvider(props: { forceOffline: boolean; children: ReactNode }): JSX.Element;
export function useIsOffline(): boolean;
// src/lib/announce.ts
export type Focusable = Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0];
export function announce(message: string): void;
export function focusForScreenReader(node: Focusable | null): void;
// src/lib/devWarn.ts
export function isDevelopmentBuild(): boolean;   // the one __DEV__ read in the app
export function devWarn(message: string): void;
// src/lib/ids.ts
export function newId(): string;
```

- [ ] **Step 1: Write the failing tests**

`src/lib/queryClient.test.ts`:

```ts
import { createQueryClient, READ_RETRY_COUNT, READ_RETRY_DELAY_MS } from "./queryClient";

describe("createQueryClient", () => {
  test("reads retry once after one second and run offline-first", () => {
    const client = createQueryClient();

    const queries = client.getDefaultOptions().queries;

    expect(queries).toMatchObject({
      retry: READ_RETRY_COUNT,
      retryDelay: READ_RETRY_DELAY_MS,
      networkMode: "offlineFirst",
    });
  });

  test("mutations never retry and always run", () => {
    const client = createQueryClient();

    expect(client.getDefaultOptions().mutations).toMatchObject({ retry: 0, networkMode: "always" });
  });
});
```

`src/lib/network.test.tsx`:

```tsx
import { onlineManager } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";
import * as Network from "expo-network";
import type { ReactNode } from "react";
import { isLinkDown, NetworkProvider, useIsOffline } from "./network";

const mockedState = jest.mocked(Network.useNetworkState);

function wrapperWith(forceOffline: boolean) {
  return ({ children }: { children: ReactNode }) => (
    <NetworkProvider forceOffline={forceOffline}>{children}</NetworkProvider>
  );
}

describe("isLinkDown", () => {
  test.each([
    [true, false, false],
    [undefined, false, false],
    [false, false, true],
    [true, true, true],
  ])("isConnected=%s forceOffline=%s -> %s", (isConnected, forceOffline, expected) => {
    expect(isLinkDown(isConnected, forceOffline)).toBe(expected);
  });
});

describe("NetworkProvider", () => {
  afterEach(() => onlineManager.setOnline(true));

  test("reports online and tells the query client so when the link is up", () => {
    mockedState.mockReturnValue({ isConnected: true, isInternetReachable: true });

    const { result } = renderHook(() => useIsOffline(), { wrapper: wrapperWith(false) });

    expect(result.current).toBe(false);
    expect(onlineManager.isOnline()).toBe(true);
  });

  test("reports offline and pauses the query client when the link is reported down", () => {
    mockedState.mockReturnValue({ isConnected: false, isInternetReachable: false });

    const { result } = renderHook(() => useIsOffline(), { wrapper: wrapperWith(false) });

    expect(result.current).toBe(true);
    expect(onlineManager.isOnline()).toBe(false);
  });

  test("treats an unknown link state as online", () => {
    mockedState.mockReturnValue({});

    const { result } = renderHook(() => useIsOffline(), { wrapper: wrapperWith(false) });

    expect(result.current).toBe(false);
  });

  test("forceOffline wins over a healthy link", () => {
    mockedState.mockReturnValue({ isConnected: true, isInternetReachable: true });

    const { result } = renderHook(() => useIsOffline(), { wrapper: wrapperWith(true) });

    expect(result.current).toBe(true);
    expect(onlineManager.isOnline()).toBe(false);
  });

  test("useIsOffline is false outside a provider", () => {
    const { result } = renderHook(() => useIsOffline());

    expect(result.current).toBe(false);
  });
});
```

`src/lib/announce.test.ts`:

```ts
import { AccessibilityInfo } from "react-native";
import { announce, focusForScreenReader, type Focusable } from "./announce";

describe("announce", () => {
  test("hands the message to the screen reader", () => {
    const spy = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});

    announce("Step 1 of 3");

    expect(spy).toHaveBeenCalledWith("Step 1 of 3");
  });
});

describe("focusForScreenReader", () => {
  test("moves screen-reader focus to the node", () => {
    const spy = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => {});
    const node = {} as Focusable;

    focusForScreenReader(node);

    expect(spy).toHaveBeenCalledWith(node, "focus");
  });

  test("does nothing for a missing node", () => {
    const spy = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => {});

    focusForScreenReader(null);

    expect(spy).not.toHaveBeenCalled();
  });
});
```

`src/lib/devWarn.test.ts`:

```ts
import { devWarn, isDevelopmentBuild } from "./devWarn";

const devFlag = globalThis as unknown as { __DEV__: boolean };

describe("devWarn", () => {
  const original = devFlag.__DEV__;
  afterEach(() => {
    devFlag.__DEV__ = original;
    jest.restoreAllMocks();
  });

  test("isDevelopmentBuild follows the __DEV__ flag", () => {
    devFlag.__DEV__ = true;
    expect(isDevelopmentBuild()).toBe(true);

    devFlag.__DEV__ = false;
    expect(isDevelopmentBuild()).toBe(false);
  });

  test("warns in development", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
    devFlag.__DEV__ = true;

    devWarn("careful");

    expect(spy).toHaveBeenCalledWith("careful");
  });

  test("stays silent in a release build", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
    devFlag.__DEV__ = false;

    devWarn("careful");

    expect(spy).not.toHaveBeenCalled();
  });
});
```

`src/lib/ids.test.ts`:

```ts
import { newId } from "./ids";

test("newId returns a fresh id each time", () => {
  const first = newId();
  const second = newId();

  expect(first).toMatch(/^uuid-/);
  expect(second).not.toBe(first);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/lib`
Expected: FAIL, every suite with "Cannot find module".

- [ ] **Step 3: Write the library modules**

`src/lib/queryClient.ts`:

```ts
import { QueryClient } from "@tanstack/react-query";

export const READ_RETRY_COUNT = 1;
export const READ_RETRY_DELAY_MS = 1000;
export const STALE_TIME_MS = 30_000;

// Reads are offline-first so the first attempt always runs (the fake is in-process); the send
// mutation runs "always" so it can never sit paused with a spinner that lies.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: READ_RETRY_COUNT,
        retryDelay: READ_RETRY_DELAY_MS,
        networkMode: "offlineFirst",
        staleTime: STALE_TIME_MS,
      },
      mutations: { retry: 0, networkMode: "always" },
    },
  });
}
```

`src/lib/network.tsx`:

```tsx
import { onlineManager } from "@tanstack/react-query";
import { useNetworkState } from "expo-network";
import { createContext, useContext, useEffect, type ReactNode } from "react";

const OfflineContext = createContext<boolean>(false);

// Fail-open: only an explicit "not connected" counts as offline; unknown counts as online.
export function isLinkDown(isConnected: boolean | undefined, forceOffline: boolean): boolean {
  return forceOffline || isConnected === false;
}

export function NetworkProvider({
  forceOffline,
  children,
}: {
  forceOffline: boolean;
  children: ReactNode;
}) {
  const state = useNetworkState();
  const isOffline = isLinkDown(state.isConnected, forceOffline);

  useEffect(() => {
    onlineManager.setOnline(!isOffline);
  }, [isOffline]);

  return <OfflineContext.Provider value={isOffline}>{children}</OfflineContext.Provider>;
}

export function useIsOffline(): boolean {
  return useContext(OfflineContext);
}
```

`src/lib/announce.ts`:

```ts
import { AccessibilityInfo } from "react-native";

export type Focusable = Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0];

export function announce(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

export function focusForScreenReader(node: Focusable | null): void {
  if (!node) return;
  AccessibilityInfo.sendAccessibilityEvent(node, "focus");
}
```

`src/lib/devWarn.ts`:

```ts
// The one __DEV__ read in the app: screens branch on this function so tests can stub it.
export function isDevelopmentBuild(): boolean {
  return __DEV__;
}

export function devWarn(message: string): void {
  if (!isDevelopmentBuild()) return;
  console.warn(message);
}
```

`src/lib/ids.ts`:

```ts
import * as Crypto from "expo-crypto";

export function newId(): string {
  return Crypto.randomUUID();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/lib`
Expected: PASS, 18 tests.

- [ ] **Step 5: Scoped verify**

```bash
npx jest src/lib
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 6: Developer settings, env seeds, services provider, session and the test provider stack

**T006** · **Visual:** none — providers and parsers only.

**Files:**
- Create: `.env`
- Create: `src/lib/devSettings.tsx`
- Create: `src/lib/devSettings.test.tsx`
- Create: `src/test/providers.tsx`

**Interfaces:**
- Consumes: `createFakeTransport`, `REQUEST_NAMES`, `FAULT_KINDS`, `Faults`, `RequestName`, `FaultKind` (Task 3); `FIXTURE_PRACTICE_IDS` (Task 2); `createServices`, `Services` (Task 4); `PatientSession` (Task 2); `NetworkProvider` (Task 5).
- Produces:

```ts
// devSettings.tsx
export type DevSettings = { practiceId: string; latencyMs: number | null; faults: Faults; forceOffline: boolean };
export type RawEnvSeeds = { practiceId?: string; latencyMs?: string; faults?: string };
export const DEFAULT_PRACTICE_ID = "prc-0421";
export function parseLatency(value: string | undefined): number | null;
export function parseFaults(value: string | undefined): Faults;
export function parsePracticeId(value: string | undefined): string;
export function readEnvSeeds(raw: RawEnvSeeds): DevSettings;
export function DevSettingsProvider(props: { children: ReactNode; initial?: DevSettings }): JSX.Element;
export function useDevSettings(): { settings: DevSettings; apply: (next: DevSettings) => void };
export function useServices(): Services;
export function useSession(): PatientSession;
// src/test/providers.tsx (tests only; no draft — the flow layout in Task 15 carries that)
export type ProviderOptions = { settings?: Partial<DevSettings>; client?: QueryClient };
export function testSettings(overrides?: Partial<DevSettings>): DevSettings;
export function TestProviders(props: ProviderOptions & { children: ReactNode }): JSX.Element;
export function renderWithProviders(ui: ReactElement, options?: ProviderOptions): RenderResult;
export function hookWrapper(options?: ProviderOptions): (props: { children: ReactNode }) => JSX.Element;
```

- [ ] **Step 1: Write the committed env seeds**

`.env` (committed on purpose; `.gitignore` ignores only `.env*.local`; these values are inlined at build time, so changing them needs a full app reload):

```
EXPO_PUBLIC_PRACTICE_ID=prc-0421
EXPO_PUBLIC_LATENCY_MS=
EXPO_PUBLIC_FAULTS=
```

- [ ] **Step 2: Write the failing tests**

`src/lib/devSettings.test.tsx`:

```tsx
import { renderHook, act } from "@testing-library/react-native";
import type { ReactNode } from "react";
import {
  DEFAULT_PRACTICE_ID,
  DevSettingsProvider,
  parseFaults,
  parseLatency,
  parsePracticeId,
  readEnvSeeds,
  useDevSettings,
  useServices,
  useSession,
  type DevSettings,
} from "./devSettings";

const SETTINGS: DevSettings = { practiceId: "prc-0873", latencyMs: 0, faults: {}, forceOffline: false };

function wrapperWith(initial?: DevSettings) {
  return ({ children }: { children: ReactNode }) => (
    <DevSettingsProvider initial={initial}>{children}</DevSettingsProvider>
  );
}

describe("parseLatency", () => {
  test.each([
    [undefined, null],
    ["", null],
    ["  ", null],
    ["abc", null],
    ["-5", null],
    ["2500", 2500],
    ["0", 0],
  ])("%s -> %s", (input, expected) => {
    expect(parseLatency(input)).toBe(expected);
  });
});

describe("parseFaults", () => {
  test("parses request:kind pairs and ignores junk", () => {
    expect(parseFaults("config:timeout, upload:server,bogus:network,create:nope")).toEqual({
      config: "timeout",
      upload: "server",
    });
  });

  test("returns no faults for an empty value", () => {
    expect(parseFaults(undefined)).toEqual({});
    expect(parseFaults("")).toEqual({});
  });
});

describe("parsePracticeId", () => {
  test("keeps a fixture practice and falls back otherwise", () => {
    expect(parsePracticeId("prc-0873")).toBe("prc-0873");
    expect(parsePracticeId("prc-9999")).toBe(DEFAULT_PRACTICE_ID);
    expect(parsePracticeId(undefined)).toBe(DEFAULT_PRACTICE_ID);
  });
});

describe("readEnvSeeds", () => {
  test("combines the parsers and starts online", () => {
    expect(readEnvSeeds({ practiceId: "prc-0000", latencyMs: "10", faults: "create:network" })).toEqual({
      practiceId: "prc-0000",
      latencyMs: 10,
      faults: { create: "network" },
      forceOffline: false,
    });
  });
});

describe("DevSettingsProvider", () => {
  test("seeds from the environment when no initial settings are given", () => {
    const { result } = renderHook(() => useDevSettings(), { wrapper: wrapperWith() });

    expect(result.current.settings.practiceId).toBe(DEFAULT_PRACTICE_ID);
    expect(result.current.settings.forceOffline).toBe(false);
  });

  test("apply replaces the settings", () => {
    const { result } = renderHook(() => useDevSettings(), { wrapper: wrapperWith(SETTINGS) });

    act(() => result.current.apply({ ...SETTINGS, forceOffline: true }));

    expect(result.current.settings.forceOffline).toBe(true);
  });

  test("useSession follows the selected practice", () => {
    const { result } = renderHook(() => useSession(), { wrapper: wrapperWith(SETTINGS) });

    expect(result.current).toEqual({
      patientId: expect.any(String),
      practiceId: "prc-0873",
      displayName: expect.any(String),
    });
  });

  test("useServices returns services backed by the fake transport", async () => {
    const { result } = renderHook(() => useServices(), { wrapper: wrapperWith(SETTINGS) });

    await expect(result.current.getPracticeConfig("prc-0873")).resolves.toMatchObject({
      practiceId: "prc-0873",
    });
  });

  test("the hooks throw outside the provider", () => {
    const silence = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useDevSettings())).toThrow(/DevSettingsProvider/);
    expect(() => renderHook(() => useServices())).toThrow(/DevSettingsProvider/);

    silence.mockRestore();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx jest src/lib/devSettings.test.tsx`
Expected: FAIL with "Cannot find module './devSettings'".

- [ ] **Step 4: Write the module**

`src/lib/devSettings.tsx`:

```tsx
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { PatientSession } from "@/api/contracts";
import {
  createFakeTransport,
  FAULT_KINDS,
  REQUEST_NAMES,
  type FaultKind,
  type Faults,
  type RequestName,
} from "@/api/fake/fakeTransport";
import { FIXTURE_PRACTICE_IDS } from "@/api/fake/fixtures";
import { createServices, type Services } from "@/api/services";

export type DevSettings = {
  practiceId: string;
  latencyMs: number | null;
  faults: Faults;
  forceOffline: boolean;
};

export type RawEnvSeeds = { practiceId?: string; latencyMs?: string; faults?: string };

export const DEFAULT_PRACTICE_ID = "prc-0421";

// The session would come from authentication; the brief says to fake it and keep it switchable.
const PATIENT = { patientId: "pat-0001", displayName: "Ria de Boer" };

export function parseLatency(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function isRequestName(value: string | undefined): value is RequestName {
  return REQUEST_NAMES.some((name) => name === value);
}

function isFaultKind(value: string | undefined): value is FaultKind {
  return FAULT_KINDS.some((kind) => kind === value);
}

export function parseFaults(value: string | undefined): Faults {
  if (!value) return {};
  return value.split(",").reduce<Faults>((faults, pair) => {
    const [name, kind] = pair.split(":").map((part) => part.trim());
    if (!isRequestName(name) || !isFaultKind(kind)) return faults;
    return { ...faults, [name]: kind };
  }, {});
}

export function parsePracticeId(value: string | undefined): string {
  const isFixture = FIXTURE_PRACTICE_IDS.some((id) => id === value);
  return value !== undefined && isFixture ? value : DEFAULT_PRACTICE_ID;
}

export function readEnvSeeds(raw: RawEnvSeeds): DevSettings {
  return {
    practiceId: parsePracticeId(raw.practiceId),
    latencyMs: parseLatency(raw.latencyMs),
    faults: parseFaults(raw.faults),
    forceOffline: false,
  };
}

// EXPO_PUBLIC_* values are inlined at build time and must be referenced with dot notation.
function seedsFromEnv(): DevSettings {
  return readEnvSeeds({
    practiceId: process.env.EXPO_PUBLIC_PRACTICE_ID,
    latencyMs: process.env.EXPO_PUBLIC_LATENCY_MS,
    faults: process.env.EXPO_PUBLIC_FAULTS,
  });
}

type DevSettingsContextValue = { settings: DevSettings; apply: (next: DevSettings) => void };

const DevSettingsContext = createContext<DevSettingsContextValue | null>(null);
const ServicesContext = createContext<Services | null>(null);

export function DevSettingsProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: DevSettings;
}) {
  const [settings, setSettings] = useState<DevSettings>(() => initial ?? seedsFromEnv());
  const apply = useCallback((next: DevSettings) => setSettings(next), []);
  const value = useMemo(() => ({ settings, apply }), [settings, apply]);
  const services = useMemo(
    () =>
      createServices(
        createFakeTransport({ latencyMs: settings.latencyMs, faults: settings.faults }),
      ),
    [settings.latencyMs, settings.faults],
  );

  return (
    <DevSettingsContext.Provider value={value}>
      <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
    </DevSettingsContext.Provider>
  );
}

function requireContext<T>(value: T | null, hook: string): T {
  if (value === null) throw new Error(`${hook} must be used inside DevSettingsProvider`);
  return value;
}

export function useDevSettings(): DevSettingsContextValue {
  return requireContext(useContext(DevSettingsContext), "useDevSettings");
}

export function useServices(): Services {
  return requireContext(useContext(ServicesContext), "useServices");
}

export function useSession(): PatientSession {
  const { settings } = useDevSettings();
  return useMemo(() => ({ ...PATIENT, practiceId: settings.practiceId }), [settings.practiceId]);
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest src/lib/devSettings.test.tsx`
Expected: PASS, 16 tests.

- [ ] **Step 6: Write the shared test provider stack**

`src/test/providers.tsx` (excluded from coverage; every later test that needs providers uses this instead of its own wrapper):

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react-native";
import { useState, type ReactElement, type ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DevSettingsProvider, type DevSettings } from "@/lib/devSettings";
import { NetworkProvider } from "@/lib/network";

export type ProviderOptions = { settings?: Partial<DevSettings>; client?: QueryClient };

const METRICS = {
  insets: { top: 59, bottom: 34, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: 393, height: 852 },
};

export function testSettings(overrides: Partial<DevSettings> = {}): DevSettings {
  return { practiceId: "prc-0421", latencyMs: 0, faults: {}, forceOffline: false, ...overrides };
}

function testClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

export function TestProviders({ children, settings, client }: ProviderOptions & { children: ReactNode }) {
  const devSettings = testSettings(settings);
  const [fallback] = useState(testClient);
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <DevSettingsProvider initial={devSettings}>
        <QueryClientProvider client={client ?? fallback}>
          <NetworkProvider forceOffline={devSettings.forceOffline}>{children}</NetworkProvider>
        </QueryClientProvider>
      </DevSettingsProvider>
    </SafeAreaProvider>
  );
}

export function hookWrapper(options: ProviderOptions = {}) {
  return ({ children }: { children: ReactNode }) => <TestProviders {...options}>{children}</TestProviders>;
}

export function renderWithProviders(ui: ReactElement, options: ProviderOptions = {}): RenderResult {
  return render(ui, { wrapper: hookWrapper(options) });
}
```

- [ ] **Step 7: Scoped verify**

```bash
npx jest src/lib
npm run typecheck
npm run lint
```

Expected: all exit 0 (`typecheck` covers `src/test/providers.tsx`; it has no test of its own).

---

### Task 7: Draft state, reducer, selectors and provider

**T007** · **Visual:** none — pure state.

**Files:**
- Create: `src/features/econsult/draft.ts`
- Create: `src/features/econsult/draft.test.ts`
- Create: `src/features/econsult/DraftProvider.tsx`
- Create: `src/features/econsult/DraftProvider.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:

```ts
export type DraftPhoto =
  | { status: "preparing"; pickId: string }
  | { status: "ready"; pickId: string; uri: string; width: number; height: number };
export type ReadyPhoto = Extract<DraftPhoto, { status: "ready" }>;
export type AttachmentStatus = "none" | "attached" | "failed";
export type DraftState = {
  recipientId: string | null; answers: Readonly<Record<string, string>>; message: string;
  photo: DraftPhoto | null; idempotencyKey: string | null; econsultId: string | null; attachment: AttachmentStatus;
};
export type DraftAction =
  | { type: "recipientSelected"; recipientId: string }
  | { type: "answerChanged"; questionId: string; value: string }
  | { type: "messageChanged"; message: string }
  | { type: "photoPickStarted"; pickId: string }
  | { type: "photoReady"; pickId: string; uri: string; width: number; height: number }
  | { type: "photoRemoved" }
  | { type: "submitStarted"; idempotencyKey: string }
  | { type: "econsultCreated"; econsultId: string }
  | { type: "attachmentSettled"; attachment: AttachmentStatus }
  | { type: "reset" };
export const initialDraft: DraftState;
export function draftReducer(state: DraftState, action: DraftAction): DraftState;
export function hasUnsentContent(state: DraftState): boolean;
export function isPhotoPreparing(state: DraftState): boolean;
export function readyPhoto(state: DraftState): ReadyPhoto | null;
export function shouldGuardLeaving(state: DraftState): boolean;
// DraftProvider.tsx
export function DraftProvider(props: { children: ReactNode; initial?: DraftState }): JSX.Element;
export function useDraft(): { draft: DraftState; dispatch: Dispatch<DraftAction> };
```

- [ ] **Step 1: Write the failing reducer tests**

`src/features/econsult/draft.test.ts`:

```ts
import {
  draftReducer,
  hasUnsentContent,
  initialDraft,
  isPhotoPreparing,
  readyPhoto,
  shouldGuardLeaving,
  type DraftState,
} from "./draft";

const READY = { type: "photoReady", pickId: "p1", uri: "file:///a.jpg", width: 100, height: 80 } as const;

describe("draftReducer", () => {
  test("selects a recipient without mutating the previous state", () => {
    const next = draftReducer(initialDraft, { type: "recipientSelected", recipientId: "ct-11" });

    expect(next.recipientId).toBe("ct-11");
    expect(initialDraft.recipientId).toBeNull();
    expect(next).not.toBe(initialDraft);
  });

  test("stores an answer per question and keeps the others", () => {
    const one = draftReducer(initialDraft, { type: "answerChanged", questionId: "q1", value: "a" });
    const two = draftReducer(one, { type: "answerChanged", questionId: "q2", value: "b" });

    expect(two.answers).toEqual({ q1: "a", q2: "b" });
    expect(one.answers).toEqual({ q1: "a" });
  });

  test("changing the recipient keeps the answers, message and photo", () => {
    const filled = draftReducer(
      draftReducer(
        draftReducer(initialDraft, { type: "answerChanged", questionId: "q1", value: "a" }),
        { type: "messageChanged", message: "Hi" },
      ),
      { type: "photoPickStarted", pickId: "p1" },
    );

    const next = draftReducer(filled, { type: "recipientSelected", recipientId: "ct-12" });

    expect(next.answers).toEqual({ q1: "a" });
    expect(next.message).toBe("Hi");
    expect(next.photo).toEqual({ status: "preparing", pickId: "p1" });
  });

  test("a pick starts a preparing photo and hasUnsentContent becomes true", () => {
    const next = draftReducer(initialDraft, { type: "photoPickStarted", pickId: "p1" });

    expect(next.photo).toEqual({ status: "preparing", pickId: "p1" });
    expect(isPhotoPreparing(next)).toBe(true);
    expect(hasUnsentContent(next)).toBe(true);
  });

  test("a ready result for the current pick replaces the preparing photo", () => {
    const preparing = draftReducer(initialDraft, { type: "photoPickStarted", pickId: "p1" });

    const next = draftReducer(preparing, READY);

    expect(next.photo).toEqual({ status: "ready", pickId: "p1", uri: "file:///a.jpg", width: 100, height: 80 });
    expect(readyPhoto(next)?.uri).toBe("file:///a.jpg");
  });

  test("a ready result for a superseded pick is ignored", () => {
    const second = draftReducer(
      draftReducer(initialDraft, { type: "photoPickStarted", pickId: "p1" }),
      { type: "photoPickStarted", pickId: "p2" },
    );

    const next = draftReducer(second, READY);

    expect(next).toBe(second);
  });

  test("a ready result after removal is ignored", () => {
    const removed = draftReducer(
      draftReducer(initialDraft, { type: "photoPickStarted", pickId: "p1" }),
      { type: "photoRemoved" },
    );

    const next = draftReducer(removed, READY);

    expect(next.photo).toBeNull();
  });

  test("removing the photo clears it", () => {
    const ready = draftReducer(
      draftReducer(initialDraft, { type: "photoPickStarted", pickId: "p1" }),
      READY,
    );

    const next = draftReducer(ready, { type: "photoRemoved" });

    expect(next.photo).toBeNull();
    expect(readyPhoto(next)).toBeNull();
  });

  test("submitStarted sets the idempotency key once and keeps it on retry", () => {
    const first = draftReducer(initialDraft, { type: "submitStarted", idempotencyKey: "k1" });
    const retry = draftReducer(first, { type: "submitStarted", idempotencyKey: "k2" });

    expect(first.idempotencyKey).toBe("k1");
    expect(retry.idempotencyKey).toBe("k1");
  });

  test("econsultCreated and attachmentSettled record the outcome", () => {
    const created = draftReducer(initialDraft, { type: "econsultCreated", econsultId: "ec-1" });
    const settled = draftReducer(created, { type: "attachmentSettled", attachment: "failed" });

    expect(settled.econsultId).toBe("ec-1");
    expect(settled.attachment).toBe("failed");
  });

  test("reset returns the initial draft", () => {
    const filled = draftReducer(initialDraft, { type: "messageChanged", message: "Hi" });

    expect(draftReducer(filled, { type: "reset" })).toEqual(initialDraft);
  });
});

describe("selectors", () => {
  test("hasUnsentContent ignores whitespace-only messages", () => {
    const state: DraftState = { ...initialDraft, message: "   " };

    expect(hasUnsentContent(state)).toBe(false);
  });

  test("shouldGuardLeaving is true only for unsent content before the e-consult exists", () => {
    const typed: DraftState = { ...initialDraft, message: "Hi" };
    const created: DraftState = { ...typed, econsultId: "ec-1" };

    expect(shouldGuardLeaving(initialDraft)).toBe(false);
    expect(shouldGuardLeaving(typed)).toBe(true);
    expect(shouldGuardLeaving(created)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/features/econsult/draft.test.ts`
Expected: FAIL with "Cannot find module './draft'".

- [ ] **Step 3: Write the reducer**

`src/features/econsult/draft.ts`:

```ts
export type DraftPhoto =
  | { status: "preparing"; pickId: string }
  | { status: "ready"; pickId: string; uri: string; width: number; height: number };

export type ReadyPhoto = Extract<DraftPhoto, { status: "ready" }>;

export type AttachmentStatus = "none" | "attached" | "failed";

export type DraftState = {
  recipientId: string | null;
  answers: Readonly<Record<string, string>>;
  message: string;
  photo: DraftPhoto | null;
  idempotencyKey: string | null;
  econsultId: string | null;
  attachment: AttachmentStatus;
};

export type DraftAction =
  | { type: "recipientSelected"; recipientId: string }
  | { type: "answerChanged"; questionId: string; value: string }
  | { type: "messageChanged"; message: string }
  | { type: "photoPickStarted"; pickId: string }
  | { type: "photoReady"; pickId: string; uri: string; width: number; height: number }
  | { type: "photoRemoved" }
  | { type: "submitStarted"; idempotencyKey: string }
  | { type: "econsultCreated"; econsultId: string }
  | { type: "attachmentSettled"; attachment: AttachmentStatus }
  | { type: "reset" };

export const initialDraft: DraftState = {
  recipientId: null,
  answers: {},
  message: "",
  photo: null,
  idempotencyKey: null,
  econsultId: null,
  attachment: "none",
};

// A late result only counts for the pick the draft is still waiting on.
function applyPhotoReady(
  state: DraftState,
  action: Extract<DraftAction, { type: "photoReady" }>,
): DraftState {
  if (state.photo?.pickId !== action.pickId) return state;
  const { type: _type, ...photo } = action;
  return { ...state, photo: { status: "ready", ...photo } };
}

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case "recipientSelected":
      return { ...state, recipientId: action.recipientId };
    case "answerChanged":
      return { ...state, answers: { ...state.answers, [action.questionId]: action.value } };
    case "messageChanged":
      return { ...state, message: action.message };
    case "photoPickStarted":
      return { ...state, photo: { status: "preparing", pickId: action.pickId } };
    case "photoReady":
      return applyPhotoReady(state, action);
    case "photoRemoved":
      return { ...state, photo: null };
    case "submitStarted":
      return { ...state, idempotencyKey: state.idempotencyKey ?? action.idempotencyKey };
    case "econsultCreated":
      return { ...state, econsultId: action.econsultId };
    case "attachmentSettled":
      return { ...state, attachment: action.attachment };
    case "reset":
      return initialDraft;
  }
}

export function hasUnsentContent(state: DraftState): boolean {
  return state.message.trim().length > 0 || state.photo !== null;
}

export function isPhotoPreparing(state: DraftState): boolean {
  return state.photo?.status === "preparing";
}

export function readyPhoto(state: DraftState): ReadyPhoto | null {
  return state.photo?.status === "ready" ? state.photo : null;
}

export function shouldGuardLeaving(state: DraftState): boolean {
  return hasUnsentContent(state) && state.econsultId === null;
}
```

- [ ] **Step 4: Run the reducer tests to verify they pass**

Run: `npx jest src/features/econsult/draft.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 5: Write the failing provider test**

`src/features/econsult/DraftProvider.test.tsx`:

```tsx
import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { initialDraft } from "./draft";
import { DraftProvider, useDraft } from "./DraftProvider";

const wrapper = ({ children }: { children: ReactNode }) => <DraftProvider>{children}</DraftProvider>;

describe("DraftProvider", () => {
  test("starts from the initial draft and applies actions", () => {
    const { result } = renderHook(() => useDraft(), { wrapper });

    expect(result.current.draft).toEqual(initialDraft);

    act(() => result.current.dispatch({ type: "messageChanged", message: "Hi" }));

    expect(result.current.draft.message).toBe("Hi");
  });

  test("accepts an initial draft", () => {
    const initial = { ...initialDraft, recipientId: "ct-11" };
    const { result } = renderHook(() => useDraft(), {
      wrapper: ({ children }) => <DraftProvider initial={initial}>{children}</DraftProvider>,
    });

    expect(result.current.draft.recipientId).toBe("ct-11");
  });

  test("useDraft throws outside the provider", () => {
    const silence = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useDraft())).toThrow(/DraftProvider/);

    silence.mockRestore();
  });
});
```

- [ ] **Step 6: Run the provider test to verify it fails**

Run: `npx jest src/features/econsult/DraftProvider.test.tsx`
Expected: FAIL with "Cannot find module './DraftProvider'".

- [ ] **Step 7: Write the provider**

`src/features/econsult/DraftProvider.tsx`:

```tsx
import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import { draftReducer, initialDraft, type DraftAction, type DraftState } from "./draft";

type DraftContextValue = { draft: DraftState; dispatch: Dispatch<DraftAction> };

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children, initial }: { children: ReactNode; initial?: DraftState }) {
  const [draft, dispatch] = useReducer(draftReducer, initial ?? initialDraft);
  const value = useMemo(() => ({ draft, dispatch }), [draft]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft(): DraftContextValue {
  const value = useContext(DraftContext);
  if (value === null) throw new Error("useDraft must be used inside DraftProvider");
  return value;
}
```

- [ ] **Step 8: Run the provider test to verify it passes**

Run: `npx jest src/features/econsult/DraftProvider.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 9: Scoped verify**

```bash
npx jest src/features
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 8: Shared queries, recipient helpers and the recipients and questions hooks

**T008** · **Visual:** none — hooks and pure functions.

**Files:**
- Create: `src/features/econsult/queries.ts`
- Create: `src/features/econsult/recipients.ts`
- Create: `src/features/econsult/recipients.test.ts`
- Create: `src/features/econsult/useRecipients.ts`
- Create: `src/features/econsult/useRecipients.test.tsx`
- Create: `src/features/econsult/useQuestions.ts`
- Create: `src/features/econsult/useQuestions.test.tsx`

**Interfaces:**
- Consumes: `Services` (Task 4); `useServices`, `useSession` (Task 6); `hookWrapper` from `src/test/providers.tsx` (Task 6); `devWarn` (Task 5); `CareTeamMember`, `CareTeamRole`, `PracticeEConsultConfig`, `Question` (Task 2).
- Produces:

```ts
// queries.ts
export const practiceKeys: { config(practiceId: string): readonly ["practice", string, "config"]; careTeam(practiceId: string): readonly ["practice", string, "careTeam"] };
export function configQuery(services: Services, practiceId: string): query options for PracticeEConsultConfig;
export function careTeamQuery(services: Services, practiceId: string): query options for CareTeamMember[];
// recipients.ts
export type Recipient = CareTeamMember;
export const UNKNOWN_RECIPIENT = "your practice";
export function roleLabel(role: CareTeamRole): string;
export function joinRecipients(config: PracticeEConsultConfig, careTeam: CareTeamMember[]): Recipient[];
export function recipientNameFor(result: RecipientsResult, recipientId: string | null): string;
// useRecipients.ts
export type RecipientsResult =
  | { status: "loading" } | { status: "error"; retry: () => void } | { status: "empty" }
  | { status: "ready"; recipients: Recipient[]; questions: Question[] };
export function combineRecipients(results: [UseQueryResult<PracticeEConsultConfig>, UseQueryResult<CareTeamMember[]>]): RecipientsResult;
export function useRecipients(): RecipientsResult;
// useQuestions.ts
export function useQuestions(): Question[];
```

- [ ] **Step 1: Write the failing tests**

`src/features/econsult/recipients.test.ts`:

```ts
import type { CareTeamMember, PracticeEConsultConfig } from "@/api/contracts";
import type { RecipientsResult } from "./useRecipients";
import { joinRecipients, recipientNameFor, roleLabel, UNKNOWN_RECIPIENT } from "./recipients";

const TEAM: CareTeamMember[] = [
  { id: "ct-11", displayName: "Dr. J. de Vries", role: "gp" },
  { id: "ct-12", displayName: "M. Bakker", role: "nurse" },
  { id: "ct-20", displayName: "Dr. P. Mulder", role: "gp" },
];

function config(recipientIds: string[]): PracticeEConsultConfig {
  return { practiceId: "prc-0421", recipientIds, questions: [] };
}

describe("joinRecipients", () => {
  test("keeps the practice's order and only listed members", () => {
    const result = joinRecipients(config(["ct-12", "ct-11"]), TEAM);

    expect(result.map((r) => r.id)).toEqual(["ct-12", "ct-11"]);
  });

  test("drops a recipient id that is not in the care team and warns in development", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = joinRecipients(config(["ct-11", "ct-99"]), TEAM);

    expect(result.map((r) => r.id)).toEqual(["ct-11"]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("ct-99"));
    warn.mockRestore();
  });

  test("returns nothing when the practice lists no recipients", () => {
    expect(joinRecipients(config([]), TEAM)).toEqual([]);
  });
});

describe("roleLabel", () => {
  test.each([
    ["gp", "GP"],
    ["nurse", "Practice nurse"],
    ["assistant", "Practice assistant"],
    ["other", "Care team member"],
  ] as const)("%s -> %s", (role, label) => {
    expect(roleLabel(role)).toBe(label);
  });
});

describe("recipientNameFor", () => {
  const ready: RecipientsResult = { status: "ready", recipients: TEAM, questions: [] };

  test("returns the selected recipient's name once the list is ready", () => {
    expect(recipientNameFor(ready, "ct-12")).toBe("M. Bakker");
  });

  test("falls back for an unknown id or no selection", () => {
    expect(recipientNameFor(ready, "ct-99")).toBe(UNKNOWN_RECIPIENT);
    expect(recipientNameFor(ready, null)).toBe(UNKNOWN_RECIPIENT);
  });

  test("falls back while the list is not ready", () => {
    expect(recipientNameFor({ status: "loading" }, "ct-12")).toBe(UNKNOWN_RECIPIENT);
  });
});
```

`src/features/econsult/useRecipients.test.tsx`:

```tsx
import type { UseQueryResult } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { CareTeamMember, PracticeEConsultConfig } from "@/api/contracts";
import { hookWrapper } from "@/test/providers";
import { combineRecipients, useRecipients } from "./useRecipients";

type ConfigResult = UseQueryResult<PracticeEConsultConfig>;
type TeamResult = UseQueryResult<CareTeamMember[]>;

function fakeResult<T>(overrides: Partial<UseQueryResult<T>>): UseQueryResult<T> {
  return { isError: false, data: undefined, refetch: jest.fn(), ...overrides } as UseQueryResult<T>;
}

const CONFIG: PracticeEConsultConfig = { practiceId: "prc-0421", recipientIds: ["ct-11"], questions: [] };
const TEAM: CareTeamMember[] = [{ id: "ct-11", displayName: "Dr. J. de Vries", role: "gp" }];

describe("combineRecipients", () => {
  test("is loading while either request has no data", () => {
    const result = combineRecipients([fakeResult<PracticeEConsultConfig>({ data: CONFIG }), fakeResult<CareTeamMember[]>({})]);

    expect(result.status).toBe("loading");
  });

  test("is an error when either request failed, even with stale data, and retry refetches the failed one", () => {
    const refetch = jest.fn();
    const config = fakeResult<PracticeEConsultConfig>({ data: CONFIG, isError: true, refetch });
    const team = fakeResult<CareTeamMember[]>({ data: TEAM });

    const result = combineRecipients([config as ConfigResult, team as TeamResult]);

    expect(result.status).toBe("error");
    if (result.status === "error") result.retry();
    expect(refetch).toHaveBeenCalled();
    expect(team.refetch).not.toHaveBeenCalled();
  });

  test("retry refetches only the care team when that is the failed request", () => {
    const refetch = jest.fn();
    const config = fakeResult<PracticeEConsultConfig>({ data: CONFIG });
    const team = fakeResult<CareTeamMember[]>({ isError: true, refetch });

    const result = combineRecipients([config as ConfigResult, team as TeamResult]);

    if (result.status === "error") result.retry();
    expect(refetch).toHaveBeenCalled();
    expect(config.refetch).not.toHaveBeenCalled();
  });

  test("is empty when no recipient id matches the care team", () => {
    const result = combineRecipients([
      fakeResult<PracticeEConsultConfig>({ data: { ...CONFIG, recipientIds: [] } }),
      fakeResult<CareTeamMember[]>({ data: TEAM }),
    ]);

    expect(result.status).toBe("empty");
  });

  test("is ready with the joined recipients and the questions", () => {
    const result = combineRecipients([
      fakeResult<PracticeEConsultConfig>({ data: CONFIG }),
      fakeResult<CareTeamMember[]>({ data: TEAM }),
    ]);

    expect(result).toEqual({ status: "ready", recipients: TEAM, questions: [] });
  });
});

describe("useRecipients", () => {
  test("goes from loading to ready with the fixture practice", async () => {
    const { result } = renderHook(() => useRecipients(), { wrapper: hookWrapper() });

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));

    if (result.current.status === "ready") {
      expect(result.current.recipients.map((r) => r.id)).toEqual(["ct-11", "ct-12", "ct-19"]);
      expect(result.current.questions).toHaveLength(2);
    }
  });

  test("reports an error when the config request fails", async () => {
    const { result } = renderHook(() => useRecipients(), {
      wrapper: hookWrapper({ settings: { faults: { config: "server" } } }),
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  test("reports an error when the care team request fails", async () => {
    const { result } = renderHook(() => useRecipients(), {
      wrapper: hookWrapper({ settings: { faults: { careTeam: "server" } } }),
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  test("reports empty for a practice without recipients", async () => {
    const { result } = renderHook(() => useRecipients(), {
      wrapper: hookWrapper({ settings: { practiceId: "prc-0000" } }),
    });

    await waitFor(() => expect(result.current.status).toBe("empty"));
  });
});
```

`src/features/econsult/useQuestions.test.tsx`:

```tsx
import { renderHook, waitFor } from "@testing-library/react-native";
import { hookWrapper } from "@/test/providers";
import { useQuestions } from "./useQuestions";

describe("useQuestions", () => {
  test("returns no questions until the config arrives, then the practice's questions", async () => {
    const { result } = renderHook(() => useQuestions(), { wrapper: hookWrapper() });

    expect(result.current).toEqual([]);
    await waitFor(() => expect(result.current).toHaveLength(2));
  });

  test("returns no questions for a practice that configured none", async () => {
    const { result } = renderHook(() => useQuestions(), {
      wrapper: hookWrapper({ settings: { practiceId: "prc-0873" } }),
    });

    await waitFor(() => expect(result.current).toEqual([]));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/features/econsult/recipients.test.ts src/features/econsult/useRecipients.test.tsx src/features/econsult/useQuestions.test.tsx`
Expected: FAIL, every suite with "Cannot find module".

- [ ] **Step 3: Write the modules**

`src/features/econsult/queries.ts`:

```ts
import { queryOptions } from "@tanstack/react-query";
import type { Services } from "@/api/services";

// Keys include the practice id so switching practice never serves another practice's cache.
export const practiceKeys = {
  config: (practiceId: string) => ["practice", practiceId, "config"] as const,
  careTeam: (practiceId: string) => ["practice", practiceId, "careTeam"] as const,
};

export function configQuery(services: Services, practiceId: string) {
  return queryOptions({
    queryKey: practiceKeys.config(practiceId),
    queryFn: () => services.getPracticeConfig(practiceId),
  });
}

export function careTeamQuery(services: Services, practiceId: string) {
  return queryOptions({
    queryKey: practiceKeys.careTeam(practiceId),
    queryFn: () => services.getCareTeam(practiceId),
  });
}
```

`src/features/econsult/recipients.ts`:

```ts
import type { CareTeamMember, CareTeamRole, PracticeEConsultConfig } from "@/api/contracts";
import { devWarn } from "@/lib/devWarn";
import type { RecipientsResult } from "./useRecipients";

export type Recipient = CareTeamMember;

export const UNKNOWN_RECIPIENT = "your practice";

const ROLE_LABELS: Record<CareTeamRole, string> = {
  gp: "GP",
  nurse: "Practice nurse",
  assistant: "Practice assistant",
  other: "Care team member",
};

export function roleLabel(role: CareTeamRole): string {
  return ROLE_LABELS[role];
}

export function joinRecipients(
  config: PracticeEConsultConfig,
  careTeam: CareTeamMember[],
): Recipient[] {
  const byId = new Map(careTeam.map((member) => [member.id, member]));
  return config.recipientIds.flatMap((id) => {
    const member = byId.get(id);
    if (member) return [member];
    devWarn(`Recipient ${id} is not in the care team of ${config.practiceId}`);
    return [];
  });
}

export function recipientNameFor(result: RecipientsResult, recipientId: string | null): string {
  if (result.status !== "ready") return UNKNOWN_RECIPIENT;
  return result.recipients.find((r) => r.id === recipientId)?.displayName ?? UNKNOWN_RECIPIENT;
}
```

`src/features/econsult/useRecipients.ts`:

```ts
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import type { CareTeamMember, PracticeEConsultConfig, Question } from "@/api/contracts";
import { useServices, useSession } from "@/lib/devSettings";
import { careTeamQuery, configQuery } from "./queries";
import { joinRecipients, type Recipient } from "./recipients";

export type RecipientsResult =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "empty" }
  | { status: "ready"; recipients: Recipient[]; questions: Question[] };

type Results = [UseQueryResult<PracticeEConsultConfig>, UseQueryResult<CareTeamMember[]>];

// Error wins over stale data: a failed refetch must show the error, not last time's list.
export function combineRecipients([config, team]: Results): RecipientsResult {
  if (config.isError || team.isError) {
    return {
      status: "error",
      retry: () => {
        if (config.isError) void config.refetch();
        if (team.isError) void team.refetch();
      },
    };
  }
  if (!config.data || !team.data) return { status: "loading" };
  const recipients = joinRecipients(config.data, team.data);
  if (recipients.length === 0) return { status: "empty" };
  return { status: "ready", recipients, questions: config.data.questions };
}

export function useRecipients(): RecipientsResult {
  const services = useServices();
  const { practiceId } = useSession();
  return useQueries({
    queries: [configQuery(services, practiceId), careTeamQuery(services, practiceId)],
    combine: combineRecipients,
  });
}
```

The type-only import of `RecipientsResult` into `recipients.ts` creates no runtime cycle.

`src/features/econsult/useQuestions.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import type { Question } from "@/api/contracts";
import { useServices, useSession } from "@/lib/devSettings";
import { configQuery } from "./queries";

const NO_QUESTIONS: Question[] = [];

export function useQuestions(): Question[] {
  const services = useServices();
  const { practiceId } = useSession();
  const { data } = useQuery(configQuery(services, practiceId));
  return data?.questions ?? NO_QUESTIONS;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/features/econsult/recipients.test.ts src/features/econsult/useRecipients.test.tsx src/features/econsult/useQuestions.test.tsx`
Expected: PASS, 21 tests.

- [ ] **Step 5: Scoped verify**

```bash
npx jest src/features
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 9: Validation and the step model

**T009** · **Visual:** none — pure functions.

**Files:**
- Create: `src/features/econsult/validation.ts`
- Create: `src/features/econsult/validation.test.ts`
- Create: `src/features/econsult/steps.ts`
- Create: `src/features/econsult/steps.test.ts`

**Interfaces:**
- Consumes: `Question` (Task 2).
- Produces:

```ts
// validation.ts
export const MESSAGE_NUDGE_MIN_LENGTH = 20;
export const REQUIRED_ERROR = "This question is required";
export const EMPTY_MESSAGE_ERROR = "Please write your question before sending";
export type AnswerErrors = Readonly<Record<string, string>>;
export function validateAnswers(questions: Question[], answers: Readonly<Record<string, string>>): AnswerErrors;
export function validateMessage(message: string): string | null;
export function isMessageThin(message: string): boolean;
// steps.ts
export type FlowStep = "recipient" | "questions" | "message";
export const STEP_TITLES: Record<FlowStep, string>;
export function stepCount(hasQuestions: boolean): number;
export function stepNumber(step: FlowStep, hasQuestions: boolean): number;
export function routeAfterRecipient(hasQuestions: boolean): "/econsult/questions" | "/econsult/message";
```

- [ ] **Step 1: Write the failing tests**

`src/features/econsult/validation.test.ts`:

```ts
import type { Question } from "@/api/contracts";
import {
  EMPTY_MESSAGE_ERROR,
  isMessageThin,
  REQUIRED_ERROR,
  validateAnswers,
  validateMessage,
} from "./validation";

const QUESTIONS: Question[] = [
  { id: "q-duration", label: "How long?", type: "choice", options: ["A", "B"], required: true },
  { id: "q-medication", label: "Taking anything?", type: "text", required: false },
];

describe("validateAnswers", () => {
  test("flags a required question that has no answer", () => {
    expect(validateAnswers(QUESTIONS, {})).toEqual({ "q-duration": REQUIRED_ERROR });
  });

  test("treats a whitespace-only answer as missing", () => {
    expect(validateAnswers(QUESTIONS, { "q-duration": "   " })).toEqual({ "q-duration": REQUIRED_ERROR });
  });

  test("passes when every required question is answered", () => {
    expect(validateAnswers(QUESTIONS, { "q-duration": "A" })).toEqual({});
  });

  test("never flags an optional question", () => {
    expect(validateAnswers([QUESTIONS[1]], {})).toEqual({});
  });
});

describe("validateMessage", () => {
  test("rejects an empty or whitespace-only message", () => {
    expect(validateMessage("")).toBe(EMPTY_MESSAGE_ERROR);
    expect(validateMessage("  \n ")).toBe(EMPTY_MESSAGE_ERROR);
  });

  test("accepts any non-empty message", () => {
    expect(validateMessage("My knee hurts")).toBeNull();
  });
});

describe("isMessageThin", () => {
  test("is true for a short non-empty message and false for an empty or long one", () => {
    expect(isMessageThin("my knee hurts")).toBe(true);
    expect(isMessageThin("")).toBe(false);
    expect(isMessageThin("My left knee has hurt for two weeks after a fall")).toBe(false);
  });
});
```

`src/features/econsult/steps.test.ts`:

```ts
import { routeAfterRecipient, STEP_TITLES, stepCount, stepNumber } from "./steps";

describe("steps", () => {
  test("a practice with questions has three steps", () => {
    expect(stepCount(true)).toBe(3);
    expect(stepNumber("recipient", true)).toBe(1);
    expect(stepNumber("questions", true)).toBe(2);
    expect(stepNumber("message", true)).toBe(3);
  });

  test("a practice without questions has two steps and the message is step two", () => {
    expect(stepCount(false)).toBe(2);
    expect(stepNumber("recipient", false)).toBe(1);
    expect(stepNumber("message", false)).toBe(2);
  });

  test("after the recipient the flow goes to questions only when there are some", () => {
    expect(routeAfterRecipient(true)).toBe("/econsult/questions");
    expect(routeAfterRecipient(false)).toBe("/econsult/message");
  });

  test("every step has a patient-facing title", () => {
    expect(STEP_TITLES.recipient).toBe("Who are you writing to?");
    expect(STEP_TITLES.questions).toBe("A few questions from your practice");
    expect(STEP_TITLES.message).toBe("Your message");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/features/econsult/validation.test.ts src/features/econsult/steps.test.ts`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Write the modules**

`src/features/econsult/validation.ts`:

```ts
import type { Question } from "@/api/contracts";

export const MESSAGE_NUDGE_MIN_LENGTH = 20;
export const REQUIRED_ERROR = "This question is required";
export const EMPTY_MESSAGE_ERROR = "Please write your question before sending";

export type AnswerErrors = Readonly<Record<string, string>>;

export function validateAnswers(
  questions: Question[],
  answers: Readonly<Record<string, string>>,
): AnswerErrors {
  return questions.reduce<Record<string, string>>((errors, question) => {
    if (!question.required) return errors;
    const value = answers[question.id]?.trim() ?? "";
    return value.length > 0 ? errors : { ...errors, [question.id]: REQUIRED_ERROR };
  }, {});
}

export function validateMessage(message: string): string | null {
  return message.trim().length > 0 ? null : EMPTY_MESSAGE_ERROR;
}

// A soft nudge, never a block: "my knee hurts" is exactly the message GPs cannot act on.
export function isMessageThin(message: string): boolean {
  const length = message.trim().length;
  return length > 0 && length < MESSAGE_NUDGE_MIN_LENGTH;
}
```

`src/features/econsult/steps.ts`:

```ts
export type FlowStep = "recipient" | "questions" | "message";

export const STEP_TITLES: Record<FlowStep, string> = {
  recipient: "Who are you writing to?",
  questions: "A few questions from your practice",
  message: "Your message",
};

const STEPS_WITH_QUESTIONS = 3;
const STEPS_WITHOUT_QUESTIONS = 2;

export function stepCount(hasQuestions: boolean): number {
  return hasQuestions ? STEPS_WITH_QUESTIONS : STEPS_WITHOUT_QUESTIONS;
}

export function stepNumber(step: FlowStep, hasQuestions: boolean): number {
  if (step === "recipient") return 1;
  if (step === "questions") return 2;
  return stepCount(hasQuestions);
}

export function routeAfterRecipient(hasQuestions: boolean): "/econsult/questions" | "/econsult/message" {
  return hasQuestions ? "/econsult/questions" : "/econsult/message";
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/features/econsult/validation.test.ts src/features/econsult/steps.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Scoped verify**

```bash
npx jest src/features
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 10: Sending, the partial-failure outcome and the mutations

**T010** · **Visual:** none — no renderable output.

**Files:**
- Create: `src/features/econsult/submit.ts`
- Create: `src/features/econsult/submit.test.ts`
- Create: `src/features/econsult/useSubmit.ts`
- Create: `src/features/econsult/useSubmit.test.tsx`

**Interfaces:**
- Consumes: `Services`, `createServices` (Task 4); `createFakeTransport` (Task 3); `PhotoFile`, `isApiError` (Task 3); `Answer`, `CreateEConsultRequest`, `PatientSession` (Task 2); `AttachmentStatus` (Task 7); `useServices` (Task 6); `hookWrapper` (Task 6).
- Produces:

```ts
// submit.ts
export type SubmitInput = { session: PatientSession; recipientId: string; message: string; answers: Readonly<Record<string, string>>; photo: PhotoFile | null; idempotencyKey: string };
export type SubmitOutcome = { econsultId: string; attachment: AttachmentStatus };
export function toAnswers(answers: Readonly<Record<string, string>>): Answer[];
export function toCreateRequest(input: SubmitInput): CreateEConsultRequest;
export function submitEConsult(services: Services, input: SubmitInput, onCreated: (econsultId: string) => void): Promise<SubmitOutcome>;
export function retryAttachment(services: Services, econsultId: string, photo: PhotoFile): Promise<AttachmentStatus>;
// useSubmit.ts
export function useSubmit(onCreated: (econsultId: string) => void): UseMutationResult<SubmitOutcome, Error, SubmitInput>;
export function useRetryAttachment(): UseMutationResult<AttachmentStatus, Error, { econsultId: string; photo: PhotoFile }>;
```

- [ ] **Step 1: Write the failing tests**

`src/features/econsult/submit.test.ts`:

```ts
import { createFakeTransport } from "@/api/fake/fakeTransport";
import { createServices, type Services } from "@/api/services";
import { retryAttachment, submitEConsult, toAnswers, toCreateRequest, type SubmitInput } from "./submit";

const SESSION = { patientId: "pat-1", practiceId: "prc-0421", displayName: "Ria" };
const PHOTO = { uri: "file:///cache/a.jpg", name: "photo.jpg", type: "image/jpeg" };

function input(overrides: Partial<SubmitInput> = {}): SubmitInput {
  return {
    session: SESSION,
    recipientId: "ct-11",
    message: "  My knee hurts  ",
    answers: { "q-duration": "1 to 4 weeks", "q-medication": "  " },
    photo: null,
    idempotencyKey: "key-1",
    ...overrides,
  };
}

describe("toAnswers and toCreateRequest", () => {
  test("drops blank answers and trims the rest", () => {
    expect(toAnswers({ a: " x ", b: "   " })).toEqual([{ questionId: "a", value: "x" }]);
  });

  test("builds the wire request from the session and the draft", () => {
    expect(toCreateRequest(input())).toEqual({
      patientId: "pat-1",
      recipientId: "ct-11",
      body: "My knee hurts",
      answers: [{ questionId: "q-duration", value: "1 to 4 weeks" }],
    });
  });
});

describe("submitEConsult", () => {
  const services = () => createServices(createFakeTransport({ latencyMs: 0 }));

  test("creates the e-consult and reports no attachment when there is no photo", async () => {
    const onCreated = jest.fn();

    const outcome = await submitEConsult(services(), input(), onCreated);

    expect(outcome).toEqual({ econsultId: expect.stringMatching(/^ec-/), attachment: "none" });
    expect(onCreated).toHaveBeenCalledWith(outcome.econsultId);
  });

  test("uploads the photo after creating and reports it attached", async () => {
    const outcome = await submitEConsult(services(), input({ photo: PHOTO }), jest.fn());

    expect(outcome.attachment).toBe("attached");
  });

  test("reports the partial failure when the upload fails after a successful create", async () => {
    const failing = createServices(createFakeTransport({ latencyMs: 0, faults: { upload: "server" } }));
    const onCreated = jest.fn();

    const outcome = await submitEConsult(failing, input({ photo: PHOTO }), onCreated);

    expect(outcome.attachment).toBe("failed");
    expect(onCreated).toHaveBeenCalledWith(outcome.econsultId);
  });

  test("rejects when the create fails and never reports a creation", async () => {
    const failing = createServices(createFakeTransport({ latencyMs: 0, faults: { create: "network" } }));
    const onCreated = jest.fn();

    await expect(submitEConsult(failing, input(), onCreated)).rejects.toMatchObject({ kind: "network" });
    expect(onCreated).not.toHaveBeenCalled();
  });

  test("a retry with the same idempotency key yields the same e-consult id", async () => {
    const shared = services();

    const first = await submitEConsult(shared, input(), jest.fn());
    const second = await submitEConsult(shared, input(), jest.fn());

    expect(second.econsultId).toBe(first.econsultId);
  });

  test("an unexpected upload error is not swallowed into a failed attachment", async () => {
    const broken: Services = {
      ...services(),
      uploadAttachment: async () => {
        throw new TypeError("bug");
      },
    };

    await expect(submitEConsult(broken, input({ photo: PHOTO }), jest.fn())).rejects.toBeInstanceOf(TypeError);
  });
});

describe("retryAttachment", () => {
  test("returns attached when the upload succeeds", async () => {
    const shared = createServices(createFakeTransport({ latencyMs: 0 }));
    const { econsultId } = await submitEConsult(shared, input(), jest.fn());

    await expect(retryAttachment(shared, econsultId, PHOTO)).resolves.toBe("attached");
  });

  test("returns failed when the upload fails with an API error", async () => {
    const failing = createServices(createFakeTransport({ latencyMs: 0, faults: { upload: "network" } }));
    const { econsultId } = await submitEConsult(failing, input(), jest.fn());

    await expect(retryAttachment(failing, econsultId, PHOTO)).resolves.toBe("failed");
  });
});
```

`src/features/econsult/useSubmit.test.tsx`:

```tsx
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { hookWrapper } from "@/test/providers";
import { useRetryAttachment, useSubmit } from "./useSubmit";

const PHOTO = { uri: "file:///cache/a.jpg", name: "photo.jpg", type: "image/jpeg" };

const INPUT = {
  session: { patientId: "pat-1", practiceId: "prc-0421", displayName: "Ria" },
  recipientId: "ct-11",
  message: "My knee hurts",
  answers: {},
  photo: PHOTO,
  idempotencyKey: "key-1",
};

describe("useSubmit", () => {
  test("resolves the outcome and reports the created id", async () => {
    const onCreated = jest.fn();
    const { result } = renderHook(() => useSubmit(onCreated), { wrapper: hookWrapper() });

    let outcome;
    await act(async () => {
      outcome = await result.current.mutateAsync(INPUT);
    });

    expect(outcome).toEqual({ econsultId: expect.any(String), attachment: "attached" });
    expect(onCreated).toHaveBeenCalled();
  });

  test("exposes the error when the create fails instead of pausing", async () => {
    const { result } = renderHook(() => useSubmit(jest.fn()), {
      wrapper: hookWrapper({ settings: { faults: { create: "server" } } }),
    });

    act(() => result.current.mutate(INPUT));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ kind: "server" });
  });
});

describe("useRetryAttachment", () => {
  test("resolves failed for an e-consult the transport does not know", async () => {
    const { result } = renderHook(() => useRetryAttachment(), { wrapper: hookWrapper() });

    let status;
    await act(async () => {
      status = await result.current.mutateAsync({ econsultId: "ec-missing", photo: PHOTO });
    });

    expect(status).toBe("failed");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/features/econsult/submit.test.ts src/features/econsult/useSubmit.test.tsx`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Write the modules**

`src/features/econsult/submit.ts`:

```ts
import type { Answer, CreateEConsultRequest, PatientSession } from "@/api/contracts";
import type { Services } from "@/api/services";
import { isApiError, type PhotoFile } from "@/api/transport";
import type { AttachmentStatus } from "./draft";

export type SubmitInput = {
  session: PatientSession;
  recipientId: string;
  message: string;
  answers: Readonly<Record<string, string>>;
  photo: PhotoFile | null;
  idempotencyKey: string;
};

export type SubmitOutcome = { econsultId: string; attachment: AttachmentStatus };

export function toAnswers(answers: Readonly<Record<string, string>>): Answer[] {
  return Object.entries(answers)
    .filter(([, value]) => value.trim().length > 0)
    .map(([questionId, value]) => ({ questionId, value: value.trim() }));
}

export function toCreateRequest(input: SubmitInput): CreateEConsultRequest {
  return {
    patientId: input.session.patientId,
    recipientId: input.recipientId,
    body: input.message.trim(),
    answers: toAnswers(input.answers),
  };
}

// An API failure on the upload is an outcome the patient sees ("sent, photo not attached");
// anything else is a bug and must surface.
async function uploadOrFail(
  services: Services,
  econsultId: string,
  photo: PhotoFile,
): Promise<AttachmentStatus> {
  try {
    await services.uploadAttachment(econsultId, photo);
    return "attached";
  } catch (error) {
    if (!isApiError(error)) throw error;
    return "failed";
  }
}

export async function submitEConsult(
  services: Services,
  input: SubmitInput,
  onCreated: (econsultId: string) => void,
): Promise<SubmitOutcome> {
  const { econsultId } = await services.createEConsult(toCreateRequest(input), input.idempotencyKey);
  onCreated(econsultId);
  if (!input.photo) return { econsultId, attachment: "none" };
  return { econsultId, attachment: await uploadOrFail(services, econsultId, input.photo) };
}

export function retryAttachment(
  services: Services,
  econsultId: string,
  photo: PhotoFile,
): Promise<AttachmentStatus> {
  return uploadOrFail(services, econsultId, photo);
}
```

`src/features/econsult/useSubmit.ts`:

```ts
import { useMutation } from "@tanstack/react-query";
import type { PhotoFile } from "@/api/transport";
import { useServices } from "@/lib/devSettings";
import type { AttachmentStatus } from "./draft";
import { retryAttachment, submitEConsult, type SubmitInput, type SubmitOutcome } from "./submit";

// "always": a send must never sit paused behind a wrong offline flag; the timeout is the authority.
export function useSubmit(onCreated: (econsultId: string) => void) {
  const services = useServices();
  return useMutation<SubmitOutcome, Error, SubmitInput>({
    mutationFn: (input) => submitEConsult(services, input, onCreated),
    networkMode: "always",
    retry: 0,
  });
}

export function useRetryAttachment() {
  const services = useServices();
  return useMutation<AttachmentStatus, Error, { econsultId: string; photo: PhotoFile }>({
    mutationFn: ({ econsultId, photo }) => retryAttachment(services, econsultId, photo),
    networkMode: "always",
    retry: 0,
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/features/econsult/submit.test.ts src/features/econsult/useSubmit.test.tsx`
Expected: PASS, 13 tests.

- [ ] **Step 5: Scoped verify**

```bash
npx jest src/features
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 11: Photo processing

**T011** · **Visual:** none — the downscale runs against a mocked manipulator; its real output is seen on the message screen (Task 18).

**Files:**
- Create: `src/lib/photo.ts`
- Create: `src/lib/photo.test.ts`

**Interfaces:**
- Consumes: `PhotoFile` (Task 3); `devWarn` (Task 5); the `expo-image-manipulator` mock (Task 1).
- Produces:

```ts
export const PHOTO_MAX_EDGE = 1600;
export const PHOTO_JPEG_QUALITY = 0.7;
export type PickedPhoto = { uri: string; width: number; height: number };
export function resizeTargetFor(width: number, height: number): { width: number } | { height: number } | null;
export function processPhoto(asset: PickedPhoto): Promise<PickedPhoto>;
export function photoFileFor(photo: PickedPhoto): PhotoFile;
```

- [ ] **Step 1: Write the failing tests**

`src/lib/photo.test.ts`:

```ts
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { PHOTO_JPEG_QUALITY, PHOTO_MAX_EDGE, photoFileFor, processPhoto, resizeTargetFor } from "./photo";

const manipulate = jest.mocked(ImageManipulator.manipulate);
const ORIGINAL = { uri: "file:///cache/original.jpg", width: 4000, height: 3000 };

describe("resizeTargetFor", () => {
  test("bounds the width of a landscape photo", () => {
    expect(resizeTargetFor(4000, 3000)).toEqual({ width: PHOTO_MAX_EDGE });
  });

  test("bounds the height of a portrait photo", () => {
    expect(resizeTargetFor(3000, 4000)).toEqual({ height: PHOTO_MAX_EDGE });
  });

  test("never upscales a small photo", () => {
    expect(resizeTargetFor(800, 600)).toEqual({ width: 800 });
  });

  test("reports an unknown long edge when the picker reports a zero dimension", () => {
    expect(resizeTargetFor(0, 3000)).toBeNull();
    expect(resizeTargetFor(3000, 0)).toBeNull();
  });
});

describe("processPhoto", () => {
  test("resizes, saves as JPEG at the chosen quality and releases both native handles", async () => {
    const result = await processPhoto(ORIGINAL);

    const context = manipulate.mock.results[0].value;
    const image = await context.renderAsync.mock.results[0].value;
    expect(manipulate).toHaveBeenCalledWith(ORIGINAL.uri);
    expect(context.resize).toHaveBeenCalledWith({ width: PHOTO_MAX_EDGE });
    expect(image.saveAsync).toHaveBeenCalledWith({ compress: PHOTO_JPEG_QUALITY, format: SaveFormat.JPEG });
    expect(result).toEqual({ uri: "file:///cache/processed.jpg", width: 1600, height: 1200 });
    expect(image.release).toHaveBeenCalled();
    expect(context.release).toHaveBeenCalled();
  });

  test("keeps the original and warns when processing fails", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const context = jest.mocked(manipulate(ORIGINAL.uri));
    context.renderAsync.mockRejectedValueOnce(new Error("decode failed"));

    const result = await processPhoto(ORIGINAL);

    expect(result).toEqual(ORIGINAL);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("decode failed"));
    warn.mockRestore();
  });

  test("keeps the original without touching the manipulator when a dimension is unknown", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    manipulate.mockClear();
    const asset = { ...ORIGINAL, height: 0 };

    const result = await processPhoto(asset);

    expect(result).toEqual(asset);
    expect(manipulate).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("unknown"));
    warn.mockRestore();
  });
});

describe("photoFileFor", () => {
  test("names the upload part as a JPEG", () => {
    expect(photoFileFor({ uri: "file:///cache/p.jpg", width: 1, height: 1 })).toEqual({
      uri: "file:///cache/p.jpg",
      name: "photo.jpg",
      type: "image/jpeg",
    });
  });
});
```

The mock factory in `jest.setup.ts` returns one shared context object from every `manipulate` call, which is what lets the failure test arm `renderAsync` before calling `processPhoto`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/lib/photo.test.ts`
Expected: FAIL with "Cannot find module './photo'".

- [ ] **Step 3: Write the module**

`src/lib/photo.ts`:

```ts
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { PhotoFile } from "@/api/transport";
import { devWarn } from "./devWarn";

export const PHOTO_MAX_EDGE = 1600;
export const PHOTO_JPEG_QUALITY = 0.7;

export type PickedPhoto = { uri: string; width: number; height: number };

type Context = ReturnType<typeof ImageManipulator.manipulate>;
type ResizeTarget = { width: number } | { height: number };

// The picker documents width and height as possibly 0; then the long edge is unknown and null tells
// the caller to keep the original rather than risk enlarging a small image.
export function resizeTargetFor(width: number, height: number): ResizeTarget | null {
  if (width <= 0 || height <= 0) return null;
  return width >= height
    ? { width: Math.min(PHOTO_MAX_EDGE, width) }
    : { height: Math.min(PHOTO_MAX_EDGE, height) };
}

async function renderAndSave(context: Context, target: ResizeTarget): Promise<PickedPhoto> {
  const image = await context.resize(target).renderAsync();
  try {
    const saved = await image.saveAsync({ compress: PHOTO_JPEG_QUALITY, format: SaveFormat.JPEG });
    return { uri: saved.uri, width: saved.width, height: saved.height };
  } finally {
    image.release();
  }
}

// Downscale at pick time so a 12-megapixel capture becomes a sub-megabyte upload; on any failure
// the original is kept so the patient never loses the photo.
export async function processPhoto(asset: PickedPhoto): Promise<PickedPhoto> {
  const target = resizeTargetFor(asset.width, asset.height);
  if (target === null) {
    devWarn("Photo dimensions unknown, keeping the original");
    return asset;
  }
  let context: Context | null = null;
  try {
    context = ImageManipulator.manipulate(asset.uri);
    return await renderAndSave(context, target);
  } catch (error) {
    devWarn(`Photo processing failed, keeping the original: ${String(error)}`);
    return asset;
  } finally {
    context?.release();
  }
}

export function photoFileFor(photo: PickedPhoto): PhotoFile {
  return { uri: photo.uri, name: "photo.jpg", type: "image/jpeg" };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/lib/photo.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Scoped verify**

```bash
npx jest src/lib
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 12: Theme tokens, screen scaffold, buttons, offline banner and step header

**T012** · **Visual:** none — these components are rendered and screenshotted on every screen from Task 15 onward; on their own they have no host screen.

**Files:**
- Create: `src/theme/tokens.ts`
- Create: `src/theme/text.ts`
- Create: `src/components/PrimaryButton.tsx`
- Create: `src/components/PrimaryButton.test.tsx`
- Create: `src/components/TextButton.tsx`
- Create: `src/components/TextButton.test.tsx`
- Create: `src/components/OfflineBanner.tsx`
- Create: `src/components/OfflineBanner.test.tsx`
- Create: `src/components/StepHeader.tsx`
- Create: `src/components/StepHeader.test.tsx`
- Create: `src/components/ScreenScaffold.tsx`
- Create: `src/components/ScreenScaffold.test.tsx`

**Interfaces:**
- Consumes: `announce` (Task 5); `useIsOffline` (Task 5); `renderWithProviders` from `src/test/providers.tsx` (Task 6).
- Produces:

```ts
// tokens.ts
export const colors: { background; surface; text; muted; primary; onPrimary; border; selected; error; errorSurface; warning; warningSurface; disabled };
export const spacing: { xs: 4; sm: 8; md: 16; lg: 24; xl: 32 };
export const fontSize: { small: 15; body: 17; large: 20; heading: 24; title: 30 };
export const lineHeight: { body: 24; heading: 32; title: 38 };
export const radius = 12; export const MIN_TOUCH = 48; export const STEP_CHIP_MAX_FONT_SCALE = 2;
// text.ts
export const text: { title; heading; body; muted }; // StyleSheet styles built from the tokens; the only place text styles live
// components
export function PrimaryButton(props: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean; busyLabel?: string; accessibilityHint?: string; testID?: string }): JSX.Element;
export function TextButton(props: { label: string; onPress: () => void; disabled?: boolean; accessibilityHint?: string; testID?: string }): JSX.Element;
export const OFFLINE_MESSAGE: string; export const BACK_ONLINE_MESSAGE: string;
export function OfflineBanner(): JSX.Element;   // an accessible View with role alert (text only)
export function StepHeader(props: { stepNumber: number; stepCount: number; title: string }): JSX.Element;
export function ScreenScaffold(props: { children: ReactNode; action?: ReactNode; testID?: string }): JSX.Element;
```

- [ ] **Step 1: Write the tokens**

`src/theme/tokens.ts`:

```ts
export const colors = {
  background: "#FFFFFF",
  surface: "#F3F6F7",
  text: "#16262B",
  muted: "#55686D",
  primary: "#0F6B75",
  onPrimary: "#FFFFFF",
  border: "#C7D1D4",
  selected: "#E3F1F2",
  error: "#B3261E",
  errorSurface: "#FCEBEA",
  warning: "#6B4A00",
  warningSurface: "#FFF3D6",
  disabled: "#9AA9AD",
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const fontSize = { small: 15, body: 17, large: 20, heading: 24, title: 30 } as const;

export const lineHeight = { body: 24, heading: 32, title: 38 } as const;

export const radius = 12;

// 48 satisfies Android's 48 dp guidance and exceeds Apple's 44 pt.
export const MIN_TOUCH = 48;

// The only place font scaling is capped: a chip that must stay a chip.
export const STEP_CHIP_MAX_FONT_SCALE = 2;
```

`src/theme/text.ts` (the shared text styles; screens and components import these instead of rebuilding them from the tokens):

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

- [ ] **Step 2: Write the failing component tests**

`src/components/PrimaryButton.test.tsx`:

```tsx
import { render, screen, userEvent } from "@testing-library/react-native";
import { MIN_TOUCH } from "@/theme/tokens";
import { PrimaryButton } from "./PrimaryButton";

describe("PrimaryButton", () => {
  test("has a button role, its label as name, and a 48 point minimum size", () => {
    render(<PrimaryButton label="Send" onPress={() => {}} />);

    const button = screen.getByRole("button", { name: "Send" });

    expect(button).toHaveStyle({ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH });
  });

  test("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(<PrimaryButton label="Send" onPress={onPress} />);

    await user.press(screen.getByRole("button", { name: "Send" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("is disabled with a spoken reason and does not fire", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(<PrimaryButton label="Send" onPress={onPress} disabled accessibilityHint="Choose a recipient first" />);

    const button = screen.getByRole("button", { name: "Send", disabled: true });
    await user.press(button);

    expect(button.props.accessibilityHint).toBe("Choose a recipient first");
    expect(onPress).not.toHaveBeenCalled();
  });

  test("announces the busy label while busy and blocks presses", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(<PrimaryButton label="Send" busyLabel="Sending" busy onPress={onPress} />);

    const button = screen.getByRole("button", { name: "Sending", busy: true });
    await user.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });
});
```

`src/components/TextButton.test.tsx`:

```tsx
import { render, screen, userEvent } from "@testing-library/react-native";
import { MIN_TOUCH } from "@/theme/tokens";
import { TextButton } from "./TextButton";

describe("TextButton", () => {
  test("is a button with its label as name and a 48 point minimum height", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(<TextButton label="Change" onPress={onPress} />);

    const button = screen.getByRole("button", { name: "Change" });
    await user.press(button);

    expect(button).toHaveStyle({ minHeight: MIN_TOUCH });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("can be disabled and then ignores presses", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(<TextButton label="Change" onPress={onPress} disabled />);

    await user.press(screen.getByRole("button", { name: "Change", disabled: true }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
```

`src/components/OfflineBanner.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react-native";
import { OFFLINE_MESSAGE, OfflineBanner } from "./OfflineBanner";

test("the offline banner is an alert that reads the offline message", () => {
  render(<OfflineBanner />);

  expect(screen.getByRole("alert")).toHaveTextContent(OFFLINE_MESSAGE);
});
```

`src/components/StepHeader.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { StepHeader } from "./StepHeader";

describe("StepHeader", () => {
  test("shows the step counter and a heading, and announces both on mount", () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});

    render(<StepHeader stepNumber={2} stepCount={3} title="A few questions from your practice" />);

    expect(screen.getByText("Step 2 of 3")).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: "A few questions from your practice" })).toBeOnTheScreen();
    expect(announce).toHaveBeenCalledWith("Step 2 of 3: A few questions from your practice");
  });
});
```

`src/components/ScreenScaffold.test.tsx`:

```tsx
import { screen } from "@testing-library/react-native";
import * as Network from "expo-network";
import { AccessibilityInfo, Platform, Text } from "react-native";
import { renderWithProviders } from "@/test/providers";
import { BACK_ONLINE_MESSAGE, OFFLINE_MESSAGE } from "./OfflineBanner";
import { ScreenScaffold } from "./ScreenScaffold";

const mockedState = jest.mocked(Network.useNetworkState);

describe("ScreenScaffold", () => {
  afterEach(() => {
    mockedState.mockReturnValue({ isConnected: true, isInternetReachable: true });
  });

  test("renders its content and its action inside a scroll view that keeps taps", () => {
    renderWithProviders(
      <ScreenScaffold testID="scaffold" action={<Text>Action</Text>}>
        <Text>Body</Text>
      </ScreenScaffold>,
    );

    expect(screen.getByText("Body")).toBeOnTheScreen();
    expect(screen.getByText("Action")).toBeOnTheScreen();
    expect(screen.getByTestId("scaffold").props.keyboardShouldPersistTaps).toBe("handled");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("shows the offline banner and announces it when the link goes down", () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
    mockedState.mockReturnValue({ isConnected: true, isInternetReachable: true });
    const view = renderWithProviders(
      <ScreenScaffold>
        <Text>Body</Text>
      </ScreenScaffold>,
    );

    mockedState.mockReturnValue({ isConnected: false, isInternetReachable: false });
    view.rerender(
      <ScreenScaffold>
        <Text>Body</Text>
      </ScreenScaffold>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(OFFLINE_MESSAGE);
    expect(announce).toHaveBeenCalledWith(OFFLINE_MESSAGE);

    mockedState.mockReturnValue({ isConnected: true, isInternetReachable: true });
    view.rerender(
      <ScreenScaffold>
        <Text>Body</Text>
      </ScreenScaffold>,
    );

    expect(screen.queryByRole("alert")).toBeNull();
    expect(announce).toHaveBeenCalledWith(BACK_ONLINE_MESSAGE);
  });

  test("uses drag-to-dismiss on Android and interactive dismissal on iOS", () => {
    const original = Platform.OS;
    Platform.OS = "android";
    renderWithProviders(
      <ScreenScaffold testID="scaffold">
        <Text>Body</Text>
      </ScreenScaffold>,
    );

    expect(screen.getByTestId("scaffold").props.keyboardDismissMode).toBe("on-drag");

    Platform.OS = original;
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx jest src/components`
Expected: FAIL, every suite with "Cannot find module".

- [ ] **Step 4: Write the components**

`src/components/PrimaryButton.tsx`:

```tsx
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, fontSize, lineHeight, MIN_TOUCH, radius, spacing } from "@/theme/tokens";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  busyLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  busy = false,
  busyLabel = "Please wait",
  accessibilityHint,
  testID,
}: Props) {
  const isInactive = disabled || busy;
  const shownLabel = busy ? busyLabel : label;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={shownLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy }}
      disabled={isInactive}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.button, isInactive && styles.inactive, pressed && styles.pressed]}
    >
      {busy ? <ActivityIndicator color={colors.onPrimary} /> : null}
      <Text style={styles.label}>{shownLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius,
    backgroundColor: colors.primary,
  },
  inactive: { backgroundColor: colors.disabled },
  pressed: { opacity: 0.85 },
  label: {
    color: colors.onPrimary,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: "600",
    textAlign: "center",
  },
});
```

`src/components/TextButton.tsx`:

```tsx
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fontSize, lineHeight, MIN_TOUCH, spacing } from "@/theme/tokens";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
};

export function TextButton({ label, onPress, disabled = false, accessibilityHint, testID }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.6 },
  label: {
    color: colors.primary,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: "600",
  },
});
```

`src/components/OfflineBanner.tsx`:

```tsx
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, lineHeight, radius, spacing } from "@/theme/tokens";

export const OFFLINE_MESSAGE = "You're offline. You can keep writing, but sending needs a connection.";
export const BACK_ONLINE_MESSAGE = "You're back online.";

// Text only, so grouping it into one accessibility element is safe and makes the role queryable.
export function OfflineBanner() {
  return (
    <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.banner}>
      <Text style={styles.text}>{OFFLINE_MESSAGE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warningSurface,
    borderRadius: radius,
    padding: spacing.md,
  },
  text: { color: colors.warning, fontSize: fontSize.body, lineHeight: lineHeight.body },
});
```

`src/components/StepHeader.tsx`:

```tsx
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { announce } from "@/lib/announce";
import { text } from "@/theme/text";
import { colors, fontSize, spacing, STEP_CHIP_MAX_FONT_SCALE } from "@/theme/tokens";

type Props = { stepNumber: number; stepCount: number; title: string };

// Neither platform reliably announces route changes, so each step announces itself.
export function StepHeader({ stepNumber, stepCount, title }: Props) {
  const counter = `Step ${stepNumber} of ${stepCount}`;

  useEffect(() => {
    announce(`${counter}: ${title}`);
  }, [counter, title]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.chip} maxFontSizeMultiplier={STEP_CHIP_MAX_FONT_SCALE}>
        {counter}
      </Text>
      <Text accessibilityRole="header" style={text.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  chip: {
    alignSelf: "flex-start",
    color: colors.muted,
    fontSize: fontSize.small,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
```

`src/components/ScreenScaffold.tsx`:

```tsx
import { useEffect, useRef, type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { announce } from "@/lib/announce";
import { useIsOffline } from "@/lib/network";
import { colors, spacing } from "@/theme/tokens";
import { BACK_ONLINE_MESSAGE, OFFLINE_MESSAGE, OfflineBanner } from "./OfflineBanner";

type Props = { children: ReactNode; action?: ReactNode; testID?: string };

// One scroll view per step with the primary action as its last child: no pinned footer, so the
// keyboard never covers the button and large text simply makes the page longer.
export function ScreenScaffold({ children, action, testID }: Props) {
  const insets = useSafeAreaInsets();
  const isOffline = useIsOffline();
  const wasOffline = useRef(isOffline);

  useEffect(() => {
    if (isOffline === wasOffline.current) return;
    wasOffline.current = isOffline;
    announce(isOffline ? OFFLINE_MESSAGE : BACK_ONLINE_MESSAGE);
  }, [isOffline]);

  return (
    <ScrollView
      testID={testID}
      style={styles.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: spacing.lg + insets.bottom,
          paddingLeft: spacing.md + insets.left,
          paddingRight: spacing.md + insets.right,
        },
      ]}
    >
      {isOffline ? <OfflineBanner /> : null}
      {children}
      {action ? <View style={styles.action}>{action}</View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, gap: spacing.md, paddingTop: spacing.md },
  action: { marginTop: spacing.sm },
});
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest src/components`
Expected: PASS, 11 tests.

- [ ] **Step 6: Scoped verify**

```bash
npx jest src/components
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 13: Text field, choice group, recipient card and the status views

**T013** · **Visual:** none — rendered on the screens from Task 16 onward; no host screen of their own yet.

**Files:**
- Create: `src/components/TextField.tsx`
- Create: `src/components/TextField.test.tsx`
- Create: `src/components/ChoiceGroup.tsx`
- Create: `src/components/ChoiceGroup.test.tsx`
- Create: `src/components/RecipientCard.tsx`
- Create: `src/components/RecipientCard.test.tsx`
- Create: `src/components/StatusViews.tsx`
- Create: `src/components/StatusViews.test.tsx`

**Interfaces:**
- Consumes: tokens (Task 12); `PrimaryButton` (Task 12).
- Produces:

```ts
export type Requirement = "required" | "optional";
export function labelWithRequirement(label: string, requirement?: Requirement): string;
export function accessibleName(label: string, error?: string | null): string;
export function TextField(props: { label: string; value: string; onChangeText: (text: string) => void; hint?: string; error?: string | null; requirement?: Requirement; multiline?: boolean; editable?: boolean; ref?: Ref<TextInput>; testID?: string }): JSX.Element;
export function ChoiceGroup(props: { label: string; options: readonly string[]; value: string | null; onChange: (value: string) => void; requirement?: Requirement; error?: string | null; ref?: Ref<View> }): JSX.Element; // ref lands on the first option; the group View is NOT accessible (its radios must stay focusable) and is found with *ByLabelText
export function RecipientCard(props: { name: string; role: string; checked: boolean; onPress: () => void }): JSX.Element;
export function LoadingCards(props: { label: string }): JSX.Element;
export function EmptyState(props: { title: string; body: string; action?: ReactNode }): JSX.Element;
export function ErrorState(props: { title: string; body: string; onRetry: () => void }): JSX.Element; // an accessible alert View around the texts, the retry button as a sibling
export const RETRY_LABEL = "Try again";
```

- [ ] **Step 1: Write the failing tests**

`src/components/TextField.test.tsx`:

```tsx
import { render, screen, userEvent } from "@testing-library/react-native";
import { TextField } from "./TextField";

describe("TextField", () => {
  test("shows the label with its requirement and uses it as the accessible name", () => {
    render(<TextField label="Are you taking anything?" requirement="optional" value="" onChangeText={() => {}} />);

    expect(screen.getByText("Are you taking anything? (optional)")).toBeOnTheScreen();
    expect(screen.getByLabelText("Are you taking anything? (optional)")).toBeOnTheScreen();
  });

  test("passes typed text to onChangeText and exposes the hint", async () => {
    const onChangeText = jest.fn();
    const user = userEvent.setup();
    render(<TextField label="Your message" hint="Where, since when" value="" onChangeText={onChangeText} multiline />);

    const input = screen.getByLabelText("Your message");
    await user.type(input, "Hi");

    expect(onChangeText).toHaveBeenCalled();
    expect(input.props.accessibilityHint).toBe("Where, since when");
    expect(screen.getByText("Where, since when")).toBeOnTheScreen();
  });

  test("folds an error into the accessible name and shows it in a live region", () => {
    render(<TextField label="Your message" value="" onChangeText={() => {}} error="Please write your question" />);

    expect(screen.getByLabelText("Your message. Error: Please write your question")).toBeOnTheScreen();
    const error = screen.getByText("Please write your question");
    expect(error.props.accessibilityLiveRegion).toBe("polite");
  });

  test("becomes read-only when editable is false", () => {
    render(<TextField label="Your message" value="Hi" onChangeText={() => {}} editable={false} />);

    expect(screen.getByLabelText("Your message").props.editable).toBe(false);
  });
});
```

`src/components/ChoiceGroup.test.tsx`:

```tsx
import { render, screen, userEvent } from "@testing-library/react-native";
import { MIN_TOUCH } from "@/theme/tokens";
import { ChoiceGroup } from "./ChoiceGroup";

const OPTIONS = ["Less than a week", "1 to 4 weeks"];

describe("ChoiceGroup", () => {
  test("is a labelled group whose options are radios with a checked state", () => {
    render(<ChoiceGroup label="How long?" requirement="required" options={OPTIONS} value="1 to 4 weeks" onChange={() => {}} />);

    expect(screen.getByLabelText("How long? (required)")).toBeOnTheScreen();
    expect(screen.getByRole("radio", { name: "1 to 4 weeks", checked: true })).toHaveStyle({ minHeight: MIN_TOUCH });
    expect(screen.getByRole("radio", { name: "Less than a week", checked: false })).toBeOnTheScreen();
  });

  test("selecting an option calls onChange with it", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<ChoiceGroup label="How long?" options={OPTIONS} value={null} onChange={onChange} />);

    await user.press(screen.getByRole("radio", { name: "Less than a week" }));

    expect(onChange).toHaveBeenCalledWith("Less than a week");
  });

  test("folds an error into the group's name and shows it in a live region", () => {
    render(<ChoiceGroup label="How long?" options={OPTIONS} value={null} onChange={() => {}} error="This question is required" />);

    expect(screen.getByLabelText("How long?. Error: This question is required")).toBeOnTheScreen();
    expect(screen.getByText("This question is required").props.accessibilityLiveRegion).toBe("polite");
  });
});
```

`src/components/RecipientCard.test.tsx`:

```tsx
import { render, screen, userEvent } from "@testing-library/react-native";
import { RecipientCard } from "./RecipientCard";

describe("RecipientCard", () => {
  test("is a radio named after the person and their role, at least 64 points tall", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(<RecipientCard name="Dr. J. de Vries" role="GP" checked={false} onPress={onPress} />);

    const card = screen.getByRole("radio", { name: "Dr. J. de Vries, GP", checked: false });
    await user.press(card);

    expect(card).toHaveStyle({ minHeight: 64 });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("reports its checked state", () => {
    render(<RecipientCard name="M. Bakker" role="Practice nurse" checked onPress={() => {}} />);

    expect(screen.getByRole("radio", { name: "M. Bakker, Practice nurse", checked: true })).toBeOnTheScreen();
  });
});
```

`src/components/StatusViews.test.tsx`:

```tsx
import { render, screen, userEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { EmptyState, ErrorState, LoadingCards, RETRY_LABEL } from "./StatusViews";

describe("StatusViews", () => {
  test("LoadingCards is a busy progress indicator with the given label", () => {
    render(<LoadingCards label="Loading your practice's care team" />);

    expect(screen.getByRole("progressbar", { name: "Loading your practice's care team", busy: true })).toBeOnTheScreen();
  });

  test("EmptyState shows a heading, a body and an optional action", () => {
    render(<EmptyState title="Nothing here" body="Come back later" action={<Text>Go home</Text>} />);

    expect(screen.getByRole("header", { name: "Nothing here" })).toBeOnTheScreen();
    expect(screen.getByText("Come back later")).toBeOnTheScreen();
    expect(screen.getByText("Go home")).toBeOnTheScreen();
  });

  test("ErrorState is an alert with a retry button", async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    render(<ErrorState title="We couldn't load" body="Check your connection" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load");
    await user.press(screen.getByRole("button", { name: RETRY_LABEL }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/components/TextField.test.tsx src/components/ChoiceGroup.test.tsx src/components/RecipientCard.test.tsx src/components/StatusViews.test.tsx`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Write the components**

`src/components/TextField.tsx`:

```tsx
import type { Ref } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { text } from "@/theme/text";
import { colors, fontSize, lineHeight, MIN_TOUCH, radius, spacing } from "@/theme/tokens";

export type Requirement = "required" | "optional";

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  hint?: string;
  error?: string | null;
  requirement?: Requirement;
  multiline?: boolean;
  editable?: boolean;
  ref?: Ref<TextInput>;
  testID?: string;
};

export function labelWithRequirement(label: string, requirement?: Requirement): string {
  return requirement ? `${label} (${requirement})` : label;
}

// Neither platform supports an error-message link on inputs, so the error is folded into the
// field's accessible name: the one mechanism that works identically for VoiceOver and TalkBack.
export function accessibleName(label: string, error?: string | null): string {
  return error ? `${label}. Error: ${error}` : label;
}

const MULTILINE_MIN_HEIGHT = 132;

export function TextField({
  label,
  value,
  onChangeText,
  hint,
  error,
  requirement,
  multiline = false,
  editable = true,
  ref,
  testID,
}: Props) {
  const visibleLabel = labelWithRequirement(label, requirement);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{visibleLabel}</Text>
      {hint ? <Text style={text.muted}>{hint}</Text> : null}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        editable={editable}
        textAlignVertical={multiline ? "top" : "center"}
        accessibilityLabel={accessibleName(visibleLabel, error)}
        accessibilityHint={hint}
        style={[styles.input, multiline && styles.multiline, Boolean(error) && styles.inputError]}
        testID={testID}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: {
    color: colors.text,
    fontSize: fontSize.large,
    lineHeight: lineHeight.heading,
    fontWeight: "600",
  },
  input: {
    minHeight: MIN_TOUCH + spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  multiline: { minHeight: MULTILINE_MIN_HEIGHT },
  inputError: { borderColor: colors.error },
  error: { color: colors.error, fontSize: fontSize.body, lineHeight: lineHeight.body },
});
```

`src/components/ChoiceGroup.tsx`:

```tsx
import type { Ref } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, lineHeight, MIN_TOUCH, radius, spacing } from "@/theme/tokens";
import { accessibleName, labelWithRequirement, type Requirement } from "./TextField";

type Props = {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (value: string) => void;
  requirement?: Requirement;
  error?: string | null;
  ref?: Ref<View>;
};

const DOT_SIZE = 24;

// The group View carries the role and name but is deliberately not `accessible`: making it one
// element would swallow its radios. The ref lands on the first option, the element a screen
// reader can land on, so a validation failure can move focus into the group.
export function ChoiceGroup({ label, options, value, onChange, requirement, error, ref }: Props) {
  const visibleLabel = labelWithRequirement(label, requirement);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{visibleLabel}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={accessibleName(visibleLabel, error)} style={styles.group}>
        {options.map((option, index) => {
          const checked = option === value;
          return (
            <Pressable
              key={option}
              ref={index === 0 ? ref : undefined}
              accessibilityRole="radio"
              accessibilityLabel={option}
              accessibilityState={{ checked }}
              onPress={() => onChange(option)}
              style={[styles.option, checked && styles.optionChecked]}
            >
              <View style={[styles.dot, checked && styles.dotChecked]} />
              <Text style={styles.optionText}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: {
    color: colors.text,
    fontSize: fontSize.large,
    lineHeight: lineHeight.heading,
    fontWeight: "600",
  },
  group: { gap: spacing.sm },
  option: {
    minHeight: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius,
    backgroundColor: colors.background,
  },
  optionChecked: { borderColor: colors.primary, backgroundColor: colors.selected },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionText: { flex: 1, color: colors.text, fontSize: fontSize.body, lineHeight: lineHeight.body },
  error: { color: colors.error, fontSize: fontSize.body, lineHeight: lineHeight.body },
});
```

`src/components/RecipientCard.tsx`:

```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import { text } from "@/theme/text";
import { colors, fontSize, lineHeight, radius, spacing } from "@/theme/tokens";

type Props = { name: string; role: string; checked: boolean; onPress: () => void };

const CARD_MIN_HEIGHT = 64;
const INDICATOR_SIZE = 28;

export function RecipientCard({ name, role, checked, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${name}, ${role}`}
      accessibilityState={{ checked }}
      onPress={onPress}
      style={[styles.card, checked && styles.cardChecked]}
    >
      <View style={styles.texts}>
        <Text style={styles.name}>{name}</Text>
        <Text style={text.muted}>{role}</Text>
      </View>
      <View style={[styles.indicator, checked && styles.indicatorChecked]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: CARD_MIN_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius,
    backgroundColor: colors.background,
  },
  cardChecked: { borderColor: colors.primary, backgroundColor: colors.selected },
  texts: { flex: 1, gap: spacing.xs },
  name: { color: colors.text, fontSize: fontSize.large, lineHeight: lineHeight.heading, fontWeight: "600" },
  indicator: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.border,
  },
  indicatorChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
});
```

`src/components/StatusViews.tsx`:

```tsx
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { text } from "@/theme/text";
import { colors, radius, spacing } from "@/theme/tokens";
import { PrimaryButton } from "./PrimaryButton";

export const RETRY_LABEL = "Try again";

const PLACEHOLDER_COUNT = 3;
const PLACEHOLDER_HEIGHT = 72;

export function LoadingCards({ label }: { label: string }) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityState={{ busy: true }} style={styles.stack}>
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <View key={index} style={styles.placeholder} />
      ))}
    </View>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <View style={styles.stack}>
      <Text accessibilityRole="header" style={text.heading}>
        {title}
      </Text>
      <Text style={text.body}>{body}</Text>
      {action}
    </View>
  );
}

// The alert groups only the two texts; the retry button stays a sibling so it remains its own element.
export function ErrorState({ title, body, onRetry }: { title: string; body: string; onRetry: () => void }) {
  return (
    <View style={[styles.stack, styles.errorBox]}>
      <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.stack}>
        <Text accessibilityRole="header" style={text.heading}>
          {title}
        </Text>
        <Text style={text.body}>{body}</Text>
      </View>
      <PrimaryButton label={RETRY_LABEL} onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  placeholder: { height: PLACEHOLDER_HEIGHT, borderRadius: radius, backgroundColor: colors.surface },
  errorBox: { padding: spacing.md, borderRadius: radius, backgroundColor: colors.errorSurface },
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/components/TextField.test.tsx src/components/ChoiceGroup.test.tsx src/components/RecipientCard.test.tsx src/components/StatusViews.test.tsx`
Expected: PASS, 12 tests.

- [ ] **Step 5: Scoped verify**

```bash
npx jest src/components
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 14: Photo picker

**T014** · **Visual:** none — hosted and screenshotted on the message screen (Task 18).

**Files:**
- Create: `src/components/PhotoPicker.tsx`
- Create: `src/components/PhotoPicker.test.tsx`

**Interfaces:**
- Consumes: `DraftPhoto` (Task 7); `processPhoto`, `PickedPhoto` (Task 11); `newId` (Task 5); `TextButton` (Task 12); the mocks for `expo-image-picker` (with `PermissionStatus`), `expo-device`, `expo-image-manipulator`, `expo-crypto` (Task 1).
- Produces:

```ts
export const CAMERA_UNAVAILABLE_NOTE: string; export const PERMISSION_DENIED_NOTE: string; export const PREPARING_LABEL = "Preparing photo";
export const TAKE_PHOTO_LABEL = "Take a photo"; export const CHOOSE_PHOTO_LABEL = "Choose from library"; export const REMOVE_PHOTO_LABEL = "Remove photo";
export function PhotoPicker(props: { photo: DraftPhoto | null; disabled?: boolean; onPickStarted: (pickId: string) => void; onPickReady: (pickId: string, result: PickedPhoto) => void; onRemove: () => void }): JSX.Element;
```

One photo at a time: while a photo is preparing the pick buttons stay hidden and Remove is offered; a newer pick therefore always starts from the empty state, which is how the draft's "newer pick supersedes" rule is reached in the app.

- [ ] **Step 1: Write the failing tests**

`src/components/PhotoPicker.test.tsx`:

```tsx
import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import * as Device from "expo-device";
import * as ImagePicker from "expo-image-picker";
import { Linking } from "react-native";
import {
  CAMERA_UNAVAILABLE_NOTE,
  CHOOSE_PHOTO_LABEL,
  PERMISSION_DENIED_NOTE,
  PhotoPicker,
  PREPARING_LABEL,
  REMOVE_PHOTO_LABEL,
  TAKE_PHOTO_LABEL,
} from "./PhotoPicker";

type Photo = React.ComponentProps<typeof PhotoPicker>["photo"];

const ASSET = { uri: "file:///cache/original.jpg", width: 4000, height: 3000 };
const denied = {
  granted: false,
  status: ImagePicker.PermissionStatus.DENIED,
  canAskAgain: false,
  expires: "never" as const,
};

function renderPicker(photo: Photo = null, disabled = false) {
  const handlers = { onPickStarted: jest.fn(), onPickReady: jest.fn(), onRemove: jest.fn() };
  render(<PhotoPicker photo={photo} disabled={disabled} {...handlers} />);
  return handlers;
}

describe("PhotoPicker", () => {
  afterEach(() => jest.restoreAllMocks());

  test("offers the camera and the library on a real device", () => {
    renderPicker();

    expect(screen.getByRole("button", { name: TAKE_PHOTO_LABEL })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL })).toBeOnTheScreen();
  });

  test("hides the camera with a note when there is no camera", () => {
    jest.replaceProperty(Device, "isDevice", false);

    renderPicker();

    expect(screen.queryByRole("button", { name: TAKE_PHOTO_LABEL })).toBeNull();
    expect(screen.getByText(CAMERA_UNAVAILABLE_NOTE)).toBeOnTheScreen();
  });

  test("a library pick starts a preparing photo and delivers the processed result", async () => {
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({ canceled: false, assets: [ASSET] });
    const user = userEvent.setup();
    const handlers = renderPicker();

    await user.press(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL }));

    await waitFor(() => expect(handlers.onPickReady).toHaveBeenCalled());
    const pickId = handlers.onPickStarted.mock.calls[0][0];
    expect(handlers.onPickReady).toHaveBeenCalledWith(pickId, {
      uri: "file:///cache/processed.jpg",
      width: 1600,
      height: 1200,
    });
  });

  test("a camera pick uses the camera launcher at full quality", async () => {
    jest.mocked(ImagePicker.launchCameraAsync).mockResolvedValueOnce({ canceled: false, assets: [ASSET] });
    const user = userEvent.setup();
    const handlers = renderPicker();

    await user.press(screen.getByRole("button", { name: TAKE_PHOTO_LABEL }));

    await waitFor(() => expect(handlers.onPickReady).toHaveBeenCalled());
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(expect.objectContaining({ quality: 1 }));
  });

  test("a cancelled pick changes nothing", async () => {
    const user = userEvent.setup();
    const handlers = renderPicker();

    await user.press(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL }));

    expect(handlers.onPickStarted).not.toHaveBeenCalled();
  });

  test("a denied permission explains itself and offers Settings", async () => {
    jest
      .spyOn(ImagePicker, "useMediaLibraryPermissions")
      .mockReturnValue([denied, jest.fn(async () => denied), jest.fn(async () => denied)]);
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue();
    const user = userEvent.setup();
    const handlers = renderPicker();

    await user.press(screen.getByRole("button", { name: CHOOSE_PHOTO_LABEL }));

    expect(await screen.findByText(PERMISSION_DENIED_NOTE)).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Open Settings" }));
    expect(openSettings).toHaveBeenCalled();
    expect(handlers.onPickStarted).not.toHaveBeenCalled();
  });

  test("shows the preparing state as a live region and still offers Remove", async () => {
    const user = userEvent.setup();
    const handlers = renderPicker({ status: "preparing", pickId: "p1" });

    expect(screen.getByText(PREPARING_LABEL).props.accessibilityLiveRegion).toBe("polite");
    expect(screen.queryByRole("button", { name: CHOOSE_PHOTO_LABEL })).toBeNull();
    await user.press(screen.getByRole("button", { name: REMOVE_PHOTO_LABEL }));

    expect(handlers.onRemove).toHaveBeenCalledTimes(1);
  });

  test("shows the preview with a remove button once ready", async () => {
    const user = userEvent.setup();
    const handlers = renderPicker({ status: "ready", pickId: "p1", uri: "file:///cache/p.jpg", width: 10, height: 10 });

    expect(screen.getByLabelText("Your photo")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: REMOVE_PHOTO_LABEL }));

    expect(handlers.onRemove).toHaveBeenCalledTimes(1);
  });

  test("disables every action while sending", () => {
    renderPicker({ status: "ready", pickId: "p1", uri: "file:///cache/p.jpg", width: 10, height: 10 }, true);

    expect(screen.getByRole("button", { name: REMOVE_PHOTO_LABEL, disabled: true })).toBeOnTheScreen();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/components/PhotoPicker.test.tsx`
Expected: FAIL with "Cannot find module './PhotoPicker'".

- [ ] **Step 3: Write the component**

`src/components/PhotoPicker.tsx`:

```tsx
import * as Device from "expo-device";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import type { DraftPhoto } from "@/features/econsult/draft";
import { newId } from "@/lib/ids";
import { processPhoto, type PickedPhoto } from "@/lib/photo";
import { text } from "@/theme/text";
import { colors, radius, spacing } from "@/theme/tokens";
import { TextButton } from "./TextButton";

export const TAKE_PHOTO_LABEL = "Take a photo";
export const CHOOSE_PHOTO_LABEL = "Choose from library";
export const REMOVE_PHOTO_LABEL = "Remove photo";
export const PREPARING_LABEL = "Preparing photo";
export const CAMERA_UNAVAILABLE_NOTE =
  "The camera isn't available on this device. You can choose a photo from your library.";
export const PERMISSION_DENIED_NOTE = "Photos are switched off for this app. You can allow them in Settings.";
const PHOTO_HINT = "Add a photo if it helps, for example of a rash or a wound.";
const OPEN_SETTINGS_LABEL = "Open Settings";
const PREVIEW_HEIGHT = 200;

// quality 1: the manipulator re-encodes anyway, so picker compression would be a wasted lossy pass.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 1, exif: false };

type Source = "camera" | "library";
type Permission = [ImagePicker.PermissionResponse | null, () => Promise<ImagePicker.PermissionResponse>];

type Props = {
  photo: DraftPhoto | null;
  disabled?: boolean;
  onPickStarted: (pickId: string) => void;
  onPickReady: (pickId: string, result: PickedPhoto) => void;
  onRemove: () => void;
};

async function ensureGranted([status, request]: Permission): Promise<boolean> {
  if (status?.granted) return true;
  const next = await request();
  return next.granted;
}

function launch(source: Source) {
  return source === "camera"
    ? ImagePicker.launchCameraAsync(PICKER_OPTIONS)
    : ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
}

type PhotoStateProps = { disabled: boolean; onRemove: () => void };

function PreparingPhotoView({ disabled, onRemove }: PhotoStateProps) {
  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <ActivityIndicator color={colors.primary} />
        <Text accessibilityLiveRegion="polite" style={text.body}>
          {PREPARING_LABEL}
        </Text>
      </View>
      <TextButton label={REMOVE_PHOTO_LABEL} disabled={disabled} onPress={onRemove} />
    </View>
  );
}

// Fixed height and cover: the preview never sizes itself from the draft's width and height.
function ReadyPhotoView({ uri, disabled, onRemove }: PhotoStateProps & { uri: string }) {
  return (
    <View style={styles.stack}>
      <Image source={{ uri }} accessibilityLabel="Your photo" contentFit="cover" style={styles.preview} />
      <TextButton label={REMOVE_PHOTO_LABEL} disabled={disabled} onPress={onRemove} />
    </View>
  );
}

export function PhotoPicker({ photo, disabled = false, onPickStarted, onPickReady, onRemove }: Props) {
  const [cameraStatus, requestCamera] = ImagePicker.useCameraPermissions();
  const [libraryStatus, requestLibrary] = ImagePicker.useMediaLibraryPermissions();
  const [denied, setDenied] = useState(false);

  async function pick(source: Source) {
    const permission: Permission =
      source === "camera" ? [cameraStatus, requestCamera] : [libraryStatus, requestLibrary];
    if (!(await ensureGranted(permission))) return setDenied(true);
    setDenied(false);
    const result = await launch(source);
    if (result.canceled) return;
    const asset = result.assets[0];
    const pickId = newId();
    onPickStarted(pickId);
    onPickReady(pickId, await processPhoto({ uri: asset.uri, width: asset.width, height: asset.height }));
  }

  if (photo?.status === "preparing") return <PreparingPhotoView disabled={disabled} onRemove={onRemove} />;
  if (photo?.status === "ready") return <ReadyPhotoView uri={photo.uri} disabled={disabled} onRemove={onRemove} />;

  return (
    <View style={styles.stack}>
      <Text style={text.body}>{PHOTO_HINT}</Text>
      {Device.isDevice ? (
        <TextButton label={TAKE_PHOTO_LABEL} disabled={disabled} onPress={() => void pick("camera")} />
      ) : (
        <Text style={text.muted}>{CAMERA_UNAVAILABLE_NOTE}</Text>
      )}
      <TextButton label={CHOOSE_PHOTO_LABEL} disabled={disabled} onPress={() => void pick("library")} />
      {denied ? (
        <View style={styles.stack}>
          <Text accessibilityLiveRegion="polite" style={text.muted}>
            {PERMISSION_DENIED_NOTE}
          </Text>
          <TextButton label={OPEN_SETTINGS_LABEL} onPress={() => void Linking.openSettings()} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  preview: { width: "100%", height: PREVIEW_HEIGHT, borderRadius: radius, backgroundColor: colors.surface },
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/components/PhotoPicker.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 5: Scoped verify**

```bash
npx jest src/components
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 15: App shell: providers, root stack, home screen, the flow group with placeholder screens, and the test flow layout

**T015** · **Visual:** render — the home screen on the iOS simulator at the default text size and at the largest accessibility text size, plus the placeholder first step to prove the nested header owns the title.

**Files:**
- Modify: `src/app/_layout.tsx`
- Modify: `src/app/index.tsx`
- Create: `src/app/dev-settings.tsx` (placeholder, replaced in Task 20)
- Create: `src/app/econsult/_layout.tsx`
- Create: `src/app/econsult/recipient.tsx` (placeholder, replaced in Task 16)
- Create: `src/app/econsult/questions.tsx` (placeholder, replaced in Task 17)
- Create: `src/app/econsult/message.tsx` (placeholder, replaced in Task 18)
- Create: `src/app/econsult/sent.tsx` (placeholder, replaced in Task 19)
- Create: `src/test/flowLayout.tsx`
- Create: `src/test/expo-router-matchers.d.ts`
- Create: `src/__tests__/app/index.test.tsx`
- Create: `src/__tests__/app/econsult/_layout.test.tsx`

No test file may be created under `src/app`: expo-router would treat it as a route and require it at start-up.

**Interfaces:**
- Consumes: `createQueryClient` (Task 5); `NetworkProvider` (Task 5); `isDevelopmentBuild` (Task 5); `DevSettingsProvider`, `useDevSettings`, `useServices`, `useSession` (Task 6); `TestProviders` (Task 6); `DraftProvider`, `DraftState` (Task 7); `configQuery`, `careTeamQuery` (Task 8); `ScreenScaffold`, `PrimaryButton`, `TextButton` (Task 12); `STEP_TITLES` (Task 9).
- Produces: the route tree `/`, `/dev-settings`, `/econsult/recipient`, `/econsult/questions`, `/econsult/message`, `/econsult/sent`; the root providers; `EConsultLayout` with `unstable_settings.anchor = "recipient"`; the test helper `flowLayoutWith(draft?: DraftState): () => JSX.Element`, a stand-in for `EConsultLayout` that mounts the preset draft (the real layout would shadow it with its own provider).

- [ ] **Step 1: Write the failing tests**

`src/__tests__/app/index.test.tsx`:

```tsx
import { QueryClient } from "@tanstack/react-query";
import { userEvent } from "@testing-library/react-native";
import { renderRouter, screen, waitFor } from "expo-router/testing-library";
import { Text } from "react-native";
import HomeScreen from "@/app/index";
import { practiceKeys } from "@/features/econsult/queries";
import * as devWarn from "@/lib/devWarn";
import { TestProviders } from "@/test/providers";

const Stub = () => <Text>stub</Text>;

function renderHome(client: QueryClient) {
  return renderRouter(
    { index: HomeScreen, "econsult/recipient": Stub, "dev-settings": Stub },
    {
      initialUrl: "/",
      wrapper: ({ children }) => <TestProviders client={client}>{children}</TestProviders>,
    },
  );
}

describe("Home", () => {
  afterEach(() => jest.restoreAllMocks());

  test("greets the patient and starts the flow from one primary action", async () => {
    const user = userEvent.setup();
    renderHome(new QueryClient());

    expect(screen.getByRole("header", { name: "Hello, Ria de Boer." })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Write to your practice" }));

    expect(screen).toHavePathname("/econsult/recipient");
  });

  test("prefetches the practice config and care team", async () => {
    const client = new QueryClient();
    renderHome(client);

    await waitFor(() => expect(client.getQueryData(practiceKeys.config("prc-0421"))).toBeDefined());
    expect(client.getQueryData(practiceKeys.careTeam("prc-0421"))).toBeDefined();
  });

  test("offers developer settings in development", async () => {
    const user = userEvent.setup();
    renderHome(new QueryClient());

    await user.press(screen.getByRole("button", { name: "Developer settings" }));

    expect(screen).toHavePathname("/dev-settings");
  });

  test("hides developer settings outside development", () => {
    jest.spyOn(devWarn, "isDevelopmentBuild").mockReturnValue(false);
    renderHome(new QueryClient());

    expect(screen.queryByRole("button", { name: "Developer settings" })).toBeNull();
  });
});
```

`src/__tests__/app/econsult/_layout.test.tsx`:

```tsx
import { renderRouter, screen } from "expo-router/testing-library";
import { Text } from "react-native";
import EConsultLayout, { unstable_settings } from "@/app/econsult/_layout";
import { useDraft } from "@/features/econsult/DraftProvider";
import { TestProviders } from "@/test/providers";

function DraftProbe() {
  const { draft } = useDraft();
  return <Text>{draft.recipientId ?? "no recipient"}</Text>;
}

describe("EConsultLayout", () => {
  test("provides the draft to its screens and anchors deep links on the first step", () => {
    renderRouter(
      { "econsult/_layout": EConsultLayout, "econsult/recipient": DraftProbe },
      {
        initialUrl: "/econsult/recipient",
        wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
      },
    );

    expect(screen.getByText("no recipient")).toBeOnTheScreen();
    expect(unstable_settings.anchor).toBe("recipient");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/__tests__/app`
Expected: FAIL (the home screen still renders the template placeholder; the layout module does not exist).

- [ ] **Step 3: Write the root layout**

`src/app/_layout.tsx`:

```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState, type ReactNode } from "react";
import { DevSettingsProvider, useDevSettings } from "@/lib/devSettings";
import { NetworkProvider } from "@/lib/network";
import { createQueryClient } from "@/lib/queryClient";

function NetworkFromSettings({ children }: { children: ReactNode }) {
  const { settings } = useDevSettings();
  return <NetworkProvider forceOffline={settings.forceOffline}>{children}</NetworkProvider>;
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  return (
    <DevSettingsProvider>
      <QueryClientProvider client={queryClient}>
        <NetworkFromSettings>
          <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
            <Stack.Screen name="index" options={{ title: "Your practice" }} />
            <Stack.Screen name="econsult" options={{ headerShown: false }} />
            <Stack.Screen name="dev-settings" options={{ title: "Developer settings", presentation: "modal" }} />
          </Stack>
        </NetworkFromSettings>
      </QueryClientProvider>
    </DevSettingsProvider>
  );
}
```

- [ ] **Step 4: Write the home screen, the flow layout, the placeholders and the test flow layout**

`src/app/index.tsx`:

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { TextButton } from "@/components/TextButton";
import { careTeamQuery, configQuery } from "@/features/econsult/queries";
import { useServices, useSession } from "@/lib/devSettings";
import { isDevelopmentBuild } from "@/lib/devWarn";
import { text } from "@/theme/text";

const INTRO = "Ask your GP practice a non-urgent question. They usually reply within two working days.";

export default function HomeScreen() {
  const router = useRouter();
  const session = useSession();
  const services = useServices();
  const queryClient = useQueryClient();

  // Prefetch so the first step is usually instant; the loading state stays reachable through latency.
  useEffect(() => {
    void queryClient.prefetchQuery(configQuery(services, session.practiceId));
    void queryClient.prefetchQuery(careTeamQuery(services, session.practiceId));
  }, [queryClient, services, session.practiceId]);

  return (
    <ScreenScaffold
      action={
        <PrimaryButton label="Write to your practice" onPress={() => router.push("/econsult/recipient")} />
      }
    >
      <Text accessibilityRole="header" style={text.title}>
        Hello, {session.displayName}.
      </Text>
      <Text style={text.body}>{INTRO}</Text>
      {isDevelopmentBuild() ? (
        <TextButton label="Developer settings" onPress={() => router.push("/dev-settings")} />
      ) : null}
    </ScreenScaffold>
  );
}
```

`src/app/econsult/_layout.tsx`:

```tsx
import { Stack } from "expo-router";
import { DraftProvider } from "@/features/econsult/DraftProvider";

// A deep link or reload into a later step still gets a back arrow to the first step.
export const unstable_settings = { anchor: "recipient" };

export default function EConsultLayout() {
  return (
    <DraftProvider>
      <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
        <Stack.Screen name="recipient" options={{ title: "Recipient" }} />
        <Stack.Screen name="questions" options={{ title: "Questions" }} />
        <Stack.Screen name="message" options={{ title: "Message" }} />
        <Stack.Screen name="sent" options={{ title: "Sent", headerBackVisible: false, gestureEnabled: false }} />
      </Stack>
    </DraftProvider>
  );
}
```

`src/test/flowLayout.tsx` (tests only):

```tsx
import { Stack } from "expo-router";
import type { DraftState } from "@/features/econsult/draft";
import { DraftProvider } from "@/features/econsult/DraftProvider";

// The real EConsultLayout mounts its own DraftProvider, which would shadow a test draft, so router
// tests register this layout under "econsult/_layout" with the preset draft instead. It declares no
// screens, so any partial route map renders without expo-router warnings; header options are not under test.
export function flowLayoutWith(draft?: DraftState) {
  return function TestFlowLayout() {
    return (
      <DraftProvider initial={draft}>
        <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }} />
      </DraftProvider>
    );
  };
}
```

`src/test/expo-router-matchers.d.ts` (expo-router registers these matchers at runtime in `testing-library/expect.js` but ships no type augmentation; without this file `tsc` rejects every `toHavePathname` assertion):

```ts
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

Placeholders, each replaced by its own task later. `src/app/econsult/recipient.tsx`:

```tsx
import { Text } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { STEP_TITLES } from "@/features/econsult/steps";

export default function RecipientScreen() {
  return (
    <ScreenScaffold>
      <Text accessibilityRole="header">{STEP_TITLES.recipient}</Text>
    </ScreenScaffold>
  );
}
```

`src/app/econsult/questions.tsx`, `src/app/econsult/message.tsx`: identical to the recipient placeholder with `STEP_TITLES.questions` and `STEP_TITLES.message` and component names `QuestionsScreen`, `MessageScreen`. `src/app/econsult/sent.tsx`: the same shape with the literal heading `"Message sent"` and component name `SentScreen`. `src/app/dev-settings.tsx`: the same shape with the literal heading `"Developer settings"` and component name `DevSettingsScreen`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest src/__tests__/app`
Expected: PASS, 5 tests.

- [ ] **Step 6: Scoped verify**

```bash
npx jest src/__tests__/app
npm run typecheck
npm run lint
```

Expected: all exit 0. `npm run typecheck` regenerates the typed routes first, so `/econsult/recipient` and `/dev-settings` are valid `Href`s.

---

### Task 16: Step 1, the recipient screen

**T016** · **Visual:** render — the recipient step on the iOS simulator in its loaded state with one card selected, at the default and the largest text size, plus its loading, error and empty states reached through the developer seeds.

**Files:**
- Modify: `src/app/econsult/recipient.tsx`
- Create: `src/__tests__/app/econsult/recipient.test.tsx`

**Interfaces:**
- Consumes: `useRecipients`, `RecipientsResult` (Task 8); `roleLabel` (Task 8); `useDraft` (Task 7); `shouldGuardLeaving` (Task 7); `stepCount`, `STEP_TITLES`, `routeAfterRecipient` (Task 9); `ScreenScaffold`, `PrimaryButton`, `TextButton`, `StepHeader` (Task 12); `RecipientCard`, `LoadingCards`, `EmptyState`, `ErrorState` (Task 13); `TestProviders` (Task 6); `flowLayoutWith` (Task 15); `usePreventRemove` from `expo-router/react-navigation`.
- Produces: the finished first step at `/econsult/recipient`.

- [ ] **Step 1: Write the failing tests**

`src/__tests__/app/econsult/recipient.test.tsx`:

```tsx
import { userEvent } from "@testing-library/react-native";
import { act, renderRouter, screen, waitFor } from "expo-router/testing-library";
import { router } from "expo-router";
import { Alert, Text } from "react-native";
import HomeScreen from "@/app/index";
import RecipientScreen from "@/app/econsult/recipient";
import { RETRY_LABEL } from "@/components/StatusViews";
import { initialDraft, type DraftState } from "@/features/econsult/draft";
import { STEP_TITLES } from "@/features/econsult/steps";
import * as useRecipientsModule from "@/features/econsult/useRecipients";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders, type ProviderOptions } from "@/test/providers";

const Stub = (label: string) => () => <Text>{label}</Text>;

function renderFlow(options: ProviderOptions = {}, draft?: DraftState, initialUrl = "/econsult/recipient") {
  return renderRouter(
    {
      index: HomeScreen,
      "econsult/_layout": flowLayoutWith(draft),
      "econsult/recipient": RecipientScreen,
      "econsult/questions": Stub("questions"),
      "econsult/message": Stub("message"),
    },
    { initialUrl, wrapper: ({ children }) => <TestProviders {...options}>{children}</TestProviders> },
  );
}

async function pressHome(user: ReturnType<typeof userEvent.setup>) {
  const header = screen.queryByRole("button", { name: "Home" });
  if (header) return user.press(header);
  // The native header is not always part of the test tree; drive the same navigation directly.
  act(() => router.dismissTo("/"));
}

describe("Recipient step", () => {
  afterEach(() => jest.restoreAllMocks());

  test("shows a loading indicator, then the writable care team as radio cards", async () => {
    renderFlow({ settings: { latencyMs: 50 } });

    expect(screen.getByRole("progressbar", { name: "Loading your practice's care team" })).toBeOnTheScreen();
    expect(await screen.findByRole("radio", { name: "Dr. J. de Vries, GP" })).toBeOnTheScreen();
    expect(screen.getByLabelText(STEP_TITLES.recipient)).toBeOnTheScreen();
    expect(screen.getByRole("radio", { name: "M. Bakker, Practice nurse" })).toBeOnTheScreen();
    expect(screen.getByRole("radio", { name: "S. Jansen, Practice assistant" })).toBeOnTheScreen();
    expect(screen.queryByRole("radio", { name: "Dr. P. Mulder, GP" })).toBeNull();
    expect(screen.getByText("Step 1 of 3")).toBeOnTheScreen();
  });

  test("Continue is disabled with a reason until a recipient is chosen, then goes to the questions", async () => {
    const user = userEvent.setup();
    renderFlow();
    await screen.findByRole("radio", { name: "Dr. J. de Vries, GP" });

    const disabled = screen.getByRole("button", { name: "Continue", disabled: true });
    expect(disabled.props.accessibilityHint).toBe("Choose who you are writing to first");
    await user.press(screen.getByRole("radio", { name: "Dr. J. de Vries, GP" }));
    expect(screen.getByRole("radio", { name: "Dr. J. de Vries, GP", checked: true })).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen).toHavePathname("/econsult/questions");
  });

  test("goes straight to the message when the practice has no questions", async () => {
    const user = userEvent.setup();
    renderFlow({ settings: { practiceId: "prc-0873" } });
    await user.press(await screen.findByRole("radio", { name: "Dr. A. Visser, GP" }));

    expect(screen.getByText("Step 1 of 2")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen).toHavePathname("/econsult/message");
  });

  test("preselects the only writable recipient", async () => {
    jest.spyOn(useRecipientsModule, "useRecipients").mockReturnValue({
      status: "ready",
      questions: [],
      recipients: [{ id: "ct-44", displayName: "Dr. A. Visser", role: "gp" }],
    });
    renderFlow();

    expect(await screen.findByRole("radio", { name: "Dr. A. Visser, GP", checked: true })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Continue", disabled: false })).toBeOnTheScreen();
  });

  test("shows an error with retry when the practice details fail to load", async () => {
    renderFlow({ settings: { faults: { config: "server" } } });

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't load your practice's details");
    expect(screen.getByRole("button", { name: RETRY_LABEL })).toBeOnTheScreen();
  });

  test("shows the empty state when the practice lists no recipients", async () => {
    renderFlow({ settings: { practiceId: "prc-0000" } });

    expect(await screen.findByRole("header", { name: "Your practice hasn't switched on e-consults in the app yet" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Back to start" })).toBeOnTheScreen();
  });

  test("leaving with a typed message asks before discarding", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    renderFlow({}, { ...initialDraft, message: "My knee hurts" }, "/");
    await user.press(screen.getByRole("button", { name: "Write to your practice" }));
    await screen.findByRole("radio", { name: "Dr. J. de Vries, GP" });

    await pressHome(user);

    expect(alert).toHaveBeenCalledWith("Discard your message?", expect.any(String), expect.any(Array));
    expect(screen).toHavePathname("/econsult/recipient");
  });

  test("leaving without content goes home at once", async () => {
    const user = userEvent.setup();
    renderFlow({}, undefined, "/");
    await user.press(screen.getByRole("button", { name: "Write to your practice" }));
    await screen.findByRole("radio", { name: "Dr. J. de Vries, GP" });

    await pressHome(user);

    await waitFor(() => expect(screen).toHavePathname("/"));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/__tests__/app/econsult/recipient.test.tsx`
Expected: FAIL (the placeholder renders only a heading).

- [ ] **Step 3: Write the screen**

`src/app/econsult/recipient.tsx`:

```tsx
import { Stack, useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { RecipientCard } from "@/components/RecipientCard";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { EmptyState, ErrorState, LoadingCards } from "@/components/StatusViews";
import { StepHeader } from "@/components/StepHeader";
import { TextButton } from "@/components/TextButton";
import { shouldGuardLeaving, type DraftState } from "@/features/econsult/draft";
import { useDraft } from "@/features/econsult/DraftProvider";
import { roleLabel } from "@/features/econsult/recipients";
import { routeAfterRecipient, STEP_TITLES, stepCount } from "@/features/econsult/steps";
import { useRecipients, type RecipientsResult } from "@/features/econsult/useRecipients";
import { spacing } from "@/theme/tokens";

const LOADING_LABEL = "Loading your practice's care team";
const CONTINUE_HINT = "Choose who you are writing to first";
const EMPTY_TITLE = "Your practice hasn't switched on e-consults in the app yet";
const EMPTY_BODY = "You can still phone the practice with your question.";
const ERROR_TITLE = "We couldn't load your practice's details";
const ERROR_BODY = "Check your connection and try again.";
const DISCARD_TITLE = "Discard your message?";
const DISCARD_BODY = "Your message and photo will be lost.";

type ReadyResult = Extract<RecipientsResult, { status: "ready" }>;

// A container, not an accessibility element: the cards inside stay individually focusable radios.
function RecipientList({ result, selectedId, onSelect }: { result: ReadyResult; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={STEP_TITLES.recipient} style={styles.list}>
      {result.recipients.map((recipient) => (
        <RecipientCard
          key={recipient.id}
          name={recipient.displayName}
          role={roleLabel(recipient.role)}
          checked={recipient.id === selectedId}
          onPress={() => onSelect(recipient.id)}
        />
      ))}
    </View>
  );
}

function useDiscardGuard(draft: DraftState) {
  const navigation = useNavigation();
  usePreventRemove(shouldGuardLeaving(draft), ({ data }) => {
    Alert.alert(DISCARD_TITLE, DISCARD_BODY, [
      { text: "Keep writing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => navigation.dispatch(data.action) },
    ]);
  });
}

export default function RecipientScreen() {
  const router = useRouter();
  const { draft, dispatch } = useDraft();
  const result = useRecipients();
  const hasQuestions = result.status === "ready" && result.questions.length > 0;
  const onlyRecipient = result.status === "ready" && result.recipients.length === 1 ? result.recipients[0] : null;
  useDiscardGuard(draft);

  // Exactly one writable recipient: preselect so the flow keeps one shape.
  useEffect(() => {
    if (onlyRecipient && draft.recipientId === null) {
      dispatch({ type: "recipientSelected", recipientId: onlyRecipient.id });
    }
  }, [onlyRecipient, draft.recipientId, dispatch]);

  const goHome = () => router.dismissTo("/");
  const action =
    result.status === "ready" ? (
      <PrimaryButton
        label="Continue"
        disabled={draft.recipientId === null}
        accessibilityHint={CONTINUE_HINT}
        onPress={() => router.push(routeAfterRecipient(hasQuestions))}
      />
    ) : undefined;

  return (
    <>
      <Stack.Screen options={{ headerLeft: () => <TextButton label="Home" onPress={goHome} /> }} />
      <ScreenScaffold action={action}>
        {result.status === "ready" ? (
          <StepHeader stepNumber={1} stepCount={stepCount(hasQuestions)} title={STEP_TITLES.recipient} />
        ) : null}
        {result.status === "loading" ? <LoadingCards label={LOADING_LABEL} /> : null}
        {result.status === "error" ? <ErrorState title={ERROR_TITLE} body={ERROR_BODY} onRetry={result.retry} /> : null}
        {result.status === "empty" ? (
          <EmptyState title={EMPTY_TITLE} body={EMPTY_BODY} action={<TextButton label="Back to start" onPress={goHome} />} />
        ) : null}
        {result.status === "ready" ? (
          <RecipientList result={result} selectedId={draft.recipientId} onSelect={(id) => dispatch({ type: "recipientSelected", recipientId: id })} />
        ) : null}
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/__tests__/app/econsult/recipient.test.tsx`
Expected: PASS, 8 tests. The `pressHome` helper drives the same `router.dismissTo("/")` the header button calls when the native header is not in the test tree; the screen is never changed for the test's sake.

- [ ] **Step 5: Scoped verify**

```bash
npx jest src/__tests__/app
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 17: Step 2, the questions screen

**T017** · **Visual:** render — the questions step for `prc-0421` on the iOS simulator: pristine, with a validation error on the required choice and focus on it, and with the keyboard open on the text answer showing the field and the Continue button both visible; default and largest text size.

**Files:**
- Modify: `src/app/econsult/questions.tsx`
- Create: `src/__tests__/app/econsult/questions.test.tsx`

**Interfaces:**
- Consumes: `useQuestions` (Task 8); `useDraft` (Task 7); `validateAnswers`, `AnswerErrors` (Task 9); `stepCount`, `stepNumber`, `STEP_TITLES` (Task 9); `announce`, `focusForScreenReader`, `Focusable` (Task 5); `ScreenScaffold`, `PrimaryButton`, `StepHeader` (Task 12); `TextField`, `ChoiceGroup` (Task 13); `TestProviders` (Task 6); `flowLayoutWith` (Task 15).
- Produces: the finished second step at `/econsult/questions`.

- [ ] **Step 1: Write the failing tests**

`src/__tests__/app/econsult/questions.test.tsx`:

```tsx
import { userEvent } from "@testing-library/react-native";
import { renderRouter, screen } from "expo-router/testing-library";
import { AccessibilityInfo, Text } from "react-native";
import QuestionsScreen from "@/app/econsult/questions";
import { initialDraft, type DraftState } from "@/features/econsult/draft";
import { useDraft } from "@/features/econsult/DraftProvider";
import { REQUIRED_ERROR } from "@/features/econsult/validation";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders } from "@/test/providers";

function MessageProbe() {
  const { draft } = useDraft();
  return <Text>{`message:${draft.answers["q-duration"] ?? ""}:${draft.answers["q-medication"] ?? ""}`}</Text>;
}

const DRAFT: DraftState = { ...initialDraft, recipientId: "ct-11" };
const CHOICE = "How long have you had this problem? (required)";
const TEXT = "Are you already taking anything for it? (optional)";

function renderQuestions(draft: DraftState = DRAFT) {
  return renderRouter(
    {
      "econsult/_layout": flowLayoutWith(draft),
      "econsult/questions": QuestionsScreen,
      "econsult/message": MessageProbe,
    },
    {
      initialUrl: "/econsult/questions",
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    },
  );
}

describe("Questions step", () => {
  afterEach(() => jest.restoreAllMocks());

  test("renders the practice's questions with their requirement in words", async () => {
    renderQuestions();

    expect(await screen.findByLabelText(CHOICE)).toBeOnTheScreen();
    expect(screen.getByLabelText(TEXT)).toBeOnTheScreen();
    expect(screen.getByText("Step 2 of 3")).toBeOnTheScreen();
  });

  test("blocks Continue on an unanswered required question, ties the error to it, announces and focuses it", async () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => {});
    const user = userEvent.setup();
    renderQuestions();
    await screen.findByLabelText(CHOICE);

    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByLabelText(`${CHOICE}. Error: ${REQUIRED_ERROR}`)).toBeOnTheScreen();
    expect(announce).toHaveBeenCalledWith(REQUIRED_ERROR);
    expect(focus).toHaveBeenCalledWith(expect.anything(), "focus");
    expect(screen).toHavePathname("/econsult/questions");
  });

  test("answering clears the error and Continue records the answers in the draft", async () => {
    const user = userEvent.setup();
    renderQuestions();
    await screen.findByLabelText(CHOICE);
    await user.press(screen.getByRole("button", { name: "Continue" }));

    await user.press(screen.getByRole("radio", { name: "1 to 4 weeks" }));
    expect(screen.queryByText(REQUIRED_ERROR)).toBeNull();
    await user.type(screen.getByLabelText(TEXT), "Paracetamol");
    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen).toHavePathname("/econsult/message");
    expect(screen.getByText("message:1 to 4 weeks:Paracetamol")).toBeOnTheScreen();
  });

  test("an optional question can be left empty", async () => {
    const user = userEvent.setup();
    renderQuestions({ ...DRAFT, answers: { "q-duration": "Less than a week" } });
    await screen.findByLabelText(CHOICE);

    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen).toHavePathname("/econsult/message");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/__tests__/app/econsult/questions.test.tsx`
Expected: FAIL (the placeholder renders only a heading).

- [ ] **Step 3: Write the screen**

`src/app/econsult/questions.tsx`:

```tsx
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import type { Question } from "@/api/contracts";
import { ChoiceGroup } from "@/components/ChoiceGroup";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { StepHeader } from "@/components/StepHeader";
import { TextField } from "@/components/TextField";
import { useDraft } from "@/features/econsult/DraftProvider";
import { STEP_TITLES, stepCount, stepNumber } from "@/features/econsult/steps";
import { useQuestions } from "@/features/econsult/useQuestions";
import { validateAnswers, type AnswerErrors } from "@/features/econsult/validation";
import { announce, focusForScreenReader, type Focusable } from "@/lib/announce";

function requirementOf(question: Question) {
  return question.required ? "required" : "optional";
}

function withoutKey(errors: AnswerErrors, key: string): AnswerErrors {
  const { [key]: _removed, ...rest } = errors;
  return rest;
}

type FieldProps = {
  question: Question;
  value: string | null;
  error: string | undefined;
  onChange: (value: string) => void;
  fieldRef: (node: Focusable | null) => void;
};

function QuestionField({ question, value, error, onChange, fieldRef }: FieldProps) {
  const requirement = requirementOf(question);
  if (question.type === "choice") {
    return (
      <ChoiceGroup ref={fieldRef} label={question.label} requirement={requirement} options={question.options} value={value} onChange={onChange} error={error} />
    );
  }
  return (
    <TextField ref={fieldRef} label={question.label} requirement={requirement} value={value ?? ""} onChangeText={onChange} error={error} multiline />
  );
}

export default function QuestionsScreen() {
  const router = useRouter();
  const { draft, dispatch } = useDraft();
  const questions = useQuestions();
  const [errors, setErrors] = useState<AnswerErrors>({});
  const fieldRefs = useRef<Map<string, Focusable | null>>(new Map());

  function answer(questionId: string, value: string) {
    dispatch({ type: "answerChanged", questionId, value });
    setErrors((current) => withoutKey(current, questionId));
  }

  function onContinue() {
    const next = validateAnswers(questions, draft.answers);
    setErrors(next);
    const firstInvalid = questions.find((question) => next[question.id]);
    if (firstInvalid) {
      announce(next[firstInvalid.id]);
      focusForScreenReader(fieldRefs.current.get(firstInvalid.id) ?? null);
      return;
    }
    router.push("/econsult/message");
  }

  return (
    <ScreenScaffold action={<PrimaryButton label="Continue" onPress={onContinue} />}>
      <StepHeader stepNumber={stepNumber("questions", true)} stepCount={stepCount(true)} title={STEP_TITLES.questions} />
      {questions.map((question) => (
        <QuestionField
          key={question.id}
          question={question}
          value={draft.answers[question.id] ?? null}
          error={errors[question.id]}
          onChange={(value) => answer(question.id, value)}
          fieldRef={(node) => void fieldRefs.current.set(question.id, node)}
        />
      ))}
    </ScreenScaffold>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/__tests__/app/econsult/questions.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Scoped verify**

```bash
npx jest src/__tests__/app
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 18: Step 3, the message screen with photo and sending

**T018** · **Visual:** render — the message step on the iOS simulator: pristine with the "To" row, with the keyboard open showing the field and the Send button, with a photo attached from the library, sending (busy button and status line), the create-failure error with Retry, and the offline banner with Send disabled; default and largest text size.

**Files:**
- Modify: `src/app/econsult/message.tsx`
- Create: `src/__tests__/app/econsult/message.test.tsx`
- Create: `src/features/econsult/errorCopy.ts`
- Create: `src/features/econsult/errorCopy.test.ts`

**Interfaces:**
- Consumes: `useDraft`, `isPhotoPreparing`, `readyPhoto` (Task 7); `useRecipients` (Task 8); `recipientNameFor` (Task 8); `useQuestions` (Task 8); `validateMessage`, `isMessageThin` (Task 9); `stepCount`, `stepNumber`, `STEP_TITLES` (Task 9); `useSubmit` (Task 10); `newId` (Task 5); `useSession` (Task 6); `useIsOffline` (Task 5); `announce`, `focusForScreenReader` (Task 5); `photoFileFor` (Task 11); `isApiError` (Task 3); `ScreenScaffold`, `PrimaryButton`, `TextButton`, `StepHeader` (Task 12); `TextField`, `ErrorState` (Task 13); `PhotoPicker` (Task 14); `TestProviders` (Task 6); `flowLayoutWith` (Task 15).
- Produces: the finished third step at `/econsult/message`; `sendErrorCopy(error: unknown): string`.

- [ ] **Step 1: Write the failing tests**

`src/features/econsult/errorCopy.test.ts`:

```ts
import { ApiError } from "@/api/transport";
import { sendErrorCopy } from "./errorCopy";

describe("sendErrorCopy", () => {
  test.each([
    ["timeout", "Sending took too long. Check your connection and try again."],
    ["network", "We couldn't reach your practice. Check your connection and try again."],
    ["server", "Something went wrong at our end. Please try again."],
    ["validation", "Something went wrong at our end. Please try again."],
  ] as const)("%s -> plain-language copy", (kind, copy) => {
    expect(sendErrorCopy(new ApiError(kind, "x"))).toBe(copy);
  });

  test("an unknown error gets the generic copy", () => {
    expect(sendErrorCopy(new Error("bug"))).toBe("Something went wrong at our end. Please try again.");
  });
});
```

`src/__tests__/app/econsult/message.test.tsx`:

```tsx
import { userEvent } from "@testing-library/react-native";
import { renderRouter, screen, waitFor } from "expo-router/testing-library";
import { AccessibilityInfo, Text } from "react-native";
import MessageScreen from "@/app/econsult/message";
import { RETRY_LABEL } from "@/components/StatusViews";
import { initialDraft, type DraftState } from "@/features/econsult/draft";
import { useDraft } from "@/features/econsult/DraftProvider";
import { EMPTY_MESSAGE_ERROR } from "@/features/econsult/validation";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders, type ProviderOptions } from "@/test/providers";

function SentProbe() {
  const { draft } = useDraft();
  return <Text>{`sent:${draft.econsultId ?? "none"}:${draft.attachment}`}</Text>;
}
const RecipientStub = () => <Text>recipient</Text>;

const DRAFT: DraftState = { ...initialDraft, recipientId: "ct-11" };
const READY_PHOTO = { status: "ready", pickId: "p1", uri: "file:///cache/p.jpg", width: 10, height: 10 } as const;
const FIELD = "What would you like to ask?";

function renderMessage(options: ProviderOptions = {}, draft: DraftState = DRAFT) {
  return renderRouter(
    {
      "econsult/_layout": flowLayoutWith(draft),
      "econsult/recipient": RecipientStub,
      "econsult/message": MessageScreen,
      "econsult/sent": SentProbe,
    },
    {
      initialUrl: "/econsult/message",
      wrapper: ({ children }) => <TestProviders {...options}>{children}</TestProviders>,
    },
  );
}

describe("Message step", () => {
  afterEach(() => jest.restoreAllMocks());

  test("shows who the message goes to and lets the patient change it", async () => {
    const user = userEvent.setup();
    renderMessage();

    expect(await screen.findByText("To: Dr. J. de Vries")).toBeOnTheScreen();
    expect(screen.getByText("Step 3 of 3")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "Change" }));

    expect(screen).toHavePathname("/econsult/recipient");
  });

  test("an empty message is blocked with an error tied to the field and announced", async () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");

    await user.press(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByLabelText(`${FIELD}. Error: ${EMPTY_MESSAGE_ERROR}`)).toBeOnTheScreen();
    expect(announce).toHaveBeenCalledWith(EMPTY_MESSAGE_ERROR);
    expect(screen).toHavePathname("/econsult/message");
  });

  test("a short message gets a nudge that never blocks sending", async () => {
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "knee hurts");
    expect(screen.getByText(/A little more detail helps/)).toBeOnTheScreen();
    await user.type(screen.getByLabelText(FIELD), " since two weeks after a fall");

    expect(screen.queryByText(/A little more detail helps/)).toBeNull();
  });

  test("sends the message, reports the status, and moves to the confirmation", async () => {
    const user = userEvent.setup();
    renderMessage();
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");
    await user.press(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
    expect(screen.getByText(/^sent:ec-\d+:none$/)).toBeOnTheScreen();
  });

  test("uploads the photo after the message and reports it attached", async () => {
    const user = userEvent.setup();
    renderMessage({}, { ...DRAFT, photo: READY_PHOTO });
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "Rash on my arm");
    await user.press(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
    expect(screen.getByText(/^sent:ec-\d+:attached$/)).toBeOnTheScreen();
  });

  test("a failed upload still reaches the confirmation, marked as failed", async () => {
    const user = userEvent.setup();
    renderMessage({ settings: { faults: { upload: "server" } } }, { ...DRAFT, photo: READY_PHOTO });
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "Rash on my arm");
    await user.press(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen).toHavePathname("/econsult/sent"));
    expect(screen.getByText(/^sent:ec-\d+:failed$/)).toBeOnTheScreen();
  });

  test("a failed create shows a plain-language error with retry and stays on the step", async () => {
    const user = userEvent.setup();
    renderMessage({ settings: { faults: { create: "network" } } });
    await screen.findByText("To: Dr. J. de Vries");

    await user.type(screen.getByLabelText(FIELD), "My knee has hurt for two weeks");
    await user.press(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't reach your practice");
    expect(screen.getByRole("button", { name: RETRY_LABEL })).toBeOnTheScreen();
    expect(screen).toHavePathname("/econsult/message");
  });

  test("Send is disabled with a spoken reason while offline", async () => {
    renderMessage({ settings: { forceOffline: true } });
    await screen.findByText("To: Dr. J. de Vries");

    const send = screen.getByRole("button", { name: "Send", disabled: true });

    expect(send.props.accessibilityHint).toBe("You're offline. Sending needs a connection.");
    expect(screen.getByRole("alert")).toHaveTextContent(/offline/);
  });

  test("Send is disabled while a photo is still preparing", async () => {
    renderMessage({}, { ...DRAFT, photo: { status: "preparing", pickId: "p1" } });
    await screen.findByText("To: Dr. J. de Vries");

    const send = screen.getByRole("button", { name: "Send", disabled: true });

    expect(send.props.accessibilityHint).toBe("Wait for the photo to finish preparing");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/features/econsult/errorCopy.test.ts src/__tests__/app/econsult/message.test.tsx`
Expected: FAIL ("Cannot find module './errorCopy'"; the message placeholder renders only a heading).

- [ ] **Step 3: Write the error copy and the screen**

`src/features/econsult/errorCopy.ts`:

```ts
import { isApiError } from "@/api/transport";

const TIMEOUT_COPY = "Sending took too long. Check your connection and try again.";
const NETWORK_COPY = "We couldn't reach your practice. Check your connection and try again.";
const GENERIC_COPY = "Something went wrong at our end. Please try again.";

export function sendErrorCopy(error: unknown): string {
  if (!isApiError(error)) return GENERIC_COPY;
  if (error.kind === "timeout") return TIMEOUT_COPY;
  if (error.kind === "network") return NETWORK_COPY;
  return GENERIC_COPY;
}
```

`src/app/econsult/message.tsx`:

```tsx
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { PhotoPicker } from "@/components/PhotoPicker";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { ErrorState } from "@/components/StatusViews";
import { StepHeader } from "@/components/StepHeader";
import { TextButton } from "@/components/TextButton";
import { TextField } from "@/components/TextField";
import { isPhotoPreparing, readyPhoto } from "@/features/econsult/draft";
import { useDraft } from "@/features/econsult/DraftProvider";
import { sendErrorCopy } from "@/features/econsult/errorCopy";
import { recipientNameFor } from "@/features/econsult/recipients";
import { STEP_TITLES, stepCount, stepNumber } from "@/features/econsult/steps";
import { useQuestions } from "@/features/econsult/useQuestions";
import { useRecipients } from "@/features/econsult/useRecipients";
import { useSubmit } from "@/features/econsult/useSubmit";
import { isMessageThin, validateMessage } from "@/features/econsult/validation";
import { announce, focusForScreenReader } from "@/lib/announce";
import { useSession } from "@/lib/devSettings";
import { newId } from "@/lib/ids";
import { useIsOffline } from "@/lib/network";
import { photoFileFor } from "@/lib/photo";
import { text } from "@/theme/text";
import { colors, fontSize, lineHeight, spacing } from "@/theme/tokens";

const FIELD_LABEL = "What would you like to ask?";
const FIELD_HINT = "What helps your GP: where it is, since when, and what you have already tried.";
const THIN_NUDGE = "A little more detail helps your GP answer without asking back, for example where it is and since when.";
const OFFLINE_HINT = "You're offline. Sending needs a connection.";
const PREPARING_HINT = "Wait for the photo to finish preparing";
const SENDING_STATUS = "Sending your message";
const SENT_STATUS = "Message sent";
const SENT_WITH_PHOTO_STATUS = "Message sent, adding your photo";
const ERROR_TITLE = "Your message wasn't sent";

// Validates, and on a problem announces it and moves screen-reader focus to the field.
function firstProblem(message: string, field: TextInput | null): string | null {
  const error = validateMessage(message);
  if (error) {
    announce(error);
    focusForScreenReader(field);
  }
  return error;
}

function useSend() {
  const router = useRouter();
  const session = useSession();
  const { draft, dispatch } = useDraft();
  const [messageError, setMessageError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const messageRef = useRef<TextInput>(null);
  const photo = readyPhoto(draft);
  const submit = useSubmit((econsultId) => {
    dispatch({ type: "econsultCreated", econsultId });
    setStatus(photo ? SENT_WITH_PHOTO_STATUS : SENT_STATUS);
  });

  useEffect(() => {
    if (status) announce(status);
  }, [status]);

  function onMessageChange(message: string) {
    dispatch({ type: "messageChanged", message });
    if (messageError) setMessageError(null);
  }

  async function onSend() {
    const error = firstProblem(draft.message, messageRef.current);
    setMessageError(error);
    if (error || !draft.recipientId) return;
    const idempotencyKey = draft.idempotencyKey ?? newId();
    dispatch({ type: "submitStarted", idempotencyKey });
    setStatus(SENDING_STATUS);
    // The mutation's own error state renders below; catching here only prevents an unhandled rejection.
    try {
      const outcome = await submit.mutateAsync({
        session,
        recipientId: draft.recipientId,
        message: draft.message,
        answers: draft.answers,
        photo: photo ? photoFileFor(photo) : null,
        idempotencyKey,
      });
      dispatch({ type: "attachmentSettled", attachment: outcome.attachment });
      router.replace("/econsult/sent");
    } catch {
      setStatus("");
    }
  }

  return { submit, status, messageError, messageRef, onMessageChange, onSend };
}

type SendState = ReturnType<typeof useSend>;

function SendButton({ send, isOffline, preparing }: { send: SendState; isOffline: boolean; preparing: boolean }) {
  const hint = isOffline ? OFFLINE_HINT : preparing ? PREPARING_HINT : undefined;
  return (
    <PrimaryButton
      label="Send"
      busyLabel="Sending"
      busy={send.submit.isPending}
      disabled={isOffline || preparing}
      accessibilityHint={hint}
      onPress={() => void send.onSend()}
    />
  );
}

function ToRow({ name, onChange }: { name: string; onChange: () => void }) {
  return (
    <View style={styles.toRow}>
      <Text style={styles.to}>To: {name}</Text>
      <TextButton label="Change" accessibilityHint="Choose a different person" onPress={onChange} />
    </View>
  );
}

function SendFeedback({ status, error, onRetry }: { status: string; error: Error | null; onRetry: () => void }) {
  return (
    <>
      {status ? (
        <Text accessibilityLiveRegion="polite" style={styles.status}>
          {status}
        </Text>
      ) : null}
      {error ? <ErrorState title={ERROR_TITLE} body={sendErrorCopy(error)} onRetry={onRetry} /> : null}
    </>
  );
}

export default function MessageScreen() {
  const router = useRouter();
  const isOffline = useIsOffline();
  const { draft, dispatch } = useDraft();
  const recipients = useRecipients();
  const questions = useQuestions();
  const send = useSend();
  const hasQuestions = questions.length > 0;
  const preparing = isPhotoPreparing(draft);

  return (
    <ScreenScaffold action={<SendButton send={send} isOffline={isOffline} preparing={preparing} />}>
      <StepHeader stepNumber={stepNumber("message", hasQuestions)} stepCount={stepCount(hasQuestions)} title={STEP_TITLES.message} />
      <ToRow name={recipientNameFor(recipients, draft.recipientId)} onChange={() => router.dismissTo("/econsult/recipient")} />
      <TextField
        ref={send.messageRef}
        label={FIELD_LABEL}
        hint={FIELD_HINT}
        value={draft.message}
        onChangeText={send.onMessageChange}
        error={send.messageError}
        editable={!send.submit.isPending}
        multiline
      />
      {isMessageThin(draft.message) ? (
        <Text accessibilityLiveRegion="polite" style={text.muted}>
          {THIN_NUDGE}
        </Text>
      ) : null}
      <PhotoPicker
        photo={draft.photo}
        disabled={send.submit.isPending}
        onPickStarted={(pickId) => dispatch({ type: "photoPickStarted", pickId })}
        onPickReady={(pickId, result) => dispatch({ type: "photoReady", pickId, ...result })}
        onRemove={() => dispatch({ type: "photoRemoved" })}
      />
      <SendFeedback status={send.status} error={send.submit.error} onRetry={() => void send.onSend()} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  toRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  to: { flexShrink: 1, color: colors.text, fontSize: fontSize.body, lineHeight: lineHeight.body, fontWeight: "600" },
  status: { color: colors.primary, fontSize: fontSize.body, lineHeight: lineHeight.body, fontWeight: "600" },
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/features/econsult/errorCopy.test.ts src/__tests__/app/econsult/message.test.tsx`
Expected: PASS, 14 tests.

- [ ] **Step 5: Scoped verify**

```bash
npx jest src/__tests__/app src/features
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 19: The confirmation screen

**T019** · **Visual:** render — the confirmation on the iOS simulator in its normal state and in the partial-failure state (photo not attached, with Try again and Continue without the photo), default and largest text size; plus a screenshot after Done showing the home screen.

**Files:**
- Modify: `src/app/econsult/sent.tsx`
- Create: `src/__tests__/app/econsult/sent.test.tsx`

**Interfaces:**
- Consumes: `useDraft`, `readyPhoto` (Task 7); `useRecipients` (Task 8); `recipientNameFor` (Task 8); `useRetryAttachment` (Task 10); `photoFileFor` (Task 11); `focusForScreenReader`, `Focusable` (Task 5); `ScreenScaffold`, `PrimaryButton`, `TextButton` (Task 12); `TestProviders` (Task 6); `flowLayoutWith` (Task 15); `usePreventRemove` from `expo-router/react-navigation`.
- Produces: the finished confirmation at `/econsult/sent`.

- [ ] **Step 1: Write the failing tests**

`src/__tests__/app/econsult/sent.test.tsx`:

```tsx
import { userEvent } from "@testing-library/react-native";
import { act, renderRouter, screen, waitFor } from "expo-router/testing-library";
import { router } from "expo-router";
import { AccessibilityInfo, Text } from "react-native";
import SentScreen from "@/app/econsult/sent";
import { initialDraft, type DraftState } from "@/features/econsult/draft";
import * as useSubmitModule from "@/features/econsult/useSubmit";
import { flowLayoutWith } from "@/test/flowLayout";
import { TestProviders } from "@/test/providers";

const Home = () => <Text>home</Text>;
const Recipient = () => <Text>recipient</Text>;
const READY_PHOTO = { status: "ready", pickId: "p1", uri: "file:///cache/p.jpg", width: 10, height: 10 } as const;
const SENT: DraftState = { ...initialDraft, recipientId: "ct-11", message: "Hi", econsultId: "ec-1", attachment: "none" };

// Start on step 1 and replace it with the confirmation so that "back" has a real target to be blocked from.
function renderSent(draft: DraftState) {
  const view = renderRouter(
    { index: Home, "econsult/_layout": flowLayoutWith(draft), "econsult/recipient": Recipient, "econsult/sent": SentScreen },
    {
      initialUrl: "/econsult/recipient",
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    },
  );
  act(() => router.push("/econsult/sent"));
  return view;
}

describe("Sent", () => {
  afterEach(() => jest.restoreAllMocks());

  test("confirms who received the message, gives the reference, and focuses the heading", async () => {
    const focus = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => {});
    renderSent(SENT);

    expect(screen.getByRole("header", { name: "Message sent" })).toBeOnTheScreen();
    expect(await screen.findByText("Sent to Dr. J. de Vries.")).toBeOnTheScreen();
    expect(screen.getByText(/Reference: ec-1/)).toBeOnTheScreen();
    expect(screen.getByText(/two working days/)).toBeOnTheScreen();
    expect(focus).toHaveBeenCalledWith(expect.anything(), "focus");
  });

  test("cannot be left by going back", async () => {
    renderSent(SENT);
    await screen.findByText("Sent to Dr. J. de Vries.");

    act(() => router.back());

    expect(screen).toHavePathname("/econsult/sent");
  });

  test("Done unwinds the flow to home", async () => {
    const user = userEvent.setup();
    renderSent(SENT);
    await screen.findByText("Sent to Dr. J. de Vries.");

    await user.press(screen.getByRole("button", { name: "Done" }));

    await waitFor(() => expect(screen).toHavePathname("/"));
  });

  test("a failed photo upload is shown with a retry and a way to continue without it", async () => {
    const user = userEvent.setup();
    renderSent({ ...SENT, photo: READY_PHOTO, attachment: "failed" });

    expect(await screen.findByRole("alert")).toHaveTextContent("Your message was sent, but the photo could not be attached");
    await user.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeOnTheScreen());

    await user.press(screen.getByRole("button", { name: "Continue without the photo" }));

    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("a successful retry confirms the photo", async () => {
    const retry = { mutateAsync: jest.fn(async () => "attached" as const), isPending: false };
    jest.spyOn(useSubmitModule, "useRetryAttachment").mockReturnValue(retry as unknown as ReturnType<typeof useSubmitModule.useRetryAttachment>);
    const user = userEvent.setup();
    renderSent({ ...SENT, photo: READY_PHOTO, attachment: "failed" });

    await user.press(await screen.findByRole("button", { name: "Try again" }));

    expect(retry.mutateAsync).toHaveBeenCalledWith({ econsultId: "ec-1", photo: { uri: READY_PHOTO.uri, name: "photo.jpg", type: "image/jpeg" } });
    expect(await screen.findByText("Your photo was attached.")).toBeOnTheScreen();
  });

  test("an attached photo is confirmed", async () => {
    renderSent({ ...SENT, photo: READY_PHOTO, attachment: "attached" });

    expect(await screen.findByText("Your photo was attached.")).toBeOnTheScreen();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/__tests__/app/econsult/sent.test.tsx`
Expected: FAIL (the placeholder renders only a heading).

- [ ] **Step 3: Write the screen**

`src/app/econsult/sent.tsx`:

```tsx
import { useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { TextButton } from "@/components/TextButton";
import { readyPhoto } from "@/features/econsult/draft";
import { useDraft } from "@/features/econsult/DraftProvider";
import { recipientNameFor } from "@/features/econsult/recipients";
import { useRecipients } from "@/features/econsult/useRecipients";
import { useRetryAttachment } from "@/features/econsult/useSubmit";
import { focusForScreenReader, type Focusable } from "@/lib/announce";
import { photoFileFor } from "@/lib/photo";
import { text } from "@/theme/text";
import { colors, radius, spacing } from "@/theme/tokens";

const TITLE = "Message sent";
const REPLY_TIME = "Your practice usually replies within two working days.";
const PHOTO_FAILED = "Your message was sent, but the photo could not be attached.";
const PHOTO_ATTACHED = "Your photo was attached.";

export default function SentScreen() {
  const router = useRouter();
  const { draft, dispatch } = useDraft();
  const recipients = useRecipients();
  const retry = useRetryAttachment();
  const [isLeaving, setIsLeaving] = useState(false);
  const headingRef = useRef<ComponentRef<typeof Text>>(null);
  const photo = readyPhoto(draft);

  // The guard stays up until Done lowers it; the unwind runs after that render, so it is not blocked.
  usePreventRemove(!isLeaving, () => {});

  useEffect(() => {
    focusForScreenReader(headingRef.current as Focusable | null);
  }, []);

  useEffect(() => {
    if (isLeaving) router.dismissTo("/");
  }, [isLeaving, router]);

  async function onRetry() {
    if (!photo || !draft.econsultId) return;
    const attachment = await retry.mutateAsync({ econsultId: draft.econsultId, photo: photoFileFor(photo) });
    dispatch({ type: "attachmentSettled", attachment });
  }

  return (
    <ScreenScaffold action={<PrimaryButton label="Done" onPress={() => setIsLeaving(true)} />}>
      <Text ref={headingRef} accessibilityRole="header" style={text.title}>
        {TITLE}
      </Text>
      <Text style={text.body}>Sent to {recipientNameFor(recipients, draft.recipientId)}.</Text>
      <Text style={text.body}>{REPLY_TIME}</Text>
      <Text style={text.body}>Reference: {draft.econsultId}</Text>
      {draft.attachment === "failed" ? (
        <View style={styles.warning}>
          <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={text.body}>{PHOTO_FAILED}</Text>
          </View>
          <PrimaryButton label="Try again" busy={retry.isPending} busyLabel="Attaching your photo" onPress={() => void onRetry()} />
          <TextButton label="Continue without the photo" onPress={() => dispatch({ type: "attachmentSettled", attachment: "none" })} />
        </View>
      ) : null}
      {draft.attachment === "attached" ? <Text style={text.body}>{PHOTO_ATTACHED}</Text> : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  warning: { gap: spacing.md, padding: spacing.md, borderRadius: radius, backgroundColor: colors.warningSurface },
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/__tests__/app/econsult/sent.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 5: Scoped verify**

```bash
npx jest src/__tests__/app
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 20: Developer settings screen

**T020** · **Visual:** render — the developer settings screen on the iOS simulator, then the home screen after Apply with `prc-0873` selected, and the recipient step showing that practice's two recipients.

**Files:**
- Modify: `src/app/dev-settings.tsx`
- Create: `src/__tests__/app/dev-settings.test.tsx`

**Interfaces:**
- Consumes: `useDevSettings`, `DevSettings`, `DEFAULT_PRACTICE_ID` (Task 6); `isDevelopmentBuild` (Task 5); `REQUEST_NAMES`, `FaultKind`, `Faults`, `RequestName` (Task 3); `FIXTURE_PRACTICE_IDS` (Task 2); `ChoiceGroup` (Task 13); `ScreenScaffold`, `PrimaryButton` (Task 12); `TestProviders` (Task 6).
- Produces: the finished `/dev-settings` route; the pure helpers `latencyOptionFor`, `latencyFor`, `faultOptionFor`, `faultFor`, `withFault`, `practiceIdFor`, `practiceLabelFor`.

- [ ] **Step 1: Write the failing tests**

`src/__tests__/app/dev-settings.test.tsx`:

```tsx
import { QueryClient } from "@tanstack/react-query";
import { userEvent } from "@testing-library/react-native";
import { renderRouter, screen, waitFor } from "expo-router/testing-library";
import { Text } from "react-native";
import DevSettingsScreen, {
  faultFor,
  faultOptionFor,
  latencyFor,
  latencyOptionFor,
  practiceIdFor,
  practiceLabelFor,
  withFault,
} from "@/app/dev-settings";
import { useDevSettings } from "@/lib/devSettings";
import * as devWarn from "@/lib/devWarn";
import { TestProviders } from "@/test/providers";

function HomeProbe() {
  const { settings } = useDevSettings();
  return (
    <Text>{`home:${settings.practiceId}:${settings.latencyMs}:${settings.faults.config ?? "-"}:${settings.forceOffline}`}</Text>
  );
}

function renderDevSettings(client = new QueryClient()) {
  return renderRouter(
    { index: HomeProbe, "dev-settings": DevSettingsScreen },
    {
      initialUrl: "/dev-settings",
      wrapper: ({ children }) => <TestProviders client={client}>{children}</TestProviders>,
    },
  );
}

describe("helpers", () => {
  test("latency options round-trip", () => {
    expect(latencyFor(latencyOptionFor(null))).toBeNull();
    expect(latencyFor(latencyOptionFor(0))).toBe(0);
    expect(latencyFor(latencyOptionFor(5000))).toBe(5000);
    expect(latencyOptionFor(1234)).toBe("Default");
  });

  test("fault options round-trip", () => {
    expect(faultFor(faultOptionFor(undefined))).toBeUndefined();
    expect(faultFor(faultOptionFor("network"))).toBe("network");
    expect(faultFor(faultOptionFor("server"))).toBe("server");
    expect(faultFor(faultOptionFor("timeout"))).toBe("timeout");
  });

  test("withFault sets and clears one request's fault without mutating", () => {
    const faults = { config: "server" } as const;

    const set = withFault(faults, "upload", "timeout");
    const cleared = withFault(set, "config", undefined);

    expect(set).toEqual({ config: "server", upload: "timeout" });
    expect(cleared).toEqual({ upload: "timeout" });
    expect(faults).toEqual({ config: "server" });
  });

  test("practice labels round-trip and unknown labels fall back to the default practice", () => {
    expect(practiceIdFor(practiceLabelFor("prc-0873"))).toBe("prc-0873");
    expect(practiceIdFor("nonsense")).toBe("prc-0421");
  });
});

describe("Developer settings screen", () => {
  afterEach(() => jest.restoreAllMocks());

  test("applies the chosen practice, latency, fault and offline flag, clears the cache and goes home", async () => {
    const client = new QueryClient();
    const clear = jest.spyOn(client, "clear");
    const user = userEvent.setup();
    renderDevSettings(client);

    await user.press(screen.getByRole("radio", { name: practiceLabelFor("prc-0873") }));
    await user.press(screen.getByRole("radio", { name: "Slow (5 seconds)" }));
    await user.press(screen.getAllByRole("radio", { name: "Server" })[0]);
    await user.press(screen.getByRole("switch", { name: "Force offline" }));
    await user.press(screen.getByRole("button", { name: "Apply and go home" }));

    await waitFor(() => expect(screen).toHavePathname("/"));
    expect(screen.getByText("home:prc-0873:5000:server:true")).toBeOnTheScreen();
    expect(clear).toHaveBeenCalled();
  });

  test("redirects home outside development", async () => {
    jest.spyOn(devWarn, "isDevelopmentBuild").mockReturnValue(false);
    renderDevSettings();

    await waitFor(() => expect(screen).toHavePathname("/"));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/__tests__/app/dev-settings.test.tsx`
Expected: FAIL (the placeholder exports none of the helpers).

- [ ] **Step 3: Write the screen**

`src/app/dev-settings.tsx`:

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text } from "react-native";
import { REQUEST_NAMES, type FaultKind, type Faults, type RequestName } from "@/api/fake/fakeTransport";
import { FIXTURE_PRACTICE_IDS } from "@/api/fake/fixtures";
import { ChoiceGroup } from "@/components/ChoiceGroup";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { DEFAULT_PRACTICE_ID, useDevSettings, type DevSettings } from "@/lib/devSettings";
import { isDevelopmentBuild } from "@/lib/devWarn";
import { text } from "@/theme/text";
import { MIN_TOUCH, spacing } from "@/theme/tokens";

const LATENCY_OPTIONS = ["Default", "None", "Slow (5 seconds)"] as const;
const FAULT_OPTIONS = ["None", "Network", "Server", "Timeout"] as const;
const SLOW_LATENCY_MS = 5000;

type LatencyOption = (typeof LATENCY_OPTIONS)[number];
type FaultOption = (typeof FAULT_OPTIONS)[number];

const PRACTICE_LABELS: Record<string, string> = {
  "prc-0421": "prc-0421: three recipients, two questions",
  "prc-0873": "prc-0873: two recipients, no questions",
  "prc-0000": "prc-0000: no recipients, no questions",
};

const REQUEST_LABELS: Record<RequestName, string> = {
  config: "Practice config",
  careTeam: "Care team",
  create: "Create message",
  upload: "Upload photo",
};

// Keyed by string because ChoiceGroup reports the chosen label as a plain string.
const LATENCY_BY_OPTION: Record<string, number | null> = { Default: null, None: 0, "Slow (5 seconds)": SLOW_LATENCY_MS };
const FAULT_BY_OPTION: Record<string, FaultKind | undefined> = {
  None: undefined,
  Network: "network",
  Server: "server",
  Timeout: "timeout",
};

export function practiceLabelFor(practiceId: string): string {
  return PRACTICE_LABELS[practiceId] ?? practiceId;
}

export function practiceIdFor(label: string): string {
  return FIXTURE_PRACTICE_IDS.find((id) => PRACTICE_LABELS[id] === label) ?? DEFAULT_PRACTICE_ID;
}

export function latencyOptionFor(latencyMs: number | null): LatencyOption {
  if (latencyMs === 0) return "None";
  if (latencyMs === SLOW_LATENCY_MS) return "Slow (5 seconds)";
  return "Default";
}

export function latencyFor(option: string): number | null {
  return LATENCY_BY_OPTION[option] ?? null;
}

export function faultOptionFor(kind: FaultKind | undefined): FaultOption {
  return FAULT_OPTIONS.find((option) => FAULT_BY_OPTION[option] === kind) ?? "None";
}

export function faultFor(option: string): FaultKind | undefined {
  return FAULT_BY_OPTION[option];
}

export function withFault(faults: Faults, name: RequestName, kind: FaultKind | undefined): Faults {
  const { [name]: _removed, ...rest } = faults;
  return kind ? { ...rest, [name]: kind } : rest;
}

// The whole row toggles, so the target is 48 points tall even though the native switch is smaller.
function OfflineToggle({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Force offline"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.row}
    >
      <Text style={text.body}>Force offline</Text>
      <Switch value={value} onValueChange={onChange} accessible={false} importantForAccessibility="no-hide-descendants" />
    </Pressable>
  );
}

export default function DevSettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings, apply } = useDevSettings();
  const [next, setNext] = useState<DevSettings>(settings);

  if (!isDevelopmentBuild()) return <Redirect href="/" />;

  // Applying clears the cache so the next entry into the flow fetches fresh for the chosen practice.
  function onApply() {
    apply(next);
    queryClient.clear();
    router.dismissTo("/");
  }

  return (
    <ScreenScaffold action={<PrimaryButton label="Apply and go home" onPress={onApply} />}>
      <Text accessibilityRole="header" style={text.title}>
        Developer settings
      </Text>
      <Text style={text.body}>Development builds only. Applying clears cached practice data and returns home.</Text>
      <ChoiceGroup
        label="Practice"
        options={FIXTURE_PRACTICE_IDS.map(practiceLabelFor)}
        value={practiceLabelFor(next.practiceId)}
        onChange={(label) => setNext({ ...next, practiceId: practiceIdFor(label) })}
      />
      <ChoiceGroup
        label="Latency"
        options={LATENCY_OPTIONS}
        value={latencyOptionFor(next.latencyMs)}
        onChange={(option) => setNext({ ...next, latencyMs: latencyFor(option) })}
      />
      {REQUEST_NAMES.map((name) => (
        <ChoiceGroup
          key={name}
          label={`Fail: ${REQUEST_LABELS[name]}`}
          options={FAULT_OPTIONS}
          value={faultOptionFor(next.faults[name])}
          onChange={(option) => setNext({ ...next, faults: withFault(next.faults, name, faultFor(option)) })}
        />
      ))}
      <OfflineToggle value={next.forceOffline} onChange={(value) => setNext({ ...next, forceOffline: value })} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/__tests__/app/dev-settings.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 5: Scoped verify**

```bash
npx jest src/__tests__/app
npm run typecheck
npm run lint
```

Expected: all exit 0.

---

### Task 21: Dependency, configuration and asset cleanup, and the agent guidance files

**T021** · **Visual:** none — configuration and deletions; `npx expo config` validating the app config is the evidence.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `app.json`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Delete: `assets/images/favicon.png`, `assets/images/expo-badge.png`, `assets/images/expo-badge-white.png`, `assets/images/expo-logo.png`, `assets/images/logo-glow.png`, `assets/images/react-logo.png`, `assets/images/react-logo@2x.png`, `assets/images/react-logo@3x.png`, `assets/images/tutorial-web.png`, `assets/images/tabIcons/explore.png`, `assets/images/tabIcons/explore@2x.png`, `assets/images/tabIcons/explore@3x.png`, `assets/images/tabIcons/home.png`, `assets/images/tabIcons/home@2x.png`, `assets/images/tabIcons/home@3x.png`

**Interfaces:**
- Consumes: nothing new.
- Produces: a dependency list with nothing the app does not import; an app config with light appearance and the image-picker plugin; agent guidance that matches the code.

- [ ] **Step 1: Remove what the app never imports**

Run from the repo root:

```bash
npm uninstall expo-font react-native-web react-dom react-native-gesture-handler react-native-reanimated react-native-worklets
```

Then delete the `"web": "expo start --web"` script from `package.json`. Keep `expo-constants` and `expo-linking` (required peers of expo-router) and `expo-device` (source of `isDevice`). `expo-font` and `expo-file-system` remain installed as dependencies of `expo` itself, which is fine.

- [ ] **Step 2: Update the app config**

In `app.json`: set `"userInterfaceStyle": "light"`; delete the whole `"web"` object; add the image-picker plugin entry to `plugins` after the splash-screen entry:

```json
[
  "expo-image-picker",
  {
    "photosPermission": "Allow $(PRODUCT_NAME) to use your photos so you can add a photo to your message.",
    "cameraPermission": "Allow $(PRODUCT_NAME) to use the camera so you can add a photo to your message.",
    "microphonePermission": false
  }
]
```

These strings take effect in a real build; Expo Go shows its own prompts.

- [ ] **Step 3: Delete the unused template images**

Delete exactly the files listed in the Files block. Keep `assets/images/icon.png`, `assets/images/splash-icon.png`, `assets/images/android-icon-foreground.png`, `assets/images/android-icon-background.png`, `assets/images/android-icon-monochrome.png` and everything under `assets/expo.icon/`, all of which `app.json` references. Run `grep -rn "assets/" app.json src` afterwards and confirm every referenced path still exists.

- [ ] **Step 4: Rewrite the agent guidance**

`AGENTS.md`:

```markdown
# Working in this repository

Read the versioned Expo docs at https://docs.expo.dev/versions/v57.0.0/ before writing code; this app targets SDK 57 and must run in Expo Go from a clean clone, so only packages pinned in `node_modules/expo/bundledNativeModules.json` or pure JavaScript may be added.

## Shape

- `src/api`: contracts (zod), the `Transport` interface, the in-process fake, and the four typed services. The real client is described in `DECISIONS.md`; nothing here does HTTP.
- `src/features/econsult`: the draft reducer, validation, step model and the send path. Sending is two calls: create the e-consult, then upload the photo; a failed upload is a partial outcome the patient sees, never a reason to create the message again.
- `src/lib`: query client, network state, announcements, `devWarn` and `isDevelopmentBuild`, ids, developer settings, photo processing.
- `src/components`: small accessible building blocks; `src/app`: expo-router screens that compose them.
- Screen tests live under `src/__tests__/app/`: every `.tsx` under `src/app` is a route, so no test may sit there.

## Rules

- Every interactive element: accessible name, at least 48 by 48 points, `allowFontScaling` never disabled.
- Errors are folded into the field's accessible name and announced once.
- Reads: offline-first with one retry; the send mutation runs in `always` mode with no retry and a 15 second timeout.
- Return new objects; keep functions under 50 lines; no `any`; validate at the boundary with zod.
- Tests sit next to the code as `*.test.ts(x)` (screens excepted, see above) and query by role and label; a `View` gets `accessible` only when it groups text alone. `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check` must pass.
- `npm run typecheck` regenerates the typed routes before `tsc`.
```

`CLAUDE.md` stays exactly `@AGENTS.md`.

- [ ] **Step 5: Verify**

Run each as its own command:

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npx expo config --type public
```

Expected: all exit 0; the last prints the resolved app config with `userInterfaceStyle: 'light'`, no `web` key, and three plugins.

---

### Task 22: README, DECISIONS.md and AI-USAGE.md

**T022** · **Visual:** none — documents.

**Files:**
- Modify: `README.md`
- Create: `DECISIONS.md`
- Create: `AI-USAGE.md`

**Interfaces:**
- Consumes: the finished app.
- Produces: the three hand-in documents. They must match the code as built; where the code differs from the plan (an amendment, a task that stopped), the documents follow the code.

- [ ] **Step 1: Write the README**

`README.md` covers, in this order, with real commands: what the app is (one sentence); requirements (Node 20 or later, Expo Go on a phone or the iOS simulator via Xcode); run from a clean clone (`npm install`, `npx expo start`, press `i` for the iOS simulator or scan the QR code with Expo Go); the fake backend and how to reach every state (the developer settings link on the home screen, the three practices, latency, faults, force offline; the `.env` seeds `EXPO_PUBLIC_PRACTICE_ID`, `EXPO_PUBLIC_LATENCY_MS`, `EXPO_PUBLIC_FAULTS` with the `request:kind` format and that a change needs a full app reload); quality commands (`npm test`, `npm run test:coverage`, `npm run lint`, `npm run typecheck`, `npm run format`); the source layout (one line per top-level folder under `src`, including where screen tests live and why); accessibility notes (what to check with VoiceOver, the largest text size, the Accessibility Inspector); the platform statement (run on the iOS simulator; what to check on Android: the back gesture on the confirmation screen, TalkBack live regions, the virtual scene camera, edge-to-edge insets); and a pointer to `DECISIONS.md`, `AI-USAGE.md` and `specs/001-econsult-flow/` for the design record and the research.

- [ ] **Step 2: Write DECISIONS.md**

About one page, headed sections in this order:

1. **Assumptions** — the patient is signed in and their practice id arrives with the session (faked in `src/lib/devSettings.tsx`); the practice inbox can derive a preview from the first line of the message, so no subject is asked; the brief's English sample data sets the app's language; reviewers run it in Expo Go.
2. **The four decisions that matter most**, each with the alternative rejected and why: three steps plus a confirmation instead of a wizard or one long form; the contract changes (typed question union with coercion, recipient roles, subject removed, idempotency key, attachment endpoint shape) and the runtime fact behind the attachment note (Expo's `fetch` rejects the React Native `{ uri }` form-data part, so a real client uploads through expo-file-system's upload task; the timeout helper decides on its own aborted signal rather than the error's shape, because Expo's `fetch` surfaces an abort as a `FetchError` or an `AbortError` depending on timing); the in-process fake behind a `Transport` interface instead of msw or a local server; downscaling the photo at pick time with expo-image-manipulator. Add the two behaviours worth defending in the interview: offline-first reads with a fail-fast send, and the partial-failure confirmation with a safe retry.
3. **What was traded away** — no draft persistence across restarts, no upload progress, no recovery of an Android camera capture after the activity is killed, one photo at a time (the pick buttons stay hidden while a photo is preparing; Remove is the way to start over), no HTTP transport shipped, the developer panel's single latency override instead of per-request values, and the developer panel's toggle row meeting the 48-point rule through its row rather than the native switch.
4. **What was deliberately left out**, in the brief's own terms, and anything cut from the plan (per the delivery order in the spec).
5. **Platform** — run on the iOS simulator with Expo Go; the camera path can only be verified on a real device; what to check on Android (the list above).
6. **With another two weeks** — draft persistence and resume, the real transport with progress, Dutch copy with VoiceOver pronunciation and TalkBack testing on an emulator, an inbox for the reply, Detox-style end-to-end coverage on both platforms.

- [ ] **Step 3: Write AI-USAGE.md**

About half a page, truthful to how this repository was actually produced, headed:

1. **Tools** — Claude Code with a human-gated implementation flow: read-only research agents whose claims were adversarially checked against the versioned Expo and React Native sources, a spec checker and a plan checker over as many rounds as `specs/001-econsult-flow/checker/` records (five for the spec; count the plan reports in that folder), one implementer agent per plan task under test-first rules, and a UI-verification agent driving the iOS simulator. The human decided the design questions recorded in `DECISIONS.md` and approved the spec and the plan.
2. **What AI got wrong and how it was caught** — the research agent recommended uploading the photo with React Native's classic `{ uri, name, type }` form-data part; the verifying agent opened Expo's `fetch` implementation and found it throws on exactly that part on SDK 57, which changed the contract note and the transport design. A second example: the first plan put the screen tests next to the screens under `src/app`; the plan checker traced expo-router's route context and showed the dev build would have required the test files at start-up and crashed, so the tests moved to `src/__tests__/app`.
3. **Where AI output was rejected** — the first plan for the confirmation screen's leave guard would have blocked the Done button through the nested navigator; verified in the vendored navigation source and redesigned before any code was written.
4. **What was deliberately not delegated** — the product judgement calls (three steps, no subject field, English copy, coverage tiers, what to cut), the final review of every document, and the screen recording.

- [ ] **Step 4: Verify**

```bash
npm run format:check
npm run lint
```

Expected: both exit 0 (the documents are prettier-formatted markdown).

---

## Requirement coverage

| Spec requirement | Tasks |
|---|---|
| AC1 choose who to write to | T008, T013, T016 |
| AC2 answer the practice's questions first | T008, T009, T013, T017 |
| AC3 write the question in own words | T009, T013, T018 |
| AC4 add a photo from camera or library, see it, remove it (also while preparing) | T011, T014, T018 |
| AC5 clear confirmation | T019 |
| AC6 screen reader and large text | T005 (announce), T012, T013, T014, T016 to T020 |
| Contract changes, idempotency header name | T002, T003, T004 |
| Loading, empty, config error, care team error states | T008, T013, T016 |
| Sending state and create failure | T010, T012, T018 |
| Partial failure and attachment retry | T007, T010, T018, T019 |
| Offline: banner, disabled send, query manager | T005, T012, T018 |
| Practice switching, faults, latency, offline toggle | T003, T006, T020 |
| Idempotent create | T003, T004, T007, T010, T018 |
| Photo bounded to 1600 px JPEG 0.7, preparing window, zero-dimension guard | T007, T011, T014, T018 |
| Exactly one writable recipient preselected | T016 |
| Leave guards and Done unwind, Android back on the confirmation | T007, T016, T019 |
| Keyboard and safe areas | T012 |
| Tooling, pins, coverage tiers, hoist-safe mocks, `__DEV__` in one helper, `Platform.OS` branches | T001, T005, T012, T015, T020 |
| Screen tests outside the route directory; preset drafts through the test flow layout | T006, T015 to T020 |
| Cleanup: dependencies, web block, assets, app config | T021 |
| README, DECISIONS.md, AI-USAGE.md, platform statement | T022 |

## Self-review notes

- Type consistency checked across tasks: `DraftPhoto`/`ReadyPhoto`/`AttachmentStatus` (T007) are what T014, T018, T019 use; `PhotoFile` (T003) is what T004, T010, T011 use; `RecipientsResult` (T008) is what `recipientNameFor` (T008), T016, T018, T019 read; `Services` (T004) is what T006, T008, T010 consume; `Requirement`, `accessibleName` and the `editable` prop (T013) are what T017 and T018 rely on; `Focusable` (T005) is what T017 and T019 pass; `IDEMPOTENCY_HEADER` (T002) is what T003 and T004 import; `isDevelopmentBuild` (T005) is what T015 and T020 branch on.
- Shared helpers precede their consumers: `src/test/providers.tsx` (T006) before the first hook test that needs providers (T008); `src/test/flowLayout.tsx` (T015) before the first screen test with a preset draft (T016); `recipientNameFor` (T008) before T018 and T019.
- Role queries target only accessibility elements: alerts are `accessible` Views around text only (OfflineBanner, ErrorState, the confirmation's warning box); the choice group is found by label; radios, buttons, headers and progress bars are host elements or `accessible` Views.
- Every task's verify block runs jest scoped to its folder plus `typecheck` and `lint`; T001, T021 and T022 also run `format:check`; the full coverage run happens in the flow's finish phase.
- Reuse: no task creates a helper the platform or an earlier task already provides; the components task is the single owner of button, field and status primitives.

## Amendments

- 2026-09-12, during T006 — the committed `.env` seed file could not be written: the user's Claude permission settings deny every `.env*` path, for the implementer and the lead alike. Decision (user, at the T006 stop): ship a template instead. T006 now also creates `env.example` at the repo root with the same three `EXPO_PUBLIC_*` variables and a one-line comment per variable; `.env` stays optional (the app's defaults equal the template's values), and T022's README tells a reviewer to `cp env.example .env` to change the seeds. T006's file fence gains `env.example`.
- 2026-09-12, during T008 — `testClient()` in `src/test/providers.tsx` (T006) kept TanStack Query's default five-minute `gcTime`, so every test that mounts a query left a timer that held the jest process open ("Jest did not exit one second after the test run has completed"). Lead decision (test hygiene, no product impact): T008's fence gains `src/test/providers.tsx`; `testClient()` sets `gcTime: 0`, and the two hook tests drop the local client workaround they had added.
- 2026-09-12, during T010 — the same five-minute hang for mutations: `testClient()` set `gcTime: 0` for queries only, so every settled mutation left TanStack Query's default 300 s mutation garbage-collection timer holding jest open. Lead decision (test hygiene, no product impact): T010's fence gains `src/test/providers.tsx`; `testClient()` also sets `mutations: { gcTime: 0 }`, and `useSubmit.test.tsx` drops its local client override.
- 2026-09-12, during T016 — the simulator preview at the largest accessibility text size showed the header-left "Home" label clipped: the native navigation bar keeps a fixed height while the label scaled. Lead decision (platform-consistent, reversible): `TextButton` gains an optional `maxFontSizeMultiplier` prop, `src/theme/tokens.ts` gains `HEADER_BUTTON_MAX_FONT_SCALE`, and the recipient screen's header button uses it, mirroring iOS's own cap on bar-button text; the spec's large-text rule (line 170) is amended to name navigation-bar buttons as the second permitted cap. The same preview noted the Continue button's "Choose who you are writing to first" hint stays on after a recipient is chosen; it is now passed only while the button is disabled. T016's fence gains `src/components/TextButton.tsx` and `src/theme/tokens.ts`.
- 2026-09-12, during T017 — the simulator preview found two accessibility defects in the questions step: (1) at the largest text size the required-answer error renders above the viewport and nothing scrolls to it, so an invalid Continue looks like a no-op; (2) on iOS a `View` with `accessibilityRole="radiogroup"` but no `accessible` prop is not an accessibility element, so the error folded into the group's label reaches no screen reader (Testing Library's label query hid this because it does not gate on `accessible`). Lead decision: `ScreenScaffold` exposes a `useScrollToField()` hook (context over its scroll view) that scrolls a field's node into view; the questions screen calls it on the first invalid field before announcing and focusing, and T018's message screen must do the same for the message field; `ChoiceGroup` folds the error into the accessible label of its question-label `Text` (an element on both platforms) and moves screen-reader focus there, keeping the group container's label for Android. T017's fence gains `src/components/ScreenScaffold.tsx`, `src/components/ScreenScaffold.test.tsx`, `src/components/ChoiceGroup.tsx` and `src/components/ChoiceGroup.test.tsx`. The heading's unbounded scaling (breaking mid-word at the largest size) is accepted: the spec caps scaling only on the chip and bar buttons.
- 2026-09-12, during T017 (re-checks) — two follow-ups from the simulator re-checks of the fix above. (1) Under Expo 57's New Architecture, `measureLayout` returns early unless its reference is an element (`ReactNativeElement`), so measuring against the numeric handle from `getInnerViewNode()` never scrolled; `scrollFieldIntoView` now measures against the inner view element from `getInnerViewRef()`, typed locally because that method is missing from React Native's `ScrollView` types, and the scaffold test pins that the numeric-handle path is not used. (2) With the scroll working, the label lands at the top of the viewport but `ChoiceGroup` rendered its error after the radio options, which alone exceed the viewport at the largest text size, so label and error were never visible together. Lead decision: `ChoiceGroup` renders the error directly under the question label, before the options, so a scrolled-to label always shows its error; `TextField` keeps its error under the input, which is short. No fence change.
