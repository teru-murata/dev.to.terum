# dev.to.terum

dev.to article source and publishing workflow.

dev.to does not provide a Zenn-style native GitHub repository sync. This repository uses the official Forem/dev.to API from GitHub Actions.

## One-time setup

1. Open dev.to account settings.
2. Create an API key.
3. Add it to this GitHub repository as an Actions secret named `DEVTO_API_KEY`.

Secret URL:

https://github.com/teru-murata/dev.to.terum/settings/secrets/actions/new

## Article files

Put dev.to articles under `articles/*.md`.

Each file must start with front matter:

```yaml
---
title: DDD Is Not Dying. Cargo-Cult DDD Is.
slug_title: ddd-cargo-cult-ddd
published: false
tags: ai, architecture, ddd, engineeringmanagement
canonical_url: https://zenn.dev/teru_m/articles/ddd-bureaucracy-ai
description: Optional short description.
# Add this after the first successful create log.
# devto_id: 123456
---
```

If `devto_id` is present, the workflow updates that dev.to article. If `devto_id` is absent, it creates a new draft or published article depending on `published`.

After the first successful create run, copy the article id from the GitHub Actions log into `devto_id` before making subsequent edits. The workflow deliberately does not match by `canonical_url`; that avoids accidentally updating an old discarded draft that happens to share the same canonical URL.

`slug_title` is optional. dev.to does not expose a first-class slug field through the public API. When `slug_title` is present and the article is newly created, the workflow first creates the draft with `slug_title`, then immediately updates it to the real `title`. This keeps the generated dev.to slug short while preserving the visible title.

The workflow fails if `title` contains non-ASCII characters. It also fails if `slug_title` is not lowercase ASCII kebab-case, or if `devto_id` is present but non-numeric.

Keep `published: false` until the translated article is ready.
