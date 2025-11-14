import React from 'react';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import SystemIcon from './icons/SystemIcon';

interface ThemeSwitcherProps {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, setTheme }) => {
    const themeOptions = [
      { name: 'light', icon: <SunIcon className="w-5 h-5" /> },
      { name: 'dark', icon: <MoonIcon className="w-5 h-5" /> },
      { name: 'system', icon: <SystemIcon className="w-5 h-5" /> },
    ];

    return (
      <div className="flex items-center p-1 rounded-full bg-base-200 border border-base-300">
        {themeOptions.map((option) => (
          <button
            key={option.name}
            onClick={() => setTheme(option.name)}
            className={`p-2 rounded-full transition-colors duration-200 ${
              theme === option.name
                ? 'bg-brand-primary text-white'
                : 'text-content-200 hover:text-content-100'
            }`}
            aria-label={`Switch to ${option.name} theme`}
            title={`Switch to ${option.name} theme`}
          >
            {option.icon}
          </button>
        ))}
      </div>
    );
};
export default ThemeSwitcher;
