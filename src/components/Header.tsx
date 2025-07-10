'use client';
import React, { useEffect, useState } from 'react';
import { Sun, Moon, Layers, Box, BarChart2, Ruler, Menu, X } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useTabContext } from './TabContext';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { activeTab, setActiveTab } = useTabContext();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleTabClick = (tab: 'analysis' | 'design' | 'section') => {
    if (setActiveTab) {
      setActiveTab(tab);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors ${scrolled ? 'shadow-lg backdrop-blur-sm' : 'shadow-none'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Layers className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Beam Structural Analysis Demo</span>
        </div>
        <nav className="hidden md:flex gap-6 text-gray-700 dark:text-gray-200 font-medium">
          <button
            onClick={() => handleTabClick('analysis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'analysis' 
                ? 'bg-blue-500 text-white' 
                : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Box className="w-4 h-4" />
            Beam Structural Analysis
          </button>
          <button
            onClick={() => handleTabClick('design')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'design' 
                ? 'bg-blue-500 text-white' 
                : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Reinforced Concrete Beam Design
          </button>
          <button
            onClick={() => handleTabClick('section')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'section' 
                ? 'bg-blue-500 text-white' 
                : 'hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Ruler className="w-4 h-4" />
            Beam Cross-Section Analysis
          </button>
        </nav>
        
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          ) : (
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          )}
        </button>
        <button
          onClick={toggleTheme}
          className="ml-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
          )}
        </button>
      </div>
      
      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="px-4 py-3 space-y-2">
            <button
              onClick={() => handleTabClick('analysis')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'analysis' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Box className="w-4 h-4" />
              Beam Structural Analysis
            </button>
            <button
              onClick={() => handleTabClick('design')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'design' 
                  ? 'bg-blue-500 text-white' 
                  : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Reinforced Concrete Beam Design
            </button>
                         <button
               onClick={() => handleTabClick('section')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                 activeTab === 'section' 
                   ? 'bg-blue-500 text-white' 
                   : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
               }`}
             >
               <Ruler className="w-4 h-4" />
               Beam Cross-Section Analysis
             </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 