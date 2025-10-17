import React, { useState, useRef, useCallback, useEffect } from 'react';
import { generateOrEditImage } from '../services/geminiService';
import { Spinner } from './Spinner';
import { UploadIcon, SparklesIcon, XIcon, PencilIcon, DownloadIcon, ReuseIcon, WandIcon, TrashIcon } from './Icons';
import { ImageEditorModal } from './ImageEditorModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from './Tooltip';
import { surpriseMePrompts } from '../utils/prompts';

interface HistoryItem {
    id: string;
    image: string;
    prompt: string;
    negativePrompt: string;
    baseImageUrl?: string;
    baseImageFile?: File;
}

const aspectRatios = {
    '1:1': 'square image',
    '16:9': 'widescreen 16:9 cinematic image',
    '9:16': 'vertical 9:16 portrait image',
};

const styles = {
    'None': '',
    'Photorealistic': ', photorealistic, 8k, detailed, professional photography',
    'Anime': ', anime style, vibrant, detailed illustration',
    'Cyberpunk': ', cyberpunk style, neon lights, futuristic city, dystopian',
    'Watercolor': ', watercolor painting, soft edges, blended colors',
    '3D Render': ', 3D render, octane render, high detail',
};

const loadingMessages = [
    "نستدعي البيكسلات...",
    "نرسم بالضوء...",
    "نستشير الإلهام الرقمي...",
    "نجمع الألوان من الفضاء...",
    "لحظات قليلة وينتهي السحر...",
];

export const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [negativePrompt, setNegativePrompt] = useState<string>('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeAspectRatio, setActiveAspectRatio] = useState<keyof typeof aspectRatios>('1:1');
    const [activeStyle, setActiveStyle] = useState<keyof typeof styles>('None');
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
    const loadingIntervalRef = useRef<number | null>(null);
    // Fix: Define fileInputRef to resolve reference errors.
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isLoading) {
            loadingIntervalRef.current = window.setInterval(() => {
                setCurrentLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 2000);
        } else if (loadingIntervalRef.current) {
            clearInterval(loadingIntervalRef.current);
            loadingIntervalRef.current = null;
        }

        return () => {
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
            }
        };
    }, [isLoading]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            updateImageFile(file);
        }
    };
    
    const updateImageFile = (file: File) => {
        clearImage(false);
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setGeneratedImage(null);
    }

    const clearImage = (resetInput = true) => {
        setImageFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (resetInput && fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handleSaveEdit = (editedFile: File) => {
        updateImageFile(editedFile);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) {
            setError("يرجى إدخال وصف للصورة.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        let fullPrompt = `${prompt}, a ${aspectRatios[activeAspectRatio]}${styles[activeStyle]}`;
        if (negativePrompt) {
            fullPrompt += `. Avoid: ${negativePrompt}`;
        }

        try {
            const result = await generateOrEditImage(fullPrompt, imageFile || undefined);
            setGeneratedImage(result);
            
            const newHistoryItem: HistoryItem = {
                id: Date.now().toString(),
                image: result,
                prompt: prompt,
                negativePrompt: negativePrompt,
                baseImageUrl: imageFile ? previewUrl! : undefined,
                baseImageFile: imageFile || undefined,
            };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 12));

        } catch (err: any) {
            setError(err.message || "حدث خطأ غير متوقع.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReuseHistory = (item: HistoryItem) => {
        setPrompt(item.prompt);
        setNegativePrompt(item.negativePrompt);
        if (item.baseImageFile) {
            updateImageFile(item.baseImageFile);
        } else {
            clearImage();
        }
        setGeneratedImage(item.image);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(item => item.id !== id));
    };
    
    const handleSurpriseMe = () => {
        const randomPrompt = surpriseMePrompts[Math.floor(Math.random() * surpriseMePrompts.length)];
        setPrompt(randomPrompt);
    };

    const dropHandler = useCallback((ev: React.DragEvent<HTMLDivElement>) => {
        ev.preventDefault();
        if (ev.dataTransfer.items) {
            if (ev.dataTransfer.items[0].kind === 'file') {
                const file = ev.dataTransfer.items[0].getAsFile();
                if (file && file.type.startsWith('image/')) {
                    updateImageFile(file);
                }
            }
        }
    }, []);

    const dragOverHandler = (ev: React.DragEvent<HTMLDivElement>) => {
        ev.preventDefault();
    };

    return (
        <>
            {previewUrl && (
                 <ImageEditorModal
                    isOpen={isEditing}
                    onClose={() => setIsEditing(false)}
                    imageSrc={previewUrl}
                    onSave={handleSaveEdit}
                />
            )}
            <motion.div 
                className="w-full max-w-7xl mx-auto space-y-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 transition-all duration-500">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Input Area */}
                            <motion.div 
                                className="flex flex-col space-y-4"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <h2 className="text-2xl font-lalezar text-gray-700 dark:text-gray-300">أدخل التفاصيل</h2>
                                
                                <div className="relative">
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="مثال: قط يرتدي نظارات شمسية على الشاطئ بأسلوب فني..."
                                        className="w-full p-4 pr-12 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:border-purple-500 focus:ring-0 transition-all duration-300 resize-none"
                                        rows={4}
                                    />
                                    <Tooltip content="فاجئني!">
                                        <motion.button 
                                            type="button" 
                                            onClick={handleSurpriseMe} 
                                            className="absolute top-3 right-3 text-gray-500 hover:text-purple-500 transition-colors"
                                            whileHover={{ scale: 1.2, rotate: 15 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <WandIcon />
                                        </motion.button>
                                    </Tooltip>
                                </div>
                                <textarea
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    placeholder="الوصف السلبي (اختياري): عناصر لا تريدها في الصورة..."
                                    className="w-full p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:border-cyan-500 focus:ring-0 transition-all duration-300 resize-none"
                                    rows={2}
                                />
                                
                                <div className="space-y-2">
                                    <label className="font-bold text-sm text-gray-600 dark:text-gray-400">نسبة الأبعاد</label>
                                    <div className="flex space-x-2 rtl:space-x-reverse">
                                        {Object.keys(aspectRatios).map(ratio => (
                                            <motion.button type="button" key={ratio} onClick={() => setActiveAspectRatio(ratio as keyof typeof aspectRatios)}
                                                className={`flex-1 p-2 text-sm rounded-lg border-2 transition-all ${activeAspectRatio === ratio ? 'bg-purple-500 text-white border-purple-500' : 'bg-gray-100 dark:bg-gray-700 border-transparent hover:border-purple-400'}`}
                                                whileHover={{ y: -2 }}
                                            >
                                                {ratio}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="font-bold text-sm text-gray-600 dark:text-gray-400">النمط الفني</label>
                                    <select value={activeStyle} onChange={e => setActiveStyle(e.target.value as keyof typeof styles)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:border-cyan-500 focus:ring-0 transition-all duration-300">
                                        {Object.keys(styles).map(style => (
                                            <option key={style} value={style}>{style}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div 
                                    onDrop={dropHandler} 
                                    onDragOver={dragOverHandler}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 cursor-pointer transition-all duration-300 min-h-[150px] overflow-hidden"
                                >
                                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                                    <AnimatePresence>
                                    {previewUrl ? (
                                        <motion.div
                                            key="preview"
                                            className="w-full h-full"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                        >
                                            <img src={previewUrl} alt="Preview" className="h-full w-full max-h-40 object-contain rounded-md" />
                                            <div className="absolute top-2 right-2 flex space-x-1 rtl:space-x-reverse">
                                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors" aria-label="Edit image"><PencilIcon /></motion.button>
                                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="button" onClick={(e) => { e.stopPropagation(); clearImage(); }} className="bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors" aria-label="Clear image"><XIcon /></motion.button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="upload"
                                            initial={{ y: 10, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="text-center text-gray-500 dark:text-gray-400"
                                        >
                                            <UploadIcon />
                                            <p>اسحب وأفلت صورة هنا، أو انقر للتحديد</p>
                                            <p className="text-sm">(اختياري للتعديل)</p>
                                        </motion.div>
                                    )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>

                            {/* Output Area */}
                            <motion.div 
                                className="flex flex-col space-y-4"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <h2 className="text-2xl font-lalezar text-gray-700 dark:text-gray-300">النتيجة</h2>
                                <div className="relative w-full h-full min-h-[384px] lg:min-h-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                                    <AnimatePresence>
                                    {isLoading && (
                                        <motion.div 
                                            key="loader"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-center"
                                        >
                                            <Spinner />
                                            <p className="mt-4 text-gray-500 dark:text-gray-400">{currentLoadingMessage}</p>
                                        </motion.div>
                                    )}
                                    
                                    {!isLoading && generatedImage && (
                                        <motion.div 
                                            key="result"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`w-full h-full grid ${previewUrl ? 'grid-cols-2 gap-1' : 'grid-cols-1'} p-1`}
                                        >
                                            {previewUrl && (
                                                <div className="relative"><img src={previewUrl} alt="Original" className="w-full h-full object-contain" /><span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded">الأصلية</span></div>
                                            )}
                                            <div className="relative">
                                                <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
                                                <motion.a whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} href={generatedImage} download="peso-ai-image.png" className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors" aria-label="Download image"><DownloadIcon /></motion.a>
                                                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded">النتيجة</span>
                                            </div>
                                        </motion.div>
                                    )}

                                    {!isLoading && !generatedImage && (
                                         <motion.div
                                            key="placeholder"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center text-gray-400 dark:text-gray-500"
                                        >
                                            <SparklesIcon />
                                            <p>ستظهر الصورة المولدة هنا</p>
                                        </motion.div>
                                    )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </div>
                        
                        <AnimatePresence>
                        {error && <motion.p initial={{y: -10, opacity:0}} animate={{y:0, opacity:1}} exit={{opacity:0}} className="text-red-500 text-center">{error}</motion.p>}
                        </AnimatePresence>

                        <motion.button
                            type="submit"
                            disabled={isLoading || !prompt}
                            className="w-full flex items-center justify-center text-xl font-lalezar py-3 px-6 text-white bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                            whileHover={{ y: -4, boxShadow: '0 10px 20px -5px rgba(139, 92, 246, 0.4)' }}
                            whileTap={{ y: -1, boxShadow: '0 5px 10px -3px rgba(139, 92, 246, 0.3)' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                            {isLoading ? (
                                <>
                                    <Spinner />
                                    <span className="mr-2">جاري الإنشاء...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon />
                                    <span className="mr-2">{imageFile ? 'تعديل وإنشاء الصورة' : 'إنشاء الصورة'}</span>
                                </>
                            )}
                        </motion.button>
                    </form>
                </div>

                <AnimatePresence>
                {history.length > 0 && (
                    <motion.div 
                         initial={{ y: 20, opacity: 0 }}
                         animate={{ y: 0, opacity: 1 }}
                         exit={{ opacity: 0 }}
                         transition={{ duration: 0.5, delay: 0.4 }}
                         className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
                         <h2 className="text-2xl font-lalezar text-gray-700 dark:text-gray-300 mb-4">سجل الإنشاء</h2>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <AnimatePresence>
                            {history.map((item, index) => (
                                <motion.div 
                                    key={item.id} 
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative rounded-lg overflow-hidden cursor-pointer aspect-square" 
                                >
                                    <Tooltip content={item.prompt} fullWidth>
                                        <div onClick={() => handleReuseHistory(item)}>
                                            <img src={item.image} alt={item.prompt} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                                <div className="text-center text-white">
                                                    <ReuseIcon />
                                                    <p className="text-xs mt-1">إعادة استخدام</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Tooltip>
                                    <motion.button
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => handleDeleteHistory(e, item.id)}
                                        className="absolute top-1 right-1 bg-red-600/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Delete from history"
                                    >
                                        <TrashIcon />
                                    </motion.button>
                                </motion.div>
                            ))}
                            </AnimatePresence>
                         </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </motion.div>
        </>
    );
};