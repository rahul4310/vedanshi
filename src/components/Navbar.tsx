import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar" role="navigation" aria-label="Main Navigation">
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand" aria-label="Vedanshi Home">
            <span className="brand-emoji" aria-hidden="true">🐍</span>
            <span className="brand-text">Vedanshi</span>
          </Link>
        </div>
        <div className="navbar-right">
          <ul className="nav-links">
            <li>
              <Link to="/" className="nav-link">Home</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export { Navbar };
