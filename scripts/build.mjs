import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { finalizeStaticSite } from './finalize.mjs';
const production = !process.argv.includes('--preview');
if (!process.argv.includes('--finalize-only')) {
  const result = spawnSync(process.execPath, ['node_modules/nuxt/bin/nuxt.mjs', 'generate'], {
    stdio: 'inherit', env: { ...process.env, SITE_ENV: production ? 'production' : 'preview', NUXT_TELEMETRY_DISABLED: '1' },
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
await finalizeStaticSite('.output/public', production);
console.log(`Static ${production ? 'PRODUCTION' : 'PREVIEW (noindex)'} files: ${path.resolve('.output/public')}`);
