# AI usage

Claude Code did the research, the spec, the plan, the code, the tests, the review rounds and the
device driving. The human approved the spec and the plan, made every decision in `DECISIONS.md`, and
stepped in wherever the entries below say so. Each entry: what happened, the intervention, why it
was needed.

## Caught by the loop's own checks

**The research recommended an upload that fails on the first byte.** The classic form-data part,
which Expo's `fetch` rejects on SDK 57.
Intervention: a verification pass against the installed Expo source reversed it.
Needed because: the advice read as standard practice and no test could catch it without a server.

**The plan put screen tests where expo-router loads routes.** The app would not have started.
Intervention: the plan checker caught it before any code existed.
Needed because: the mistake only shows at start-up, not in the test runner.

**Five screens passed their unit tests and failed on the simulator.** Scroll-to-error a no-op, an
error off screen, a label scrolled away, a photo retry that changed nothing, a clipped switch.
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

**Environment seeds nobody used.** A `.env` and its parsing existed beside developer settings.
Intervention: the human asked twice what they were for; they were removed.
Needed because: two knobs for one thing, one of them always empty.

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
Intervention: the human asked, rejected a pass that listed the options as not verified, pointed out
that my scripts were what kept unbinding the audit tool, connected a real iPad and a real tablet, and
reported an empty Home screen. The method changed to driving the devices' own Settings.
Needed because: twelve defects existed only on hardware, and VoiceOver does not run on a simulator.

**Screen readers had never been heard.** Counts, not words.
Intervention: the human asked why VoiceOver and TalkBack could not be tested; captions and the speech
overlay were captured, seven defects fixed.
Needed because: every double-speak came from a second channel no count could show.

**The showcase recording ran fifty minutes for a five-page app.** The driver paused for a snapshot
before every tap.
Intervention: the human stopped it twice ("recording, not pictures"; "an hour for three minutes");
the agent was halted and its script run directly, four minutes.
Needed because: the tooling's pace was being mistaken for the app's.

**The repository leaked its making.** Session links in commits, an editor folder in history, the
template's licence, local paths and tooling stories in the record, review verdicts shown without
their outcome.
Intervention: the human flagged each; history rewritten, licence replaced, record scrubbed and
annotated, dashboard and rules written.
Needed because: a clone has to stand on its own.

## What was not delegated

The product decisions, the spec and plan approvals, the final read of the three hand-in documents,
and the screen recording's review.
