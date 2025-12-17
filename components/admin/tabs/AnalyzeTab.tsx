
import React, { useState } from 'react';
import { LayoutGrid, Newspaper, PieChart, Sparkles, Loader2 } from 'lucide-react';
import { Tool, NewsArticle } from '../../../types';
import { analyzeToolTrends } from '../../../services/geminiService';

interface AnalyzeTabProps {
  tools: Tool[];
  news: NewsArticle[];
}

export const AnalyzeTab: React.FC<AnalyzeTabProps> = ({ tools, news }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState('');

  const categoryCounts = tools.reduce((acc, tool) => {
    acc[tool.category] = (acc[tool.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats Cards */}
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

      {/* Category Distribution & AI Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
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
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${(Number(count) / Math.max(tools.length, 1)) * 100}%`
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Trend Analysis */}
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
  );
};

export default AnalyzeTab;
