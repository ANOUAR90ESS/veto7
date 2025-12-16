import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, FileQuestion, AlertTriangle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg mx-auto space-y-8">
        <div className="relative inline-block">
           <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 tracking-tighter select-none">
             404
           </h1>
           <div className="absolute -top-4 -right-4 rotate-12 bg-zinc-900 border border-zinc-800 p-2 rounded-lg shadow-xl animate-bounce">
             <AlertTriangle className="w-8 h-8 text-amber-500" />
           </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white">Hallucination Detected</h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            The neural pathway you are trying to access does not exist or has been pruned from the network.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 font-medium transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-900/20 hover:scale-105"
          >
            <Home className="w-4 h-4" />
            Return Home
          </button>
        </div>
      </div>
      
      {/* Footer hint */}
      <div className="absolute bottom-8 text-zinc-600 text-sm flex items-center gap-2">
         <FileQuestion className="w-4 h-4" />
         <span>Error Code: RESOURCE_NOT_FOUND</span>
      </div>
    </div>
  );
};

export default NotFoundPage;