agent_id: a7b433df484c8b1bf
mode: spec · round: 3 · reviewed head: 32db7de · previous rounds: checker/spec-r1.md, checker/spec-r2.md

All verification is in. Evidence summary before the report:

- `node_modules/expo/src/winter/runtime.native.ts:40-52` installs `expo/fetch` as the global unless `EXPO_PUBLIC_USE_RN_FETCH` is set; `winter/fetch/convertFormData.ts:35-36,76` rejects a `{ uri, name, type }` part (`Unsupported FormDataPart implementation`); `expo-file-system` 57.0.7 is installed as a dependency of `expo` and `build/File.d.ts:145` declares `createUploadTask(url, options?): UploadTask`. The spec's new Contract row and Fake-backend bullet hold; how-it-works.md:86 is now the stale side.
- `winter/AbortSignal.ts:9-14` (`installAbortSignalPatch`, called at `runtime.native.ts:38`) defines `AbortSignal.timeout` and `AbortSignal.any`, so spec.md:146's rationale ("not available in React Native 0.86") is wrong in this runtime even though the decision still stands. `winter/fetch/fetch.ts:77-83` honours the signal but rejects with `FetchError`, not a DOMException.
- W2 fix ordering confirmed in the vendored navigator: `utils/useLatestCallback.js` writes the listener ref in `useInsertionEffect`; `core/usePreventRemove.js` early-returns when `preventRemove` is false; `global-state/routingQueue.js` `add` only notifies subscribers and `imperative-api.js:10-13` dispatches in a later `useEffect`; the root pop then walks nested routes at `core/useOnPreventRemove.js:87-89` / `core/useOnAction.js:75` with both guards down.
- `expo-router/build/testing-library/index.js:48,75-109` calls `render` and `act` synchronously; `expo-router/package.json` peers RNTL `>= 13.2.0` (optional), devDeps `^13.3.0`. `bundledNativeModules.json` pins expo-image-manipulator ~57.0.17, expo-file-system ~57.0.7, jest-expo ~57.0.5.
- Decisions log: one entry (2026-09-11T17:30:19Z, phase `spec`, "Approve the spec"); `grep -in dismiss` → 0.

## Spec-Checker Report — mode: spec

**Verdict:** PASS_WITH_FLAGS

**Reviewed:** 8/8 files (spec.md, how-it-works.md, checker/spec-r1.md, checker/spec-r2.md, `/Users/halilibrahimkaya/Documents/case-study-mobile.md`, package.json, app.json, .gitignore; research.md consulted by grep only per dispatch, 9 greps below) · diff: n/a (mode spec) · head: 32db7de (spec docs now committed; `git status --porcelain` clean) · canon cited: workflow.md (Coding Canon: KISS/YAGNI; "Errors & inputs — handle explicitly at every level"; Testing bar) · decisions log: 1 entry (spec-gate approval), `grep -in dismiss` → 0 · searches (local Grep only, Sourcegraph not configured; no cross-repo consumers — standalone take-home repo per brief:10): `install('fetch'` in expo/src/winter/runtime.native.ts → 1 (:40-52, gated on `EXPO_PUBLIC_USE_RN_FETCH`); `uri|Unsupported FormDataPart` in expo/src/winter/fetch/convertFormData.ts → 2 (:35-36 comment, :76 throw); `createUploadTask|uploadAsync|UploadTask` in expo-file-system/build → 15 (File.d.ts:145); `timeout|any` in expo/src/winter/AbortSignal.ts → `installAbortSignalPatch` defines both (:9-14); `signal|abort` in expo/src/winter/fetch/fetch.ts → 8 (:77-83 `FetchError`, `cause: signal.reason`); `render|act(` in expo-router/build/testing-library/index.js → 6 (sync :48, :75-109); `@testing-library/react-native` in expo-router/package.json → peer `>= 13.2.0` optional, devDep `^13.3.0`; bundledNativeModules.json → 6 hits (image-manipulator 57.0.17, file-system 57.0.7, image-picker 57.0.17, network 57.0.2, crypto 57.0.3, jest-expo 57.0.5); installed check → expo-file-system 57.0.7 present, 8 spec'd packages absent (react-query, image-manipulator, image-picker, network, jest, jest-expo, RNTL, @react-native/jest-preset); `shouldPreventRemove|addKeyedListener|emit(` in core/useOnPreventRemove.js → 7 (:44, :63, :68-71, :87-89) + useOnAction.js:75; `if (!preventRemove)` in core/usePreventRemove.js → 1; `useInsertionEffect` in utils/useLatestCallback.js → 1; `add|run` in global-state/routingQueue.js → notify-only `add`, dispatch in `useImperativeApiEmitter` useEffect (imperative-api.js:10-13); research.md `fetch|FormData|createUploadTask|expo-file-system` → 40+ (:620-621, :1065, :1107, :1123, :1141); `offlineFirst|networkMode|useNetworkState|isConnected` → 30 (:144, :841, :1185, :1195); `quality|manipulat|1600|release()` → 40 (:50, :1223-1225, :1255, :1270-1272); `13.3.3|renderRouter|jest-preset|jest-expo` → 40 (:918-920, :958-969, :1004-1009); `preparing|processing|exif` → 0 on Send-during-processing; spec.md `preparing|processing|disabled.*send` → 6 lines, none define Send while preparing; `.env*` in repo root → 0 (to be created; `.gitignore` ignores only `.env*.local`)

| Prior flag | Status | Evidence |
|------------|--------|----------|
| W1 — offline state unreachable after cache clear | RESOLVED | spec.md:40 `networkMode: 'offlineFirst'`, `retry: 1, retryDelay: 1000`, send mutation `networkMode: 'always'` with no auto-retry; :205 SC6 spells the path out; :146 worst case still 31 s; :154/:156 consistent. First-attempt semantics verified via research.md:1185 (`canFetch` is true for every mode but `online`); retry-pause-while-offline is training-data recall, not verified (package not installed). |
| W2 — Done blocked by leave guards | RESOLVED | spec.md:107 `usePreventRemove(!isLeaving)`, Done sets `isLeaving`, effect calls `router.dismissTo('/')`; :139 `usePreventRemove((hasMessage \|\| hasPhoto) && econsultId == null)`; :183 reuse map no longer lists `dismissAll`. Vendored ordering confirms it works: `useLatestCallback.js` (`useInsertionEffect`) → `usePreventRemove.js` early return → `routingQueue.js`/`imperative-api.js:10-13` dispatch after commit → `useOnPreventRemove.js:87-89`, `useOnAction.js:75` see both guards down. |
| I1 — `.env` fault seeds undeclared | RESOLVED | spec.md:43 declares `EXPO_PUBLIC_PRACTICE_ID`, `EXPO_PUBLIC_LATENCY_MS`, `EXPO_PUBLIC_FAULTS` (`request:kind` pairs); :92/:95 reference them; `.gitignore` permits a committed `.env`. |
| I2 — `__DEV__` branch in a 100 % tier | RESOLVED | spec.md:206 single `src/lib/devWarn.ts`, test sets `globalThis.__DEV__ = false`; :78, :115, :126 route warnings through it. |

| ID | Severity | Category | Location | Finding |
|----|----------|----------|----------|---------|
| W1 | WARNING | consistency | how-it-works.md:86 | Doc still describes React Native's fetch/FormData/AbortSignal; the Expo 57 runtime replaces all three, and spec.md:146 repeats one stale rationale |
| W2 | WARNING | ambiguity | spec.md:105 | Send, Remove, the draft and the leave guard are undefined during the new "Preparing photo" window |
| I1 | INFO | coverage | spec.md:127 | Long-edge downscale has no guard for the picker's documented 0 `width`/`height` |

### W1 — how-it-works.md:86 is out of date against the Expo 57 runtime; spec.md:146 carries the same stale rationale
- **Severity:** WARNING
- **Category:** consistency
- **Location:** `/Users/halilibrahimkaya/Documents/econsult/feat-econsult-flow/specs/001-econsult-flow/how-it-works.md:86` (also :87; `spec.md:146`)
- **Finding:** The research-driven edits made spec.md:42/:59 say what the code does — `node_modules/expo/src/winter/runtime.native.ts:40-52` installs `expo/fetch` as the global unless `EXPO_PUBLIC_USE_RN_FETCH` is set, and `winter/fetch/convertFormData.ts:35-36,76` throws `Unsupported FormDataPart implementation` for a `{ uri, name, type }` part — but how-it-works.md:86 still says `fetch` is whatwg-fetch 3.6.20 and that `FormData` accepts `{ uri, name, type }` parts "so a file can be uploaded straight from its URI". The same line says there is no `AbortSignal.timeout`; `winter/AbortSignal.ts:9-14` (`installAbortSignalPatch`, called at `runtime.native.ts:38`) defines both `AbortSignal.timeout` and `AbortSignal.any`, and spec.md:146 repeats the stale reason ("implemented with `AbortController` since `AbortSignal.timeout` is not available in React Native 0.86"). Line 87 lists expo-file-system as "not yet installed"; `node_modules/expo-file-system` 57.0.7 is present as a dependency of `expo`. The decision (manual `AbortController`) still stands, for a reason the spec should state instead: Expo's `timeout()` aborts with a `TimeoutError` reason while `abort()` yields `AbortError`, which the fake and the error taxonomy key on. One more runtime fact for the DECISIONS.md "real path" note: `winter/fetch/fetch.ts:77-83` rejects an aborted request with `FetchError('fetch failed: The operation was aborted.', { cause: signal.reason })`, not a DOMException, so `err.name === 'AbortError'` will not hold on the real transport.
- **Why:** how-it-works.md is the plan's orientation doc; a planner reading :86 can write the `{ uri }` FormData upload the research proved crashes (research.md:1107), or reach for `AbortSignal.timeout` and get a `TimeoutError` the mapping does not expect. Doc and code disagree → the code wins; the doc is the wrong side, and spec.md:146 inherited it.
- **Suggested fix:**
  ```
  how-it-works.md:86 — replace with:
  "**Networking primitives**: on SDK 57 the global `fetch` is `expo/fetch` (`expo/src/winter/runtime.native.ts:40-52`;
  React Native's whatwg-fetch stays only when `EXPO_PUBLIC_USE_RN_FETCH=1`). It honours `AbortSignal` but rejects an
  aborted request with `FetchError` (`fetch failed: The operation was aborted.`, `cause: signal.reason`), not a
  DOMException. Its FormData conversion rejects React Native's `{ uri, name, type }` file part
  (`winter/fetch/convertFormData.ts`: `Unsupported FormDataPart implementation`); a local file goes up through
  expo-file-system's `File.createUploadTask` or as a `File` object. `AbortController` is the abort-controller 3.0.0
  polyfill, and Expo's runtime patches `AbortSignal.timeout` and `AbortSignal.any` onto it (`winter/AbortSignal.ts`);
  `timeout()` aborts with a `TimeoutError` reason."
  how-it-works.md:87 — "expo-file-system 57.0.7 is already installed as a dependency of `expo`, though not declared
  in package.json; expo-image-picker and expo-network are not installed."
  spec.md:146 — replace "implemented with `AbortController` since `AbortSignal.timeout` is not available in
  React Native 0.86" with "implemented with `AbortController` plus `setTimeout` rather than `AbortSignal.timeout`,
  which Expo's runtime does patch in but which aborts with a `TimeoutError` reason; one `AbortError` path keeps the
  fake's abort and the timeout identical and does not depend on the winter patch being present under jest".
  DECISIONS.md real-path note — "expo/fetch rejects an aborted request with `FetchError` whose `cause` is the
  signal's reason; the HTTP transport maps that onto the same timeout error the fake produces."
  ```
- **Needs user:** no

### W2 — Send, Remove, the draft and the leave guard are undefined while a photo is "Preparing"
- **Severity:** WARNING
- **Category:** ambiguity
- **Location:** `/Users/halilibrahimkaya/Documents/econsult/feat-econsult-flow/specs/001-econsult-flow/spec.md:105` (also :44, :125, :131-135, :139)
- **Finding:** Pick-time processing introduces an async state between "picked" and "previewed", and the spec defines only its label. Unstated: whether Send is enabled during it; what the draft holds (nothing yet → `hasPhoto` is false, so after a "Change" the step-1 Home button discards a photo still processing without the confirmation :139 promises; or the original URI → a Send inside the window uploads the multi-megabyte original the downscale exists to prevent); what "Remove photo" does mid-processing (cancel, or the late result re-attaches a photo the patient removed); and what :125 "the last pick wins" means when two processings overlap and finish out of order. The research pipeline was written for an on-submit resize (research.md:1221 "runs once on confirm") and never covers this window; the spec moved it to pick time without specifying it.
- **Why:** Three valid implementations diverge and two can silently drop or replace the patient's photo — Ahmed's scenario (:23, "he must never lose his message because the photo failed" extends naturally to the photo itself). The AC4 tests (SC2) need one defined behaviour. Canon: workflow.md "handle errors explicitly at every level".
- **Suggested fix:**
  ```
  Line 105 — after "shows 'Preparing photo' while the image is downscaled" add:
  "the draft records the photo as soon as it is picked, with status `preparing`, so `hasPhoto` is true from the
  first tap; Send is disabled while a photo is `preparing`, with the reason in its hint; Remove during preparation
  discards the result when it arrives; a newer pick supersedes an older one, so only the latest pick's result is kept."
  Edge Cases, after :125 — "Photo still preparing: Send is disabled with reason; Remove discards the pending
  result; a newer pick supersedes an older one."
  ```
  ```ts
  type DraftPhoto =
    | { status: 'preparing'; pickId: string }
    | { status: 'ready'; pickId: string; uri: string; width: number; height: number };
  // reducer: PHOTO_READY / PHOTO_FAILED are ignored unless action.pickId === state.photo?.pickId
  ```
- **Needs user:** no

### I1 — `processPhoto` has no guard for the picker's documented 0 `width`/`height`
- **Severity:** INFO
- **Category:** coverage
- **Location:** `/Users/halilibrahimkaya/Documents/econsult/feat-econsult-flow/specs/001-econsult-flow/spec.md:127` (also :44, :186)
- **Finding:** Bounding the long edge needs the asset's `width`/`height` to pick which dimension to pass; the SDK 57 picker documents both as possibly 0 (research.md:50), and the research's own pipeline step names the guard (research.md:1224: fall back to `{ width: 1600 }`). :127 "downscaled at pick time to at most 1600 px on the long edge" does not carry it, so a 0 becomes `Math.min(1600, 0)` → resize to 0 → at best the :126 failure path keeps an unbounded original, at worst an empty image.
- **Why:** `src/lib` is in the 100 %-branch tier (:206); the branch must exist to be counted, and the failure path should not be how a documented input is handled.
- **Suggested fix:**
  ```
  Line 127 — append: "when the picker reports a 0 width or height, the long edge is unknown and the resize passes
  `{ width: 1600 }`."
  ```
  ```ts
  const size =
    width > 0 && height > 0
      ? width >= height ? { width: Math.min(1600, width) } : { height: Math.min(1600, height) }
      : { width: 1600 };
  ```
- **Needs user:** no

**Possibly dismissed:** none (one log entry, the spec-gate approval; no dismissals)

**Summary:** All four round-2 flags are resolved in the current text, and the W2 fix is confirmed against the vendored navigator's real ordering (insertion-effect ref, queued dispatch after commit), not just against its own description. The research-driven edits are accurate wherever they touch the runtime — expo/fetch as the global, `File.createUploadTask` present in expo-file-system 57.0.7, RNTL 13 forced by expo-router's synchronous `renderRouter` — and that accuracy is exactly what leaves how-it-works.md:86 as the stale side; correct it first, since the plan reads that doc for orientation, then pin down the "Preparing photo" window so the AC4 tests have one behaviour to assert. Nothing CRITICAL; the spec is ready for the plan after those two edits.
