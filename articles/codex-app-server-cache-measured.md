---
title: "We Got the Prompt Cache Working. Our Pipeline Got Slower."
slug_title: codex-app-server-cache-measured
published: false
tags: ai, llm, performance, openai
description: Everyone told us to put a resident app-server under our AI agents — amortize startup, reuse threads, let the prompt cache pay for everything. We measured it four times. The cache hit 86%. The pipeline got slower and 39% more expensive. Here is what codex app-server is actually for.
---

> "You're spawning a fresh `codex exec` for every single call? Just run the app-server and reuse a thread. The prompt cache alone will pay for it."

That sentence sounds so obviously right that nobody ever benchmarks it. We run a small bazaar of headless AI daemons — designers, reviewers, code workers — and each one shells out to OpenAI's Codex CLI dozens of times per work item. A resident `codex app-server --stdio` with warm threads looked like free money.

We measured it four times. The prompt cache eventually hit 86% on the turns that mattered. The pipeline got *slower* than the boring baseline, and 39% more expensive in raw tokens.

This is the story of why, and of what app-server is actually for.

The setup was deliberately minimal: no resident daemon, no pool. The server is spawned privately for **one formation**, runs its turns, and is killed by a context manager on the way out — success or crash. That keeps the comparison honest: same lifecycle as a subprocess, and adopting it stays a measurement problem instead of an architecture debate.

## Trusting the probe

Before writing any integration, we cloned the actual `openai/codex` source and pointed a probe at a real app-server: handshake, per-turn sandbox overrides, interrupts, forks, kill-and-resume. Eight checks, all green, plus three findings you won't find in any docs:

- `cwd` and `sandboxPolicy` are **sticky when omitted** — every turn must re-state them explicitly, or turn 3 silently inherits turn 2's write access.
- Token usage arrives on `thread/tokenUsage/updated`, not on `turn/completed`.
- An empty thread that never ran a turn is never materialized — you cannot resume it later. Pre-warming a thread pool is a trap.

And the seductive one: on the probe's trivial two-turn thread, turn 2 reported **15,104 cached input tokens**. See? The cache works. Ship it.

That number cost us three more measurement runs to un-believe.

## The four runs

Same fixture repo, same greenfield request, one real four-stage formation each:

| | A: `codex exec` (baseline) | B: app-server | C: + unified schema | D: + prompt slimming |
|---|---:|---:|---:|---:|
| formation wall | 204.4 s | **137.5 s** | 205.1 s | 218.0 s |
| processes spawned | 4 | 1 | 1 | 1 |
| raw total tokens | **79,640** | 111,855 | 115,062 | 110,385 |
| cached share | 0% | **0%** | 66.4% | 69.7% (85.8% on turns 2–4) |
| output quality | pass | pass | pass | pass |

**Run B** — the naive port. One server, one thread, four turns. 33% faster. And the cache that the probe promised? **Zero. On every turn.**

**The cache autopsy** was the best part. The structured-output JSON schema is rendered into the model's context *before* the system message — it is part of the cached prefix. Our four stages each pass a different schema, so every turn invalidated the entire prefix. A controlled micro-test confirmed it: keep the schema identical across turns and 90.8% of the input comes back cached. The probe's trivial turns had shared one schema by accident. Real formations never did.

**Run C** — one unified envelope schema for all four stages, per-stage validation moved client-side. The cache came alive: 66% overall. The speedup died: wall time back to baseline. And raw tokens were now 44% *above* baseline, because the thread history accumulates every previous turn on top of the prior-stage results we were still embedding in each prompt. We were paying for the same context twice.

**Run D** — so remove the embeddings and let the thread history carry the context. That is the endgame everyone imagines when they say "reuse the thread." Input dropped by… 4.7%. The history *already contains* everything the embeddings contained — deleting the copy you control does nothing about the copy the thread keeps for you. Cache share peaked at 85.8% on turns 2–4. Wall time: slowest of all four runs.

Cache and speed never composed. The only fast run was the one with zero cache. The cheapest run was the boring baseline.

## So what is app-server for?

Look at what the protocol actually offers: `thread/list`, `thread/resume`, `thread/fork`, `turn/interrupt`, fine-grained delta notifications, live token-usage updates. That is not a batch accelerator. That is the backend of an **interactive session** — an IDE extension, a chat panel. A human watching streamed output, hitting stop, branching a conversation, reopening yesterday's session.

Model latency is identical either way (we measured 3.58 s vs 3.64 s per turn). The only thing a resident server amortizes for a headless pipeline is ~0.17 s of process startup. Meanwhile its headline feature — the thread that remembers everything — is precisely what an auditable multi-agent system must refuse: our provenance lives in git commits and CUE records, not in a model's conversational memory. A hidden transcript that influences output is not a cache. It is unaccounted state.

For headless one-shot work, `codex exec` isn't the naive option. It is the designed-for option.

## What we kept

The dormant pilot (opt-in behind an env var, default off), the measurement rig (four reproducible drivers), and — honestly the best return on the whole detour — the bug harvest from reading the source instead of the README:

- `exec resume` rebuilds config **from the current invocation**. Omit `--sandbox workspace-write` on resume and your coder resumes read-only. Omit nothing, ever; centralize command construction.
- `--ephemeral` sessions are never registered in the thread store. Resuming one is not "flaky" — it is impossible by design.
- Structured output requires `required` to list **every** key in `properties`, recursively. One optional property = HTTP 400 on every real call, while your mocked tests stay green. Translate provider-side contracts into local red tests.
- Reconnect chatter arrives as JSONL `error` events **on stdout**. If your liveness monitor counts them as heartbeats, a dead upstream with a chatty client is immortal. Diagnostics are not liveness.

Four runs, one conclusion: measure before you migrate — and when a feature's headline benefit is your architecture's anti-feature, no benchmark will rescue it. The benchmark's job is to let you stop wanting it.
