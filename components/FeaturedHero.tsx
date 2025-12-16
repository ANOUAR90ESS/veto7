
import React from 'react';
import { Tool, UserProfile } from '../types';
import { Sparkles, ArrowRight, Star, ExternalLink, PlayCircle } from 'lucide-react';

interface FeaturedHeroProps {
  tool: Tool;
  onOpenDetails: () => void;
}

const FeaturedHero: React.FC<FeaturedHeroProps> = ({ tool, onOpenDetails }) => {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl mb-12 group">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={tool.imageUrl} 
          alt={tool.name} 
          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Adjusted gradient: Lighter 'from' value and opacity to reveal more image */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 md:p-12 flex flex-col items-start max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3 h-3 fill-current" />
          Featured Tool of the Day
        </div>

        <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight shadow-black drop-shadow-md">
          {tool.name}
        </h2>

        <p className="text-lg text-zinc-300 mb-8 leading-relaxed line-clamp-3 drop-shadow-md">
          {tool.description}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={onOpenDetails}
            className="px-8 py-4 bg-white text-black rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors shadow-lg"
          >
            <PlayCircle className="w-5 h-5" />
            See How It Works
          </button>
          
          <a 
            href={tool.website}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-700 transition-colors"
          >
            Visit Website
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Stats Row */}
        <div className="mt-10 flex items-center gap-8 text-sm text-zinc-400 font-medium">
           <div className="flex items-center gap-2 text-yellow-500">
             <Star className="w-4 h-4 fill-current" />
             <span className="text-white">4.9/5</span> Rating
           </div>
           <div className="w-1 h-1 bg-zinc-600 rounded-full" />
           <div>
             <span className="text-white">12k+</span> Active Users
           </div>
           <div className="w-1 h-1 bg-zinc-600 rounded-full" />
           <div className="uppercase tracking-wide text-indigo-300">
             {tool.category}
           </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedHero;
