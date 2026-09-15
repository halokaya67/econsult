agent_id: a94a3f144e2a21c3e
mode: final · round: 3 (closing) · reviewed head: bfe019d · base: f39fb58 · previous rounds: final-r1 (checker/final-r1.md), final-r2 (checker/final-r2.md), spec-r1..r5, plan-r1..r3 · dispatched in the foreground (recorded as completed in flow-dispatches.jsonl)

## Spec-Checker Report — mode: final (round 3, closing)

> **Since then.** This closing round read the change at `bfe019d`. What it records that no longer holds:
>
> - The diff it measured — 133 files over 28 commits, 41 test files and 268 tests — stands at 432 files over 40 commits at `b1fb557`, across 53 test files.
> - Its file-length figures moved with the code: at `b1fb557` the longest non-test file is 221 lines (`src/app/econsult/message.tsx`) and the longest test 418 (`src/__tests__/app/econsult/message.test.tsx`), left over the plan's 400-line cap by choice.
> - `ui-verification/` was empty when this was written; it now holds four lanes, and the Accessibility Inspector audit is recorded on the phone lane.
> - W6 is closed, and I6's Discard path was driven twice — on the phone lane and on the real Samsung tablet.
> - I5's four findings are resolved; three of the paths it cites no longer exist, and `dev-settings.tsx` exports only its screen, importing the option tables from `src/features/devSettings/utils/options.ts`.
> - I8's round count is settled: all three final reports are committed, and AI-USAGE.md records three rounds.
> - I9's intermittent `act(...)` warning belongs to `src/features/econsult/hooks/useSubmit.test.tsx`, and it did not reproduce on a fresh run of that file.
> - The prior-flag table's line anchors have moved: the send lock sits later in `message.tsx`, and the photo picker moved into the feature.

**Verdict:** PASS_WITH_FLAGS

**Reviewed:** 120/133 files (cumulative over rounds 1–3; this round re-read in full the four files `bfe019d` touched — `src/app/econsult/message.tsx`, `src/__tests__/app/econsult/message.test.tsx`, `src/components/PhotoPicker.tsx`, `AI-USAGE.md` — plus `src/features/econsult/useSubmit.test.tsx`, `src/app/econsult/recipient.tsx:92-104`, `spec.md:105,140-141,203`, `README.md:113,131-135`) · `base: f39fb58 · head: bfe019d` · `133 files changed, 34806 insertions(+), 2294 deletions(-)` (28 commits; the one since round 2, `bfe019d`, read in full via `git show`) · canon cited: `rules/workflow.md` (size caps, explicit errors, testing bar), `rules/comments.md`, `rules/javascript.md`, repo `AGENTS.md` (functions under 50 lines) · Sourcegraph not configured: local tree only · verify evidence read: `verify/finish-6/` → format clean, typecheck clean, lint clean, coverage 41 suites / 268 tests, All files 100/100/100/100; `finish-6/jest.log` 18 suites / 103 tests for `__tests__/app` + `components` · decisions log (57 lines): `grep -in dismiss` → 1 (T001 C1/C3/C4, none in scope) · `verify_fix_commit` → 3, all read (line 57 records `bfe019d` as the "second and last fix round") · searches: `git diff --name-only` → 133 · `git status --porcelain` → 2 untracked (`checker/final-r1.md`, `checker/final-r2.md`) · `router.(replace|dismissTo|back|push)|navigation.dispatch` non-test → 12 sites, exactly one REPLACE dispatcher (`message.tsx:131`) and one re-dispatch (`:275`) · docs grep `lock|in flight|while sending` → `AI-USAGE.md:10-11` only · TODO/FIXME/console/debugger non-test → 1 (`src/lib/devWarn.ts:8`, the designated `console.warn` helper) · `any` → 0 · catch sites non-test → 6, each acts (`message.tsx:132` drops the status line, `sent.tsx:50` announces, `submit.ts:42` rethrows non-API errors, `PhotoPicker.tsx:162` warns + note, `photo.ts:44` warns + returns original, `transport.ts:43` rethrows) · files over 800 lines → 0 (max non-test 317 `message.tsx`, max test 329) · brace-matched function-length scan over 46 non-test files → 0 over 50 (nearest the cap: `DevSettingsScreen` 48, `QuestionsScreen` 48, `RecipientScreen` 48, `PhotoPicker` 47) · inline comment blocks over 2 sentences → 0 · `allowFontScaling` → 0; `maxFontSizeMultiplier` → none added by `bfe019d` · `Accessibility Inspector` in `ui-verification/*` → 0 files; no `finish` UI-verify directory exists yet · `not wrapped in act` across `verify/*` → finish-2, finish-3, finish-4b, finish-6 (absent finish-1, finish-4a, finish-5) · node_modules facts: `expo-router/build/react-navigation/core/useOnPreventRemove.js:44-79` (`:67` adds the route key to `VISITED_ROUTE_KEYS` before the screen's listener runs at `:68-73`; `:58-61` skips it on re-entry), `core/useNavigationCache.js:101-105` (`{ source: route.key, ...action }` — the spread keeps the symbol-keyed visited set and the action's `target`), `core/useOnAction.js:67-79`, `global-state/getNavigationAction.js:33-41,91` (`target: navigationState.key`, the lowest navigator), `expo-router/react-navigation.js` → `./build/react-navigation` and `build/useNavigation.js:7` → `./react-navigation/native` (both hooks share the vendored context) · 4 probe runs of `message.test.tsx` from a scratchpad copy of the tree with `node_modules` symlinked (nothing written to the repo; `git status` unchanged afterwards), detailed under W8

**Files:** the same 133-file list as round 1 (`checker/final-r1.md`) plus `src/test/handled.ts`; `bfe019d` touched only `AI-USAGE.md`, `src/__tests__/app/econsult/message.test.tsx`, `src/app/econsult/message.tsx`, `src/components/PhotoPicker.tsx` (`git show --stat`). The same 13 files NOT REVIEWED in full: `package-lock.json`; `specs/001-econsult-flow/artifacts/{how-it-works,plan,research,spec}.html`; `checker/spec-r1..r4.md`; `checker/plan-r1..r2.md`; `plan.md` (read in part); `research.md` (headers).

Locations below are relative to the repository root.

### Prior flags

| Prior flag | Status | Evidence |
|------------|--------|----------|
| W1 — navigation live while sending | RESOLVED (r2) | unchanged at head: `message.tsx:274-276` lock, Change `:287`, picker `:291`; `message.test.tsx:182-196` |
| W2 — announcement per scaffold | RESOLVED (r2) | unchanged: `network.tsx`, `ScreenScaffold.tsx` not in `bfe019d` |
| W3 — `pick()` swallowed failures | RESOLVED (r2) | `PhotoPicker.tsx:147-166` try/catch intact after the W9 extraction |
| W4 — `RecipientScreen` 70 lines | RESOLVED (r2) | scan: `RecipientScreen` 48 lines at head |
| W5 — three-sentence comment | RESOLVED (r2) | scan: 0 blocks over 2 sentences |
| W6 — SC3 Accessibility Inspector evidence | DEFERRED to finish:ui-verify (still open) | `spec.md:203` names the audit; `README.md:113` tells reviewers to run it; grep → 0 reports mention it. The UI stage must drive: Xcode > Open Developer Tool > Accessibility Inspector > Audit on Home, step 1 (loaded and empty), step 2, step 3 (pristine and with the error shown), Sent (partial variant), Developer settings; record the result per screen — or amend SC3 and DECISIONS.md to name the accessibility-tree dump as the audit |
| W7 — partial review | STILL OPEN (restated below) | 13 files, none touched by `bfe019d` |
| W8 — lock survives its own `router.replace` by ordering | RESOLVED | `message.tsx:274-276` `usePreventRemove(isSending, ({ data }) => { if (data.action.type === "REPLACE") navigation.dispatch(data.action); })` — the re-dispatched action carries the visited set with the message key already added (`useOnPreventRemove.js:67` runs before `:68-73`), so the second pass skips it at `:58-61` and `useOnAction.js:79` sets state. Comment `:272-273` now states the real guarantee ("A replace is re-dispatched instead, so reaching the confirmation never depends on which render the lock is read from") and the old "can never land on top of" sentence is gone. Test `message.test.tsx:198-210` read in full: arranges a pushed screen at `SEND_LATENCY_MS = 120` (`:66-68`), presses Send, acts `router.replace("/econsult/sent")`, asserts pathname synchronously and then the `SentProbe` reading `econsultId` from the still-mounted provider. Discriminating by probe: (A) bare lock `() => {}` → this test is the only failure of 17, at `:208` with `Received: "/econsult/message"`; (C) current fix with `router.replace` moved ahead of the `attachmentSettled` dispatch (`:130-131` swapped) → 17/17 green, which is the ordering independence the comment promises; (D) bare lock + swapped order → the same single failure; (E) real code in the copy → 17/17. Note for the record: in (D) the 120 ms `router.back()` test at `:182-196` still passed, so under jest the real screen's `onSuccess` updates (`:105-108`) also batch the lock down — round 2's blocking case was a minimal screen; the fix makes the question moot by construction |
| W9 — `PhotoPicker` 60 lines | RESOLVED | `PhotoPicker.tsx:113-134` `SourceButtons` (22 lines), `PhotoPicker` `:136-182` = 47 lines (brace-matched scan); `disabled` still reaches both buttons and the camera-unavailable note branch is unchanged. `PhotoPicker.test.tsx` not touched (queries by role and label: `:55-56,65,68,73`) and PASS in `finish-6/jest.log` |
| I1 — dead `reset`, unused `FixturePracticeId` | RESOLVED (r2) | unchanged |
| I2 — `handled()` copied thrice | RESOLVED (r2) | unchanged |
| I3 — camera denial shows library copy | RESOLVED (r2) | `PhotoPicker.tsx:106` |
| I4 — Retry not disabled offline | RESOLVED (r2) | `message.tsx:253` |
| I5 — structure | DEFERRED (separate restructuring pass, still open) | all four unchanged at head: `src/lib/devSettings.tsx:10-11` imports `@/api/fake/*`, `:26` `PATIENT`, `:77` `ServicesContext`, `:113-117` `useServices`/`useSession`; `src/components/PhotoPicker.tsx:6` imports the feature's `DraftPhoto`; `src/app/dev-settings.tsx` exports 7 functions; `recipients.ts:3` ↔ `useRecipients.ts:5` type-only cycle |
| I6 — Home → Discard driven only via `router.back()` | DEFERRED to finish:ui-verify (still open) | `recipient.tsx:95-103` unchanged. Drive: step 1 → Continue → type a message on step 3 → Change (back to step 1) → header Home → Discard → expect Home. No code change expected |
| I7 — AI-USAGE checker record stops at the plan | RESOLVED | `AI-USAGE.md:9-12` now records the final review ("ran two rounds … fixed in one commit: the navigation lock while sending, a single offline announcement and the photo-picker error path, then making that lock timing-independent"), accurate for `8ecfbb7` and `bfe019d`. Follow-on in I8: the count turns stale once this round's report is archived, and `final-r1.md`/`final-r2.md` are still untracked |

### Requirement coverage (compact; changes since round 2 noted)

| Ids | Status |
|---|---|
| U1 U2 U3 U4 | met |
| A1–A10 | met |
| C1–C6 | met |
| B1 B2 | met |
| S1 S2 S3 S5 | met |
| S4 | met — changed: the W8 condition is gone; the lock holds back/Change/Home and re-dispatches its own REPLACE, proven order-independent by probes A/C/D and `message.test.tsx:182-210` |
| E1–E13, E15–E26 | met |
| E14 | met — I6 deferred to ui-verify, unchanged |
| P1 P2 | met |
| SC1 SC2 SC4 SC5 SC6 SC8 | met |
| SC7 | met — now on `finish-6`: 268 tests, 100 % everywhere (one intermittent `act` warning in `useSubmit.test.tsx`, I9, pre-existing) |
| SC3 | partially met — W6 deferred to ui-verify, unchanged |
| OOS | respected |
| Docs | met — I7 resolved; I8 notes the round count |

Plan compliance for `bfe019d`: the four files belong to T018 (message screen), T014 (PhotoPicker) and T022 (docs); no unplanned file, no new export, no new dependency.

### Fix-delta regression review of `bfe019d` (no flags)

Checked and clean: the callback re-dispatches only `REPLACE`, and the only REPLACE dispatcher in `src` is the send's own `message.tsx:131` (every other navigation is push, back, `dismissTo` = `POP_TO`), so back, swipe, hardware back and the step-1 Home button are still held (`message.test.tsx:192-194`); `useNavigation` from `expo-router` and `usePreventRemove` from `expo-router/react-navigation` resolve to the same vendored core; synchronous re-dispatch from inside `shouldPreventRemove` is the same pattern as `useDiscardGuard` (`recipient.tsx:95-103`), only without the Alert in between; the `SourceButtons` extraction keeps the `Device.isDevice` branch and passes `disabled` to both buttons; `SEND_LATENCY_MS` replaces the literal 50 in the existing lock test (`:185`) and the new test (`:200`), leaving the two "moves to the confirmation" tests at 0 ms as before; the `AI-USAGE.md` sentence is factual for both fix commits. Scans over `src/` after the commit: 0 TODO/console/debugger (outside `devWarn`), 0 `any`, 0 empty catch, 0 functions over 50 lines, 0 comments over two sentences, 0 files over 800 lines.

| ID | Severity | Category | Location | Finding |
|----|----------|----------|----------|---------|
| W6 | WARNING | tests | `specs/001-econsult-flow/spec.md:203` | SC3's Accessibility Inspector audit still has no recorded evidence — deferred to finish:ui-verify (restated) |
| W7 | WARNING | coverage | 13 `NOT REVIEWED` files above | Partial review of generated/rendered/prior-round artifacts (unchanged) |
| I5 | INFO | consistency | four locations above | Structure items for the restructuring pass (unchanged) |
| I6 | INFO | regression | `src/app/econsult/recipient.tsx:95-103` | Home → Discard path to be driven once in finish:ui-verify (restated) |
| I8 | INFO | consistency | `AI-USAGE.md:9`; `git status` | "ran two rounds" is off by one once this report is archived; `checker/final-r1.md` and `final-r2.md` are still untracked |
| I9 | INFO | tests | `src/features/econsult/useSubmit.test.tsx:24-26,51-53` | Intermittent "not wrapped in act(...)" from TanStack's deferred notification; pre-dates the fix commits (finish-2, -3, -4b, -6) |

### W6 — SC3's Accessibility Inspector audit has no evidence (restated)
- **Severity:** WARNING
- **Category:** tests
- **Location:** `specs/001-econsult-flow/spec.md:203`; `README.md:113`
- **Finding:** Unchanged since round 1: no report under `ui-verification/` mentions the audit (grep → 0), and no finish UI-verify run exists yet.
- **Why:** A measurable success criterion the spec itself named is unrecorded; the README promises reviewers it reports no issues.
- **Suggested fix:** in finish:ui-verify, run the Xcode Accessibility Inspector audit on Home, step 1 (loaded and empty), step 2, step 3 (pristine and with the error shown), Sent (partial variant) and Developer settings; record the per-screen result. If it cannot be driven, amend SC3 to name the accessibility-tree dump as the audit and say so in DECISIONS.md.
- **Needs user:** no

### W7 — Partial review of thirteen artifact files (restated)
- **Severity:** WARNING
- **Category:** coverage
- **Location:** `package-lock.json`; `specs/001-econsult-flow/artifacts/*.html` (4); `checker/spec-r1..r4.md`, `checker/plan-r1..r2.md` (6); `plan.md` (read in part); `research.md` (headers)
- **Finding:** Same set as rounds 1 and 2; `bfe019d` touched none of them.
- **Suggested fix:** none required for merge.
- **Needs user:** no

### I5 — Structure observations (unchanged, for the restructuring pass)
- **Severity:** INFO
- **Category:** consistency
- **Location:** `src/lib/devSettings.tsx:10-11,26,77,113-117`; `src/components/PhotoPicker.tsx:6`; `src/app/dev-settings.tsx` (7 exported helpers); `src/features/econsult/recipients.ts:3` ↔ `useRecipients.ts:5`
- **Suggested fix:** as in `checker/final-r1.md`, Structure section.
- **Needs user:** no

### I6 — Home → Discard path, driven only via `router.back()` (restated)
- **Severity:** INFO
- **Category:** regression
- **Location:** `src/app/econsult/recipient.tsx:95-103`
- **Suggested fix:** one drive in finish:ui-verify: step 1 → Continue → type a message on step 3 → Change → header Home → Discard → expect Home. No code change expected.
- **Needs user:** no

### I8 — The final-review sentence will read "two rounds" beside three reports
- **Severity:** INFO
- **Category:** consistency
- **Location:** `AI-USAGE.md:9-12`; `README.md:133-134` points readers at `checker/`
- **Finding:** The I7 fix is accurate for what exists in git today, but this closing round becomes the third final report, and `final-r1.md`/`final-r2.md` are still `??` in `git status`. Once the three reports are committed, the record shows three final rounds against a sentence that says two. Can ride with the archival commit; no separate loop.
- **Suggested fix:**
  ```md
  The final implementation review then ran three rounds over the
  whole diff; the findings of the first two were each fixed in one commit — the navigation lock while
  sending, a single offline announcement and the photo-picker error path, then making that lock
  timing-independent — and the third verified those fixes.
  ```
  Commit `checker/final-r1.md`, `final-r2.md` and this report in the same change.
- **Needs user:** no

### I9 — Intermittent `act(...)` warning from `useSubmit.test.tsx`
- **Severity:** INFO
- **Category:** tests
- **Location:** `src/features/econsult/useSubmit.test.tsx:24-26` and `:51-53`
- **Finding:** `finish-6/coverage.log:13-37`: "An update to HookContainer inside a test was not wrapped in act(...)", stack through `notifyManager.ts:42` (`Timeout._onTimeout`) → `forceStoreRerender`. `mutateAsync` resolves before TanStack's `setTimeout(0)` notification, so the `await act(async () => { … await mutateAsync … })` scope can close before the observer re-renders. It appears in finish-2, finish-3, finish-4b and finish-6 but not finish-1, finish-4a or finish-5, and the file last changed in `a2498d1` (T010), so `bfe019d` did not introduce it. Rounds 1 and 2 read the coverage summary of those logs, not the console block — that is why it was not raised before. Tests pass; this is noise that could mask a real act warning later.
- **Suggested fix:** absorb the notification inside an act-wrapped wait, in both `mutateAsync` tests:
  ```tsx
  await act(async () => {
    outcome = await result.current.mutateAsync(INPUT);
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  ```
  (and `expect(result.current.isSuccess).toBe(true)` after the `useRetryAttachment` call). No behaviour change; 268 tests stay as they are.
- **Needs user:** no

**Possibly dismissed:** none — the log's only structured dismissals (T001-C1 `jest.setup.ts:1`, T001-C3 coverage script, T001-C4 `expo-env.d.ts`) do not overlap any finding above.

**Summary:** Round 2's three fixes are all genuinely in the code: the send lock now re-dispatches its own REPLACE and the new test is discriminating in the strict sense (it is the only test that fails when the lock is reverted to the bare shape, in either line order, and the fix stays green with the `replace`/`dispatch` order swapped), `PhotoPicker` is at 47 lines with no test churn, and the AI-USAGE sentence is truthful. Nothing in `bfe019d` regressed a caller and every scan is clean, so no fix loop opens; what remains is for finish:ui-verify to drive the Accessibility Inspector audit (W6) and the Home → Discard path (I6), plus two INFO notes that can travel with the archival commit (the "two rounds" count, I8) or a later pass (the pre-existing `act` warning in `useSubmit.test.tsx`, I9). Done well: the mid-send `router.replace` test is small, behaviour-named and pins exactly the mechanism the comment claims.
