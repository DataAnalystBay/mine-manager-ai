import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const browser = [
  process.env.DASHBOARD_TEST_BROWSER,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].find((path) => path && existsSync(path));
if (!browser) throw Error('Set DASHBOARD_TEST_BROWSER to a Chrome/Chromium/Edge executable.');

const profile = await mkdtemp(join(tmpdir(), 'mma-dashboard-browser-'));
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)),
  server: { host: '127.0.0.1', port: 0, strictPort: true },
});
try {
  await server.listen();
  const port = server.httpServer.address().port;
  const output = await new Promise((resolveOutput, reject) => {
    const child = spawn(browser, [
      '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--disable-extensions', `--user-data-dir=${profile}`, '--dump-dom',
      '--virtual-time-budget=30000', `http://127.0.0.1:${port}/tests/dashboard.browser.html`,
    ], { windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    const timeout = setTimeout(() => { child.kill(); reject(Error('Browser test timed out')); }, 45000);
    child.on('error', reject);
    child.on('close', () => {
      clearTimeout(timeout);
      const result = stdout.match(/<pre id="results">([\s\S]*?)<\/pre>/)?.[1];
      if (!result?.startsWith('PASS')) reject(Error(result || stderr || 'No browser test result'));
      else resolveOutput(result);
    });
  });
  console.log(output);
} finally {
  await server.close();
  // Only remove the dedicated temporary profile created by this runner.
  if (!resolve(profile).startsWith(resolve(tmpdir()) + sep) ||
      !profile.includes('mma-dashboard-browser-')) throw Error('Unexpected browser profile path');
  await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 250 });
}
