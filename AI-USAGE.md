# AI usage

## Tools

Claude Code, inside a human-gated flow. Read-only research agents produced
`specs/001-econsult-flow/research.md`, and every claim in it was adversarially re-checked
against the installed Expo and React Native sources and the versioned SDK 57 docs, then marked
verified or corrected with its source. A spec checker ran five rounds and a plan checker three
(`specs/001-econsult-flow/checker/`). The final implementation review then ran three rounds over the
whole diff: the findings of the first two were each fixed in one commit — the navigation lock while
sending, a single offline announcement and the photo-picker error path, then making that lock
timing-independent — and the third verified those fixes. Implementation was one agent per plan task,
test-first and confined to that task's file fence. After every screen task a UI-verification agent
drove the iPhone simulator at the default and the largest accessibility text size, and re-checked
until clean. A human decided the design questions recorded in `DECISIONS.md` and approved the spec
and the plan.

## What AI got wrong, and how it was caught

- **The photo upload would have thrown on the first byte.** The research agent recommended React
  Native's classic form-data part, `body.append('photo', { uri, name, type })` with `fetch`. The
  verifying pass opened the installed Expo source and found `convertFormData.ts` rejects exactly that
  value with "Unsupported FormDataPart implementation" — Expo's own test asserts it — because Expo's
  `fetch` is the global one on SDK 57. That reversed the recommendation to expo-file-system's upload
  task and reshaped both the contract note and the timeout helper.
- **The first plan would have stopped the app from starting.** It put the screen tests next to the
  screens under `src/app`. The plan checker traced expo-router's route context and showed that
  `_layout.test.tsx` conflicts with `_layout.tsx`, and that development start-up requires every route
  module, so the test files would have crashed the app instead of testing it. They moved to
  `src/__tests__/app`.
- **Five defects that passed the unit tests and failed on the simulator**, each recorded as a dated
  amendment in the plan: `measureLayout` silently doing nothing when given a numeric node handle under
  the New Architecture, so scroll-to-error never scrolled; a required-answer error rendered below the
  radio options and pushed off screen at the largest text size; the message field scrolling the input
  into view and leaving its label above the fold; a failed photo retry that changed nothing on screen,
  because a failed upload resolves as an outcome rather than throwing; and the Force offline label
  pushing the native switch past the screen edge.
- **Discard on the leave dialog did nothing on the device.** The finish-phase simulator walkthrough
  found that step 1's Discard did nothing at all: re-dispatching a root-level navigation action on
  the nested navigator is a no-op there, although the unit test's back-navigation variant passed. The
  fix lowers the guard by state and navigates home explicitly, and a Home-button test now reproduces
  the defect under jest.

## Where AI output was rejected

The spec's first confirmation screen carried an unconditional leave guard. The spec checker read the
vendored navigation source and showed the guard would swallow the Done button's own unwind through the
nested navigator, and that step 1's discard guard would fire on the confirmation screen too. It was
redesigned — lowered before navigating, and using `dismissTo('/')` rather than `dismissAll`, which
only reaches step 1 of the nested stack — before any code existed. Across the five spec rounds every
finding was argued individually and either fixed or dismissed with a stated reason.

## What was not delegated

The product judgement: three steps instead of a wizard, no subject field, English copy, the coverage
tiers, and what to cut. The final read of all three documents, and the screen recording. The local
`.env` was written by hand, and when the tooling could not write that file, the choice to ship
`env.example` as a template instead was the human's. Every spec and plan gate was approved before the
next stage ran.
