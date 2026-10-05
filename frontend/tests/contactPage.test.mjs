import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("contact conversion page uses the approved mine asset and commercial structure", async () => {
  const contact = await read("../src/website/pages/ContactPage.jsx");
  const translations = await read("../src/website/i18n/websiteTranslations.js");
  const expected = "/website-v2/contact/contact-hero-mine.png";

  assert.match(contact, new RegExp(expected.replaceAll("/", "\\/")));
  await access(new URL(`../public${expected}`, import.meta.url));
  assert.match(translations, /Танай уурхайн management workflow дээр/);
  assert.match(translations, /See Mine Manager AI in your mine’s management workflow/);
  assert.match(contact, /demo-coverage-title/);
  assert.match(contact, /demo-steps-title/);
  assert.match(contact, /contact-closing-title/);
});

test("contact form exposes the approved fields, phone link, and accessible validation", async () => {
  const contact = await read("../src/website/pages/ContactPage.jsx");
  const translations = await read("../src/website/i18n/websiteTranslations.js");

  for (const id of ["name", "company", "role", "contact", "operation", "improve"]) {
    assert.match(contact, new RegExp(`id=\\"${id}\\"`));
  }
  assert.match(contact, /tel:\+97699105308/);
  assert.match(contact, /aria-invalid/);
  assert.match(contact, /role="status"/);
  assert.match(contact, /values\.name\.trim\(\)/);
  assert.match(contact, /values\.company\.trim\(\)/);
  assert.match(contact, /contact\.replace\(\/\\D\/g/);
  assert.match(translations, /Онлайн хүсэлт хүлээн авах холболт хараахан идэвхжээгүй/);
  assert.doesNotMatch(translations, /Хүсэлт хүлээн авлаа/);
});

test("public launch navigation skips Product while preserving its route", async () => {
  const navigation = await read("../src/website/config/navigation.js");
  const hero = await read("../src/website/sections/home/HeroSection.jsx");
  const demoCta = await read("../src/website/components/DemoCta.jsx");
  const app = await read("../src/App.jsx");

  assert.doesNotMatch(navigation, /product/);
  assert.match(hero, /to="\/contact"/);
  assert.match(hero, /pages\.home\.contactCta/);
  assert.match(app, /path="\/product"/);
  assert.match(app, /path="\/contact"/);
  assert.match(demoCta, /to="\/contact\?intent=demo"/);
});
