import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const viteEntry = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const playwrightEntry = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url));
const serverUrl = 'http://127.0.0.1:5173';

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function serverIsReady() {
  return new Promise((resolve) => {
    const request = http.get(serverUrl, (response) => {
      response.resume();
      resolve(response.statusCode !== undefined && response.statusCode < 500);
    });
    request.setTimeout(1_500, () => request.destroy());
    request.on('error', () => resolve(false));
  });
}

async function waitForServer(serverProcess) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (await serverIsReady()) return;
    if (serverProcess.exitCode !== null || serverProcess.signalCode !== null) {
      throw new Error(`Vite exited before becoming ready (code ${serverProcess.exitCode ?? 'unknown'}).`);
    }
    await delay(300);
  }
  throw new Error('Vite did not become ready within 120 seconds.');
}

async function stopProcess(processToStop) {
  if (!processToStop || processToStop.exitCode !== null || processToStop.signalCode !== null) return;

  const exited = once(processToStop, 'exit');
  processToStop.kill('SIGTERM');
  await Promise.race([exited, delay(3_000)]);

  if (processToStop.exitCode === null && processToStop.signalCode === null) {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(processToStop.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    } else {
      processToStop.kill('SIGKILL');
    }
  }
}

let viteProcess;
let playwrightProcess;

async function shutdown(exitCode) {
  if (playwrightProcess && playwrightProcess.exitCode === null && playwrightProcess.signalCode === null) {
    playwrightProcess.kill('SIGTERM');
  }
  await stopProcess(viteProcess);
  process.exit(exitCode);
}

process.once('SIGINT', () => void shutdown(130));
process.once('SIGTERM', () => void shutdown(143));

try {
  if (!(await serverIsReady())) {
    viteProcess = spawn(process.execPath, [viteEntry, '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
      cwd: rootDir,
      stdio: 'inherit',
      windowsHide: true,
    });
    await waitForServer(viteProcess);
  }

  playwrightProcess = spawn(process.execPath, [playwrightEntry, 'test', ...process.argv.slice(2)], {
    cwd: rootDir,
    stdio: 'inherit',
    windowsHide: true,
  });
  const [exitCode] = await once(playwrightProcess, 'exit');
  process.exitCode = typeof exitCode === 'number' ? exitCode : 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await stopProcess(viteProcess);
}
