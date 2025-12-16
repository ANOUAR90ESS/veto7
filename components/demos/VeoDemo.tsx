import React, { useState, useEffect } from 'react';
import { generateVideo, pollVideoOperation } from '../../services/geminiService';
import { Film, Loader2, Play } from 'lucide-react';
import { arrayBufferToBase64 } from '../../services/audioUtils';

const VeoDemo: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [progress, setProgress] = useState('');

  // Cleanup blob URL on unmount or new video
  useEffect(() => {
    return () => {
      if (videoUri && videoUri.startsWith('blob:')) {
        URL.revokeObjectURL(videoUri);
      }
    };
  }, [videoUri]);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    // API Key Check for Veo
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Assume success after dialog per prompt instructions
      }
    }

    setLoading(true);
    setVideoUri(null);
    setProgress('Initializing generation...');

    try {
      let imageBase64 = undefined;
      if (imageFile) {
        const buffer = await imageFile.arrayBuffer();
        imageBase64 = arrayBufferToBase64(buffer);
      }

      let operation = await generateVideo(prompt, imageBase64, aspectRatio);
      
      setProgress('Veo is dreaming (this takes a moment)...');
      
      // Polling loop
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5s poll
        operation = await pollVideoOperation(operation);
        setProgress('Rendering video frames...');
      }

      const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
        setProgress('Downloading video...');
        // Fetch the video bytes directly
        // Safer check for query params
        const separator = uri.includes('?') ? '&' : '?';
        const url = `${uri}${separator}key=${process.env.API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
           throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type') || 'video/mp4';
        const blob = await response.blob();
        
        if (blob.size < 1000) {
            throw new Error("Video file is too small or empty. Generation might have failed.");
        }

        // Use dynamic content type or fallback to mp4
        const videoBlob = new Blob([blob], { type: contentType });
        const blobUrl = URL.createObjectURL(videoBlob);
        
        setVideoUri(blobUrl);
        setProgress('Done!');
      } else {
        setProgress('Failed: No video URI returned.');
      }

    } catch (e: any) {
      console.error(e);
      setProgress(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
       <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Film className="w-8 h-8 text-pink-500" /> Veo Video Studio
        </h2>
        <p className="text-zinc-400">Generate high-quality videos from text or image prompts using Veo 3.1.</p>
      </div>

      <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Creative Prompt</label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A neon hologram of a cat driving at top speed..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Start Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-900/20 file:text-pink-400 hover:file:bg-pink-900/30"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-zinc-300 mb-2">Aspect Ratio</label>
             <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-700">
               <button 
                onClick={() => setAspectRatio('16:9')}
                className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${aspectRatio === '16:9' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 Landscape (16:9)
               </button>
               <button 
                onClick={() => setAspectRatio('9:16')}
                className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${aspectRatio === '9:16' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 Portrait (9:16)
               </button>
             </div>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !prompt}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {loading ? 'Generating...' : 'Generate Video'}
        </button>

        {loading && (
          <div className="text-center text-sm text-pink-400 animate-pulse">
            {progress}
          </div>
        )}
      </div>

      {videoUri && (
        <div className="bg-black rounded-xl overflow-hidden border border-zinc-800 aspect-video flex items-center justify-center relative group">
           <video 
             key={videoUri}
             src={videoUri} 
             controls 
             className="w-full h-full" 
             autoPlay 
             loop 
             muted
             playsInline
           />
        </div>
      )}
    </div>
  );
};

export default VeoDemo;