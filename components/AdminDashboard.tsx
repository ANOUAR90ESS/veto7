
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tool, NewsArticle, UserProfile } from '../types';
import { Plus, Rss, Save, Loader2, AlertCircle, Newspaper, Image as ImageIcon, Upload, Wand2, Link, LayoutGrid, Eye, X, Trash2, BarChart3, TrendingUp, PieChart, PenTool, Video, Mic, Code, Briefcase, Check, Sparkles, Pencil, ArrowLeft, CheckCircle, ListTodo, ShieldAlert, Filter, ArrowUpDown, Globe, Database, Copy, BookOpen, GraduationCap, MonitorPlay } from 'lucide-react';
import { extractToolFromRSSItem, extractNewsFromRSSItem, generateImage, analyzeToolTrends, generateDirectoryTools, generateToolDetails, generateDirectoryNews, generateNewsDetails, generateToolSlides, generateToolTutorial, generateFullCourse } from '../services/geminiService';
import { arrayBufferToBase64 } from '../services/audioUtils';
import ToolCard from './ToolCard';
import NewsModal from './NewsModal';
import ToolInsightModal from './ToolInsightModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import DatabaseTab from './admin/tabs/DatabaseTab';
import AnalyzeTab from './admin/tabs/AnalyzeTab';
import ManageTab from './admin/tabs/ManageTab';
import ToolCreateTab from './admin/tabs/ToolCreateTab';

interface AdminDashboardProps {
  tools: Tool[];
  news: NewsArticle[];
  user: UserProfile | null;
  onAddTool: (tool: Tool) => void;
  onUpdateTool: (id: string, tool: Tool) => void;
  onAddNews: (news: NewsArticle) => void;
  onUpdateNews: (id: string, news: NewsArticle) => void;
  onDeleteTool: (id: string) => void;
  onDeleteNews: (id: string) => void;
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    tools, news, user,
    onAddTool, onUpdateTool, 
    onAddNews, onUpdateNews,
    onDeleteTool, onDeleteNews, 
    onBack 
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'create' | 'rss' | 'news' | 'manage' | 'analyze' | 'database'>('create');
  
  // Add noindex meta tag for admin panel
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    
    return () => {
      document.head.removeChild(meta);
    };
  }, []);
  
  // State to track if we are editing an existing item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<{ type: 'tool' | 'news', data: any } | null>(null);

  // Tool Edit State (form state now managed by ToolCreateTab)
  const [editingToolData, setEditingToolData] = useState<Partial<Tool> | undefined>(undefined);

  // News Generator State
  const [newsGenInput, setNewsGenInput] = useState('');
  const [isGenNewsSingle, setIsGenNewsSingle] = useState(false);
  const [isGenNewsBatch, setIsGenNewsBatch] = useState(false);
  const [newsGenCount, setNewsGenCount] = useState(3);
  const [newsReviewQueue, setNewsReviewQueue] = useState<NewsArticle[]>([]);

  // RSS State
  const [rssUrl, setRssUrl] = useState('https://feeds.feedburner.com/TechCrunch/');
  const [rssImportCount, setRssImportCount] = useState(5);
  const [rssItems, setRssItems] = useState<any[]>([]);
  const [fetchingRss, setFetchingRss] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rssError, setRssError] = useState('');

  // News Create State
  const [newNews, setNewNews] = useState<Partial<NewsArticle>>({
    title: '',
    description: '',
    content: '',
    source: '',
    imageUrl: '',
    category: 'Technology'
  });
  const [imageMode, setImageMode] = useState<'url' | 'upload' | 'generate'>('url');
  const [generatingImg, setGeneratingImg] = useState(false);
  const [newsCategories, setNewsCategories] = useState(['Technology', 'Business', 'Innovation', 'Startup', 'Research', 'AI Model']);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Preview State
  const [previewItem, setPreviewItem] = useState<{ type: 'tool' | 'news', data: any } | null>(null);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string, type: 'tool' | 'news' } | null>(null);

  // Tool Categories Definition
  const toolCategories = [
    { id: 'Writing', icon: PenTool, color: 'text-pink-400' },
    { id: 'Image', icon: ImageIcon, color: 'text-emerald-400' },
    { id: 'Video', icon: Video, color: 'text-purple-400' },
    { id: 'Audio', icon: Mic, color: 'text-orange-400' },
    { id: 'Coding', icon: Code, color: 'text-blue-400' },
    { id: 'Business', icon: Briefcase, color: 'text-amber-400' },
  ];

  const sqlSchema = `-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text default 'user' check (role in ('user', 'admin')),
  plan text default 'free',
  subscription_end timestamp with time zone,
  generations_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using ( true );
create policy "Users can insert their own profile." on public.profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on public.profiles for update using ( auth.uid() = id );

-- TOOLS TABLE
create table if not exists public.tools (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  category text,
  tags text[],
  price text,
  image_url text,
  website text,
  features text[],
  use_cases text[],
  pros text[],
  cons text[],
  how_to_use text,
  slides jsonb,
  tutorial jsonb,
  course jsonb
);

alter table public.tools enable row level security;
create policy "Tools are viewable by everyone." on public.tools for select using ( true );
create policy "Admins can insert tools." on public.tools for insert with check ( exists ( select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin' ));
create policy "Admins can update tools." on public.tools for update using ( exists ( select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin' ));
create policy "Admins can delete tools." on public.tools for delete using ( exists ( select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin' ));

-- NEWS TABLE
create table if not exists public.news (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  content text,
  category text,
  source text,
  image_url text,
  date timestamp with time zone default timezone('utc'::text, now())
);

alter table public.news enable row level security;
create policy "News are viewable by everyone." on public.news for select using ( true );
create policy "Admins can insert news." on public.news for insert with check ( exists ( select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin' ));
create policy "Admins can update news." on public.news for update using ( exists ( select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin' ));
create policy "Admins can delete news." on public.news for delete using ( exists ( select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin' ));

-- TRIGGERS & FUNCTIONS
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, role) values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- ATOMIC INCREMENT FUNCTION (Run this!)
create or replace function increment_generations(user_id uuid)
returns void as $$
begin
  update public.profiles
  set generations_count = coalesce(generations_count, 0) + 1
  where id = user_id;
end;
$$ language plpgsql security definer;
`;

  // ... (Rest of AdminDashboard component implementation remains identical) ... 

  // --- Handlers ---
  
  const handleBackToHome = () => {
    navigate('/');
  };

  const resetToolForm = () => {
      setEditingId(null);
      setEditingToolData(undefined);
      setLastSuccess(null);
  };

  const resetNewsForm = () => {
      setNewNews({ title: '', description: '', content: '', source: '', imageUrl: '', category: 'Technology' });
      setImageMode('url');
      setEditingId(null);
      setNewsGenInput('');
  };

  const startEditingTool = (tool: Tool) => {
      setEditingToolData(tool);
      setEditingId(tool.id);
      setActiveTab('create');
      setLastSuccess(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditingNews = (article: NewsArticle) => {
      setNewNews(article);
      setEditingId(article.id);
      setActiveTab('news');
      setLastSuccess(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Tool handlers now in ToolCreateTab component

  // --- News Generation ---
  const handleGenerateNewsCandidates = async () => {
      setIsGenNewsBatch(true);
      try {
          const generatedNews = await generateDirectoryNews(newsGenCount);
          setNewsReviewQueue(prev => [...generatedNews, ...prev]);
          setLastSuccess(null);
      } catch(e: any) {
          alert("Batch news generation failed: " + e.message);
      } finally {
          setIsGenNewsBatch(false);
      }
  };

  const handleGenerateSingleNews = async () => {
      if(!newsGenInput.trim()) return;
      setIsGenNewsSingle(true);
      try {
          const generatedNews = await generateNewsDetails(newsGenInput);
          setNewNews(prev => ({ ...prev, ...generatedNews }));
      } catch(e: any) {
          alert("News generation failed: " + e.message);
      } finally {
          setIsGenNewsSingle(false);
      }
  };
  
  const handlePublishReviewNews = (article: NewsArticle) => {
      onAddNews(article);
      setNewsReviewQueue(prev => prev.filter(n => n.id !== article.id));
      setLastSuccess({ type: 'news', data: article });
  };
  
  const handleEditReviewNews = (article: NewsArticle) => {
      setNewNews(article);
      setNewsReviewQueue(prev => prev.filter(n => n.id !== article.id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleDiscardReviewNews = (id: string) => {
      setNewsReviewQueue(prev => prev.filter(n => n.id !== id));
  };

  const handlePublishAllNews = () => {
      if(confirm(`Publish all ${newsReviewQueue.length} articles?`)) {
          newsReviewQueue.forEach(n => onAddNews(n));
          setNewsReviewQueue([]);
      }
  };

  // handleCreateSubmit moved to ToolCreateTab component

  const handleToolAdded = (tool: Tool) => {
    setLastSuccess({ type: 'tool', data: tool });
    resetToolForm();
  };

  // Re-declare necessary handlers
  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title || !newNews.content) return;

    const article: NewsArticle = {
      id: editingId || newNews.id || '',
      title: newNews.title || "Untitled",
      description: newNews.description || "",
      content: newNews.content || "",
      source: newNews.source || "VETORRE Blog",
      category: newNews.category || "General",
      imageUrl: newNews.imageUrl || `https://picsum.photos/seed/${newNews.title}/800/400`,
      date: new Date().toISOString()
    };

    if (editingId) {
        onUpdateNews(editingId, article);
    } else {
        onAddNews(article);
    }

    setLastSuccess({ type: 'news', data: article });
    resetNewsForm();
  };

  const handleAddNewsCategory = () => {
    if (newCategoryInput && !newsCategories.includes(newCategoryInput)) {
        setNewsCategories(prev => [...prev, newCategoryInput]);
        setNewNews(prev => ({ ...prev, category: newCategoryInput }));
        setNewCategoryInput('');
        setShowAddCategory(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const buffer = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        const mimeType = file.type;
        const dataUrl = `data:${mimeType};base64,${base64}`;
        setNewNews(prev => ({ ...prev, imageUrl: dataUrl }));
      } catch (err) {
        console.error("Error reading file:", err);
      }
    }
  };

  const handleGenerateImage = async () => {
    const title = newNews.title;
    const desc = newNews.description;

    if (!title) {
        alert("Please enter a title first.");
        return;
    }
    setGeneratingImg(true);
    try {
        const prompt = `Editorial illustration for "${title}". ${desc || ''}. High quality, modern style.`;
        const res = await generateImage(prompt, "16:9", "1K");

        let imgData = null;
        for (const part of res.candidates?.[0]?.content?.parts || []) {
           if (part.inlineData) imgData = part.inlineData.data;
        }

        if (imgData) {
            const dataUrl = `data:image/png;base64,${imgData}`;
            setNewNews(prev => ({ ...prev, imageUrl: dataUrl }));
        } else {
            alert("Failed to generate image.");
        }
    } catch (e: any) {
        console.error(e);
        alert("Error generating image: " + e.message);
    } finally {
        setGeneratingImg(false);
    }
  };

  // addTag moved to ToolCreateTab component

  const fetchRSS = async () => {
    setFetchingRss(true);
    setRssError('');
    setRssItems([]);
    
    try {
        let xmlText = '';
        try {
             const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`);
             const data = await res.json();
             if (data.contents) xmlText = data.contents;
        } catch (e) {
            console.warn("CORS fetch failed or invalid URL.");
            throw new Error("Failed to fetch feed.");
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, rssImportCount).map((item, i) => ({
             id: `rss-${i}`,
             title: item.querySelector("title")?.textContent || "",
             description: item.querySelector("description")?.textContent || ""
        }));
        
        setRssItems(items);

    } catch (e: any) {
        setRssError("Failed to fetch feed. ensure URL is valid.");
    } finally {
        setFetchingRss(false);
    }
  };

  const convertRssToTool = async (item: any) => {
    setProcessingId(item.id);
    try {
        const extracted = await extractToolFromRSSItem(item.title, item.description);
        setNewTool({
            name: extracted.name || item.title,
            description: extracted.description || item.description,
            category: extracted.category || 'News',
            price: extracted.price || 'Unknown',
            tags: extracted.tags || ['RSS'],
            website: '#',
            imageUrl: `https://picsum.photos/seed/${extracted.name?.replace(/\s/g,'')}/400/250`
        });
        setActiveTab('create');
        setLastSuccess(null);
    } catch (e) {
        console.error(e);
        alert("Failed to extract tool info.");
    } finally {
        setProcessingId(null);
    }
  };

  const convertRssToNews = async (item: any) => {
    setProcessingId(item.id);
    try {
        const extracted = await extractNewsFromRSSItem(item.title, item.description);
        setNewNews({
            title: extracted.title || item.title,
            description: extracted.description || item.description,
            content: extracted.content || item.description, 
            source: 'RSS Feed',
            imageUrl: extracted.imageUrl || `https://picsum.photos/seed/${(extracted.title || item.title).replace(/\s/g,'')}/800/400`,
            category: 'Tech News'
        });
        setActiveTab('news');
        setLastSuccess(null);
    } catch (e) {
        console.error(e);
        alert("Failed to extract news info.");
    } finally {
        setProcessingId(null);
    }
  };

  const handlePreviewRssNews = async (item: any) => {
    setProcessingId(item.id);
    try {
        const extracted = await extractNewsFromRSSItem(item.title, item.description);
        const article: NewsArticle = {
            id: `preview-${item.id}`,
            title: extracted.title || item.title,
            description: extracted.description || item.description,
            content: extracted.content || item.description, 
            source: 'RSS Feed',
            imageUrl: extracted.imageUrl || `https://picsum.photos/seed/${(extracted.title || item.title).replace(/\s/g,'')}/800/400`,
            category: extracted.category || 'Tech News',
            date: new Date().toISOString()
        };
        setPreviewItem({ type: 'news', data: article });
    } catch (e: any) {
        console.error(e);
        alert("Failed to generate preview: " + e.message);
    } finally {
        setProcessingId(null);
    }
  };

  const handlePreview = (type: 'tool' | 'news', data?: any) => {
      const itemToPreview = data || (type === 'tool' ? {
        ...newTool,
        id: 'preview',
        imageUrl: newTool.imageUrl || `https://picsum.photos/seed/${newTool.name || 'preview'}/400/250`,
      } : {
        ...newNews,
        id: 'preview',
        imageUrl: newNews.imageUrl || `https://picsum.photos/seed/${newNews.title || 'preview'}/800/400`,
        date: new Date().toISOString()
      });

      setPreviewItem({ type, data: itemToPreview });
  };
  
  const initiateDeleteTool = (tool: Tool) => {
      setDeleteTarget({ id: tool.id, name: tool.name, type: 'tool' });
  };

  const initiateDeleteNews = (article: NewsArticle) => {
      setDeleteTarget({ id: article.id, name: article.title, type: 'news' });
  };

  const handleConfirmDelete = () => {
      if (!deleteTarget) return;
      if (deleteTarget.type === 'tool') {
          onDeleteTool(deleteTarget.id);
      } else {
          onDeleteNews(deleteTarget.id);
      }
      setDeleteTarget(null);
  };

  const handlePreviewUpdate = (id: string, article: NewsArticle) => {
      setPreviewItem({ type: 'news', data: article });
      if (editingId) {
          setNewNews(article);
      }
  };

  if (!user || user.role !== 'admin') {
      return (
          <div className="max-w-4xl mx-auto p-12 text-center">
              <div className="bg-red-900/20 border border-red-900/50 p-8 rounded-2xl inline-block max-w-md">
                 <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                 <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                 <p className="text-zinc-400 mb-6">
                     You do not have permission to view the Admin Dashboard. Please log in with an administrator account.
                 </p>
                 <button onClick={handleBackToHome} className="bg-zinc-800 text-white px-6 py-2 rounded-lg hover:bg-zinc-700">
                     Back to Home
                 </button>
              </div>
          </div>
      );
  }

  const ImageInputSection = () => {
    const imageUrl = newNews.imageUrl;

    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <div className="flex gap-4 mb-4 border-b border-zinc-800 pb-2">
                <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${imageMode === 'url' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Link className="w-4 h-4" /> Image URL
                </button>
                <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${imageMode === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Upload className="w-4 h-4" /> Upload
                </button>
                <button
                    type="button"
                    onClick={() => setImageMode('generate')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${imageMode === 'generate' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Wand2 className="w-4 h-4" /> Generate with AI
                </button>
            </div>

            {imageMode === 'url' && (
                <input
                value={imageUrl}
                onChange={e => setNewNews(p => ({...p, imageUrl: e.target.value}))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                placeholder="https://..."
                />
            )}

            {imageMode === 'upload' && (
                <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                title="Upload image file"
                aria-label="Image file upload"
                />
            )}

            {imageMode === 'generate' && (
                <div className="flex gap-2 items-center">
                    <div className="text-sm text-zinc-400 italic flex-1">
                        Uses <strong>Gemini 3 Pro</strong> to create an image based on the content.
                    </div>
                    <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={generatingImg}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {generatingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        Generate Image
                    </button>
                </div>
            )}

            {imageUrl && (
                <div className="mt-4 relative rounded-lg overflow-hidden border border-zinc-700 h-48 w-full">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">Preview</div>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
       {/* ... Header and Tabs ... */}
       {/* (Existing implementation of header and tabs) */}
       <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <button 
                onClick={handleBackToHome}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-full transition-colors border border-zinc-700"
                title="Back to Directory"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-3xl font-bold text-white">Admin Dashboard</h2>
         </div>
         
         <div className="bg-zinc-900 rounded-lg p-1 border border-zinc-800 flex overflow-x-auto max-w-full scrollbar-hide">
            <button 
              onClick={() => { setActiveTab('create'); setEditingId(null); setLastSuccess(null); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'create' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Plus className="w-4 h-4 inline mr-2" /> {editingId ? 'Edit Tool' : 'Create'}
            </button>
            {/* ... other buttons ... */}
            <button 
              onClick={() => { setActiveTab('news'); setEditingId(null); setLastSuccess(null); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'news' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Newspaper className="w-4 h-4 inline mr-2" /> {editingId ? 'Edit News' : 'News'}
            </button>
            <button 
              onClick={() => setActiveTab('rss')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'rss' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Rss className="w-4 h-4 inline mr-2" /> Import
            </button>
            <button 
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'manage' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4 inline mr-2" /> Manage
            </button>
            <button 
              onClick={() => setActiveTab('analyze')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'analyze' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" /> Analyze
            </button>
            <button 
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'database' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Database className="w-4 h-4 inline mr-2" /> Database
            </button>
         </div>
       </div>

       {/* ... Success Banner ... */}
       {lastSuccess && (
            <div className="bg-emerald-900/20 border border-emerald-800 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h4 className="text-emerald-400 font-bold text-sm">Successfully Published</h4>
                        <p className="text-emerald-200/70 text-xs">
                           {lastSuccess.type === 'tool' ? lastSuccess.data.name : lastSuccess.data.title}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => handlePreview(lastSuccess.type, lastSuccess.data)}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1 bg-emerald-900/30 px-3 py-1.5 rounded-lg hover:bg-emerald-900/50 transition-colors"
                    >
                        <Eye className="w-4 h-4" /> Preview
                    </button>
                     <button 
                        onClick={() => lastSuccess.type === 'tool' ? startEditingTool(lastSuccess.data) : startEditingNews(lastSuccess.data)}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1 bg-emerald-900/30 px-3 py-1.5 rounded-lg hover:bg-emerald-900/50 transition-colors"
                    >
                        <Pencil className="w-4 h-4" /> Edit Again
                    </button>
                </div>
            </div>
        )}

       {/* Tabs Implementation */}
       {activeTab === 'create' && (
         <ToolCreateTab
           editingId={editingId}
           onAddTool={(tool) => {
             onAddTool(tool);
             handleToolAdded(tool);
           }}
           onUpdateTool={(id, tool) => {
             onUpdateTool(id, tool);
             handleToolAdded(tool);
           }}
           onCancel={resetToolForm}
           onPreview={handlePreview}
           initialTool={editingToolData}
         />
       )}

       {/* (RSS and News tabs content preserved) */}
       {activeTab === 'rss' && (
         <div className="space-y-6 animate-in fade-in duration-300">
            {/* RSS Content... */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
               <h3 className="text-lg font-medium text-white mb-4">Import Tools from RSS</h3>
               <label className="block text-sm text-zinc-400 mb-1">RSS Feed URL</label>
               <div className="flex gap-2">
                  <input 
                    value={rssUrl} 
                    onChange={e => setRssUrl(e.target.value)} 
                    placeholder="https://example.com/rss.xml"
                    title="RSS feed URL"
                    aria-label="RSS feed URL"
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
                  />
                  <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    value={rssImportCount}
                    title="Number of items to import (1-50)"
                    aria-label="Number of items to import"
                    onChange={(e) => setRssImportCount(Math.min(50, Math.max(1, parseInt(e.target.value))))}
                    className="w-16 bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center"
                  />
                  <button 
                    onClick={fetchRSS} 
                    disabled={fetchingRss}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded font-medium disabled:opacity-50"
                  >
                    {fetchingRss ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch Feed'}
                  </button>
               </div>
               {rssError && (
                 <div className="mt-2 text-red-400 text-sm flex items-center gap-1">
                   <AlertCircle className="w-3 h-3" /> {rssError}
                 </div>
               )}
            </div>
            {/* ... RSS List ... */}
            <div className="grid gap-4">
               {rssItems.length > 0 && <h3 className="text-white font-semibold">Feed Items ({rssItems.length})</h3>}
               {rssItems.map(item => (
                 <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex-1">
                       <h4 className="text-lg font-bold text-white mb-1">{item.title}</h4>
                       <p className="text-sm text-zinc-400 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                        <button 
                            onClick={() => handlePreviewRssNews(item)}
                            disabled={!!processingId}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors border border-zinc-700"
                        >
                            {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                            Preview News
                        </button>
                        <button 
                            onClick={() => convertRssToTool(item)}
                            disabled={!!processingId}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                        >
                            {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LayoutGrid className="w-3 h-3" />}
                            Edit as Tool
                        </button>
                        <button 
                            onClick={() => convertRssToNews(item)}
                            disabled={!!processingId}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                        >
                            {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Newspaper className="w-3 h-3" />}
                            Edit as News
                        </button>
                    </div>
                 </div>
               ))}
            </div>
         </div>
       )}

       {activeTab === 'news' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             {/* News Generation UI... */}
             {!editingId && (
                <div className="space-y-6">
                   <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <Globe className="w-5 h-5 text-purple-400" />
                                Find Real Trending News
                            </h3>
                            <p className="text-sm text-zinc-400 mt-1">
                                AI will Search the web for current events and generate reports.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <input 
                                type="number" 
                                min="1" 
                                max="50" 
                                value={newsGenCount}
                                onChange={(e) => setNewsGenCount(Math.min(50, Math.max(1, parseInt(e.target.value))))}
                                className="w-16 bg-black/40 border border-purple-500/30 rounded-lg px-2 py-2 text-white text-center text-sm focus:outline-none focus:border-purple-500"
                                title="Number of articles to generate (1-50)"
                            />
                            <button
                                onClick={handleGenerateNewsCandidates}
                                disabled={isGenNewsBatch}
                                className="shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {isGenNewsBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                <span>Find News</span>
                            </button>
                        </div>
                   </div>

                   <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-xl p-6">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                                <Newspaper className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">AI News Reporter</h3>
                                <p className="text-xs text-purple-200/70">Enter a real topic, and AI will research (Google Search) and write a factual story.</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <input 
                                value={newsGenInput}
                                onChange={(e) => setNewsGenInput(e.target.value)}
                                placeholder="e.g., Apple vision pro release, SpaceX mission..."
                                className="flex-1 bg-black/40 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerateSingleNews()}
                            />
                            <button 
                                onClick={handleGenerateSingleNews}
                                disabled={isGenNewsSingle || !newsGenInput}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-6 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                            >
                                {isGenNewsSingle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                Write
                            </button>
                         </div>
                    </div>
                </div>
             )}

            <div className={`bg-zinc-900/50 border rounded-xl p-6 ${editingId ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' : 'border-zinc-800'}`}>
             {/* News Edit Form */}
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-medium text-white">
                     {editingId ? 'Edit News Article' : 'Publish News Article Manually'}
                 </h3>
                 {editingId && (
                     <button onClick={resetNewsForm} className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1">
                         <ArrowLeft className="w-4 h-4" /> Cancel Edit
                     </button>
                 )}
             </div>

             <form onSubmit={handleNewsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Article Title</label>
                        <input required value={newNews.title} onChange={e => setNewNews({...newNews, title: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-purple-500 outline-none" placeholder="e.g. Gemini 2.5 Released" />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Category</label>
                        <div className="flex gap-2">
                           {showAddCategory ? (
                               <div className="flex-1 flex gap-2">
                                  <input 
                                    value={newCategoryInput} 
                                    onChange={e => setNewCategoryInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddNewsCategory())}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-purple-500 outline-none" 
                                    placeholder="New Category Name"
                                    autoFocus
                                  />
                                  <button type="button" onClick={handleAddNewsCategory} className="bg-purple-600 text-white px-3 rounded hover:bg-purple-500" title="Confirm category" aria-label="Confirm category"><Check className="w-4 h-4" /></button>
                                  <button type="button" onClick={() => setShowAddCategory(false)} className="bg-zinc-800 text-zinc-400 px-3 rounded hover:bg-zinc-700" title="Cancel" aria-label="Cancel"><X className="w-4 h-4" /></button>
                               </div>
                           ) : (
                               <>
                                   <select 
                                     value={newNews.category} 
                                     onChange={e => setNewNews({...newNews, category: e.target.value})} 
                                     title="Select news category"
                                     aria-label="News category"
                                     className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-purple-500 outline-none"
                                   >
                                       {newsCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                   </select>
                                   <button 
                                      type="button" 
                                      onClick={() => setShowAddCategory(true)}
                                      className="shrink-0 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 px-3 rounded"
                                      title="Add New Category"
                                   >
                                       <Plus className="w-4 h-4" />
                                   </button>
                               </>
                           )}
                        </div>
                    </div>
                </div>
                <div>
                   <label className="block text-sm text-zinc-400 mb-1">Short Description</label>
                   <textarea required value={newNews.description} onChange={e => setNewNews({...newNews, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white h-20 focus:border-purple-500 outline-none" placeholder="A brief summary for the card view..." />
                </div>
                <div>
                   <label className="block text-sm text-zinc-400 mb-1">Full Content</label>
                   <textarea required value={newNews.content} onChange={e => setNewNews({...newNews, content: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white h-48 focus:border-purple-500 outline-none" placeholder="The full article content goes here..." />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                   <div>
                     <label className="block text-sm text-zinc-400 mb-2">Featured Image</label>
                     <ImageInputSection isTool={false} />
                   </div>
                   <div>
                     <label className="block text-sm text-zinc-400 mb-1">Source / Author</label>
                     <input value={newNews.source} onChange={e => setNewNews({...newNews, source: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-purple-500 outline-none" placeholder="e.g. TechCrunch" />
                   </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => handlePreview('news')} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-zinc-700">
                        <Eye className="w-4 h-4" /> Preview
                    </button>
                    <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> {editingId ? 'Update Article' : 'Publish Article'}
                    </button>
                </div>
             </form>
          </div>
          </div>
       )}

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <ManageTab
          tools={tools}
          news={news}
          toolCategories={toolCategories}
          newsCategories={newsCategories}
          onEditTool={startEditingTool}
          onEditNews={startEditingNews}
          onDeleteTool={initiateDeleteTool}
          onDeleteNews={initiateDeleteNews}
        />
      )}

      {/* Analyze Tab */}
      {activeTab === 'analyze' && <AnalyzeTab tools={tools} news={news} />}

      {/* Database Tab */}
      {activeTab === 'database' && <DatabaseTab sqlSchema={sqlSchema} />}

      {/* Modals */}
      {deleteTarget && (
        <DeleteConfirmationModal 
           isOpen={!!deleteTarget}
           onClose={() => setDeleteTarget(null)}
           onConfirm={handleConfirmDelete}
           itemName={deleteTarget.name}
           itemType={deleteTarget.type}
        />
      )}
      
      {previewItem && previewItem.type === 'news' && (
          <NewsModal 
             article={previewItem.data} 
             onClose={() => setPreviewItem(null)}
             onUpdateArticle={handlePreviewUpdate}
          />
      )}

      {previewItem && previewItem.type === 'tool' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewItem(null)}>
              <div className="max-w-md w-full" onClick={e => e.stopPropagation()}>
                 <ToolCard tool={previewItem.data} user={user} />
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;
