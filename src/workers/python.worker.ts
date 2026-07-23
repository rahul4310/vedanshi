/// <reference lib="webworker" />
/**
 * Pyodide Web Worker — Python execution engine
 *
 * Loads Pyodide v0.29.4 in an isolated Web Worker.
 * Uses SharedArrayBuffer + Atomics.wait for synchronous input() support.
 *
 * Message protocol:
 *   Main → Worker:
 *     { type: 'init', sharedBuffer: SharedArrayBuffer }
 *     { type: 'run', code: string, runId: string }
 *     { type: 'input-response' }   (data is written to sharedBuffer directly)
 *
 *   Worker → Main:
 *     { type: 'ready' }
 *     { type: 'stdout', text: string }
 *     { type: 'stderr', text: string }
 *     { type: 'input-request', prompt: string }
 *     { type: 'done', runId: string }
 *     { type: 'error', message: string, friendlyMessage: string, runId: string }
 *     { type: 'loading', message: string }
 *     { type: 'init-error', message: string }
 */

const PYODIDE_VERSION = '0.29.4';
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function loadPyodide(options: any): Promise<any>;

// SharedArrayBuffer layout constants
// [0]     Int32 — status: 0=idle, 1=input-requested, 2=input-provided, 3=cancelled
// [4]     Int32 — byte length of UTF-8 encoded input string
// [8..]   Uint8 — UTF-8 encoded input string data (max ~8KB)
const STATUS_IDLE = 0;
const STATUS_INPUT_REQUESTED = 1;
const STATUS_INPUT_PROVIDED = 2;
const STATUS_CANCELLED = 3;

/* eslint-disable @typescript-eslint/no-explicit-any */
let pyodide: any = null;
let statusView: Int32Array | null = null;
let lengthView: Int32Array | null = null;
let dataBuffer: SharedArrayBuffer | null = null;
let outputCharCount = 0;
const MAX_OUTPUT_CHARS = 100_000;

/**
 * Blocking stdin function called from Python's builtins.input override.
 * Sends the prompt to the main thread, then blocks with Atomics.wait
 * until the main thread writes the user's answer to shared memory.
 */
function blockingInput(prompt: string): string {
  if (!statusView || !lengthView || !dataBuffer) {
    throw new Error('SharedArrayBuffer not initialized');
  }

  // Signal "I need input" and send prompt to main thread
  Atomics.store(statusView, 0, STATUS_INPUT_REQUESTED);
  self.postMessage({ type: 'input-request', prompt: prompt });

  // Block this worker thread until status changes from INPUT_REQUESTED
  Atomics.wait(statusView, 0, STATUS_INPUT_REQUESTED);

  // Check what happened
  const status = Atomics.load(statusView, 0);

  if (status === STATUS_CANCELLED) {
    // Reset status for next use
    Atomics.store(statusView, 0, STATUS_IDLE);
    throw new Error('__EXECUTION_CANCELLED__');
  }

  if (status === STATUS_INPUT_PROVIDED) {
    // Read the input string from shared memory
    const byteLength = Atomics.load(lengthView, 0);
    const bytes = new Uint8Array(dataBuffer, 8, byteLength);
    const text = new TextDecoder().decode(bytes.slice());

    // Reset status for next input call
    Atomics.store(statusView, 0, STATUS_IDLE);

    return text;
  }

  // Unexpected status
  Atomics.store(statusView, 0, STATUS_IDLE);
  throw new Error(`Unexpected shared memory status: ${status}`);
}

/**
 * Guarded stdout callback — limits total output to prevent memory issues.
 */
function stdoutCallback(text: string): void {
  outputCharCount += text.length;
  if (outputCharCount <= MAX_OUTPUT_CHARS) {
    self.postMessage({ type: 'stdout', text });
  } else if (outputCharCount - text.length < MAX_OUTPUT_CHARS) {
    // First time exceeding — send truncation notice
    self.postMessage({
      type: 'stdout',
      text: '\n⚠️ Output limit reached (100,000 characters). Further output is hidden.\n'
    });
  }
}

function stderrCallback(text: string): void {
  self.postMessage({ type: 'stderr', text });
}

/**
 * Load Pyodide and set up the Python environment.
 */
async function initPyodide(sharedBuffer: SharedArrayBuffer): Promise<void> {
  dataBuffer = sharedBuffer;
  statusView = new Int32Array(sharedBuffer, 0, 1);
  lengthView = new Int32Array(sharedBuffer, 4, 1);

  self.postMessage({ type: 'loading', message: 'Downloading Python environment...' });

  try {
    // Import Pyodide from CDN
    importScripts(`${PYODIDE_CDN}pyodide.js`);

    self.postMessage({ type: 'loading', message: 'Starting Python...' });

    pyodide = await loadPyodide({
      indexURL: PYODIDE_CDN,
      stdout: stdoutCallback,
      stderr: stderrCallback,
    });

    // Expose the blocking input function to Python via the worker's global scope
    // so it can be accessed from Python via `from js import _blocking_input`
    (self as any)._blocking_input = blockingInput;

    // Override builtins.input in Python to use our blocking mechanism
    pyodide.runPython(`
import builtins
import sys
from js import _blocking_input

def _custom_input(prompt=""):
    """
    Custom input() that sends the prompt to the browser UI
    and blocks until the user provides an answer.
    """
    prompt_str = str(prompt)
    # Write prompt to stdout (mimics CPython terminal behavior)
    if prompt_str:
        sys.stdout.write(prompt_str)
        sys.stdout.flush()
    # Block until the main thread provides the input via SharedArrayBuffer
    result = str(_blocking_input(prompt_str))
    # Echo the user's input in the terminal (mimics terminal echo)
    sys.stdout.write(result + '\\n')
    sys.stdout.flush()
    return result

builtins.input = _custom_input
`);

    self.postMessage({ type: 'ready' });

  } catch (err: any) {
    self.postMessage({
      type: 'init-error',
      message: err?.message || 'Failed to load Python environment',
    });
  }
}

/**
 * Run Python code with a fresh globals dictionary.
 * This ensures variables from previous runs don't leak.
 */
async function runPython(code: string, runId: string): Promise<void> {
  if (!pyodide) {
    self.postMessage({
      type: 'error',
      message: 'Pyodide not initialized',
      friendlyMessage: 'Python is not ready yet. Please wait for it to load.',
      runId,
    });
    return;
  }

  // Reset output counter for this run
  outputCharCount = 0;

  try {
    // Create a fresh globals dict with builtins available
    // This isolates each run from previous runs
    const freshGlobals = pyodide.runPython(`
_g = {"__builtins__": __builtins__}
# Re-apply our custom input in the fresh namespace
import builtins
_g['input'] = builtins.input
_g
`);

    await pyodide.runPythonAsync(code, { globals: freshGlobals });

    // Clean up the proxy to avoid memory leaks
    freshGlobals.destroy();

    self.postMessage({ type: 'done', runId });

  } catch (err: any) {
    const message = err?.message || String(err);

    // Don't report cancellation as an error
    if (message.includes('__EXECUTION_CANCELLED__')) {
      self.postMessage({ type: 'done', runId });
      return;
    }

    // Generate a friendly error message
    const friendlyMessage = makeFriendlyError(message);

    self.postMessage({
      type: 'error',
      message,
      friendlyMessage,
      runId,
    });
  }
}

/**
 * Translate Python errors into child-friendly explanations.
 */
function makeFriendlyError(message: string): string {
  if (message.includes('NameError')) {
    const match = message.match(/name '(\w+)' is not defined/);
    if (match) {
      return `Oops! Python doesn't know what "${match[1]}" means. Check if you spelled the variable name correctly or forgot to create it.`;
    }
    return "Oops! Python found a name it doesn't recognise. Did you forget to define a variable?";
  }

  if (message.includes('SyntaxError')) {
    return "There's a small typo in the code. Look for missing colons (:), brackets, or quotation marks!";
  }

  if (message.includes('TypeError')) {
    return "Python got confused about the type of data. Check if you're mixing text and numbers — you might need int() or str().";
  }

  if (message.includes('ValueError')) {
    if (message.includes('invalid literal for int()')) {
      return "That doesn't look like a whole number! Make sure you type a number (like 12) when the program asks for one.";
    }
    return "The value you entered isn't quite right for what the program expected. Check the input format!";
  }

  if (message.includes('ZeroDivisionError')) {
    return "You tried to divide by zero — that's not possible in maths! Check your calculations.";
  }

  if (message.includes('IndexError')) {
    return "The program tried to access an item that doesn't exist in a list. The list might be shorter than expected.";
  }

  if (message.includes('KeyError')) {
    return "The program looked for a key that doesn't exist in a dictionary.";
  }

  if (message.includes('ImportError') || message.includes('ModuleNotFoundError')) {
    const match = message.match(/No module named '(\w+)'/);
    if (match) {
      return `This program uses "${match[1]}" which is not available in the browser. It might need a desktop Python installation.`;
    }
    return "This program needs a module that isn't available in the browser.";
  }

  if (message.includes('RecursionError')) {
    return "The program called itself too many times! This usually means a function is stuck in an infinite loop.";
  }

  return "Something went wrong while running the program. Check the error details below for clues!";
}

// Handle messages from the main thread
self.onmessage = async (event: MessageEvent) => {
  const { type } = event.data;

  switch (type) {
    case 'init':
      await initPyodide(event.data.sharedBuffer);
      break;

    case 'run':
      await runPython(event.data.code, event.data.runId);
      break;

    default:
      console.warn('Worker received unknown message type:', type);
  }
};
