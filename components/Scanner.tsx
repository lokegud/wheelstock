import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { Button } from './Button';
import { analyzeHandwrittenList } from '../services/geminiService';
import { ScannedItem } from '../types';

interface ScannerProps {
  onScanComplete: (items: ScannedItem[]) => void;
  onCancel: () => void;
  inventoryNames: string[];
}

export const Scanner: React.FC<ScannerProps> = ({ onScanComplete, onCancel, inventoryNames }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setMimeType(file.type);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        setBase64Data(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!base64Data) return;
    
    setIsAnalyzing(true);
    try {
      const results = await analyzeHandwrittenList(base64Data, mimeType, inventoryNames);
      onScanComplete(results);
    } catch (error) {
      alert("Failed to analyze image. Please try again.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setPreviewUrl(null);
    setBase64Data(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Scan List</h2>
        <Button variant="ghost" onClick={onCancel} className="!p-2">
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 relative overflow-hidden">
        {previewUrl ? (
          <>
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-contain absolute inset-0 bg-black" 
            />
            <button 
              onClick={clearImage}
              className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md text-gray-800 hover:text-red-600 z-10"
            >
              <X size={20} />
            </button>
          </>
        ) : (
          <div className="text-center p-6">
            <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
              <Camera size={32} />
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Take a photo of your handwritten removal list or upload an existing image.
            </p>
            <div className="flex gap-4 justify-center">
               <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="secondary"
                icon={<Camera size={20} />}
              >
                Take Photo
              </Button>
               {/* Hidden trigger for gallery if needed separately, but standard file input usually offers both options on mobile */}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button 
          onClick={handleAnalyze} 
          disabled={!base64Data} 
          isLoading={isAnalyzing}
          className="w-full shadow-lg"
          icon={<ImageIcon size={20} />}
        >
          {isAnalyzing ? "Analyzing List..." : "Analyze Image"}
        </Button>
        <p className="text-xs text-center text-gray-400 mt-2">
          Powered by Gemini 3 Pro Vision
        </p>
      </div>
    </div>
  );
};