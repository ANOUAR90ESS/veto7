
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tool, NewsArticle, UserProfile } from '../types';
import { Plus, Rss, Save, Loader2, AlertCircle, Newspaper, Image as ImageIcon, Upload, Wand2, Link, LayoutGrid, Eye, X, Trash2, BarChart3, TrendingUp, PieChart, PenTool, Video, Mic, Code, Briefcase, Check, Sparkles, Pencil, ArrowLeft, CheckCircle, ListTodo, ShieldAlert, Filter, ArrowUpDown, Globe, Database, Copy, BookOpen, GraduationCap, MonitorPlay } from 'lucide-react';
import { extractToolFromRSSItem, extractNewsFromRSSItem, generateImage, analyzeToolTrends, generateDirectoryTools, generateToolDetails, generateDirectoryNews, generateNewsDetails, generateToolSlides, generateToolTutorial, generateFullCourse } from '../services/geminiService';
import { arrayBufferToBase64 } from '../services/audioUtils';
import ToolCard from './ToolCard';
import NewsModal from './NewsModal';
import ToolInsightModal from './ToolInsightModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

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
  
  // State to track if we are editing an existing item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<{ type: 'tool' | 'news', data: any } | null>(null);

  // Tool Create State
  const [newTool, setNewTool] = useState<Partial<Tool>>({
    name: '',
    description: '',
    category: 'Writing',
    price: 'Freemium',
    website: 'https://',
    tags: [],
    features: [],
    useCases: [],
    pros: [],
    cons: [],
    howToUse: '',
    slides: [],
    tutorial: [],
    course: undefined
  });
  const [tagInput, setTagInput] = useState('');
  
  // Premium Content Generation State
  const [generatingSlides, setGeneratingSlides] = useState(false);
  const [generatingTutorial, setGeneratingTutorial] = useState(false);
  const [generatingCourse, setGeneratingCourse] = useState(false);
  
  // Tool Generator State
  const [toolGenInput, setToolGenInput] = useState('');
  const [isGenToolSingle, setIsGenToolSingle] = useState(false);
  const [isGenToolBatch, setIsGenToolBatch] = useState(false);
  const [toolGenCount, setToolGenCount] = useState(3);
  const [toolReviewQueue, setToolReviewQueue] = useState<Tool[]>([]);

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

  // Analysis State
  const [analysisReport, setAnalysisReport] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Manage State
  const [manageTab, setManageTab] = useState<'tools' | 'news'>('tools');
  const [manageToolCategory, setManageToolCategory] = useState('All');
  const [manageNewsCategory, setManageNewsCategory] = useState('All');
  const [manageNewsSort, setManageNewsSort] = useState<'newest' | 'oldest'>('newest');
  
  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string, type: 'tool' | 'news' } | null>(null);

  // Schema Copy State
  const [copiedSchema, setCopiedSchema] = useState(false);

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
  
  // --- Helpers for Manage Filters ---
  const uniqueToolCategories = Array.from(new Set([...toolCategories.map(c => c.id), ...tools.map(t => t.category)])).sort();
  const filteredManageTools = tools.filter(t => manageToolCategory === 'All' || t.category === manageToolCategory);

  const uniqueNewsCategories = Array.from(new Set([...newsCategories, ...news.map(n => n.category)])).sort();
  const filteredManageNews = news
    .filter(n => manageNewsCategory === 'All' || n.category === manageNewsCategory)
    .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return manageNewsSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // --- Handlers ---
  
  const handleBackToHome = () => {
    navigate('/');
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const resetToolForm = () => {
      setNewTool({ name: '', description: '', category: 'Writing', price: 'Freemium', website: 'https://', tags: [], features: [], useCases: [], pros: [], cons: [], howToUse: '', slides: [], tutorial: [], course: undefined });
      setEditingId(null);
      setToolGenInput('');
  };

  const resetNewsForm = () => {
      setNewNews({ title: '', description: '', content: '', source: '', imageUrl: '', category: 'Technology' });
      setImageMode('url');
      setEditingId(null);
      setNewsGenInput('');
  };

  const startEditingTool = (tool: Tool) => {
      setNewTool(tool);
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

  // --- Tool Generation ---
  const handleGenerateToolCandidates = async () => {
    setIsGenToolBatch(true);
    try {
        const generatedTools = await generateDirectoryTools(toolGenCount);
        setToolReviewQueue(prev => [...generatedTools, ...prev]);
        setLastSuccess(null);
    } catch(e: any) {
        alert("Batch generation failed: " + e.message);
    } finally {
        setIsGenToolBatch(false);
    }
  };

  const handleGenerateSingleTool = async () => {
      if (!toolGenInput.trim()) return;
      setIsGenToolSingle(true);
      try {
          const generatedTool = await generateToolDetails(toolGenInput);
          setNewTool(prev => ({ ...prev, ...generatedTool }));
      } catch (e: any) {
          alert("Generation failed: " + e.message);
      } finally {
          setIsGenToolSingle(false);
      }
  };

  // --- Premium Content Generation Handlers ---
  const handleGenerateSlides = async () => {
      if (!newTool.name || !newTool.description) {
          alert("Please enter a name and description first.");
          return;
      }
      setGeneratingSlides(true);
      try {
          const slides = await generateToolSlides(newTool as Tool);
          setNewTool(prev => ({ ...prev, slides }));
      } catch(e: any) {
          alert("Failed to generate slides: " + e.message);
      } finally {
          setGeneratingSlides(false);
      }
  };

  const handleGenerateTutorial = async () => {
      if (!newTool.name) return;
      setGeneratingTutorial(true);
      try {
          const tutorial = await generateToolTutorial(newTool as Tool);
          setNewTool(prev => ({ ...prev, tutorial }));
      } catch(e: any) {
          alert("Failed to generate tutorial: " + e.message);
      } finally {
          setGeneratingTutorial(false);
      }
  };

  const handleGenerateCourse = async () => {
      if (!newTool.name) return;
      setGeneratingCourse(true);
      try {
          const course = await generateFullCourse(newTool as Tool);
          setNewTool(prev => ({ ...prev, course }));
      } catch(e: any) {
          alert("Failed to generate course: " + e.message);
      } finally {
          setGeneratingCourse(false);
      }
  };

  const handlePublishReviewTool = (tool: Tool) => {
      onAddTool(tool);
      setToolReviewQueue(prev => prev.filter(t => t.id !== tool.id));
      setLastSuccess({ type: 'tool', data: tool });
  };

  const handleEditReviewTool = (tool: Tool) => {
      setNewTool(tool);
      setToolReviewQueue(prev => prev.filter(t => t.id !== tool.id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDiscardReviewTool = (id: string) => {
      setToolReviewQueue(prev => prev.filter(t => t.id !== id));
  };
  
  const handlePublishAllTools = () => {
      if(confirm(`Publish all ${toolReviewQueue.length} tools?`)) {
          toolReviewQueue.forEach(t => onAddTool(t));
          setToolReviewQueue([]);
      }
  };

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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTool.name || !newTool.description) return;

    const tool: Tool = {
      id: editingId || newTool.id || '', 
      name: newTool.name,
      description: newTool.description,
      category: newTool.category || 'Uncategorized',
      price: newTool.price || 'Free',
      tags: newTool.tags || [],
      website: newTool.website || '#',
      imageUrl: newTool.imageUrl || `https://picsum.photos/seed/${newTool.name}/400/250`,
      features: newTool.features || [],
      useCases: newTool.useCases || [],
      pros: newTool.pros || [],
      cons: newTool.cons || [],
      howToUse: newTool.howToUse || '',
      slides: newTool.slides,
      tutorial: newTool.tutorial,
      course: newTool.course
    };

    if (editingId) {
        onUpdateTool(editingId, tool);
    } else {
        onAddTool(tool);
    }
    
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isTool: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const buffer = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        const mimeType = file.type;
        const dataUrl = `data:${mimeType};base64,${base64}`;
        if (isTool) {
            setNewTool(prev => ({ ...prev, imageUrl: dataUrl }));
        } else {
            setNewNews(prev => ({ ...prev, imageUrl: dataUrl }));
        }
      } catch (err) {
        console.error("Error reading file:", err);
      }
    }
  };

  const handleGenerateImage = async (isTool: boolean) => {
    const title = isTool ? newTool.name : newNews.title;
    const desc = isTool ? newTool.description : newNews.description;
    
    if (!title) {
        alert("Please enter a title/name first.");
        return;
    }
    setGeneratingImg(true);
    try {
        const prompt = `Editorial illustration for "${title}". ${desc || ''}. High quality, modern style.`;
        const res = await generateImage(prompt, isTool ? "16:9" : "16:9", "1K");
        
        let imgData = null;
        for (const part of res.candidates?.[0]?.content?.parts || []) {
           if (part.inlineData) imgData = part.inlineData.data;
        }
        
        if (imgData) {
            const dataUrl = `data:image/png;base64,${imgData}`;
            if (isTool) {
                setNewTool(prev => ({ ...prev, imageUrl: dataUrl }));
            } else {
                setNewNews(prev => ({ ...prev, imageUrl: dataUrl }));
            }
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

  const addTag = () => {
    if (tagInput.trim()) {
      setNewTool(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
      setTagInput('');
    }
  };

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

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisReport('');
    try {
      const report = await analyzeToolTrends(tools);
      setAnalysisReport(report);
    } catch (e: any) {
      setAnalysisReport('Error generating report: ' + e.message);
    } finally {
      setAnalyzing(false);
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

  const categoryCounts = tools.reduce((acc, tool) => {
    acc[tool.category] = (acc[tool.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

  const ImageInputSection = ({ isTool }: { isTool: boolean }) => {
    const imageUrl = isTool ? newTool.imageUrl : newNews.imageUrl;

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
                onChange={e => isTool ? setNewTool(p => ({...p, imageUrl: e.target.value})) : setNewNews(p => ({...p, imageUrl: e.target.value}))} 
                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white" 
                placeholder="https://..." 
                />
            )}

            {imageMode === 'upload' && (
                <input 
                type="file"
                accept="image/*"
                onChange={e => handleFileUpload(e, isTool)} 
                className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer" 
                />
            )}

            {imageMode === 'generate' && (
                <div className="flex gap-2 items-center">
                    <div className="text-sm text-zinc-400 italic flex-1">
                        Uses <strong>Gemini 3 Pro</strong> to create an image based on the content.
                    </div>
                    <button 
                        type="button" 
                        onClick={() => handleGenerateImage(isTool)}
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
         <div className="space-y-6 animate-in fade-in duration-300">
            {!editingId && (
                <div className="space-y-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* ... Generator Blocks ... */}
                        <div>
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <Globe className="w-5 h-5 text-indigo-400" />
                                Search & Generate REAL Tools
                            </h3>
                            <p className="text-sm text-zinc-400 mt-1">
                                Uses <strong>Gemini 2.5 Flash</strong> + <strong>Google Search</strong> to find current trending tools.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <input 
                                type="number" 
                                min="1" 
                                max="50" 
                                value={toolGenCount}
                                onChange={(e) => setToolGenCount(Math.min(50, Math.max(1, parseInt(e.target.value))))}
                                className="w-16 bg-black/40 border border-indigo-500/30 rounded-lg px-2 py-2 text-white text-center text-sm focus:outline-none focus:border-indigo-500"
                                title="Number of tools to generate (1-50)"
                            />
                            <button
                                onClick={handleGenerateToolCandidates}
                                disabled={isGenToolBatch}
                                className="shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {isGenToolBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                <span>Find Trending Tools</span>
                            </button>
                        </div>
                    </div>
                    {/* ... (Single tool generation block) ... */}
                    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-xl p-6">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Specific Tool Researcher</h3>
                                <p className="text-xs text-indigo-200/70">Enter a real tool name (e.g. "Claude 3.5") to fetch live specs and details.</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <input 
                                value={toolGenInput}
                                onChange={(e) => setToolGenInput(e.target.value)}
                                placeholder="e.g., ChatGPT, Midjourney, Claude..."
                                className="flex-1 bg-black/40 border border-indigo-500/30 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerateSingleTool()}
                            />
                            <button 
                                onClick={handleGenerateSingleTool}
                                disabled={isGenToolSingle || !toolGenInput}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-6 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                            >
                                {isGenToolSingle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                Research
                            </button>
                         </div>
                    </div>
                    {/* Tool Review Queue */}
                    {toolReviewQueue.length > 0 && (
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-white font-semibold flex items-center gap-2">
                                    <ListTodo className="w-5 h-5 text-orange-400" />
                                    Review Queue ({toolReviewQueue.length})
                                </h4>
                                <button 
                                    onClick={handlePublishAllTools}
                                    className="text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                >
                                    Publish All
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {toolReviewQueue.map((tool) => (
                                    <div key={tool.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex flex-col gap-3">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h5 className="text-white font-bold">{tool.name}</h5>
                                                <span className="text-[10px] uppercase bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{tool.category}</span>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <img src={tool.imageUrl} className="w-16 h-10 object-cover rounded bg-zinc-800" />
                                                <p className="text-xs text-zinc-500 line-clamp-2">{tool.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2 border-t border-zinc-800">
                                            <button 
                                                onClick={() => handlePublishReviewTool(tool)}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-xs font-medium"
                                            >
                                                Publish
                                            </button>
                                            <button 
                                                onClick={() => handleEditReviewTool(tool)}
                                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded text-xs font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDiscardReviewTool(tool.id)}
                                                className="flex-1 bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 py-1.5 rounded text-xs font-medium"
                                            >
                                                Discard
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            <div className={`bg-zinc-900/50 border rounded-xl p-6 ${editingId ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'border-zinc-800'}`}>
                {/* Form Content */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">
                        {editingId ? 'Edit Tool' : 'Add New Tool Manually'}
                    </h3>
                    {editingId && (
                        <button onClick={resetToolForm} className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Cancel Edit
                        </button>
                    )}
                </div>
                
                <form onSubmit={handleCreateSubmit} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Tool Name</label>
                            <input required value={newTool.name} onChange={e => setNewTool({...newTool, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-indigo-500 outline-none" placeholder="e.g. Gemini Code Assist" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Category</label>
                            <div className="grid grid-cols-3 gap-2">
                            {toolCategories.map(cat => (
                                <button
                                key={cat.id}
                                type="button"
                                onClick={() => setNewTool({...newTool, category: cat.id})}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                                    newTool.category === cat.id 
                                    ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:border-zinc-700'
                                }`}
                                >
                                <cat.icon className={`w-5 h-5 mb-1 ${newTool.category === cat.id ? 'text-white' : cat.color}`} />
                                <span className="text-[10px] uppercase font-semibold">{cat.id}</span>
                                </button>
                            ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Description</label>
                        <textarea required value={newTool.description} onChange={e => setNewTool({...newTool, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white h-24 focus:border-indigo-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Price</label>
                            <input value={newTool.price} onChange={e => setNewTool({...newTool, price: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Website URL</label>
                            <input value={newTool.website} onChange={e => setNewTool({...newTool, website: e.target.value})} className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Tags (press enter)</label>
                        <div className="flex gap-2 mb-2 flex-wrap">
                            {newTool.tags?.map(t => <span key={t} className="bg-indigo-900 text-indigo-200 px-2 py-1 rounded text-xs">{t}</span>)}
                        </div>
                        <input 
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag();
                            }
                        }}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-indigo-500 outline-none" 
                        placeholder="Type and press Enter..."
                        />
                    </div>
                    <div>
                         <label className="block text-sm text-zinc-400 mb-2">Featured Image</label>
                         <ImageInputSection isTool={true} />
                    </div>

                    <div className="border-t border-zinc-800 pt-6 mt-6">
                        <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" /> Premium Content
                        </h4>
                        <div className="space-y-6">
                            {/* Slides Editor */}
                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-3">
                                    <h5 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                                        <MonitorPlay className="w-4 h-4" /> Explainer Slides
                                    </h5>
                                    <div className="flex gap-2">
                                        <button 
                                            type="button" 
                                            onClick={handleGenerateSlides}
                                            disabled={generatingSlides}
                                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {generatingSlides ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Auto-Generate'}
                                        </button>
                                        <button type="button" onClick={() => setNewTool(prev => ({...prev, slides: []}))} className="text-xs text-zinc-500 hover:text-red-400">Clear</button>
                                    </div>
                                </div>
                                <textarea 
                                    className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-400 focus:outline-none focus:border-indigo-500/50"
                                    placeholder="[]"
                                    value={JSON.stringify(newTool.slides, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            setNewTool(prev => ({ ...prev, slides: JSON.parse(e.target.value) }));
                                        } catch(e) {}
                                    }}
                                />
                            </div>

                            {/* Tutorial Editor */}
                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-3">
                                    <h5 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" /> Visual Tutorial
                                    </h5>
                                    <div className="flex gap-2">
                                        <button 
                                            type="button" 
                                            onClick={handleGenerateTutorial}
                                            disabled={generatingTutorial}
                                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {generatingTutorial ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Auto-Generate'}
                                        </button>
                                        <button type="button" onClick={() => setNewTool(prev => ({...prev, tutorial: []}))} className="text-xs text-zinc-500 hover:text-red-400">Clear</button>
                                    </div>
                                </div>
                                <textarea 
                                    className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-400 focus:outline-none focus:border-indigo-500/50"
                                    placeholder="[]"
                                    value={JSON.stringify(newTool.tutorial, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            setNewTool(prev => ({ ...prev, tutorial: JSON.parse(e.target.value) }));
                                        } catch(e) {}
                                    }}
                                />
                            </div>

                            {/* Course Editor */}
                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-3">
                                    <h5 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" /> Full Course
                                    </h5>
                                    <div className="flex gap-2">
                                        <button 
                                            type="button" 
                                            onClick={handleGenerateCourse}
                                            disabled={generatingCourse}
                                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {generatingCourse ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Auto-Generate'}
                                        </button>
                                        <button type="button" onClick={() => setNewTool(prev => ({...prev, course: undefined}))} className="text-xs text-zinc-500 hover:text-red-400">Clear</button>
                                    </div>
                                </div>
                                <textarea 
                                    className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-400 focus:outline-none focus:border-indigo-500/50"
                                    placeholder="null"
                                    value={newTool.course ? JSON.stringify(newTool.course, null, 2) : ''}
                                    onChange={(e) => {
                                        try {
                                            setNewTool(prev => ({ ...prev, course: JSON.parse(e.target.value) }));
                                        } catch(e) {}
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => handlePreview('tool')} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-zinc-700">
                                <Eye className="w-4 h-4" /> Preview
                            </button>
                            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                                <Save className="w-4 h-4" /> {editingId ? 'Update Tool' : 'Save Tool'}
                            </button>
                    </div>
                </form>
            </div>
         </div>
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
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded p-2 text-white"
                  />
                  <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    value={rssImportCount}
                    onChange={(e) => setRssImportCount(Math.min(50, Math.max(1, parseInt(e.target.value))))}
                    className="w-16 bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-center"
                    title="Number of items to import (1-50)"
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
                                  <button type="button" onClick={handleAddNewsCategory} className="bg-purple-600 text-white px-3 rounded hover:bg-purple-500"><Check className="w-4 h-4" /></button>
                                  <button type="button" onClick={() => setShowAddCategory(false)} className="bg-zinc-800 text-zinc-400 px-3 rounded hover:bg-zinc-700"><X className="w-4 h-4" /></button>
                               </div>
                           ) : (
                               <>
                                   <select 
                                     value={newNews.category} 
                                     onChange={e => setNewNews({...newNews, category: e.target.value})} 
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

      {/* --- Manage Tab --- */}
      {activeTab === 'manage' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-lg w-fit border border-zinc-800">
                 <button 
                   onClick={() => setManageTab('tools')}
                   className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${manageTab === 'tools' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                 >
                   Tools ({tools.length})
                 </button>
                 <button 
                   onClick={() => setManageTab('news')}
                   className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${manageTab === 'news' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                 >
                   News ({news.length})
                 </button>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-3">
                 {manageTab === 'tools' ? (
                    <div className="relative group">
                        <Filter className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <select 
                          value={manageToolCategory}
                          onChange={(e) => setManageToolCategory(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg pl-9 pr-4 py-2 outline-none focus:border-indigo-500 appearance-none cursor-pointer min-w-[160px]"
                        >
                            <option value="All">All Categories</option>
                            {uniqueToolCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                 ) : (
                    <>
                        <div className="relative group">
                            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                            <select 
                              value={manageNewsCategory}
                              onChange={(e) => setManageNewsCategory(e.target.value)}
                              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg pl-9 pr-4 py-2 outline-none focus:border-purple-500 appearance-none cursor-pointer min-w-[160px]"
                            >
                                <option value="All">All Categories</option>
                                {uniqueNewsCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="relative group">
                            <ArrowUpDown className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                            <select 
                              value={manageNewsSort}
                              onChange={(e) => setManageNewsSort(e.target.value as 'newest' | 'oldest')}
                              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg pl-9 pr-4 py-2 outline-none focus:border-purple-500 appearance-none cursor-pointer min-w-[140px]"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </>
                 )}
              </div>
          </div>

          {/* ... (Tool/News Management Lists) ... */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg shadow-black/20">
             {manageTab === 'tools' && (
               <div className="w-full">
                  <div className="grid grid-cols-12 px-6 py-3 bg-zinc-950 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                     <div className="col-span-4">Name</div>
                     <div className="col-span-3">Category</div>
                     <div className="col-span-3">Price</div>
                     <div className="col-span-2 text-right">Action</div>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {filteredManageTools.map(tool => (
                      <div key={tool.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-zinc-800/30 transition-colors group">
                         <div className="col-span-4 pr-4">
                            <div className="font-medium text-white truncate">{tool.name}</div>
                            <div className="text-xs text-zinc-500 truncate">{tool.description}</div>
                         </div>
                         <div className="col-span-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {tool.category}
                            </span>
                         </div>
                         <div className="col-span-3 text-sm text-zinc-400">
                            {tool.price}
                         </div>
                         <div className="col-span-2 flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditingTool(tool)} className="p-2 text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => initiateDeleteTool(tool)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                    ))}
                    {filteredManageTools.length === 0 && <div className="p-8 text-center text-zinc-500 italic">No tools found matching your filters.</div>}
                  </div>
               </div>
             )}

             {manageTab === 'news' && (
               <div className="w-full">
                  <div className="grid grid-cols-12 px-6 py-3 bg-zinc-950 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                     <div className="col-span-6">Title</div>
                     <div className="col-span-2">Category</div>
                     <div className="col-span-2">Date</div>
                     <div className="col-span-2 text-right">Action</div>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {filteredManageNews.map(item => (
                      <div key={item.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-zinc-800/30 transition-colors group">
                         <div className="col-span-6 pr-4">
                            <div className="font-medium text-white truncate">{item.title}</div>
                            <div className="text-xs text-zinc-500 truncate">{item.source}</div>
                         </div>
                         <div className="col-span-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              {item.category}
                            </span>
                         </div>
                         <div className="col-span-2 text-sm text-zinc-400">
                            {new Date(item.date).toLocaleDateString()}
                         </div>
                         <div className="col-span-2 flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditingNews(item)} className="p-2 text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => initiateDeleteNews(item)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                    ))}
                    {filteredManageNews.length === 0 && <div className="p-8 text-center text-zinc-500 italic">No articles found matching your filters.</div>}
                  </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* --- Analyze Tab --- */}
      {/* (Preserved) */}
      {activeTab === 'analyze' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-zinc-400 text-sm uppercase font-bold mb-2 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" /> Total Tools
              </h3>
              <div className="text-4xl font-bold text-white">{tools.length}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-zinc-400 text-sm uppercase font-bold mb-2 flex items-center gap-2">
                <Newspaper className="w-4 h-4" /> Total Articles
              </h3>
              <div className="text-4xl font-bold text-white">{news.length}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-zinc-400 text-sm uppercase font-bold mb-2 flex items-center gap-2">
                <PieChart className="w-4 h-4" /> Categories
              </h3>
              <div className="text-4xl font-bold text-white">{Object.keys(categoryCounts).length}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-white font-bold mb-4">Tools by Category</h3>
                <div className="space-y-3">
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <div key={cat} className="space-y-1">
                       <div className="flex justify-between text-sm text-zinc-400">
                         <span>{cat}</span>
                         <span>{count}</span>
                       </div>
                       <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 rounded-full" 
                            style={{ width: `${(Number(count) / Math.max(tools.length, 1)) * 100}%` }}
                          />
                       </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" /> Deep Market Analysis
                  </h3>
                  <button 
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Generate Report'}
                  </button>
                </div>
                
                {analysisReport ? (
                  <div className="prose prose-invert prose-sm max-w-none h-64 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="whitespace-pre-wrap text-zinc-300">{analysisReport}</div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-zinc-500 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mb-2 mx-auto text-indigo-500 opacity-50" />
                    <p>Click "Generate Report" to analyze market trends.</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Database Tab */}
      {activeTab === 'database' && (
          <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Database className="w-5 h-5 text-zinc-400" /> Database Schema
                      </h3>
                      <button 
                          onClick={handleCopySchema}
                          className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors flex items-center gap-1"
                      >
                          {copiedSchema ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedSchema ? 'Copied' : 'Copy SQL'}
                      </button>
                  </div>
                  <p className="text-sm text-zinc-400 mb-4">
                      Run this SQL in your Supabase SQL Editor to set up tables.
                  </p>
                  <div className="bg-zinc-950 p-4 rounded-lg overflow-x-auto border border-zinc-800">
                      <pre className="text-xs text-zinc-500 font-mono whitespace-pre-wrap">
                          {sqlSchema}
                      </pre>
                  </div>
              </div>
          </div>
      )}

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
