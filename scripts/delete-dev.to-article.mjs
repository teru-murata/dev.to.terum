#!/usr/bin/env node

const apiKey = process.env.DEVTO_API_KEY;
const articleId = process.env.DEVTO_ARTICLE_ID;

if (!apiKey) {
  throw new Error("DEVTO_API_KEY is required.");
}

if (!articleId || !/^[0-9]+$/.test(articleId)) {
  throw new Error("DEVTO_ARTICLE_ID must be a numeric article id.");
}

const response = await fetch(`https://dev.to/api/articles/${articleId}`, {
  method: "DELETE",
  headers: {
    "api-key": apiKey,
    accept: "application/vnd.forem.api-v1+json",
    "content-type": "application/json",
    "user-agent": "teru-murata/dev.to.terum GitHub Actions",
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
  throw new Error(`DELETE /articles/${articleId} failed: ${response.status} ${JSON.stringify(json)}`);
}

console.log(`Deleted dev.to article id=${articleId}`);
