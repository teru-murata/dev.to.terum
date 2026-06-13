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
title: DDD Isn't Dead. DDD-Shaped Bureaucracy Is.
slug_title: ddd-bureaucracy-ai
published: false
tags: ai, architecture, management, ddd
canonical_url: https://zenn.dev/teru_m/articles/ddd-bureaucracy-ai
description: Optional short description.
---
```

The workflow matches existing dev.to articles by `canonical_url`. If an article already exists, it updates it. If not, it creates a new draft or published article depending on `published`.

`slug_title` is optional. dev.to does not expose a first-class slug field through the public API. When `slug_title` is present and the article is newly created, the workflow first creates the draft with `slug_title`, then immediately updates it to the real `title`. This keeps the generated dev.to slug short while preserving the visible title.

Keep `published: false` until the translated article is ready.
