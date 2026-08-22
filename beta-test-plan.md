# Heap 10-Day Validation Sprint

Goal: validate demand and behavior before building more features. This sprint answers one question: does the capture -> ask -> trust -> act loop create real pull for people who do not already know the product?

## 1. Scope Freeze (Days 0-10)
- No new feature work.
- Only allow reliability fixes and bug fixes that block core use.
- Core loop under test:
	- Capture a thought quickly
	- Ask a question later
	- See grounded answer with sources
	- Turn answer into action (task handoff)

## 2. Target Testers (5-8 people)
- 3-5 people who feel "notes apps became organizing work"
- 1-2 people who are naturally organized and heavy productivity-tool users
- 1 "cold" user from outside your immediate circle

Recruiting rule: avoid coaching users before testing. You are measuring discoverability and trust, not compliance.

## 3. Recruitment Script (copy/paste)
Use this for DM, email, or message:

"I am testing a new notes app called Heap. It is built for messy capture without folders or tagging. I need 10 days of real usage feedback, not polished demo feedback.

What I need from you:
- Use Heap as your default quick-capture place for 10 days
- Ask it questions about what you captured when you need context
- Join one 15-minute check-in and one 20-minute exit call

I am testing behavior, not you. Brutally honest feedback is the goal. Interested?"

## 4. Tester Onboarding Script (Day 1, 5-7 minutes)
Read this verbatim:

"Thanks for helping. Please use Heap like a scratchpad for real life and work thoughts for the next 10 days.

Rules:
1. Do not organize anything in advance.
2. Capture first, clean up never.
3. When you need something, ask Heap instead of searching manually.

I will not explain every feature because I want to see what is obvious versus confusing. If something feels bad, say it immediately."

## 5. Session Schedule
- Day 1: onboarding and first capture
- Day 3: async pulse check (1 question)
- Day 5-6: 15-minute midpoint call
- Day 10: 20-minute exit interview

Day 3 pulse message:
"Did you use Heap at least twice since setup? If no, what got in the way first?"

## 6. Midpoint Session Script (Day 5-6)
Use this structure:
1. "Show me the last thing you captured."
2. "Now ask a question you genuinely need answered from your notes."
3. "Did you trust that answer? Why or why not?"
4. "Would you turn this into a task here, or somewhere else?"
5. "What almost made you stop using it this week?"

Moderator rule: do not rescue users unless fully blocked for more than 30 seconds.

## 7. Exit Interview Script (Day 10)
Ask in order:
1. "Walk me through the last real moment Heap helped you."
2. "When did Heap fail you most?"
3. "Did you ever doubt an answer because sources felt weak or missing?"
4. "What did you use instead when Heap was not enough?"
5. "If Heap disappeared tomorrow, would you care? Why?"

## 8. Success Metrics (track daily)
Per tester, capture:
- Captures per day
- Asks per day
- Source chip opens per ask session
- Task handoffs created from Ask
- Day-3 active (yes/no)
- Day-7 active (yes/no)
- Day-10 active (yes/no)
- Trust breaks: count of "answer felt wrong/unreliable"

Core KPI formulas:
- Activation rate = testers with at least 3 captures by Day 3 / total testers
- Ask adoption = testers with at least 3 asks by Day 10 / total testers
- Trust pass rate = testers with 0 trust breaks / total testers
- Return rate = testers active on Day 7 / total testers

## 9. Decision Rubric (hard gate on Day 10)
Green (continue current direction):
- Activation rate >= 70%
- Ask adoption >= 50%
- Trust pass rate >= 80%
- At least 40% created at least one task from Ask without prompting

Yellow (freeze expansion, improve core loop for 2 weeks):
- Activation rate >= 70% but Ask adoption < 50%
- Or trust pass rate is between 60% and 79%

Red (reconsider product direction before more build):
- Activation rate < 70%
- Or trust pass rate < 60%
- Or 3+ testers explicitly ask for manual structure (folders/tags) as a blocker

## 10. What Gets Built Next (based on result)
- Green:
	- Improve onboarding and retrieval speed
	- Keep Tasks only as post-answer action, not full PM suite expansion
	- Start lightweight growth loop (invite and referral)
- Yellow:
	- No new surfaces
	- Fix trust issues: better source ranking, clearer citations, confidence wording
	- Re-run a 7-day mini test
- Red:
	- Pause feature roadmap
	- Run 3 deep interviews specifically on failure moments
	- Decide whether to narrow to pure memory tool or pivot to structured productivity

## 11. Tracking Template
Create one row per tester:

| Tester | Day 3 Active | Day 7 Active | Day 10 Active | Captures Total | Asks Total | Task Handoffs | Trust Breaks | Would Miss Heap? |
|---|---|---|---|---:|---:|---:|---:|---|
| T1 |  |  |  |  |  |  |  |  |
| T2 |  |  |  |  |  |  |  |  |
| T3 |  |  |  |  |  |  |  |  |
| T4 |  |  |  |  |  |  |  |  |
| T5 |  |  |  |  |  |  |  |  |

## 12. Non-Negotiables for Signal Quality
- Do not add features during the 10 days.
- Do not explain hidden product logic before users try.
- Do not ignore trust failures to chase engagement numbers.
- Do not treat polite feedback as positive signal unless behavior confirms it.
