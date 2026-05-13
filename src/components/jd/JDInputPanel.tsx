'use client';

import { useState } from 'react';
import type { JDAnalysisResult } from '@/lib/jdMatcher';
import { cn } from '@/lib/utils';
import { FileText, Zap } from 'lucide-react';

interface JDInputPanelProps {
  onAnalyze: (jdText: string) => void;
  analysis: JDAnalysisResult | null;
  hasAnalyzed: boolean;
}

export function JDInputPanel({ onAnalyze, analysis, hasAnalyzed }: JDInputPanelProps) {
  const [jdText, setJdText] = useState('');

  const handleAnalyze = () => {
    if (!jdText.trim()) return;
    onAnalyze(jdText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-500" />
          <span className="text-caption font-medium text-zinc-700">岗位描述</span>
        </div>
        <span className="text-micro text-zinc-400">Ctrl + Enter</span>
      </div>

      {/* Textarea */}
      <div className="flex-1 px-5 py-3">
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="粘贴岗位描述（JD）文本到这里..."
          className="h-full min-h-[200px] w-full resize-none rounded-card border border-zinc-200 bg-zinc-50 px-4 py-3 text-small text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
        />
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 px-5 py-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-micro text-zinc-400">
            {jdText.length} 字
          </span>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={!jdText.trim()}
          className={cn(
            'btn-primary w-full flex items-center justify-center gap-1.5',
            !jdText.trim() && 'opacity-40 cursor-not-allowed'
          )}
        >
          <Zap className="h-3.5 w-3.5" />
          分析匹配
        </button>
      </div>
    </div>
  );
}
