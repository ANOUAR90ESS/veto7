
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ToolCard from './ToolCard';
import FeaturedHero from './FeaturedHero';
import NewsFeed from './demos/NewsFeed';
import Footer from './Footer';
import GenericPage from './GenericPage';
import PricingPage from './PricingPage';
import ProfilePage from './ProfilePage';
import AdUnit from './AdUnit';
import SEO from './SEO';
import { AppView, Tool, NewsArticle, UserProfile } from '../types';
import { intelligentSearch } from '../services/geminiService';
import { usePageTitle } from '../services/usePageTitle';
import { Menu, Search, AlertCircle, Star, Zap, TrendingUp, Layers, Sparkles, Gift, DollarSign, Trophy, Loader2, ArrowLeft, X } from 'lucide-react';
import NewsModal from './NewsModal';
import ToolInsightModal from './ToolInsightModal';

interface ClientLayoutProps {
  user: UserProfile | null;
  tools: Tool[];
  news: NewsArticle[];
  hasApiKey: boolean;
  setHasApiKey: (has: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (isOpen: boolean) => void;
  onLogoutClick: () => void;
  dbError: boolean;
  onUpdateNews?: (id: string, news: NewsArticle) => void;
  onUpdateTool?: (id: string, tool: Tool) => void;
}

// Helper for category colors (shared logic with ToolCard concept)
const getCategoryColorStyles = (category: string, isActive: boolean) => {
  const cat = category.toLowerCase();
  if (cat === 'all') {
      return isActive 
        ? 'bg-zinc-100 text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
        : 'bg-zinc-900 border-transparent text-zinc-400 hover:bg-zinc-800';
  }
  
  if (cat.includes('writing')) {
      return isActive 
        ? 'bg-pink-900/30 border-pink-500 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]' 
        : 'bg-zinc-900 border-transparent text-zinc-400 hover:text-pink-400 hover:bg-pink-900/10 hover:border-pink-500/30';
  }
  if (cat.includes('image')) {
      return isActive 
        ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
        : 'bg-zinc-900 border-transparent text-zinc-400 hover:text-emerald-400 hover:bg-emerald-900/10 hover:border-emerald-500/30';
  }
  if (cat.includes('video')) {
      return isActive 
        ? 'bg-purple-900/30 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
        : 'bg-zinc-900 border-transparent text-zinc-400 hover:text-purple-400 hover:bg-purple-900/10 hover:border-purple-500/30';
  }
  if (cat.includes('audio')) {
      return isActive 
        ? 'bg-orange-900/30 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
        : 'bg-zinc-900 border-transparent text-zinc-400 hover:text-orange-400 hover:bg-orange-900/10 hover:border-orange-500/30';
  }
  if (cat.includes('coding')) {
      return isActive 
        ? 'bg-blue-900/30 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
        : 'bg-zinc-900 border-transparent text-zinc-400 hover:text-blue-400 hover:bg-blue-900/10 hover:border-blue-500/30';
  }
  if (cat.includes('business')) {
      return isActive 
        ? 'bg-amber-900/30 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
        : 'bg-zinc-900 border-transparent text-zinc-400 hover:text-amber-400 hover:bg-amber-900/10 hover:border-amber-500/30';
  }

  // Default
  return isActive 
    ? 'bg-indigo-900/30 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
    : 'bg-zinc-900 border-transparent text-zinc-400 hover:bg-zinc-800';
};

const ClientLayout: React.FC<ClientLayoutProps> = ({
  user, tools, news, hasApiKey, setHasApiKey, 
  setIsAuthModalOpen, onLogoutClick, dbError, onUpdateNews, onUpdateTool
}) => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [preSelectedNewsId, setPreSelectedNewsId] = useState<string | null>(null);
  const [heroToolModal, setHeroToolModal] = useState<Tool | null>(null);
  
  // AI Search State
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<{ toolIds: string[], newsIds: string[] } | null>(null);
  const [selectedNewsResult, setSelectedNewsResult] = useState<NewsArticle | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  
  // Automatically update page title based on current route
  usePageTitle();

  // Deep Link Handling
  useEffect(() => {
    if (location.pathname.startsWith('/news/')) {
        const id = location.pathname.replace('/news/', '');
        if (id) {
            setCurrentView(AppView.LATEST_NEWS);
            setPreSelectedNewsId(id);
        }
    }
  }, [location.pathname]);

  // Sync selected news result when data updates
  useEffect(() => {
      if (selectedNewsResult) {
          const fresh = news.find(n => n.id === selectedNewsResult.id);
          if (fresh && fresh.imageUrl !== selectedNewsResult.imageUrl) {
              setSelectedNewsResult(fresh);
          }
      }
  }, [news, selectedNewsResult]);

  // Dynamic SEO Data Logic
  const getSEOData = () => {
    let title = "VETORRE - AI Tool Directory & Studio";
    let desc = "Discover next-gen AI tools, generate cinematic videos with Veo, and create instant visual courses. The ultimate AI playground powered by Gemini.";
    
    switch(currentView) {
        case AppView.FREE_TOOLS:
            title = "Free AI Tools - VETORRE";
            desc = "Explore the best free and open-source AI tools available today.";
            break;
        case AppView.PAID_TOOLS:
            title = "Premium AI Tools - VETORRE";
            desc = "Professional grade AI software for enterprise and power users.";
            break;
        case AppView.TOP_TOOLS:
            title = "Top Rated AI Tools - VETORRE";
            desc = "The most popular and highly rated AI tools curated for you.";
            break;
        case AppView.LATEST_NEWS:
            title = "Latest AI News - VETORRE";
            desc = "Stay updated with the latest breakthroughs in Artificial Intelligence.";
            break;
        case AppView.SEARCH_RESULTS:
            title = `Search: ${searchTerm} - VETORRE`;
            desc = `AI-powered search results for "${searchTerm}" on VETORRE.`;
            break;
        case AppView.PRICING:
            title = "Pricing - VETORRE";
            break;
        case AppView.PROFILE:
            title = "My Profile - VETORRE";
            break;
    }
    return { title, desc };
  };

  const seoData = getSEOData();

  const handleNavigation = (view: AppView, pageId?: string) => {
      // If Admin is selected, navigate to the admin route
      if (view === AppView.ADMIN) {
          if (user?.role !== 'admin') {
             alert("Access Denied: Admins only.");
             return;
          }
          navigate('/admin');
          return;
      }
      
      setCurrentView(view);
      if (pageId) setCurrentPageId(pageId);
      // Reset filters when changing main views
      if (view === AppView.HOME) {
         setCategoryFilter('All');
      }
      // Reset Search State if moving away
      if (view !== AppView.SEARCH_RESULTS) {
          setSearchTerm('');
          setAiSearchResults(null);
      }
      // Reset deep link state when navigating manually
      setPreSelectedNewsId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleAiSearch = async () => {
      if (!searchTerm.trim()) return;
      
      setIsAiSearching(true);
      setCurrentView(AppView.SEARCH_RESULTS);
      setAiSearchResults(null); // Clear previous
      setShowMobileSearch(false);

      try {
          const results = await intelligentSearch(searchTerm, tools, news);
          setAiSearchResults(results);
      } catch (e) {
          console.error("AI Search failed", e);
      } finally {
          setIsAiSearching(false);
      }
  };

  // --- Automatic Filtering Logic ---
  const getFilteredToolsForView = (view: AppView, baseTools: Tool[]) => {
    // 0. If Search Results View, return only matches
    if (view === AppView.SEARCH_RESULTS) {
        if (!aiSearchResults) return [];
        return baseTools.filter(t => aiSearchResults.toolIds.includes(t.id));
    }

    // 1. First apply Search and Category filters if active (Standard filtering)
    let filtered = baseTools.filter(tool => {
        const toolName = tool.name || '';
        const toolDesc = tool.description || '';
        const toolCat = tool.category || '';
        
        const matchesSearch = toolName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              toolDesc.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || toolCat.toLowerCase().includes(categoryFilter.toLowerCase());
        return matchesSearch && matchesCategory;
     });

    // 2. Apply Page-Specific Logic (Automatic Free/Paid Sorting)
    switch (view) {
        case AppView.FREE_TOOLS:
            return filtered.filter(t => {
                const p = (t.price || '').toLowerCase();
                // Include explicit free types, trials, open source, and "Freemium"
                return p.includes('free') || p.includes('0') || p.includes('trial') || p.includes('open source') || p.includes('waitlist') || p.includes('community') || p.includes('freemium');
            });
        case AppView.PAID_TOOLS:
            return filtered.filter(t => {
                const p = (t.price || '').toLowerCase();
                
                // Indicators of payment
                const hasCurrency = p.includes('$') || p.includes('€') || p.includes('£');
                const hasPaidWords = p.includes('paid') || p.includes('pro') || p.includes('premium') || p.includes('subscription') || p.includes('billing') || p.includes('purchase') || p.includes('enterprise') || p.includes('pricing');
                const isFreemium = p.includes('freemium'); // Freemium implies a paid tier exists, so we include it here too for maximum visibility
                
                // Strictly exclude items that are JUST "free" or "open source" without paid signals
                if (p === 'free' || p === 'open source' || p === 'free trial') return false;

                // Match if currency, paid keywords, freemium, or contains digits (usually price)
                return hasCurrency || hasPaidWords || isFreemium || (p.match(/\d/) && !p.includes('0'));
            });
        case AppView.TOP_TOOLS:
            // For now, "Top" is simulated by tools tagged "Featured" OR randomly picking the first 8 for demo purposes
            // In a real app, this would sort by views/ratings.
            return filtered.filter(t => (t.tags || []).includes('Featured')).length > 0 
                ? filtered.filter(t => (t.tags || []).includes('Featured'))
                : filtered.slice(0, 8); 
        case AppView.HOME:
        default:
            return filtered;
    }
  };

  // Memoize collections for the "Home" dashboard view
  const collections = useMemo(() => {
    const safeTools = tools.filter(t => t && t.price && t.category);
    return {
      featured: safeTools.slice(0, 6),
      free: safeTools.filter(t => (t.price || '').toLowerCase().includes('free') || (t.price || '').toLowerCase().includes('trial')).slice(0, 6),
      creative: safeTools.filter(t => ['Image', 'Video', 'Audio', 'Writing'].includes(t.category)).slice(0, 6),
      productivity: safeTools.filter(t => ['Coding', 'Business', 'Analytics'].includes(t.category)).slice(0, 6)
    };
  }, [tools]);

  // Dynamic Categories from Tools + Defaults
  const categories = useMemo(() => {
      const fixed = ['Writing', 'Image', 'Video', 'Audio', 'Coding', 'Business'];
      const dynamic = tools
        .map(t => t.category)
        .filter(c => c && !fixed.includes(c)); // Get new categories
      
      const uniqueDynamic = Array.from(new Set(dynamic)).sort();
      return ['All', ...fixed, ...uniqueDynamic];
  }, [tools]);
  
  // Logic to determine if we show the full dashboard (collections) or a simple grid
  // We show dashboard only on HOME view when no search/filter is active
  const showHomeDashboard = currentView === AppView.HOME && searchTerm === '' && categoryFilter === 'All';
  
  // Get tools for the current view (Home with filter, Free, Paid, Top)
  const displayedTools = getFilteredToolsForView(currentView, tools);
  
  // Get news for Search Results view
  const searchResultNews = useMemo(() => {
      if (currentView !== AppView.SEARCH_RESULTS || !aiSearchResults) return [];
      return news.filter(n => aiSearchResults.newsIds.includes(n.id));
  }, [news, aiSearchResults, currentView]);

  const CollectionSection = ({ title, icon: Icon, items, colorClass }: { title: string, icon: any, items: Tool[], colorClass: string }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-2">
           <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
             <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
           </div>
           <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {items.map(tool => (
            <ToolCard key={tool.id} tool={tool} user={user} onUpdateTool={onUpdateTool} />
          ))}
        </div>
      </div>
    );
  };

  // Helper to get header info based on view
  const getViewHeader = () => {
      switch(currentView) {
          case AppView.FREE_TOOLS:
              return { title: 'Free AI Tools', desc: 'Powerful tools that won\'t break the bank.', icon: Gift, color: 'text-emerald-400' };
          case AppView.PAID_TOOLS:
              return { title: 'Premium Tools', desc: 'Professional grade AI software for enterprise.', icon: DollarSign, color: 'text-purple-400' };
          case AppView.TOP_TOOLS:
              return { title: 'Top Rated Tools', desc: 'The most popular and highly rated AI tools.', icon: Trophy, color: 'text-amber-400' };
          case AppView.SEARCH_RESULTS:
              return { title: 'Search Results', desc: `AI-powered results for "${searchTerm}"`, icon: Search, color: 'text-white' };
          default:
              return { title: 'AI Tool Directory', desc: 'Discover next-gen tools generated by Gemini.', icon: Sparkles, color: 'text-indigo-400' };
      }
  }

  const headerInfo = getViewHeader();
  const HeaderIcon = headerInfo.icon;

  // Determine which tool to show in Hero
  const featuredTool = useMemo(() => {
      return tools.find(t => t.tags?.includes('Featured')) || tools[0];
  }, [tools]);

  return (
    <div className="flex min-h-screen bg-black text-zinc-100">
      <SEO title={seoData.title} description={seoData.desc} />
      
      <Sidebar 
        currentView={currentView} 
        setView={handleNavigation} 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        user={user}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={onLogoutClick}
      />

      {/* Main Content Wrapper - Ensure margin-left matches fixed sidebar width (w-64 = 16rem) */}
      <div className="flex-1 lg:ml-64 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-black/80 backdrop-blur-xl px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="lg:hidden p-2 text-zinc-400 hover:text-white"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div className="font-bold text-lg lg:hidden bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-purple-500">VETORRE</div>
            </div>

            {/* Desktop Search Bar - Hidden on Mobile */}
            <div className="hidden md:block flex-1 max-w-md mx-4">
                <div className="relative group flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input 
                          type="text" 
                          placeholder="Search AI tools..." 
                          value={searchTerm}
                          onChange={e => {
                              setSearchTerm(e.target.value);
                          }}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAiSearch();
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-12 py-2 text-sm text-zinc-200 focus:bg-zinc-950 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        />
                        <button 
                            onClick={handleAiSearch}
                            disabled={isAiSearching || !searchTerm}
                            className="absolute right-1 top-1 bottom-1 px-2.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-full transition-all disabled:opacity-0"
                            title="Perform Smart AI Search"
                        >
                            {isAiSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {/* Mobile Search Toggle */}
                <button 
                    onClick={() => setShowMobileSearch(!showMobileSearch)}
                    className="md:hidden p-2 text-zinc-400 hover:text-white"
                >
                    <Search className="w-5 h-5" />
                </button>

                <button 
                    onClick={() => handleNavigation(AppView.PRICING)}
                    className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                >
                    <Zap className="w-3 h-3 fill-current" /> Upgrade
                </button>
                {window.aistudio && !hasApiKey && (
                    <button 
                        onClick={async () => {
                            await window.aistudio.openSelectKey();
                            const has = await window.aistudio.hasSelectedApiKey();
                            setHasApiKey(has);
                        }}
                        className="text-xs bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                    >
                        <AlertCircle className="w-3 h-3" /> Connect Key
                    </button>
                )}
            </div>
        </header>

        {/* Mobile Search Overlay Input */}
        {showMobileSearch && (
            <div className="md:hidden p-4 bg-zinc-950 border-b border-zinc-800 animate-in slide-in-from-top-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAiSearch();
                      }}
                      autoFocus
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-10 py-3 text-white focus:border-indigo-500/50 focus:outline-none"
                    />
                    <button onClick={() => setShowMobileSearch(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 scroll-smooth">
          <div className="p-4 lg:p-8 min-h-full flex flex-col">
            {dbError && (
                <div className="bg-emerald-900/20 border border-emerald-800 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-emerald-400 font-bold text-sm">Connect Supabase</h4>
                        <p className="text-emerald-200/70 text-sm mt-1">
                            To save data to the cloud, update <code className="bg-black/30 px-1 rounded">services/supabase.ts</code> with your project credentials.
                            <span className="block mt-1 text-emerald-300 font-medium">Running in offline mode with fallback data.</span>
                        </p>
                    </div>
                </div>
            )}
            
            <div className="flex-1">
              {/* ... (Rest of component render logic mostly unchanged) ... */}
              {/* --- SEARCH RESULTS VIEW --- */}
              {currentView === AppView.SEARCH_RESULTS && (
                   <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in">
                        {/* Search Results Content */}
                        <div className="flex items-center gap-3 border-b border-zinc-800 pb-6">
                            <button onClick={() => handleNavigation(AppView.HOME)} className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                    <Sparkles className="w-8 h-8 text-indigo-500" />
                                    Smart Search
                                </h1>
                                <p className="text-zinc-400">
                                    {isAiSearching 
                                        ? "Analyzing your request..." 
                                        : `Found ${displayedTools.length} tools and ${searchResultNews.length} articles for "${searchTerm}"`
                                    }
                                </p>
                            </div>
                        </div>

                        {isAiSearching ? (
                            <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
                                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                                <p className="text-lg font-medium text-white">Gemini is searching...</p>
                                <p className="text-sm">Understanding intent and matching relevant content.</p>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* Tools Results */}
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-indigo-400" /> Matching Tools
                                    </h2>
                                    {displayedTools.length > 0 ? (
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                                            {displayedTools.map(tool => (
                                                <ToolCard key={tool.id} tool={tool} user={user} onUpdateTool={onUpdateTool} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-zinc-900/30 rounded-xl border border-zinc-800 text-zinc-500 text-center">
                                            No tools found matching your query.
                                        </div>
                                    )}
                                </div>

                                {/* News Results */}
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-purple-400" /> Relevant News
                                    </h2>
                                    {searchResultNews.length > 0 ? (
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                                            {searchResultNews.map(article => (
                                                <div 
                                                    key={article.id} 
                                                    onClick={() => setSelectedNewsResult(article)}
                                                    className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer group"
                                                >
                                                    <div className="aspect-video relative">
                                                        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="text-xs text-purple-400 font-bold uppercase mb-1">{article.category}</div>
                                                        <h3 className="font-bold text-white mb-2 line-clamp-2">{article.title}</h3>
                                                        <p className="text-sm text-zinc-400 line-clamp-2">{article.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-zinc-900/30 rounded-xl border border-zinc-800 text-zinc-500 text-center">
                                            No articles found matching your query.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                   </div>
              )}

              {/* Tool Views (Home, Free, Paid, Top) */}
              {[AppView.HOME, AppView.FREE_TOOLS, AppView.PAID_TOOLS, AppView.TOP_TOOLS].includes(currentView) && (
                <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto">
                  <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-zinc-800 pb-4 md:pb-8 pt-4 md:pt-0">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <HeaderIcon className={`w-8 h-8 ${headerInfo.color}`} />
                        {headerInfo.title}
                      </h1>
                      <p className="text-zinc-400">{headerInfo.desc}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${getCategoryColorStyles(cat, categoryFilter === cat)}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Top Ad Unit - Hidden on Mobile */}
                  <div className="hidden md:block">
                    <AdUnit className="my-4" />
                  </div>

                  {showHomeDashboard ? (
                    <div className="space-y-8 md:space-y-16">
                      {/* Featured Hero Section */}
                      {featuredTool && (
                         <FeaturedHero 
                            tool={featuredTool} 
                            onOpenDetails={() => setHeroToolModal(featuredTool)} 
                         />
                      )}

                      <CollectionSection 
                        title="Top Free & Freemium" 
                        icon={Zap} 
                        items={collections.free} 
                        colorClass="bg-emerald-500 text-emerald-500" 
                      />
                      
                      {/* Mid-content Ad Unit */}
                      <AdUnit format="horizontal" />

                      <CollectionSection 
                        title="Trending Creative Tools" 
                        icon={Sparkles} 
                        items={collections.creative} 
                        colorClass="bg-pink-500 text-pink-500" 
                      />
                       <CollectionSection 
                        title="Productivity & Code" 
                        icon={Layers} 
                        items={collections.productivity} 
                        colorClass="bg-blue-500 text-blue-500" 
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                         <Search className="w-4 h-4 text-indigo-400" />
                         Results ({displayedTools.length})
                       </h2>
                       <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 animate-in fade-in">
                          {displayedTools.map(tool => (
                            <ToolCard key={tool.id} tool={tool} user={user} onUpdateTool={onUpdateTool} />
                          ))}
                          {displayedTools.length === 0 && (
                             <div className="col-span-full py-12 text-center bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                               <p className="text-zinc-400 font-medium">No tools found.</p>
                               <p className="text-zinc-600 text-sm mt-1">Try adjusting your filters or search.</p>
                             </div>
                          )}
                       </div>
                    </div>
                  )}
                </div>
              )}

              {currentView === AppView.LATEST_NEWS && (
                <NewsFeed 
                   articles={news} 
                   initialArticleId={preSelectedNewsId}
                   onUpdateArticle={onUpdateNews}
                />
              )}
              {currentView === AppView.PAGES && (
                <GenericPage pageId={currentPageId} onBack={() => setCurrentView(AppView.HOME)} />
              )}
              
              {currentView === AppView.PRICING && (
                  <PricingPage user={user} onLoginRequest={() => setIsAuthModalOpen(true)} />
              )}

              {currentView === AppView.PROFILE && (
                  <ProfilePage 
                    user={user} 
                    onNavigate={handleNavigation} 
                    onLogout={() => { onLogoutClick(); setCurrentView(AppView.HOME); }} 
                  />
              )}
            </div>

            {/* Bottom Ad Unit before Footer */}
            <div className="mt-12">
               <AdUnit />
            </div>

            <Footer onNavigate={handleNavigation} />
          </div>
        </main>
      </div>
      
      {selectedNewsResult && (
          <NewsModal 
            article={selectedNewsResult} 
            onClose={() => setSelectedNewsResult(null)} 
            onUpdateArticle={onUpdateNews}
          />
      )}

      {/* Hero Tool Details Modal */}
      {heroToolModal && (
          <ToolInsightModal 
             tool={heroToolModal} 
             onClose={() => setHeroToolModal(null)}
             onUpdateTool={onUpdateTool}
          />
      )}
    </div>
  );
};

export default ClientLayout;
