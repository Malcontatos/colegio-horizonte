import { spawnSync } from 'node:child_process';
import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[deploy] DATABASE_URL não definida; seed ignorado.');
  process.exit(1);
}

const client = new Client({ connectionString });

try {
  await client.connect();
  const { rows } = await client.query(
    'SELECT COUNT(*)::int AS count FROM "User"',
  );

  if (rows[0].count > 0) {
    console.log(
      `[deploy] Banco já possui ${rows[0].count} usuários; seed de demonstração ignorado.`,
    );
    process.exit(0);
  }
} catch (error) {
  console.error(
    '[deploy] Não foi possível verificar o banco antes do seed:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}

console.log('[deploy] Banco vazio; executando seed de demonstração...');

const result = spawnSync(
  'npm',
  ['run', 'db:seed', '--workspace', 'backend'],
  { stdio: 'inherit', env: process.env, shell: true },
);

process.exit(result.status ?? 1);
