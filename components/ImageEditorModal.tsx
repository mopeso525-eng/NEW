import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateLeftIcon, RotateRightIcon, XIcon } from './Icons';

interface ImageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    onSave: (editedFile: File) => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, imageSrc, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    const [rotation, setRotation] = useState(0);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);

    const drawImage = useCallback(() => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image || !image.src || !image.complete) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { naturalWidth: imgWidth, naturalHeight: imgHeight } = image;
        const canvasSize = Math.min(window.innerWidth * 0.8, 500);
        
        let newWidth, newHeight;
        if (imgWidth > imgHeight) {
            newWidth = canvasSize;
            newHeight = (imgHeight / imgWidth) * canvasSize;
        } else {
            newHeight = canvasSize;
            newWidth = (imgWidth / imgHeight) * canvasSize;
        }

        canvas.width = canvasSize;
        canvas.height = canvasSize;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(image, -newWidth / 2, -newHeight / 2, newWidth, newHeight);
        ctx.restore();

    }, [rotation, brightness, contrast]);

    useEffect(() => {
        if (!isOpen) return;
        
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = imageSrc;
        image.onload = () => {
            imageRef.current = image;
            drawImage();
        };
    }, [imageSrc, isOpen, drawImage]);

    useEffect(() => {
        if (isOpen && imageRef.current) {
            drawImage();
        }
    }, [rotation, brightness, contrast, isOpen, drawImage]);
    
    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.toBlob((blob) => {
            if (blob) {
                const newFile = new File([blob], 'edited-image.png', { type: 'image/png' });
                onSave(newFile);
                onClose();
            }
        }, 'image/png');
    };

    const resetFilters = () => {
        setRotation(0);
        setBrightness(100);
        setContrast(100);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl animate-slide-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-lalezar text-gray-700 dark:text-gray-300">تعديل الصورة</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon />
                    </button>
                </div>
                
                <div className="flex justify-center mb-4">
                    <canvas ref={canvasRef} className="rounded-lg border border-gray-300 dark:border-gray-600 max-w-full"></canvas>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <span className="font-bold w-24 text-right">دوران:</span>
                        <button onClick={() => setRotation(r => (r - 90) % 360)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><RotateLeftIcon /></button>
                        <span className="text-lg w-12 text-center">{rotation}°</span>
                        <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><RotateRightIcon /></button>
                    </div>

                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <span className="font-bold w-24 text-right">سطوع:</span>
                        <input type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                        <span className="text-lg w-12 text-center">{brightness}%</span>
                    </div>

                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <span className="font-bold w-24 text-right">تباين:</span>
                        <input type="range" min="0" max="200" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                        <span className="text-lg w-12 text-center">{contrast}%</span>
                    </div>
                </div>

                <div className="mt-6 flex justify-between items-center space-x-4 rtl:space-x-reverse">
                    <button
                        onClick={resetFilters}
                        className="text-md font-lalezar py-2 px-5 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        إعادة تعيين
                    </button>
                    <div className="flex-grow"></div>
                    <button
                        onClick={onClose}
                        className="text-md font-lalezar py-2 px-5 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSave}
                        className="text-xl font-lalezar py-2 px-6 text-white bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                    >
                        حفظ التعديلات
                    </button>
                </div>
            </div>
        </div>
    );
};
