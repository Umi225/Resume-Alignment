'use client';

import { useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { JDInputPanel } from '@/components/jd/JDInputPanel';
import { JDRecommendations } from '@/components/jd/JDRecommendations';
import { AIRewritePanel } from '@/components/ai/AIRewritePanel';
import { useResumeStore } from '@/stores/resumeStore';
import { matchProfileToJD } from '@/lib/jdMatcher';
import type { JDAnalysisResult, AssetMatchResult } from '@/lib/jdMatcher';
import type { Experience, Project } from '@/types/resume';
import type { RewriteTargetType } from '@/lib/ai/types';

export default function JDWorkbenchPage() {
  const {
    profile,
    currentJD,
    setCurrentJD,
    selectedOptimizedIds,
    toggleOptimizedSelection,
    applyAIOptimization,
  } = useResumeStore();
  const [analysis, setAnalysis] = useState<JDAnalysisResult | null>(null);
  const [matches, setMatches] = useState<AssetMatchResult[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // AI 优化面板状态
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiTarget, setAiTarget] = useState<Experience | Project | null>(null);
  const [aiTargetType, setAiTargetType] = useState<RewriteTargetType | null>(null);

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

  const handleGenerateOptimize = useCallback(
    (asset: Experience | Project, kind: 'experience' | 'project') => {
      setAiTarget(asset);
      setAiTargetType(kind);
      setAiPanelOpen(true);
    },
    []
  );

  const handleApplyAIOptimization = useCallback(
    (optimizedBullets: string[]) => {
      if (!aiTarget || !aiTargetType) return;
      applyAIOptimization(aiTarget.id, aiTargetType, optimizedBullets);
      setAiPanelOpen(false);
      setAiTarget(null);
      setAiTargetType(null);
    },
    [aiTarget, aiTargetType, applyAIOptimization]
  );

  const handleCloseAIPanel = useCallback(() => {
    setAiPanelOpen(false);
    setAiTarget(null);
    setAiTargetType(null);
  }, []);

  // 计算哪些经历已有推荐版本
  const optimizedIds = [
    ...profile.experience.filter((e) => e.optimizedVersion).map((e) => e.id),
    ...profile.projects.filter((p) => p.optimizedVersion).map((p) => p.id),
  ];

  const selectedCount = selectedOptimizedIds.length;

  return (
    <>
      <AppShell
        title="JD 对齐"
        rightPanel={
          <div className="flex h-full flex-col">
            <div className="border-b border-zinc-200 px-5 py-3">
              <h3 className="text-caption font-medium text-zinc-700">推荐经历</h3>
              <p className="mt-0.5 text-micro text-zinc-400">
                {hasAnalyzed
                  ? `基于 ${analysis?.keywords.length || 0} 个关键词匹配`
                  : '请先分析 JD'}
              </p>
            </div>
            <div className="flex-1 overflow-auto px-4 py-3">
              <JDRecommendations
                matches={matches}
                optimizedIds={optimizedIds}
                selectedIds={selectedOptimizedIds}
                onGenerateOptimize={handleGenerateOptimize}
                onToggleSelect={toggleOptimizedSelection}
              />
            </div>
            {selectedCount > 0 && (
              <div className="border-t border-zinc-200 px-5 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-small text-zinc-600">
                    已勾选 {selectedCount} 条推荐
                  </span>
                  <a
                    href="/resume-editor"
                    className="text-caption font-medium text-zinc-900 hover:underline"
                  >
                    去生成简历 →
                  </a>
                </div>
              </div>
            )}
          </div>
        }
      >
        <div className="flex h-full w-full">
          {/* 左：JD 输入 */}
          <div className="flex w-[360px] shrink-0 flex-col border-r border-zinc-200 bg-white">
            <div className="flex-1 overflow-auto">
              <JDInputPanel
                onAnalyze={handleAnalyze}
                analysis={analysis}
                hasAnalyzed={hasAnalyzed}
              />
            </div>
          </div>

          {/* 中：JD 分析结果 */}
          <div className="flex flex-1 flex-col min-w-0 bg-zinc-50">
            <div className="flex-1 overflow-auto px-6 py-5">
              <JDAnalysisView
                analysis={analysis}
                hasAnalyzed={hasAnalyzed}
                matches={matches}
                selectedCount={selectedCount}
              />
            </div>
          </div>
        </div>
      </AppShell>

      <AIRewritePanel
        isOpen={aiPanelOpen}
        target={aiTarget}
        targetType={aiTargetType}
        jobDescription={currentJD || ''}
        onClose={handleCloseAIPanel}
        onApply={handleApplyAIOptimization}
      />
    </>
  );
}

// ============================================
// JD 分析结果视图
// ============================================

function JDAnalysisView({
  analysis,
  hasAnalyzed,
  matches,
  selectedCount,
}: {
  analysis: JDAnalysisResult | null;
  hasAnalyzed: boolean;
  matches: AssetMatchResult[];
  selectedCount: number;
}) {
  if (!hasAnalyzed) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="rounded-card border border-dashed border-zinc-300 bg-white px-8 py-12">
          <p className="text-h3 text-zinc-700">开始 JD 分析</p>
          <p className="mt-2 max-w-sm text-small text-zinc-500">
            在左侧粘贴岗位描述，AI 将提取关键词并分析你的经历匹配度
          </p>
          <div className="mt-6 text-left space-y-2 max-w-sm mx-auto">
            <p className="text-micro text-zinc-400 font-medium">工作流：</p>
            <ol className="text-micro text-zinc-500 space-y-1 list-decimal list-inside">
              <li>粘贴 JD → AI 分析关键词</li>
              <li>查看匹配经历 → 生成推荐版本</li>
              <li>勾选推荐经历 → 生成最终简历</li>
            </ol>
          </div>
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
        <OverviewCard label="匹配经历" value={matches.filter((m) => m.score >= 40).length} />
      </div>

      {selectedCount > 0 && (
        <div className="card p-4 border-blue-200 bg-blue-50/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-medium text-zinc-900">
                已勾选 {selectedCount} 条推荐经历
              </p>
              <p className="text-micro text-zinc-500 mt-0.5">
                前往简历编辑器查看最终效果并导出 PDF
              </p>
            </div>
            <a
              href="/resume-editor"
              className="btn-primary text-micro px-4 py-2"
            >
              生成简历
            </a>
          </div>
        </div>
      )}

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
