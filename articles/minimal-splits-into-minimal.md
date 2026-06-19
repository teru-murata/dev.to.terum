---
title: "When 'Minimal' Splits Into 'Minimal': The Particle Physics of AI Task Decomposition"
slug_title: minimal-splits-into-minimal
published: false
tags: ai, agents, architecture, recursion
canonical_url: https://zenn.dev/teru_m/articles/minimal-splits-into-minimal
description: An autonomous build agent kept declaring a task "minimal" and then splitting it into more "minimal" tasks — atom, proton, quark, forever. The bug, and the one-line idea that fixed it, are both more interesting than they look.
---

For a century, physics has had the same embarrassing habit. We find the smallest thing. We call it the atom — Greek for *indivisible*. Then we split it. Inside is a nucleus; we split that into protons and neutrons; we split *those* into quarks. Each time we were sure we had reached the bottom, and each time the bottom had a basement.

Last week I watched an AI rediscover this, by accident, in about forty minutes, while trying to create an empty software project.

## The setup

I have been building an autonomous software org: you hand it a goal in plain language, and a controller decomposes the goal into a tree of tasks, builds each task with a small swarm of agents (designers, an implementer, an adversarial reviewer), and ships the result as a pull request. No human in the loop between "goal" and "PR".

The interesting part is the decomposer — the **Splitter**. A goal like *"add a button that exports the table to CSV"* is one small task. A goal like *"build the whole billing system"* is not; it has to be broken down. And the breakdown has to be *good*, because each task runs a full, expensive review pass. Split too coarse and the reviewer drowns in a change it can't verify in one sitting. Split too fine and you pay that expensive review N times for no benefit.

So the Splitter has a recursive escape hatch: if a task turns out to be too big — the reviewer keeps finding problems and the repair loop can't converge — the controller **splits that task into smaller children** and tries again. Coarse first; subdivide only what proves too large. It is a clean idea, and on existing codebases it works.

Then I pointed it at an empty repository.

## The basement with no bottom

The goal was "build the acceptance system described in these docs." The target repo had nothing in it yet — a greenfield project. The Splitter looked at it and produced a task named, sensibly enough:

```
scaffold-minimal-project
```

The implementer tried to lay down the skeleton — a manifest, an entry module, a config file. It couldn't: each task is only allowed to touch the files in its declared scope, and a project skeleton is a *web* of interdependent files that have to appear together. The task failed.

So the controller did what it was told. The task failed, therefore split it into something smaller:

```
scaffold-minimal-project
  └─ minimal-package-scaffold
       └─ root-package-scaffold
            └─ minimal-package-scaffold
                 └─ ...
```

Atom. Proton. Quark. Each child was a slightly more "minimal" version of *creating the project*, and each one failed for exactly the same reason as its parent, and each failure triggered another split. The agent was a particle physicist with an unlimited grant: every time it declared it had found the smallest possible unit, it cracked that unit open and found another "minimal" inside.

It would have run until it hit a depth limit or burned the budget, having produced precisely nothing.

And this is the real shape of the cost. An LLM has a quiet affection for *minimal* — for the smaller, neater, more obviously-correct version of whatever unit you hand it. Left unchecked, that affection is not a virtue; it is a leak. The tokens dissolve into ever-finer subdivisions, and the matter itself — the thing you actually wanted built — dissolves with them. You do not end up with a smaller deliverable. You end up with no deliverable and an invoice. The insatiable pursuit of the smallest unit consumes the compute and the work in the same motion.

## Two things were wrong, and one of them was a word

The structural problem is real and worth naming: **a scaffold is anti-decomposable**. The whole point of splitting is to make each piece independently buildable. But a skeleton is the one thing that cannot be built one bone at a time — `package.json` and `src/index` and the config only mean anything in each other's presence. Splitting it doesn't make it easier; it manufactures more impossible sub-tasks. Some work is genuinely atomic, and forcing it through a "divide until tractable" machine is a category error.

But the more embarrassing problem was the word **minimal** itself.

The Splitter *said* `minimal`. It labeled the task as the smallest meaningful unit — and then split it anyway. The label was doing no work. It was decoration. A claim of atomicity that nothing in the system was obligated to honor.

And that, I realized, is a very human bug. We do it constantly: "this is the *minimal* version," we say, in the same breath as a plan to break it into sub-tasks. "Smallest viable" becomes a thing we subdivide. The word stops being a commitment and becomes a mood.

## The fix is to make the word mean something

The repair was small. It was not a smarter recursion or a bigger model. It was a base case — the thing recursion is *defined by* and the thing this system never actually had for atomic work:

```python
def _declares_smallest(task) -> bool:
    text = (task["id"] + " " + task["objective"]).lower()
    return any(k in text for k in (
        "minimal", "smallest", "atomic", "indivisible",   # it called ITSELF the smallest unit
        "scaffold", "materialize", "skeleton",            # structurally anti-decomposable
    ))

def at_floor(task, depth) -> bool:
    return depth >= MAX_DEPTH or len(task["scope"]) <= 1 or _declares_smallest(task)
```

A task at the floor is never split. It is built whole or it fails — full stop. No basement.

Two things are now true that weren't before. First, a scaffold is treated as one atomic unit: the Splitter is told to emit it as a *single* task whose scope lists **all** the skeleton files, so the implementer can lay the whole web down at once. Second — and this is the part I like — **if the Splitter calls a task "minimal," it has to take responsibility for that word.** You said minimal; that *is* the granularity now; converge on it or fail on it, but you don't get to escape into a smaller "minimal." The label became a contract.

## The lesson hiding in the joke

It's funny because it's particle physics, but the real moral is duller and more useful: **in a recursive system, the base case is the entire design.** Everyone admires the recursive step — the elegant "and then it splits itself." Almost nobody specifies, with equal care, *where it is not allowed to recurse*. That omission is invisible right up until it meets something genuinely indivisible, and then it runs forever.

Granularity is not discovered by infinite subdivision. At some point you have to *declare* the floor and own the declaration. Physicists got to keep splitting because nature kept providing a smaller layer. Software doesn't owe you one. Sometimes the smallest unit is the whole skeleton, and the only correct move is to stop calling it "minimal" ironically and start treating the word as a promise.
