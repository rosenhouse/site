import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("index page says hello world", async () => {
  const html = await readFile("public/index.html", "utf8");
  assert.match(html, /<h1>hello world<\/h1>/);
});
