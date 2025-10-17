import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    fullWidth?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, fullWidth = false }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div 
            className={`relative flex items-center ${fullWidth ? 'w-full h-full' : ''}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs z-20"
                    >
                        <div className="bg-gray-800 dark:bg-gray-950 text-white text-xs rounded-md py-1.5 px-3 shadow-lg">
                            {content}
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800 dark:border-t-gray-950"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
