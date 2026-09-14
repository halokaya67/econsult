# Accessibility verification — e-consult flow on a physical iPad

## Environment

| | |
|---|---|
| Device | iPad Air 11-inch (M3), physical |
| OS | iOS 27.0 |
| App | the e-consult flow running in Expo Go |
| Practice fixture | developer-settings default `prc-0421`: three recipients, two questions (one required single-choice, one optional free text) |
| How settings were applied | every option was switched on in the iPad's own Settings app and screenshotted there as proof before the pass ran, then switched off again |

Evidence is a screenshot per state plus the iOS accessibility tree for each state, from which
accessible names, roles, enabled state and element frames are read. For VoiceOver, the spoken text is
transcribed from the on-screen caption panel.

## A correction to the earlier text-scaling finding

An earlier pass reported that the flow's step screens ignore the system text size, and that at the
default size the `Continue` button is pushed below the fold. **Both claims were wrong, and this pass
withdraws them.**

The cause was a measurement error rather than an app behaviour. The iPad's system setting — Settings →
Accessibility → Display & Text Size → Larger Text — had *Larger Accessibility Sizes* switched on with
the slider at its maximum throughout, while the earlier pass varied a per-app Dynamic Type override
instead. Its "default text" pass and its "largest text" pass were therefore run at the same real size,
which is why they produced identical frames.

Driving the real system slider settles it: every screen scales. The screenshots the earlier pass filed
under `defaulttext-*` were captured at the largest size despite their name and have been removed from
this folder; the captures here are named `default-*` and `largest-*`, each taken with the slider
position confirmed by screenshot.

## Text scaling

Heights in points, from the accessibility tree, at the two confirmed system settings.

| Element | Default size | Largest size | Scales |
|---|---|---|---|
| Home heading `Hello, Ria de Boer.` | 38 | 271.5 | yes |
| Home intro paragraph | 24 | 257.5 | yes |
| Home `Developer settings` | 48 | 86 | yes |
| Home `Write to your practice` | 48 | 102 | yes |
| Step 1 heading `Who are you writing to?` | 38 | 271.5 | yes |
| Step 1 recipient card | 96 | 240.5 | yes |
| Step 1 `Continue` | 48, at y 526 — on screen | 102, at y 1211 — one scroll down | yes |
| Step 2 question label | 32 | 229 | yes |
| Confirmation heading `Message sent` | 38 | 136 | yes |
| Developer-settings modal heading | 38 | 271.5 | yes |

At the largest size the flow simply becomes a longer page, which is the intended consequence of having
no pinned footer. At the default size the whole of step 1 fits on one screen.

## The eleven accessibility options

Each option was switched on alone, the whole flow driven — Home, recipient, recipient chosen,
questions with the required error, questions answered, message with the empty-message error, message
typed, confirmation — then switched off again. On iPadOS 27 "Button Shapes" is named **Show Borders**.

| Option | Confirmed on | Result across the flow |
|---|---|---|
| Bold Text | yes | clean; see defect 1 for the one Home capture in this pass |
| Larger Text | yes | clean — see the scaling table above |
| Show Borders (Button Shapes) | yes | clean, but the app adds no shapes — defect 2 |
| On/Off Labels | yes | clean |
| Reduce Transparency | yes | clean |
| Increase Contrast | yes | clean |
| Differentiate Without Colour | yes | clean; the error carries the words "This question is required" and a selected answer shows a filled radio and a border, so neither depends on colour |
| Smart Invert | yes | clean, inverted and legible throughout |
| Classic Invert | yes | clean |
| Colour Filters → Greyscale | yes | clean |
| Reduce Motion | yes | clean |

Nothing was clipped, overlapping or unreadable in any state under any option, and every pass reached
the confirmation, so the primary action stayed reachable throughout.

Classic Invert and Colour Filters are applied by the display compositor, below the screenshot path, so
their captures look unfiltered. Their activation is evidenced by the Settings screenshots; the captures
show that the app's layout and content are unaffected, not what the colours looked like on the glass.
Smart Invert does appear in captures.

## VoiceOver

Every string below is transcribed from VoiceOver's caption panel. The panel shows one utterance at a
time and highlights the word being spoken, so "once" means the highlight advanced through a single
utterance and "twice" means it was seen to restart at the first word.

| Event | Spoken | Times | Result |
|---|---|---|---|
| Focus on a recipient card | `Dr. J. de Vries, GP, radio button, unchecked` | 1 | Pass |
| Focus on Continue with nothing chosen | `Continue, dimmed, Button, Choose who you are writing to first` | 1 | Pass |
| Continue on the questions step, nothing answered | first press `How long have you had this problem? (required)`; second press `How long have you had this problem? (required). Error: This question is required` | 1 each | Fail — defect 3 |
| The same question after answering | `How long have you had this problem? (required)` | 1 | Pass |
| Send with an empty message | `What would you like to ask?, Text field, What helps your GP: where it is, since when, and what you have already tried.` — no error | 1 | Fail — defect 3 |
| Send with a message | `Sending your message`, then `Sending`, `Sending, busy`, `Sending, busy, dimmed` | 1 each | Partial — defect 4 |
| The confirmation heading, focused by hand | `Message sent, Heading` | 1 | Pass on the trait |
| Photo-upload failure | `Message sent, adding your photo`, then `Your message was sent, but the photo could not be attached.` | 1 each | Pass |
| Try again after a photo failure | `Try again, Button`; pressing it: `Attaching your photo`, then `The photo still couldn't be attached. You can try again or continue without it.` | 1 each | Pass |
| Offline | banner `You're offline. You can keep writing, but sending needs a connection.` as the first element of each step; Send `Send, dimmed, Button, You're offline. Sending needs a connection.` | 1 | Pass |
| Create failure | `Your message wasn't sent. We couldn't reach your practice. Check your connection and try again.` | 2 | Partial — defect 5 |

## Accessible names

| Check | Result | Observed |
|---|---|---|
| Recipient cards read as "name, role" with radio role and selected state | Pass | `Dr. J. de Vries, GP` with value `radio button, unchecked`, becoming `radio button, checked` on selection while the other two stay unchecked |
| An invalid required question's name carries the error while it shows | Pass | `How long have you had this problem? (required). Error: This question is required`, on a single element |
| …and drops the error once the question is answered | Pass | `How long have you had this problem? (required)`, with no occurrence of the error string anywhere in the tree |
| The message field's name carries the error while it shows | Pass | `What would you like to ask?. Error: Please write your question before sending` |
| …and drops it once a message is typed | Pass | `What would you like to ask?`, with the typed text as the field's value |
| Continue is disabled until a recipient is chosen, and says why | Pass | `Continue`, disabled and not hittable; its hint reads `Choose who you are writing to first` |
| Send is disabled when the device is offline, and says why | Pass | `Send` disabled with a message typed, so the disabled state is the offline rule and not the empty-message rule; its hint reads `You're offline. Sending needs a connection.` |
| The confirmation opens with a "Message sent" heading | Pass | spoken as `Message sent, Heading`, followed by `Sent to Dr. J. de Vries.`, `Your practice usually replies within two working days.`, `Reference: ec-1`, button `Done` |
| "Try again" on a failed send is a button | Pass | `Try again, Button`, for both the create-failure and the photo-failure variants |
| The failure card reads as whole sentences | Pass | `Your message wasn't sent. We couldn't reach your practice. Check your connection and try again.` |
| An offline reason is visible next to the disabled Send | Pass | `You're offline. Sending needs a connection.` rendered directly below the Send button |

The two hints in this table are `accessibilityHint` values that are not drawn on screen. Earlier
passes could not read them; hearing them through VoiceOver is what resolves them.

## Camera and photos

**Camera capture works.** "Take a photo" raised the iOS camera-permission prompt, and after allowing
it the camera opened, the shutter took a picture, "Use Photo" returned to the message step with the
preview and "Remove photo" rendered, Send was enabled, and sending produced the confirmation with
`Your photo was attached.`

**The blank message step is fixed.** The earlier high-severity defect — attach a photo, scroll down
for Send, and the page turns blank — no longer reproduces. After picking a photo and scrolling to the
bottom, the content stays on screen and hittable at both sizes: at the default size `Send` sits at
y 738, at the largest size at y 1029, with no negative-offset displacement.

## Layout

No clipped or overlapping text was seen in any state, at either text size, under any option. The
developer-settings modal, the create-failure card and the confirmation all wrap and scroll cleanly.

## Defects

### 1 — Medium — Home can be left laid out for the previous text size

Seen once, with the system size confirmed at the default: Home's layout boxes were still sized for the
largest accessibility text — the greeting's box 271.5 points tall, the two buttons 86 and 102 — while
the glyphs were drawn at the default size. On screen that is a greeting alone at the top, a large
empty gap, the intro line floating mid-screen, and the primary button a tall slab holding small text.
The page reads as mostly blank, which matches a report that on Home "no text is visible, the views
don't get larger with the text size".

Relaunching the app restored correct metrics immediately.

**The trigger was not identified.** Three deliberate attempts to reproduce it failed: switching Bold
Text on, then off, then on again all left Home correct, and changing the system text size while the
app sat on Home re-measured live and correctly. The condition is real and captured but intermittent,
and the mechanism is not established.

Evidence: `opt-boldtext-s0-home.png` against `default-s0-home.png`.

### 2 — Low — the app does not respond to Show Borders

With Show Borders on, the text-style controls — `Developer settings`, `Change`, `Take a photo`,
`Choose from library` — stay plain coloured text with no added shape or underline, so a patient who
turns the setting on precisely to stop relying on colour gets no change in this app. The setting is a
UIKit affordance that a React Native view does not inherit, so this is an unimplemented affordance
rather than a rendering break; nothing is clipped or broken.

Evidence: `opt-buttonshapes-s0-home.png`, `opt-buttonshapes-s4-message-typed.png`.

### 3 — Medium — FIXED — the first failed submit tells a screen-reader user nothing is wrong

Re-checked and fixed; see the re-check section at the end of this report, events E3 and E5. The
description below is what was seen before the fix.

On the *first* press of Continue with the required question unanswered, focus moves to the question
and VoiceOver speaks only `How long have you had this problem? (required)`. The error half of the name
is not spoken, so the patient is moved somewhere and given no reason. Pressing Continue again — with
the error already in state — speaks the full name including `Error: This question is required`, and
focusing the element by hand also speaks it in full, so the name itself is correct.

The same happens on the message step: the first Send with an empty field speaks the field's name, role
and helper hint with no mention of the error, while a deliberate re-focus speaks
`What would you like to ask?. Error: Please write your question before sending, Text field, …`.

Reading: focus is moved before the error text has been attached to the accessible name, so the
announcement wins the race. That mechanism is an inference; the omission itself is on the captions and
reproduces on both validation paths.

Evidence: `vo-e3-questions-error.png`, `vo-e3d-second-continue.png`, `vo-e5-empty-message-error.png`,
`vo-e5b-field-refocus.png`.

### 4 — Medium — FIXED — the confirmation screen is silent for a screen-reader user

Re-checked and fixed; see the re-check section at the end of this report, event E6. The description
below is what was seen before the fix.

After a successful send the last thing spoken is `Sending, busy, dimmed`. The confirmation then
appears and nothing is announced — the caption panel still held that sentence across six samples
spanning the transition. The heading carries the right trait, and focusing it by hand speaks
`Message sent, Heading`, but a patient who cannot see the screen is never told the message was sent
and has to go exploring to find out.

The photo path does announce its outcomes, so the gap is specific to the plain success arrival.

Evidence: `vo-e6-send-success.png`, `vo-e6b-confirmation.png`, `vo-e6c-message-sent-heading.png`.

### 5 — Low — FIXED — the send-failure sentence is spoken twice

Re-checked and fixed; see the re-check section at the end of this report, event E9. The description
below is what was seen before the fix.

The error card's sentence, `Your message wasn't sent. We couldn't reach your practice. Check your
connection and try again.`, is spoken, stops, and is spoken again: across consecutive caption samples
the word highlight advanced part-way, restarted at the first word, and advanced again. The sentence
breaks are correct — the earlier comma-splice problem stays fixed — and the repetition stops after the
second utterance.

Related and smaller: the visible red error text under a question is its own focusable element, so a
user swiping past it hears the error sentence a second time after the field's own name has already
carried it.

Evidence: `vo-e9-create-failure.png`.

## Not verified

- **The automated accessibility audits** and their positive control. The audit tool was not attached to
  the app during this pass, so no audit produced a result. Everything above is read from the
  accessibility tree, from screenshots, and from VoiceOver's own speech. The audit itself is not
  missing from the record: it ran on the phone lane, five states at 0 warnings and 0 duplicates each
  against a positive control of 22, in `../phone.html`.
- **What Classic Invert and Colour Filters looked like on the glass**, since the display compositor
  applies them below the screenshot path.
- **The trigger for defect 1.** The condition is captured but could not be reproduced on demand.

## Evidence files

Screenshots in this directory, named by what was in force and the state they show: `default-*` and
`largest-*` for the two confirmed system text sizes, `opt-<option>-*` for the ten option passes with
`opt-<option>-setting.png` proving the setting was on, `vo-*` for the VoiceOver caption panel,
`camera-*` for the camera capture, `d1-*` for the fixed blank-message-step check, `vr-*` and `vr2-*`
for the two VoiceOver re-check passes, and `restored-*` for the state the device was left in.

## Re-check after the VoiceOver fixes

A second VoiceOver pass on the same iPad, driving only the events the fixes touch. The method is the
one used above: caption panel on, a screenshot roughly every half second through each event, and an
utterance counted as "once" when the word highlight advances through a single sentence and then holds
rather than restarting at the first word. The app was reloaded before the pass, so every observation
below is against the fixed build; the developer-settings fault for each event was set from the app's
own modal and cleared again afterwards.

| Event | Expected | Spoken | Times | Result | Screenshot |
|---|---|---|---|---|---|
| E3 — first Continue on the questions step, nothing answered | the question's name including its error | `How long have you had this problem? (required). Error: This question is required` | 1 | Pass | `vr-e3-questions-error.png` |
| E5 — first Send with an empty message | the field's name including its error | `What would you like to ask?. Error: Please write your question before sending, Text field` | 1 | Pass | `vr-e5-empty-message-error.png` |
| E6 — arrival on the confirmation after a plain send | `Message sent, Heading`, with no `Sending…` left as the last caption | `Sending your message`, then `Sending`, `Sending, busy`, `Sending, busy, dimmed`, then `Message sent, Heading` | 1 each | Pass | `vr-e6-confirmation-heading.png` |
| E7 — arrival on the confirmation after a failed photo upload | the photo-failed sentence heard in full | `Sending your message`; `Message sent, adding your photo` cut off at its second word; `Your message was sent, but the photo could not be attached.` cut off after three to five words; `Message sent, Heading` | the photo sentence starts once and never finishes | Fail — defect 6 | `vr-e7-photo-failed-caption.png`, `vr-e7-heading-interrupts.png` |
| E9 — the send-failure card | the card's sentence, once | `Your message wasn't sent. We couldn't reach your practice. Check your connection and try again.` | 1 | Pass | `vr-e9-create-failure.png` |
| Step 1 load-error card | the card's sentence when it appears, once | nothing; the caption still held `Home, Button` from the push | 0 | Fail — defect 7 | `vr-load-error-card.png` |

The three fixed defects are settled by the first, second, third and fifth rows.

**Defect 3 is fixed.** Both validation paths now speak the error on the *first* failed submit. On the
questions step the caption ran `How long…` → `(required).` → `Error:` → `This question is required`
with the highlight advancing once through the whole sentence, and the screen capture shows the
VoiceOver cursor sitting on the question. The message step behaves the same, and adds the field's
`Text field` role after the error rather than before it.

**Defect 4 is fixed.** The confirmation now speaks itself on arrival: the last caption before the push
is `Sending, busy, dimmed` and the first one after it is `Message sent, Heading`, spoken once and then
stable across every later sample. Nothing has to be found by exploring.

**Defect 5 is fixed.** The send-failure sentence was sampled from its first word to its last across
twelve consecutive captures and never restarted; further samples afterwards showed the caption
unchanged. One utterance, not two.

Two events did not come out clean, and both are new observations rather than the old defects
returning.

### 6 — Medium — FIXED — the photo-failure sentence is cut off by the confirmation heading

Re-checked and fixed; see the second re-check at the end of this report. The description below is
what was seen before the fix.

On the failed-photo path three things want to speak within about a second of each other: the status
line `Message sent, adding your photo`, the announcement `Your message was sent, but the photo could
not be attached.`, and the heading focus that defect 4's fix added. Each one interrupts the one before
it. Across two runs the photo-failure sentence reached `Your message was` and `Your message was sent,
but` respectively before `Message sent, Heading` replaced it, so a patient who cannot see the screen
hears that the message was sent and never hears that the photo was not.

The line is on screen and reachable — the confirmation renders `Your message was sent, but the photo
could not be attached.` with `Try again` and `Continue without the photo` beneath it — so nothing is
lost to a sighted user, and a screen-reader user who explores the page will find it. What is lost is
the announcement itself.

Evidence: `vr-e7-photo-failed-caption.png` catches the sentence mid-word; `vr-e7-heading-interrupts.png`
is the next capture, with the heading caption in its place and the photo-failure card visible above
the fold.

### 7 — Medium — FIXED — the step 1 load-error card is still silent when it appears

Re-checked and fixed; see the second re-check at the end of this report. The description below is
what was seen before the fix.

With the practice configuration forced to fail, step 1 shows its skeleton for about five seconds and
then replaces it with `We couldn't load your practice's details. Check your connection and try again.`
and a `Try again` button. Through the whole of that — thirteen consecutive captures, about eight
seconds after the card appeared — the caption panel still held `Home, Button`, the name of the
navigation-bar button VoiceOver had focused when the step was pushed. The capture shows the VoiceOver
cursor still around that button while the error card fills the page.

The card's name is correct and does speak when it is reached by hand: the accessibility tree carries
`We couldn't load your practice's details. Check your connection and try again.` as one label on the
alert, and swiping to it reads the whole sentence. It is the move of focus to the card on appearance
that does not take effect, so the patient is left on a step that looks like it is still loading.

Pressing `Try again` does not rescue it either: the retry speaks `Loading your practice's care team`
and then `Loading your practice's care team, busy`, and when the card comes back VoiceOver lands on
`Try again, Button` rather than on the card, so the reason is still never spoken.

Evidence: `vr-load-error-card.png`.

### Not repeated in this pass

The re-check drove only the six events the fixes touch. The eleven accessibility options, the two
system text sizes and the camera path stand from the earlier pass and were not run again against the
fixed build, and no automated audit was attached this time either.

### State the device was left in

VoiceOver off, caption panel off, developer settings back to their defaults — practice `prc-0421`,
latency Default, all four faults None, Force offline off — and the app on Home. Evidence:
`vr-restored-home.png`.

## Second re-check — the arrival and load-error fixes

Same method again: caption panel on, a screenshot roughly every half second through each event, and
an utterance counted as "once" when the word highlight advances through a single sentence and then
holds. The app was reloaded before the pass. Only the three events the second round of fixes touches
were driven.

| Event | Expected | Spoken | Times | Result | Screenshot |
|---|---|---|---|---|---|
| E7 — arrival on the confirmation after a failed photo upload | the photo-failed alert, in full, as the only utterance on arrival | the send's progress first — `Sending`, then `Message sent, adding your photo` to its last word — then `Your message was sent, but the photo could not be attached.` from `Your` to `attached.` and holding there. No heading utterance at all | 1, complete | Pass | `vr2-e7-photo-failed.png` |
| Step 1 load-error card, on appearance | the card's sentence, once, when it appears | `We couldn't load your practice's details. Check your connection and try again.` | 1, complete | Pass | `vr2-load-error-card.png` |
| Step 1 load-error card, after a failed Try again | the card's sentence again | `Try again, Button`, then `Loading your practice's care team` and `Loading your practice's care team, busy`, then `We couldn't load your practice's details. Check your connection and try again.` | 1, complete | Pass | `vr2-load-error-retry.png` |
| E9 — the send-failure card on the message step | still the card's sentence, once, now by focus-on-layout | `Sending`, `Sending, busy`, `Sending, busy, dimmed`, then `Your message wasn't sent. We couldn't reach your practice. Check your connection and try again.` | 1 | Pass | `vr2-e9-create-failure.png` |

**Defect 6 is fixed.** The confirmation no longer speaks its heading when the photo failed: focus
lands on the alert instead, whose name is the photo-failed line, and that sentence runs to its last
word and stays there. The two progress lines before the screen change also complete now rather than
cutting each other off. Run twice, with an identical caption sequence both times, which matters for a
defect that was a race. The capture shows the VoiceOver cursor on the alert, not on `Message sent`.

**Defect 7 is fixed.** The card speaks itself the moment it appears, and again when it comes back
after a failed retry — the new view is treated as a new card, so the reason is repeated rather than
swallowed. In both captures the VoiceOver cursor sits on the card.

**E9 survived its mechanism change.** Moving the create-failure card from an effect to focus-on-layout
did not reintroduce the double utterance: the sentence was sampled from its first word to its last
across nine consecutive captures, never restarted, and further samples afterwards showed the caption
unchanged.

All six VoiceOver events across the two re-checks now pass, and defects 3 through 7 are closed.
Defects 1 and 2 are untouched by these fixes and stand as observations.

### State the device was left in

VoiceOver off, caption panel off, developer settings back to their defaults — practice `prc-0421`,
latency Default, all four faults None, Force offline off — and the app on Home. Evidence:
`vr2-restored-home.png`.
