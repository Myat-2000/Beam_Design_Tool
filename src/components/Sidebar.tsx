'use client';
import React, { useState } from 'react';
import { Menu, X, Box, BarChart2, FolderOpen, Ruler } from 'lucide-react';

const navLinks = [
  { key: 'analysis', label: 'Analysis', icon: <Box className="w-5 h-5 mr-2" /> },
  { key: 'design', label: 'Reinforcement', icon: <BarChart2 className="w-5 h-5 mr-2" /> },
  { key: 'section', label: 'Section Analysis', icon: <Ruler className="w-5 h-5 mr-2" /> },
  { href: '#projects', label: 'Projects', icon: <FolderOpen className="w-5 h-5 mr-2" /> },
];

interface SidebarProps {
  activeTab: 'analysis' | 'design' | 'section';
  setActiveTab: (tab: 'analysis' | 'design' | 'section') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed top-20 left-0 h-[calc(100vh-5rem)] w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg z-40 p-4 space-y-2">
        {navLinks.map(link =>
          link.key === 'analysis' ? (
            <button
              key={link.key}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'analysis' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
              onClick={() => setActiveTab('analysis')}
            >
              {link.icon}
              {link.label}
            </button>
          ) : link.key === 'design' ? (
            <button
              key={link.key}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'design' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
              onClick={() => setActiveTab('design')}
            >
              {link.icon}
              {link.label}
            </button>
          ) : link.key === 'section' ? (
            <button
              key={link.key}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'section' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
              onClick={() => setActiveTab('section')}
            >
              {link.icon}
              {link.label}
            </button>
          ) : (
            <a key={link.href} href={link.href} className="flex items-center px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-medium">
              {link.icon}
              {link.label}
            </a>
          )
        )}
      </aside>
      {/* Mobile Hamburger */}
      <button
        className="fixed md:hidden top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
      </button>
      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex">
          <nav className="w-64 bg-white dark:bg-gray-900 h-full p-6 flex flex-col space-y-4 shadow-xl animate-slide-in-left">
            <button
              className="self-end mb-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => setOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </button>
            {navLinks.map(link =>
              link.key === 'analysis' ? (
                <button
                  key={link.key}
                  className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'analysis' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                  onClick={() => { setActiveTab('analysis'); setOpen(false); }}
                >
                  {link.icon}
                  {link.label}
                </button>
              ) : link.key === 'design' ? (
                <button
                  key={link.key}
                  className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'design' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                  onClick={() => { setActiveTab('design'); setOpen(false); }}
                >
                  {link.icon}
                  {link.label}
                </button>
              ) : link.key === 'section' ? (
                <button
                  key={link.key}
                  className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${activeTab === 'section' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                  onClick={() => { setActiveTab('section'); setOpen(false); }}
                >
                  {link.icon}
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-medium"
                  onClick={() => setOpen(false)}
                >
                  {link.icon}
                  {link.label}
                </a>
              )
            )}
          </nav>
          <div className="flex-1" onClick={() => setOpen(false)} />
        </div>
      )}
      <style jsx global>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.2s ease;
        }
      `}</style>
    </>
  );
};

export default Sidebar; 