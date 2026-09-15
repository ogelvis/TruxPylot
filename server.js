const { createServer } = require('http');
const { execSync } = require('child_process');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.BIND_HOST || '0.0.0.0';
const port = Number(process.env.PORT || 3000);

// Migrations run here — at startup, when DATABASE_URL is guaranteed to be the
// live runtime value — instead of during `npm run build`. Some hosts (Render
// build workers, in particular) don't reach the database the same way the
// running service does, so a migrate step inside the build can fail or hang
// even though the app itself would connect fine once it's actually running.
// This also means a failed migration now fails loudly and stops the boot,
// instead of leaving a half-migrated app quietly serving broken API routes.
if (!dev) {
  try {
    console.log('Running prisma migrate deploy...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (err) {
    console.error('FATAL: prisma migrate deploy failed. Refusing to start with a possibly out-of-sync schema.');
    process.exit(1);
  }
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, hostname, () => {
    console.log(`TruxPylot ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Failed to start TruxPylot:', err);
  process.exit(1);
});
