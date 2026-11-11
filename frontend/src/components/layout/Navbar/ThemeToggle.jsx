import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark ? 'dark' : 'light';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <button 
      type="button" 
      onClick={toggleTheme}
      className="rc-theme ms-3" 
      role="switch" 
      aria-checked={isDark}
    >
      <span className="rc-theme__opt rc-theme__opt--work">
         <i className="fa fa-sun-o" aria-hidden="true"></i> Work
      </span>
      <span className="rc-theme__opt rc-theme__opt--sleep">
        <i className="fa fa-moon-o" aria-hidden="true"></i> Sleep
      </span>
      <span className="rc-theme__thumb" aria-hidden="true"></span>
    </button>
  );
}