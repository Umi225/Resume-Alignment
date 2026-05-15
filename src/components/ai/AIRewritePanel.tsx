/**
 * ============================================
 * AI Rewrite Panel
 * ============================================
 *
 * 职责：右侧 AI 优化面板
 *
 * 包含：
 * - 优化模式选择
 * - 原文展示
 * - AI 优化结果（Diff 高亮）
 * - 修改说明
 * - 待补充建议
 * - 应用 / 放弃按钮
 *
 * 核心原则：用户始终拥有最终控制权
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { DiffView } from './DiffView';
import { RiskPanel } from './RiskWarnings';
import type {
  RewriteResult,
  OptimizationMode,
  RewriteTargetType,
} from '@/lib/ai/types';
import type { Experience, Project } from '@/types/resume';
import {
  X,
  Sparkles,
  Loader2,
  Check,
  RotateCcw,
  AlertTriangle,
  FileText,
  Lightbulb,
  ShieldAlert,
} from 'lucide-react';

// ============================================
// Props
// ============================================

interface AIRewritePanelProps {
  isOpen: boolean;
  target: Experience | Project | null;
  targetType: RewriteTargetType | null;
  jobDescription?: string;
  onClose: () => void;
  onApply: (optimizedBullets: string[]) => void;
}

/**
 * 检查字符串是否为完整的 JSON 对象/数组（用于检测 JSON 泄漏）
 * 允许 {待补充} 这类占位符通过（不是有效 JSON）
 */
function looksLikeJSON(str: string): boolean {
  const hasJsonStart = /^\s*[\{\[]/.test(str);
  const hasJsonEnd = /[}\]]\s*$/.test(str);
  if (!hasJsonStart || !hasJsonEnd) return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// 优化模式配置
// ============================================

const MODE_CONFIG: Array<{
  key: OptimizationMode;
  label: string;
  description: string;
}> = [
  {
    key: 'full',
    label: '全面优化',
    description: '表达润色 + 结构重组 + 术语对齐',
  },
  {
    key: 'action',
    label: '强化 Action',
    description: '重点强化动词和具体动作',
  },
  {
    key: 'result',
    label: '强化 Result',
    description: '突出量化成果，标记缺失',
  },
  {
    key: 'jd_match',
    label: 'JD 对齐',
    description: '针对目标岗位调整术语',
  },
  {
    key: 'polish',
    label: '轻度润色',
    description: '保守优化，保持原意',
  },
];

// ============================================
// 主组件
// ============================================

export function AIRewritePanel({
  isOpen,
  target,
  targetType,
  jobDescription,
  onClose,
  onApply,
}: AIRewritePanelProps) {
  const [mode, setMode] = useState<OptimizationMode>('full');
  const [userInstruction, setUserInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'diff' | 'risks' | 'original'>('diff');
  const [isMock, setIsMock] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleOptimize = useCallback(async () => {
    if (!target || !targetType) return;

    // 取消之前的未完成请求，防止旧响应覆盖新结果
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          target,
          targetType,
          jobDescription,
          mode,
          userInstruction: userInstruction.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (process.env.NODE_ENV === 'development') {
        console.log('[FRONTEND RECEIVED]', JSON.stringify(data, null, 2));
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || '请求失败');
      }

      setResult(data.result);
      setIsMock(data.meta?.mode === 'mock');
      setActiveTab('diff');
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        // 用户主动取消或发起新请求，静默忽略
        return;
      }
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [target, targetType, jobDescription, mode, userInstruction]);

  const handleApply = useCallback(() => {
    if (!result) return;
    const bullets = result.rewrittenBullets.map((b) => b.optimized);
    onApply(bullets);
    onClose();
  }, [result, onApply, onClose]);

  const handleDiscard = useCallback(() => {
    abortControllerRef.current?.abort();
    setResult(null);
    setError(null);
    onClose();
  }, [onClose]);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsMock(false);
  }, []);

  if (!isOpen) return null;

  const targetLabel =
    targetType === 'experience'
      ? (target as Experience)?.company || '工作经历'
      : (target as Project)?.name || '项目经历';

  const hasFabrication = result?.fabricationBlocked ?? false;
  const hasPendingItems =
    (result?.missingMetrics.length ?? 0) > 0 ||
    (result?.warnings.length ?? 0) > 0 ||
    (result?.rewrittenBullets.some((b) => b.confidence !== 'verified') ?? false);

  // 前端保护：校验 AI 结果是否真正可用
  const isResultValid =
    result !== null &&
    result.rewrittenBullets.length > 0 &&
    result.rewrittenBullets.every(
      (b) =>
        typeof b.optimized === 'string' &&
        b.optimized.trim().length > 0 &&
        !b.optimized.includes('```') &&
        !looksLikeJSON(b.optimized)
    );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        {/* ====== Header ====== */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">AI 优化</h2>
              <p className="text-xs text-zinc-500">{targetLabel}</p>
            </div>
          </div>
          <button
            onClick={handleDiscard}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ====== Content ====== */}
        <div className="flex-1 overflow-y-auto">
          {!result && !loading && (
            <ConfigView
              mode={mode}
              onModeChange={setMode}
              userInstruction={userInstruction}
              onInstructionChange={setUserInstruction}
              hasJD={!!jobDescription && jobDescription.trim().length > 0}
              onOptimize={handleOptimize}
              error={error}
            />
          )}

          {loading && <LoadingView />}

          {result && !loading && isResultValid && (
            <ResultView
              result={result}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              hasFabrication={hasFabrication}
              hasPendingItems={hasPendingItems}
              isMock={isMock}
            />
          )}

          {result && !loading && !isResultValid && (
            <InvalidResultView onRetry={handleReset} />
          )}
        </div>

        {/* ====== Footer ====== */}
        {result && !loading && isResultValid && (
          <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4">
            {hasFabrication && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-xs leading-relaxed text-red-700">
                  检测到 AI 输出存在编造嫌疑。请仔细核对每一条修改后再决定是否应用。
                </p>
              </div>
            )}

            {!hasFabrication && hasPendingItems && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <p className="text-xs leading-relaxed text-amber-700">
                  优化结果中包含待确认或待补充的内容。建议先查看「风险提示」标签后再应用。
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleApply}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                <Check className="h-4 w-4" />
                应用优化
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-600 hover:bg-white"
              >
                <RotateCcw className="h-4 w-4" />
                重新优化
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 配置视图（优化前）
// ============================================

function ConfigView({
  mode,
  onModeChange,
  userInstruction,
  onInstructionChange,
  hasJD,
  onOptimize,
  error,
}: {
  mode: OptimizationMode;
  onModeChange: (m: OptimizationMode) => void;
  userInstruction: string;
  onInstructionChange: (v: string) => void;
  hasJD: boolean;
  onOptimize: () => void;
  error: string | null;
}) {
  return (
    <div className="space-y-6 px-6 py-5">
      {/* Mode Selection */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          优化模式
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {MODE_CONFIG.map((m) => (
            <button
              key={m.key}
              onClick={() => onModeChange(m.key)}
              className={cn(
                'flex flex-col rounded-lg border px-4 py-3 text-left transition-all',
                mode === m.key
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
              )}
            >
              <span className="text-sm font-medium">{m.label}</span>
              <span
                className={cn(
                  'mt-0.5 text-xs',
                  mode === m.key ? 'text-zinc-300' : 'text-zinc-400'
                )}
              >
                {m.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* JD Hint */}
      {hasJD && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">
              已关联目标 JD
            </span>
          </div>
          <p className="mt-1 text-xs text-emerald-600">
            AI 将参考 JD 中的关键词进行术语对齐
          </p>
        </div>
      )}

      {/* User Instruction */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          补充要求（可选）
        </h3>
        <textarea
          value={userInstruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
          placeholder="如：重点突出性能优化成果、使用更技术性的表达..."
        />
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Optimize Button */}
      <button
        onClick={onOptimize}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800"
      >
        <Sparkles className="h-4 w-4" />
        开始 AI 优化
      </button>

      {/* Safety Note */}
      <div className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-400" />
        <p className="text-xs leading-relaxed text-zinc-500">
          AI 不会编造经历或数据。所有修改仅优化表达方式，您拥有最终决定权。
        </p>
      </div>
    </div>
  );
}

// ============================================
// 加载视图
// ============================================

function LoadingView() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20">
      <div className="relative">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
        <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-zinc-600" />
      </div>
      <p className="mt-5 text-sm font-medium text-zinc-700">AI 正在分析...</p>
      <div className="mt-4 space-y-2">
        {['解析原文结构', '应用 STAR 法则', '检测量化缺失', '对齐岗位术语'].map(
          (step, i) => (
            <div
              key={step}
              className="flex items-center gap-2"
              style={{ animationDelay: `${i * 200}ms` }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
              <span className="text-xs text-zinc-400">{step}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ============================================
// 无效结果视图（AI 输出异常）
// ============================================

function InvalidResultView({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <ShieldAlert className="h-6 w-6 text-red-500" />
      </div>
      <p className="mt-4 text-sm font-medium text-red-700">
        AI 输出格式异常，请重新优化
      </p>
      <p className="mt-1 text-center text-xs text-red-500">
        优化结果无法解析或包含非法内容，建议切换模式后重试
      </p>
      <button
        onClick={onRetry}
        className="mt-5 flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
      >
        <RotateCcw className="h-4 w-4" />
        重新优化
      </button>
    </div>
  );
}

// ============================================
// 结果视图（优化后）
// ============================================

function ResultView({
  result,
  activeTab,
  onTabChange,
  hasFabrication,
  hasPendingItems,
  isMock,
}: {
  result: RewriteResult;
  activeTab: 'diff' | 'risks' | 'original';
  onTabChange: (t: 'diff' | 'risks' | 'original') => void;
  hasFabrication: boolean;
  hasPendingItems: boolean;
  isMock: boolean;
}) {
  const tabConfig = [
    { key: 'diff' as const, label: '优化结果', icon: Sparkles },
    {
      key: 'risks' as const,
      label: '风险提示',
      icon: hasFabrication ? ShieldAlert : hasPendingItems ? AlertTriangle : Lightbulb,
      badge:
        result.warnings.length + result.missingMetrics.length > 0
          ? result.warnings.length + result.missingMetrics.length
          : undefined,
    },
    { key: 'original' as const, label: '原文', icon: FileText },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Mock Warning */}
      {isMock && (
        <div className="flex items-center gap-1.5 border-b border-amber-200 bg-amber-50 px-6 py-2">
          <AlertTriangle className="h-3 w-3 flex-shrink-0 text-amber-500" />
          <span className="text-[11px] font-medium text-amber-700">
            Mock AI Response（未连接真实模型）
          </span>
        </div>
      )}

      {/* Summary Banner */}
      <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-3">
        <p className="text-xs leading-relaxed text-zinc-600">{result.summary}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 px-6">
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'relative flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.badge && (
                <span className="ml-0.5 rounded bg-amber-100 px-1 py-0 text-[10px] font-medium text-amber-700">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === 'diff' && (
          <DiffView
            originalBullets={result.originalBullets}
            optimizedBullets={result.rewrittenBullets}
            showOriginal={false}
          />
        )}

        {activeTab === 'risks' && (
          <RiskPanel
            warnings={result.warnings}
            missingMetrics={result.missingMetrics}
            suggestions={result.suggestions}
          />
        )}

        {activeTab === 'original' && (
          <div className="space-y-3">
            {result.originalBullets.map((bullet, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-sm text-zinc-600"
              >
                <span className="mr-2 text-xs text-zinc-400">#{i + 1}</span>
                {bullet}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
