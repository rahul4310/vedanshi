import { Link } from 'react-router-dom';
import projectsData from '../generated/projects.json';
import type { PythonProject } from '../types/project';
import './Home.css';

const PROJECTS = projectsData as unknown as PythonProject[];
const ALL_DEMO = PROJECTS.length > 0 && PROJECTS.every(p => p.isDemo);

function ProjectCard({ project }: { project: PythonProject }) {
  const isRunnable = project.compatibility === 'runs-unchanged';
  
  return (
    <Link to={`/project/${project.id}`} className="project-card">
      <div className="project-card-accent" />
      <div className="project-card-body">
        <div className="project-card-header">
          <h3>{project.title}</h3>
          <span className="project-card-icon">🐍</span>
        </div>

        <div className={`project-status ${isRunnable ? 'runnable' : 'limited'}`}>
          {isRunnable ? (
            <>✓ Runs in Browser</>
          ) : (
            <>⚠ Browser Limited</>
          )}
        </div>

        {project.isDemo && (
          <div className="demo-badge-container">
            <span className="demo-badge">Demonstration Project</span>
          </div>
        )}
        
        <p className="project-desc">
          {project.description || "No description provided."}
        </p>
        
        {project.concepts && project.concepts.length > 0 && (
          <div className="concept-badges">
            {project.concepts.map((concept) => (
              <span key={concept} className="badge">
                {concept}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}



export function Home() {
  return (
    <div className="home-container">
      <header className="home-header">
        <div className="hero-content">
          <h1><span className="hero-wave">👋</span> Hi, I'm Vedanshi!</h1>
          {ALL_DEMO ? (
             <p>
               This website is being prepared to showcase Python programs. 
               The current demonstration projects are being used to test the interactive runner.
             </p>
          ) : (
            <p>
              Welcome to my coding portfolio! I'm in Class 8 and I've been learning Python. 
              Below are some of the programs I've written myself. You can click on any of them 
              to see the code and even run it right here in your browser!
            </p>
          )}
          <span className="hero-badge">🐍 Interactive Python Portfolio</span>
        </div>
      </header>

      <main className="gallery-section" id="main-content">
        <h2>My Python Projects 🐍</h2>
        
        {PROJECTS.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>No projects found!</h3>
            <p>Check the <code>python-projects/</code> folder to add some code.</p>
          </div>
        ) : (
          <div className="project-grid">
            {PROJECTS.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>

      <footer className="home-footer">
        <p>Made with ❤️ by <span className="footer-brand">Vedanshi</span> • Class 8</p>
        <p className="footer-tech">Powered by Vite + React + Pyodide</p>
      </footer>
    </div>
  );
}
