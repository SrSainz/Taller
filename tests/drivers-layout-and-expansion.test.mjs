import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("daily driver panels expand in a dismissible viewport overlay", () => {
  assert.match(app, /const \[expandedDayPanel, setExpandedDayPanel\] = useState\(""\)/);
  assert.match(app, /renderDayPanel\("billing"\)/);
  assert.match(app, /renderDayPanel\("fuel"\)/);
  assert.match(app, /renderDayPanel\("mileage"\)/);
  assert.match(app, /event\.target === event\.currentTarget/);
  assert.match(app, /event\.key === "Escape"/);
  assert.match(app, /document\.body\.style\.overflow = "hidden"/);
  assert.match(css, /\.driver-day-panel-overlay__surface\s*\{[^}]*height:\s*52vh/s);
});

test("the driver month expands the calendar and closes from the backdrop or Escape", () => {
  assert.match(app, /const \[calendarExpanded, setCalendarExpanded\] = useState\(false\)/);
  assert.match(app, /className="drivers-calendar-card__month"/);
  assert.match(app, /setCalendarExpanded\(true\)/);
  assert.match(app, /className="drivers-calendar-overlay"/);
  assert.match(app, /event\.target === event\.currentTarget\) setCalendarExpanded\(false\)/);
  assert.match(css, /\.drivers-calendar-overlay__surface\s*\{[^}]*width:\s*min\(96vw,1500px\)[^}]*height:\s*min\(90dvh,920px\)/s);
  assert.match(css, /\.drivers-calendar-card--expanded[^{]*\.drivers-calendar-grid\s*\{[^}]*flex:\s*1 1 auto/s);
});

test("driver rows include photos, names enlarged by 15 percent and right-grouped metrics", () => {
  assert.match(app, /driver-list-card__avatar/);
  assert.match(app, /getDriverAvatarPath\(row\.driver\)/);
  assert.match(css, /\.driver-list-card__identity-copy > strong\s*\{[^}]*font-size:\s*15\.64px/s);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*?\.driver-list-card__identity-copy > strong\s*\{[^}]*font-size:\s*12\.88px/s);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(172px, max-content\) minmax\(142px, max-content\)/);
});
