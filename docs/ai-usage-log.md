# AI usage log

Every moment the loop's own checks or the human changed the outcome, each as what happened, the
intervention and why it was needed; `AI-USAGE.md` is the half-page summary.

## Caught by the loop's own checks

**The research recommended an upload that fails on the first byte.** The classic form-data part,
which Expo's `fetch` rejects on SDK 57.
Intervention: a verification pass against the installed Expo source reversed it.
Needed because: the advice read as standard practice and no test could catch it without a server.

**The plan put screen tests where expo-router loads routes.** The app would not have started.
Intervention: the plan checker caught it before any code existed.
Needed because: the mistake only shows at start-up, not in the test runner.

**Five screens passed their unit tests and failed on the simulator.** Scroll-to-error a no-op, a
header label clipped at the largest text size, a label scrolled away, a photo retry that changed
nothing, a clipped switch.
Intervention: each step was driven on the simulator at the largest text size and fixed before commit.
Needed because: jest renders no layout and no text scaling.

**Discard on step 1 did nothing on the device.** The unit test had exercised the back gesture, not
the button.
Intervention: the final walkthrough found it; a test now reproduces it.
Needed because: navigation actions behave differently on a real navigator.

**The spec's leave guard would have blocked its own Done button.** Found by the spec checker in the
navigator's source.
Intervention: redesigned before implementation.
Needed because: the spec looked complete and the defect lived in navigator internals.

## Human interventions

**The source tree had drifted into type-based buckets.** Files sat where they were first needed.
Intervention: the human asked for a review against React Native and clean-code practice, then set
the rule, by responsibility first and by kind second, and rejected two of my regroupings.
Needed because: each step's agent saw only its own file fence.

**Changes were being queued while a question was still open.** Answers came with actions attached.
Intervention: the human ruled that a question is a discussion and any change waits for a yes.
Needed because: a discussion is where the decision gets made, not after it.

**The hand-in documents were essays.** Long paragraphs, decisions the brief had made for us, no
alternatives named.
Intervention: the human set the shape (short lines; only our decisions; alternatives and why they
lost), asked for an audit of unrecorded decisions and chose each one, cutting eight as
over-engineering.
Needed because: a reader has minutes, not an afternoon.

**Android and the accessibility options had not been tested.** Simulator passes had stopped at
"names verified, speech not verified".
Intervention: the human asked, rejected a pass that listed the options as not verified, connected a
real iPad and a real tablet, and reported an empty Home screen. The method changed to driving the
devices' own Settings.
Needed because: twelve defects existed only on hardware, and VoiceOver does not run on a simulator.

**Screen readers had never been heard.** Counts, not words.
Intervention: the human asked why VoiceOver and TalkBack could not be tested; captions and the speech
overlay were captured, seven defects fixed.
Needed because: every double-speak came from a second channel no count could show.

**The repository leaked its making.** Session links in commits, an editor folder in history, the
template's licence, local paths and tooling stories in the record, review verdicts shown without
their outcome.
Intervention: the human flagged each; history rewritten, licence replaced, record scrubbed and
annotated, dashboard and rules written.
Needed because: a clone has to stand on its own.
