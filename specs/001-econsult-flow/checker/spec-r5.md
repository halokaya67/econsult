agent_id: a5fc3c6c06d601007
mode: spec · round: 5 · reviewed head: 32db7de (working tree) · previous rounds: checker/spec-r1.md to checker/spec-r4.md · dispatched in the foreground (recorded as completed in flow-dispatches.jsonl)

## Spec-Checker Report — mode: spec

**Verdict:** PASS_WITH_FLAGS

**Reviewed:** 3/3 in-scope files read in full (`specs/001-econsult-flow/spec.md` and `how-it-works.md` from the working tree, `checker/spec-r4.md`; plan.md not opened, out of scope for mode spec; research.md and the brief grepped, not read whole) · diff: n/a (mode spec) · head: 32db7de, working tree `M spec.md`, `M how-it-works.md` (+2 html; 5 untracked plan/checker files); the fix-delta `git diff -U0` on the two docs is 2 files, +10/−8, reviewed line by line · canon cited: workflow.md (Coding Canon: KISS/YAGNI) · searches (local Grep/sed only; Sourcegraph not configured; no cross-repo consumers — standalone take-home repo, spec.md:66): decisions log `wc -l` → 1 entry, `grep -ic dismiss` → 0; `git diff --stat f39fb58..HEAD -- . ':!specs'` → empty (how-it-works snapshot still equals the app); expo `runtime.native.ts:38-53` read → `useRnFetch` :41-42, `install('fetch')` :44-52; `fetch/fetch.ts:74-92` read → :77-78 pre-aborted `FetchError { cause: signal.reason }`, :83-84 `response.abort()` + `request.cancel()`, :90 `createFromError`; `fetch/FetchResponse.ts:180-200` read → :183-189 reason-else-`DOMException('AbortError')`; `AbortError` in `fetch/__tests__/FetchResponse-test.ts` → 5 (:146, :153, :156, :161, :175); `Fetch request has been canceled` in `expo/ios/Fetch` + `android/.../fetch` → 2 (FetchExceptions.swift:13, FetchExceptions.kt:11); `fetch/FetchErrors.ts` read whole → prefix `fetch failed: `, `createFromError` copies `error.cause` (native exception carries none); `convertFormData.ts:33-37,70-78` → :35-36 comment, :77 throw; `AbortSignal.ts:7-15` → :9-14 patch, `TimeoutError` → 1 (:23); `reason` in `abort-controller/dist/abort-controller.js` → 0; `createUploadTask` in `expo-file-system/build/File.d.ts` → 2 (:135 doc, :145 decl), version 57.0.7; `bundledNativeModules.json` → image-manipulator :53 `~57.0.17`, image-picker :54 `~57.0.17`, network :72 `~57.0.2`; brief `photo|attach|upload` → 5 (:45-46, :53, :75, :197); research.md `aspectRatio|asset.width|getSize|width: 1600` → 3 (:221, :1224, :1275), `photo.*width|preview.*height` → 4 (:32 keeps `{ uri, width, height }` "in state for the preview", :50, :937, :1355); spec.md `aspect|preview` → 4 (:44, :57, :105, :186 — no sizing rule anywhere), `AbortError|TimeoutError|signal` → 3 (:42, :59, :147)

| Prior flag | Status | Evidence |
|------------|--------|----------|
| r4 W1 — expo/fetch abort shape mis-stated for the mid-flight path | RESOLVED | how-it-works.md:86 now separates the three shapes: pre-aborted `FetchError(..., { cause: signal.reason })` (`fetch.ts:77-78` confirmed), in-flight cancel `FetchError("fetch failed: Fetch request has been canceled")` with no `cause` (FetchExceptions.swift:13 / .kt:11 via `fetch.ts:90`; `createFromError` copies `error.cause`, which the native exception does not set), post-headers `signal.reason` else `DOMException` `AbortError` (`FetchResponse.ts:183-189`; test :146-153); polyfill has no `reason` (0 hits); `convertFormData.ts:35-36,77` correct; Sources :111 lists the files. spec.md:59 now decides on `signal.aborted` in the helper's catch, not on class or `cause`, and maps any rejection under that signal to the timeout error — matches the runtime. |
| r4 W2 — Preparing block controls unstated | RESOLVED | spec.md:105: once picked, both source actions are replaced by the block state ("Preparing photo" + labelled "Remove photo", then preview + the same button); Remove is the only way to replace and returns the two source actions; the draft records on the picker returning an asset (not the tap); a pick after Remove supersedes via `pickId`. :126 mirrors it (source actions hidden while preparing, Remove shows them again, result ignored unless `pickId` matches). Different route from the r4 suggestion (actions hidden rather than kept), same outcome: one control set per state for the AC4/SC3 tests. Agrees with :44 ("can be removed"), :123 (permission-denied explanation only appears while the actions are shown, i.e. with no photo), :125 (pick → remove → pick, last wins), :140 (`hasPhoto` true from `preparing`). |
| r4 I1 — failed processing state implied | RESOLVED | spec.md:127: failure moves the draft to `ready` with the picker's original `uri`, `width`, `height`, "there is no failed status", dev warning logged. Consistent with the :126 union and :44. |
| r4 I2 — zero-dimension fallback could upscale | RESOLVED | spec.md:128 drops the `{ width: 1600 }` fallback: on a 0 width or height `processPhoto` skips the downscale, keeps the original asset with a dev warning, "the same outcome as a processing failure". No longer relies on the unverified upscale behaviour (research.md:1275). Introduces one follow-on ambiguity — new I2 below. |

| ID | Severity | Category | Location | Finding |
|----|----------|----------|----------|---------|
| I1 | INFO | consistency | spec.md:147 | The timeout rationale still keys on error identity ("aborts with a `TimeoutError` reason; one `AbortError` path keeps the fake's abort and the timeout identical") while :59 now says the helper never inspects the error's class or `cause` |
| I2 | INFO | ambiguity | spec.md:128 | The 0-dimension path and the failure path land a `ready` photo whose `width` or `height` can be 0, and no line says how the preview is sized; the research's stated reason for carrying those fields is the preview |

### I1 — Two stories for how a timeout is recognised
- **Severity:** INFO
- **Category:** consistency
- **Location:** `specs/001-econsult-flow/spec.md:147` (also :59, :42)
- **Finding:** :147 justifies `AbortController` + `setTimeout` over `AbortSignal.timeout` with two reasons: (a) `timeout()` "aborts with a `TimeoutError` reason; one `AbortError` path keeps the fake's abort and the timeout identical", and (b) no dependence on the runtime patch under jest. The round-4 fix to :59 made the timeout helper decide "on its own aborted signal in its catch rather than on the error's class or `cause`". Under that rule, what the abort rejects with — `AbortError` from the fake (:42), `TimeoutError`, `FetchError` — is never inspected, so reason (a) no longer explains anything, and a reader of DECISIONS.md (where :147 and :59 are both headed) gets one paragraph saying the error identity matters and another saying it does not. Reason (b) still stands on its own.
- **Why:** Not a behavioural contradiction — both sentences can be implemented together — but a stale rationale in the decision record, which the brief's reviewer reads before the session. Round 4 introduced the :59 rule through its own suggested fix and did not carry it into :147 (which was itself a round-3 edit written when the class still mattered), so this is fix-delta, not a miss of earlier rounds.
- **Suggested fix:**
  ```
  spec.md:147 — replace "implemented with `AbortController` plus `setTimeout` rather than
  `AbortSignal.timeout`, which Expo's runtime does patch in but which aborts with a `TimeoutError`
  reason; one `AbortError` path keeps the fake's abort and the timeout identical and does not depend
  on the runtime patch being present under jest." with:
  "implemented with `AbortController` plus `setTimeout` rather than `AbortSignal.timeout`: the helper
  owns the controller whose `signal.aborted` it checks in its catch (see The Contract), so neither the
  fake's `AbortError` nor a real transport's `FetchError` is ever inspected, and nothing depends on
  Expo's runtime patch being present under jest."
  ```
- **Needs user:** no

### I2 — A `ready` photo may now carry a 0 dimension, and the preview's sizing rule is unstated
- **Severity:** INFO
- **Category:** ambiguity
- **Location:** `specs/001-econsult-flow/spec.md:128` (also :126, :127, :44)
- **Finding:** :128 keeps the original asset when the picker reports `width` or `height` of 0, "the same outcome as a processing failure", and :127 defines that outcome as `ready` with "the picker's original `uri`, `width` and `height`". So the draft's `{ status: 'ready', pickId, uri, width, height }` (:126) can hold a 0. The spec names those two fields but never says what reads them; the only use on record is research.md:32, which keeps `{ uri, width, height, … }` in state "for the preview". A preview sized from them (`aspectRatio: width / height`, or explicit `width`/`height` style) collapses to zero size or NaN on exactly this path, and the patient sees no photo while Send is enabled and the upload goes ahead. Before round 4 the fallback still ran the manipulator, so `ready` always carried the output's real dimensions; the r4 I2 suggestion offered "keep original" without tracing where the 0 lands — fix-delta.
- **Why:** Rare path (the picker documents 0 as possible, research.md:50), so INFO; but the spec should say either how the preview is sized regardless of the draft's numbers, or that nothing reads `width`/`height` — in which case the fields are speculative and should go (canon: workflow.md, KISS/YAGNI).
- **Suggested fix:**
  ```
  spec.md:126 — after "`{ status: 'ready', pickId, uri, width, height }`" add:
  "; the preview renders at the block's fixed height with `contentFit: 'contain'` and never sizes
  itself from `width`/`height`, so a `ready` photo with a 0 dimension (:127, :128) still shows"
  ```
  Alternative if nothing else reads them: drop `width` and `height` from the `ready` shape at :126 and :127 and keep only `uri`.
- **Needs user:** no

**Possibly dismissed:** none (one log entry, the spec-gate approval; no dismissals)

**Summary:** All four round-4 flags are resolved in the working-tree text and verified against the Expo 57 runtime on disk, and the photo-block edits at :44, :105, :125-128 and :140 now tell one story (source actions replaced once picked, Remove the only way back, `preparing`/`ready` with `pickId`, failure and 0-dimension both landing in `ready` with the original asset). The two leftovers are fix-delta polish, not blockers: align the :147 timeout rationale with the signal-based rule :59 now states, and say how the preview is sized so a 0-dimension `ready` photo cannot render as nothing (the :3 header also still reads "rounds 1 to 3"). Done well: the how-it-works.md:86 runtime paragraph is now precise enough to be copied into DECISIONS.md as-is, with every citation matching the source.
