'use client';

import { useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { JDInputPanel } from '@/components/jd/JDInputPanel';
import { JDRecommendations } from '@/components/jd/JDRecommendations';
import { AIRewritePanel } from '@/components/ai/AIRewritePanel';
import { useResumeStore } from '@/stores/resumeStore';
import { cn } from '@/lib/utils';
import { matchProfileToJD, getCategoryColor, getCategoryLabel } from '@/lib/jdMatcher';
import { CAPABILITY_LABELS } from '@/lib/jd/capabilities';
import type { JDAnalysisResult, AssetMatchResult } from '@/lib/jdMatcher';
import type { Experience, Project } from '@/types/resume';
import type { RewriteTargetType } from '@/lib/ai/types';

function formatWeight(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1).replace(/\.0$/, '');
}

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
      const match = matches.find(
        (m) => (m.asset as Experience | Project).id === aiTarget.id
      );
      const content = optimizedBullets.join('\n');
      applyAIOptimization(aiTarget.id, aiTargetType, {
        content,
        jdScore: match?.score,
        highlights: match?.matchedKeywords,
      });
      setAiPanelOpen(false);
      setAiTarget(null);
      setAiTargetType(null);
    },
    [aiTarget, aiTargetType, matches, applyAIOptimization]
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
                  ? '已按当前 JD 推荐相关经历'
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
      {/* JD 关键词分析 */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-caption font-medium text-zinc-800">
            已识别 JD 关键词
          </h4>
          <span className="text-micro text-zinc-400">
            共 {analysis.keywords.length} 个
          </span>
        </div>
        {analysis.keywords.length === 0 ? (
          <p className="text-micro text-zinc-500">未识别到关键词</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {analysis.keywords.map((kw) => (
              <span
                key={kw.word}
                className={cn(
                  'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium border',
                  getCategoryColor(kw.category)
                )}
              >
                {kw.word}
                <span className="opacity-60">· {getCategoryLabel(kw.category)}</span>
              </span>
            ))}
          </div>
        )}
        {analysis.keywords.length < 3 && (
          <p className="mt-2 text-micro text-amber-600">
            当前 JD 识别到的关键词较少，推荐结果可能不够准确，建议补充岗位职责/任职要求。
          </p>
        )}
      </div>

      {/* capability 聚合（轻量展示） */}
      {analysis.capabilitySummary.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-caption font-medium text-zinc-800">
              能力维度
            </h4>
            <span className="text-micro text-zinc-400">
              共 {analysis.capabilitySummary.length} 项
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.capabilitySummary.map((cap) => (
              <span
                key={cap.capability}
                className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 border border-zinc-200"
                title={`命中关键词：${cap.keywords.join('、')}`}
              >
                {CAPABILITY_LABELS[cap.capability] || cap.capability}
                <span className="text-zinc-400">· {formatWeight(cap.totalWeight)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 硬性要求 */}
      {analysis.requirements.length > 0 && (
        <div className="card p-4">
          <h4 className="text-caption font-medium text-zinc-800 mb-2">
            硬性要求
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {analysis.requirements.map((req, idx) => (
              <span
                key={idx}
                className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600"
              >
                {req.rawText}
              </span>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}

