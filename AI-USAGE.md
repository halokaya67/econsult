# AI usage

## How it was used

Claude Code did the research, the spec, the plan, the code and the tests, one agent per task
inside a gated flow. A human approved the spec and the plan, decided every product question in
`DECISIONS.md`, and reviewed each step's simulator preview. Separate AI checkers reviewed the spec
(five rounds), the plan (three rounds) and the finished implementation (three rounds); their reports
are under `specs/001-econsult-flow/checker/`. The process record, with screenshots, is under
`specs/001-econsult-flow/artifacts/`.

## Where it went wrong, and what it took to catch it

Each entry: the problem, the intervention, and why it was needed.

**The upload recommendation would have failed on the first byte.**
The research suggested React Native's classic form-data part with `fetch`. A verification pass
against the installed Expo source showed Expo's own `fetch` rejects that value on SDK 57. Needed
because the recommendation read as standard practice and no test could have caught it without a real
server.

**The plan would have stopped the app from starting.**
It placed screen tests next to the screens under `src/app`, where expo-router treats every file as a
route. The plan checker caught it before any code existed. Needed because the mistake only shows at
app start-up, not in the test runner.

**Five screens passed their unit tests and failed on the simulator.**
Scroll-to-error did nothing under the New Architecture, an error rendered off screen at the largest
text size, the message field scrolled its label out of view, a failed photo retry changed nothing on
screen, and the offline switch was pushed past the edge. Each was found by driving the simulator at
the largest accessibility text size after the step's tests were green, and fixed before the step was
committed. Needed because jest renders no layout and no text scaling.

**Discard did nothing on the device.**
The final walkthrough found that Discard on step 1 was a no-op, although the unit test passed. The
navigation action was re-dispatched where it cannot take effect; the fix navigates home explicitly and
a test now reproduces the defect. Needed because the test had exercised the back gesture, not the
button.

**The confirmation screen's leave guard was wrong in the spec.**
The spec checker showed it would block the Done button's own navigation. It was redesigned before
implementation. Needed because the spec looked complete and the defect lived in navigator internals.

**The Accessibility Inspector could not be driven end to end.**
The audit runs from a script, but the inspector's target picker only responds to a real click. The
human selected the target by hand once; the five screens were then audited with zero warnings and a
positive control confirmed the audit was live. Needed because macOS does not expose that picker to
automation.

**The source tree drifted into type-based buckets.**
After the implementation, files sat where they were first needed rather than with their owner. The
human asked for a structure review; the tree was regrouped by ownership and the rule written into
`DECISIONS.md`. Needed because each step's agent saw only its own file fence.

## What was not delegated

The product decisions, the spec and plan approvals, the final read of the three hand-in documents,
and the screen recording.
