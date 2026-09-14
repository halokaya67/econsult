# Showcase recording: chapters

One continuous take on the iPhone 17 simulator (iOS 26.5, Expo Go), 4 minutes 33 seconds. The fake
backend runs with no latency except where a scenario is about the waiting state. Times are from the
start of `econsult-showcase.mp4`.

| Time  | Scenario                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------- |
| 00:00 | 1. Happy path: recipient, answers, message, a photo from the library, Send, confirmation, Done    |
| 00:15 | 2. Developer settings: practice, latency, the four fault groups, Force offline; Cancel, then Apply |
| 00:38 | 3. Validation: Continue with nothing chosen, unanswered questions, an empty message; then Sending  |
| 00:54 | 4. Create failure: the "wasn't sent" card, Retry after clearing the fault (the fault is cleared from developer settings opened over the draft; Apply raises the discard guard, Keep writing keeps the draft) |
| 01:29 | 5. Photo not attached: the notice, a failing Try again, the fault cleared, Try again succeeds      |
| 01:40 | 6. Offline: the banner, Send disabled with its reason, back online, sent                          |
| 02:05 | 7. A two-step practice: no questions, the counter reads "of 2"                                    |
| 02:24 | 8. A practice with no e-consults: the empty state and the way back                                |
| 02:36 | 9. The discard guard: Keep writing, then Discard                                                  |
| 02:59 | 10. Loading and error states at Slow latency: the skeleton, the config error card, Retry           |
| 03:32 | 11. The largest text size: recipient, an unanswered question, the message with a photo, done      |
| 04:25 | 12. An address that is not part of the app: the not-found screen and its way home                 |

`econsult-one-path.mp4` is the short recording the brief asks for: one complete path, about a minute.
