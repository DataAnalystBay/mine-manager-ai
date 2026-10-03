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

test("homepage renders approved sections in order through Phase 4", async () => {
  const home = await read("../src/website/pages/HomePage.jsx");
  assert.match(home, /<StoryProgressRail\s*\/>/);
  assert.match(home, /<HeroSection\s*\/>\s*<TrustRail\s*\/>\s*<ChallengeSection\s*\/>\s*<InsightWorkflowSection\s*\/>\s*<MorningMeetingSection\s*\/>/);
  assert.doesNotMatch(home, /Integration|FinalCta/);
});

test("homepage story rail targets the stable implemented section ids", async () => {
  const config = await read("../src/website/config/homeSections.js");
  const rail = await read("../src/website/components/StoryProgressRail.jsx");
  const files = await Promise.all([
    read("../src/website/sections/home/HeroSection.jsx"),
    read("../src/website/sections/home/ChallengeSection.jsx"),
    read("../src/website/sections/home/InsightWorkflowSection.jsx"),
    read("../src/website/sections/home/MorningMeetingSection.jsx"),
  ]);

  for (const id of ["mine-manager-ai", "challenge", "solution", "use-case"]) {
    assert.match(config, new RegExp(`id: ["']${id}["']`));
    assert.ok(files.some((file) => new RegExp(`id=["']${id}["']`).test(file)));
  }
  assert.match(rail, /IntersectionObserver/);
  assert.match(rail, /prefers-reduced-motion: reduce/);
  assert.match(rail, /aria-current/);
  assert.match(rail, /min-width: 1560px/);
});

test("morning meeting uses the approved authentic product screenshot", async () => {
  const section = await read("../src/website/sections/home/MorningMeetingSection.jsx");
  const expected = "/website-v2/screenshots/meeting/morning-management-meeting-real.png";
  const room = "/website-v2/screenshots/meeting/meeting-room-reference.png";
  assert.match(section, new RegExp(expected.replaceAll("/", "\\/")));
  assert.match(section, new RegExp(room.replaceAll("/", "\\/")));
  await access(new URL(`../public${expected}`, import.meta.url));
  await access(new URL(`../public${room}`, import.meta.url));
  assert.doesNotMatch(section, /macOS|address bar|window controls/i);
});

test("document title is the approved Website V2 title", async () => {
  const html = await read("../index.html");
  assert.match(html, /<title>Mine Manager AI \| Уурхайн удирдлагын AI платформ<\/title>/);
});
