agent_id: a1d4098bff5172cf9
mode: spec · round: 4 · reviewed head: 32db7de (working tree) · previous rounds: checker/spec-r1.md, checker/spec-r2.md, checker/spec-r3.md

All verification is in; no further reads are needed. Evidence summary before the report:

- Round-3 fixes hold against the runtime: `runtime.native.ts:41-52` installs `expo/fetch` unless `EXPO_PUBLIC_USE_RN_FETCH`; `convertFormData.ts:35,77` rejects the `{ uri }` part and (`:71-75`) accepts a `Blob` or a `bytes()`-bearing `File`; `AbortSignal.ts:9-14` patches `timeout`/`any`; expo-file-system 57.0.7 comes from `expo/package.json:85` and `File.d.ts:145` declares `createUploadTask`; `abort-controller` 3.0.0 is what `setUpXHR.js:38-43` installs.
- One clause the W1 fix introduced is wrong for the path that matters: the abort-controller 3.0.0 polyfill has no `reason` property (0 hits), Expo's patch sets `reason` only for its own `timeout()`/`any()` (`AbortSignal.ts:108-114`), and a mid-flight abort goes through `fetch.ts:83` → `FetchResponse.ts:183-189`, which errors the body read with a `DOMException(..., 'AbortError')` — Expo's own test asserts exactly that (`FetchResponse-test.ts:146-153`) — while a pre-header cancel surfaces as `FetchError('fetch failed: Fetch request has been canceled')` with `cause` undefined (`ios/Fetch/FetchExceptions.swift:11-13`, `android/.../NativeResponse.kt:78-79`, wrapped at `fetch.ts:90`).
- Decisions log: 1 entry (2026-09-11T17:30:19Z, phase `spec`, "Spec gate" approval); `grep -in dismiss` → 0. HEAD 32db7de; spec.md and how-it-works.md modified in the working tree (reviewed as instructed); `git diff --stat f39fb58..HEAD -- . ':!specs'` is empty, so the how-it-works snapshot is still the current app.

## Spec-Checker Report — mode: spec

**Verdict:** PASS_WITH_FLAGS

**Reviewed:** 6/6 in-scope files read in full (spec.md and how-it-works.md from the working tree, checker/spec-r3.md, the brief `case-study-mobile.md`, package.json, .gitignore; spec-r1/r2 not opened, history not needed; plan.md not opened, out of scope for mode spec) · diff: n/a (mode spec) · head: 32db7de, working tree: `M specs/001-econsult-flow/spec.md`, `M specs/001-econsult-flow/how-it-works.md` (+2 html, 4 untracked plan/checker files) · canon cited: workflow.md (Coding Canon "Errors & inputs — handle errors explicitly at every level"; KISS/YAGNI) · searches (local Grep only, Sourcegraph not configured; no cross-repo consumers — standalone take-home repo per brief:10): decisions log `dismiss` → 0, entries → 1; `installAbortSignalPatch|useRnFetch|install('fetch'` in expo/src/winter/runtime.native.ts → 5 (:10, :35, :41, :44, :52); `uri. is not supported|Unsupported FormDataPart` in winter/fetch/convertFormData.ts → 2 (:35, :77); `aborted|abort(|FetchError` in winter/fetch/fetch.ts → 6 (:77-78 pre-aborted branch, :83 `response.abort(signal?.reason)`, :90 `createFromError`); winter/fetch/FetchErrors.ts read whole → prefixes `fetch failed: `; `abort|reject|cause` in winter/fetch/FetchResponse.ts → 12 (`abort()` :183-199); `reason` in abort-controller/dist/abort-controller.js → 0; `reason` in winter/AbortSignal.ts → 7 (:23 TimeoutError, :108-114 `abortWithReason` for `timeout`/`any` only); `cancel` in expo/ios/Fetch → 12 (FetchExceptions.swift:11-13, NativeRequest.swift:34-36); `cancel` in expo/android/.../fetch → 13 (NativeResponse.kt:78-79); `abort` in winter/fetch/__tests__ → 14 (FetchResponse-test.ts:146-153, :178-184); expo-file-system version → 57.0.7, `"expo-file-system"` in expo/package.json → 1 (:85 `~57.0.7`), `createUploadTask` in expo-file-system/build/File.d.ts → 2 (:145 decl); abort-controller version → 3.0.0, `AbortController|abort-controller` in react-native/Libraries/Core/setUpXHR.js → 3 (:38-43); expo-router peerDependenciesMeta → gesture-handler, reanimated, react-native-web, react-dom all `optional: true` (the :81 removals are safe); `getSize` in react-native/Libraries/Image → 12 (Image.ios.js:33-38, Image.android.js:44-49); research.md `width: 1600|upscal|may be 0` → 5 (:1224 fallback, :1275 upscaling unverified); `preparing|pick time|on confirm` → 4 (:1221 "runs once on confirm"); `remove photo|supersed|pickId` → 2 (neither about the photo); `change photo|retake|preview.*remove` → 1 (:935); `git diff --stat f39fb58..HEAD -- . ':!specs'` → empty

| Prior flag | Status | Evidence |
|------------|--------|----------|
| r3 W1 — how-it-works.md:86 / spec.md:146 stale against the Expo 57 runtime | RESOLVED | how-it-works.md:86-87 now name `expo/fetch` as the global (`runtime.native.ts:41-52` confirmed), the `{ uri, name, type }` rejection (`convertFormData.ts:35,77`), `File.createUploadTask` (`File.d.ts:145`; 57.0.7 via `expo/package.json:85`), the `AbortSignal.timeout`/`any` patch (`AbortSignal.ts:9-14`), abort-controller 3.0.0 (`setUpXHR.js:38-43`); Sources :110-111 list the files; spec.md:147 carries the TimeoutError-reason rationale. One clause of the new text is over-specific for the timeout path — new W1 below. |
| r3 W2 — Send, Remove, draft and leave guard undefined while preparing | RESOLVED | spec.md:105 and :126 define `DraftPhoto` as `preparing`/`ready` with `pickId`, Send disabled with reason, Remove discarding the pending result, newer pick superseding, pickId-matched results; :140 guard uses `hasPhoto`, which :105 makes true from the pick. Consistent with the Contract (app-internal, no contract change), SC2/SC7 and the Reuse Map (`processPhoto` in `src/lib`). Which controls the Preparing block shows is still unstated — new W2 below. |
| r3 I1 — no guard for the picker's 0 width/height | RESOLVED | spec.md:128 names the fallback `{ width: 1600 }` as a branch of `processPhoto`. The fallback relies on library behaviour the research marks unverified — new I2 below. |

| ID | Severity | Category | Location | Finding |
|----|----------|----------|----------|---------|
| W1 | WARNING | consistency | how-it-works.md:86 | "FetchError with cause = signal.reason, not a DOMException" describes only the pre-aborted branch; a mid-flight abort (the timeout) yields an `AbortError` DOMException or a FetchError with no cause, and spec.md:59 builds the real-transport mapping on the wrong claim |
| W2 | WARNING | ambiguity | spec.md:105 | The "Preparing photo" block's controls are unstated: the first sentence attaches Remove to the preview, the second needs Remove and both source actions during preparation |
| I1 | INFO | ambiguity | spec.md:126 | The union has no failed member and no line says where a failed result lands (`ready` with the original asset is the only consistent reading) |
| I2 | INFO | coverage | spec.md:128 | The `{ width: 1600 }` fallback is the one path that can ask the manipulator to upscale; research.md:1275 marks that behaviour unverified |

### W1 — expo/fetch abort shape is mis-stated for the mid-flight (timeout) path
- **Severity:** WARNING
- **Category:** consistency
- **Location:** `specs/001-econsult-flow/how-it-works.md:86` (also `spec.md:59`)
- **Finding:** The bullet says expo/fetch "honours `AbortSignal` but rejects an aborted request with a `FetchError` (..., `cause` set to the signal's reason), not a DOMException", and spec.md:59 turns that into the real-transport rule ("a real HTTP transport would map that onto the same timeout error"). That is `fetch.ts:77-78` only — the signal already aborted before the call. A timeout aborts mid-flight, which is `fetch.ts:83-84`: `response.abort(signal?.reason)` then `request.cancel()`. On device `AbortController` is abort-controller 3.0.0 (`setUpXHR.js:38-43`), which defines no `reason` (0 hits in `dist/abort-controller.js`); Expo's patch sets `reason` only inside its own `timeout()`/`any()` (`AbortSignal.ts:108-114`), so a plain `controller.abort()` leaves `signal.reason` undefined. `FetchResponse.ts:183-189` then errors the body read with `new DOMException('The operation was aborted.', 'AbortError')`, and Expo's own test asserts `rejects.toMatchObject({ name: 'AbortError' })` (`FetchResponse-test.ts:146-153`). If the cancel lands before headers, the native side emits `FetchRequestCanceledException` ("Fetch request has been canceled", `ios/Fetch/FetchExceptions.swift:11-13`, `android/.../fetch/NativeResponse.kt:78-79`), which `fetch.ts:90` wraps as `FetchError('fetch failed: Fetch request has been canceled')` with `cause` undefined. Neither shape has `cause === signal.reason`, and one of them is precisely the DOMException the sentence rules out. The same bullet cites the throw at `convertFormData.ts:76`; it is at `:77`.
- **Why:** Doc and code disagree; the doc is the wrong side. The sentence is headed for DECISIONS.md (the reviewer reads it before the session), and a transport written from it (`err instanceof FetchError && err.cause === signal.reason`) misses both real shapes, so a timeout surfaces as a generic network error while :155 distinguishes the two. Round 3 missed it because it verified `fetch.ts:77-83` (the pre-aborted branch) and did not follow `response.abort()` into `FetchResponse.ts` or `request.cancel()` into the native exception. (canon: workflow.md "handle errors explicitly at every level")
- **Suggested fix:**
  ```
  how-it-works.md:86 — replace "It honours `AbortSignal` but rejects an aborted request with a `FetchError`
  ("fetch failed: The operation was aborted.", `cause` set to the signal's reason), not a DOMException." with:
  "It honours `AbortSignal`, but the rejection's shape depends on timing: a signal already aborted before the
  call throws `FetchError('fetch failed: The operation was aborted.', { cause: signal.reason })`
  (`expo/src/winter/fetch/fetch.ts:77-78`); an abort while the request is in flight cancels the native task,
  which rejects a pending `start()` as `FetchError('fetch failed: Fetch request has been canceled')` with no
  `cause`, or, once headers have arrived, rejects the body read with `signal.reason` if set and otherwise a
  `DOMException` named `AbortError` (`FetchResponse.ts:183-189`, asserted by Expo's own tests). The
  abort-controller 3.0.0 polyfill has no `signal.reason`; only Expo's `timeout()`/`any()` set one."
  Same bullet: `convertFormData.ts:35-36,76` → `convertFormData.ts:35-36,77`.

  spec.md:59 — replace "Expo's `fetch` rejects an aborted request with a `FetchError` whose `cause` is the
  signal's reason, so a real HTTP transport would map that onto the same timeout error the fake produces." with:
  "Expo's `fetch` surfaces an abort as a `FetchError` or, mid-body, as an `AbortError` DOMException depending on
  timing, so a real HTTP transport decides on `signal.aborted` in its catch, not on the error's class or
  `cause`, and maps any rejection under an aborted timeout signal onto the same timeout error the fake produces."
  ```
- **Needs user:** no

### W2 — What the "Preparing photo" block shows is unstated, and the two sentences at :105 pull apart
- **Severity:** WARNING
- **Category:** ambiguity
- **Location:** `specs/001-econsult-flow/spec.md:105` (also :44, :125)
- **Finding:** The first sentence reads "shows 'Preparing photo' while the image is downscaled, then the preview with a labelled 'Remove photo' button" — Remove arrives with the preview. The next sentence needs it earlier: "Remove during preparation discards the result when it arrives; a newer pick supersedes an older one" is reachable only if the Remove button and both source actions ("Take a photo", "Choose from library") stay on screen while preparing. Whether the source actions remain visible once a photo is `ready` is not stated anywhere either (:125 describes only pick → remove → pick). Same sentence: "`hasPhoto` is true from the first tap" — the tap opens the picker, and :122 says a cancelled picker leaves the draft unchanged, so the record point is the picker returning an asset, not the tap.
- **Why:** Two valid builds: (a) the Preparing block is a label only and the source actions hide while a photo exists — then "Remove during preparation" and "a newer pick supersedes" are reducer-only behaviours with no UI path, and the AC4 screen tests cannot exercise them; (b) the block keeps Remove and the source actions. SC3's accessibility-first queries (`getByRole('button', { name: 'Remove photo' })`) need one answer per state. Round 3 introduced the overlapping-pick window; before it there was no state in which a second pick could overlap a first, so this is a fix-delta gap rather than one the earlier rounds saw.
- **Suggested fix:**
  ```
  spec.md:105 — replace "shows 'Preparing photo' while the image is downscaled, then the preview with a
  labelled 'Remove photo' button. The draft records the photo as soon as it is picked, with status `preparing`,
  so `hasPhoto` is true from the first tap;" with:
  "while the image is downscaled the block shows 'Preparing photo' in place of the preview, and once it is
  ready, the preview; in both states a labelled 'Remove photo' button and the two source actions stay
  available, so a patient can replace a photo without removing it first. The draft records the photo as soon
  as the picker returns an asset, with status `preparing`, so `hasPhoto` is true before processing finishes;"
  ```
- **Needs user:** no

### I1 — Where a failed processing result lands is implied, not stated
- **Severity:** INFO
- **Category:** ambiguity
- **Location:** `specs/001-econsult-flow/spec.md:126` (also :127, :44)
- **Finding:** :126 defines `photo` as `preparing | ready` and says "a ready or failed result is ignored unless its `pickId` matches"; :127 and :44 say that on failure "the original asset is kept". The union has no failed member, so the only consistent reading is that a failed result transitions to `ready` carrying the picker's original `uri`, `width`, `height` — but no line says so, and the reducer test for the failed action (100 % branches on `src/features`, SC7) needs its expected state written down.
- **Why:** A planner may add a third status to distinguish "original kept" from "downscaled", which changes the preview, the Send hint and the upload path for no spec'd reason.
- **Suggested fix:**
  ```
  spec.md:127 — "Photo processing fails: the draft moves to `ready` with the picker's original `uri`, `width`
  and `height` (there is no failed status), and a development warning is logged."
  ```
- **Needs user:** no

### I2 — The 0-dimension fallback is the one path that can upscale
- **Severity:** INFO
- **Category:** coverage
- **Location:** `specs/001-econsult-flow/spec.md:128` (also research.md:1224, :1275)
- **Finding:** `{ width: 1600 }` on an image whose real width is below 1600 asks the manipulator to enlarge it. research.md:1275 marks "whether resize() upscales" as unverified and says the `Math.min(1600, asset.width)` guard "sidesteps this rather than relying on library behaviour"; the :128 fallback is exactly the branch that does rely on it. Whether expo-image-manipulator upscales is training-data recall, not verified (the package is not installed).
- **Why:** On the rare 0-dimension picker result, a small photo could come back larger than it went in — the opposite of the step's purpose. Low stakes, so INFO; stated here because the research's own caveat contradicts the line.
- **Suggested fix:**
  ```
  spec.md:128 — replace "the long edge is unknown and the resize passes `{ width: 1600 }`." with:
  "the long edge is unknown; `processPhoto` reads the real dimensions with React Native's `Image.getSize(uri)`
  and applies the same long-edge rule, and if that read fails it takes the processing-failure path (original
  kept, development warning)."
  ```
  `Image.getSize` is present in RN 0.86.3 (`Libraries/Image/Image.ios.js:33-38`, `Image.android.js:44-49`); that it resolves `file://` URIs from the picker is training-data recall, not verified here. Alternative with no new code: keep `{ width: 1600 }` and add "may enlarge a small image on this path" so the trade-off is on record.
- **Needs user:** no

**Possibly dismissed:** none (one log entry, the spec-gate approval; no dismissals)

**Summary:** All three round-3 flags are resolved in the working-tree text, and the fixes are consistent with the Contract, the step-3 description, the Success Criteria and the Reuse Map. The one regression the fix-delta introduced is W1: the new runtime sentence generalises the pre-aborted branch of expo/fetch to the timeout path, where the real shapes are an `AbortError` DOMException or a cause-less `FetchError` — correct it first, since it is headed for DECISIONS.md, then pin down the Preparing block's controls (W2) so the AC4 screen tests have one state to assert. Done well: the fake rejecting with its own `AbortError` (:42, :147) is exactly right, because the device polyfill has no `signal.reason` while jest's Node `AbortController` does, so nothing in the shipped path depends on either.
