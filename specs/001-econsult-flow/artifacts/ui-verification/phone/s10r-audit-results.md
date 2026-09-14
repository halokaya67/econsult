# Xcode Accessibility Inspector audit (SC3) — iPhone 17 simulator

- Device: iPhone 17, iOS 26.5
- Target app: Expo Go (`host.exp.Exponent`)
- Inspector target: `Simulator › Expo Go`
- Audit tab, default audit Options (Contrast, Dynamic Type, Clipped Text, Element
  Description, Hit Region checks all active — evidenced by the positive control)
- Text size: medium
- Date: 2026-09-12

Results were read verbatim from the Inspector's results outline. `Clear Warnings`
was NOT pressed between runs, so the outline accumulates `Audit 1 … Audit 7` and
every run is visible in one pane; audits 2–7 are this pass.

## A. Home

Audit id: `Audit 2`. Rows returned: 2 (header + result).

```
Audit 2 || 0 warnings, 0 duplicates
No Warnings
```

Status bar: `0 warnings`.
Evidence: `s10r-01-home-audit.png` (device), `s10r-01-home-inspector.png` (Inspector).

## B. Step 1 loaded (three recipients shown)

Audit id: `Audit 3`. Rows returned: 2.

```
Audit 3 || 0 warnings, 0 duplicates
No Warnings
```

Status bar: `0 warnings`.
Evidence: `s10r-02-step1-audit.png`, `s10r-02-step1-inspector.png`.

## C. Step 3 with the empty-message error shown

Reached via: Dr. J. de Vries → Continue → "Less than a week" → Continue → Send with
an empty message. Error confirmed present in the accessibility tree as
`Please write your question before sending`, and on the field itself as
`What would you like to ask?. Error: Please write your question before sending`.

Audit id: `Audit 4`. Rows returned: 2.

```
Audit 4 || 0 warnings, 0 duplicates
No Warnings
```

Status bar: `0 warnings`.
Evidence: `s10r-03-step3-error-audit.png`, `s10r-03-step3-error-inspector.png`.

## D. Confirmation, partial-failure variant

Developer settings → `Fail: Upload photo` = Server → Apply and go home → recipient →
question → message typed → Choose from library → first photo → Send. Confirmation
shows `Your message was sent, but the photo could not be attached.` with
`Try again` / `Continue without the photo` and `Done`.

Audit id: `Audit 6`. Rows returned: 2.

```
Audit 6 || 0 warnings, 0 duplicates
No Warnings
```

Status bar: `0 warnings`.
Evidence: `s10r-04-partial-failure-audit.png`, `s10r-04-partial-failure-inspector.png`.

## E. Developer settings modal

Opened from Home.

Audit id: `Audit 5`. Rows returned: 2.

```
Audit 5 || 0 warnings, 0 duplicates
No Warnings
```

Status bar: `0 warnings`.
Evidence: `s10r-05-devsettings-audit.png`, `s10r-05-devsettings-inspector.png`.

## Positive control (not an app state)

A clean audit is worthless unless a dirty screen in the same process produces
warnings. Expo Go's own developer menu (same process) was audited immediately
after state D.

Audit id: `Audit 7`. Rows returned: 23.

```
Audit 7 || 8 Clipped Text, 3 Contrast, 10 Dynamic Type, 1 Element Description
Contrast nearly passed
Contrast failed
Contrast failed
Dynamic Type font sizes are unsupported
Dynamic Type font sizes are unsupported
Dynamic Type font sizes are unsupported
Dynamic Type font sizes are unsupported
Dynamic Type font sizes are unsupported
Dynamic Type font sizes are unsupported
Dynamic Type font sizes are unsupported
Dynamic Type font sizes are unsupported
Dynamic Type font sizes are unsupported
Dynamic Type font sizes are unsupported
Text clipped
Text clipped
Text clipped
Text clipped
Text clipped
Text clipped
Text clipped
Text clipped
Element has no description, looks like: Up Arrow
```

Status bar: `22 warnings`.
Evidence: `s10r-06-positive-control-expo-devmenu.png`,
`s10r-06-positive-control-inspector.png`.

This confirms the audit was live and running the Contrast, Dynamic Type, Clipped
Text and Element Description checks. The five `0 warnings` results above are
therefore real findings, not empty passes.

## End-of-run state

- Developer settings were returned to defaults and applied: practice
  `prc-0421: three recipients, two questions`, latency `Default`, all four fault
  injectors `None`, `Force offline` off.
