# Beta Test Plan — Heap (Week 7)

**Goal:** not "do people like it" — specifically, does the no-folders bet survive real, messy use? You're testing the premise, not polishing the UI.

## 1. Who to recruit (5–8 people)
- Target: people who've abandoned Notion/Evernote/Apple Notes because organizing became the actual job — that's the person this app is for
- Skip friends who'll just be nice. You want people who'll complain.
- Mix in 1–2 naturally *organized* people too — if it works for them despite not needing it, that's a bonus signal, not required

## 2. What to give them
- The current prototype
- One instruction, nothing more: *"Dump anything you'd normally put in Notes or a to-do app here, for two weeks. Don't organize it, don't overthink it — just dump."*
- Don't explain how the AI retrieval works upfront. Explaining it primes their behavior and quietly ruins the test.

## 3. Timeline
- **Day 3:** one-line check-in — "used it at all?" (catches silent drop-off while it's still cheap to fix)
- **Day 7:** 15-minute call, focused specifically on retrieval quality
- **Day 14:** exit interview (questions below)

## 4. What to actually measure
- Captures per person per day — is the capture habit forming
- **Asks per person per week — this is the real north star.** Capturing without ever asking means the value prop hasn't landed
- Day-7 return rate — did they come back unprompted
- Retrieval trust — did they ever get an answer and not believe it

## 5. Failure signals to watch for
| Signal | What it means | What to do |
|---|---|---|
| Captures drop off after day 3–4 | Capture friction, not an AI problem | Fix capture UX before touching retrieval |
| People capture but never ask | "Ask" isn't obviously valuable yet | Push it harder in the Today digest, don't add features |
| Wrong or incomplete answers, more than once per person | Retrieval quality — this is existential | Stop adding features, fix retrieval first |
| "I just want folders back" | The core bet may be wrong | Take it seriously, don't get defensive about it |

## 6. Exit interview — ask these verbatim
1. "Walk me through the last time you actually used it."
2. "What's the one thing you almost quit over?"
3. "Did you ever ask it something and not trust the answer?"
4. "What did you use before this, and did you go back to it at all?"
5. "Would you be annoyed if this disappeared tomorrow?" — the real retention question

## 7. Decision point after two weeks
- **Green — keep building:** 3+ of 5 people are asking it questions weekly without being prompted, and nobody reports a trust-breaking wrong answer
- **Yellow — fix before continuing:** capture habit is solid but retrieval trust is shaky → spend the next two weeks only on retrieval quality, hold off on Phase 2 features
- **Red — reconsider the premise:** capture itself never became a habit, or people keep manually re-inventing folders on top of it → sit with that honestly before pushing further
