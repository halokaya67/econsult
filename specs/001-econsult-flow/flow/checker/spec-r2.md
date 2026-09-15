agent_id: ac23b796121707c19
mode: spec · round: 2 · reviewed head: f39fb58 · previous round: checker/spec-r1.md

All verification is in. Evidence summary before the report:

- `useOnAction.js:75` — every state-changing action runs `shouldPreventRemove` before `setState`; `useOnPreventRemove.js` — when the parent pops the `econsult` route, the nested navigator's keyed listener walks **all** nested routes with `nextRoutes = []`, so a guard on Sent *or* on step 1 blocks a root-level unwind.
- `NativeStackView.native.js:210-219,310-315` — `preventNativeDismiss` is set from the (propagated) prevented map and a cancelled swipe re-enters JS as a `pop`, so the spec's "swipe-back → confirmation" claim holds.
- `imperative-api.js:10-13` — `router.*` calls are queued and flushed in a `useEffect` after commit; `getNavigationAction.js:33-45,91` — `dismissTo('/')` targets the divergent (root) navigator, `dismissAll` only reaches step 1 of the nested stack.
- Decisions log: file absent → empty; no dismissals to honour.

## Spec-Checker Report — mode: spec

> **Since then.** I4 here produced the `.env` seed wording in the spec. The environment layer was removed afterwards — no `.env`, no `EXPO_PUBLIC_*` — and the developer settings screen is the only knob.

**Verdict:** PASS_WITH_FLAGS

**Reviewed:** 6/6 files (spec.md, how-it-works.md, the brief `case-study-mobile.md`, checker/spec-r1.md, package.json, app.json) · diff: n/a (mode spec) · head: f39fb58 (unchanged since round 1; working tree: only `specs/` untracked) · canon cited: workflow.md (Coding Canon: KISS/YAGNI; Testing bar "numeric thresholds are stack-specific") · decisions log: file absent → empty, no dismissals · searches (local Grep only, Sourcegraph not configured; no cross-repo consumers — standalone take-home repo per brief:10): `PreventRemoveProvider|usePreventRemove` in expo-router/build → 20 files (vendored core + native-stack); `@react-navigation` top-level and nested under expo-router → 0 dirs (vendoring confirmed); `shouldPreventRemove` in core/useOnAction.js → 1 (line 75); `preventRemove|preventNativeDismiss|gestureEnabled|preventedRoutes|onNativeDismissCancelled|onDismissed` in native-stack/views/NativeStackView.native.js → 8 lines; `dismissTo|dismissAll` in global-state/router.d.ts → 4; `POP_TO` in global-state/*.js + link/*.js → 3 (router.js:78,87; BaseExpoRouterLink.js:68); `routingQueue.run|subscribe` in expo-router/build → imperative-api.js:10,12 (flushed in `useEffect`); `event|popTo|findDivergentState|target|replace` in global-state/getNavigationAction.js → 7 (root navigator targeted for `/deeply/nested → /top-level`)

| Prior flag | Status | Evidence |
|------------|--------|----------|
| W1 — empty state unreachable | RESOLVED | spec.md:62 `prc-0000` (no recipients, no questions); :74 "practice (all three fixtures)"; :91, :202 name it for SC6 |
| W2 — camera detection vs expo-device removal | RESOLVED | spec.md:44 `Device.isDevice` gate; :81 "expo-device stays"; :124, :184 consistent |
| W3 — unquantified read retry | RESOLVED | spec.md:40 `retry: 1, retryDelay: 1000`, mutations never auto-retry; :145 worst case 2×15 s + 1 s = 31 s (arithmetic holds) |
| W4 — prefetch vs dev settings, stale data | RESOLVED | spec.md:43/:74 apply clears cache + returns home; :101 error shown even with stale data; :71 loading-visibility note; :156 keys include practice id |
| W5 — Change row navigation | RESOLVED | spec.md:105 `router.dismissTo` to step 1, draft kept, re-walk; :138 step-1 guard via `usePreventRemove` — reading (a), judged as written |
| W6 — nested stack header ownership | RESOLVED | spec.md:39/:70 root `headerShown: false` for `econsult`; :72 nested stack owns titles/back, labelled Home header-left, banner inside scaffold below header; :46 |
| W7 — 100 % everywhere unreachable | RESOLVED | spec.md:203 tiered: 100 % st+br on api/features/lib, ≥ 90 % statements on components/app, `Platform.OS` mocked per test (residual `__DEV__` point → I2 below, INFO) |
| I1 — unpinned values | RESOLVED | :144 latencies; :99 greeting fixed; :161 "care team member"; :199 `toHaveStyle`; :81/:188 zod 4; :83 favicon; :197 "under two minutes" |
| I2 — hand-in items | RESOLVED | spec.md:18 recording by hand; platform statement + Android checklist in DECISIONS.md |
| I3 — inbox preview asserted as fact | RESOLVED | spec.md:57 reworded as assumption with client-side fallback |
| I4 — no delivery order | RESOLVED | spec.md:85-95 five-item order with cut order (tooling first — a different route than suggested, same outcome) |

| ID | Severity | Category | Location | Finding |
|----|----------|----------|----------|---------|
| W1 | WARNING | coverage | spec.md:202 | "Offline before send" is no longer reachable from the panel: Apply clears the cache, forced offline pauses the reads, step 1 never loads |
| W2 | WARNING | consistency | spec.md:107 | Done cannot unwind the flow as written: Sent's own guard, and then step 1's new guard, prevent the root pop of the `econsult` group |
| I1 | INFO | ambiguity | spec.md:92 | Delivery-order fallback relies on `.env` seeds for faults that the spec never declares |
| I2 | INFO | coverage | spec.md:115 | The `__DEV__`-gated warning lives in a 100 %-branch tier with no named way to exercise the release branch |

### W1 — "Offline before send" is unreachable from the developer settings screen after the cache-clear fix
- **Severity:** WARNING
- **Category:** coverage
- **Location:** `specs/001-econsult-flow/spec.md:202` (also :40, :43, :46, :74, :173)
- **Finding:** Fix-delta regression from round-1 W4. The reviewer's only path to the offline state is: open the panel from home (:99), force offline, Apply — which now clears the query cache and returns home (:43, :74). Query's online manager is "wired to the same source" (:46, :173), so it reports offline. TanStack Query v5 queries default to `networkMode: 'online'`, under which a query with no cached data does not fire and sits at `status: 'pending', fetchStatus: 'paused'` (training-data recall, not verified — the package is not installed). Step 1 therefore shows the three placeholder cards with the offline banner and never reaches loaded, so step 3 and its disabled Send are never on screen. Before the cache clear, a warm cache from the home prefetch masked this; the round-1 fix removed the mask. Round 1 missed it because it reviewed the prefetch/cache interaction without the forced-offline lever.
- **Why:** SC6 promises this state "reachable from the development settings screen and covered by a test"; the recording and the live demo cannot show the one offline state the brief asks for (brief:196). The plan's coverage matrix would mark SC6 satisfied by a test that fakes the network hook while the app itself cannot get there.
- **Suggested fix:**
  ```
  Line 40 — after "…mutations never retry automatically" add:
  "Reads use `networkMode: 'offlineFirst'`: the first attempt always runs (the fake transport is in-process; a real
  request fails fast) and only the retry pauses until the device is back online. Mutations keep the default `online`
  mode."
  Line 202 — replace "offline before send" with:
  "offline before send (force offline, Apply, enter the flow: step 1 still loads because reads are offline-first;
  step 3 shows the banner and the disabled Send)"
  ```
  ```ts
  new QueryClient({
    defaultOptions: {
      queries: { retry: 1, retryDelay: 1000, networkMode: 'offlineFirst' },
      mutations: { retry: 0 },
    },
  })
  ```
- **Needs user:** yes — this changes the spec'd read semantics (:40 "paused-while-offline"). The alternative that keeps `online` mode is to exempt the offline toggle from the cache clear and document that the reviewer must enter the flow once online first, which weakens SC6's wording rather than the behaviour.

### W2 — Done is blocked by the flow's own leave guards
- **Severity:** WARNING
- **Category:** consistency
- **Location:** `specs/001-econsult-flow/spec.md:107` (also :39, :130, :138, :139, :172, :181)
- **Finding:** Verified in the vendored navigator: `core/useOnAction.js:75` runs `shouldPreventRemove` for every state-changing action, and `core/useOnPreventRemove.js` (`useOnPreventRemove` → keyed `beforeRemove` listener) makes a parent pop of the `econsult` route evaluate **every** route of the nested stack against `nextRoutes = []`, last screen first. Two consequences the spec does not address. (1) :139/:172 put an unconditional `usePreventRemove` on Sent; Done's own unwind (`router.dismissTo('/')`, which `getNavigationAction.js:37` correctly targets at the root navigator) removes the `econsult` route, so Sent's guard swallows Done. (2) Even with Sent lowered, step 1's new guard from :138 (`hasMessage || hasPhoto`) is still true because :107 says the draft is cleared *by* Done and :39/:130 say it dies with the provider — neither happens before the pop — so the patient gets "Discard your message?" on the confirmation screen. Round 1 did not have the step-1 guard (new in W5's fix) and W6 stopped at header ownership without tracing `beforeRemove` through the nested navigator. Also unnamed: which call Done uses — `router.dismissAll` (:181 reuse map) is `popToTop` on the *closest* stack (`router.d.ts:68-74`) and would land on step 1, not home.
- **Why:** The confirmation screen is the last thing the recording shows; a Done that does nothing, or that asks whether to discard a message that was just sent, fails "a clear confirmation that my message has been sent" and looks like the app is confused about its own state. Both guards are state machines the plan must get right in the same task; the spec needs to say which state lowers them.
- **Suggested fix:**
  ```
  Line 107 — replace "Back navigation is prevented; 'Done' unwinds the flow and returns home with the draft cleared."
  with: "Back navigation is prevented while the screen is showing (`usePreventRemove(!isLeaving)`). Done sets
  `isLeaving`; an effect then calls `router.dismissTo('/')` (not `dismissAll`, which only reaches step 1 of the
  nested stack). Leaving the group unmounts the draft provider, which is what clears the draft."
  Line 138 — replace "(`usePreventRemove`)" with:
  "(`usePreventRemove((hasMessage || hasPhoto) && econsultId == null)`, so the guard is already down once the
  message has been created and Done can unwind past step 1)"
  ```
  ```tsx
  // sent.tsx
  const [isLeaving, setIsLeaving] = useState(false);
  usePreventRemove(!isLeaving, () => {});
  useEffect(() => { if (isLeaving) router.dismissTo('/'); }, [isLeaving]);
  // recipient.tsx
  usePreventRemove(hasUnsentContent && draft.econsultId == null, ({ data }) =>
    confirmDiscard(() => navigation.dispatch(data.action)));
  ```
- **Needs user:** no

### I1 — Delivery-order fallback names `.env` fault seeds the spec never declares
- **Severity:** INFO
- **Category:** ambiguity
- **Location:** `specs/001-econsult-flow/spec.md:92` (also :43, :95, :25)
- **Finding:** Introduced by the I4 fix. :92 says "Until it exists, `.env` seeds switch practice and faults" and :95 "the `.env` seeds remain", but :43 declares exactly one seed, `EXPO_PUBLIC_PRACTICE_ID`. If item 4 is cut, the planner has to invent latency/fault variables, and :25's "injects failures without editing code" becomes "edits `.env`".
- **Why:** Small fork the plan must guess at; the contingency the spec promises is not actually specified.
- **Suggested fix:**
  ```
  Line 43 — after "`EXPO_PUBLIC_PRACTICE_ID` … seeds the default practice" add:
  "; `EXPO_PUBLIC_LATENCY_MS` and `EXPO_PUBLIC_FAULTS` (comma-separated `request:kind` pairs, e.g. `config:timeout`)
  seed latency and faults the same way"
  — or — Line 92: "Until it exists, `.env` seeds switch practice only; faults need the panel."
  ```
- **Needs user:** no

### I2 — `__DEV__`-gated warning sits in a 100 %-branch tier with no named mechanism
- **Severity:** INFO
- **Category:** coverage
- **Location:** `specs/001-econsult-flow/spec.md:115` (also :76, :203)
- **Finding:** Residual of round-1 W7: the fix named `Platform.OS` but not `__DEV__`, which W7 also listed. The "development warning" for a `recipientIds` entry absent from the care team (:115) naturally lives in the hook that merges config and care team (:76, `src/features`), where SC7 (:203) demands 100 % branches. jest-expo runs with `__DEV__ = true`, so the release branch of an `if (__DEV__)` never executes unless a test flips the global (a plain writable global — training-data recall, not verified; jest-expo is not installed).
- **Why:** The final gate would fail on a branch that no test can reach by accident, or the implementer moves the warning to a 90 %-tier folder to dodge it. Canon: workflow.md testing bar — thresholds must be reachable.
- **Suggested fix:**
  ```
  Line 203 — append: "; the `__DEV__` guard on the missing-recipient warning is exercised by setting
  `globalThis.__DEV__ = false` in one test (or the guard lives in a single `src/lib/devWarn.ts` helper)"
  ```
- **Needs user:** no

**Possibly dismissed:** none (decisions log absent)

**Summary:** All eleven round-1 flags are resolved in the current text and the revisions hold together — the three-fixture set, the tiered coverage bar, the pinned latencies and the delivery order all read cleanly. Fix W2 first: it is a verified interaction in the vendored navigator (`useOnAction.js:75`, `useOnPreventRemove.js`) between the two guards the spec now carries, and the plan's navigation task depends on which state lowers each guard; then W1, a regression of the round-1 cache-clear fix that makes SC6's offline state unreachable from the panel — the user should pick between offline-first reads and a warm-cache caveat at the gate. Done well: the W5/W6 fixes chose a design (`dismissTo` + nested-stack-owned header + `usePreventRemove`) that the native-stack sources confirm works for swipe, header back and Android back exactly as claimed.
