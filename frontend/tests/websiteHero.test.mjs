import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("homepage uses the approved authentic dashboard asset without recreating it", async () => {
  const hero = await read("../src/website/sections/home/HeroSection.jsx");
  const expected = "/website-v2/screenshots/dashboard/executive-dashboard-real.png";
  assert.match(hero, new RegExp(expected.replaceAll("/", "\\/")));
  await access(new URL(`../public${expected}`, import.meta.url));
  assert.doesNotMatch(hero, /laptop|device mockup/i);
});

test("hero uses only the approved decorative mining-context asset", async () => {
  const hero = await read("../src/website/sections/home/HeroSection.jsx");
  const expected = "/website-v2/illustrations/hero/mine-manager-ai-hero-v2.png";
  assert.match(hero, new RegExp(expected.replaceAll("/", "\\/")));
  await access(new URL(`../public${expected}`, import.meta.url));
  assert.match(hero, /aria-hidden="true"/);
  assert.match(hero, /display:\s*\{\s*xs:\s*"none",\s*md:\s*"block"\s*\}/);
});

test("dashboard uses an OS-neutral frame without decorative window controls", async () => {
  const hero = await read("../src/website/sections/home/HeroSection.jsx");
  assert.doesNotMatch(hero, /\["#d7ded9"/);
  assert.doesNotMatch(hero, /minimize|maximize|address bar|window controls/i);
  assert.match(hero, /height:\s*28/);
  assert.match(hero, /border:\s*"1px solid"/);
});

test("homepage contains only the approved Phase 2 sections", async () => {
  const home = await read("../src/website/pages/HomePage.jsx");
  assert.match(home, /<HeroSection\s*\/>/);
  assert.match(home, /<TrustRail\s*\/>/);
  assert.doesNotMatch(home, /Challenge|MorningMeeting|Integration|FinalCta/);
});

test("document title is the approved Website V2 title", async () => {
  const html = await read("../index.html");
  assert.match(html, /<title>Mine Manager AI \| Уурхайн удирдлагын AI платформ<\/title>/);
});
