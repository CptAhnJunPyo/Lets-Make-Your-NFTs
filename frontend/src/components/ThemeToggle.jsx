import { useState, useEffect } from 'react';

function ThemeToggle({ darkMode, toggleTheme }) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    
    // Reset animation state
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  return (
    <button 
      className={`theme-toggle ${isAnimating ? 'animating' : ''}`} 
      onClick={handleToggle}
      aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle-inner">
        <span className={`theme-icon sun ${!darkMode ? 'active' : ''}`}>
          ☀️
        </span>
        <span className={`theme-icon moon ${darkMode ? 'active' : ''}`}>
          🌙
        </span>
      </div>
    </button>
  );
}

export default ThemeToggle;