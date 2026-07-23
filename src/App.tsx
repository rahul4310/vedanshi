import { Routes, Route } from 'react-router-dom';
import React, { Suspense, useEffect, useState } from 'react';
import { Home } from './pages/Home';
import { Navbar } from './components/Navbar';
import { isCrossOriginIsolated } from './hooks/usePyodide';
import './App.css';

// Lazy load ProjectDetails
const ProjectDetails = React.lazy(() => import('./pages/ProjectDetails').then(m => ({ default: m.ProjectDetails })));

function ValidationBanner() {
  const [status, setStatus] = useState<unknown>(null);

  useEffect(() => {
    // In Vite dev, import dynamically to bypass cache when HMR fails or to get the latest
    // But actually Vite HMR handles it better if we just import it.
    // However, if there's a syntax error, the build/HMR might fail. 
    // Fetching from the public or src directory directly via fetch() is safer to avoid bundle crashes.
    // Since it's in src/generated, we can try to import it, but a syntax error won't crash the JS since it's just JSON.
    const loadStatus = async () => {
      try {
        const { default: data } = await import('./generated/validation-status.json?t=' + Date.now());
        setStatus(data);
      } catch {
        // Ignore, maybe not generated yet or we are in prod
      }
    };
    loadStatus();
    // Also poll slightly in dev just in case HMR is broken by something else
    const interval = setInterval(loadStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!status || (status as { valid: boolean }).valid) return null;
  const errorStatus = status as { errors?: { friendlyMessage: string, relativePath: string }[] };

  return (
    <div className="validation-error-banner" role="alert">
      <strong>⚠️ Development Error:</strong>
      <ul>
        {errorStatus.errors?.map((err, idx: number) => (
          <li key={idx}>
            {err.friendlyMessage} (<code>{err.relativePath}</code>)
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const coi = isCrossOriginIsolated();

  return (
    <div className="app-container">
      <Navbar />
      {/* We conditionally render the ValidationBanner, usually it will be hidden in prod */}
      {import.meta.env.DEV && <ValidationBanner />}
      
      {!coi && (
        <div className="coi-warning-banner" role="alert">
          <strong>Notice:</strong> Interactive Python execution is unavailable in this browser (Cross-Origin Isolation missing), but you can still browse the projects and source code.
        </div>
      )}

      <Suspense fallback={<div className="loading-fallback">Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/project/:id" element={<ProjectDetails coiAvailable={coi} />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
