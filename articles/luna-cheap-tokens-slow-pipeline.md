---
title: "The Cheapest Model Ran My Pipeline for Nine Hours and Barely Started"
slug_title: luna-cheap-tokens-slow-pipeline
published: false
tags: ai, llm, openai, performance
description: GPT-5.6-Luna costs a fifth of Sol per token, so I pointed my multi-stage agent pipeline at it. Nine hours later it was still on the second sub-stage. The bill would have been tiny. The throughput was a disaster - and the logs said exactly why.
---

> "Luna is a fifth of the price per token. Just run the pipeline on Luna."

I have a design pipeline built out of small, chained model calls: an
intake stage grounds a rough request, then formation walks through
normalize → select approach → implementation strategy → patch plan,
each one a separate structured-output call. On GPT-5.6-Sol a full
formation took about two and a half hours. When I saw that GPT-5.6-Luna
bills **25 credits per million input tokens against Sol's 125**, the
move looked obvious. Same 272K context window, a fifth of the cost.

I switched the daemon to Luna and let it run with no time cap - the
pipeline's own contract is that a carrier turn is paid-for cognition
you don't kill on a wall-clock. Good thing, too, because I checked back
**nine hours later** and it was still inside formation, on the
`normalize_problem` sub-stage. One stage. Nine hours.

## The logs, not the vibes

The temptation is to conclude "Luna is slow" and move on. The logs said
something more specific. I bucketed every rate-limit event by minute
across the whole 9.5-hour run:

```
429 / rate-limit events: 648
window: 15:01Z → 00:30Z (9.5 hours)
minutes with a 429: 185 of 512 (36%)
busiest minute: 32 events; the rest 18, 17, 15, 14...
```

Two things matter here. First, **648 rate-limit rejections** against
**12 turns actually purchased**. The model was not thinking slowly; it
was standing in line. Second, the distribution: no spike, no bad hour.
36% of every minute across nine hours carried a 429, evenly. That rules
out "the servers were busy at 3pm." A flat 36% for nine hours is a
*standing* cap the workload keeps hitting, not weather.

## Why the cheap model throttles a pipeline

This is where the pricing sheet stops being about money and starts
being about architecture. Luna's headline is cheap tokens, but the
same tier tables show the other side: **Luna allows 50-280 messages per
window; Sol allows 15-90.** Different models, different *kinds* of cap.
Sol meters you loosely on message count and lets each message be
expensive. Luna meters you tightly on message *frequency* and makes
each one cheap.

A formation pipeline is the worst possible shape for that trade. It
does not send one big request; it fires a burst of small structured
calls in quick succession - normalize, then select, then strategy, each
resuming the moment the last one settles. That burst pattern slams
straight into a per-window request ceiling. The very thing that makes
Luna cheap - "lots of small cheap messages" - is billed by a counter
that a high-frequency agent pipeline exhausts in minutes.

Sol never showed this because Sol's cap is shaped for the opposite
profile: fewer, heavier messages. My formation's ~150-minute runs on
Sol fit under its message ceiling with room to spare. Same pipeline,
same code, a model swap - and the bottleneck moved from the model's
reasoning to the account's request counter.

## The rule I'd write on the wall

Per-token price is the wrong axis for choosing a model to run an agent
pipeline on. What matters is the **shape of the rate limit** against
the **shape of your request pattern**:

- **Bursty, high-frequency, many small calls** (agent pipelines,
  fan-out, resume-heavy formation): you are request-count limited.
  Cheap-per-token models with tight message ceilings will throttle you
  into the ground no matter how small each call is.
- **Few, large, token-heavy calls** (one big generation, long
  context): you are token limited, and the cheap-per-token model is
  exactly right.

The exact numbers are per-account and per-tier and live only on your
own dashboard - OpenAI doesn't publish one figure that covers Sol,
Terra, and Luna. But you don't need the exact figure to make the call.
Count how many model calls your task fires per minute. If it's a burst,
the cheapest token is a trap: you'll pay almost nothing and wait almost
forever.

I killed nothing and changed nothing while it ran - the pipeline's
no-cap contract meant Luna would have finished eventually, at whatever
pace the 429s allowed. But "eventually, over days, for pennies" is not
a throughput I can plan around. The nine hours weren't the model
thinking. They were the model waiting for permission to think.

Sources: [GPT-5.6 usage limits (WaveSpeed)](https://wavespeed.ai/blog/cost-and-billing/gpt-5-6-usage-limits/), [Codex rate card (OpenAI Help)](https://help.openai.com/en/articles/20001106-codex-rate-card), [GPT-5.6-Luna model docs](https://developers.openai.com/api/docs/models/gpt-5.6-luna)
