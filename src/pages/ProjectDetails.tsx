import { useParams, Link } from 'react-router-dom';
import { useCallback, useState, useEffect } from 'react';
import { usePyodide } from '../hooks/usePyodide';
import { Terminal } from '../components/Terminal';
import { InputPrompt } from '../components/InputPrompt';
import { RunControls } from '../components/RunControls';
import { CodeViewer } from '../components/CodeViewer';
import projectsData from '../generated/projects.json';
import type { PythonProject } from '../types/project';
import './ProjectDetails.css';

const PROJECTS = projectsData as unknown as PythonProject[];

function CompatibilityBanner({ project }: { project: PythonProject }) {
  if (project.compatibility === 'runs-unchanged') return null;

  return (
    <div className={`compatibility-banner ${project.compatibility}`}>
      <span className="icon">⚠️</span>
      <div className="banner-content">
        <strong>Compatibility Note:</strong> {project.compatibilityReason}
      </div>
    </div>
  );
}

interface ProjectDetailsProps {
  coiAvailable: boolean;
}

export function ProjectDetails({ coiAvailable }: ProjectDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const project = PROJECTS.find((p) => p.id === id);
  
  const [sourceCode, setSourceCode] = useState(project?.source || "");
  const [isEditing, setIsEditing] = useState(false);
  const isDirty = sourceCode !== (project?.source || "");

  const {
    workerState,
    terminalLines,
    loadingMessage,
    inputPrompt,
    runCode,
    sendInput,
    stopExecution,
    clearTerminal,
  } = usePyodide();

  // Handle navigation confirmation if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleBack = (e: React.MouseEvent) => {
    if (isDirty) {
      if (!window.confirm("You have unsaved temporary edits. Are you sure you want to leave?")) {
        e.preventDefault();
      }
    }
  };

  const handleRun = useCallback(() => {
    runCode(sourceCode);
  }, [runCode, sourceCode]);

  const handleRestore = () => {
    if (window.confirm("Restore original code and discard your changes?")) {
      setSourceCode(project?.source || "");
    }
  };

  if (!project) {
    return (
      <div className="project-not-found">
        <h2>Project Not Found</h2>
        <Link to="/" className="btn-back">← Back to Gallery</Link>
      </div>
    );
  }

  const isExecutable = project.compatibility !== 'cannot-run' && coiAvailable;
  const isWorkerBusy = workerState === 'running' || workerState === 'waiting-for-input';

  return (
    <div className="project-details-container">
      <header className="project-header">
        <Link to="/" className="btn-back" onClick={handleBack}>← Back to Gallery</Link>
        <div className="title-section">
          <h1>{project.title}</h1>
          <p className="subtitle">{project.description}</p>
        </div>
      </header>

      {project.isDemo && (
        <div className="demo-notice-banner">
          <span className="demo-badge">Demonstration Project</span>
          <span>This temporary example is included to test the website. It will be replaced with the student's own Python program.</span>
        </div>
      )}

      <CompatibilityBanner project={project} />

      <main className="project-workspace">
        <section className="editor-section">
          <div className="section-header">
            <h3>📝 Code ({project.filename})</h3>
            <div className="editor-controls">
              {isEditing && isDirty && (
                <button className="btn-restore" onClick={handleRestore} disabled={isWorkerBusy}>
                  Restore Original
                </button>
              )}
              <button 
                className="btn-edit" 
                onClick={() => setIsEditing(!isEditing)}
                disabled={isWorkerBusy}
              >
                {isEditing ? "Exit Edit Mode" : "Temporary Edit"}
              </button>
            </div>
          </div>
          
          {isEditing && (
             <div className="edit-notice">
               <em>You are editing a temporary copy. Your original program will not be changed.</em>
             </div>
          )}

          <CodeViewer 
            code={sourceCode} 
            isEditing={isEditing} 
            onChange={setSourceCode} 
          />
        </section>

        <section className="execution-section">
          <div className="section-header">
            <h3>🚀 Output</h3>
            <RunControls
              workerState={workerState}
              onRun={handleRun}
              onStop={stopExecution}
              onClear={clearTerminal}
              loadingMessage={loadingMessage}
              disabled={!isExecutable}
            />
          </div>
          
          <div className="execution-panel">
            
            <div className="terminal-wrapper">
              <Terminal lines={terminalLines} />
              
              {inputPrompt !== null && (
                <div className="input-overlay">
                  <InputPrompt prompt={inputPrompt} onSubmit={sendInput} />
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
