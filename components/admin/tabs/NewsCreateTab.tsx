
import React, { useState, useEffect } from 'react';
import {
  Globe, Sparkles, Wand2, Loader2, ListTodo, ArrowLeft,
  Save, Eye, Link, Upload, Newspaper, Plus, Check, X
} from 'lucide-react';
import { NewsArticle } from '../../../types';
import {
  generateDirectoryNews,
  generateNewsDetails,
  generateImage
} from '../../../services/geminiService';
import { arrayBufferToBase64 } from '../../../services/audioUtils';

interface NewsCreateTabProps {
  editingId: string | null;
  onAddNews: (news: NewsArticle) => void;
  onUpdateNews: (id: string, news: NewsArticle) => void;
  onCancel: () => void;
  onPreview: (type: 'news', data: any) => void;
  initialNews?: Partial<NewsArticle>;
  newsCategories: string[];
  onAddCategory: (category: string) => void;
}

export const NewsCreateTab: React.FC<NewsCreateTabProps> = ({
  editingId,
  onAddNews,
  onUpdateNews,
  onCancel,
  onPreview,
  initialNews,
  newsCategories,
  onAddCategory
}) => {
  // Default news template
  const defaultNews: Partial<NewsArticle> = {
    title: '',
    description: '',
    content: '',
    source: '',
    imageUrl: '',
    category: 'Technology'
  };

  // News Form State
  const [newNews, setNewNews] = useState<Partial<NewsArticle>>(initialNews || defaultNews);

  // Update form when initialNews changes (for editing)
  useEffect(() => {
    if (initialNews) {
      setNewNews(initialNews);
    } else {
      setNewNews(defaultNews);
    }
  }, [editingId]); // Re-initialize when editingId changes

  // News Generator State
  const [newsGenInput, setNewsGenInput] = useState('');
  const [isGenNewsSingle, setIsGenNewsSingle] = useState(false);
  const [isGenNewsBatch, setIsGenNewsBatch] = useState(false);
  const [newsGenCount, setNewsGenCount] = useState(3);
  const [newsReviewQueue, setNewsReviewQueue] = useState<NewsArticle[]>([]);

  // Category Management State
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Image Input State
  const [imageMode, setImageMode] = useState<'url' | 'upload' | 'generate'>('url');
  const [generatingImg, setGeneratingImg] = useState(false);

  // Handlers
  const handleGenerateNewsCandidates = async () => {
    setIsGenNewsBatch(true);
    try {
      const generatedNews = await generateDirectoryNews(newsGenCount);
      setNewsReviewQueue(prev => [...generatedNews, ...prev]);
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

  const handleAddNewsCategory = () => {
    if (newCategoryInput && !newsCategories.includes(newCategoryInput)) {
      onAddCategory(newCategoryInput);
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
    if (!newNews.title) {
      alert("Please enter a title first.");
      return;
    }
    setGeneratingImg(true);
    try {
      const prompt = `Editorial illustration for "${newNews.title}". ${newNews.description || ''}. High quality, modern style.`;
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

    // Reset form
    setNewNews(defaultNews);
    setNewsGenInput('');
  };

  const handlePreviewClick = () => {
    const previewData = {
      ...newNews,
      id: 'preview',
      imageUrl: newNews.imageUrl || `https://picsum.photos/seed/${newNews.title || 'preview'}/800/400`,
      date: new Date().toISOString()
    };
    onPreview('news', previewData);
  };

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
            className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
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
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
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
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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

          {/* News Review Queue */}
          {newsReviewQueue.length > 0 && (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-orange-400" />
                  Review Queue ({newsReviewQueue.length})
                </h4>
                <button
                  onClick={handlePublishAllNews}
                  className="text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  Publish All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newsReviewQueue.map((article) => (
                  <div key={article.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex flex-col gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h5 className="text-white font-bold line-clamp-1">{article.title}</h5>
                        <span className="text-[10px] uppercase bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">{article.category}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <img src={article.imageUrl} className="w-16 h-10 object-cover rounded bg-zinc-800" alt={article.title} title={article.title} />
                        <p className="text-xs text-zinc-500 line-clamp-2">{article.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-zinc-800">
                      <button
                        onClick={() => handlePublishReviewNews(article)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-xs font-medium"
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => handleEditReviewNews(article)}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-1.5 rounded text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDiscardReviewNews(article.id)}
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

      <div className={`bg-zinc-900/50 border rounded-xl p-6 ${editingId ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' : 'border-zinc-800'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">
            {editingId ? 'Edit News Article' : 'Publish News Article Manually'}
          </h3>
          {editingId && (
            <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleNewsSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Article Title</label>
              <input
                required
                value={newNews.title}
                onChange={e => setNewNews({...newNews, title: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-purple-500 outline-none"
                placeholder="e.g. Gemini 2.5 Released"
              />
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
            <textarea
              required
              value={newNews.description}
              onChange={e => setNewNews({...newNews, description: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white h-20 focus:border-purple-500 outline-none"
              placeholder="A brief summary for the card view..."
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Full Content</label>
            <textarea
              required
              value={newNews.content}
              onChange={e => setNewNews({...newNews, content: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white h-48 focus:border-purple-500 outline-none"
              placeholder="The full article content goes here..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Featured Image</label>
              <ImageInputSection />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Source / Author</label>
              <input
                value={newNews.source}
                onChange={e => setNewNews({...newNews, source: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-purple-500 outline-none"
                placeholder="e.g. TechCrunch"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handlePreviewClick} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-zinc-700">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {editingId ? 'Update Article' : 'Publish Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewsCreateTab;
