# Android UI verification — e-consult flow

Date: 2026-09-14. Worktree head `f177213`.

| | |
| --- | --- |
| Device | Android emulator, AVD `Pixel_API_36` (`sdk_gphone64_arm64`, google_apis, no Play Store) |
| OS | Android 16, API 36, build `BE2A.250530.026.F3` |
| Screen | 1080 x 2424 at 420 dpi, gesture navigation |
| Client | Expo Go 57.0.9 (versionCode 444, targetSdk 36) |
| Metro | `npx expo start --android --port 8083`, opened as `exp://10.0.2.2:8083` |
| Project | expo ~57.0.22, react-native 0.86.3, expo-router ~57.0.21 |
| Font scales | 1.0 (default) for the walkthrough, 2.0 (the maximum this emulator accepts) for the sweep |
| Driver | `adb` — `exec-out screencap`, `uiautomator dump`, `input tap/text/keyevent/swipe` |

The blue gear at the top right of every screenshot is Expo Go's own floating dev-tools button, drawn
over the app. It is not part of the app and is ignored throughout.

## Verdict

**DEFECTS at the time of this pass; all three since fixed and re-verified — see
"Re-check after fixes" at the end.** 53 of 56 checks pass. The three Android questions the README singles out all pass: the
system back gesture and the back key both hold on the confirmation screen, the camera action is
correctly absent on the emulator, and edge-to-edge insets are respected on every screen. Two
accessibility defects were found — both TalkBack-only, neither visible to a sighted touch user — plus
one low-severity layout observation. Several checks could not be run at all and are listed as not
verified.

## Checks

### Developer settings

| # | State | Expected | Observed | Verdict | Evidence |
| --- | --- | --- | --- | --- | --- |
| 1 | Home, development mode | "Developer settings" link present | Present, opens a modal | PASS | `01-home-default.png` |
| 2 | Modal opened | Practice / Latency / four faults / Force offline / Apply | All present, header "Cancel" on the left | PASS | `02-devsettings-default.png`, `03-devsettings-bottom.png` |
| 3 | Radio semantics | Each option a radio with a checked state | `android.widget.RadioButton`, `checked=true/false`, accessible name = option label | PASS | `02-devsettings-default.png` |
| 4 | Change practice, latency, a fault, Force offline | Selection follows the tap | Upload-photo fault to Server and Force offline on, both reflected in the tree | PASS | `04-devsettings-edited.png` |
| 5 | Cancel after editing | Settings unchanged | Home has no offline banner; reopening shows every control back at its default | PASS | `05-home-after-cancel.png`, `06-devsettings-after-cancel-reopen.png` |
| 6 | Apply and go home | Applies, clears the cache, returns home | Returns home; the next entry fetches for the chosen practice and the reference counter restarts at `ec-1` | PASS | `37-home-offline.png` |

### The flow, default practice `prc-0421`

| # | State | Expected | Observed | Verdict | Evidence |
| --- | --- | --- | --- | --- | --- |
| 7 | Step 1 pristine | "STEP 1 OF 3", three recipients, Continue disabled | Exactly that; Continue reports `enabled=false` | PASS | `07-step1-pristine.png` |
| 8 | Step 1 radio semantics | Radios with a selected state, one at a time | Three `RadioButton` nodes, names "Dr. J. de Vries, GP" / "M. Bakker, Practice nurse" / "S. Jansen, Practice assistant" | PASS | `07-step1-pristine.png` |
| 9 | Recipient chosen | That card checked, others unchecked, Continue enabled | Exactly that | PASS | `08-step1-selected.png` |
| 10 | Step 2 | "STEP 2 OF 3", one required choice plus one optional free-text | Exactly that; the optional field is an `EditText` named "Are you already taking anything for it? (optional)" | PASS | `09-step2-pristine.png` |
| 11 | Step 2, Continue with nothing answered | Red "This question is required", route unchanged, error folded into the label's accessible name | Exactly that | PASS | `10-step2-required-error.png` |
| 12 | Step 2, answer the question | Error clears | Red text gone from the screen and from the tree; the label's accessible name does not reset | **FAIL — defect 1** | `D1a`, `D1b`, `a11y-choicegroup-stale-label.txt` |
| 13 | Step 3 | "STEP 3 OF 3", To-row with Change, message field plus hint, photo block, Send | Exactly that | PASS | `12-step3-pristine-camera-note.png` |
| 14 | Step 3, camera on an emulator | No "Take a photo"; the note and the library path instead | "The camera isn't available on this device. You can choose a photo from your library." plus "Choose from library". No camera action anywhere in the tree | PASS | `12-step3-pristine-camera-note.png` |
| 15 | Step 3, Send with an empty message | "Please write your question before sending", route unchanged, field still editable | Exactly that; the error is folded into the field's accessible name | PASS | `13-step3-empty-error.png` |
| 16 | Step 3, type a message | Error clears from screen and from the accessible name | Both reset correctly (the contrast case for defect 1) | PASS | `14-step3-typed-keyboard.png` |
| 17 | Step 3 with the keyboard up | Field stays visible, nothing under the status or gesture bar | Field fully visible above the keyboard | PASS | `14-step3-typed-keyboard.png` |
| 18 | Thin message | The "a little more detail" nudge appears | Appears below the field | PASS | `21-thin-message-nudge.png` |
| 19 | Photo via the library path | System picker opens, no permission dialog needed | Android's photo picker opened directly (the Android 13+ picker needs no permission); the picker's own "Expo Go will only have access to the photos you select" notice is the platform's | PASS | `15-photo-picker-system.png` |
| 20 | Photo selected | Preview labelled "Your photo" plus "Remove photo"; "Choose from library" replaced | Exactly that | PASS | `16-photo-attached.png` |
| 21 | Send at Slow (5 s) — the send lock | Change, Choose from library and Send all disabled; "Sending your message"; Send reads "Sending" | Exactly that, and Change, the back key and the back-edge swipe were all no-ops during the window | PASS | `17-sending-locked.png` |
| 22 | Confirmation | "Message sent", "Sent to ...", reply-time line, "Reference: ec-1", "Your photo was attached.", Done | Exactly that; the nav bar reads "Sent" with no back control | PASS | `18-confirmation-photo-attached.png` |
| 23 | Back key on the confirmation | Must not leave | Stays. Tree unchanged | PASS | `19-confirmation-after-back-and-swipe.png` |
| 24 | Back-edge swipe on the confirmation | Must not leave | Stays. Tree unchanged | PASS | `19-confirmation-after-back-and-swipe.png` |
| 25 | Done | Returns home | Home | PASS | `20-home-after-done.png` |

### Failures and offline

| # | State | Expected | Observed | Verdict | Evidence |
| --- | --- | --- | --- | --- | --- |
| 26 | Fail: Create message = Network, then Send | "Your message wasn't sent" plus the network copy plus "Try again"; route unchanged | Exactly that, in a red card; the field stays editable | PASS | `22-create-failure.png` |
| 27 | Try again after a create failure | The same single error, never a second card | One card, identical wording | PASS | `24-create-failure-retry.png` |
| 28 | Error card position | Reachable | The card and both Send / Try again sit below the fold and the screen does not scroll them into view | **Observation — defect 3** | `22-create-failure.png`, `23-create-failure-scrolled.png` |
| 29 | Fail: Upload photo = Server, Send with a photo | Intermediate "Message sent, adding your photo", then the confirmation with the failed line, Try again and Continue without the photo | Exactly that | PASS | `31-sending-adding-photo.png`, `32-partial-photo-failure.png` |
| 30 | Try again on the failed photo | Busy "Attaching your photo", then the "still couldn't be attached" line added once | Exactly that | PASS | `33-photo-retry-failed.png` |
| 31 | Try again a second time | The line stays present exactly once | Layout byte-identical; no duplicate | PASS | `34-photo-retry-twice-no-duplicate.png` |
| 32 | Continue without the photo | Alert gone, Done remains | Exactly that | PASS | `36-continue-without-photo.png` |
| 33 | Force offline on | Banner on home | "You're offline. You can keep writing, but sending needs a connection." | PASS | `37-home-offline.png` |
| 34 | Force offline, steps 1 to 3 | Banner on every step | Present on all three | PASS | `38-step1-offline.png`, `39-step2-offline.png`, `40-step3-offline-send-disabled.png` |
| 35 | Force offline, Send | Disabled even with text typed | `enabled=false` with a full message in the field | PASS | `40-step3-offline-send-disabled.png` |
| 36 | Offline on the confirmation, Try again | Disabled | Link dropped with `svc wifi/data disable` while on a partial-failure confirmation: banner appeared, Try again went `enabled=false`, Continue without the photo and Done stayed enabled | PASS | `35-confirmation-offline-retry-disabled.png` |
| 37 | Back online | Banner clears, Retry re-enabled | Both, within seconds of restoring the link | PASS | `talkback-method-and-counts.txt` |

### Other practices, navigation, form factor

| # | State | Expected | Observed | Verdict | Evidence |
| --- | --- | --- | --- | --- | --- |
| 38 | `prc-0873` | Two recipients, "STEP 1 OF 2", no questions step | "Dr. A. Visser, GP" and "L. Smit, Practice nurse"; Continue goes straight to "STEP 2 OF 2" / "To: Dr. A. Visser" | PASS | `41-prc0873-step1-of-2.png`, `42-prc0873-step2-message.png` |
| 39 | `prc-0873` send | Confirmation | "Sent to Dr. A. Visser." | PASS | `43-prc0873-confirmation.png` |
| 40 | `prc-0000` | Empty state plus "Back to start" | "Your practice hasn't switched on e-consults in the app yet" / "You can still phone the practice with your question." / "Back to start" returns home | PASS | `44-prc0000-empty-state.png` |
| 41 | Back key from step 3 | — | Goes to step 2, no dialog. This is the design: `useDiscardGuard` is mounted on step 1 only, so the guard fires when leaving the flow, not when moving inside it. The draft survives | PASS (by design) | `25-back-from-step3-goes-to-step2.png` |
| 42 | Back key from step 1 with a draft | "Discard your message?" / "Your message and photo will be lost." with Keep writing / Discard | Exactly that. Android's AlertDialog renders the labels uppercase — platform styling, not app copy | PASS | `26-discard-dialog-back-key.png` |
| 43 | Home header button from step 1 with a draft | The same dialog | The same dialog | PASS | `27-discard-dialog-home-button.png` |
| 44 | Keep writing | Draft kept | Walked forward: the recipient still checked and the message text byte-identical | PASS | — |
| 45 | Discard (Home button variant) | Leaves to home, next entry is fresh | Home; the next Write shows three unchecked recipients, Continue disabled, empty message | PASS | `28-home-after-discard.png`, `29-step1-fresh-after-discard.png` |
| 46 | Discard (back key variant) | Leaves to home | Home | PASS | `30-home-after-discard-back-key.png` |
| 47 | Not-found route (`exp://10.0.2.2:8083/--/nowhere`) | "Page not found" screen with a way home | Correct copy, and the link works when tapped, but it is not an actionable accessibility node | **FAIL — defect 2** | `45-not-found-route.png`, `D2`, `a11y-not-found-link.txt` |
| 48 | Rotation to landscape on the message step | — | The app stays portrait. `app.json` declares `"orientation": "portrait"` and Expo Go honours it: with `user_rotation=1` and `accelerometer_rotation=0` the app window stayed `mDisplayRotation=ROTATION_0`. Landscape is not reachable, by design | PASS (by design) | `46-rotation-locked-portrait.png` |
| 49 | Edge-to-edge, status bar | No content under it | Every screen's content starts below the status bar; the native header is inset correctly | PASS | all screenshots |
| 50 | Edge-to-edge, gesture navigation bar | No content under it | Primary actions ("Apply and go home", "Send", "Done", "Continue") clear the gesture pill on every screen, including the longest scroll views | PASS | `03-devsettings-bottom.png`, `52-fs2-devsettings-bottom.png` |

### Largest font scale (`font_scale 2.0`, app relaunched)

`settings put system font_scale 2.0` was accepted — no fallback to 1.3 was needed.

| # | State | Expected | Observed | Verdict | Evidence |
| --- | --- | --- | --- | --- | --- |
| 51 | Home | Nothing clipped or overlapping | Copy reflows to four lines, all controls reachable | PASS | `50-fs2-home.png` |
| 52 | Developer settings | Nothing clipped or overlapping | Every group and the Apply button render cleanly; the header's "Cancel" stays compact because header buttons cap at 1.3x | PASS | `51-fs2-devsettings-top.png`, `52-fs2-devsettings-bottom.png` |
| 53 | Step 1 | Cards stack, nothing clipped | Clean; the radio indicator stays aligned right | PASS | `53-fs2-step1.png` |
| 54 | Step 2 with the required error, Continue pressed from the bottom of the page | The offending field and its error scroll into view | Both scroll to the top of the viewport, with the red error directly under the label | PASS | `54-fs2-step2-top.png`, `55-fs2-step2-error-scrolled-into-view.png` |
| 55 | Step 3 with the empty-message error, Send pressed from the bottom | The field and its error scroll into view | Both scroll into view; the field gains a red border | PASS | `56-fs2-step3-top.png`, `57-fs2-step3-error-scrolled-into-view.png` |
| 56 | Step 3 with a photo, confirmation, offline banner | Nothing clipped or overlapping | Preview, "Remove photo" and Send all clean; the confirmation fits without scrolling; the offline banner wraps to three lines inside its box | PASS | `58-fs2-step3-photo.png`, `59-fs2-confirmation.png`, `60-fs2-home-offline.png` |

## Defects

### 1 — MEDIUM · Questions step · a corrected choice question keeps announcing its old error

**FIXED — re-verified 2026-09-14.** `ChoiceGroup` now names its label unconditionally, and the stale
`Error:` no longer survives the correction. See "Re-check after fixes".

**What a user sees.** Nothing, if they can see. With TalkBack on, a patient who leaves the required
question blank, hears "Error: This question is required", then answers it correctly, still hears
"How long have you had this problem? (required). Error: This question is required" every time that
label is focused — for the rest of the screen's life. The red error text has already disappeared, so
the spoken state and the visible state disagree and there is no way to make it stop.

**Repro** (font scale 1.0, `prc-0421`):

1. Home, then Write to your practice, pick any recipient, Continue.
2. On step 2, press Continue without answering. The red "This question is required" appears and the
   label's `content-desc` becomes
   `How long have you had this problem? (required). Error: This question is required`.
3. Answer the question. The red text disappears from the screen and from the accessibility tree.
4. `adb shell uiautomator dump` — the label's `content-desc` is unchanged.

Persists across a re-dump after 3 s, across selecting a different option, and across a scroll that
forces re-layout.

**Why.** `src/components/ChoiceGroup.tsx` passes
`accessibilityLabel={error ? accessibleName(visibleLabel, error) : undefined}`. React Native on
Android does not clear a previously set `contentDescription` when the prop goes back to `undefined`.
`src/components/TextField.tsx:61` passes `accessibilityLabel={accessibleName(visibleLabel, error)}`
unconditionally — `accessibleName()` returns the plain label when `error` is falsy — so the text field
resets correctly, which is why the message step does not have this bug. Verified as the contrast case
in check 16.

Screenshots `D1a-choicegroup-error-shown.png`, `D1b-choicegroup-error-cleared-stale-label.png`; full
trees in `a11y-choicegroup-stale-label.txt`.

### 2 — MEDIUM · Not-found screen · the only way out is invisible to TalkBack

**FIXED — re-verified 2026-09-14.** The escape is now an `android.widget.Button` with a click action
and an accessible name. See "Re-check after fixes".

**What a user sees.** A sighted user taps "Go to the home screen" and it works. A TalkBack user hears
it as plain text with no role and no "double-tap to activate" — and because the node exposes no click
action, it is skipped entirely when swiping between controls. On a screen whose whole purpose is to
offer an escape, the escape is not announced as one.

**Repro:**

```
adb shell am start -a android.intent.action.VIEW -d "exp://10.0.2.2:8083/--/nowhere"
adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml
```

The node is `class="android.view.View"`, `clickable="false"`, `content-desc=""`. Every other action in
the app is an `android.widget.Button` with `clickable="true"` and an accessible name.

**Why.** `src/app/+not-found.tsx` uses a bare expo-router `<Link>` styled as text, with no
`accessibilityRole` and no pressable wrapper. Elsewhere the app routes every action through
`TextButton` / `PrimaryButton`, which is what gives those the role and the click action.

Screenshots `45-not-found-route.png`, `D2-not-found-link-not-actionable.png`; raw node in
`a11y-not-found-link.txt`.

### 3 — LOW · Message step · after a failed send, both recovery buttons are off-screen

**FIXED — re-verified 2026-09-14.** The step now scrolls the error card into view and moves
screen-reader focus to it, so the card, Try again and Send all land inside the viewport. See
"Re-check after fixes".

**What a user sees.** The patient presses Send, the request fails, and the error card is inserted
above the Send button. At the default font scale the card's heading and body land at the very bottom
edge and both "Try again" and "Send" are pushed below the fold; the view does not scroll. The feedback
is visible enough to notice, but the user has to scroll to act on it.

**Repro:** Developer settings, Fail: Create message = Network, Apply, walk to step 3, type a message,
Send.

Not Android-specific as far as this run can tell — the same insertion order would do the same on iOS,
and the iPhone lane did not flag it. Recorded as an observation rather than a regression. Screenshots
`22-create-failure.png` (as it lands) and `23-create-failure-scrolled.png` (after scrolling).

## TalkBack

**Available: yes.** The google_apis image does ship the Android Accessibility Suite
(`com.google.android.marvin.talkback`), contrary to the expectation in the dispatch. It was enabled
through `settings put secure enabled_accessibility_services` / `accessibility_enabled 1`, confirmed
bound and speaking via `dumpsys accessibility`, and disabled again at the end. **Nothing was
sideloaded.**

**The utterance text could not be captured.** `adb logcat -s TalkBack` yields nothing — the shipped
TalkBack is a release build with its logging stripped, and forcing `pref_log_level=2` into its
device-protected prefs as root and restarting the service changed nothing. The spoken string does not
appear in any logcat buffer. The only trace of an utterance is
`I/GoogleTTSServiceImpl: Synthesis request ...`, one line per utterance, without the text. So every
figure below is a **count**, calibrated first:

- one `announceForAccessibility()` produces exactly **1** synthesis request, regardless of sentence
  count (proved twice: the two-sentence offline message and the three-sentence error-card message
  each produced exactly one);
- a TalkBack **focus** event on a composed control is several requests (name, role and hint are
  separate utterances) — focusing the message field alone is 3.

| Message | Utterances | Reading |
| --- | --- | --- |
| Offline banner appears | **1** | Spoken once. `OfflineBanner` is deliberately not a live region and the provider announces — no double-speak. PASS |
| Back online | 1 | Spoken once; banner cleared and Retry re-enabled. PASS |
| Create-failure error card appears | **1** | The announcement lands alone 3 s after the Send, clear of the activation chatter. `ErrorState` announces in an effect and the alert is not a live region — no double-speak. PASS |
| Sending status | 2 at the moment of activation, 13 ms apart | One is TalkBack reporting the button's own change to "Sending, busy", one is `announce("Sending your message")`. Not separable without the text. PARTIAL |
| Validation error on the message step | **3** — identical to the 3 for focusing the errored field with no new validation | Equal totals mean `announce()` adds no extra pass: the focus change collapses the queued announcement, so the error is heard once, as part of the field's accessible name. PASS, inferred from counts |
| Photo-failed line on the confirmation | **3** across the whole Send-to-confirmation transition (activation, "Message sent, adding your photo", then the confirmation's heading focus plus `PHOTO_FAILED`) | A live region plus an announcement would have produced more. No double-speak. PASS |

Method and raw timestamps in `talkback-method-and-counts.txt`.

## Not verified

- **The wording of any TalkBack utterance.** Counts only, for the reason above. The wording itself was
  read from the accessibility tree (`content-desc`), which is where it actually lives for field labels
  and alerts, but nothing was confirmed by hearing it.
- **`accessibilityHint` values.** The spoken hints on a disabled Send / Retry (`OFFLINE_HINT`) and a
  disabled Continue (`CONTINUE_HINT`) are not exposed by `uiautomator` for these nodes and the spoken
  text is not capturable. Present in source; never heard. The disabled state they explain was verified
  in checks 7, 35 and 36.
- **The step 1 loading state.** With the default 2 s config latency the home screen's prefetch always
  won, and at Slow the care team was already cached, so the `LoadingCards` skeleton never rendered
  long enough to capture. The loading path itself is not in doubt — the slow send held its busy state
  for the full 5 s — but there is no screenshot of it.
- **The practice-config and care-team fault states.** Only the create-message and upload-photo faults
  were exercised; the two fetch faults (and so the `ErrorState` on step 1) were not.
- **Camera capture.** Impossible here by design: `expo-device` reports no real device on an emulator,
  so the app shows the note instead. That absence is check 14 and it passes; the capture path still
  needs a phone.
- **Landscape layout.** Not reachable — the app is locked to portrait by `app.json`.
- **Predictive back.** `app.json` sets `"predictiveBackGestureEnabled": false`, so the Android 14+
  predictive-back animation was not exercised; only the classic back gesture and back key were, and
  both behave correctly.
- **Multi-window / split screen, dark mode, and a real device.** Out of scope for this pass.

## Logs and crashes

No crash, no app-originated LogBox, no red box, and no Metro warning beyond the bundle lines. The one
LogBox that appeared was Expo Go's own "Cannot connect to Expo CLI" warning, caused deliberately by
dropping the emulator's network to test the offline state on the confirmation screen; it cleared on
reload. Full environment and end-of-run state in `setup.log`.

## State left behind

`font_scale` back to 1.0, TalkBack disabled (`accessibility_enabled 0`, service list cleared),
rotation back to automatic, Developer settings back at `prc-0421` / Latency Default / all faults None
/ Force offline off. The emulator is left running.

## Re-check after fixes

Date: 2026-09-14, same emulator and the same Expo Go build, Metro still on port 8083. Expo Go was
force-stopped and relaunched so the three fixes were loaded as a cold bundle, not a hot reload. All
three defects were re-driven with their original repro steps, and the happy path was walked once more
at `font_scale 2.0`.

| Defect | Expected after the fix | Observed | Verdict | Screenshots |
| --- | --- | --- | --- | --- |
| 1 — stale choice-question error | After the required question is answered, the label's `content-desc` equals the plain label with its `(required)` suffix and contains no `Error:` | Pristine: `How long have you had this problem? (required)` (named even before any validation, which it was not before). After Continue with nothing answered: `... (required). Error: This question is required`. After answering: back to `How long have you had this problem? (required)`, with the red row gone from the screen and from the tree. Unchanged after a 3 s re-dump, after selecting a different option, and after a scroll that forces re-layout | **PASS** | `R1a-choicegroup-error-shown.png`, `R1b-choicegroup-error-cleared-label-reset.png`, tree in `R1-choicegroup-label-reset.txt` |
| 2 — not-found escape not actionable | The home action is an `android.widget.Button`, `clickable=true`, with an accessible name, and tapping it lands on home | `[android.widget.Button] clickable=true enabled=true bounds=[42,578][1038,704] desc='Go to the home screen'` — was `android.view.View`, `clickable=false`, `content-desc=""`. The box is 126 px at 420 dpi = 48 dp, so it also clears the 48-point minimum. Tapped it: the home screen, and the header's back arrow is gone, so `router.dismissTo("/")` left no not-found entry on the stack | **PASS** | `R2a-not-found-home-button.png`, `R2b-home-after-not-found-button.png`, tree in `R2-not-found-button.txt` |
| 3 — recovery buttons off-screen after a failed send | Without any scrolling, the error card, "Try again" and "Send" are all inside the viewport, and screen-reader focus moves to the card | The view scrolls itself: the "Your message" heading is clipped at the top, which it was not before the Send. Card `[84,1647][996,1899]`, Try again `[84,1941][996,2067]`, Send `[42,2172][1038,2298]` — all three end above y=2424 and Send still clears the gesture pill. With TalkBack on, the green accessibility-focus rectangle is drawn at x≈82–992, y≈1614–1885, i.e. exactly the alert View, not the Send button that was double-tapped | **PASS** | `R3a-step3-before-send.png`, `R3b-create-failure-card-in-view.png`, `R3c-talkback-before-send.png`, `R3d-talkback-focus-on-error-card.png`, notes in `R3-error-card-reveal.txt` |
| Regression sweep, `font_scale 2.0` | The questions → message → confirmation happy path still renders with nothing clipped or overlapping | Questions step reflows to two-line labels with the radio cards intact; the message step wraps the hint to three lines and keeps the field and the photo block clean; the confirmation fits without scrolling, reads "Message sent" / "Sent to Dr. J. de Vries." / "Reference: ec-1" / Done, with the nav bar at "Sent" and no back control | **PASS** | `R4a-fs2-questions.png`, `R4b-fs2-message.png`, `R4c-fs2-confirmation.png` |

`dumpsys accessibility` reports accessibility focus only at window granularity
(`Accessibility Focused Window Id = 2134`, the Expo Go window) and never names the focused node, so
defect 3's focus evidence is TalkBack's own focus highlight in `R3d`, read against the node bounds
from the same dump.

### One new observation, not from these fixes

A single LogBox appeared on one cold launch, on the home screen:

> Can't perform a React state update on a component that hasn't mounted yet. This indicates that you
> have a side-effect in your render function that asynchronously tries to update the component.

Its call stack is entirely inside `node_modules`: `url.then$argument_0` at
`expo-router/build/fork/useLinking.native.js:127` calling `dispatchSetState` on `ContextNavigator`
(`expo-router/build/ExpoRoot.js:135`), under `ExpoRoot` → `App` → `WithDevTools`. No application
frame appears anywhere in it, and none of the three fixes touches router linking or the root
navigator. It is expo-router's `getInitialURL()` promise resolving before the navigator has mounted,
a race that only a deep-link cold start can lose. It did **not** reproduce on two further cold
launches of the same bundle, so it is intermittent rather than deterministic. Whether it also
occurs on the pre-fix code was not bisected: that would mean editing `src/`, which this pass was
explicitly barred from doing. Recorded as an observation against expo-router, not as a defect of
this feature.

### State left behind

`font_scale` back to 1.0 (verified `1.0`), TalkBack disabled — `enabled_accessibility_services`
deleted (reads `null`), `accessibility_enabled 0`, and `dumpsys accessibility` shows
`Bound services:{}` with `touchExplorationEnabled=false`. Developer settings back at `prc-0421` with
Fail: Create message returned to None. The emulator and Metro are left running.
