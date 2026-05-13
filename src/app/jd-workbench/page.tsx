'use client';

import { useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { JDInputPanel } from '@/components/jd/JDInputPanel';
import { JDRecommendations } from '@/components/jd/JDRecommendations';
import { useResumeStore } from '@/stores/resumeStore';
import { matchProfileToJD } from '@/lib/jdMatcher';
import type { JDAnalysisResult, AssetMatchResult } from '@/lib/jdMatcher';

export default function JDWorkbenchPage() {
  const { profile, setCurrentJD } = useResumeStore();
  const [analysis, setAnalysis] = useState<JDAnalysisResult | null>(null);
  const [matches, setMatches] = useState<AssetMatchResult[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = useCallback(
    (jdText: string) => {
      setCurrentJD(jdText);
      const result = matchProfileToJD(profile, jdText);
      setAnalysis(result.jdAnalysis);
      setMatches(result.matches);
      setHasAnalyzed(true);
    },
    [profile, setCurrentJD]
  );

  return (
    <AppShell
      title="JD 对齐"
      rightPanel={
        <div className="flex h-full flex-col">
          <div className="border-b border-zinc-200 px-5 py-3">
            <h3 className="text-caption font-medium text-zinc-700">推荐经历</h3>
            <p className="mt-0.5 text-micro text-zinc-400">
              {hasAnalyzed ? `基于 ${analysis?.keywords.length || 0} 个关键词匹配` : '请先分析 JD'}
            </p>
          </div>
          <div className="flex-1 overflow-auto px-4 py-3">
            <JDRecommendations matches={matches} />
          </div>
        </div>
      }
    >
      <div className="flex h-full w-full">
        {/* 左：JD 输入 */}
        <div className="flex w-[360px] shrink-0 flex-col border-r border-zinc-200 bg-white">
          <div className="flex-1 overflow-auto">
            <JDInputPanel onAnalyze={handleAnalyze} analysis={analysis} hasAnalyzed={hasAnalyzed} />
          </div>
        </div>

        {/* 中：JD 分析结果 */}
        <div className="flex flex-1 flex-col min-w-0 bg-zinc-50">
          <div className="flex-1 overflow-auto px-6 py-5">
            <JDAnalysisView analysis={analysis} hasAnalyzed={hasAnalyzed} matches={matches} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ============================================
// JD 分析结果视图
// ============================================

function JDAnalysisView({
  analysis,
  hasAnalyzed,
  matches,
}: {
  analysis: JDAnalysisResult | null;
  hasAnalyzed: boolean;
  matches: AssetMatchResult[];
}) {
  if (!hasAnalyzed) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="rounded-card border border-dashed border-zinc-300 bg-white px-8 py-12">
          <p className="text-h3 text-zinc-700">开始 JD 分析</p>
          <p className="mt-2 max-w-sm text-small text-zinc-500">
            在左侧粘贴岗位描述，AI 将提取关键词并分析你的经历匹配度
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-small text-zinc-500">分析中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* 概览卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <OverviewCard label="提取关键词" value={analysis.keywords.length} />
        <OverviewCard label="硬性要求" value={analysis.requirements.length} />
        <OverviewCard label="匹配经历" value={matches.filter(m => m.score >= 40).length} />
      </div>

      {/* 硬性要求 */}
      {analysis.requirements.length > 0 && (
        <div className="card p-4">
          <h3 className="text-caption font-medium text-zinc-900 mb-2">硬性要求</h3>
          <div className="flex flex-wrap gap-1.5">
            {analysis.requirements.map((req, i) => (
              <span
                key={i}
                className="rounded-md bg-amber-50 px-2 py-1 text-micro font-medium text-amber-700 border border-amber-200"
              >
                {req.rawText}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 关键词分析 */}
      {analysis.keywords.length > 0 && (
        <div className="card p-4">
          <h3 className="text-caption font-medium text-zinc-900 mb-3">关键词分析</h3>
          <div className="flex flex-wrap gap-1.5">
            {analysis.keywords.map((kw) => (
              <span
                key={kw.word}
                className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-[3px] text-micro text-zinc-700"
              >
                {kw.word}
                <span className="ml-1 text-zinc-400">{kw.weight}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-h1 text-zinc-900">{value}</p>
      <p className="mt-0.5 text-micro text-zinc-500">{label}</p>
    </div>
  );
}
