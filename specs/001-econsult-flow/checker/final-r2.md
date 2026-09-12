agent_id: a5fa88c7c70ca6808
mode: final · round: 2 · reviewed head: 8ecfbb7 · base: f39fb58 · previous rounds: final-r1 (checker/final-r1.md), spec-r1..r5, plan-r1..r3 · dispatched in the foreground (recorded as completed in flow-dispatches.jsonl)

## Spec-Checker Report — mode: final (round 2)

**Verdict:** PASS_WITH_FLAGS

**Reviewed:** 120/133 files · `base: f39fb58 · head: 8ecfbb7` · `133 files changed, 34773 insertions(+), 2294 deletions(-)` (27 commits; the two since round 1: `a04aede` tests only, `8ecfbb7` the round-1 fixes, read in full via `git show`) · canon cited: `rules/workflow.md` (Coding Canon: size caps, explicit errors, KISS/DRY, testing bar), `rules/comments.md`, `rules/javascript.md`, repo `AGENTS.md` ("announced once", functions under 50 lines, errors folded, always-mode send) · Sourcegraph not configured: local tree only · verify evidence read: `verify/finish-5/` → format clean, typecheck clean, lint clean, coverage 41 suites / 267 tests, All files 100/100/100/100 · decisions log (56 lines): `grep -in dismiss` → 1 (T001 C1/C3/C4, none in scope) · `grep verify_fix_commit` → 2, both read · searches: `git diff --name-only` → 133 · `git status --porcelain` → 1 untracked (`specs/001-econsult-flow/checker/final.md`, the round-1 report) · `grep -rn "@/components" src/lib` → 0 · `announce(` non-test → 8 sites, exactly 1 for the link (`network.tsx:34`) · `OFFLINE_MESSAGE|BACK_ONLINE_MESSAGE` → defined once (`network.tsx:6-8`), consumed by `OfflineBanner.tsx:2` + tests · `"reset"` → 0 · `FixturePracticeId` → 0 · `FIXTURE_PRACTICE_IDS` → 4 consumers (kept, correct) · `handled` → `src/test/handled.ts` + 3 test imports · `<ErrorState` → 2 callers, `retryBlockedReason` passed only at `message.tsx:253` · `*_DENIED_NOTE|PICK_FAILED_NOTE` → `PhotoPicker.tsx` + its test only · TODO/FIXME/console.log/debugger (non-test) → 0 · `allowFontScaling` → 0 · `maxFontSizeMultiplier` → 3 sites (chip, Home header, dev-settings Cancel) · `any` → 0 · empty `catch` → 0; 5 catch sites, each acts · function-length scan (brace-matched, non-test) → 1 over 50 (`PhotoPicker`, 60) · inline-comment scan → 0 over 2 sentences · files over 800 lines → 0 (max 315) · docs grep (README/DECISIONS/AI-USAGE/how-it-works for announce/scaffold/switched off/lock) → no claim contradicted by the fix; `AI-USAGE.md:8` (I7) · node_modules facts: expo-router 57.0.21 `global-state/routingQueue.js:17-21,25-45`, `imperative-api.js:10-15`, `fork/NavigationContainer.js:42`, `react-navigation/core/usePreventRemove.js:55-67`, `core/useOnPreventRemove.js:45-75`, `core/useOnAction.js` (`shouldPreventRemove` runs before `setState` for every state-changing action), `utils/useLatestCallback.js`; @tanstack/query-core 5.102.8 `notifyManager.js:3`, `timeoutManager.js:55-57`, `mutation.js:110-114`, react-query `useMutation.js`; react 19.2.3 / RN 0.86.3 `ReactFabric-dev.js:1344` (`lanes & 42`), `:6216-6218` (`forceStoreRerender` → lane 2), `:15936-15951` (`resolveUpdatePriority` → `DefaultEventPriority` outside a native event), `ReactFabric-prod.js:1351`, `react-test-renderer.development.js:418`; jest setup: no fake timers, no scheduler mock · 6 instrumented probe runs from the scratchpad against the installed modules (nothing written to the repo), detailed under W8

**Files:** the same 133-file list as round 1 (see `checker/final-r1.md`), plus `src/test/handled.ts`; the same 13 generated, rendered or prior-round files NOT REVIEWED in full.

### Prior flags

| Prior flag | Status | Evidence |
|------------|--------|----------|
| W1 — navigation live while sending | RESOLVED | `message.tsx:269-273` `usePreventRemove(isSending, () => {})`; Change `disabled={isSending}` `:284`; picker `:288`. `message.test.tsx:179-193` (Change disabled, `router.back()` held, Sent reached at 50 ms), `:234-259` (a failed retry lifts the lock). Verified against the vendored routing sources and by probe — see W8 for the condition the fix rests on |
| W2 — announcement per scaffold | RESOLVED | `network.tsx:26-35` (one `wasOffline` ref in the single provider, no announcement on mount); `ScreenScaffold.tsx:1-7` imports no `announce`, effect removed; copy moved to `network.tsx:6-8`, `OfflineBanner.tsx:2` imports it; `src/lib` → `@/components` imports: 0. `network.test.tsx:75-84` (silent on mount), `:86-101` (once down, once back); `ScreenScaffold.test.tsx:61-72` keeps the banner assertion |
| W3 — `pick()` swallowed failures | RESOLVED | `PhotoPicker.tsx:124-143` try/catch around permission + launcher + processing; `:139-142` `devWarn` + `{ kind: "failed" }`; `PickNote` `:94-111` shows `PICK_FAILED_NOTE` without Open Settings. `PhotoPicker.test.tsx:150-164` (rejected launcher → note, warn, no `onPickStarted`/`onPickReady`) |
| W4 — `RecipientScreen` 70 lines | RESOLVED | `recipient.tsx:105-152` = 48 lines; `HomeHeaderButton` `:58-66`, `RecipientBody` `:68-93` (four states, same JSX as before); `recipient.test.tsx` unchanged and green |
| W5 — three-sentence comment | RESOLVED | `ChoiceGroup.tsx:18-20` is two sentences; scan → 0 blocks over the limit in `src/` |
| W6 — SC3 Accessibility Inspector evidence | DEFERRED to finish:ui-verify | Must be driven: Xcode Accessibility Inspector audit on Home, step 1 (loaded and empty), step 2, step 3 (pristine and with the error shown), Sent (partial variant), Developer settings; record the result per screen, or amend SC3 + DECISIONS.md if the agent-device dump is to stand in for it |
| W7 — partial review | STILL OPEN (restated below) | 13 generated/rendered/prior-round files not read in full, same set as round 1 |
| I1 — dead `reset`, unused `FixturePracticeId` | RESOLVED | `draft.ts:21-28` union without `reset`, reducer `:60-70` without the case, `draft.test.ts` reset test removed; `fixtures.ts` type removed; grep → 0 for both |
| I2 — `handled()` copied thrice | RESOLVED | `src/test/handled.ts:1-10` (JSDoc, exempt from the 2-sentence cap; under `src/test/`, excluded from coverage like `providers.tsx`); imported by `transport.test.ts:1`, `fakeTransport.test.ts:1`, `services.test.ts:1` |
| I3 — camera denial shows library copy | RESOLVED | `PhotoPicker.tsx:22-23` `CAMERA_DENIED_NOTE`, `:41` `Note` discriminated on `source`, `:106` picks by source. `PhotoPicker.test.tsx:137-148` |
| I4 — Retry not disabled offline | RESOLVED | `StatusViews.tsx:54-59,74-79` `retryBlockedReason` → `disabled` + `accessibilityHint`; `message.tsx:253` passes `OFFLINE_HINT` while offline; `recipient.tsx:81` unaffected (prop absent → Retry enabled). `StatusViews.test.tsx:27-46`, `message.test.tsx:261-276` |
| I5 — structure | DEFERRED (separate restructuring pass) | Four items unchanged; W2 already kept the banner copy in `lib` as the note asked |
| I6 — Home → Discard driven only via `router.back()` | DEFERRED to finish:ui-verify | Drive: step 1 → Continue → type a message on step 3 → Change (back to step 1) → header Home → Discard → expect Home. No code change expected (`recipient.tsx:95-103` unchanged) |

### Requirement coverage (compact; status changes since round 1 noted)

| Ids | Status |
|---|---|
| U1 U2 U3 U4 | met |
| A1 A2 A3 A4 A5 A6 A7 A8 A10 | met |
| A9 | met — changed: the W2 note ("announcement fires per mounted scaffold") is gone; one announcement per transition, `network.test.tsx:86-101` |
| C1 C2 C3 C4 C5 C6 | met |
| B1 B2 | met |
| S1 S2 S3 S5 | met |
| S4 | met — changed: the W1 note ("Change and back stay live during the send") is gone; now subject to W8 (the lock works, on a condition worth making explicit) |
| E1 E2 E3 E4 E5 E6 E7 E9 E10 E11 E12 E13 E15 E16 E17 E18 E19 E20 E21 E22 E23 E25 E26 | met |
| E8 | met — changed: the I3 note (camera denial wording) is gone |
| E14 | met — I6 deferred to ui-verify, unchanged |
| E24 | met — changed: the I4 note (Retry not disabled offline) is gone |
| P1 P2 | met |
| SC1 SC2 SC4 SC5 SC6 SC7 SC8 | met (SC7 now on `finish-5`: 267 tests, 100 % everywhere) |
| SC3 | partially met — W6 deferred to ui-verify, unchanged |
| OOS | respected |
| Docs | met — I7 is a completeness note, not a contradiction |

### Fix-delta regression review (no flags)

Checked and clean: `ErrorState`'s new optional prop leaves `recipient.tsx:81` unchanged; `HEADER_BUTTON_MAX_FONT_SCALE` still consumed (`recipient.tsx:16,63`); `RecipientBody` renders the same four branches the inline JSX did and `StepHeader` is still gated on `ready` (`:136-142`); `headerLeft` semantics unchanged; `NetworkProvider` still drives `onlineManager` first, then announces only on a transition; `ScreenScaffold` still shows the banner from `useIsOffline`; `PickNote` keeps `accessibilityLiveRegion="polite"` on both notes; the `DraftAction` union narrowing has no remaining dispatcher of `reset`; `handled.ts` sits in the coverage-excluded test folder with its siblings; `message.tsx:132-135` still drops only the status line while the mutation's error state renders the failure (accepted in round 1). Scans over `src/`: 0 TODO/console/debugger, 0 `allowFontScaling`, 0 `any`, 0 empty catch, 0 comments over two sentences, 0 files over 800 lines, 1 function over 50 lines (W9).

| ID | Severity | Category | Location | Finding |
|----|----------|----------|----------|---------|
| W8 | WARNING | regression | `src/app/econsult/message.tsx:130-131, 271-273` | The send lock lets its own post-send `router.replace` through only because `dispatch({ type: "attachmentSettled" })` on the preceding line re-renders the screen inside the routing update's batch; a bare `usePreventRemove(isPending, () => {})` blocks the confirmation at 50 ms and 120 ms latency (probe) |
| W9 | WARNING | standards | `src/components/PhotoPicker.tsx:113-172` | `PhotoPicker` is 60 lines (62 at the round-1 head; round 1 missed it) |
| W7 | WARNING | coverage | 13 `NOT REVIEWED` files above | Partial review of generated/rendered/prior-round artifacts (unchanged from round 1) |
| I7 | INFO | consistency | `AI-USAGE.md:8-9` | The checker record stops at the plan rounds; the two final implementation rounds and `8ecfbb7` are not mentioned |

### W8 — The send lock survives its own `router.replace` by an undocumented ordering dependency
- **Severity:** WARNING
- **Category:** regression
- **Location:** `src/app/econsult/message.tsx:126-131` (dispatch then replace), `:271-273` (lock and comment)
- **Finding:** `usePreventRemove` installs a `beforeRemove` listener that reads `preventRemove` from the screen's last committed render (`core/usePreventRemove.js:55-61`, via `useLatestCallback`). `router.replace` does not dispatch synchronously: `routingQueue.add` (`routingQueue.js:17-21`) re-renders `NavigationContainerInner` through `useSyncExternalStore`, and the REPLACE is dispatched from that component's `useEffect` (`imperative-api.js:10-15`, `fork/NavigationContainer.js:42`). REPLACE removes the message route's key, so `useOnAction.js` runs `shouldPreventRemove` before `setState`, exactly as for back. TanStack flips the mutation result to `isPending: false` before `mutateAsync` resolves (`mutation.js:110-114`), but the store notification that would re-render `MessageScreen` is a `setTimeout(0)` macrotask (`notifyManager.js:3`, `timeoutManager.js:55-57`), i.e. after the queue has flushed. So the listener sees `false` only if *something else* re-renders `MessageScreen` in the same pass as the routing update. Today that something is the `attachmentSettled` dispatch at `:130`: a DefaultLane update that React 19.2's unified sync lane (`lanes & 42`, `ReactFabric-dev.js:1344`, `-prod.js:1351`, same code in react-test-renderer `:418`) renders together with the SyncLane routing update (`forceStoreRerender`, `ReactFabric-dev.js:6216-6218`), so the screen commits `isSending = false` before the container's effect runs. On device the dispatch gets the same lane: Fabric's `resolveUpdatePriority` returns `DefaultEventPriority` outside a native event (`ReactFabric-dev.js:15936-15951`).
  Probe evidence (instrumented `shouldPreventRemove`, `routingQueue.run` and every `usePreventRemove` render; real modules, real timers, no scheduler mock): the real `MessageScreen` through `renderRouter` at 0, 50, 120 and 400 ms latency → `render usePreventRemove(false)` → `routingQueue.run [ROUTER_LINK /econsult/sent]` → `shouldPreventRemove REPLACE -> prevented=false`, Sent reached every time. A minimal screen with only `useMutation` + `usePreventRemove(isPending, () => {})` + `await mutateAsync(); router.replace()` → at 10 ms reached (stale `PreventRemoveProvider` renders were still pending and got batched in); at **50 ms and 120 ms `callback (prevented)`, `shouldPreventRemove REPLACE -> prevented=true`, never reached** — the screen later re-renders with `status=success` and stays put. Same minimal screen with a `setState` before `replace`, with an `isLeaving` flag, or with a callback that re-dispatches REPLACE → reached at 120 ms.
- **Why:** The guard's correctness rests on an adjacent line that exists for another reason, on a React batching rule, and on the lane the continuation happens to get — none of it stated in the comment at `:271-272`, which promises the opposite failure cannot happen. Moving `attachmentSettled` into `useSubmit`'s `onSuccess` (its sibling `econsultCreated` already lives in a callback), or swapping the two lines, would block every confirmation on device: "Message sent" shown, Send re-enabled, Sent never reached — the patient-facing outcome W1 was raised to prevent. The suite would catch that only incidentally through `message.test.tsx:179-193` (50 ms); the two "moves to the confirmation" tests run at 0 ms, where the bare lock still passes in jest. The round-1 suggested fix carried this dependency; it surfaced while verifying the fix against the installed routing sources rather than the implementer's summary. No present defect, hence WARNING.
- **Suggested fix:** make the lock timing-independent, mirroring `useDiscardGuard` (`recipient.tsx:95-103`), which already re-dispatches the prevented action:
  ```tsx
  // message.tsx
  import { useNavigation, useRouter } from "expo-router";
  …
  export default function MessageScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    …
    const isSending = send.submit.isPending;

    // Back, swipe and step 1's Home button wait for the send to settle. The screen's own replace to
    // the confirmation is re-dispatched, so it does not depend on which render the lock is read from.
    usePreventRemove(isSending, ({ data }) => {
      if (data.action.type === "REPLACE") navigation.dispatch(data.action);
    });
  ```
  Alternative consistent with `sent.tsx:101-114` (guard dropped by state, navigation from an effect): `const [isSent, setIsSent] = useState(false)`, `usePreventRemove(isSending && !isSent, () => {})`, `setIsSent(true)` where `router.replace` is now, and `useEffect(() => { if (isSent) router.replace("/econsult/sent"); }, [isSent, router])`. Either way, raise `latencyMs` in `message.test.tsx:182` from 50 to 120 so the test sits clearly past any stale renders, and delete the sentence "so the confirmation can never land on top of a screen the patient moved to meanwhile" or keep it only once the fix makes it true unconditionally.
- **Needs user:** no

### W9 — `PhotoPicker` is 60 lines
- **Severity:** WARNING
- **Category:** standards
- **Location:** `src/components/PhotoPicker.tsx:113-172` (body from `:119`: 54 lines)
- **Finding:** Brace-matched from `export function PhotoPicker({` to its closing brace the component is 60 lines; canon (`workflow.md`, `AGENTS.md`, plan.md:23) says under 50. Why round 1 missed it: the round-1 length scan stopped at the first column-0 `}`, which for a multi-line parameter list is the end of the signature (`}: Props) {`), so it measured 7 lines; at `a04aede` the function was 62 lines (`:89-150`). The W3 fix added 5 (try/catch) and removed 7 (`PickNote` extraction), net 60 — still over.
- **Why:** canon size cap; the file is otherwise clean and the `pick` body (`:124-143`) is the readable core.
- **Suggested fix:** lift the two source buttons out (about 12 lines):
  ```tsx
  function SourceButtons({ disabled, onPick }: { disabled: boolean; onPick: (source: Source) => void }) {
    return (
      <>
        {Device.isDevice ? (
          <TextButton label={TAKE_PHOTO_LABEL} disabled={disabled} onPress={() => onPick("camera")} />
        ) : (
          <Text style={text.muted}>{CAMERA_UNAVAILABLE_NOTE}</Text>
        )}
        <TextButton label={CHOOSE_PHOTO_LABEL} disabled={disabled} onPress={() => onPick("library")} />
      </>
    );
  }
  …
      <View style={styles.stack}>
        <Text style={text.body}>{PHOTO_HINT}</Text>
        <SourceButtons disabled={disabled} onPick={(source) => void pick(source)} />
        {note ? <PickNote note={note} /> : null}
      </View>
  ```
  `PhotoPicker` lands at about 46 lines; no test changes (queries are by role and label).
- **Needs user:** no

### W7 — Partial review of thirteen artifact files (restated)
- **Severity:** WARNING
- **Category:** coverage
- **Location:** `package-lock.json`; `specs/001-econsult-flow/artifacts/*.html` (4); `checker/spec-r1..r4.md`, `checker/plan-r1..r2.md` (6); `plan.md` (read in part); `research.md` (headers)
- **Finding:** Same set as round 1; none of these changed in `a04aede` or `8ecfbb7` (`git show --stat` of both), so round 1's partial coverage still describes them. `package.json` was diffed against the base in round 1; the fix commits did not touch it.
- **Suggested fix:** none required for merge.
- **Needs user:** no

### I7 — AI-USAGE.md's checker record stops at the plan
- **Severity:** INFO
- **Category:** consistency
- **Location:** `AI-USAGE.md:8-9` ("A spec checker ran five rounds and a plan checker three"); `README.md:133-134` points readers at `specs/001-econsult-flow/checker/`
- **Finding:** Both statements are true, but the two final implementation-review rounds and the resulting `8ecfbb7` are not mentioned, and `checker/final.md` is currently untracked (`git status` → `??`). Once the final reports are committed, the record will show reviews the narrative does not account for.
- **Suggested fix:** one sentence after `AI-USAGE.md:9`, e.g. "A final implementation review ran two rounds over the whole diff; its findings were fixed in one commit (navigation lock while sending, single offline announcement, photo-picker error path)." Commit `checker/final.md` and this round's report alongside.
- **Needs user:** no

**Possibly dismissed:** none — the log's only structured dismissals (T001-C1 `jest.setup.ts:1`, T001-C3 coverage script, T001-C4 `expo-env.d.ts`) do not overlap any finding above.

**Summary:** All nine fixes from round 1 are genuinely in the code and each has a behaviour-named test; verify is green at 267 tests and 100 % on every file, and nothing in the fix delta regressed a caller. The one thing to fix first is W8: the navigation lock is correct today, on device as in jest, but only because the reducer dispatch on the line before `router.replace` re-renders the screen inside the routing update's batch — a probe shows the bare lock silently blocking the confirmation at 50 ms latency, so make the guard re-dispatch its own REPLACE (three lines, same pattern as the step-1 discard guard) and raise the lock test's latency past 50 ms. W9 is a size-cap trim; W6 and I6 go to ui-verify as planned. Done well: the `NetworkProvider` transition effect with its silent-on-mount test, the discriminated `Note` in the photo picker, and the lock test that drives `router.back()` against the real nested stack.
