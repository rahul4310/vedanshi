import type { WorkerState } from '../types/project';
import './RunControls.css';

interface RunControlsProps {
  workerState: WorkerState;
  onRun: () => void;
  onStop: () => void;
  onClear: () => void;
  loadingMessage: string;
  disabled?: boolean;
}

export function RunControls({ workerState, onRun, onStop, onClear, loadingMessage, disabled = false }: RunControlsProps) {
  const isRunning = workerState === 'running' || workerState === 'waiting-for-input';
  
  return (
    <div className="run-controls-inline">
      <div className="controls-buttons">
        <button 
          className="btn-control btn-run" 
          onClick={onRun} 
          disabled={disabled || isRunning || workerState === 'loading'}
          aria-label="Run code"
        >
          ▶ Run
        </button>
        <button 
          className="btn-control btn-stop" 
          onClick={onStop} 
          disabled={!isRunning}
          aria-label="Stop execution"
        >
          ⏹ Stop
        </button>
        <button 
          className="btn-control btn-clear" 
          onClick={onClear}
          aria-label="Clear terminal output"
        >
          🗑️ Clear
        </button>
      </div>
      
      {workerState === 'loading' && (
        <div className="worker-status">
          <div className="spinner"></div>
          {loadingMessage}
        </div>
      )}
      {workerState === 'running' && (
        <div className="worker-status">
          <div className="spinner"></div>
          Running...
        </div>
      )}
      {workerState === 'waiting-for-input' && (
        <div className="worker-status">
          Waiting for input...
        </div>
      )}
    </div>
  );
}
