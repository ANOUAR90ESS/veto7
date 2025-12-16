import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { createPCM16Blob, decodeAudioData } from '../../services/audioUtils';

const LiveDemo: React.FC = () => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("Ready to connect");
  const [logs, setLogs] = useState<string[]>([]);
  
  // Refs for audio processing to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (inputContextRef.current) inputContextRef.current.close();
    
    // We can't strictly "close" the session via SDK easily without the session object stored, 
    // but the disconnect of context usually stops it or we just reload.
    // Ideally we store the session object but the SDK uses a promise pattern for streaming.
    setActive(false);
    setStatus("Disconnected");
  };

  const startSession = async () => {
    try {
      setStatus("Initializing...");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      
      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus("Connected! Speak now.");
            addLog("Session opened");
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPCM16Blob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio) {
               addLog("Received audio chunk");
               const ctx = audioContextRef.current;
               if (!ctx) return;

               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
               
               const audioBuffer = await decodeAudioData(
                 // Need helper to decode base64 to uint8 first
                 Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)),
                 ctx, 24000, 1
               );

               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(ctx.destination);
               source.addEventListener('ended', () => {
                 sourcesRef.current.delete(source);
               });
               
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(source);
             }

             if (msg.serverContent?.interrupted) {
               addLog("Interrupted by user");
               sourcesRef.current.forEach(s => s.stop());
               sourcesRef.current.clear();
               nextStartTimeRef.current = 0;
             }
          },
          onclose: () => {
            setStatus("Session Closed");
            addLog("Session closed");
            setActive(false);
          },
          onerror: (err) => {
            console.error(err);
            setStatus("Error occurred");
            addLog("Error occurred");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: "You are a helpful, witty AI assistant living in a futuristic web interface."
        }
      });
      
      sessionPromiseRef.current = sessionPromise;
      setActive(true);

    } catch (e: any) {
      console.error(e);
      setStatus("Failed to connect: " + e.message);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Gemini Live Conversation</h2>
        <p className="text-zinc-400">Experience real-time, low-latency voice chat with Gemini 2.5.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900/50 rounded-2xl border border-zinc-800 relative overflow-hidden">
        
        {/* Visualizer Placeholder */}
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${active ? 'bg-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.3)] animate-pulse' : 'bg-zinc-800'}`}>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${active ? 'bg-indigo-600 shadow-lg' : 'bg-zinc-700'}`}>
            <Volume2 className={`w-10 h-10 ${active ? 'text-white' : 'text-zinc-500'}`} />
          </div>
        </div>

        <div className="mt-8 text-xl font-mono text-zinc-300">
           {status}
        </div>

        <div className="mt-4 flex gap-4">
           {!active ? (
             <button 
               onClick={startSession}
               className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold transition-all hover:scale-105"
             >
               <Mic className="w-5 h-5" /> Start Conversation
             </button>
           ) : (
             <button 
               onClick={cleanup}
               className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold transition-all hover:scale-105"
             >
               <MicOff className="w-5 h-5" /> End Session
             </button>
           )}
        </div>
      </div>

      <div className="h-32 bg-black/40 rounded-lg p-4 font-mono text-xs text-green-400 overflow-y-auto border border-zinc-800">
        <div className="text-zinc-500 mb-2 border-b border-zinc-800 pb-1">System Logs</div>
        {logs.map((log, i) => (
          <div key={i}>&gt; {log}</div>
        ))}
      </div>
    </div>
  );
};

export default LiveDemo;