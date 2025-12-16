
import React from 'react';
import { NewsArticle } from '../types';
import { X, Calendar, User, Tag, Share2 } from 'lucide-react';
import SEO from './SEO';

interface NewsModalProps {
  article: NewsArticle;
  onClose: () => void;
  onUpdateArticle?: (id: string, article: NewsArticle) => void;
}

const NewsModal: React.FC<NewsModalProps> = ({ article, onClose, onUpdateArticle }) => {
  
  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleShare = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/#/news/${article.id}`;
    if (navigator.share) {
        navigator.share({
            title: article.title,
            text: `Check out this article on VETORRE: ${article.title}`,
            url: url
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center md:p-4 bg-zinc-950 md:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <SEO 
        title={`${article.title} - VETORRE News`}
        description={article.description}
        image={article.imageUrl}
        type="article"
      />

      <div className="bg-zinc-900 md:border md:border-zinc-800 rounded-none md:rounded-2xl w-full h-[100dvh] md:h-auto md:max-h-[90vh] max-w-3xl overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header / Image */}
        <div className="relative h-64 md:h-80 shrink-0 group">
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
          
          <div className="absolute top-4 right-4 flex gap-3 z-10">
            <button 
              onClick={handleShare}
              className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-all"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-all"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
             <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300 mb-3">
                <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur border border-white/10">
                  <Calendar className="w-3.5 h-3.5" /> 
                  {new Date(article.date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur border border-white/10">
                  <User className="w-3.5 h-3.5" /> 
                  {article.source}
                </span>
                {article.category && (
                    <span className="flex items-center gap-1.5 bg-purple-500/80 px-2.5 py-1 rounded-full backdrop-blur border border-white/10 text-white">
                      <Tag className="w-3.5 h-3.5" /> 
                      {article.category}
                    </span>
                )}
             </div>
             <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight shadow-black drop-shadow-lg">
               {article.title}
             </h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-zinc-900 p-6 md:p-8 custom-scrollbar pb-24 md:pb-8">
           <div className="prose prose-invert max-w-none">
             {/* Description / Summary */}
             {article.description && (
               <div className="mb-8 text-xl text-zinc-400 font-light border-l-4 border-purple-500 pl-4 italic leading-relaxed">
                 {article.description}
               </div>
             )}
             
             {/* Main Content */}
             <p className="text-lg md:text-xl text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans font-light tracking-wide">
               {article.content}
             </p>
           </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-between items-center shrink-0 safe-area-bottom absolute bottom-0 left-0 right-0 md:relative">
          <div className="text-xs text-zinc-500 hidden md:block">
            Article ID: {article.id}
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
             <button
                onClick={handleShare}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 md:py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors border border-zinc-700"
             >
                <Share2 className="w-4 h-4" /> <span className="md:hidden">Share</span>
             </button>
             <button 
                onClick={onClose}
                className="flex-[2] md:flex-none px-6 py-3 md:py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
             >
                Close <span className="md:hidden">Article</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsModal;
