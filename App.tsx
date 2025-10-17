import React, { useState, useEffect } from 'react';
import { ImageGenerator } from './components/ImageGenerator';
import { SunIcon, MoonIcon } from './components/Icons';
import { SplashScreen } from './components/SplashScreen';
import { Theme } from './types';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme') as Theme;
      if (storedTheme) {
        return storedTheme;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return Theme.DARK;
      }
    }
    return Theme.LIGHT;
  });

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === Theme.DARK) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  };
  
  const onSplashFinish = () => {
    setShowSplash(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-cairo transition-colors duration-500">
        <AnimatePresence>
            {showSplash && <SplashScreen onFinish={onSplashFinish} />}
        </AnimatePresence>

        <AnimatePresence>
        {!showSplash && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
                    <h1 className="text-4xl font-lalezar text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">
                    PESO AI
                    </h1>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                            aria-label="Toggle theme"
                        >
                            {theme === Theme.LIGHT ? <MoonIcon /> : <SunIcon />}
                        </button>
                    </div>
                </header>
                <main className="flex items-start justify-center min-h-screen pt-24 pb-10 px-4">
                    <ImageGenerator />
                </main>
            </motion.div>
        )}
        </AnimatePresence>
    </div>
  );
};

export default App;