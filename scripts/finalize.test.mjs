import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { finalizeStaticSite } from './finalize.mjs';

async function fixture(robots) {
  await mkdir('.data', { recursive: true });
  const root = await mkdtemp(path.resolve('.data/headers-test-'));
  await writeFile(path.join(root, 'index.html'), `<html><head><meta name="robots" content="${robots}"><script>window.test=true</script></head></html>`);
  return root;
}
test('production remains crawlable and always receives security headers', async () => {
  const root = await fixture('index, follow');
  await finalizeStaticSite(root, true);
  const headers = await readFile(path.join(root, '_headers'), 'utf8');
  assert.ok(headers.includes("'sha256-"));
  assert.ok(headers.includes('https://www.statcounter.com/counter/counter.js'));
  assert.ok(headers.includes('Cross-Origin-Opener-Policy: same-origin-allow-popups'));
  assert.ok(!headers.includes('X-Robots-Tag: noindex'));
  assert.ok(!headers.includes('includeSubDomains'));
  assert.ok(!/^Disallow: \/$/m.test(await readFile(path.join(root, 'robots.txt'), 'utf8')));
});
test('explicit preview stays blocked and does not allow tracking domains', async () => {
  const root = await fixture('noindex, nofollow');
  await finalizeStaticSite(root, false);
  const headers = await readFile(path.join(root, '_headers'), 'utf8');
  assert.ok(headers.includes('X-Robots-Tag: noindex, nofollow'));
  assert.ok(!headers.includes('statcounter.com'));
  assert.ok(!headers.includes('https://ad.doubleclick.net'));
  assert.match(await readFile(path.join(root, 'robots.txt'), 'utf8'), /^Disallow: \/$/m);
});
test('noindex artifacts cannot be relabelled as production', async () => {
  const root = await fixture('noindex, nofollow');
  await assert.rejects(finalizeStaticSite(root, true), /Refusing to package/);
});

test('Google Ads collection is allowed only as a production connection', async () => {
  const root = await fixture('index, follow');
  await finalizeStaticSite(root, true);
  const headers = await readFile(path.join(root, '_headers'), 'utf8');
  const csp = headers.match(/Content-Security-Policy: (.+)/)[1];
  const directives = new Map(csp.split(';').map(part => {
    const [name, ...sources] = part.trim().split(/\s+/);
    return [name, sources];
  }));
  assert.ok(directives.get('connect-src').includes('https://ad.doubleclick.net'));
  assert.ok(!directives.get('script-src').includes('https://ad.doubleclick.net'));
  assert.ok(!directives.get('img-src').includes('https://ad.doubleclick.net'));
  assert.ok(!directives.get('connect-src').includes('*'));
  assert.deepEqual(directives.get('object-src'), ["'none'"]);
});
