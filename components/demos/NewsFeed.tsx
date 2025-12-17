
import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../../types';
import { Calendar, ExternalLink, Newspaper, Share2 } from 'lucide-react';
import NewsModal from '../NewsModal';

interface NewsFeedProps {
  articles: NewsArticle[];
  initialArticleId?: string | null;
  onUpdateArticle?: (id: string, article: NewsArticle) => void;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ articles, initialArticleId, onUpdateArticle }) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Ensure articles is always an array
  const safeArticles = Array.isArray(articles) ? articles : [];

  // Deep Link Handling
  useEffect(() => {
    if (initialArticleId && safeArticles.length > 0) {
      const article = safeArticles.find(a => a.id === initialArticleId);
      if (article) {
        setSelectedArticle(article);
      }
    }
  }, [initialArticleId, articles]);

  // Sync selected article with live data (e.g. after image generation)
  useEffect(() => {
      if (selectedArticle) {
          const fresh = safeArticles.find(a => a.id === selectedArticle.id);
          if (fresh && fresh.imageUrl !== selectedArticle.imageUrl) {
              setSelectedArticle(fresh);
          }
      }
  }, [safeArticles, selectedArticle]);

  const handleShare = (e: React.MouseEvent, article: NewsArticle) => {
      e.stopPropagation();
      const url = `${window.location.origin}/#/news/${article.id}`;
      
      if (navigator.share) {
          navigator.share({
              title: article.title,
              text: article.description,
              url: url
          }).catch(console.error);
      } else {
          navigator.clipboard.writeText(url);
          alert("Link copied to clipboard!");
      }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 md:p-6 space-y-6 md:space-y-8">
      <div className="flex items-end justify-between border-b border-zinc-800 pb-6 md:px-0 px-4">
        <div>
           <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
             <Newspaper className="w-8 h-8 text-purple-500" /> Latest News
           </h1>
           <p className="text-zinc-400">Insights, updates, and articles from the AI world.</p>
        </div>
      </div>

      {safeArticles.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800 mx-4 md:mx-0">
          <Newspaper className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-zinc-300">No news yet</h3>
          <p className="text-zinc-500 mt-2">Check back later or add news via the Admin Dashboard.</p>
        </div>
      ) : (
        /* Changed grid-cols-2 to grid-cols-1 for mobile to make cards larger */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-0">
          {safeArticles.map((article) => (
            <div key={article.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all group flex flex-col h-full hover:shadow-xl hover:shadow-purple-900/10">
              <div className="aspect-video overflow-hidden bg-zinc-950 relative cursor-pointer" onClick={() => setSelectedArticle(article)}>
                <img 
                  src={article.imageUrl} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100" 
                />
                <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-black/70 backdrop-blur-md px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[10px] md:text-xs font-medium text-white border border-white/10 z-10">
                   {article.category || 'News'}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 md:p-4 pt-8 md:pt-12">
                   <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-zinc-300">
                     <Calendar className="w-3 h-3" />
                     {new Date(article.date).toLocaleDateString()}
                   </div>
                </div>
              </div>
              
              <div className="p-4 md:p-5 flex flex-col flex-1">
                <h3 
                  className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 line-clamp-2 group-hover:text-purple-400 transition-colors cursor-pointer"
                  onClick={() => setSelectedArticle(article)}
                >
                  {article.title}
                </h3>
                <p className="text-zinc-400 text-sm mb-4 line-clamp-3">
                  {article.description}
                </p>
                
                <div className="mt-auto pt-3 md:pt-4 border-t border-zinc-800">
                   <div className="flex justify-between items-center mt-1">
                     <span className="text-[10px] md:text-xs font-semibold text-zinc-500 uppercase truncate max-w-[40%] hidden md:block">{article.source}</span>
                     
                     <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
                        <button
                          onClick={(e) => handleShare(e, article)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors flex items-center gap-1"
                          title="Share"
                        >
                            <Share2 className="w-4 h-4" />
                            <span className="text-xs md:hidden">Share</span>
                        </button>
                        <button 
                            onClick={() => setSelectedArticle(article)}
                            className="text-purple-400 text-sm font-medium flex items-center gap-1 hover:text-purple-300 transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-full"
                        >
                            <span className="hidden md:inline">Read More</span>
                            <span className="md:hidden">Read Article</span>
                            <ExternalLink className="w-3 h-3" />
                        </button>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedArticle && (
        <NewsModal 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)}
          onUpdateArticle={onUpdateArticle}
        />
      )}
    </div>
  );
};

export default NewsFeed;
