
import React, { useState, useEffect } from 'react';
import {
  Globe, Sparkles, Wand2, Loader2, ListTodo, ArrowLeft,
  Save, Eye, MonitorPlay, BookOpen, GraduationCap,
  Link, Upload, PenTool, ImageIcon as Image, Video, Mic, Code, Briefcase
} from 'lucide-react';
import { Tool } from '../../../types';
import {
  generateDirectoryTools,
  generateToolDetails,
  generateToolSlides,
  generateToolTutorial,
  generateFullCourse,
  generateImage
} from '../../../services/geminiService';
import { arrayBufferToBase64 } from '../../../services/audioUtils';

interface ToolCreateTabProps {
  editingId: string | null;
  onAddTool: (tool: Tool) => void;
  onUpdateTool: (id: string, tool: Tool) => void;
  onCancel: () => void;
  onPreview: (type: 'tool', data: any) => void;
  initialTool?: Partial<Tool>;
}

export const ToolCreateTab: React.FC<ToolCreateTabProps> = ({
  editingId,
  onAddTool,
  onUpdateTool,
  onCancel,
  onPreview,
  initialTool
}) => {
  // Default tool template
  const defaultTool: Partial<Tool> = {
    name: '',
    description: '',
    category: 'Writing',
    price: 'Freemium',
    website: 'https://',
    page: 'free-tools',
    tags: [],
    features: [],
    useCases: [],
    pros: [],
    cons: [],
    howToUse: '',
    slides: [],
    tutorial: [],
    course: undefined
  };

  // Tool Form State
  const [newTool, setNewTool] = useState<Partial<Tool>>(initialTool || defaultTool);

  // Update form when initialTool changes (for editing)
  useEffect(() => {
    if (initialTool) {
      setNewTool(initialTool);
    } else {
      setNewTool(defaultTool);
    }
  }, [editingId]); // Re-initialize when editingId changes

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

  // Image Input State
  const [imageMode, setImageMode] = useState<'url' | 'upload' | 'generate'>('url');
  const [generatingImg, setGeneratingImg] = useState(false);

  // Tool Categories Definition
  const toolCategories = [
    { id: 'Writing', icon: PenTool, color: 'text-pink-400' },
    { id: 'Image', icon: Image, color: 'text-emerald-400' },
    { id: 'Video', icon: Video, color: 'text-purple-400' },
    { id: 'Audio', icon: Mic, color: 'text-orange-400' },
    { id: 'Coding', icon: Code, color: 'text-blue-400' },
    { id: 'Business', icon: Briefcase, color: 'text-amber-400' },
  ];

  // Handlers
  const handleGenerateToolCandidates = async () => {
    setIsGenToolBatch(true);
    try {
      const generatedTools = await generateDirectoryTools(toolGenCount);
      setToolReviewQueue(prev => [...generatedTools, ...prev]);
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

  const addTag = () => {
    if (tagInput.trim()) {
      setNewTool(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
      setTagInput('');
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
        setNewTool(prev => ({ ...prev, imageUrl: dataUrl }));
      } catch (err) {
        console.error("Error reading file:", err);
      }
    }
  };

  const handleGenerateImage = async () => {
    if (!newTool.name) {
      alert("Please enter a tool name first.");
      return;
    }
    setGeneratingImg(true);
    try {
      const prompt = `Editorial illustration for "${newTool.name}". ${newTool.description || ''}. High quality, modern style.`;
      const res = await generateImage(prompt, "16:9", "1K");

      let imgData = null;
      for (const part of res.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) imgData = part.inlineData.data;
      }

      if (imgData) {
        const dataUrl = `data:image/png;base64,${imgData}`;
        setNewTool(prev => ({ ...prev, imageUrl: dataUrl }));
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
      course: newTool.course,
      page: newTool.page || 'free-tools'
    };

    if (editingId) {
      onUpdateTool(editingId, tool);
    } else {
      onAddTool(tool);
    }

    // Reset form
    setNewTool({
      name: '',
      description: '',
      category: 'Writing',
      price: 'Freemium',
      website: 'https://',
      page: 'free-tools',
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
    setToolGenInput('');
  };

  const handlePreviewClick = () => {
    const previewData = {
      ...newTool,
      id: 'preview',
      imageUrl: newTool.imageUrl || `https://picsum.photos/seed/${newTool.name || 'preview'}/400/250`,
    };
    onPreview('tool', previewData);
  };

  const ImageInputSection = () => {
    const imageUrl = newTool.imageUrl;

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
            onChange={e => setNewTool(p => ({...p, imageUrl: e.target.value}))}
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
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {!editingId && (
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                        <img src={tool.imageUrl} className="w-16 h-10 object-cover rounded bg-zinc-800" alt={tool.name} title={tool.name} />
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">
            {editingId ? 'Edit Tool' : 'Add New Tool Manually'}
          </h3>
          {editingId && (
            <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Tool Name</label>
              <input
                required
                value={newTool.name}
                onChange={e => setNewTool({...newTool, name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-indigo-500 outline-none"
                placeholder="e.g. Gemini Code Assist"
              />
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
            <label className="block text-sm text-zinc-400 mb-2">Display Page</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNewTool({...newTool, page: 'free-tools'})}
                className={`flex items-center justify-center p-3 rounded-lg border transition-all font-medium text-sm ${
                  newTool.page === 'free-tools'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:border-zinc-700'
                }`}
                title="Display on Free Tools page"
                aria-label="Free Tools page"
              >
                Free Tools
              </button>
              <button
                type="button"
                onClick={() => setNewTool({...newTool, page: 'paid-tools'})}
                className={`flex items-center justify-center p-3 rounded-lg border transition-all font-medium text-sm ${
                  newTool.page === 'paid-tools'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:border-zinc-700'
                }`}
                title="Display on Paid Tools page"
                aria-label="Paid Tools page"
              >
                Paid Tools
              </button>
              <button
                type="button"
                onClick={() => setNewTool({...newTool, page: 'top-tools'})}
                className={`flex items-center justify-center p-3 rounded-lg border transition-all font-medium text-sm ${
                  newTool.page === 'top-tools'
                  ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:border-zinc-700'
                }`}
                title="Display on Top Tools page"
                aria-label="Top Tools page"
              >
                Top Tools
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Description</label>
            <textarea
              required
              value={newTool.description}
              onChange={e => setNewTool({...newTool, description: e.target.value})}
              placeholder="Describe this AI tool..."
              title="Tool description"
              aria-label="Tool description"
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white h-24 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Price</label>
              <input
                value={newTool.price}
                onChange={e => setNewTool({...newTool, price: e.target.value})}
                placeholder="Free, $9.99, Freemium"
                title="Tool price"
                aria-label="Tool price"
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Website URL</label>
              <input
                value={newTool.website}
                onChange={e => setNewTool({...newTool, website: e.target.value})}
                placeholder="https://example.com"
                title="Tool website URL"
                aria-label="Tool website URL"
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-indigo-500 outline-none"
              />
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
              placeholder="Enter tag and press Enter"
              title="Add tags"
              aria-label="Add tags"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Featured Image</label>
            <ImageInputSection />
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
            <button type="button" onClick={handlePreviewClick} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-zinc-700">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {editingId ? 'Update Tool' : 'Save Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ToolCreateTab;
