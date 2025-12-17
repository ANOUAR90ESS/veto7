
import React, { useState } from 'react';
import { Database, Copy, Check } from 'lucide-react';

interface DatabaseTabProps {
  sqlSchema: string;
}

export const DatabaseTab: React.FC<DatabaseTabProps> = ({ sqlSchema }) => {
  const [copiedSchema, setCopiedSchema] = useState(false);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
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
  );
};

export default DatabaseTab;
