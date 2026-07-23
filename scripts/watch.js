import chokidar from 'chokidar';
import { spawn } from 'child_process';
import path from 'path';

const WATCH_DIR = 'python-projects/**/*.py';
const DEBOUNCE_MS = 300;

let timeout = null;
let isRunning = false;
let needsAnotherRun = false;

function runValidator() {
  if (isRunning) {
    needsAnotherRun = true;
    return;
  }
  
  isRunning = true;
  console.log('[Watcher] Running validation...');
  
  const child = spawn('python', ['scripts/validate_projects.py', '--mode', 'development'], {
    stdio: 'inherit',
    shell: true
  });

  child.on('close', (code) => {
    isRunning = false;
    
    if (code === 0) {
      console.log('[Watcher] Validation finished successfully.');
    } else {
      console.log(`[Watcher] Validation exited with code ${code}.`);
    }

    if (needsAnotherRun) {
      needsAnotherRun = false;
      scheduleRun(50);
    }
  });
}

function scheduleRun(delay = DEBOUNCE_MS) {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(runValidator, delay);
}

const watcher = chokidar.watch(WATCH_DIR, {
  persistent: true,
  ignoreInitial: false,
});

watcher
  .on('add', () => scheduleRun())
  .on('change', () => scheduleRun())
  .on('unlink', () => scheduleRun())
  .on('error', (error) => console.error(`Watcher error: ${error}`));

process.on('SIGINT', () => {
  console.log('[Watcher] Stopping...');
  watcher.close().then(() => process.exit(0));
});
