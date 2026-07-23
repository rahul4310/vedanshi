/* eslint-disable */
import { useState, useCallback, useEffect } from 'react';
import type { WorkerState, TerminalLine, WorkerToMainMessage } from '../types/project';

// SharedArrayBuffer layout: 4 bytes status + 4 bytes length + 8KB data
const SHARED_BUFFER_SIZE = 4 + 4 + 8192;
const STATUS_IDLE = 0;
const STATUS_INPUT_PROVIDED = 2;
const STATUS_CANCELLED = 3;

// Execution timeout (seconds) — paused while waiting for input
const EXECUTION_TIMEOUT_MS = 15_000;

/** Runtime check: is cross-origin isolation available? */
export function isCrossOriginIsolated(): boolean {
  return (
    typeof crossOriginIsolated !== 'undefined' &&
    crossOriginIsolated === true &&
    typeof SharedArrayBuffer !== 'undefined'
  );
}

// --- GLOBAL WORKER STATE ---
let globalWorker: Worker | null = null;
let globalSharedBuffer: SharedArrayBuffer | null = null;
let globalStatusView: Int32Array | null = null;
let globalLengthView: Int32Array | null = null;

let globalWorkerState: WorkerState = 'uninitialized';
let globalLoadingMessage = '';
let globalInputPrompt: string | null = null;
let globalIsRunning = false;

// Handlers connected to the currently active component
let activeLineHandler: ((text: string, type: TerminalLine['type']) => void) | null = null;
let activeStateChangeHandler: (() => void) | null = null;
let globalTimeout: ReturnType<typeof setTimeout> | null = null;

function notifyStateChange() {
  if (activeStateChangeHandler) activeStateChangeHandler();
}

function clearGlobalTimeout() {
  if (globalTimeout !== null) {
    clearTimeout(globalTimeout);
    globalTimeout = null;
  }
}

function startGlobalTimeout() {
  clearGlobalTimeout();
  globalTimeout = setTimeout(() => {
    if (activeLineHandler) {
      activeLineHandler('\n⏱️ This program ran for too long and was stopped. Programs in the browser have a 15-second time limit for computation.', 'system');
    }
    terminateAndRecreateGlobal();
  }, EXECUTION_TIMEOUT_MS);
}

function handleGlobalWorkerMessage(event: MessageEvent<WorkerToMainMessage>) {
  const msg = event.data;

  switch (msg.type) {
    case 'loading':
      globalLoadingMessage = msg.message;
      notifyStateChange();
      break;

    case 'ready':
      globalWorkerState = 'ready';
      globalLoadingMessage = '';
      notifyStateChange();
      break;

    case 'init-error':
      globalWorkerState = 'error';
      if (activeLineHandler) activeLineHandler(`❌ Failed to load Python: ${msg.message}`, 'system');
      notifyStateChange();
      break;

    case 'stdout':
      if (activeLineHandler) activeLineHandler(msg.text, 'stdout');
      break;

    case 'stderr':
      if (activeLineHandler) activeLineHandler(msg.text, 'stderr');
      break;

    case 'input-request':
      clearGlobalTimeout();
      globalWorkerState = 'waiting-for-input';
      globalInputPrompt = msg.prompt;
      notifyStateChange();
      break;

    case 'done':
      clearGlobalTimeout();
      globalIsRunning = false;
      globalWorkerState = 'ready';
      notifyStateChange();
      break;

    case 'error':
      clearGlobalTimeout();
      globalIsRunning = false;
      if (activeLineHandler) {
        activeLineHandler(`\n❌ Error: ${msg.friendlyMessage}`, 'system');
        activeLineHandler(`\n📋 Details: ${msg.message}`, 'stderr');
      }
      globalWorkerState = 'ready';
      notifyStateChange();
      break;
  }
}

export function terminateAndRecreateGlobal() {
  clearGlobalTimeout();
  globalIsRunning = false;
  globalInputPrompt = null;

  if (globalWorker) {
    globalWorker.terminate();
    globalWorker = null;
  }

  globalWorkerState = 'loading';
  globalLoadingMessage = 'Restarting Python environment...';
  notifyStateChange();
  initGlobalWorker();
}

export function initGlobalWorker() {
  if (globalWorker) return;
  if (!isCrossOriginIsolated()) {
    globalWorkerState = 'error';
    return;
  }

  globalSharedBuffer = new SharedArrayBuffer(SHARED_BUFFER_SIZE);
  globalStatusView = new Int32Array(globalSharedBuffer, 0, 1);
  globalLengthView = new Int32Array(globalSharedBuffer, 4, 1);
  Atomics.store(globalStatusView, 0, STATUS_IDLE);

  globalWorker = new Worker(
    new URL('../workers/python.worker.ts', import.meta.url),
    { type: 'classic' }
  );

  globalWorker.onmessage = handleGlobalWorkerMessage;
  globalWorker.onerror = (err) => {
    console.error('Worker error:', err);
    if (activeLineHandler) activeLineHandler('❌ Python environment crashed. Restarting...', 'system');
    terminateAndRecreateGlobal();
  };

  globalWorkerState = 'loading';
  globalWorker.postMessage({ type: 'init', sharedBuffer: globalSharedBuffer });
  notifyStateChange();
}

// Start loading Pyodide IMMEDIATELY when the module is evaluated!
initGlobalWorker();

// --- REACT HOOK ---
let lineIdCounter = 0;

export function usePyodide() {
  const [, setTick] = useState(0);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  useEffect(() => {
    // When the component mounts, clear terminal lines of previous projects
    setTerminalLines([]);
    
    const myStateChangeHandler = () => setTick(t => t + 1);
    const myLineHandler = (text: string, type: TerminalLine['type']) => {
      setTerminalLines(prev => [...prev, { id: ++lineIdCounter, text, type }]);
    };

    // Register global handlers to update this component
    activeStateChangeHandler = myStateChangeHandler;
    activeLineHandler = myLineHandler;

    if (!globalWorker && globalWorkerState !== 'error') {
      initGlobalWorker();
    }

    return () => {
      // Unmount: clear handlers ONLY if they belong to this instance (fixes React 18 Strict Mode bug)
      if (activeStateChangeHandler === myStateChangeHandler) activeStateChangeHandler = null;
      if (activeLineHandler === myLineHandler) activeLineHandler = null;
      
      // If the user navigated away while the program was running, kill it so it doesn't hang in the background
      if (globalIsRunning) {
        terminateAndRecreateGlobal();
      }
    };
  }, []);

  const runCode = useCallback((code: string) => {
    if (!globalWorker || globalWorkerState !== 'ready' || globalIsRunning) {
      return;
    }

    const runId = `run-${Date.now()}`;
    globalIsRunning = true;
    setCurrentRunId(runId);
    globalWorkerState = 'running';
    globalInputPrompt = null;

    startGlobalTimeout();
    globalWorker.postMessage({ type: 'run', code, runId });
    notifyStateChange();
  }, []);

  const sendInput = useCallback((text: string) => {
    if (!globalStatusView || !globalLengthView || !globalSharedBuffer) return;

    const encoded = new TextEncoder().encode(text);
    const dataView = new Uint8Array(globalSharedBuffer, 8, 8188);
    dataView.set(encoded.slice(0, 8188));

    Atomics.store(globalLengthView, 0, Math.min(encoded.length, 8188));
    Atomics.store(globalStatusView, 0, STATUS_INPUT_PROVIDED);
    Atomics.notify(globalStatusView, 0);

    globalInputPrompt = null;
    globalWorkerState = 'running';
    startGlobalTimeout();
    notifyStateChange();
  }, []);

  const stopExecution = useCallback(() => {
    if (!globalIsRunning && globalWorkerState !== 'waiting-for-input') {
      return;
    }

    if (globalStatusView && globalWorkerState === 'waiting-for-input') {
      Atomics.store(globalStatusView, 0, STATUS_CANCELLED);
      Atomics.notify(globalStatusView, 0);
    }

    setTerminalLines(prev => [...prev, { id: ++lineIdCounter, text: '\n🛑 Program stopped.', type: 'system' }]);
    terminateAndRecreateGlobal();
  }, []);

  const clearTerminal = useCallback(() => {
    setTerminalLines([]);
  }, []);

  return {
    workerState: globalWorkerState,
    terminalLines,
    loadingMessage: globalLoadingMessage,
    inputPrompt: globalInputPrompt,
    currentRunId,
    runCode,
    sendInput,
    stopExecution,
    clearTerminal,
  };
}
