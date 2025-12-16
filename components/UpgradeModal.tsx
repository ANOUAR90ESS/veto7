
import React from 'react';
import { X, Crown, Sparkles, BookOpen, Video, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-8 text-center overflow-hidden">
           {/* Decorative elements */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
           
           <div className="relative z-10">
             <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30 transform rotate-3">
                <Crown className="w-8 h-8 text-white" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-1">Unlock Premium</h2>
             <p className="text-indigo-200 text-sm">Get access to powerful AI generation tools.</p>
           </div>
        </div>

        {/* Benefits List */}
        <div className="p-6 space-y-4 bg-zinc-900">
           <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                 <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                 </div>
                 <div>
                    <h4 className="text-white font-medium text-sm">Instant Slide Decks</h4>
                    <p className="text-zinc-500 text-xs">Generate presentations from any tool.</p>
                 </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                 <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                 </div>
                 <div>
                    <h4 className="text-white font-medium text-sm">AI Tutorials & Courses</h4>
                    <p className="text-zinc-500 text-xs">Deep dive learning content on demand.</p>
                 </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                 <div className="p-2 bg-pink-500/10 rounded-lg shrink-0">
                    <Video className="w-5 h-5 text-pink-400" />
                 </div>
                 <div>
                    <h4 className="text-white font-medium text-sm">Veo Video Studio</h4>
                    <p className="text-zinc-500 text-xs">Create cinematic AI videos.</p>
                 </div>
              </div>
           </div>

           <button
             onClick={handleUpgrade}
             className="w-full py-3 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
           >
             Upgrade Now <Check className="w-4 h-4" />
           </button>
           
           <p className="text-center text-[10px] text-zinc-500">
             One-time payment. Lifetime access.
           </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
