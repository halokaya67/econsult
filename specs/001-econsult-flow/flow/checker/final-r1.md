agent_id: a03fef9c446e118f7
mode: final · reviewed head: a04aede · base: f39fb58 · previous rounds: spec-r1..r5, plan-r1..r3 · dispatched in the foreground (recorded as completed in flow-dispatches.jsonl)

## Spec-Checker Report — mode: final

> **Since then.** This round read the change at `a04aede`. The branch has moved on; what it records that no longer holds:
>
> - The diff it measured — 132 files over 25 commits, 41 test files and 261 tests — stands at 656 files over 66 commits on `main`, across 56 test files.
> - Twenty-one paths in its Files block are gone: `env.example`, `src/smoke.test.tsx`, `src/test/providers.tsx`, the `src/lib/{devSettings,network,photo,queryClient}` modules and the four `src/components` files that moved into the feature; the list also predates `src/app/+not-found.tsx`, `src/providers/`, `src/hooks/` and the four newer feature hooks.
> - The step 1 leave guard it cites in `recipient.tsx` is now `src/features/econsult/hooks/useDiscardGuard.ts`.
> - A8 certifies a mechanism that has since been replaced: the scaffold pads for the keyboard itself instead of adjusting insets.
> - U4's and A6's `env.example` and `.env` seeds no longer exist; the developer settings screen is the only knob.
> - A9's per-scaffold offline announcement was fixed in round 2: the network provider announces once per transition.
> - W2 to W5 are fixed, and two of the files they point at no longer exist.
> - SC3's missing Accessibility Inspector audit (W6) has since run on the phone lane: five states, zero warnings and zero duplicates each, against a positive control of 22.
> - I5's four ownership findings were carried out in the restructuring pass — to `src/providers/ServicesProvider.tsx`, `src/providers/DevSettingsProvider.tsx` and `src/hooks/useSession.ts`, with the option tables declared in `src/app/dev-settings.tsx` — and the `recipients.ts` / `useRecipients.ts` type cycle is gone.
> - `StatusViews.tsx` is three files now, and the offline banner copy lives in `src/lib/copy.ts`.
> - I6's untested Discard path was driven on the phone lane and again on the real Samsung tablet.

**Verdict:** PASS_WITH_FLAGS

**Reviewed:** 119/132 files · `base: f39fb58 · head: a04aede` · `132 files changed, 34591 insertions(+), 2294 deletions(-)` (25 commits) · canon cited: `rules/workflow.md` (Coding Canon: size caps, explicit errors, KISS/DRY, testing bar), `rules/comments.md` (≤ 2 sentences), `rules/javascript.md` (naming, 100 % on changed files), repo `AGENTS.md` (48 pt, error folding, offline-first reads / always-mode send, functions < 50 lines) · Sourcegraph not configured: local tree only · verify evidence read: `verify/finish-3/coverage.log` → All files 100/100/100/100, 41 suites, 261 tests; `typecheck.log`, `lint.log`, `format.log` present · UI evidence read: T016/T018/T019/T020 re-check reports (all PASS) · searches: `git diff f39fb58...HEAD --name-only` → 132 · `grep -in dismiss <decisions log>` → 1 line (T001-C1/C3/C4, none in this diff's scope) · `grep visual_defect_fix|visual_scope|step_auto_pass|verify_fix_commit` → 5 + 1 + 21 + 1, all read · `grep -rn 'TODO|FIXME|console.log|debugger' src` (non-test) → 0 · `grep -rn 'fetch(|createUploadTask|expo-file-system' src` → 0 (only `refetch()`), confirms DECISIONS.md:95-97 · `grep -rn allowFontScaling src` → 0; `maxFontSizeMultiplier` → 3 sites (chip, header Home, header Cancel) · comment-length scan over `src/**/*.ts(x)` (non-test) → 1 block > 2 sentences · function-length scan → 1 function > 50 lines · `FixturePracticeId` consumers → 0 · `"reset"` dispatches → 0 · `function handled<T>` → 3 test files · `Accessibility Inspector` in `ui-verification/*/report.md` → 0 · node_modules facts: `expo-router/build/react-navigation/core/useOnPreventRemove.js:43-67`, `expo-router/build/global-state/router.js:77-78`, `expo-router/build/getRoutesCore.js:655`, `react-native/src/private/webapis/dom/nodes/ReactNativeElement.js:177-190`, `expo/src/winter/fetch/convertFormData.ts:35,77`, `react-native/Libraries/Components/Switch/Switch.js:267`, `react-native/Libraries/Components/ScrollView/ScrollView.d.ts:891`, `AccessibilityInfo.d.ts:174`

**Files:** (relative to the repo root)
```
.gitignore
.prettierignore
.prettierrc
AGENTS.md
AI-USAGE.md
DECISIONS.md
README.md
app.json
assets/images/expo-badge-white.png            (deleted; matches T021 list)
assets/images/expo-badge.png                  (deleted)
assets/images/expo-logo.png                   (deleted)
assets/images/favicon.png                     (deleted)
assets/images/logo-glow.png                   (deleted)
assets/images/react-logo.png                  (deleted)
assets/images/react-logo@2x.png               (deleted)
assets/images/react-logo@3x.png               (deleted)
assets/images/tabIcons/explore.png            (deleted)
assets/images/tabIcons/explore@2x.png         (deleted)
assets/images/tabIcons/explore@3x.png         (deleted)
assets/images/tabIcons/home.png               (deleted)
assets/images/tabIcons/home@2x.png            (deleted)
assets/images/tabIcons/home@3x.png            (deleted)
assets/images/tutorial-web.png                (deleted)
env.example
eslint.config.js
jest.setup.ts
package-lock.json — NOT REVIEWED (generated; package.json verified against the base)
package.json
specs/001-econsult-flow/artifacts/how-it-works.html — NOT REVIEWED (rendered copy)
specs/001-econsult-flow/artifacts/plan.html — NOT REVIEWED (rendered copy)
specs/001-econsult-flow/artifacts/research.html — NOT REVIEWED (rendered copy)
specs/001-econsult-flow/artifacts/spec.html — NOT REVIEWED (rendered copy)
specs/001-econsult-flow/checker/plan-r1.md — NOT REVIEWED (verdict table only)
specs/001-econsult-flow/checker/plan-r2.md — NOT REVIEWED (verdict table only)
specs/001-econsult-flow/checker/plan-r3.md
specs/001-econsult-flow/checker/spec-r1.md — NOT REVIEWED (verdict table only)
specs/001-econsult-flow/checker/spec-r2.md — NOT REVIEWED (verdict table only)
specs/001-econsult-flow/checker/spec-r3.md — NOT REVIEWED (verdict table only)
specs/001-econsult-flow/checker/spec-r4.md — NOT REVIEWED (verdict table only)
specs/001-econsult-flow/checker/spec-r5.md
specs/001-econsult-flow/how-it-works.md
specs/001-econsult-flow/plan.md — NOT REVIEWED in full (read: header, file structure, reuse map, every Files fence, every checkbox step, T015–T022 headers, T021/T022 bodies, requirement coverage, self-review, all amendments)
specs/001-econsult-flow/research.md — NOT REVIEWED (headers only)
specs/001-econsult-flow/spec.md
src/__tests__/app/_layout.test.tsx
src/__tests__/app/dev-settings.test.tsx
src/__tests__/app/econsult/_layout.test.tsx
src/__tests__/app/econsult/message.test.tsx
src/__tests__/app/econsult/questions.test.tsx
src/__tests__/app/econsult/recipient.test.tsx
src/__tests__/app/econsult/sent.test.tsx
src/__tests__/app/index.test.tsx
src/api/contracts.test.ts
src/api/contracts.ts
src/api/fake/fakeTransport.test.ts
src/api/fake/fakeTransport.ts
src/api/fake/fixtures.test.ts
src/api/fake/fixtures.ts
src/api/services.test.ts
src/api/services.ts
src/api/transport.test.ts
src/api/transport.ts
src/app/_layout.tsx
src/app/dev-settings.tsx
src/app/econsult/_layout.tsx
src/app/econsult/message.tsx
src/app/econsult/questions.tsx
src/app/econsult/recipient.tsx
src/app/econsult/sent.tsx
src/app/index.tsx
src/components/ChoiceGroup.test.tsx
src/components/ChoiceGroup.tsx
src/components/OfflineBanner.test.tsx
src/components/OfflineBanner.tsx
src/components/PhotoPicker.test.tsx
src/components/PhotoPicker.tsx
src/components/PrimaryButton.test.tsx
src/components/PrimaryButton.tsx
src/components/RecipientCard.test.tsx
src/components/RecipientCard.tsx
src/components/ScreenScaffold.test.tsx
src/components/ScreenScaffold.tsx
src/components/StatusViews.test.tsx
src/components/StatusViews.tsx
src/components/StepHeader.test.tsx
src/components/StepHeader.tsx
src/components/TextButton.test.tsx
src/components/TextButton.tsx
src/components/TextField.test.tsx
src/components/TextField.tsx
src/features/econsult/DraftProvider.test.tsx
src/features/econsult/DraftProvider.tsx
src/features/econsult/draft.test.ts
src/features/econsult/draft.ts
src/features/econsult/errorCopy.test.ts
src/features/econsult/errorCopy.ts
src/features/econsult/queries.ts
src/features/econsult/recipients.test.ts
src/features/econsult/recipients.ts
src/features/econsult/steps.test.ts
src/features/econsult/steps.ts
src/features/econsult/submit.test.ts
src/features/econsult/submit.ts
src/features/econsult/useQuestions.test.tsx
src/features/econsult/useQuestions.ts
src/features/econsult/useRecipients.test.tsx
src/features/econsult/useRecipients.ts
src/features/econsult/useSubmit.test.tsx
src/features/econsult/useSubmit.ts
src/features/econsult/validation.test.ts
src/features/econsult/validation.ts
src/lib/announce.test.ts
src/lib/announce.ts
src/lib/devSettings.test.tsx
src/lib/devSettings.tsx
src/lib/devWarn.test.ts
src/lib/devWarn.ts
src/lib/ids.test.ts
src/lib/ids.ts
src/lib/network.test.tsx
src/lib/network.tsx
src/lib/photo.test.ts
src/lib/photo.ts
src/lib/queryClient.test.ts
src/lib/queryClient.ts
src/smoke.test.tsx
src/test/expo-router-matchers.d.ts
src/test/flowLayout.tsx
src/test/providers.tsx
src/theme/text.ts
src/theme/tokens.ts
tsconfig.json                                 (formatting-only diff)
```

### Runtime facts verified against node_modules (not recall)

| Claim in code/docs | Source | Result |
|---|---|---|
| Expo's `fetch` rejects the RN `{ uri, name, type }` form-data part (DECISIONS.md:27-30, AI-USAGE.md:16-21) | `expo/src/winter/fetch/convertFormData.ts:35` ("`uri` is not supported"), `:77` `throw new Error('Unsupported FormDataPart implementation')` | confirmed |
| `measureLayout` returns early unless the reference is an element (ScreenScaffold.tsx:25-27, DECISIONS.md:64-67) | `react-native/src/private/webapis/dom/nodes/ReactNativeElement.js:182-190` — `if (!(relativeToNativeNode instanceof ReactNativeElement)) { … return; }` | confirmed |
| `getInnerViewRef` missing from `ScrollView`'s types (ScreenScaffold.tsx:22-23) | `ScrollView.d.ts:891` declares only `getInnerViewNode(): any`; `ScrollView.js:142,870` implement `getInnerViewRef` | confirmed |
| iOS `Switch` composes `alignSelf: 'flex-start'` (dev-settings.tsx:96) | `Switch.js:267` `{alignSelf: 'flex-start' as const}` | confirmed |
| `unstable_settings.anchor` is honoured on expo-router 57 (econsult/_layout.tsx:5) | `expo-router/build/getRoutesCore.js:655` `loaded.unstable_settings.anchor ?? loaded.unstable_settings.initialRouteName` | confirmed |
| `usePreventRemove` + `navigation.dispatch(data.action)` works through the nested stack (recipient.tsx:60-65; implementer concern in decisions log line 55) | `expo-router/build/react-navigation/core/useOnPreventRemove.js:43-67`: the action carries a `VISITED_ROUTE_KEYS` set; the parent's `beforeRemoveListeners[route.key]?.(beforeRemoveAction)` hands the same set to the nested navigator, so the re-dispatched action skips the recipient key and the root pop proceeds. `router.js:77-78`: `dismissTo` = `linkTo(…, { event: 'POP_TO' })`, one action for both Home and back | confirmed by source; `recipient.test.tsx:153-166` drives Discard after `router.back()`, not after the header Home `dismissTo` — still worth one drive in finish:ui-verify (I6) |
| `Focusable` is `HostInstance` (announce.ts:3) | `AccessibilityInfo.d.ts:174-177` `sendAccessibilityEvent(handle: HostInstance, …)` | confirmed |

### Requirement coverage matrix

Paths relative to the repo root; "test" names the file and test title or line.

| # | Spec requirement (spec.md line) | Implementation | Test | Status |
|---|---|---|---|---|
| U1 | Ria: hear every label, error, confirmation (:22) | accessible names on every control (`PrimaryButton.tsx:27-30`, `TextButton.tsx:23-27`, `RecipientCard.tsx:13-15`, `ChoiceGroup.tsx:44-46`, `TextField.tsx:64`); errors folded + announced (`TextField.tsx:30-32`, `questions.tsx:98-101`, `message.tsx:56-61`); confirmation heading focus (`sent.tsx:108-110`) | role/label queries throughout; `questions.test:94-111`, `message.test:89-106`, `sent.test:51-62`; AX3XL simulator re-checks T016–T020 | met |
| U2 | Ahmed: never lose the message when the photo fails (:23) | `submit.ts:34-46,58-59` partial outcome; `sent.tsx:65-95` | `submit.test:59-69`, `message.test:185-195`, `sent.test:83-97` | met |
| U3 | prc-0873: step absent, counter honest (:24) | `steps.ts:12-26`, `recipient.tsx:72,91,112` | `recipient.test:90-99` ("Step 1 of 2"), `steps.test` | met |
| U4 | Reviewer switches practice / injects failures without editing code (:25) | `dev-settings.tsx`, `env.example`, `devSettings.tsx:28-72` | `dev-settings.test:93-124`, `devSettings.test` | met |
| A1 | Three steps + confirmation, counter "of 3"/"of 2" (:33) | `StepHeader.tsx`, `steps.ts` | `StepHeader.test`, `recipient.test:60,95` | met |
| A2 | Nested layout mounts DraftProvider; root hides header for group (:39, :70, :72) | `econsult/_layout.tsx:7-20`, `app/_layout.tsx:21` | `econsult/_layout.test`, `_layout.test` | met |
| A3 | `useQueries`+`combine`; reads offlineFirst retry 1/1000; mutation always/retry 0 (:40) | `useRecipients.ts:16-39`, `queryClient.ts:9-21`, `useSubmit.ts:10-23` | `useRecipients.test`, `queryClient.test`, `useSubmit.test:32-41` | met |
| A4 | zod at the boundary, malformed = error state (:41, :158) | `contracts.ts`, `services.ts:31-37` | `contracts.test`, `services.test:77-91` | met |
| A5 | `Transport` with `AbortSignal`, fake honours abort with `AbortError`; no HTTP shipped (:42) | `transport.ts:21-30`, `fakeTransport.ts:28-54`; grep `fetch(` → 0 | `fakeTransport.test:99-120,180-192` | met |
| A6 | `.env` seeds; dev screen; Apply clears cache and returns home (:43) | `devSettings.tsx:66-72`, `env.example`, `dev-settings.tsx:145-149` | `devSettings.test:29-76`, `dev-settings.test:93-108` | met (amended: `env.example` instead of a committed `.env`, user decision at T006) |
| A7 | Photo: quality 1, ≤ 1600 px, JPEG 0.7, release handles, "Preparing", failure keeps original + devWarn, expo-image preview, camera only on device (:44) | `PhotoPicker.tsx:26-30,60-87,126-134`, `photo.ts:5-50` | `photo.test`, `PhotoPicker.test:58-65,125-150` | met |
| A8 | Keyboard/safe areas: one ScrollView, button last child, persistTaps handled, adjust insets, bottom insets (:45) | `ScreenScaffold.tsx:55-76` | `ScreenScaffold.test:48-58,93-105` | met |
| A9 | Offline fail-open, banner in scaffold, Send disabled with reason, onlineManager wired (:46) | `network.tsx:8-27`, `ScreenScaffold.tsx:72`, `message.tsx:142-166` | `network.test`, `message.test:232-240` | met (announcement fires per mounted scaffold — W2) |
| A10 | English, light only, system font, tokens with 48-pt minimum (:47) | `app.json:9`, `tokens.ts:25-26` | `npx expo config` in T021 evidence | met |
| C1 | `Question` union, unknown type → text (:55) | `contracts.ts:10-36` | `contracts.test:45-55` | met |
| C2 | `CareTeamMember.role`, unknown → other (:56) | `contracts.ts:38-44` | `contracts.test:71-75` | met |
| C3 | `subject` removed (:57) | `contracts.ts:54-59` | `submit.test:31-38` | met |
| C4 | `Idempotency-Key` per draft, reused on retry; fake returns the original id (:58, SC8) | `contracts.ts:6`, `services.ts:55-66`, `draft.ts:65-66`, `message.tsx:122-123`, `fakeTransport.ts:62-72` | `fakeTransport.test:122-137`, `services.test:48-63`, `draft.test:109-115`, `message.test:212-230` | met |
| C5 | `POST /econsults/{id}/attachments`, timeout helper decides on its own signal (:59, :147) | `fakeTransport.ts:26,107-115`, `transport.ts:35-50` | `transport.test:35-66`, `services.test:102-114` | met |
| C6 | Three fixtures incl. prc-0000, four members with one not writable (:62) | `fixtures.ts` | `fixtures.test`, `recipient.test:59` | met |
| B1 | Affected-areas table (:68-83): every listed file exists; app.json light + picker plugin + no web; package.json adds/removes as listed; 15 assets deleted; referenced assets kept | diff + `ls assets` | T021 verify | met (`CLAUDE.md` unchanged by design, plan.md:6820) |
| B2 | Delivery order 1–5, nothing cut (:85-95) | commits `069cc8b` → `0d46de5` | DECISIONS.md:93-94 | met |
| S1 | Home greeting, one action, dev link, prefetch (:99) | `index.tsx:22-44` | `index.test` | met |
| S2 | Step 1 loading/loaded/error/empty, Continue disabled with hint, error even with stale data (:101) | `recipient.tsx:85-134`, `StatusViews.tsx`, `useRecipients.ts:15-25` | `recipient.test:49-134`, `useRecipients.test:31-42` | met |
| S3 | Step 2 skipped when none; "(required)/(optional)"; validate, tie, focus, announce (:103) | `questions.tsx:85-102`, `TextField.tsx:24-32`, `ChoiceGroup.tsx:26-37` | `questions.test` | met |
| S4 | Step 3 To/Change row via `dismissTo`; nudge; photo states; Send disabled while preparing; busy + read-only + status line; offline (:105) | `message.tsx:114-135,142-168,170-200,262`, `TextField.tsx:61`, `PhotoPicker.tsx:116-121` | `message.test:78-87,149-159,232-265`, `PhotoPicker.test:152-161` | met; Change and back stay live during the send (W1) |
| S5 | Sent: heading focus, texts, partial variant with Try again / Continue without, `usePreventRemove(!isLeaving)`, Done → `dismissTo('/')` (:107) | `sent.tsx:31-133` | `sent.test` (9 tests) | met |
| E1 | Exactly one recipient preselected (:113) | `recipient.tsx:73-82` | `recipient.test:101-113` | met |
| E2 | Zero writable → empty (:114) | `useRecipients.ts:28` | `useRecipients.test:104-110`, `recipient.test:125-134` | met |
| E3 | Absent recipient id dropped + devWarn (:115) | `recipients.ts:25-30` | `recipients.test:22-30` | met |
| E4 | Members not in `recipientIds` hidden (:116) | `recipients.ts:25` | `recipient.test:59` | met |
| E5 | Unknown type → text; choice < 2 options rejected (:118-119) | `contracts.ts:11-22` | `contracts.test:33-55` | met |
| E6 | Whitespace answers/messages invalid; < 20 chars nudge (:120-121) | `validation.ts` | `validation.test` | met |
| E7 | Picker cancelled → no change (:122) | `PhotoPicker.tsx:106` | `PhotoPicker.test:100-107` | met |
| E8 | Permission denied → explanation + Open Settings, other source stays (:123) | `PhotoPicker.tsx:103,140-147` | `PhotoPicker.test:109-123` | met (copy names "Photos" for a camera denial — I3) |
| E9 | Camera unavailable note (:124) | `PhotoPicker.tsx:126-134` | `PhotoPicker.test:58-65` | met |
| E10 | Pick/remove/pick: last wins; `pickId` supersede; Remove discards pending (:125-126) | `draft.ts:41-49,59-64` | `draft.test:60-107` | met |
| E11 | Preview fixed height, `cover`, never sized from w/h (:126) | `PhotoPicker.tsx:74-87,155-160` | `PhotoPicker.test:136-150` (10×10 asset; component reads no dimension) | met |
| E12 | Processing failure → ready with original + devWarn; 0 dimension skips downscale (:127-128) | `photo.ts:34-50` | `photo.test:49-72` | met |
| E13 | Draft lifecycle; key generated on first Send; econsultId kept; recipient change keeps answers; back keeps message/photo (:132-136) | `DraftProvider.tsx`, `draft.ts` | `draft.test:36-50,109-123`, `DraftProvider.test` | met |
| E14 | Step-1 leave guard `(hasMessage \|\| hasPhoto) && econsultId == null` (:140) | `draft.ts:88-90`, `recipient.tsx:58-66` | `draft.test:139-146`, `recipient.test:136-177` | met (Home-button Discard path verified by source, I6) |
| E15 | Confirmation cannot be left (:141) | `sent.tsx:106`, `econsult/_layout.tsx:16` | `sent.test:64-71` | met |
| E16 | Step counter + heading announced (:142) | `StepHeader.tsx:13-15` | `StepHeader.test` | met |
| E17 | Latency defaults (:146) | `fakeTransport.ts:12-17` | `fakeTransport.test:20-52` | met |
| E18 | Timeouts 15 s / 45 s via AbortController (:147) | `services.ts:16-17`, `transport.ts:39-40` | `services.test:93-114` | met |
| E19 | 48-pt targets, scaling never disabled, caps only chip + nav-bar buttons (:149, :170) | `tokens.ts:26-32`; grep → 0 `allowFontScaling`, 3 `maxFontSizeMultiplier` sites | `PrimaryButton.test:6-12`, `TextButton.test:6-16`, `ChoiceGroup.test:29-31` | met |
| E20 | `fontScale` from `useWindowDimensions` (:150) | `TextField.tsx:50` | `TextField.test:87-95` | met |
| E21 | Config/care-team failure → one error, retry refetches the failed one (:154) | `useRecipients.ts:17-25` | `useRecipients.test:31-54,88-102` | met |
| E22 | Create failure → inline error near Send, Retry same key (:155) | `message.tsx:216-242` | `message.test:197-230` | met |
| E23 | Create ok + upload fail → partial variant, retry keyed to id (:156) | `submit.ts:62-68`, `sent.tsx:38-54` | `sent.test:99-115` | met |
| E24 | Offline before Send disabled (:157) | `message.tsx:163` | `message.test:232-240` | met (Retry after a failed create not disabled offline — I4) |
| E25 | Query keys include practice id (:159) | `queries.ts:5-8` | `index.test:35-41` | met |
| E26 | Terminology (:163-165) | `recipients.ts:9-14`, copy constants | — | met ("e-consult" appears in README and DECISIONS, not on the confirmation screen; wording only) |
| P1 | Radio group around cards, fields never grouped, header roles (:169) | `recipient.tsx:40-44`, `StatusViews.tsx:39,66` | `recipient.test:56` | met |
| P2 | `gestureEnabled:false` + `usePreventRemove`; `keyboardDismissMode` per platform (:175) | `econsult/_layout.tsx:16`, `ScreenScaffold.tsx:61` | `ScreenScaffold.test:93-105` | met |
| SC1 | Both practices complete E2E on the simulator (:201) | — | T016–T020 UI reports; recording by hand | met per evidence |
| SC2 | Six ACs → behaviour-named tests (:202) | — | recipient/questions/message/PhotoPicker/sent tests | met |
| SC3 | Accessible names by role queries; 48 via `toHaveStyle`; Accessibility Inspector audit with zero errors (:203) | — | role queries everywhere; `toHaveStyle` in three component tests; **no report records an Accessibility Inspector audit** | partially met (W6) |
| SC4/SC5 | Largest-text and keyboard-open screenshots (:204-205) | — | T017/T018 reports | met |
| SC6 | Every state reachable from dev settings and tested (:206) | `dev-settings.tsx` | loading `recipient.test:49`; empty `:125`; config error `:115`; care-team error `useRecipients.test:96`; create error `message.test:197`; upload failure `:185`; offline `:232` | met |
| SC7 | Type-check, lint, format, tests; 100 % on api/features/lib; `Platform.OS` mocked; `__DEV__` in one helper (:207) | `devWarn.ts`, `package.json` thresholds | `verify/finish-3` all green, 100 % everywhere; `ScreenScaffold.test:93`; `devWarn.test:29-36` | met |
| SC8 | Never created twice on retry (:208) | `fakeTransport.ts:65-66`, `draft.ts:66` | `submit.test:83-90`, `message.test:212-230` | met |
| OOS | Out of scope list (:212) | grep: no fetch, no persistence, no i18n, no web | — | respected |
| Docs | README, DECISIONS.md, AI-USAGE.md exist and match the code (:18, :82) | all three read in full; every code claim checked (latency options, coverage tiers, Cancel button, no `fetch(`, no `expo-file-system`, five checker + three plan rounds, Android checklist) | — | met |

### Plan compliance (22 tasks + amendments)

| Task | Shipped | Notes |
|---|---|---|
| T001 tooling | ✓ all 7 files | `/// <reference types="jest" />` dismissed at the T001 stop; `test:coverage` now passes |
| T002–T005 api + lib | ✓ | four services (plan wording), matching tests |
| T006 dev settings + providers | ✓ | `.env` → `env.example` per amendment; `.env` git-ignored per T021 amendment |
| T007–T011 draft, queries, validation, submit, photo | ✓ | `gcTime: 0` amendments in `providers.tsx:21-25` |
| T012–T014 components | ✓ | `useScrollToField`, `containerRef`, `TextButton.maxFontSizeMultiplier`, `HEADER_BUTTON_MAX_FONT_SCALE` per amendments |
| T015 shell | ✓ | placeholders replaced by T016–T020; `unstable_settings.anchor` present |
| T016–T019 screens | ✓ | all amendments reflected (scroll-to-field, error under label, hint only while disabled, failed-retry line) |
| T020 dev settings screen | ✓ | Cancel header button, wrapping label, centred switch per amendment |
| T021 cleanup | ✓ | 6 packages + `web` script removed, 15 assets deleted, plugin added, `.gitignore` amendment |
| T022 docs | ✓ | three documents, lead-read |
| Shipped without a task/amendment | none found | every new symbol traced to a task or an amendment entry |
| Promised but absent | none found | |

| ID | Severity | Category | Location | Finding |
|----|----------|----------|----------|---------|
| W1 | WARNING | spec-compliance | `src/app/econsult/message.tsx:170-177, 260-263` | Change, native back and the step-1 Home button stay live while the send is in flight; the completion handler then navigates against whatever is on top |
| W2 | WARNING | react | `src/components/ScreenScaffold.tsx:41-48` | The offline/back-online announcement fires once per mounted scaffold (up to four in a native stack) instead of once per transition |
| W3 | WARNING | standards | `src/components/PhotoPicker.tsx:100-114` | `pick()` has no error path: a rejected `launch*Async` or permission request becomes an unhandled rejection with no feedback |
| W4 | WARNING | standards | `src/app/econsult/recipient.tsx:68-137` | `RecipientScreen` is 70 lines against the 50-line cap |
| W5 | WARNING | standards | `src/components/ChoiceGroup.tsx:18-21` | Inline comment is three sentences |
| W6 | WARNING | tests | `specs/001-econsult-flow/spec.md:203` | SC3's Accessibility Inspector audit has no recorded evidence |
| W7 | WARNING | coverage | 13 `NOT REVIEWED` files above | Partial review of generated/rendered/prior-round artifacts |
| I1 | INFO | debt | `src/features/econsult/draft.ts:29,71-72`; `src/api/fake/fixtures.ts:5` | `reset` action never dispatched; `FixturePracticeId` exported and never imported |
| I2 | INFO | reuse | `src/api/transport.test.ts:5-8`, `fake/fakeTransport.test.ts:11-14`, `services.test.ts:11-14` | `handled()` copied three times |
| I3 | INFO | consistency | `src/components/PhotoPicker.tsx:19-20,103` | One denied-permission note ("Photos are switched off") for both camera and library |
| I4 | INFO | spec-compliance | `src/app/econsult/message.tsx:233-239` | Retry after a failed create is not disabled while offline, unlike Send |
| I5 | INFO | consistency | see Structure section | Four ownership misplacements for the restructuring pass |
| I6 | INFO | regression | `src/app/econsult/recipient.tsx:60-65` | Home → Discard path verified in the vendored navigation source but only the `router.back()` variant is tested/driven |

### W1 — Navigation is not locked while a send is in flight
- **Severity:** WARNING
- **Category:** spec-compliance
- **Location:** `src/app/econsult/message.tsx:170-177` (Change), `:244-268` (screen, no leave guard), `:126-130` (post-await navigation)
- **Finding:** spec.md:105 makes the fields read-only and the button busy while sending; `TextField.editable` and `PhotoPicker.disabled` honour that, but `ToRow`'s Change button, the nested header back arrow, swipe-back and step 1's Home button are all still enabled during `submit.isPending`. After the awaited `mutateAsync` resolves, `router.replace("/econsult/sent")` runs regardless of where the patient now is. Change mid-send pops to step 1 and the create then replaces step 1 with Sent (draft intact, so harmless); back mid-send lands Sent over the questions screen (harmless). The bad route is Home → "Discard" while the create is still pending on a slow link (up to 15 s): the dialog says "Your message and photo will be lost" (`recipient.tsx:25`), the group unmounts, the create still completes, the reducer dispatches go nowhere, and `router.replace` mounts a fresh `econsult/sent` over Home with `econsultId` null — "Sent to your practice", "Reference: " blank.
- **Why:** The spec's "fields read-only while sending" intent is only half applied; a patient on a weak connection (Ahmed, spec.md:23) taps back while waiting. Rare enough to stay WARNING, but the message is told "lost" while it has actually been sent.
- **Suggested fix:**
  ```tsx
  // message.tsx
  import { usePreventRemove } from "expo-router/react-navigation";

  function ToRow({ name, disabled, onChange }: { name: string; disabled: boolean; onChange: () => void }) {
    return (
      <View style={styles.toRow}>
        <Text style={styles.to}>To: {name}</Text>
        <TextButton label="Change" disabled={disabled} accessibilityHint={CHANGE_HINT} onPress={onChange} />
      </View>
    );
  }

  export default function MessageScreen() {
    …
    const send = useSend();
    const isSending = send.submit.isPending;
    // Back, swipe and the step-1 Home button wait for the send to settle; the busy button says why.
    usePreventRemove(isSending, () => {});
    …
        <ToRow name={…} disabled={isSending} onChange={() => router.dismissTo("/econsult/recipient")} />
  ```
  Add to `message.test.tsx`: "Change and going back are blocked while sending" (render with `settings: { latencyMs: 50 }`, press Send, assert `Change` has `disabled: true` and `router.back()` keeps `/econsult/message`).
- **Needs user:** no

### W2 — Offline announcement repeats once per mounted screen
- **Severity:** WARNING
- **Category:** react
- **Location:** `src/components/ScreenScaffold.tsx:41-48`
- **Finding:** The transition effect lives in `ScreenScaffold`, and a native stack keeps every pushed screen mounted, so on step 3 of prc-0421 four scaffolds (Home, recipient, questions, message) each run `announce(OFFLINE_MESSAGE)` when `useIsOffline()` flips. VoiceOver interrupts earlier announcements (one stuttered read); TalkBack queues them (four reads). `ScreenScaffold.test.tsx:61-91` renders one scaffold so it cannot see this. spec.md:176 asks for "a persistent banner announced on transition", singular.
- **Why:** Accessibility regression for exactly the audience the spec centres; canon `AGENTS.md` "announced once".
- **Suggested fix:** move the transition effect to the single `NetworkProvider` and keep the banner copy in `lib` so `lib` does not import from `components`:
  ```tsx
  // src/lib/network.tsx
  export const OFFLINE_MESSAGE = "You're offline. You can keep writing, but sending needs a connection.";
  export const BACK_ONLINE_MESSAGE = "You're back online.";

  export function NetworkProvider({ forceOffline, children }: Props) {
    const state = useNetworkState();
    const isOffline = isLinkDown(state.isConnected, forceOffline);
    const wasOffline = useRef(isOffline);

    useEffect(() => {
      onlineManager.setOnline(!isOffline);
      if (isOffline === wasOffline.current) return;
      wasOffline.current = isOffline;
      announce(isOffline ? OFFLINE_MESSAGE : BACK_ONLINE_MESSAGE);
    }, [isOffline]);
    …
  ```
  `OfflineBanner.tsx` imports `OFFLINE_MESSAGE` from `@/lib/network`; delete `ScreenScaffold.tsx:41,44-48` and the `announce`/`BACK_ONLINE_MESSAGE` imports; move the announcement assertions of `ScreenScaffold.test.tsx:61-91` to `network.test.tsx`.
- **Needs user:** no

### W3 — `pick()` swallows launcher and permission failures
- **Severity:** WARNING
- **Category:** standards
- **Location:** `src/components/PhotoPicker.tsx:100-114` (invoked as `void pick(…)` at `:130,138`)
- **Finding:** `ensureGranted` and `launch` can reject (`launchCameraAsync` throws when the camera cannot be opened; Android can kill the activity — spec.md:212 names that as out of scope for recovery, not for feedback). Nothing catches: the promise rejection goes unhandled, the draft is untouched, and the patient sees nothing happen. `processPhoto` itself is safe (`photo.ts:44-46`).
- **Why:** canon `workflow.md` "handle errors explicitly at every level, never swallow"; the patient-facing effect is a dead button.
- **Suggested fix:**
  ```tsx
  const PICK_FAILED_NOTE = "We couldn't open your photos just now. Please try again.";
  …
  const [note, setNote] = useState<"denied" | "failed" | null>(null);

  async function pick(source: Source) {
    try {
      const permission: Permission = source === "camera" ? [cameraStatus, requestCamera] : [libraryStatus, requestLibrary];
      if (!(await ensureGranted(permission))) return setNote("denied");
      setNote(null);
      const result = await launch(source);
      if (result.canceled) return;
      const asset = result.assets[0];
      const pickId = newId();
      onPickStarted(pickId);
      onPickReady(pickId, await processPhoto({ uri: asset.uri, width: asset.width, height: asset.height }));
    } catch (error) {
      devWarn(`Photo pick failed: ${String(error)}`);
      setNote("failed");
    }
  }
  ```
  Render `PERMISSION_DENIED_NOTE` + Open Settings for `"denied"` and `PICK_FAILED_NOTE` alone for `"failed"`; add a test with `launchImageLibraryAsync.mockRejectedValueOnce(new Error("busy"))` asserting the note and that `onPickStarted` was not called.
- **Needs user:** no

### W4 — `RecipientScreen` is 70 lines
- **Severity:** WARNING
- **Category:** standards
- **Location:** `src/app/econsult/recipient.tsx:68-137`
- **Finding:** The component body runs from `:68` to `:137` (70 lines, scan output above); the plan's global constraint (plan.md:23) and `AGENTS.md` say under 50, and plan-r2 W3 already trimmed this file once. The four-way status switch in the JSX (`:109-133`) plus the header button (`:97-107`) are the bulk.
- **Why:** canon size cap; the file is otherwise clean.
- **Suggested fix:**
  ```tsx
  function HomeHeaderButton({ onPress }: { onPress: () => void }) {
    return <TextButton label="Home" onPress={onPress} maxFontSizeMultiplier={HEADER_BUTTON_MAX_FONT_SCALE} />;
  }

  function RecipientBody({ result, selectedId, onSelect, goHome }: {
    result: RecipientsResult; selectedId: string | null; onSelect: (id: string) => void; goHome: () => void;
  }) {
    if (result.status === "loading") return <LoadingCards label={LOADING_LABEL} />;
    if (result.status === "error") return <ErrorState title={ERROR_TITLE} body={ERROR_BODY} onRetry={result.retry} />;
    if (result.status === "empty") {
      return <EmptyState title={EMPTY_TITLE} body={EMPTY_BODY} action={<TextButton label="Back to start" onPress={goHome} />} />;
    }
    return <RecipientList result={result} selectedId={selectedId} onSelect={onSelect} />;
  }
  ```
  `RecipientScreen` then keeps the hooks, the `StepHeader` guard and `<RecipientBody …/>` (about 40 lines).
- **Needs user:** no

### W5 — Three-sentence inline comment
- **Severity:** WARNING
- **Category:** standards
- **Location:** `src/components/ChoiceGroup.tsx:18-21`
- **Finding:** The only block in `src/` over the limit (scan → 1 hit). Canon `comments.md`: inline comments ≤ 2 sentences.
- **Suggested fix:**
  ```tsx
  // The group View carries role and name for TalkBack but is not `accessible`, which would swallow
  // its radios; iOS has no group element, so the label Text folds in the error and takes the ref.
  // The error sits between label and radios so it stays visible when a tall label is scrolled to.
  ```
  (two sentences: the second clause joined with a semicolon, the layout note kept as the second sentence — or move the layout note to the `error` JSX line.)
- **Needs user:** no

### W6 — SC3's Accessibility Inspector audit has no evidence
- **Severity:** WARNING
- **Category:** tests
- **Location:** `specs/001-econsult-flow/spec.md:203`; `README.md:113-114` tells the reviewer to run it
- **Finding:** SC3 names three verifications: role/label queries (done), `toHaveStyle` 48-pt checks (done in `PrimaryButton.test:11`, `TextButton.test:14`, `ChoiceGroup.test:29-31`), and "an Accessibility Inspector audit on the simulator with zero errors". No UI report under `ui-verification/` mentions the audit (grep → 0); the reports use accessibility-tree dumps, which are not the Xcode audit.
- **Why:** A success criterion the spec itself made measurable is unrecorded; the README promises the reviewer "it should report no issues".
- **Suggested fix:** in finish:ui-verify, run Xcode > Open Developer Tool > Accessibility Inspector > Audit on Home, step 1 (loaded and empty), step 2, step 3 (pristine and with the error), Sent (partial variant) and Developer settings; record the result per screen in the report. If the audit cannot be automated, amend SC3 to name the accessibility-tree dump as the audit and say so in DECISIONS.md.
- **Needs user:** no

### W7 — Partial review of thirteen artifact files
- **Severity:** WARNING
- **Category:** coverage
- **Location:** `package-lock.json`; `specs/001-econsult-flow/artifacts/*.html` (4); `checker/spec-r1..r4.md`, `checker/plan-r1..r2.md` (6); `plan.md` (read in part, see Files); `research.md` (headers)
- **Finding:** These are generated, rendered or prior-round artifacts. `package.json` was diffed against `f39fb58` directly, so the lockfile's product content is covered indirectly; the prior checker rounds were read via their verdict tables and the two final rounds in full; `plan.md` was read for every fence, step, amendment and the T015–T022 headers plus T021/T022 bodies.
- **Why:** Reported so the verdict cannot be read as a full-text review of those files.
- **Suggested fix:** none required for merge; a reviewer wanting the lockfile checked can run `npm ls --depth=0` and `npm audit` (T021 evidence recorded `npm ls clean`).
- **Needs user:** no

### I1 — Dead `reset` action and unused `FixturePracticeId` export
- **Severity:** INFO
- **Category:** debt
- **Location:** `src/features/econsult/draft.ts:29,71-72`; `src/api/fake/fixtures.ts:5`
- **Finding:** `{ type: "reset" }` is never dispatched (the draft dies with the provider, spec.md:107); `FixturePracticeId` has zero importers. Both are covered by tests, so coverage hides them.
- **Suggested fix:** delete the `reset` member, its reducer case and `draft.test.ts:125-129`; delete `FixturePracticeId` or use it as the key type of `PRACTICE_LABELS` in `dev-settings.tsx:28`.
- **Needs user:** no

### I2 — `handled()` copied into three test files
- **Severity:** INFO
- **Category:** reuse
- **Location:** `src/api/transport.test.ts:5-8`, `src/api/fake/fakeTransport.test.ts:11-14`, `src/api/services.test.ts:11-14`
- **Suggested fix:** `src/test/handled.ts` exporting the helper; import it in the three files.
- **Needs user:** no

### I3 — Camera denial shows the photo-library copy
- **Severity:** INFO
- **Category:** consistency
- **Location:** `src/components/PhotoPicker.tsx:19-20,103`
- **Finding:** Both sources set the same `denied` flag; a camera denial reads "Photos are switched off for this app." Behaviour meets spec.md:123; wording is off for the camera case.
- **Suggested fix:** keep `denied: Source | null` and pick `CAMERA_DENIED_NOTE` / `PERMISSION_DENIED_NOTE` by source (folds naturally into the W3 change).
- **Needs user:** no

### I4 — Retry after a failed create is not disabled while offline
- **Severity:** INFO
- **Category:** spec-compliance
- **Location:** `src/app/econsult/message.tsx:233-239`
- **Finding:** Send is disabled with a reason while offline (spec.md:157); the `ErrorState` Retry that re-runs the same send is not. With `networkMode: 'always'` the request goes out and fails as a network error, which the spec accepts ("the request itself is the real check", :46), so this is consistency polish only.
- **Suggested fix:** pass `disabled={isOffline}` through `SendFeedback` to a `PrimaryButton` prop on `ErrorState`, or leave as is and note it in DECISIONS.md.
- **Needs user:** no

### I5 — Structure observations (for the separate restructuring pass)
- **Severity:** INFO
- **Category:** consistency
- **Location:** see the Structure section below
- **Needs user:** no

### I6 — Home → Discard path: verified by source, driven only via `router.back()`
- **Severity:** INFO
- **Category:** regression
- **Location:** `src/app/econsult/recipient.tsx:60-65`; decisions log line 55
- **Finding:** The implementer's flagged concern ("Discard after the header Home button may not navigate") does not hold on the vendored navigation core: `useOnPreventRemove.js:50-55` threads the `VISITED_ROUTE_KEYS` set into the nested navigator's keyed listener (`:60`), so re-dispatching `data.action` skips the recipient screen and the root `POP_TO` completes. `dismissTo` and `back` both end as one navigation action (`router.js:77-78,89-95`). `recipient.test.tsx:153-166` proves the mechanism with `router.back()`; the Home button variant is the same code path but has not been driven.
- **Suggested fix:** one drive in finish:ui-verify: type a message, tap Home, tap Discard, expect Home. No code change expected.
- **Needs user:** no

### Structure (folder/ownership) — concrete, not graded beyond INFO

The grouping is coherent overall: `src/api` never renders, `src/components` never fetches, `src/app` composes and owns navigation, `src/theme` and `src/test` are pure. Four files sit outside their responsibility:

1. `src/lib/devSettings.tsx:74-120` — `ServicesContext`, `useServices`, `useSession` and the hard-coded `PATIENT` are app wiring (a session and a services provider), not a library utility, and `lib` here imports `@/api/fake/*` (lines 3-11), so the fake backend is bound at the lowest layer. Move the providers and session to `src/providers/services.tsx` (or `src/features/session/`), keep only `parseLatency`/`parseFaults`/`parsePracticeId`/`readEnvSeeds` in `src/lib/devSettings.ts`, and let `src/app/_layout.tsx` be the one place that chooses `createFakeTransport`.
2. `src/components/PhotoPicker.tsx:6-8` — a "building block" that imports the feature's `DraftPhoto`, `newId` and `processPhoto` and orchestrates pick → process → report. It is a feature component: move to `src/features/econsult/components/PhotoPicker.tsx`, or give it its own `PhotoState` prop type and let the screen map from `DraftPhoto`.
3. `src/app/dev-settings.tsx:54-83` — seven exported pure helpers (`practiceLabelFor`, `latencyFor`, `withFault`, …) live in a route file and are imported by the test through the screen module. They belong beside the env parsers (`src/lib/devSettings.ts`) or in `src/features/devSettings/options.ts`; routes should export only the screen and `unstable_settings`.
4. `src/features/econsult/recipients.ts:3` ↔ `useRecipients.ts:5` — a two-way import (`recipients.ts` takes the `RecipientsResult` type from the hook; the hook takes `joinRecipients` from `recipients.ts`). Type-only in one direction so it is safe today; define `RecipientsResult` in `recipients.ts` (pure model) and have the hook import it.

Smaller notes: `src/components/StatusViews.tsx` is the only multi-component file (three exports), and `src/lib/network.tsx` will need the banner copy once W2 moves the announcement (keep copy in `lib`, not `components`).

**Possibly dismissed:** none — the log holds three structured dismissals (T001-C1 `jest.setup.ts:1`, T001-C3 `package.json` coverage script, T001-C4 `expo-env.d.ts`), none of which overlaps a finding above.

**Summary:** The implementation meets the spec end to end: every numbered behaviour, edge case and success criterion maps to code and a behaviour-named test, all 22 tasks and nine amendments are reflected in the tree, the pre-feature snapshot lost nothing the spec did not declare, the three hand-in documents are truthful to the code (checked claim by claim, including the "no `fetch(`" and "no `expo-file-system`" assertions), and every runtime claim I could test against node_modules held. Fix W1 first (lock Change/back/Home while `submit.isPending`, one hook and one prop), then W2 (announce the offline transition from `NetworkProvider`, not per scaffold) and W3 (a catch in `pick()`); W4–W6 are standards and evidence polish. Done well: the reducer's `pickId` supersede logic, the timeout helper's signal-based decision, the partial-failure outcome model, and the screen tests that drive real navigation through `renderRouter` with a preset draft.
