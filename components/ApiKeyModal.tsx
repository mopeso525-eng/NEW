import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyIcon, XIcon } from './Icons';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
    currentKey?: string | null;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        setApiKey(currentKey || '');
    }, [currentKey, isOpen]);

    const handleSave = () => {
        if (apiKey.trim()) {
            onSave(apiKey.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
                    <motion.div
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md m-4"
                        onClick={e => e.stopPropagation()}
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-lalezar text-gray-700 dark:text-gray-300">إعداد مفتاح Gemini API</h2>
                            <button onClick={onClose} className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                                <XIcon />
                            </button>
                        </div>

                        <p className="mb-4 text-gray-600 dark:text-gray-400 text-center">
                            لاستخدام PESO AI، تحتاج إلى مفتاح Google AI Gemini API الخاص بك. يتم تخزينه محليًا في متصفحك فقط.
                        </p>

                        <div className="relative mb-4">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                                <KeyIcon />
                            </span>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="أدخل مفتاح API الخاص بك هنا"
                                className="w-full py-3 pl-12 pr-4 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:border-purple-500 focus:ring-0 transition-all duration-300"
                            />
                        </div>
                        
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm text-purple-500 hover:underline mb-6 block text-center">
                            احصل على مفتاح Gemini API من Google AI Studio
                        </a>

                        <div className="flex justify-end">
                            <motion.button
                                onClick={handleSave}
                                disabled={!apiKey.trim()}
                                className="text-xl font-lalezar py-2 px-6 text-white bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ y: -2 }}
                                whileTap={{ y: 0 }}
                            >
                                حفظ المفتاح
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};