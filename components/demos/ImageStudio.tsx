import React, { useState } from 'react';
import { generateImage, editImage } from '../../services/geminiService';
import { Image as ImageIcon, Wand2, Loader2, Download } from 'lucide-react';
import { arrayBufferToBase64 } from '../../services/audioUtils';

const ImageStudio: React.FC = () => {
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Gen Config
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [size, setSize] = useState('1K');
  
  // Edit Config
  const [editFile, setEditFile] = useState<File | null>(null);

  const handleAction = async () => {
    if (!prompt) return;
    setLoading(true);
    setGeneratedImage(null);

    try {
      if (mode === 'generate') {
        const res = await generateImage(prompt, aspectRatio, size);
        // Find image part
        let imgData = null;
        for (const part of res.candidates?.[0]?.content?.parts || []) {
           if (part.inlineData) imgData = part.inlineData.data;
        }
        if (imgData) setGeneratedImage(`data:image/png;base64,${imgData}`);
      } else {
        if (!editFile) throw new Error("Please upload an image to edit");
        const buffer = await editFile.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        const res = await editImage(prompt, base64);
         let imgData = null;
        for (const part of res.candidates?.[0]?.content?.parts || []) {
           if (part.inlineData) imgData = part.inlineData.data;
        }
        if (imgData) setGeneratedImage(`data:image/png;base64,${imgData}`);
      }
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
       <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-emerald-500" /> Image Studio
        </h2>
        <p className="text-zinc-400">
           Create with <span className="text-emerald-400">Gemini 3 Pro</span> or edit with <span className="text-emerald-400">Nano Banana</span>.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button 
          onClick={() => setMode('generate')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${mode === 'generate' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Generate (Pro)
        </button>
        <button 
          onClick={() => setMode('edit')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${mode === 'edit' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Edit (Flash Image)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
           <div>
             <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Prompt</label>
             <textarea 
               value={prompt}
               onChange={e => setPrompt(e.target.value)}
               className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-emerald-500 focus:outline-none resize-none"
               placeholder={mode === 'generate' ? "A futuristic city on Mars..." : "Add a retro filter, remove background person..."}
             />
           </div>

           {mode === 'generate' && (
             <>
               <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Size</label>
                  <select value={size} onChange={e => setSize(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm">
                    <option value="1K">1K (Standard)</option>
                    <option value="2K">2K (High)</option>
                    <option value="4K">4K (Ultra)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Aspect Ratio</label>
                  <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm">
                    <option value="1:1">Square (1:1)</option>
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="9:16">Portrait (9:16)</option>
                    <option value="4:3">4:3</option>
                    <option value="3:4">3:4</option>
                  </select>
               </div>
             </>
           )}

           {mode === 'edit' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Source Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setEditFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-zinc-400" 
                />
              </div>
           )}

           <button 
             onClick={handleAction}
             disabled={loading || !prompt}
             className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
             {mode === 'generate' ? 'Create' : 'Edit'}
           </button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center min-h-[400px] relative">
           {loading ? (
             <div className="text-emerald-500 flex flex-col items-center animate-pulse">
               <Loader2 className="w-10 h-10 animate-spin mb-2" />
               <span>Creating magic...</span>
             </div>
           ) : generatedImage ? (
             <div className="relative w-full h-full flex items-center justify-center p-4">
                <img src={generatedImage} alt="Generated" className="max-w-full max-h-[500px] rounded shadow-2xl" />
                <a 
                  href={generatedImage} 
                  download="gemini-creation.png"
                  className="absolute bottom-6 right-6 p-3 bg-white text-black rounded-full shadow-lg hover:bg-zinc-200 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </a>
             </div>
           ) : (
             <div className="text-zinc-700 flex flex-col items-center">
               <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
               <span>Result will appear here</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ImageStudio;