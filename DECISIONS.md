# Decisions

Each entry, one line each: why, what was decided, the alternatives and why they lost, what it costs.

## Assumptions

- The patient is signed in and the practice id comes with the session (faked in `src/hooks/useSession.ts`).
- The practice can preview a message from its first line, so there is no subject field.
- The brief's sample data is English, so the app is English.

## Constraints honoured

**Expo Go only.** The app must run from a clean clone with `npx expo start`, so only Expo's bundled native modules or pure JavaScript may be added.
Decided: Expo Go is the runtime; nothing that needs a development build.
Alternatives: a development build (any native module, but Xcode or Android Studio on the reviewer's machine and no clean-clone promise).
Traded off: no NetInfo, no custom native code, the fake transport stays in-process, and Expo Go's footprint makes Android evict the app more readily.

## Stack

**expo-router with a native stack.** Expo's default router; kept rather than chosen.
Decided: file routing under `src/app`.
Alternatives: React Navigation wired by hand (same engine, more wiring); one screen with step state (no back semantics, no header).
Traded off: every file under `src/app` is a route, so screen tests live elsewhere and screens stay thin.

**TanStack Query as the only data layer.** Two reads and one send still need loading, error, retry and cache state.
Decided: queries for the reads, one mutation for the send.
Alternatives: fetch in effects (that state hand-written per screen); SWR (no mutation model); RTK Query (a store the app does not need).
Traded off: a library and its model for a small surface; the send overrides the network mode.

**zod at the boundary.** The contract's types come from the schemas.
Decided: every response is parsed; types are inferred, never written twice.
Alternatives: TypeScript types only (a malformed response crashes a screen); io-ts or valibot (same idea, smaller ecosystem).
Traded off: runtime parsing and a dependency for payloads that today come from our own fixtures.

**No state library.** The draft has one owner and dies with the flow.
Decided: a reducer in a context mounted by the flow's layout.
Alternatives: Zustand or Redux (a global store for local state, more to learn and mock); state lifted into the layout (the shape spreads across screens).
Traded off: no devtools, no persistence for free, one provider to mount in tests.

**No UI or styling library.** The accessibility rules are easier to enforce on controls we own.
Decided: hand-built controls on a token file with `StyleSheet`.
Alternatives: Paper or Tamagui (defaults to fight for targets, scaling and names; a design system is out of the brief's scope); NativeWind (styling only, a build step).
Traded off: every control, state and accessibility prop is ours to get right.

**Unit tests plus device passes, no end-to-end harness.** jest cannot see layout, font scaling or a screen reader.
Decided: jest-expo and Testing Library at 100 % on logic, with recorded walkthroughs on simulators, an emulator and real devices.
Alternatives: Detox or Maestro (real navigation and pickers, but a build pipeline, flaky simulators, and not runnable in Expo Go).
Traded off: what jest cannot see is covered only by the manual passes.

**React Compiler on, its lint rules at error.** Manual memoisation is easy to get wrong and nothing guards it.
Decided: the compiler memoises; a pattern it rejects is rewritten, not silenced.
Alternatives: compiler off with hand-written `useMemo` and `useCallback`; rules at warn (silent bail-outs, which let one regression in).
Traded off: some patterns are forbidden and each workaround carries a comment.

**Formatting is a lint failure.** Two commands to remember means one is skipped.
Decided: Prettier runs as an ESLint rule.
Alternatives: a separate format check only; a pre-commit hook (needs husky, and agents commit through their own tooling).
Traded off: lint reports style noise next to real findings.

## Product

**Three steps plus a confirmation.** A wizard is too long, one long form breaks at large text.
Decided: recipient, questions (skipped when none), message with photo, confirmation.
Alternatives: one question per screen (eight screens for three questions); one long form (errors far above the fold at large text).
Traded off: no review screen; a "To: ... Change" row stands in for it.

**No subject field.** A patient should not have to title a message to their GP.
Decided: the practice previews the first line.
Alternatives: a required subject (one more thing to get wrong); an optional one (mostly left empty).
Traded off: an inbox that needs a subject must derive one.

**Screens are not guarded against cold links.** Every screen has an address, but nothing sends links into the app.
Decided: no guard on a screen opened directly by address; the confirmation trusts the draft it is given.
Alternatives: a redirect on every step when the draft is empty (guards an entrance no app or service uses); dropping the URL scheme (expo-router needs it for its own development links).
Traded off: a hand-typed link to the confirmation renders an empty one; the moment a link is sent from anywhere, the guards must come first.

**The confirmation is one-way.** A sent message must never look editable.
Decided: no back button, no back gesture, a guard that swallows any leave; Done goes home.
Alternatives: back to the message step (a double send waiting to happen); resetting the stack on send (loses the transition and the reference screen).
Traded off: three mechanisms enforce one rule, and Android's back preview must stay off.

**A sole recipient is preselected.** A one-doctor practice should not demand a tap.
Decided: exactly one writable recipient is selected on arrival.
Alternatives: always require the tap (consistent, pointless for that practice).
Traded off: the selection is derived on the screen, so a step opened cold would not have it.

**The draft lives in memory.** It is created when the flow opens and gone when it closes.
Decided: no persistence; Discard means discard.
Alternatives: save it on the device with a resume prompt (no acceptance criterion asks for it).
Traded off: any exit loses the text, which is why the discard guard exists, and an Android camera eviction loses it too.

## Contract

**Contract shapes.** The brief leaves the shape to the app.
Decided: questions are choice or text, care-team members carry a role, unknown values fall back safely.
Alternatives: take the brief's draft types as fixed (no role, so two names with no way to tell the GP; a free-form question type).
Traded off: a real backend must match these shapes or grow a mapping layer.

**One idempotency key per payload.** Creating an e-consult is not idempotent and a timeout may have succeeded.
Decided: one key per draft, reused on retries, replaced when the payload is edited.
Alternatives: no key (every retry can duplicate); one key per draft forever (a retry with an edited body is rejected or answered with the old message).
Traded off: a rare double create when a timed-out create succeeded and the patient then edited.

**A failed photo upload is a partial outcome.** Create then upload can succeed halfway.
Decided: the patient sees "sent, photo not attached" and retries the photo against the same e-consult.
Alternatives: treat it as a failed send (retrying creates the message twice); retry the upload silently (the patient never learns the photo is missing).
Traded off: the confirmation has to explain a half-success.

**The real upload streams from disk.** Expo's `fetch` on SDK 57 rejects the classic form-data file part.
Decided: expo-file-system's upload task; the timeout helper trusts its own abort signal, not the error class.
Alternatives: the form-data part (throws on the first byte); base64 in JSON (three times the bytes in memory).
Traded off: no HTTP transport ships, only its description.

## Networking

**Offline-first reads, fail-fast send.** A send must never sit paused behind a spinner.
Decided: reads retry once when the link returns; the send always runs, never auto-retries, and the app's timeouts rule.
Alternatives: the library's default online mode for the send (a false offline reading pauses it forever); automatic retries on the send (duplicates).
Traded off: an offline send fails at once instead of waiting.

**Cached reads stay fresh for five minutes, and the questions step keeps them across a failed refresh.** A practice's questions and care team change rarely, so the patient should see them at once and keep them, not watch them reload or vanish behind an error card.
Decided: a five-minute stale time on the reads; a refetch keeps the old data while it runs, and step 2 keeps showing the questions it has if a refetch fails.
Alternatives: a short stale time (a refetch on almost every step for data that does not change); the error card on step 2 too (throws away answers the patient can still give).
Traded off: a question the practice changed in the last five minutes is asked in its old form.

**A failed refresh beats stale data.** A patient must not write to a doctor who has left.
Decided: when a refetch fails, the error card replaces the list.
Alternatives: keep showing the old list with a warning (friendlier, riskier for a medical list).
Traded off: a blip in the connection hides a list the patient could see.

**Home prefetches the flow's reads.** Step 1 should open at once.
Decided: the practice's config and care team load on the home screen.
Alternatives: load on step 1 only (a spinner on every entry).
Traded off: two requests for a patient who never starts a message; the skeleton is hard to observe.

**An in-process fake behind a transport interface.** No server may be needed.
Decided: one interface with abort support, one fake with latency, faults and real aborts.
Alternatives: msw (broken on React Native, fights the SDK 57 fetch); a local server (a second terminal, three base URLs).
Traded off: nothing exercises real HTTP.

**The fake's e-consults outlive a settings change.** Applying developer settings rebuilds the transport, and it must not lose what the patient has already sent.
Decided: the created e-consults and the id counter live in one state the provider keeps for the app's lifetime, while latency, faults and the practice stay per-transport.
Alternatives: rebuild the fake with the transport (the photo retry then uploads to an e-consult the new fake never created and gets a 404); persist the fake to disk (a store to migrate for a backend that does not exist).
Traded off: the fake's memory lives until the app restarts, so only a relaunch clears it.

## Photo

**Downscale at pick time.** A 12-megapixel capture is hostile on a weak connection.
Decided: long edge 1600 px, JPEG 0.7, never upscaled, original kept if processing fails.
Alternatives: send the original (slow, expensive); a byte cap (rejects the photo instead of fixing it).
Traded off: a kept original goes up at full size.

**Android may evict the app during capture.** While the system camera is in front, Android reclaims background processes under memory pressure.
Decided: no recovery path in this version; the limit is documented.
Alternatives: save the draft and consume the picker's pending result on relaunch (a day of work); a standalone build (a third of Expo Go's footprint, fewer evictions).
Traded off: a real-device capture can lose the draft.

## Layout and design

**Portrait only.** No landscape layout was designed.
Decided: the app declares portrait.
Alternatives: both orientations (every screen tested twice, wider layouts for cards and preview).
Traded off: Expo Go does not enforce the lock at platform level, so tablets in landscape run untested.

**Light appearance only.** One palette.
Decided: no dark mode.
Alternatives: a dark palette with the system setting (thirteen more tokens, contrast re-audited, screenshots doubled).
Traded off: a patient with dark mode on gets a bright screen.

**Android's back preview is off.** The discard dialog must be able to stop the back swipe.
Decided: predictive back disabled.
Alternatives: on, with every guard rewritten around Android's callback API.
Traded off: no swipe preview on Android.

**One scrolling page per step, action last.** Nothing pinned to the bottom.
Decided: each step is one scroll view with its button as the last item.
Alternatives: a fixed bottom bar (always visible, but covers content at large text and fights the keyboard).
Traded off: at the largest text the button can be below the fold, so an invalid submit scrolls the field into view.

**Design tokens in one file.** Values drifted once when they lived in components.
Decided: a palette, spacing, radius, border width, a type scale and a 48-point minimum in `src/theme`, read by every component. More than a flow this small needs; kept because the alternative drifted.
Alternatives: per-component literals (drift); a design-system package (out of the brief's scope).
Traded off: no theming.

**Font scaling is capped in two places only.** The native bar cannot grow.
Decided: the step chip caps at 2× and bar buttons at 1.3×, the cap iOS uses for its own; everything else scales without limit.
Alternatives: no caps (bar text clips at the largest size); caps everywhere (defeats large text).
Traded off: the chip and bar text stop growing before the body does.

**Selection never by colour alone.** Colour-blind patients and the differentiate-without-colour setting.
Decided: border weight, fill and a filled dot change together.
Alternatives: colour only.
Traded off: a heavier selected look.

## Accessibility

**Errors live in the field's name.** Native screen readers have no reliable error link for inputs.
Decided: the error is folded into the accessible name and focus moves to the field, whose name speaks it once; no separate announcement.
Alternatives: a separate error announcement (spoken twice with the focus move); a live region (Android only).
Traded off: a longer spoken label.

**One spoken channel per message.** Two channels for one sentence means hearing it twice.
Decided: each message is spoken by one mechanism, chosen per case: a focus move for errors and headings, an announcement for progress, no live regions.
Alternatives: two mechanisms for redundancy (every duplicate found on TalkBack and iOS came from this).
Traded off: a one-off announcement has no backup beyond the visible text; errors persist in the field's name, so they cannot be missed.

**Errors render under their label.** At the largest text the options alone fill the viewport.
Decided: the error sits directly under the label.
Alternatives: under the options (scrolled to the label, the error is off screen).
Traded off: the error is above the options, not below them.

**The app pads for the keyboard itself.** React Native's automatic insets apply other apps' keyboard frames too, blanking the screen after the photo picker on a real iPad.
Decided: listen for the keyboard, ignore foreign and empty frames, pad the content instead of the inset.
Alternatives: the automatic insets (the bug); no keyboard handling (the keyboard covers Send).
Traded off: no native nudge of the focused input; the scaffold must reach the window bottom.

**The error name lives on a view, not a text.** iOS caches a text's accessible name until its words change.
Decided: a wrapping accessible view carries the name and error.
Alternatives: the name on the text (stale after the error clears).
Traded off: one more view per choice group.

## Source layout

**By responsibility, then by kind.** Global `hooks/`, `utils/`, `types/` folders scatter a feature.
Decided: a feature owns its `api`, `state`, `hooks`, `components`, `utils`; shared code goes by kind into `components`, `lib`, `hooks`, `providers`; a context's accessor stays with what mounts it; generic pieces stay shared even with one user; routes stay thin; no barrels.
Alternatives: the type-based layout (six folders per feature, dumping-ground buckets).
Traded off: newcomers learn the ownership rule; screen tests live under `src/__tests__/app` because expo-router treats every file under `src/app` as a route.

**A file keeps its own single-use pieces.** One file per function scatters a screen across six files.
Decided: a route or module holds its private helpers, types and sub-components in a fixed order (imports, types, constants, helpers, sub-components, the one export, styles); a piece moves out when a second file needs it, when it owns state or copy, or when the file passes about 200 lines.
Alternatives: one file per function.
Traded off: a file can hold several kinds of thing; the order and the single export keep it readable.

**No types folder.** A type kept away from its code drifts.
Decided: wire types come from the zod schemas; every other type sits with its owner.
Alternatives: a `types/` folder (a second copy of the schemas' shapes, maintained by hand).
Traded off: no single place to browse all types.

## Platform

Verified by hand, with the evidence under `specs/001-econsult-flow/artifacts/ui-verification/`:

- iOS simulators (iPhone and iPad) at the default and the largest text size, with a clean
  Accessibility Inspector audit on every screen.
- An Android 16 emulator with TalkBack, its speech captured word for word.
- A real Samsung tablet: camera capture, the header labels under TalkBack, the read faults and the
  loading skeleton.
- A real iPad: VoiceOver with the caption panel, the nine accessibility options, camera capture.

## With another two weeks

- Draft persistence with a resume prompt, which also recovers an Android camera capture.
- A review step with Edit and Send before the confirmation.
- Deep links from the practice's messages and notifications, with the guards each step then needs
  against a cold arrival.
- Landscape layouts, and a dark appearance.
- A stale list shown with a warning instead of the error card.
- An exit confirmation on the back gesture from Home.
- The real transport, with upload progress.
- Dutch copy, tested with TalkBack.
- An inbox, so the practice's reply closes the loop.
- End-to-end tests on both platforms.
