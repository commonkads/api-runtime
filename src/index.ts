import { LocalFileStore, consoleWriter } from '@commonkads/engine';
import type { IFileStore } from '@commonkads/engine';

import { createServer } from './server.js';

interface ProviderModule {
  register(): void;
}

interface S3Module {
  S3FileStore: new (bucket: string, opts?: { region?: string }) => IFileStore;
}

async function buildFileStore(): Promise<IFileStore> {
  const bucket = process.env['COMMONKADS_S3_BUCKET'];
  if (bucket) {
    try {
      const awsPkg: string = '@commonkads/provider-aws';
      const mod = (await import(awsPkg)) as unknown as S3Module;
      return new mod.S3FileStore(bucket, { region: process.env['AWS_REGION'] });
    } catch {
      throw new Error(
        'COMMONKADS_S3_BUCKET is set but @commonkads/provider-aws is not installed — ' +
          'rebuild the image with --build-arg PROVIDERS=aws',
      );
    }
  }
  return new LocalFileStore(process.env['COMMONKADS_KNOWLEDGE_ROOT'] ?? '/knowledge');
}

async function loadProviders(): Promise<void> {
  const pkgList = process.env['COMMONKADS_PROVIDER_PACKAGES'] ?? '';
  const packages = pkgList
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  for (const pkg of packages) {
    try {
      const mod = (await import(pkg)) as unknown as ProviderModule;
      mod.register();
    } catch {
      consoleWriter.warn(`api-runtime: failed to load provider "${pkg}" — skipping`);
    }
  }
}

const fileStore = await buildFileStore();
await loadProviders();

const port = parseInt(process.env['PORT'] ?? '3000', 10);
const app = createServer({ fileStore });

app.listen(port, () => {
  consoleWriter.log(`api-runtime listening on port ${port}`);
});
