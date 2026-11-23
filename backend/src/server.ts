import { app } from './app.ts';
import { env } from './config/env.ts';
import { prisma } from './lib/prisma.ts';

const server = app.listen(env.PORT, () => {
  console.log(
    `[api] Colégio Horizonte rodando em http://localhost:${env.PORT}`,
  );
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`\n[api] ${signal} recebido. Encerrando servidor...`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
