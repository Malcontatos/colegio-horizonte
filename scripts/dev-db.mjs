import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import EmbeddedPostgres from 'embedded-postgres';
import { Client } from 'pg';

const port = 5433;
const database = 'escola';
const isWindows = process.platform === 'win32';
const runtimeRoot = path.join(
  process.env.LOCALAPPDATA ?? path.join(os.homedir(), '.local', 'share'),
  'colegio-horizonte',
);
const databaseDir = process.env.DEV_DB_DIR ?? path.join(runtimeRoot, 'postgres');
const logFile = path.join(runtimeRoot, 'postgres.log');

fs.mkdirSync(runtimeRoot, { recursive: true });

let stopping = false;
let startedHere = false;
let pg = null;
let pgCtlPath = null;

function isPortOpen(targetPort) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port: targetPort });
    const finish = (open) => {
      socket.destroy();
      resolve(open);
    };

    socket.setTimeout(1000);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function ensureDatabase() {
  const client = new Client({
    connectionString: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`,
  });

  try {
    await client.connect();
  } catch (error) {
    console.warn(
      '[banco] Não foi possível conectar ao banco "postgres" para verificar a base; o Prisma tentará novamente.',
      error instanceof Error ? error.message : error,
    );
    return;
  }

  try {
    const { rowCount } = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );

    if (!rowCount) {
      await client.query(`CREATE DATABASE "${database}"`);
      console.log(`[banco] Banco "${database}" criado.`);
    }
  } finally {
    await client.end();
  }
}

function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    encoding: 'utf8',
    env: { ...process.env, LC_MESSAGES: 'C' },
    ...options,
  });

  if (result.error) throw result.error;

  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(
      `${path.basename(executable)} falhou (código ${result.status}).${details ? `\n${details}` : ''}`,
    );
  }

  return result;
}

function resolveWindowsNativeDir() {
  const packageUrl = import.meta.resolve('@embedded-postgres/windows-x64');
  const packageFile = fileURLToPath(packageUrl);
  const sourceNative = path.resolve(path.dirname(packageFile), '..', 'native');
  const needsAsciiPath = /[^\x00-\x7F]/.test(sourceNative);

  if (!needsAsciiPath) return sourceNative;

  const asciiNative = path.join(runtimeRoot, 'pg-native');
  const marker = path.join(asciiNative, 'bin', 'pg_ctl.exe');

  if (!fs.existsSync(marker)) {
    console.log('[banco] Copiando PostgreSQL para um caminho sem acentos...');
    fs.rmSync(asciiNative, { recursive: true, force: true });
    fs.cpSync(sourceNative, asciiNative, { recursive: true });
  }

  return asciiNative;
}

async function startWindows() {
  const nativeDir = resolveWindowsNativeDir();
  const binDir = path.join(nativeDir, 'bin');
  const initdb = path.join(binDir, 'initdb.exe');
  const pgCtl = path.join(binDir, 'pg_ctl.exe');

  const firstRun = !fs.existsSync(path.join(databaseDir, 'PG_VERSION'));

  if (firstRun) {
    console.log(`[banco] Inicializando PostgreSQL em ${databaseDir}...`);
    run(initdb, [
      '-D',
      databaseDir,
      '-U',
      'postgres',
      '--auth=trust',
      '--encoding=UTF8',
      '--locale=C',
      '--lc-messages=C',
    ]);
  }

  console.log(`[banco] Iniciando PostgreSQL na porta ${port}...`);
  run(pgCtl, [
    '-D',
    databaseDir,
    '-l',
    logFile,
    '-o',
    `-p ${port} -h 127.0.0.1`,
    '-w',
    'start',
  ]);

  startedHere = true;
  pgCtlPath = pgCtl;
  await ensureDatabase();
}

async function startOtherPlatforms() {
  pg = new EmbeddedPostgres({
    databaseDir,
    user: 'postgres',
    password: 'postgres',
    port,
    persistent: true,
    autoRehydrateSymlinks: true,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: () => {},
    onError: (message) => console.error(`[banco] ${String(message)}`),
  });

  const firstRun = !fs.existsSync(path.join(databaseDir, 'PG_VERSION'));

  if (firstRun) {
    console.log(`[banco] Inicializando PostgreSQL em ${databaseDir}...`);
    await pg.initialise();
  }

  await pg.start();
  startedHere = true;

  try {
    await pg.createDatabase(database);
    console.log(`[banco] Banco "${database}" criado.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) throw error;
  }
}

async function shutdown() {
  if (stopping) return;
  stopping = true;

  if (!startedHere) {
    console.log('[banco] PostgreSQL já estava em execução; deixando o servidor ativo.');
    process.exit(0);
  }

  console.log('\n[banco] Encerrando PostgreSQL...');

  try {
    if (isWindows && pgCtlPath) {
      spawnSync(pgCtlPath, ['-D', databaseDir, '-m', 'fast', '-w', 'stop'], {
        encoding: 'utf8',
        env: { ...process.env, LC_MESSAGES: 'C' },
      });
    } else if (pg) {
      await pg.stop();
    }
  } catch (error) {
    console.error('[banco] Erro ao encerrar:', error);
  }

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);

try {
  if (await isPortOpen(port)) {
    console.log(`[banco] PostgreSQL já está ouvindo na porta ${port}.`);
  } else if (isWindows) {
    await startWindows();
  } else {
    await startOtherPlatforms();
  }

  console.log(
    `[banco] Pronto em postgresql://postgres:postgres@localhost:${port}/${database}`,
  );
} catch (error) {
  console.error('[banco] Não foi possível iniciar o PostgreSQL local.');
  console.error(error);
  process.exit(1);
}

await new Promise(() => {});
