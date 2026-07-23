/**
 * TypeScript type definitions for Python project data and worker messages.
 */

/** Represents a single Python project discovered from the filesystem */
export interface PythonProject {
  /** Stable ID derived from relative file path */
  id: string;
  /** Original filename */
  filename: string;
  /** Relative path within python-projects/ */
  relativePath: string;
  /** Display title from docstring or filename */
  title: string;
  /** Description from docstring or default */
  description: string;
  /** Python concepts demonstrated */
  concepts: string[];
  /** Sort order from docstring or Infinity */
  order: number;
  /** Original Python source code */
  source: string;
  /** Pyodide compatibility classification */
  compatibility: 'runs-unchanged' | 'needs-adaptation' | 'cannot-run';
  /** List of unsupported imports detected */
  unsupportedImports: string[];
  /** Reason for compatibility classification */
  compatibilityReason: string;
  syntaxError?: string | null;
  isDemo?: boolean;
}

/** Worker execution state */
export type WorkerState =
  | 'uninitialized'
  | 'loading'
  | 'ready'
  | 'running'
  | 'waiting-for-input'
  | 'error';

/** Messages sent from main thread to worker */
export type MainToWorkerMessage =
  | { type: 'init'; sharedBuffer: SharedArrayBuffer }
  | { type: 'run'; code: string; runId: string };

/** Messages sent from worker to main thread */
export type WorkerToMainMessage =
  | { type: 'ready' }
  | { type: 'stdout'; text: string }
  | { type: 'stderr'; text: string }
  | { type: 'input-request'; prompt: string }
  | { type: 'done'; runId: string }
  | { type: 'error'; message: string; friendlyMessage: string; runId: string }
  | { type: 'loading'; message: string }
  | { type: 'init-error'; message: string };

/** A line of terminal output */
export interface TerminalLine {
  id: number;
  text: string;
  type: 'stdout' | 'stderr' | 'system' | 'input-echo';
}
