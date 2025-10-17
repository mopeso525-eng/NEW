import React, { useState, useRef, useCallback } from 'react';
import { generateOrEditImage } from '../services/geminiService';
import { Spinner } from './Spinner';
import { UploadIcon, SparklesIcon, XIcon, PencilIcon, DownloadIcon, ReuseIcon } from './Icons';
import { ImageEditorModal } from './ImageEditorModal';

interface HistoryItem {
    id: string;
    image: string;
    prompt: string;
    negativePrompt: string;
    baseImageUrl?: string;
    baseImageFile?: File;
}

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            updateImageFile(file);
        }
    };
    
    const updateImageFile = (file: File) => {
        clearImage(false); // Clear previous image but don't reset file input
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

        let fullPrompt = prompt;
        if (negativePrompt) {
            fullPrompt += `. تجنب وجود: ${negativePrompt}`;
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
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 12)); // Keep last 12 items

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
    }

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
            <div className="w-full max-w-7xl mx-auto animate-slide-in space-y-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 transition-all duration-500">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Input Area */}
                            <div className="flex flex-col space-y-4">
                                <h2 className="text-2xl font-lalezar text-gray-700 dark:text-gray-300">أدخل التفاصيل</h2>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="مثال: قط يرتدي نظارات شمسية على الشاطئ بأسلوب فني..."
                                    className="w-full p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:border-purple-500 focus:ring-0 transition-all duration-300 resize-none"
                                    rows={4}
                                />
                                <textarea
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    placeholder="الوصف السلبي (اختياري): عناصر لا تريدها في الصورة..."
                                    className="w-full p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-transparent focus:border-cyan-500 focus:ring-0 transition-all duration-300 resize-none"
                                    rows={2}
                                />
                                <div 
                                    onDrop={dropHandler} 
                                    onDragOver={dragOverHandler}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 cursor-pointer transition-all duration-300 h-48"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    {previewUrl ? (
                                        <>
                                            <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-md" />
                                            <div className="absolute top-2 right-2 flex space-x-1 rtl:space-x-reverse">
                                                <button type="button" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors" aria-label="Edit image">
                                                    <PencilIcon />
                                                </button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); clearImage(); }} className="bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors" aria-label="Clear image">
                                                    <XIcon />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center text-gray-500 dark:text-gray-400">
                                            <UploadIcon />
                                            <p>اسحب وأفلت صورة هنا، أو انقر للتحديد</p>
                                            <p className="text-sm">(اختياري للتعديل)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Output Area */}
                            <div className="flex flex-col space-y-4">
                                <h2 className="text-2xl font-lalezar text-gray-700 dark:text-gray-300">النتيجة</h2>
                                <div className="relative w-full h-full min-h-[384px] bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                                    {isLoading && <Spinner />}
                                    
                                    {!isLoading && generatedImage && (
                                        <div className={`w-full h-full grid ${previewUrl ? 'grid-cols-2 gap-1' : 'grid-cols-1'} p-1`}>
                                            {previewUrl && (
                                                <div className="relative">
                                                    <img src={previewUrl} alt="Original" className="w-full h-full object-contain" />
                                                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded">الأصلية</span>
                                                </div>
                                            )}
                                            <div className="relative">
                                                <img src={generatedImage} alt="Generated" className="w-full h-full object-contain animate-fade-in" />
                                                 <a href={generatedImage} download="peso-ai-image.png" className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors" aria-label="Download image">
                                                    <DownloadIcon />
                                                </a>
                                                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded">النتيجة</span>
                                            </div>
                                        </div>
                                    )}

                                    {!isLoading && !generatedImage && (
                                        <div className="text-center text-gray-400 dark:text-gray-500">
                                            <SparklesIcon />
                                            <p>ستظهر الصورة المولدة هنا</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {error && <p className="text-red-500 text-center animate-fade-in">{error}</p>}

                        <button
                            type="submit"
                            disabled={isLoading || !prompt}
                            className="w-full flex items-center justify-center text-xl font-lalezar py-3 px-6 text-white bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
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
                        </button>
                    </form>
                </div>

                {history.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
                         <h2 className="text-2xl font-lalezar text-gray-700 dark:text-gray-300 mb-4">سجل الإنشاء</h2>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {history.map((item) => (
                                <div key={item.id} className="group relative rounded-lg overflow-hidden cursor-pointer" onClick={() => handleReuseHistory(item)}>
                                    <img src={item.image} alt={item.prompt} className="w-full h-full object-cover aspect-square" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                        <div className="text-center text-white">
                                            <ReuseIcon />
                                            <p className="text-xs mt-1">إعادة استخدام</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                )}
            </div>
        </>
    );
};