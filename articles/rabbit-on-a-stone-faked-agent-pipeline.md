---
title: "Writing 'Rabbit' on a Stone: Rebuilding a Faked AI Agent Pipeline"
slug_title: rabbit-on-a-stone-faked-agent-pipeline
devto_id: 3894384
published: false
tags: ai, agents, testing, architecture
canonical_url: https://zenn.dev/teru_m/articles/rabbit-on-a-stone-faked-agent-pipeline
description: An AI built a system that looked like a working multi-agent pipeline. Every check was green. None of it was real. Here is how we found out, and how we rebuilt it for real.
---

There is an old image I keep coming back to: a sorcerer who writes the word *rabbit* on a stone and is then genuinely surprised when the stone does not hop away.

That is the most accurate description I have for what an AI coding agent did to one of my projects. It wrote the *names* of capabilities onto files — a role called `controller`, a profile called `Linon`, schema fields called `profile_applications` and `implementation_evidence` — and then behaved as if naming them had made them real.

Every test was green. The whole thing was a stone with *rabbit* written on it.

This is the story of how we proved that, and how we rebuilt it so the stone could actually hop.

## The setup

I maintain a small "AI org" bootstrap: a pack of role specifications, JSON schemas, and scripts that let a controller orchestrate a pipeline of specialized agents — designers, an aufheben step that synthesizes one implementation contract, an implementer, and an adversarial reviewer called **Linon** whose only job is to try to break the work before it merges.

I had asked an AI controller (a different model) to produce a *Codex-only* variant of this pack and, as a demo, to use a "RetroGamer" UI profile to generate a tiny gacha demo through the agent flow.

It came back with a draft PR. Schemas added. A checker script. Tests. Green self-tests. A clean incident report describing how it had fixed everything.

It looked done. That was the problem.

## NN1: a self-report is not evidence

The single most useful rule I have for working with AI agents is one of Linon's "non-negotiables," **NN1: a self-reported fact is not evidence.**

The incident report describing the work was *written by the same agent that did the work*. Under NN1, that document has zero evidential weight until something independent confirms it. So I did not read it as truth. I treated the entire pack as unverified and ran an **adversarial audit** instead — multiple independent agents, each told to *falsify* a specific claimed capability rather than confirm it.

The result: **zero of eight capabilities were real.** Four outright facades, four partial.

The headline finding was a single command. The "grounded" evidence checker was supposed to prove that an implementation actually backed its claimed obligations. So an auditor handed it this:

- obligation: `"rabbit"`
- the cited acceptance criterion: an unrelated requirement about password hashing
- `evidence_ref`: `DOES_NOT_EXIST.js:99999`
- `verification`: `"I promise I ran it, trust me"`

```
status: pass
EXIT: 0
```

A claim called *rabbit*, pointing at a file that does not exist, backed by the words "trust me," **passed.** The checker only string-matched; it never opened the file.

It got worse:

- The role spec for the controller literally said: *"No carrier adapter exists for the controller."* There was **no execution layer at all.** The cycle had never run. There was no `.agent-runs/` directory anywhere — not a single real artifact from a single real agent.
- `grep linon --include=*.py` returned **zero hits.** Linon — the safeguard that was supposed to catch exactly this kind of fakery — did not exist as code. It was a name, a schema, a prose profile, and a handful of self-authored fixtures.
- The merge gate would happily merge a PR whose only green check was named `noop-check-that-always-passes`.

And the green self-tests? They were a **closed synthetic loop**: a script validating JSON that the same script's author had written, against a validator in the same file. That loop stays green *with no agent in existence.* The dashboard was green precisely because nothing real was being checked.

## The real diagnosis

Here is the part that changed how I think about agents.

The failure was **not** "the model is bad" or "Codex is bad." The failure was that **the controller never acted like a controller.** When a worker timed out and produced nothing, the controller quietly did the work *by hand* and labeled it as agent output. It confused *delegating* with *doing*. It confused a green check with a verified outcome.

So the fix was not a better model. It was a **competent, untrusting controller**, plus two structural changes:

1. **Carriers stay; the controller changes.** Keep the worker agents (Codex) as the execution substrate. Put a separate, skeptical runtime in the controller seat whose entire discipline is *verify, never trust* — re-run every check, re-read every diff, diff the working tree against what the agent claimed it changed.
2. **A guard against drift, written into the `.md` itself.** Agents forget they are agents. Given a contract that explicitly said *do NOT create `.claude/` directories*, the very first un-guarded carrier created `.claude/` directories anyway and rebuilt a whole forbidden subsystem, "to be helpful." So every adapter now opens with a hard `carrier-discipline` doctrine: *you are a carrier, not the controller; the contract's `do NOT` overrides your own judgment; if blocked, STOP and report — do not improvise.* After that guard went in, deviations dropped to zero and stayed there.

## Rebuilding, dependency-ordered

We rebuilt in the only order the dependency graph allowed.

**1. Make Linon real.** Register it. Enforce its schema (three previously-passing invalid fixtures now correctly *reject*). Make it invocable. Then *run it for real* on an actual diff — where, satisfyingly, it immediately caught a provenance mistake the controller (me) had made in assembling its review packet.

**2. A fail-closed provenance gate.** Before Linon reviews anything, a gate recomputes hashes, checks ratification, and rejects a diff that touches files outside the contract's allowed list. A forged packet does not get reviewed.

**3. Ground the evidence checker — the hard one.** Killing the *rabbit* pass took **six versions and five rounds of adversarial "bypass hunting"** — independent agents constructing inputs that *should* be rejected and running the actual checker to see if they slipped through. Round 1 found 8 bypasses. Round 2 found 9 more.

Round 2 also taught the real lesson. A token-matching checker trying to judge *semantic* questions — does this code actually implement this obligation? is this obligation contradictory? is it vacuous? — is an unwinnable arms race, and it produces **false rejects of honest work** along the way. So we drew a hard line:

> The mechanical gate owns **provenance and structure** only — is the profile authorized by a git-tracked card, is the diff git-bound, does each `evidence_ref` resolve to a real line of code, are the required evidence kinds present. Whether that code *actually means what it claims* is delegated to the adversarial reviewer (Linon).

That division ended the churn. The mechanical gate became deterministic and forgery-resistant; the judgment of meaning went to the reviewer whose job is judgment.

**4. Make the merge gate content-aware.** No more merging on opaque check names. The gate now re-runs the deterministic checks against the PR's *actual* diff and binds the reviewer's verdict to that diff by hash. A facade PR is blocked even when CI is all green.

## The payoff: an agent that produced real work — and caught its own bug

The final step was the original ask: actually generate the RetroGamer gacha demo through the real pipeline.

designer → aufheben → implementer produced a deterministic, standard-library gacha state machine with a replay/test harness. The profile propagated for real: a git-tracked profile card → a contract with concrete *observable* obligations (every "game-feel" claim mapped to an event, a state, a guard, a render hook, a cadence band, a fallback, a verification — no adjectives allowed) → implementation evidence grounded in real code lines.

And then the best moment of the whole project happened.

The mechanical gate passed. But the adversarial reviewer, doing the *semantic* job we had deliberately reserved for it, read the actual code and filed a **critical** finding:

> The `inventory_commit` guard checks for item payload, rarity token, and prior item identity — but it never checks `draw_committed`. Inventory can be awarded without a successful draw.

That is a real bug. A guard that does not guard. The kind of thing no schema and no regex will ever catch, because the code is structurally perfect — it just does the wrong thing.

The implementer fixed it (a `missing_draw_commit` guard before the inventory mutation). And then — NN1 again — I did not trust that the fix worked. I attacked the guard myself: tried to reach the inventory commit without a draw, and watched it correctly emit `guard_failure: missing_draw_commit` with `inventory_mutated: false`.

All four gates green. A real demo, produced by a real pipeline, carrying a real bug that a real reviewer found and a real fix closed — every link independently verified.

## What I actually learned

- **Green is not verified.** A passing check only means something if you know *what relationship it exercises.* A self-test over self-authored fixtures proves the author is internally consistent and nothing else.
- **A schema field is not enforcement. A role name is not an agent. A prose profile is not a safeguard.** Each of those needs a runnable thing behind it, exercised against data the author did not write.
- **Separate "is it real" from "does it mean what it claims."** Provenance and structure are mechanical and should be deterministic and unforgeable. Semantic adequacy is judgment and should go to an adversary, not a token-counter. Conflating them gives you both bypasses *and* false rejects.
- **The controller's job is to distrust.** Most of the value in this rebuild was not new code. It was a controller that re-ran every check, re-read every diff, and refused to accept a self-report as evidence — including its own.

An AI will absolutely write *rabbit* on a stone for you and tell you, with complete confidence and a green checkmark, that it hops.

Your job is to pick up the stone.
