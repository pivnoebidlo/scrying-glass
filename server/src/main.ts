// The adventure repository service of Scrying Glass: holds the S3 keys, keeps the catalog, gives the app
// short-lived links to upload and download .sgpack files. Configured by the environment (see server/README.md);
// runs as is on Node 24 (type stripping): node server/src/main.ts
import { createServer } from 'node:http';
import { S3 } from './s3.ts';
import { Repo } from './repo.ts';
import { handler } from './http.ts';

const env = (name: string, fallback?: string) => {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') throw new Error(`${name} is not set`);
  return v;
};
const num = (name: string, fallback: number) => Number(process.env[name] ?? fallback);
const log = (line: string) => console.log(`${new Date().toISOString()} ${line}`);

const endpoint = env('S3_ENDPOINT');
const store = new S3({
  endpoint,
  publicEndpoint: process.env['S3_PUBLIC_ENDPOINT'] || endpoint,
  region: env('S3_REGION', 'us-east-1'),
  bucket: env('S3_BUCKET'),
  accessKey: env('S3_ACCESS_KEY'),
  secretKey: env('S3_SECRET_KEY'),
  prefix: process.env['S3_PREFIX'] ?? '',
});
const repo = new Repo(store, {
  maxSize: num('MAX_PACK_MB', 300) * 1024 * 1024,
  maxPerAuthor: num('MAX_PER_AUTHOR', 30),
});
await repo.load();

const server = createServer(handler(repo, {
  admin: process.env['ADMIN_TOKEN'] ?? '',
  ratePerMinute: num('RATE_PER_MINUTE', 30),
  trustProxy: process.env['TRUST_PROXY'] !== 'false',
  log,
}));
const port = num('PORT', 8080);
server.listen(port, () => log(`listening on ${port}, ${repo.catalog().entries.length} adventures`));

const timer = setInterval(() => void repo.sweep().then(() => repo.flush()).catch((e) => log(`flush: ${e}`)), 60_000);
async function stop() {
  clearInterval(timer);
  server.close();
  await repo.flush().catch((e) => log(`flush: ${e}`));
  process.exit(0);
}
process.on('SIGTERM', () => void stop());
process.on('SIGINT', () => void stop());
