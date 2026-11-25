import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const html = await readFile("public/index.html", "utf8");
const source = await readFile("public/appearance.js", "utf8");

function makeButton(choice) {
  const attributes = {};
  return {
    dataset: { appearance: choice },
    setAttribute: (name, value) => (attributes[name] = String(value)),
    attributes,
    click() {
      this.onclick({ currentTarget: this });
    },
    addEventListener(type, listener) {
      assert.equal(type, "click");
      this.onclick = listener;
    },
  };
}

function load(stored) {
  const storage = new Map(stored ? [["appearance", stored]] : []);
  const buttons = ["light", "dark", "system"].map(makeButton);
  const root = { dataset: {} };
  const listeners = {};
  const document = {
    documentElement: root,
    querySelectorAll: () => buttons,
    addEventListener: (type, listener) => (listeners[type] = listener),
  };
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  vm.runInNewContext(source, { document, localStorage });
  listeners.DOMContentLoaded?.();
  const pressed = () =>
    buttons.filter((b) => b.attributes["aria-pressed"] === "true").map((b) => b.dataset.appearance);
  return { buttons, root, storage, pressed };
}

test("page offers light, dark and system choices", () => {
  for (const choice of ["light", "dark", "system"]) {
    assert.match(html, new RegExp(`<button[^>]*data-appearance="${choice}"`));
  }
});

test("page loads the appearance script before the body", () => {
  const head = html.split("</head>")[0];
  assert.match(head, /<script src="\/appearance\.js"><\/script>/);
});

test("page follows the system setting by default", () => {
  assert.match(html, /color-scheme:\s*light dark/);
  assert.match(html, /\[data-theme="light"\]\s*{[^}]*color-scheme:\s*light/);
  assert.match(html, /\[data-theme="dark"\]\s*{[^}]*color-scheme:\s*dark/);
});

test("with nothing stored, no theme is forced and system is pressed", () => {
  const { root, pressed } = load();
  assert.equal(root.dataset.theme, undefined);
  assert.deepEqual(pressed(), ["system"]);
});

test("a stored choice is applied immediately", () => {
  assert.equal(load("dark").root.dataset.theme, "dark");
  assert.equal(load("light").root.dataset.theme, "light");
});

test("an unknown stored value is ignored", () => {
  const { root, pressed } = load("neon");
  assert.equal(root.dataset.theme, undefined);
  assert.deepEqual(pressed(), ["system"]);
});

test("choosing dark forces dark, remembers it, and marks the button", () => {
  const { buttons, root, storage, pressed } = load();
  buttons[1].click();
  assert.equal(root.dataset.theme, "dark");
  assert.equal(storage.get("appearance"), "dark");
  assert.deepEqual(pressed(), ["dark"]);
});

test("choosing system clears the forced theme and the memory", () => {
  const { buttons, root, storage, pressed } = load("dark");
  buttons[2].click();
  assert.equal(root.dataset.theme, undefined);
  assert.equal(storage.has("appearance"), false);
  assert.deepEqual(pressed(), ["system"]);
});

test("the page still works when storage throws", () => {
  const document = {
    documentElement: { dataset: {} },
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const localStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  assert.doesNotThrow(() => vm.runInNewContext(source, { document, localStorage }));
});
