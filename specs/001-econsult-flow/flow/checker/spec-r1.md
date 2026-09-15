agent_id: a4a34b2e94bb94206
mode: spec · round: 1 · dispatched: 2026-09-11T16:58:08Z · reviewed head: f39fb58

## Spec-Checker Report — mode: spec

> **Since then.** The evidence here treats `automaticallyAdjustKeyboardInsets` as a shipped mechanism and as a `Platform.OS` branch the coverage target must exercise. The prop was dropped during the device passes: iOS reports other apps' keyboard frames too, so the screen scaffold listens for the keyboard itself.

**Verdict:** PASS_WITH_FLAGS

**Reviewed:** 8/8 files (spec.md, how-it-works.md, the brief `case-study-mobile.md`, package.json, app.json, .gitignore, src/app/_layout.tsx, src/app/index.tsx) · diff: n/a (mode spec) · head: f39fb58 · canon cited: workflow.md (Coding Canon: KISS/YAGNI; Testing bar "numeric thresholds are stack-specific") · decisions log: file absent → empty, no dismissals · searches (local Grep only, Sourcegraph not configured; no cross-repo consumers — standalone take-home repo per brief:10): `econsult|Question|CareTeam|practice` in src/ → 0; `isDevice` in expo-constants/build/*.d.ts → 0; `isDevice` in expo-device/build/Device.d.ts → 1 (line 7); `getFontScale` in RN PixelRatio.js → 1 (`fontScale || PixelRatio.get()`, spec claim holds); `automaticallyAdjustKeyboardInsets` in ScrollView.d.ts → 1; `usePreventRemove` in expo-router/build/react-navigation → 5 + `react-navigation.js` re-export; `dismissAll|dismissTo|replace` in router.d.ts → 6; `SafeAreaProvider` in expo-router ExpoRoot.js → 2 (provider is mounted); bundledNativeModules → image-picker 57.0.17, network 57.0.2, crypto 57.0.3, device 57.0.2 all bundled; expo-router peerDependenciesMeta → gesture-handler, reanimated, react-native-web, react-dom all `optional: true` (removal is safe); dependency presence → zod 3.25.76 present transitively, @tanstack/react-query, expo-image-picker, expo-network, expo-crypto, jest-expo, RNTL, eslint-config-expo absent; assets find → 23 files, 14 unreferenced by app.json (matches spec:83)

| ID | Severity | Category | Location | Finding |
|----|----------|----------|----------|---------|
| W1 | WARNING | coverage | spec.md:189 | "Empty" state required reachable from dev settings, but no fixture or fault kind yields zero writable recipients |
| W2 | WARNING | consistency | spec.md:81 | Camera hidden "on the iOS simulator" with no detection mechanism, while the only first-party `isDevice` source (expo-device) is removed |
| W3 | WARNING | ambiguity | spec.md:40 | "Query's default retry" unquantified against 15 s timeouts; forced timeout fault shows loading ~67 s before the error state |
| W4 | WARNING | ambiguity | spec.md:71 | Home prefetch vs dev-settings changes: cache reset unspecified, so SC6 states become order-dependent; loading state only visible inside latency window |
| W5 | WARNING | ambiguity | spec.md:93 | "Change" recipient row: two valid navigation readings with different data-loss behaviour |
| W6 | WARNING | consistency | spec.md:72 | Nested Stack inside root Stack: header ownership undefined (double header by default); step 1 loses its back affordance once fixed |
| W7 | WARNING | coverage | spec.md:190 | 100 % statements+branches on every added file conflicts with `__DEV__`/`Platform.OS`/`isDevice` branches unless a test matrix is named |
| I1 | INFO | ambiguity | spec.md:132 | Seven unpinned values / one verification method that cannot measure what it claims |
| I2 | INFO | spec-compliance | spec.md:18 | Brief hand-in items (screen recording, platform-ran statement) not carried into the spec |
| I3 | INFO | ambiguity | spec.md:57 | Backend inbox behaviour asserted as fact in the `subject` removal rationale |
| I4 | INFO | scope-creep | spec.md:64 | No delivery order against the brief's 2–4 h / "bigger will not score higher" |

### W1 — Empty state is unreachable from the shipped fixtures and fault kinds
- **Severity:** WARNING
- **Category:** coverage
- **Location:** `specs/001-econsult-flow/spec.md:189` (also :62, :89, :102, :144)
- **Finding:** SC6 says "empty" is reachable from the development settings screen. The panel's levers (:43, :74, :144) are practice, latency, per-request fault `network|server|timeout`, and offline. Both fixtures (:62) have recipients (3 and 2); no fault kind returns an empty config. The empty state at :89/:102 can therefore only be reached by editing code, which :25 explicitly forbids for the reviewer.
- **Why:** A success criterion that cannot be satisfied as written forces the planner to invent scope, and the plan's coverage matrix will either silently drop the state or add an undeclared fixture.
- **Suggested fix:**
  ```
  Line 62 — append:
  A third fixture `prc-0000` has `recipientIds: []` and `questions: []`; it exists only to
  exercise the empty state and is selectable from the developer settings screen.
  Line 144 — append: The practice switcher lists all three fixtures.
  ```
- **Needs user:** no

### W2 — Camera-availability detection is undefined while expo-device is removed
- **Severity:** WARNING
- **Category:** consistency
- **Location:** `specs/001-econsult-flow/spec.md:81` (also :44, :93, :112)
- **Finding:** Lines 44, 93 and 112 hide the camera action "on the iOS simulator" but name no way to know you are on a simulator. Line 81 removes `expo-device`, which is the only first-party source of that fact: `node_modules/expo-device/build/Device.d.ts:7` exports `isDevice`; `node_modules/expo-constants/build/*.d.ts` has no `isDevice` (0 hits). expo-device is already in package.json and bundled in Expo Go (`bundledNativeModules.json:42`).
- **Why:** The plan must either reintroduce a package the spec says to remove (a contradiction the final review would flag) or invent a heuristic. Wrong detection either hides the camera on a real phone or shows a button that throws on the simulator, failing the brief's "the photo step works properly from the camera" (brief:197).
- **Suggested fix:**
  ```
  Line 81 — delete "expo-device" from the removal list.
  Line 44 — replace "The iOS simulator has no camera, so the camera action is hidden there with a one-line note"
  with: "The camera action is offered only when `Device.isDevice` (expo-device, already installed)
  is true; on the simulator a one-line note replaces it."
  Line 112 — "Camera unavailable (`Device.isDevice === false`): the camera action is not offered, with a one-line note."
  ```
- **Needs user:** no

### W3 — Read-request retry policy is unquantified; time-to-error can reach a minute
- **Severity:** WARNING
- **Category:** ambiguity
- **Location:** `specs/001-econsult-flow/spec.md:40` (also :133, :139)
- **Finding:** Line 40 relies on "Query's default retry with backoff"; line 133 sets a 15 s timeout on reads; line 139 promises "one error state with Retry". TanStack Query v5 defaults are `retry: 3`, `retryDelay: min(1000·2ⁿ, 30000)` → 1 s + 2 s + 4 s (training-data recall, not verified: the package is not installed yet). A forced `timeout` fault on the config request then shows the loading placeholders for 4 × 15 s + 7 s ≈ 67 s before the error appears; a `server` fault at the default 2 s latency takes ≈ 15 s.
- **Why:** For Ahmed on a weak connection (:23), and for the reviewer using the panel, a minute of skeleton before an error contradicts goal 2 and the brief's "what happens when things go wrong" (brief:246). No number in the spec pins the worst case.
- **Suggested fix:**
  ```
  Line 40 — replace "Query's default retry with backoff and its paused-while-offline behaviour match the audience"
  with: "Reads retry once after one second (`retry: 1, retryDelay: 1000` in the client defaults);
  mutations never retry automatically; Query's paused-while-offline behaviour matches the audience."
  Line 133 — append: "Worst-case time to the read error state is 2 × 15 s + 1 s = 31 s."
  ```
  ```ts
  new QueryClient({ defaultOptions: { queries: { retry: 1, retryDelay: 1000 }, mutations: { retry: 0 } } })
  ```
- **Needs user:** no

### W4 — Home prefetch vs developer settings and the visible loading state
- **Severity:** WARNING
- **Category:** ambiguity
- **Location:** `specs/001-econsult-flow/spec.md:71` (also :74, :89, :189; brief:171)
- **Finding:** Home prefetches config and care team (:71). Nothing says what happens to the cache when developer settings are applied (:74). After a successful prefetch, toggling "fail config" and entering the flow triggers a background refetch; v5 keeps `data` when a refetch errors (recall, not verified), so whether step 1 shows the cached list or the error state depends on whether `combine` keys on `status` or on `data` — unspecified, while SC6 (:189) assumes the error appears. Separately, the loading state the brief wants to watch (brief:171) is visible only if the flow is entered inside the 2 s latency window.
- **Why:** SC6's states become order-dependent on what the reviewer did first; the screen recording may never show waiting.
- **Suggested fix:**
  ```
  Line 74 — append: "Applying developer settings calls `queryClient.clear()` and returns home, so the
  next entry into the flow fetches fresh. Query keys include the practice id."
  Line 89 — append to Error: "shown whenever either query has `status: 'error'`, even if stale data exists."
  Line 71 — append: "Prefetch is deliberate; the loading state stays visible when the flow is entered
  inside the latency window or after raising latency in developer settings; the recording enters the flow immediately."
  ```
- **Needs user:** no

### W5 — "Change" recipient row has two valid navigation readings
- **Severity:** WARNING
- **Category:** ambiguity
- **Location:** `specs/001-econsult-flow/spec.md:93` (also :33, :121, :126)
- **Finding:** The "To: … · Change" row (:33, :93) does not say where Change goes or where Continue goes afterwards. (a) `router.dismissTo('/econsult/recipient')` pops steps 2–3; Continue re-walks step 2 (answers kept, :121) then step 3 (message kept, :122). (b) Push the recipient screen as a picker that pops straight back to step 3. Under (a), line 126 ("Back from step 1 returns home and discards the draft") means Change-then-back silently loses a typed message and photo.
- **Why:** Different navigation code, step-counter semantics and test names; under (a) a patient loses their message with one back gesture, which is data loss from Ria's point of view.
- **Suggested fix:**
  ```
  Line 93 — after `A "To: Dr. J. de Vries · Change" row.` add:
  "Change calls `router.dismissTo('/econsult/recipient')`; the draft keeps answers, message and photo,
  so Continue re-walks step 2 (if any) and step 3 intact. On step 1, back returns home immediately when
  the draft has no message; otherwise a 'Discard your message?' confirmation (`usePreventRemove`) guards it."
  ```
- **Needs user:** yes — (a) with a leave guard vs (b) picker-and-return are both defensible; (b) avoids the guard but gives the recipient screen two modes.

### W6 — Nested Stack: header ownership and step-1 back affordance undefined
- **Severity:** WARNING
- **Category:** consistency
- **Location:** `specs/001-econsult-flow/spec.md:72` (also :39, :46, :70, :126, :155, :158)
- **Finding:** `src/app/econsult/_layout.tsx` mounts its own `Stack` inside the root `Stack` (:39, :72). By default both navigators render a header for the flow route, so every step gets two headers unless the root declares `headerShown: false` for `econsult` — the spec never says so. Once it does, step 1 is the first screen of the nested stack and gets no back button (how-it-works.md:99), yet :126 requires "Back from step 1 returns home". Line 158 ("header consumes the top inset") and :46/:72 ("banner in the flow layout") both depend on which header is live and whether the banner sits above or below it.
- **Why:** Double headers break "content clear of the status bar" (brief:193) and the short-title rule (:155); no visible back on step 1 leaves iOS users with only the swipe gesture, which VoiceOver users cannot rely on.
- **Suggested fix:**
  ```
  Line 70 — append: `declares <Stack.Screen name="econsult" options={{ headerShown: false }} /> so the nested stack owns the header.`
  Line 72 — replace with: "Draft provider; nested `Stack` owning titles and back buttons; step 1 sets
  `headerLeft` to a labelled 'Home' button that discards the draft; the offline banner renders inside
  the screen scaffold below the header so the header keeps the top inset."
  ```
- **Needs user:** no

### W7 — 100 % statements and branches on every added file is not reachable as written
- **Severity:** WARNING
- **Category:** coverage
- **Location:** `specs/001-econsult-flow/spec.md:190`
- **Finding:** SC7 demands 100 % statements and branches on all files the feature adds, including `src/app/dev-settings.tsx` (development-only, :74), `Platform.OS` branches (:160: `keyboardDismissMode`, `gestureEnabled`, `automaticallyAdjustKeyboardInsets`), `Device.isDevice` (W2) and `__DEV__`-gated warnings (:103). Jest runs with `__DEV__ = true` on a single platform preset unless the spec names a matrix.
- **Why:** The final gate would FAIL on an unmeetable number, or the implementer pads tests that exercise the harness rather than behaviour. Canon: workflow.md "Numeric thresholds are stack-specific" — the number is the user's call, but it must be reachable.
- **Suggested fix:**
  ```
  Line 190 — replace "test coverage on the files this feature adds or changes is 100 percent of statements and branches"
  with: "coverage on `src/api`, `src/features` and `src/lib` is 100 percent of statements and branches;
  `src/components` and `src/app` reach at least 90 percent of statements, with `Platform.OS` and `__DEV__`
  branches exercised through a two-project jest config (`jest-expo/ios`, `jest-expo/android`)."
  ```
- **Needs user:** yes — threshold and scope are the user's choice; either keep 100 % and name the matrix, or relax the app/components tier.

### I1 — Unpinned values and one verification method that cannot measure its claim
- **Severity:** INFO
- **Category:** ambiguity
- **Location:** `specs/001-econsult-flow/spec.md:132` (also :13, :56, :80, :81, :83, :87, :149, :186)
- **Finding:** :13 "under two minutes" has no success criterion. :132 "about two seconds / about one second" — defaults should be exact. :87 "Good afternoon" — fixed string or time-of-day (three extra branches)? :56/:149 role `other` has no display label. :186 "48 by 48 points … verified by `getByRole`/`getByLabelText`" — role queries verify names, not sizes. :81 "adds zod" — zod 3.25.76 is already in node_modules transitively; pin the major to avoid two copies. :80 removes the `web` block, orphaning `favicon.png`, while :83 says every referenced file stays.
- **Why:** Each is a small fork the planner must guess at; the :186 wording would let a passing test claim something it did not check.
- **Suggested fix:**
  ```
  :132 → "config 2000 ms, care team 1000 ms, create 1000 ms, upload 1000 ms by default"
  :87  → "Hello, {displayName}." (no time-of-day branch)
  :149 → append: "'care team member' for role `other`"
  :186 → "…has an accessible name (`getByRole`/`getByLabelText`) and a `minHeight`/`minWidth` of 48 (`toHaveStyle`); the Accessibility Inspector audit confirms sizes on the simulator"
  :81  → "zod ^3.25 (already present transitively)"
  :83  → "…stays, except `favicon.png`, which goes with the `web` block"
  ```
- **Needs user:** no

### I2 — Brief hand-in items not carried into the spec
- **Severity:** INFO
- **Category:** spec-compliance
- **Location:** `specs/001-econsult-flow/spec.md:18` (brief:204-205, :209-212)
- **Finding:** The deliverable line lists the repo, DECISIONS.md and AI-USAGE.md. The brief also asks for a screen recording and a statement of which platform it ran on and what you would check on the other. Not code, but the spec is the only input the plan reads.
- **Why:** The plan will not reserve a task for the platform statement in DECISIONS.md, and the recording will be an afterthought.
- **Suggested fix:**
  ```
  Line 18 — append: "The screen recording is made by hand after the flow. DECISIONS.md states that the
  app ran on the iOS simulator and lists what to check on Android (hardware back on Sent, TalkBack
  live regions, virtual-scene camera, edge-to-edge insets)."
  ```
- **Needs user:** no

### I3 — Backend inbox behaviour asserted as fact
- **Severity:** INFO
- **Category:** ambiguity
- **Location:** `specs/001-econsult-flow/spec.md:57`
- **Finding:** "The practice inbox derives a preview from the first line of the body" describes the GP-side system, which is out of scope and unknowable here.
- **Why:** The brief rewards stated assumptions (brief:250); a confident claim about a system you do not own is the kind of thing the readers push on.
- **Suggested fix:**
  ```
  :57 — "Assumption: the practice inbox can derive a preview from the first line of the body. If it cannot,
  the client derives `subject` from the first sentence without asking the patient."
  ```
- **Needs user:** no

### I4 — No delivery order against the brief's time budget
- **Severity:** INFO
- **Category:** scope-creep
- **Location:** `specs/001-econsult-flow/spec.md:64` (brief:5-8)
- **Finding:** The brief expects 2–4 hours and says a bigger submission will not score higher. Affected Areas lists a four-control dev panel, twelve-plus components, a fake transport, tokens, tooling, five documents and 100 % coverage, with no ordering of what one complete path needs first.
- **Why:** Without an order the plan cannot cut cleanly, and DECISIONS.md's "what you deliberately left out" (brief:7-8) has nothing to draw on. Canon: workflow.md KISS/YAGNI.
- **Suggested fix:**
  ```
  After line 83 add "Delivery order": 1. prc-0421 happy path + create failure + tests; 2. partial upload
  failure, offline, prc-0873 skip; 3. developer settings panel; 4. docs, lint/format tooling, asset cleanup.
  Items 3–4 are cut first if time runs out and are named in DECISIONS.md either way.
  ```
- **Needs user:** no

**Possibly dismissed:** none (decisions log absent)

**Summary:** A strong spec: the edge-case taxonomy, platform lens (offline, permissions, iOS-vs-Android), contract ownership and idempotency design are all present and internally consistent, and every platform claim I could check against node_modules held (font-scale fallback, keyboard insets prop, `usePreventRemove`, optional peers, bundled modules). Fix W2 and W6 first — both change the dependency list and the navigation skeleton the plan derives its file list from — then W1 so SC6 is satisfiable. Working tree note: `.vscode/settings.json` has an uncommitted edit and `specs/` is untracked, neither of which affects this review.
