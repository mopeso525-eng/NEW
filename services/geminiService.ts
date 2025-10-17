import { GoogleGenAI, Modality, Part } from "@google/genai";

const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                resolve('');
            }
        };
        reader.readAsDataURL(file);
    });

    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
};

export const generateOrEditImage = async (prompt: string, imageFile?: File): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key not found. Please set the API_KEY environment variable.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts: Part[] = [];
    if (imageFile) {
        const imagePart = await fileToGenerativePart(imageFile);
        parts.push(imagePart);
    }
    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        // Check for image data first.
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                return `data:${mimeType};base64,${base64ImageBytes}`;
            }
        }
        
        // If no image is found, the model might have responded with text (e.g., an error or explanation).
        const textResponse = response.text;
        if (textResponse && textResponse.trim()) {
            // The model explained why it couldn't generate an image.
            throw new Error(`فشل إنشاء الصورة: ${textResponse}`);
        }

        // If no image and no text, it's an unexpected response.
        throw new Error("لم يتم العثور على صورة في استجابة النموذج.");

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Propagate the specific error message to be displayed in the UI.
        if (error instanceof Error) {
             throw error;
        }
        throw new Error("حدث خطأ غير متوقع أثناء الاتصال بـ Gemini API.");
    }
};