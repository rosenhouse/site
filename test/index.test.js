import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile("public/index.html", "utf8");

test("index page has a projects heading", () => {
  assert.match(html, /<h1>Some projects<\/h1>/);
});

test("index page links to each project", () => {
  for (const url of [
    "https://pdxplans.org/",
    "https://rosenhouse-bot-sandbox.github.io/science-viz/",
  ]) {
    assert.match(html, new RegExp(`<li><a href="${url}">`));
  }
});

test("index page links are live", async () => {
  const urls = [...html.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(urls.length > 0);
  for (const url of urls) {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    assert.ok(response.ok, `${url} returned ${response.status}`);
  }
});
