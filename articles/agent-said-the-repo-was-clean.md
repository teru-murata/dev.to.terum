---
title: "My Agent Said the Repo Was Clean. It Said That Three Times."
slug_title: agent-said-the-repo-was-clean
published: false
tags: ai, git, security, devops
description: I rebuilt a public repo from scratch to purge my personal email from its history. The agent doing the work reported "clean" three times. It was wrong three times, and I caught every one of them by asking. Here is what was actually in there, why rewriting history would not have removed it, and the scan that finally worked.
---

I run a small company site out of a public GitHub repo. Last week I noticed something I disliked: my personal Gmail address authored most of its commits. It isn't exactly a secret — anyone can pull a director's name off the corporate registry for a few hundred yen — but it ends up on spam lists, and I wanted it gone.

So I asked my coding agent to purge it. Back up everything, delete the repo, recreate it under the same name so the URL survives, and push a single fresh commit with a `noreply` identity.

It did that. Then it told me the repo was clean.

It said that three times over two days. Each time I asked one more question, and each time we found something else. I am writing this down because the interesting part isn't that an agent missed things. It's *which* things it missed, and *why the scan reporting "zero detections" was structurally incapable of finding them.*

## Why my email was in there at all

Start with the part that surprised me most, because it's a default nobody mentions.

```
$ git config --global user.email
$ git config user.email
$
```

Both empty. No `[user]` section anywhere.

Git does not refuse to commit in that state. It synthesizes an identity from the operating system: `username@hostname`. On my machine that means `<username>@<hostname>` — my account name and the box name. On a laptop with mDNS you get `you@MacBook-Pro.local`. On a home server, `you@nas.local`.

That value gets baked into the commit object. It becomes part of the commit hash. You cannot edit it out later; you can only rebuild history and replace every SHA.

So there are two ways personal data ends up in a public commit, and I had exposed myself to both:

- `user.email` is set to something real → that address is now permanent and public
- `user.email` is unset → **your machine's username and hostname** are now permanent and public

The second option is worse, and it is exactly what you get by doing nothing.

## Miss #1: it was not only in the commits

The agent finished the rebuild, scanned the changed files, reported zero detections, and called it done. I asked it to look again, specifically at the contact page.

The contact form posts to a serverless endpoint:

```html
<form action="https://<project>.<account-subdomain>.workers.dev" method="POST">
```

Cloudflare derives that account subdomain from the account name, which it derived from — of course — the local part of my Gmail address. My personal email, entirely reconstructable from the source of the company's *contact page*. Live in production the whole time. Nothing to do with git.

This is the first lesson, and it has nothing to do with agents. **Identity doesn't just leak through commit metadata. It leaks through every third-party service whose free tier grants a subdomain named after your account.** Workers, Netlify, Vercel previews, ngrok, Supabase, Railway. If you signed up with a personal address and never set a custom domain, the hostname in your production HTML is an identity disclosure.

The agent didn't miss this because the scan failed. It missed it because it only scanned *the files it had just changed*. Everything else in the repo was out of scope, and nobody said so out loud.

## The part that makes "just rewrite the history" useless

Before the rebuild, the cheap, obvious option sat on the table: rewrite all 112 commits with `git filter-repo --mailmap`, force-push, keep the repo, the issues, and the pull requests. No deletion, no downtime, no `delete_repo` scope.

I nearly took it. Then we measured what would actually survive.

GitHub creates a read-only ref for every pull request: `refs/pull/<N>/head`. You cannot force-push it. You cannot delete it, because you cannot delete a pull request. Anything reachable from it pins forever, immune to garbage collection.

My repo had nine closed PRs. Every one branched off `main`, so the union of those refs reached the entire old history:

```
commits reachable from refs/pull/*            116
of those, authored with the personal address   94
personal-address commits in the repo overall   94
```

94 out of 94. A history rewrite would have scrubbed my email from the `main` branch view and nowhere else. It would still sit in the Commits tab of nine closed PRs, in `/commit/<sha>.patch`, and throughout the REST API.

| | rewrite + force-push | delete + recreate |
|---|---|---|
| personal address removed | **0 of 94** | 94 of 94 |
| site URL preserved | yes | yes (same org + repo name) |
| PRs and branches | kept | gone |
| downtime | none | deletion → Pages rebuild |
| extra token scope | none | `delete_repo` |

If your repo has ever had a pull request, **history rewriting does not remove PII.** I have seen this advice confidently given everywhere, including by me, an hour before I measured it.

## Miss #2: the scan that could not see

Rebuild done. New repo, one commit, `noreply` identity everywhere. The agent scanned all 211 tracked files for usernames, home paths, hostnames, tokens, and keys. It reported **zero detections**.

I asked one more question: *the commit history doesn't have PII, right?*

It went back with a different method and found about 500 lines of this:

```
--window-size=320,1000 --screenshot=/private/tmp/shot-320.png
  file:///Users/<username>/dev/<repo>/index.html
```

My OS username, sitting in a public repo, five hundred times.

### Where it came from

`.agent-runs/` — raw stdout/stderr from coding-agent runs, committed as audit evidence by the project's own governance framework. One agent carrier shelled out to Chrome to take screenshots, and the CLI echoed the full command line, absolute paths and all, directly into stderr. That isn't a bug in the tool. Printing the failing command is exactly what every well-behaved CLI does.

### Why the guard was not there

There was a guard. Here is the timeline:

```
06-12 01:11   .gitignore gains  .agent-runs/          guard in place
06-12 07:02   Revert "Merge pull request #2"
              → .gitignore deleted entirely            guard silently gone
06-12 12:36   .agent-runs/ starts getting committed
06-12 13:23   the stderr logs land                     leak
06-14 19:41   .gitignore restored with .agent-runs/    too late
```

A revert of a merge took `.gitignore` with it, because the reverted PR originally added the file. Nobody noticed a deletion hiding inside a revert. Five hours later, the ignore rule was gone, and the logs went in.

Restoring it on 06-14 did nothing, thanks to a git rule that is easy to learn and easy to forget under pressure: **`.gitignore` has no effect on already-tracked files.** Once a path hits the index, adding it to `.gitignore` is a permanent no-op. You must `git rm --cached` it.

### Why the first scan reported zero

This is the part worth internalizing. The scan looked roughly like this:

```bash
grep -rlE '<username>|/home/|C:\\Users' .    # → 0 files
```

`.agent-runs/` contains multi-megabyte logs and binary artifacts — PNGs, a PDF. Over a tree like that, a recursive grep of this shape does not reliably report what you think it reports. But the `0` came back looking exactly like a real `0`.

The agent then reported that zero **as a fact about the repository**, when it was merely a fact about the scan.

The method that actually worked enumerates git objects directly, reading each one straight out of the object database. Nothing gets skipped for being large, binary, ignored, or oddly encoded:

```bash
# every blob reachable from a ref, with its path
git rev-list --objects --all \
| awk 'NF>1{print $1, substr($0, index($0," ")+1)}' \
| while read -r oid path; do
    [ "$(git cat-file -t "$oid")" = blob ] || continue
    n=$(git cat-file -p "$oid" | grep -acE '/Users/|/home/[a-z]|C:\\Users|\.local|192\.168\.|10\.[0-9]+\.' ) || true
    [ "$n" -gt 0 ] && printf '%s\t%s\n' "$n" "$path"
  done
```

Same patterns. Different answer. The tree-walk saw nothing; the object-walk found eight files.

**A scan is not evidence until you prove it can find a string you know is present.** Plant a canary, run the scan, confirm it screams. If it doesn't scream, your zero means nothing. I wrote almost exactly this rule in an earlier post about agents inventing capabilities — *a self-reported fact is not evidence* — and then lazily accepted a self-reported zero from an untested scanner.

## This is not a niche problem

I searched to see if any of this was known, because it felt too stupid to be novel.

It is extremely known, and agents are actively making it worse.

- **5.8 million** unique commit email addresses were extracted from GitHub Archive data covering 2011–2015 and published as a dataset. It only came down after GitHub asked. Commit author emails never appear in the web UI but stream freely from the public API. This is why researchers routinely describe it as the most common OSINT leak on the platform. ([paper](https://ar5iv.labs.arxiv.org/html/1908.05354), [dataset](https://github.com/cirosantilli/all-github-commit-emails))
- A tool called **leakguard** exists for exactly this, and its pitch names the exact mechanism: when `user.email` is unset, git invents `user@<hostname>`, and *"AI agents (Claude Code, Cursor, Aider) then co-sign public commits with that identity, and their diffs paste internal hostnames, LAN IPs and home paths into permanent public history."* Its passive survey of public commit search found **roughly 1 in 3** home-server-identity commits leaking an internal hostname, with **about 91%** resolving to a real GitHub account. ([leakguard](https://github.com/sakebomb/leakguard))
- GitGuardian's 2026 secrets-sprawl report puts **AI-assisted commits at roughly double the platform baseline rate** for leaked secrets, counting 24,008 unique secrets in MCP configuration files alone. ([GitGuardian](https://docs.gitguardian.com/releases/saas/2026/09/07/changelog))

What I couldn't find anywhere is a firm number for how many developers actually configure a `noreply` address. GitHub doesn't publish it, and I found no study measuring it. So I won't pretend to know the denominator. What is measured is the numerator, and it sits in the millions.

The agent angle isn't that agents are careless. It is **volume and surface**. An agent commits more often than you do, it commits while you are looking at something else, and it writes raw tool output into the repo as evidence. Every one of those is a direct path from your filesystem into permanent public history, and none of them pass a human reading a diff.

## What actually closes it

Two lines, once per machine:

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@users.noreply.github.com"
```

Get the exact `noreply` address from GitHub → Settings → Emails. While you are there, turn on **Keep my email addresses private** and **Block command line pushes that expose my email**. That second checkbox forces GitHub to reject the push rather than letting you find out about the leak years later.

There is also:

```bash
git config --global user.useConfigOnly true
```

This makes git **refuse to commit** rather than synthesize `user@hostname`. Worth knowing: if you set a global identity, this flag never fires, because the global value always satisfies it. Setting both is belt-and-braces for the day your global config gets clobbered — which, per the `.gitignore` story above, is hardly a hypothetical.

None of that touches the diff. For content, the guard must run whether or not anyone remembers it exists: a pre-commit hook or a CI job doing the object-walk above, failing the build on `/Users/`, `/home/<name>`, `C:\Users\`, `.local` hostnames, and RFC1918 addresses. My repo already had a policy document stating agent logs must never be committed. Policy documents do not enforce anything. The `.gitignore` that actually enforced it was deleted by a revert, and nobody noticed for two days.

## The honest ending

I don't get to finish this with everything fixed.

The identity side is closed: global `noreply`, `useConfigOnly`, all verified by committing in a throwaway repo and reading back the author. The contact-form subdomain is a deliberate accept — the cost of moving it exceeds the benefit right now.

The `.agent-runs/` logs are still public as I write this. The clean commit exists locally, verified blob by blob across 119 files, yielding zero detections by a method I have now actually tested. Publishing it requires deleting and recreating the repo one more time, and that step is blocked on my side for reasons unrelated to the content.

So: a rebuild meant to purge one email ended up surfacing a second identity leak on a live page, a permanent leak in nine closed pull requests, and five hundred copies of my username in committed tool output. And I'm still not done.

Every one of those failures came to light because I asked one more question instead of blindly accepting a green report. That is the whole method. I don't have a better one.
