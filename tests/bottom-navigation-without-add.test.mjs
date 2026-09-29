import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("the bottom navigation adds Conductores only on its own screen", () => {
  const component = app.match(/function BottomNavigation[\s\S]*?\n}\n/)?.[0] ?? "";
  assert.match(component, /IconHome/);
  assert.match(component, /IconUserCircle/);
  assert.match(component, /IconHome size=\{42\}/);
  assert.match(component, /IconUserCircle size=\{42\}/);
  assert.match(component, /onDrivers && <button/);
  assert.match(component, /IconChartBar size=\{36\}/);
  assert.match(app, /onDrivers=\{activeNav === "Conductores" \?/);
  assert.doesNotMatch(component, /IconPlus|bottom-navigation__add|onAdd/);
  assert.doesNotMatch(app, /function QuickActionMenu/);
  assert.match(css, /\.bottom-navigation\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
  assert.match(css, /\.app-shell--drivers \.bottom-navigation\s*\{[^}]*grid-template-columns:\s*repeat\(3,/s);
  assert.match(css, /\.bottom-navigation__item\s*\{[^}]*width:\s*48px;[^}]*height:\s*48px/s);
  assert.doesNotMatch(css, /\.bottom-navigation__add/);
});
