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

test("homepage renders approved sections in order through Phase 6", async () => {
  const home = await read("../src/website/pages/HomePage.jsx");
  assert.match(home, /<StoryProgressRail\s*\/>/);
  assert.match(home, /<HeroSection\s*\/>\s*<TrustRail\s*\/>\s*<ChallengeSection\s*\/>\s*<InsightWorkflowSection\s*\/>\s*<MorningMeetingSection\s*\/>\s*<LeadershipLevelsSection\s*\/>\s*<IntegrationSection\s*\/>/);
  assert.doesNotMatch(home, /FinalCta/);
});

test("homepage story rail targets the stable implemented section ids", async () => {
  const config = await read("../src/website/config/homeSections.js");
  const rail = await read("../src/website/components/StoryProgressRail.jsx");
  const files = await Promise.all([
    read("../src/website/sections/home/HeroSection.jsx"),
    read("../src/website/sections/home/ChallengeSection.jsx"),
    read("../src/website/sections/home/InsightWorkflowSection.jsx"),
    read("../src/website/sections/home/MorningMeetingSection.jsx"),
    read("../src/website/sections/home/LeadershipLevelsSection.jsx"),
    read("../src/website/sections/home/IntegrationSection.jsx"),
  ]);

  for (const id of ["mine-manager-ai", "challenge", "solution", "use-case", "leadership", "integration"]) {
    assert.match(config, new RegExp(`id: ["']${id}["']`));
    assert.ok(files.some((file) => new RegExp(`id=["']${id}["']`).test(file)));
  }
  assert.match(rail, /IntersectionObserver/);
  assert.match(rail, /visibleIds\.add/);
  assert.match(rail, /homeSections\.length - 1/);
  assert.match(rail, /prefers-reduced-motion: reduce/);
  assert.match(rail, /aria-current/);
  assert.match(rail, /min-width: 1600px/);
  assert.match(rail, /whiteSpace: "nowrap"/);
});

test("integration section presents the approved commercial flow", async () => {
  const section = await read("../src/website/sections/home/IntegrationSection.jsx");
  const translations = await read("../src/website/i18n/websiteTranslations.js");
  for (const source of ["Excel", "Power BI", "SAP", "Fleet Systems", "Mining Systems", "Database / API"]) assert.match(section, new RegExp(`label: ["']${source.replace("/", "\\/")}["']`));
  for (const asset of ["excel.jpeg", "power-bi.jpeg", "sap.jpeg"]) {
    const expected = `/website-v2/integrations/${asset}`;
    assert.match(section, new RegExp(expected.replaceAll("/", "\\/")));
    await access(new URL(`../public${expected}`, import.meta.url));
  }
  assert.match(section, /id="integration"/);
  assert.match(section, /\/brand\/mine-manager-ai-logo\.png/);
  assert.match(translations, /Одоо байгаа системийг\\nсолихгүй\./);
  assert.match(translations, /Keep your existing systems\./);
  assert.doesNotMatch(section, /Management Decision|Final CTA|Demo/);
});

test("morning meeting uses the approved authentic product screenshot", async () => {
  const section = await read("../src/website/sections/home/MorningMeetingSection.jsx");
  const expected = "/website-v2/screenshots/meeting/morning-management-meeting-real.png";
  const room = "/website-v2/screenshots/meeting/meeting-room-reference-v2.png";
  assert.match(section, new RegExp(expected.replaceAll("/", "\\/")));
  assert.match(section, new RegExp(room.replaceAll("/", "\\/")));
  await access(new URL(`../public${expected}`, import.meta.url));
  await access(new URL(`../public${room}`, import.meta.url));
  assert.doesNotMatch(section, /top: "15%"|left: "58\.7%"|width: "39\.2%"/);
  assert.match(section, /morningMeeting\.visualAlt/);
  assert.match(section, /objectFit: "contain"/);
  assert.doesNotMatch(section, /macOS|address bar|window controls/i);
});

test("leadership cards use all five approved role illustrations", async () => {
  const section = await read("../src/website/sections/home/LeadershipLevelsSection.jsx");
  for (const filename of [
    "executive-leadership.png",
    "operations-manager.png",
    "technical-services-manager.png",
    "superintendent.png",
    "reporting-data-analyst.png",
  ]) {
    const expected = `/website-v2/illustrations/roles/${filename}`;
    assert.match(section, new RegExp(expected.replaceAll("/", "\\/")));
    await access(new URL(`../public${expected}`, import.meta.url));
  }
  assert.match(section, /objectFit: "contain"/);
  assert.doesNotMatch(section, /data-illustration-slot/);
});

test("document title is the approved Website V2 title", async () => {
  const html = await read("../index.html");
  assert.match(html, /<title>Mine Manager AI \| Уурхайн удирдлагын AI платформ<\/title>/);
});
