import './App.css'

function App() {
  // Read from dynamic config.js (window.ENV_CONFIG)
  const config = window.ENV_CONFIG || {};
  const env = (config.ENVIRONMENT || 'development').toLowerCase();
  const authorName = (config.AUTHOR || 'Enter Name Here').toUpperCase();

  const themeMap = {
    development: 'theme-red',
    staging: 'theme-blue',
    production: 'theme-green'
  };

  const themeClass = themeMap[env] || '';

  return (
    <div className={`landing-container ${themeClass}`}>
      <div className="content-wrapper">
        <h1 className="course-code">SOE 507</h1>
        <div className="divider"></div>
        <h2 className="course-title">AUTOMATING WITH ANSIBLE</h2>
        <p className="author-name">By: {authorName}</p>
      </div>
    </div>
  )
}

export default App
