
import React, { useState, useMemo } from 'react';
import { ExternalLink, Tag, Sparkles, BookOpen, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tool, UserProfile } from '../types';
import ToolInsightModal from './ToolInsightModal';
import UpgradeModal from './UpgradeModal';

interface ToolCardProps {
  tool: Tool;
  user: UserProfile | null;
  onUpdateTool?: (id: string, tool: Tool) => void;
}

// Helper for category colors (matching ClientLayout)
const getCategoryBadgeClass = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('writing')) return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
  if (cat.includes('image')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (cat.includes('video')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
  if (cat.includes('audio')) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
  if (cat.includes('coding')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  if (cat.includes('business')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
};

const ToolCard: React.FC<ToolCardProps> = ({ tool, user, onUpdateTool }) => {
  const [showModal, setShowModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [initialTab, setInitialTab] = useState<'summary' | 'slides' | 'tutorial'>('summary');
  const navigate = useNavigate();
  
  // Safety check for tags and slice for display
  const tags = tool.tags || [];
  const displayTags = tags.slice(0, 3);
  const remainingTags = tags.length - 3;

  // Check if user has premium access (starter, pro, or admin)
  const hasAccess = user && (user.role === 'admin' || user.plan === 'starter' || user.plan === 'pro');

  // Simplify price for card display to prevent overflow covering the image on mobile
  const displayPrice = useMemo(() => {
      const original = tool.price || '';
      // If it's short enough, display as is
      if (original.length <= 15) return original;
      
      const lower = original.toLowerCase();
      if (lower.includes('freemium')) return 'Freemium';
      if (lower.includes('free trial')) return 'Free Trial';
      if (lower.includes('free')) return 'Free';
      if (lower.includes('paid') || original.includes('$')) return 'Paid';
      
      return 'Check Site';
  }, [tool.price]);

  const openModal = (tab: 'summary' | 'slides' | 'tutorial') => {
      setInitialTab(tab);
      setShowModal(true);
  };

  const handleLockedClick = () => {
      setShowUpgradeModal(true);
  };

  return (
    <>
      <div className="group relative bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-indigo-900/20 flex flex-col h-full">
        <div className="relative aspect-video overflow-hidden bg-zinc-950">
          <img 
            src={tool.imageUrl} 
            alt={tool.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
            loading="lazy"
          />
          {/* Price Badge with truncation */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-[10px] md:text-xs font-medium text-white border border-white/10 shadow-sm max-w-[100px] truncate" title={tool.price}>
            {displayPrice}
          </div>
        </div>
        
        <div className="p-3 md:p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
             <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryBadgeClass(tool.category)}`}>
               {tool.category}
             </div>
          </div>
          
          <h3 className="text-sm md:text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-1">{tool.name}</h3>
          <p className="text-zinc-400 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2 flex-1">{tool.description}</p>
          
          {/* Improved Tag Display */}
          <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4 min-h-[22px] md:min-h-[26px]">
            {displayTags.map((tag, index) => (
              <span key={`${tag}-${index}`} className="flex items-center gap-1 text-[9px] md:text-[10px] font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 md:py-1 rounded-full border border-zinc-700/50 group-hover:border-zinc-600 transition-colors">
                <Tag className="w-2.5 h-2.5 md:w-3 md:h-3 text-zinc-500" /> {tag}
              </span>
            ))}
            {remainingTags > 0 && (
               <span className="flex items-center justify-center text-[9px] md:text-[10px] font-medium bg-zinc-800 text-zinc-400 px-2 py-0.5 md:py-1 rounded-full border border-zinc-700/50" title={`+${remainingTags} more tags`}>
                 +{remainingTags}
               </span>
            )}
          </div>
          
          <div className="mt-auto flex gap-2">
            <button
               onClick={hasAccess ? () => openModal('slides') : handleLockedClick}
               className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-2.5 rounded-lg text-xs font-medium transition-all shadow-lg ${
                   hasAccess 
                   ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700' 
                   : 'bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/30 text-indigo-300 hover:from-indigo-600 hover:to-purple-600 hover:text-white hover:border-transparent group/btn'
               }`}
               title={hasAccess ? "Generate Explainer Slides" : "Upgrade to unlock"}
            >
              {hasAccess ? <Sparkles className="w-3 h-3 text-indigo-400" /> : <Lock className="w-3 h-3 group-hover/btn:text-white transition-colors" />}
              <span className="hidden md:inline">Explain</span>
            </button>
            <button
               onClick={hasAccess ? () => openModal('tutorial') : handleLockedClick}
               className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-2.5 rounded-lg text-xs font-medium transition-all border ${
                   hasAccess
                   ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                   : 'bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-indigo-500/30 text-indigo-300 hover:from-indigo-600 hover:to-purple-600 hover:text-white hover:border-transparent group/btn'
               }`}
               title={hasAccess ? "Generate AI Tutorial" : "Upgrade to unlock"}
            >
              {hasAccess ? <BookOpen className="w-3 h-3 text-purple-400" /> : <Lock className="w-3 h-3 group-hover/btn:text-white transition-colors" />}
              <span className="hidden md:inline">Tutorial</span>
            </button>
            <a 
              href={tool.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-2 md:px-3 flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white py-2 md:py-2.5 rounded-lg text-xs font-medium transition-all"
              title="Visit Website"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
      
      {showModal && <ToolInsightModal tool={tool} initialTab={initialTab} onClose={() => setShowModal(false)} onUpdateTool={onUpdateTool} />}
      
      {/* Upgrade Modal for Locked Features */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </>
  );
};

export default ToolCard;
