agent_id: af89073e3dea56438
mode: plan · round: 3 · reviewed: plan.md revision 3 (working tree) · previous rounds: checker/plan-r1.md, checker/plan-r2.md · dispatched in the foreground (recorded as completed in flow-dispatches.jsonl)

## Spec-Checker Report — mode: plan

**Verdict:** FAIL

**Reviewed:** 4/4 artifact files (plan.md revision 3, 6907 lines in full, working tree; spec.md 216 lines, working tree; how-it-works.md 112 lines; checker/plan-r2.md; research.md not re-read — revision 3 touches no platform fact) · diff: n/a (mode plan) · canon cited: workflow.md (Coding Canon: size caps, DRY, Testing bar) · decisions log: 1 entry (spec-gate approval), `dismiss` → 0 · Sourcegraph not configured, local tree only; standalone take-home repo, no cross-repo consumers · searches:
- plan.md: `^### Task` → 22; `TBD|TODO|similar to Task` → 0; `git commit|git add` → 0; `If .* then|fall back` → 1 (T001 BLOCKED clause only); `STEP_TITLES` inside the recipient.test block (:5345-5469) → 1 use, 0 imports of `@/features/econsult/steps`; `prc-9999/care-team` → 0; `questionSchema.safeParse("` → 0; `color: colors.muted, fontSize: fontSize.body, lineHeight: lineHeight.body` → 4 (:3750 shared `text.muted`, :4480, :4634, :6209)
- tsc 6.0.3 full-tree probe (scratchpad `tscheck3`): every file-bearing code block extracted from the plan (86 `src/` files + `jest.setup.ts`), repo `tsconfig.json` with `@/*` → the scratch `src`, `types: ["jest"]`, `preserveSymlinks`, ambient stubs only for expo-network/expo-crypto (installed nowhere), a typed-routes overlay with the six routes → **4 errors in 2 files** (C1, C2 below); everything else compiles, including all four round-2 fixes, `QuestionField`'s `fieldRef: (node: Focusable | null) => void` against `Ref<View>`/`Ref<TextInput>` (RN 0.86.3 `View.d.ts:22`, `Text.d.ts:227`, `TextInput.d.ts:1053` extend `Constructor<HostInstance>`, and `Focusable` = `HostInstance`, `AccessibilityInfo.d.ts:174`), `firstProblem(field: TextInput | null)`, `SendFeedback` `error: Error | null`, the `useRetryAttachment` spy cast, the `Record<string, …>` lookups, `jest.spyOn(ImagePicker, "useMediaLibraryPermissions")`, `jest.mocked(manipulate(…))`, and `interface Matchers<R>` against @types/jest's `Matchers<R, T = {}>`
- brace-depth function scan over the extracted tree: longest are `useSend` 48, `SentScreen` 47, `DevSettingsScreen` 46, `RecipientScreen` 45, `createFakeTransport` 43, `PhotoPicker` 41; no file over 300 lines
- istanbul-lib-instrument 6.0.3 (fetched to scratchpad): `src/visitor.js:537-548` `coverIfBranches` opens an `if` branch with a consequent counter, so an `if` without `else` still has an untaken arm; `:586-600` `coverLogicalExpression` → `binary-expr` with one counter per leaf (`??` is a Babel `LogicalExpression`)
- babel-preset-expo 57 `build/index.js:24` `isReactCompilerEnabled = api.caller(getReactCompiler)` → off under babel-jest (no caller flag); jest-expo 57.0.5 `resolveBabelOptions.js:44-60` passes the preset with no options → the `jest.spyOn` calls on module functions and hooks (T015, T016, T019, T020) hit plain CJS data exports
- rev 2.1 backup (scratchpad `plan-rev2.1.bak.md`): `const ready = {…} as const` at :2623 (pre-existing, C2); `STEP_TITLES` absent from the rev-2.1 recipient test (C1 is new in revision 3)
- test counts recounted for every "Expected: PASS, N tests" in T002–T020: all match (fakeTransport 17, T008 21, sent 6, errorCopy+message 14, and the unchanged files)

| Prior flag | Status | Evidence |
|------------|--------|----------|
| C1 — self-referential `mockContext` | RESOLVED | plan.md:224-228 typed `{ resize: jest.Mock; renderAsync: jest.Mock; release: jest.Mock }`; compiles in the probe |
| C2 — `userEvent` from `expo-router/testing-library` | RESOLVED | plan.md:5057, :5345, :5621, :5860, :6248, :6462 import it from `@testing-library/react-native`; compiles |
| C3 — `toHavePathname` untyped | RESOLVED | plan.md:5041 Files, :50 File Structure, :5279-5291 ambient `declare namespace jest`; all 19 assertions compile |
| C4 — un-mocked context in the T011 failure test | RESOLVED | plan.md:3544-3545 `jest.mocked(manipulate(ORIGINAL.uri))` + `mockRejectedValueOnce`; compiles |
| W1 — six uncovered branches | RESOLVED | plan.md:1029-1044 two fake-transport tests (count 17 at :1188), :2699-2709 care-team retry test (count 21 at :2936); the six named branches are now reached (but see new W1) |
| W2 — no radio group | RESOLVED | plan.md:5512 `accessibilityRole="radiogroup"` + label, no `accessible`, `styles.list` at :5583; :5387 asserts the label (but see new C1) |
| W3 — functions over 50 lines | RESOLVED | scan: longest 48 (`useSend` :6078-6125); `firstProblem`/`SendButton`/`ToRow`/`SendFeedback` :6069-6163, `MessageScreen` 40 lines :6165-6204; `PreparingPhoto`/`ReadyPhoto` :4937-4959; `create` hoisted :1128; `QuestionField` :5748; `useDiscardGuard` :5526 |
| W4 — text styles copied six times | RESOLVED | plan.md:3743-3752 `src/theme/text.ts` (:3670 Files, :63 File Structure, :3694 interface); `text.*` used at :4125, :4673-4690, :4942-4988, :5223-5226, :6402-6417, :6673-6676; index.tsx no longer imports `StyleSheet` (:5194) |
| I1 — `resizeTargetFor` signature | RESOLVED | plan.md:3493 ends `\| null;` |
| I2 — hard-coded round counts | RESOLVED | plan.md:6855 "as many rounds as `checker/` records (five for the spec; count the plan reports…)"; :5 header names rounds 4, 5 and plan round 2 |
| I3 — five vs four members | RESOLVED | spec.md:62 "four members with roles, one of them not writable" |
| I4 — new `QueryClient` per render; screen warnings | RESOLVED | plan.md:2136 `useState(testClient)`; :5272 `<Stack … />` with no `Stack.Screen`, comment at :5265-5267 |
| I5 — denied-permission mock outlives the test | RESOLVED | plan.md:4832-4834 `jest.spyOn(ImagePicker, "useMediaLibraryPermissions")` |
| I6 — retry success unobservable | RESOLVED | plan.md:6322-6332 "a successful retry confirms the photo" (spy on the namespace import, `mutateAsync` args, attached text); count 6 at :6430 |
| I7 — narrowing casts | RESOLVED | plan.md:6601-6607 `Record<string, …>`, :6623 `latencyFor(option: string)`, :6631 `faultFor(option: string)`; no casts remain |

Fix-delta regression review: the T003 `create` hoist keeps the shared `nextId`/`Map`/`Set` semantics every transport test asserts; the T014 split preserves the preparing live region, Remove-while-preparing, the labelled preview and the disabled state; the T016 radiogroup is a container (no `accessible`), so the cards stay individually queryable radios and RNTL's label query needs no `accessible` gate (round-2 evidence); the T017 `QuestionField` keeps focus landing on the first radio / the input; the T018 split keeps validate → announce → focus, the sending/sent status line, the same idempotency key on Retry, read-only field and disabled picker while pending; the shared `text` styles change no asserted style. One regression found (C1).

Coverage matrix (spec → tasks): unchanged from round 2 and complete (plan.md:6871-6895); tasks → spec orphans: none; TDD order, exact `Files:` paths, `T###` ids, no commit steps all hold. Remaining gap: SC7's 100 % thresholds on `src/api` (new W1).

| ID | Severity | Category | Location | Finding |
|----|----------|----------|----------|---------|
| C1 | CRITICAL | tests | plan.md:5387 (T016 `recipient.test.tsx`) | `STEP_TITLES` is used but never imported: `ReferenceError` in jest and TS2304 in `npm run typecheck` — T016's verify fails on both |
| C2 | CRITICAL | tests | plan.md:2643 (T008 `recipients.test.ts`) | `as const` makes `questions: readonly []`, not assignable to `RecipientsResult` → TS2345 at :2646, :2650, :2651; T008's `npm run typecheck` fails |
| W1 | WARNING | tests | plan.md:470 (`contracts.ts`), :1163 (`fakeTransport.ts`); thresholds :158-161 | One statement and two branches in `src/api` no test reaches; the 100 % thresholds fail `npm run test:coverage` (SC7) |
| I1 | INFO | reuse | plan.md:4480, :4634, :6209 | Three local styles are byte-identical to the new `text.muted` |
| I2 | INFO | consistency | plan.md:4952 vs :2371 | `PhotoPicker.tsx` declares a component `ReadyPhoto` with the same name as the exported `ReadyPhoto` draft type |

### C1 — `STEP_TITLES` used without an import in the recipient screen test
- **Severity:** CRITICAL
- **Category:** tests
- **Location:** plan.md:5387 (`src/__tests__/app/econsult/recipient.test.tsx`; imports at :5345-5355)
- **Finding:** The W2 fix added `expect(screen.getByLabelText(STEP_TITLES.recipient)).toBeOnTheScreen();` to the first test, but the file's import list has no `import { STEP_TITLES } from "@/features/econsult/steps";`. Probe: `recipient.test.tsx(43,34): error TS2304: Cannot find name 'STEP_TITLES'`; at runtime the first test throws `ReferenceError: STEP_TITLES is not defined` (eslint will not catch it: `no-undef` is off for TS in eslint-config-expo). Introduced by revision 3 — absent from the rev-2.1 backup — so no earlier round could have seen it.
- **Why:** T016 Step 4 ("PASS, 8 tests") and Step 5 (`npm run typecheck`) both go red; the implementer is told the test file is the contract.
- **Suggested fix:**
  ```tsx
  import { initialDraft, type DraftState } from "@/features/econsult/draft";
  import { STEP_TITLES } from "@/features/econsult/steps";
  import * as useRecipientsModule from "@/features/econsult/useRecipients";
  ```
- **Needs user:** no

### C2 — `as const` in the `recipientNameFor` tests does not type-check
- **Severity:** CRITICAL
- **Category:** tests
- **Location:** plan.md:2643 (`src/features/econsult/recipients.test.ts`), errors at :2646, :2650, :2651
- **Finding:** `const ready = { status: "ready", recipients: TEAM, questions: [] } as const;` gives `questions` the type `readonly []`, which is not assignable to `Question[]` in `RecipientsResult`; tsc 6.0.3 reports TS2345 three times ("The type 'readonly []' is 'readonly' and cannot be assigned to the mutable type …"). Dropping `as const` would instead widen `status` to `string` and fail the discriminant. Round 2 missed it because its probes compiled targeted snippets (setup, screens, hooks, services), never T008's test file; the line is unchanged from rev 2.1 (backup :2623, moved there by the round-1 W6 fix).
- **Why:** T008 Step 5 (`npm run typecheck`) fails; every later task's verify inherits it until someone edits outside their fence.
- **Suggested fix:** (probe compiled)
  ```ts
  import type { RecipientsResult } from "./useRecipients";
  // …
  const ready: RecipientsResult = { status: "ready", recipients: TEAM, questions: [] };
  ```
- **Needs user:** no

### W1 — Two `src/api` branches and one statement still uncovered; the 100 % thresholds fail
- **Severity:** WARNING
- **Category:** tests
- **Location:** plan.md:470 (`contracts.ts` `if (typeof input !== "object" || input === null || !("type" in input)) return input;`), :1163 (`fakeTransport.ts` `rawCareTeams[team[1]] ?? Promise.reject(notFound("Practice"))`); thresholds :158-161
- **Finding:** Every question a test feeds `questionSchema` is an object with a `type`, so the guard's consequent (`return input;` — a separate statement and the `if`'s taken arm, istanbul `coverIfBranches` `visitor.js:537-548`) never executes; and the only unknown-practice test (:916-923) hits `/econsult-config`, so the care-team `??` right leaf (`coverLogicalExpression` `:586-600`, one counter per leaf) is never evaluated. Neither is reached by any later suite (fixture practices only; `parsePracticeId` rejects unknown ids). `./src/api/` demands 100 % statements and branches, so `npm run test:coverage` exits non-zero in the finish phase — the same failure class as round 2's W1, which walked the helpers and `combineRecipients` but not `getJson`'s second arm or the contracts preprocess guard.
- **Why:** SC7 is unattainable as planned and surfaces only at the end of the flow.
- **Suggested fix:** T002 `contracts.test.ts`, inside `describe("questionSchema")` (Step 4 count → 11):
  ```ts
  test("rejects a question that is not an object or has no type", () => {
    expect(questionSchema.safeParse("q-duration").success).toBe(false);
    expect(questionSchema.safeParse({ id: "q1", label: "x", required: true }).success).toBe(false);
  });
  ```
  T003 `fakeTransport.test.ts` (Step 8 count → 18):
  ```ts
  test("an unknown practice's care team is a 404 server error", async () => {
    const transport = createFakeTransport({ latencyMs: 0 });

    const pending = transport.getJson("/practices/prc-9999/care-team", signal());
    await jest.advanceTimersByTimeAsync(0);

    await expect(pending).rejects.toMatchObject({ kind: "server", status: 404 });
  });
  ```
- **Needs user:** no

### I1 — `text.muted` still rebuilt locally in three files
- **Severity:** INFO
- **Category:** reuse
- **Location:** plan.md:4480 (`TextField` `styles.hint`), :4634 (`RecipientCard` `styles.role`), :6209 (`message.tsx` `styles.nudge`)
- **Finding:** All three are character-for-character `{ color: colors.muted, fontSize: fontSize.body, lineHeight: lineHeight.body }`, i.e. the `text.muted` the W4 fix created at :3750. W4 named six other sites, so these fell outside its fix.
- **Why:** Canon DRY; the type-scale change W4 centralised still has three stragglers.
- **Suggested fix:** `style={text.muted}` at the three usages and delete the local entries (add `import { text } from "@/theme/text";` to TextField and RecipientCard).
- **Needs user:** no

### I2 — Component `ReadyPhoto` shadows the exported `ReadyPhoto` type by name
- **Severity:** INFO
- **Category:** consistency
- **Location:** plan.md:4952 (`function ReadyPhoto` in `PhotoPicker.tsx`) vs :2371 (`export type ReadyPhoto` in `draft.ts`)
- **Finding:** `PhotoPicker.tsx` already imports from `@/features/econsult/draft`; a later `import { type ReadyPhoto }` there would collide with the local component. Compiles today.
- **Why:** Naming clarity across tasks (T007 type vs T014 view).
- **Suggested fix:** rename the two views `PreparingPhotoView` / `ReadyPhotoView` (and the two call sites at :4979-4980).
- **Needs user:** no

**Possibly dismissed:** none

**Summary:** Every round-2 flag is genuinely fixed and the full-tree type probe now compiles 85 of the 87 extracted plan files, including all of revision 3's refactors, whose behaviour matches what their tests assert. Two type-check failures remain and would stop an implementer at a gate: fix C1 first (a one-line import the W2 fix forgot, breaking T016's tests and typecheck), then C2 (a pre-existing `as const` in T008's test that earlier rounds never compiled); then add the two `src/api` tests in W1 so the coverage thresholds hold at the finish. The reducer, transport, services, hooks, components and screens are otherwise consistent across tasks, every function is under 50 lines, and the test-environment facts (spy-only `restoreAllMocks`, CJS data exports without the React Compiler under jest, RN 0.86's host classes being `HostInstance`) all support the tests as written.
