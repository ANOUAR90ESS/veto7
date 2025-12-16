import React, { useState, useRef, useEffect } from 'react';
import { transcribeAudio, generateSpeech, generateConversationScript, generateMultiSpeakerSpeech } from '../../services/geminiService';
import { Mic, Play, Activity, ChevronDown, Sliders, Users, Music, StopCircle, RefreshCw, Wand2 } from 'lucide-react';
import { arrayBufferToBase64 } from '../../services/audioUtils';

const AudioLab: React.FC = () => {
    const [tab, setTab] = useState<'tts' | 'transcribe'>('transcribe');
    const [ttsMode, setTtsMode] = useState<'single' | 'conversation'>('single');
    
    // TTS State
    const [ttsInput, setTtsInput] = useState('');
    const [topicInput, setTopicInput] = useState('');
    const [ttsLoading, setTtsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    
    // Voice Config
    const [selectedVoice, setSelectedVoice] = useState('Kore');
    const [speaker1, setSpeaker1] = useState({ name: 'Host', voice: 'Kore' });
    const [speaker2, setSpeaker2] = useState({ name: 'Guest', voice: 'Puck' });
    
    // Playback Controls
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // DSP Params
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [pitchDetune, setPitchDetune] = useState(0); // In semitones

    // Transcribe State
    const [recording, setRecording] = useState(false);
    const [transcription, setTranscription] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const voices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

    useEffect(() => {
        return () => {
            if (sourceNode) {
                try { sourceNode.stop(); } catch (e) {}
            }
            if (audioContext) {
                audioContext.close();
            }
        };
    }, []);

    // --- Playback Logic with Web Audio API ---
    const playAudioBuffer = async (buffer: AudioBuffer) => {
        // Stop previous if playing
        if (sourceNode) {
            try { sourceNode.stop(); } catch(e) {}
        }
        
        const ctx = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        if (!audioContext) setAudioContext(ctx);

        if (ctx.state === 'suspended') await ctx.resume();

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        // Apply effects
        source.playbackRate.value = playbackRate;
        source.detune.value = pitchDetune * 100; // 100 cents per semitone

        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(false);
        
        source.start(0);
        setSourceNode(source);
        setIsPlaying(true);
    };

    const stopPlayback = () => {
        if (sourceNode) {
            try { sourceNode.stop(); } catch(e) {}
            setIsPlaying(false);
        }
    };

    const updatePlaybackParams = (rate: number, pitch: number) => {
        setPlaybackRate(rate);
        setPitchDetune(pitch);
        if (sourceNode && isPlaying) {
            // Update in real-time
            sourceNode.playbackRate.value = rate;
            sourceNode.detune.value = pitch * 100;
        }
    };

    const handleGenerate = async () => {
        setTtsLoading(true);
        stopPlayback();
        
        try {
            let base64 = '';

            if (ttsMode === 'single') {
                if (!ttsInput) return;
                setLoadingStage('Generating speech...');
                const res = await generateSpeech(ttsInput, selectedVoice);
                base64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
            } else {
                if (!topicInput) return;
                
                setLoadingStage('Writing script with Gemini Flash...');
                const script = await generateConversationScript(topicInput, speaker1.name, speaker2.name);
                
                if (!script) throw new Error("Failed to generate script");
                
                setLoadingStage('Synthesizing conversation...');
                const res = await generateMultiSpeakerSpeech(script, speaker1, speaker2);
                base64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
            }

            if (base64) {
                setLoadingStage('Decoding audio...');
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                setAudioContext(ctx);
                
                const binaryString = atob(base64);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                const buffer = await ctx.decodeAudioData(bytes.buffer);
                setAudioBuffer(buffer);
                playAudioBuffer(buffer);
            }
        } catch (e: any) {
            console.error(e);
            alert("Error: " + e.message);
        } finally {
            setTtsLoading(false);
            setLoadingStage('');
        }
    };

    const toggleRecord = async () => {
        if (recording) {
            mediaRecorderRef.current?.stop();
            setRecording(false);
        } else {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream);
            chunksRef.current = [];
            
            mr.ondataavailable = e => chunksRef.current.push(e.data);
            mr.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                const buffer = await blob.arrayBuffer();
                const base64 = arrayBufferToBase64(buffer);
                setTranscription("Transcribing...");
                try {
                    const text = await transcribeAudio(base64);
                    setTranscription(text || "No text found.");
                } catch (e: any) {
                    setTranscription("Error: " + e.message);
                }
                stream.getTracks().forEach(t => t.stop());
            };
            
            mr.start();
            mediaRecorderRef.current = mr;
            setRecording(true);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="text-orange-500" /> Audio Lab
            </h2>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="flex border-b border-zinc-800">
                    <button onClick={() => setTab('transcribe')} className={`flex-1 py-4 font-medium transition-colors ${tab === 'transcribe' ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        Speech to Text
                    </button>
                    <button onClick={() => setTab('tts')} className={`flex-1 py-4 font-medium transition-colors ${tab === 'tts' ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-500/5' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        Text to Speech
                    </button>
                </div>

                <div className="p-8">
                    {tab === 'transcribe' && (
                        <div className="text-center w-full min-h-[300px] flex flex-col items-center justify-center">
                            <button 
                                onClick={toggleRecord}
                                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${recording ? 'bg-red-600 animate-pulse ring-8 ring-red-600/20' : 'bg-zinc-800 hover:bg-zinc-700 ring-8 ring-zinc-800/50'}`}
                            >
                                <Mic className={`w-10 h-10 ${recording ? 'text-white' : 'text-zinc-400'}`} />
                            </button>
                            <p className="mt-6 text-zinc-500 font-medium">{recording ? "Listening..." : "Tap microphone to Transcribe"}</p>
                            
                            {transcription && (
                                <div className="mt-8 p-6 bg-black/40 rounded-xl w-full text-left border border-zinc-800 max-w-2xl">
                                    <h4 className="text-xs text-orange-500 font-bold uppercase mb-2">Transcription Result</h4>
                                    <p className="text-white text-lg leading-relaxed">{transcription}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'tts' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Controls Column */}
                            <div className="space-y-6">
                                {/* Mode Selection */}
                                <div className="bg-zinc-950 p-1 rounded-lg border border-zinc-800 flex">
                                    <button 
                                        onClick={() => setTtsMode('single')} 
                                        className={`flex-1 py-2 rounded flex items-center justify-center gap-2 text-sm font-medium transition-all ${ttsMode === 'single' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}
                                    >
                                        <Mic className="w-4 h-4" /> Single Voice
                                    </button>
                                    <button 
                                        onClick={() => setTtsMode('conversation')} 
                                        className={`flex-1 py-2 rounded flex items-center justify-center gap-2 text-sm font-medium transition-all ${ttsMode === 'conversation' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}
                                    >
                                        <Users className="w-4 h-4" /> Conversation
                                    </button>
                                </div>

                                {ttsMode === 'single' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Voice</label>
                                            <div className="relative">
                                                <select
                                                    value={selectedVoice}
                                                    onChange={(e) => setSelectedVoice(e.target.value)}
                                                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg p-3 appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
                                                >
                                                    {voices.map(voice => <option key={voice} value={voice}>{voice}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Message</label>
                                            <textarea 
                                                value={ttsInput}
                                                onChange={e => setTtsInput(e.target.value)}
                                                placeholder="Enter text to speak..."
                                                className="w-full bg-zinc-950 p-4 rounded-lg border border-zinc-700 text-white min-h-[140px] focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Speaker 1</label>
                                                <select
                                                    value={speaker1.voice}
                                                    onChange={(e) => setSpeaker1({...speaker1, voice: e.target.value})}
                                                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg p-2 text-sm focus:outline-none"
                                                >
                                                    {voices.map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Speaker 2</label>
                                                <select
                                                    value={speaker2.voice}
                                                    onChange={(e) => setSpeaker2({...speaker2, voice: e.target.value})}
                                                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg p-2 text-sm focus:outline-none"
                                                >
                                                    {voices.map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Conversation Topic</label>
                                            <textarea 
                                                value={topicInput}
                                                onChange={e => setTopicInput(e.target.value)}
                                                placeholder="E.g. The future of quantum computing..."
                                                className="w-full bg-zinc-950 p-4 rounded-lg border border-zinc-700 text-white min-h-[140px] focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
                                            />
                                        </div>
                                    </>
                                )}

                                <button 
                                    onClick={handleGenerate}
                                    disabled={ttsLoading || (ttsMode === 'single' ? !ttsInput : !topicInput)}
                                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-900/20"
                                >
                                    {ttsLoading ? (
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" /> 
                                            <span className="text-sm">{loadingStage || 'Processing...'}</span>
                                        </div>
                                    ) : (
                                        <>
                                            {ttsMode === 'single' ? <Play className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                                            {ttsMode === 'single' ? 'Generate Speech' : 'Create Conversation'}
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Playback / Visualizer Column */}
                            <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-6 flex flex-col">
                                <h3 className="text-zinc-400 font-medium mb-4 flex items-center gap-2">
                                    <Sliders className="w-4 h-4" /> Playback Control
                                </h3>

                                <div className="flex-1 flex items-center justify-center bg-zinc-900/50 rounded-lg mb-6 relative overflow-hidden group">
                                    {audioBuffer ? (
                                        <div className="text-center z-10">
                                             <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                                                <Music className="w-10 h-10 text-orange-500" />
                                             </div>
                                             <div className="text-sm text-zinc-300 font-medium">
                                                 {isPlaying ? 'Playing Audio...' : 'Audio Ready'}
                                             </div>
                                             <div className="text-xs text-zinc-500 mt-1">
                                                 {(audioBuffer.duration).toFixed(1)}s • {audioBuffer.numberOfChannels}ch • {audioBuffer.sampleRate}Hz
                                             </div>
                                        </div>
                                    ) : (
                                        <div className="text-zinc-600 text-sm text-center">
                                            Generate audio to enable controls
                                        </div>
                                    )}
                                    
                                    {/* Playback Button Overlay */}
                                    {audioBuffer && !isPlaying && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => playAudioBuffer(audioBuffer)}
                                                className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform"
                                            >
                                                <Play className="w-6 h-6 fill-current" />
                                            </button>
                                        </div>
                                    )}
                                    {isPlaying && (
                                         <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={stopPlayback}
                                                className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform"
                                            >
                                                <StopCircle className="w-6 h-6 fill-current" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* DSP Sliders */}
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase mb-2">
                                            <span>Speed ({playbackRate.toFixed(1)}x)</span>
                                            <span>0.5x - 2.0x</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0.5" 
                                            max="2.0" 
                                            step="0.1" 
                                            value={playbackRate}
                                            onChange={(e) => updatePlaybackParams(parseFloat(e.target.value), pitchDetune)}
                                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                            disabled={!audioBuffer}
                                        />
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase mb-2">
                                            <span>Pitch ({pitchDetune > 0 ? '+' : ''}{pitchDetune} st)</span>
                                            <span>-12 to +12</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="-12" 
                                            max="12" 
                                            step="1" 
                                            value={pitchDetune}
                                            onChange={(e) => updatePlaybackParams(playbackRate, parseFloat(e.target.value))}
                                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                            disabled={!audioBuffer}
                                        />
                                        <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                                            <span>Low</span>
                                            <span>Normal</span>
                                            <span>High</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => { updatePlaybackParams(1.0, 0); }}
                                        disabled={!audioBuffer}
                                        className="w-full py-2 border border-zinc-800 rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                                    >
                                        Reset Controls
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioLab;