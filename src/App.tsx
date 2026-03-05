import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Image as ImageIcon, Download, Trash2, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeBackground = async () => {
    if (!image) return;

    setIsProcessing(true);
    setError(null);

    try {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: 'Remove the background of this image and make it transparent. Return only the image with the background removed.',
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setResult(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error('Could not process the image. Please try again with a different photo.');
      }
    } catch (err: any) {
      console.error('Error removing background:', err);
      setError(err.message || 'An error occurred while processing the image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = 'nadiya-studio-removed-bg.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-slate-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-xl tracking-tight">Nadiya Studio</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">Remove BG</p>
            </div>
          </div>
          
          <button 
            onClick={reset}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            title="Start Over"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Side: Upload & Original */}
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-display font-medium tracking-tight">Remove image background instantly.</h2>
              <p className="text-slate-500 text-lg">Upload your photo and let our AI handle the rest.</p>
            </div>

            <AnimatePresence mode="wait">
              {!image ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-slate-400 hover:bg-slate-50/50 transition-all duration-300"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Upload className="text-slate-400 group-hover:text-slate-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-slate-900">Click to upload or drag and drop</p>
                    <p className="text-sm text-slate-400 mt-1">PNG, JPG or WEBP (max. 10MB)</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group rounded-3xl overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50"
                >
                  <img src={image} alt="Original" className="w-full h-auto object-cover" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-sm">Original</span>
                  </div>
                  {!result && !isProcessing && (
                    <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-medium shadow-xl hover:scale-105 transition-transform"
                      >
                        Change Photo
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {image && !result && !isProcessing && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={removeBackground}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-medium text-lg flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20"
              >
                <Sparkles size={20} />
                Generate Transparent BG
              </motion.button>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100"
              >
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Right Side: Result */}
          <div className="lg:sticky lg:top-32">
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="aspect-square bg-slate-50 rounded-3xl flex flex-col items-center justify-center gap-6 border border-slate-100"
                >
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-slate-900 animate-spin" />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-slate-900/10 blur-xl rounded-full"
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-medium text-slate-900">Removing background...</p>
                    <p className="text-sm text-slate-400">This usually takes a few seconds</p>
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="relative rounded-3xl overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50 checkerboard">
                    <img src={result} alt="Result" className="w-full h-auto object-cover" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-sm flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        Result
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={downloadResult}
                      className="bg-slate-900 text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-900/10"
                    >
                      <Download size={18} />
                      Download
                    </button>
                    <button
                      onClick={reset}
                      className="bg-white text-slate-900 border border-slate-200 py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-[0.98] transition-all"
                    >
                      <Trash2 size={18} />
                      Discard
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="aspect-square bg-slate-50 rounded-3xl flex flex-col items-center justify-center gap-4 border border-slate-100 border-dashed"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <ImageIcon className="text-slate-200" size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">Result will appear here</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-400 text-sm">© 2026 Nadiya Studio. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <a href="#" className="text-slate-400 hover:text-slate-900 text-sm font-medium transition-colors">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-slate-900 text-sm font-medium transition-colors">Terms</a>
            <a href="#" className="text-slate-400 hover:text-slate-900 text-sm font-medium transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
