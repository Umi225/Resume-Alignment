/**
 * ============================================
 * AI Rewrite Panel
 * ============================================
 *
 * 职责：右侧 AI 优化面板
 *
 * 单页编辑工作区：
 * - 审核摘要
 * - 可编辑优化结果
 * - 集中提示区
 * - 原始经历折叠
 * - 应用 / 重新检查
 *
 * 核心原则：用户始终拥有最终控制权
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
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
  ChevronDown,
  ChevronUp,
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
  const leakPatterns = [
    '"rewrittenBullets"',
    '"original"',
    '"optimized"',
    '"changeType"',
    '"explanation"',
    '"confidence"',
  ];
  return leakPatterns.some((p) => str.includes(p));
}

const DEFAULT_MODE: OptimizationMode = 'full';

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
  const mode = DEFAULT_MODE;
  const [userInstruction, setUserInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [editedBullets, setEditedBullets] = useState<string[]>([]);
  const [rechecking, setRechecking] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 当 result 首次可用时，初始化可编辑文本
  useEffect(() => {
    if (result) {
      setEditedBullets(result.rewrittenBullets.map((b) => b.optimized));
    }
  }, [result]);

  const handleOptimize = useCallback(async () => {
    if (!target || !targetType) return;

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

      if (process.env.NODE_ENV === 'development') {
        data.result.rewrittenBullets.forEach((b: { optimized: string }, i: number) => {
          console.log(`[DIAG] optimized[${i}] raw:`, JSON.stringify(b.optimized));
        });
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return;
      }
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [target, targetType, jobDescription, mode, userInstruction]);

  // 应用到简历：必须使用用户当前编辑框里的文本
  const handleApply = useCallback(() => {
    if (!editedBullets.length) return;
    onApply(editedBullets);
    onClose();
  }, [editedBullets, onApply, onClose]);

  // 重新检查：基于当前编辑后的文本重新生成风险/建议，不覆盖用户文本
  const handleRecheck = useCallback(async () => {
    if (!target || !targetType || editedBullets.length === 0) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setRechecking(true);
    setError(null);

    try {
      const editedTarget = {
        ...target,
        bullets: editedBullets,
      };

      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          target: editedTarget,
          targetType,
          jobDescription,
          mode,
          userInstruction: userInstruction.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (process.env.NODE_ENV === 'development') {
        console.log('[FRONTEND RECHECK RECEIVED]', JSON.stringify(data, null, 2));
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || '请求失败');
      }

      setResult(data.result);
      setIsMock(data.meta?.mode === 'mock');
      // 保留用户编辑的文本，不覆盖 editedBullets
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return;
      }
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setRechecking(false);
    }
  }, [target, targetType, editedBullets, jobDescription, mode, userInstruction]);

  const handleDiscard = useCallback(() => {
    abortControllerRef.current?.abort();
    setResult(null);
    setError(null);
    setEditedBullets([]);
    onClose();
  }, [onClose]);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsMock(false);
    setEditedBullets([]);
  }, []);

  if (!isOpen) return null;

  const targetLabel =
    targetType === 'experience'
      ? (target as Experience)?.company || '工作经历'
      : (target as Project)?.name || '项目经历';

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
              <h2 className="text-sm font-semibold text-zinc-900">✨ AI 简历优化</h2>
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
              editedBullets={editedBullets}
              onEditChange={setEditedBullets}
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
            {/* 风险控制文案 */}
            <p className="mb-3 text-xs leading-relaxed text-zinc-500">
              AI 只负责给出初稿和检查提示。最终事实、数据、奖项和措辞由用户人工确认后再应用到简历。
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleApply}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                <Check className="h-4 w-4" />
                应用到简历
              </button>
              <button
                onClick={handleRecheck}
                disabled={rechecking}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-600',
                  rechecking ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white'
                )}
              >
                <RotateCcw className={cn('h-4 w-4', rechecking && 'animate-spin')} />
                {rechecking ? '检查中...' : '重新检查'}
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
  userInstruction,
  onInstructionChange,
  hasJD,
  onOptimize,
  error,
}: {
  userInstruction: string;
  onInstructionChange: (v: string) => void;
  hasJD: boolean;
  onOptimize: () => void;
  error: string | null;
}) {
  return (
    <div className="space-y-6 px-6 py-5">
      {/* Description */}
      <section className="rounded-xl bg-zinc-50 px-4 py-4">
        <p className="text-sm leading-relaxed text-zinc-700">
          AI 将基于 STAR 法则、岗位 JD 与简历规范，自动优化当前经历表达。
        </p>
        <ul className="mt-2.5 space-y-1">
          {[
            '强化行动描述',
            '补足成果表达',
            '对齐岗位关键词',
            '保持真实、不虚构',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-1 w-1 rounded-full bg-zinc-400" />
              {item}
            </li>
          ))}
        </ul>
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
          placeholder={`例如：\n- 突出数据分析能力\n- 更偏互联网表达\n- 强调跨团队协作\n- 强化产品思维`}
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
        ✨ 一键优化经历
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
// 结果视图（单页编辑工作区）
// ============================================

function ResultView({
  result,
  editedBullets,
  onEditChange,
  isMock,
}: {
  result: RewriteResult;
  editedBullets: string[];
  onEditChange: (bullets: string[]) => void;
  isMock: boolean;
}) {
  const [originalExpanded, setOriginalExpanded] = useState(false);
  const [tipsDismissed, setTipsDismissed] = useState(false);

  const riskCount = result.warnings.length;
  const missingCount = result.missingMetrics.length;
  const suggestionCount = result.suggestions.length;
  const totalIssues = riskCount + missingCount + suggestionCount;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    // 以空行分隔不同的 bullet
    const bullets = text.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
    onEditChange(bullets);
  };

  return (
    <div className="flex flex-col">
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

      <div className="space-y-5 px-6 py-5">
        {/* A. 审核摘要 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-center">
            <p className="text-lg font-semibold text-amber-600">{riskCount}</p>
            <p className="text-[11px] text-zinc-500">需确认风险</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-center">
            <p className="text-lg font-semibold text-sky-600">{missingCount}</p>
            <p className="text-[11px] text-zinc-500">待补充</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-center">
            <p className="text-lg font-semibold text-emerald-600">{suggestionCount}</p>
            <p className="text-[11px] text-zinc-500">优化建议</p>
          </div>
        </div>

        {/* B. 优化结果｜可直接编辑 */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            优化结果
          </h3>
          <textarea
            value={editedBullets.join('\n\n')}
            onChange={handleTextChange}
            rows={Math.max(6, editedBullets.length * 2)}
            className="w-full rounded-lg border border-zinc-300 px-3.5 py-3 text-sm leading-relaxed text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
          />
          <p className="mt-1.5 text-[11px] text-zinc-400">
            可直接修改上方文本，应用时将使用您编辑后的内容
          </p>
        </section>

        {/* C. 集中提示区 */}
        {totalIssues > 0 && !tipsDismissed && (
          <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-700">检查提示</h3>
              <button
                onClick={() => setTipsDismissed(true)}
                className="text-[11px] text-zinc-400 hover:text-zinc-600"
              >
                全部忽略
              </button>
            </div>

            {/* 风险 */}
            {riskCount > 0 && (
              <div className="mb-2.5">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-600">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  风险：请确认以下表述是否真实准确
                </p>
                <ul className="space-y-1 pl-4">
                  {result.warnings.map((w, i) => (
                    <li key={`w-${i}`} className="text-xs leading-relaxed text-zinc-500">
                      • {w.message}
                      {w.suggestion && (
                        <span className="text-zinc-400">（{w.suggestion}）</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 待补充 */}
            {missingCount > 0 && (
              <div className="mb-2.5">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-600">
                  <Lightbulb className="h-3 w-3 text-sky-500" />
                  待补充：如有真实数据，可补充以下内容
                </p>
                <ul className="space-y-1 pl-4">
                  {result.missingMetrics.map((m, i) => (
                    <li key={`m-${i}`} className="text-xs leading-relaxed text-zinc-500">
                      • {m.description}
                      {m.suggestion && (
                        <span className="text-zinc-400">（{m.suggestion}）</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 建议 */}
            {suggestionCount > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-600">
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                  建议：参考以下方向进一步优化
                </p>
                <ul className="space-y-1 pl-4">
                  {result.suggestions.map((s, i) => (
                    <li key={`s-${i}`} className="text-xs leading-relaxed text-zinc-500">
                      • {s.title}：{s.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {totalIssues > 0 && tipsDismissed && (
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5">
            <p className="text-xs text-zinc-500">提示已忽略</p>
            <button
              onClick={() => setTipsDismissed(false)}
              className="text-xs text-zinc-600 hover:text-zinc-900"
            >
              重新显示
            </button>
          </div>
        )}

        {/* D. 原始经历折叠区 */}
        <section>
          <button
            onClick={() => setOriginalExpanded(!originalExpanded)}
            className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-600">原始经历</span>
            </div>
            {originalExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            )}
          </button>
          {originalExpanded && (
            <div className="mt-2 space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3.5">
              {result.originalBullets.map((bullet, i) => (
                <div key={i} className="text-xs leading-relaxed text-zinc-500">
                  <span className="mr-2 text-zinc-400">#{i + 1}</span>
                  {bullet}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
