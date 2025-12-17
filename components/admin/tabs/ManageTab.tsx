
import React, { useState, useMemo } from 'react';
import { Filter, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Tool, NewsArticle } from '../../../types';

interface ManageTabProps {
  tools: Tool[];
  news: NewsArticle[];
  toolCategories: Array<{ id: string; icon: any; color: string }>;
  newsCategories: string[];
  onEditTool: (tool: Tool) => void;
  onEditNews: (article: NewsArticle) => void;
  onDeleteTool: (tool: Tool) => void;
  onDeleteNews: (article: NewsArticle) => void;
}

export const ManageTab: React.FC<ManageTabProps> = ({
  tools,
  news,
  toolCategories,
  newsCategories,
  onEditTool,
  onEditNews,
  onDeleteTool,
  onDeleteNews
}) => {
  const [manageTab, setManageTab] = useState<'tools' | 'news'>('tools');
  const [manageToolCategory, setManageToolCategory] = useState('All');
  const [manageNewsCategory, setManageNewsCategory] = useState('All');
  const [manageNewsSort, setManageNewsSort] = useState<'newest' | 'oldest'>('newest');

  // Computed values
  const uniqueToolCategories = useMemo(() => {
    return Array.from(new Set([...toolCategories.map(c => c.id), ...tools.map(t => t.category)])).sort();
  }, [tools, toolCategories]);

  const filteredManageTools = useMemo(() => {
    return tools.filter(t => manageToolCategory === 'All' || t.category === manageToolCategory);
  }, [tools, manageToolCategory]);

  const uniqueNewsCategories = useMemo(() => {
    return Array.from(new Set([...newsCategories, ...news.map(n => n.category)])).sort();
  }, [news, newsCategories]);

  const filteredManageNews = useMemo(() => {
    return news
      .filter(n => manageNewsCategory === 'All' || n.category === manageNewsCategory)
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return manageNewsSort === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [news, manageNewsCategory, manageNewsSort]);

  return (
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
                title="Filter tools by category"
                aria-label="Filter tools by category"
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
                  title="Filter news by category"
                  aria-label="Filter news by category"
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
                  title="Sort news articles"
                  aria-label="Sort news articles"
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

      {/* Management Tables */}
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
                    <button onClick={() => onEditTool(tool)} className="p-2 text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteTool(tool)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredManageTools.length === 0 && (
                <div className="p-8 text-center text-zinc-500 italic">No tools found matching your filters.</div>
              )}
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
                    <button onClick={() => onEditNews(item)} className="p-2 text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteNews(item)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredManageNews.length === 0 && (
                <div className="p-8 text-center text-zinc-500 italic">No articles found matching your filters.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTab;
