import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
    onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onFinish();
        }, 2500); // Splash screen duration

        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 dark:bg-gray-900"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    duration: 1.5
                }}
            >
                <h1 className="text-7xl md:text-8xl font-lalezar text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 bg-[length:200%_auto] animate-pulse-gradient">
                    PESO AI
                </h1>
            </motion.div>
        </motion.div>
    );
};
