# AI usage

Claude Code did the research, the spec, the plan, the code, the tests, the review rounds and the
device driving. The human approved the spec and the plan, made every decision in `DECISIONS.md`, and
stepped in where the log says so; every incident is in `docs/ai-usage-log.md`.

## Tools

Claude Code, with subagents for the research, the spec, the plan, the code, the tests and the review
rounds. A command-line tool that drives a device, for the simulator, emulator and physical-device
passes. The platforms' own VoiceOver and TalkBack, with captions and the speech overlay, for the
spoken-text checks. No other AI tool.

## One thing AI got wrong

**The research recommended an upload that fails on the first byte.** The classic form-data file
part, which Expo's `fetch` rejects on SDK 57.
Intervention: a verification pass against the installed Expo source reversed it before any code existed.
Needed because: the advice read as standard practice and no test could catch it without a server.

## Where its output was rejected

**The source tree had drifted into type-based buckets.** Files sat where they were first needed.
Intervention: the human asked for a review against React Native and clean-code practice, set the
rule, by responsibility first and by kind second, and rejected two of the regroupings.
Needed because: each step's agent saw only its own file fence.

## What was not delegated

The product decisions, the spec and plan approvals, the final read of the three hand-in documents,
and the screen recording's review.
