import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("public website, login and authenticated route contracts remain separated", async () => {
  const app = await read("../src/App.jsx");
  for (const route of ["/product", "/contact", "/login", "/app"]) {
    assert.match(app, new RegExp(`path=[{]?['\"]${route.replaceAll("/", "\\/")}['\"]`));
  }
  for (const child of ["production", "fleet", "plant", "safety", "reports", "executive-actions", "users", "audit-trail", "system-health"]) {
    assert.match(app, new RegExp(`path=[{]?['\"]${child}['\"]`));
  }
  assert.match(app, /<Route index element={<HomePage\s*\/>}\s*\/>/);
  assert.match(app, /<ProtectedRoute>\s*<MainLayout\s*\/>\s*<\/ProtectedRoute>/);
  assert.match(app, /<AdminRoute>\s*<UserManagement\s*\/>\s*<\/AdminRoute>/);
});

test("unauthenticated and unauthorized product users retain established redirects", async () => {
  const protectedRoute = await read("../src/components/ProtectedRoute.jsx");
  assert.match(protectedRoute, /if \(!isAuthenticated\)/);
  assert.match(protectedRoute, /to="\/login"/);
  assert.match(protectedRoute, /allowedRoles\.includes/);
  assert.match(protectedRoute, /to="\/app"/);
});

test("legacy product bookmarks continue to redirect under app", async () => {
  const app = await read("../src/App.jsx");
  const redirects = {
    upload: "/app/upload", production: "/app/production", fleet: "/app/fleet",
    plant: "/app/plant", safety: "/app/safety", reports: "/app/reports",
    "executive-actions": "/app/executive-actions", users: "/app/users",
    "audit-trail": "/app/audit-trail", "system-health": "/app/system-health",
  };
  for (const [from, to] of Object.entries(redirects)) {
    assert.match(app, new RegExp(`path=['\"]\\/${from}['\"].*to=['\"]${to.replaceAll("/", "\\/")}['\"]`));
  }
});

test("root build base and Vercel SPA fallback support direct route loads", async () => {
  const [vite, vercel] = await Promise.all([read("../vite.config.js"), read("../vercel.json")]);
  assert.match(vite, /base:\s*["']\/["']/);
  const rewrites = JSON.parse(vercel).rewrites;
  assert.deepEqual(rewrites.at(-1), { source: "/(.*)", destination: "/index.html" });
  for (const rewrite of [
    { source: "/app/assets/:path*", destination: "/assets/:path*" },
    { source: "/app/images/:path*", destination: "/images/:path*" },
    { source: "/app/favicon.svg", destination: "/favicon.svg" },
  ]) {
    assert.ok(rewrites.some((candidate) => (
      candidate.source === rewrite.source && candidate.destination === rewrite.destination
    )));
  }
});
