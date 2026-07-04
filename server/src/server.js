const env = require('./config/env');
const { connectDb } = require('./config/db');
const app = require('./app');

async function main() {
  await connectDb();
  if (!env.isProd) {
    const { seedUsers } = require('./seed');
    await seedUsers();
  }
  app.listen(env.port, () => {
    console.log(`HR-System API listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
