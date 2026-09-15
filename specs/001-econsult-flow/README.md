# The process record

How this feature was built: the research, the specification it fed, the plan, the review rounds that
stood in front of each gate, and the evidence every stage produced. Start at `index.html` — open it
in a browser from the clone, or run `npm run showcase` from the repository root. It needs no network
and it links every page below.

`flow/` holds the working documents — `research.md`, `how-it-works.md`, `spec.md`, `plan.md` and the
review rounds under `checker/`; `artifacts/` holds what the run produced — the rendered pages, the
step board, the simulator previews, the device-lane verification and the recording.

The reports under `flow/checker/` cite the paths these documents had while the flow ran, before they
moved under `flow/`.
