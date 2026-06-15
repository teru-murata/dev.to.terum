#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const root = process.cwd();
const articlesDir = path.join(root, "articles");
const apiKey = process.env.DEVTO_API_KEY;
const dryRun = process.env.DEVTO_DRY_RUN === "true";

async function listMarkdownFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function parseFrontMatter(source, filePath) {
  if (!source.startsWith("---\n")) {
    throw new Error(`${filePath}: missing front matter`);
  }

  const end = source.indexOf("\n---", 4);
  if (end === -1) {
    throw new Error(`${filePath}: unterminated front matter`);
  }

  const raw = source.slice(4, end).trim();
  const body = source.slice(end + 4).replace(/^\n/, "");
  const data = {};

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      throw new Error(`${filePath}: unsupported front matter line: ${line}`);
    }
    data[match[1]] = parseValue(match[2]);
  }

  return { data, body };
}

function parseValue(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null" || trimmed === "") return null;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => parseValue(item.trim()))
      .filter(Boolean);
  }
  return trimmed;
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.join(", ");
  if (typeof tags === "string") return tags;
  return "";
}

function assertAsciiTitle(filePath, title) {
  if (/[^\x20-\x7E]/.test(title)) {
    throw new Error(`${filePath}: title must be ASCII-only for stable dev.to URL generation`);
  }
}

function assertSlugTitle(filePath, slugTitle) {
  if (slugTitle == null) return;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugTitle)) {
    throw new Error(`${filePath}: slug_title must be lowercase ASCII kebab-case`);
  }
}

function assertDevtoId(filePath, devtoId) {
  if (devtoId == null) return;
  if (!/^[0-9]+$/.test(String(devtoId))) {
    throw new Error(`${filePath}: devto_id must be a numeric dev.to article id`);
  }
}

function payloadFor(filePath, parsed) {
  const { data, body } = parsed;
  if (!data.title) throw new Error(`${filePath}: title is required`);
  assertAsciiTitle(filePath, data.title);
  assertSlugTitle(filePath, data.slug_title);
  assertDevtoId(filePath, data.devto_id);

  return {
    article: {
      title: data.title,
      body_markdown: body,
      published: data.published === true,
      tags: normalizeTags(data.tags),
      canonical_url: data.canonical_url,
      description: data.description ?? undefined,
      series: data.series ?? undefined,
      main_image: data.main_image ?? undefined,
    },
    slugTitle: data.slug_title ?? null,
    devtoId: data.devto_id ?? null,
  };
}

async function devToFetch(pathname, options = {}, attempt = 1) {
  const response = await fetch(`https://dev.to/api${pathname}`, {
    ...options,
    headers: {
      "api-key": apiKey,
      accept: "application/vnd.forem.api-v1+json",
      "content-type": "application/json",
      "user-agent": "teru-murata/dev.to.terum GitHub Actions",
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }

  if (!response.ok) {
    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < 5) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const delayMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 3000;
      console.warn(`${options.method ?? "GET"} ${pathname} failed with ${response.status}; retrying in ${delayMs}ms.`);
      await sleep(delayMs);
      return devToFetch(pathname, options, attempt + 1);
    }
    throw new Error(`${options.method ?? "GET"} ${pathname} failed: ${response.status} ${JSON.stringify(json)}`);
  }
  return json;
}

let files = await listMarkdownFiles(articlesDir);

// Only sync the articles that changed in this push (CHANGED_ARTICLES, set by the workflow), so
// editing one article never re-pushes — and never reverts — the others on dev.to. A manual
// workflow_dispatch sets SYNC_ALL=true for a deliberate full re-sync.
if (process.env.SYNC_ALL !== "true") {
  const changed = (process.env.CHANGED_ARTICLES ?? "").trim();
  const changedSet = new Set(
    changed ? changed.split(/\s+/).filter(Boolean).map((p) => path.resolve(root, p)) : []
  );
  files = files.filter((f) => changedSet.has(path.resolve(f)));
  console.log(`Scoped to ${files.length} changed article(s)${changed ? `: ${changed}` : ""}.`);
}

if (files.length === 0) {
  console.log("No dev.to article files to sync.");
  process.exit(0);
}

if (!apiKey && !dryRun) {
  throw new Error("DEVTO_API_KEY is required. Add it as a GitHub Actions secret.");
}

const planned = [];
for (const file of files) {
  const source = await readFile(file, "utf8");
  const parsed = parseFrontMatter(source, path.relative(root, file));
  const payload = payloadFor(path.relative(root, file), parsed);
  planned.push({ file, payload });
}

if (dryRun) {
  for (const item of planned) {
    const slugText = item.payload.slugTitle ? ` slug_title=${item.payload.slugTitle}` : "";
    const idText = item.payload.devtoId ? ` devto_id=${item.payload.devtoId}` : "";
    console.log(`[dry-run] ${path.relative(root, item.file)} -> ${item.payload.article.title}${slugText}${idText}`);
  }
  process.exit(0);
}

function logResult(action, relative, article, fallbackUrl) {
  const url = article.url ?? fallbackUrl;
  const idText = article.id ? ` id=${article.id}` : "";
  if (article.published) {
    console.log(`${action} ${relative}:${idText} published at ${url}`);
  } else {
    console.log(`${action} ${relative}:${idText} saved as dev.to draft.`);
    console.log(`Drafts are not public; ${url} may return 404 until published.`);
    console.log("Open https://dev.to/dashboard to review unpublished articles.");
  }
}

for (const item of planned) {
  const relative = path.relative(root, item.file);
  const fallbackUrl = item.payload.article.canonical_url;

  if (item.payload.devtoId) {
    // Publishing is monotonic: the repo flag may PUBLISH, never UN-PUBLISH. You can publish from the
    // dev.to UI too, and a repo `published: false` must not revert a live article back to a draft.
    let article = item.payload.article;
    if (article.published === false) {
      try {
        const current = await devToFetch(`/articles/${item.payload.devtoId}`);
        if (current && current.published) {
          article = { ...article, published: true };
          console.log(`${relative}: already published on dev.to — keeping it published (not reverting to draft).`);
        }
      } catch {
        // If we can't read the current state, fall back to a content-only update that does not
        // touch the published flag, so we still never accidentally un-publish.
        const { published, ...rest } = article;
        article = rest;
      }
    }
    const updated = await devToFetch(`/articles/${item.payload.devtoId}`, {
      method: "PUT",
      body: JSON.stringify({ article }),
    });
    logResult("Updated", relative, updated, fallbackUrl);
  } else {
    const createPayload = item.payload.slugTitle
      ? { article: { ...item.payload.article, title: item.payload.slugTitle } }
      : { article: item.payload.article };
    const created = await devToFetch("/articles", {
      method: "POST",
      body: JSON.stringify(createPayload),
    });
    if (item.payload.slugTitle && created.id) {
      const updated = await devToFetch(`/articles/${created.id}`, {
        method: "PUT",
        body: JSON.stringify({ article: item.payload.article }),
      });
      logResult("Created", relative, updated, fallbackUrl);
    } else {
      logResult("Created", relative, created, fallbackUrl);
    }
  }
}
