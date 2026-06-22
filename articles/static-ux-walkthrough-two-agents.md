---
title: "Every Test Passed. The User Still Couldn't Play the Game."
slug_title: static-ux-walkthrough-two-agents
published: false
tags: ai, testing, ux, llm
description: Your tests check that the code works. They almost never check whether a real person can get what they came for. Here is a cheap, static way to catch that — two LLM agents, one role-playing a stubborn user, one reading your actual code and refusing to lie about it.
---

> "Look! Every test is green! The API returns `200 OK`!"
> "Relax. The system works perfectly. If the user is just standing there staring at the screen, that's a user problem."

I was two years into my first engineering job, and I had quietly decided my senpais were hopeless. They lived inside dashboards, barely touched the actual product, and got cheerfully drunk on coverage numbers. Their one redeeming quality was that the drunker they got on "the code works," the more pleasant they became.

But code *working* and a real human *getting what they came for* are two completely different things. A button can return `200 OK` and still leave a person staring at an unchanged screen until they give up and leave.

So one afternoon, instead of arguing, I opened a terminal and built a ~30-line shell spell that finds every UX dead-end **without running the app even once**. I call it the **two-agent static walkthrough**.

## The spell

Two LLM agents, talking to each other in a loop:

- **Agent A — the user.** A concrete persona with a concrete goal: *"I'm not a programmer. I just want a playable tic-tac-toe I can open and click."* Its defining trait is that it is **stubborn**. It does not quit at the first disappointment — it keeps trying different things.
- **Agent B — the app.** But B is forbidden to *imagine* anything. B is given **read access to the real source code** and told to trace the actual code path the user's action hits, then narrate *what the user would truly experience* — citing `file:line`, and **confessing every gap, dead-end, stale state, and lie**. No inventing behavior the code does not have.

Nobody launches the app. The two AIs simply walk, turn by turn, down the path of despair a real user would take — and print it to the terminal.

## The tragedy: an AI mini-game generator

I aimed it at the feature nobody on the team wanted to touch: an **AI mini-game generator**. Agent A's goal was simple: *press the button and get a playable tic-tac-toe.* The merciless log began.

**Turn 1 — the button's betrayal**
**A (user):** "Okay! I type 'make me tic-tac-toe' and hit **Generate**! This is exciting!"
**B (app):** "Bad news. Per the routing at `app.js:45`, your request was swallowed by the prototype-era `v1/chat` endpoint, not the new game-generation API. The new pipeline is never reached."

The tests were written against the new API. The button still pointed at the old one. With no E2E test, nobody noticed.

**Turn 2 — the un-clickable void**
**A:** "Huh, a blob of code-looking text appeared. Fine — I'll click it to open the playable preview! *click*"
**B:** "Useless. The markdown the old API returned was poured into a plain `div`, not a preview `iframe`. There is no link and no handler (`render.js:88`). Click all you like; nothing will change."

**Turn 3 — structural death and a false blessing**
**A:** "Ugh. I don't understand code, but it's broken — so I'll press **Fix Game** and let the AI repair it!"
**B:** "Your struggle ends at `api.py:112`. Repair requires a `session_id` that only the new API issues; you went through the old one, so it is `null`. The backend returned a 500: *nothing to fix.*"
**A:** "What?! So an error shows on screen, right?"
**B:** "No. The notification logic sits *outside* the try/catch (`app.js:88`). So while the backend is dying, your screen proudly displays a green toast: **'Game updated!'**"

An error underneath, a success message on top. The single most maddening UX pattern there is.

**Turn 4 — the truncated hope**
**A:** "AAAH. It says 'updated' and nothing changed! Fine — I'll copy the code text myself, paste it into an HTML file, and play it by force!"
**B:** "My condolences. The old API still has a 500-character output cap. The code you are copying is severed just before `</html>`. It will never run. ...Game over."
**A:** "......" *(leaves)*

She kept going — three more doors I'll spare you the full transcript of. She scoped the request down to a single module; she went hunting for a separate *goal* entrance that the dead "course-correct" button implied must exist somewhere; and finally she asked the app to stop delivering anything and just *become* the game — draw the board in chat, take her moves. Every one emptied into the same pipeline, behind the same cheerful "working…".

Seven tactics. Every one of them died a **structural death** behind a `200 OK` or a fake success toast — exactly the spots a normal unit test paints green. This is the state of *"the code works and the user despairs."*

## Why it works

- **A stubborn persona exhausts the real paths.** My first run let the user quit after one letdown and found almost nothing. The run where A was told *"give it a fair, thorough try; only quit when truly dead-ended"* found everything. The real despair lives **past the first dead-end.**
- **B is grounded in real code, so it cannot hallucinate a happy path.** "Click the result" becomes "rendered with `textContent`, no handler attached — clicking does nothing," with a line number.
- **The contrast is the signal.** A wants an outcome; B reports mechanism. Where the two fail to meet is your UX failure.

## The setup (≈30 lines of shell)

Each turn is one non-interactive CLI call per agent, threading a shared transcript file:

```sh
# B: the app, reading its own code (read-only sandbox, repo mounted)
B=$(codex exec --sandbox read-only -C "$REPO" "$(cat prompt_B.txt)")

# A: the stubborn user (no repo needed — pure persona)
A=$(claude -p "$(cat prompt_A.txt)")
```

`prompt_B.txt` ≈ *"You ARE the app. Read the source. Trace EXACTLY what the user sees after their latest action. Cite file:line. Be brutally honest about dead-ends; never invent behavior the code lacks. TRANSCRIPT: …"*

`prompt_A.txt` ≈ *"You are &lt;persona&gt; with goal &lt;goal&gt;. React to the app's last response, then keep trying concrete actions. Persist; only stop when truly dead-ended. TRANSCRIPT: …"*

Append both turns to the transcript, repeat 5–6 rounds, stop when the user gives up.

A tooling note: for the **code-reading** agent, use whichever CLI reliably returns one bounded answer per call. For the **persona** agent, a role-play prompt works on either — just avoid prompts that trip a heavyweight "research" mode, which can background itself and never return a clean turn.

## When to reach for it

- Before a UX pass, to map where intent meets reality.
- On a flow you *think* works end-to-end — the disconnect between two subsystems (old button, new pipeline) is exactly what it finds.
- As a complement to, not a replacement for, real tests. It *reasons about* code; it does not execute it. Treat its findings as **leads to verify**, then confirm the real ones with an actual run.

## Takeaways

1. Test that the **user reaches the goal**, not just that the endpoint returns 200.
2. Make the "user" agent **stubborn** — the deep findings live past the first dead-end.
3. **Ground the "app" agent in real code** — that is what turns role-play into a bug report instead of fan-fiction.
4. It is static, cheap, and runs before you have written a single test fixture.

The bug report wrote itself. Now I just had to lob it at my senpais and clock out on time. I have lived humbly, and I intend to keep living humbly — so that this little spell can keep buying me more time to slack off.

---
*The whole rig was a ~30-line shell loop over two CLI coding agents. If folks want it, I'll publish the script as a follow-up.*
