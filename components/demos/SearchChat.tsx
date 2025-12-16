import React, { useState } from 'react';
import { sendChatMessage } from '../../services/geminiService';
import { Send, MapPin, Globe, User, Bot, Loader } from 'lucide-react';
import { ChatMessage } from '../../types';

const SearchChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([
    { role: 'model', text: "Hello! I have access to Google Search and Maps. Ask me about current events or places nearby." }
  ]);
  const [loading, setLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [useMaps, setUseMaps] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: input };
    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build proper history for context if needed, but for this demo we just send prompt for simplicity in grounding
      const response = await sendChatMessage([], userMsg.text, useSearch, useMaps);
      
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: Array<{uri: string, title: string}> = [];
      
      groundingChunks.forEach((chunk: any) => {
         if (chunk.web) sources.push({ uri: chunk.web.uri, title: chunk.web.title });
         if (chunk.maps) sources.push({ uri: chunk.maps.uri, title: chunk.maps.title || "Map Location" });
      });

      setHistory(prev => [...prev, { 
        role: 'model', 
        text: response.text || "No response text.",
        groundingUrls: sources
      }]);
    } catch (e: any) {
      setHistory(prev => [...prev, { role: 'model', text: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
           <Bot className="w-5 h-5 text-indigo-400" /> Smart Chat
        </h3>
        <div className="flex gap-2 text-sm">
           <button 
             onClick={() => setUseSearch(!useSearch)}
             className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-colors ${useSearch ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}
           >
             <Globe className="w-3 h-3" /> Search
           </button>
           <button 
             onClick={() => setUseMaps(!useMaps)}
             className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-colors ${useMaps ? 'bg-green-500/10 border-green-500 text-green-400' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}
           >
             <MapPin className="w-3 h-3" /> Maps
           </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {history.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-indigo-600'}`}>
               {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-300" /> : <Bot className="w-4 h-4 text-white" />}
             </div>
             <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-zinc-800 text-white' : 'bg-indigo-900/20 text-indigo-100'}`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-indigo-500/20">
                     <p className="text-xs font-semibold text-indigo-400 mb-1">Sources:</p>
                     <div className="flex flex-wrap gap-2">
                       {msg.groundingUrls.map((url, idx) => (
                         <a 
                           key={idx} 
                           href={url.uri} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-xs bg-black/30 px-2 py-1 rounded hover:bg-black/50 transition-colors truncate max-w-[200px]"
                         >
                           {url.title}
                         </a>
                       ))}
                     </div>
                  </div>
                )}
             </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
               <Loader className="w-4 h-4 animate-spin text-white" />
             </div>
             <div className="bg-indigo-900/20 text-indigo-200 rounded-2xl p-4 text-sm animate-pulse">
                Thinking...
             </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900">
         <div className="flex gap-2">
           <input 
             type="text" 
             value={input}
             onChange={e => setInput(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && handleSend()}
             className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
             placeholder="Ask about news or places..."
           />
           <button 
             onClick={handleSend}
             disabled={loading || !input}
             className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
           >
             <Send className="w-5 h-5" />
           </button>
         </div>
      </div>
    </div>
  );
};

export default SearchChat;