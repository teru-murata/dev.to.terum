#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

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

function payloadFor(filePath, parsed) {
  const { data, body } = parsed;
  if (!data.title) throw new Error(`${filePath}: title is required`);
  if (!data.canonical_url) throw new Error(`${filePath}: canonical_url is required`);

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
  };
}

async function devToFetch(pathname, options = {}) {
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
    throw new Error(`${options.method ?? "GET"} ${pathname} failed: ${response.status} ${JSON.stringify(json)}`);
  }
  return json;
}

async function existingArticlesByCanonicalUrl() {
  const articles = await devToFetch("/articles/me/all?per_page=1000");
  const byCanonical = new Map();
  for (const article of articles ?? []) {
    if (article.canonical_url) {
      byCanonical.set(article.canonical_url, article);
    }
  }
  return byCanonical;
}

const files = await listMarkdownFiles(articlesDir);
if (files.length === 0) {
  console.log("No dev.to article files found.");
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
    console.log(`[dry-run] ${path.relative(root, item.file)} -> ${item.payload.article.title}`);
  }
  process.exit(0);
}

const existingByCanonical = await existingArticlesByCanonicalUrl();

for (const item of planned) {
  const relative = path.relative(root, item.file);
  const canonicalUrl = item.payload.article.canonical_url;
  const existing = existingByCanonical.get(canonicalUrl);

  if (existing) {
    const updated = await devToFetch(`/articles/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify(item.payload),
    });
    console.log(`Updated ${relative}: ${updated.url ?? canonicalUrl}`);
  } else {
    const created = await devToFetch("/articles", {
      method: "POST",
      body: JSON.stringify(item.payload),
    });
    console.log(`Created ${relative}: ${created.url ?? canonicalUrl}`);
  }
}
