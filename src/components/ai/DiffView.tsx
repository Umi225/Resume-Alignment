/**
 * ============================================
 * Diff View 组件
 * ============================================
 *
 * 职责：渲染原文 vs AI 优化版的高亮差异
 *
 * 高亮规则：
 * - 新增内容：绿色背景 + 下划线
 * - 删除内容：红色删除线（在对比模式下显示）
 * - 改写内容：黄色背景（replace）
 * - 待确认内容：橙色虚线边框
 * - 保留内容：正常文本
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { diffBullet } from '@/lib/ai/diffEngine';
import type { BulletDiff, DiffChunk, ConfidenceLevel, ChangeType } from '@/lib/ai/types';
import { Check, AlertTriangle, HelpCircle } from 'lucide-react';

// ============================================
// Diff Chunk 渲染
// ============================================

interface ChunkRendererProps {
  chunk: DiffChunk;
  confidence: ConfidenceLevel;
}

function ChunkRenderer({ chunk, confidence }: ChunkRendererProps) {
  const isPending = confidence === 'pending_confirm' || confidence === 'pending_supplement';

  switch (chunk.type) {
    case 'equal':
      return <span className="text-zinc-800">{chunk.newText}</span>;

    case 'insert':
      return (
        <span
          className={cn(
            'rounded px-0.5 font-medium',
            isPending
              ? 'bg-amber-100 text-amber-800 underline decoration-amber-400 decoration-2'
              : 'bg-emerald-100 text-emerald-800 underline decoration-emerald-400 decoration-2'
          )}
          title={isPending ? '待确认' : '新增'}
        >
          {chunk.newText}
        </span>
      );

    case 'delete':
      return (
        <span
          className="mr-1 rounded bg-red-50 px-0.5 text-red-400 line-through"
          title="删除"
        >
          {chunk.oldText}
        </span>
      );

    case 'replace':
      return (
        <span className="inline">
          <span
            className="mr-1 rounded bg-red-50 px-0.5 text-red-400 line-through"
            title="原文"
          >
            {chunk.oldText}
          </span>
          <span
            className={cn(
              'rounded px-0.5 font-medium',
              isPending
                ? 'bg-amber-100 text-amber-800 underline decoration-amber-400 decoration-2'
                : 'bg-sky-100 text-sky-800 underline decoration-sky-400 decoration-2'
            )}
            title={isPending ? '改写（待确认）' : '改写'}
          >
            {chunk.newText}
          </span>
        </span>
      );
  }
}

// ============================================
// 单条 Bullet Diff
// ============================================

interface BulletDiffViewProps {
  diff: BulletDiff;
  index: number;
  showOriginal?: boolean;
}

export function BulletDiffView({ diff, index, showOriginal = false }: BulletDiffViewProps) {
  const confidenceIcon = useMemo(() => {
    switch (diff.confidence) {
      case 'verified':
        return <Check className="h-3.5 w-3.5 text-emerald-500" />;
      case 'pending_supplement':
        return <HelpCircle className="h-3.5 w-3.5 text-amber-500" />;
      case 'pending_confirm':
        return <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />;
    }
  }, [diff.confidence]);

  const confidenceLabel = useMemo(() => {
    switch (diff.confidence) {
      case 'verified':
        return '已核实';
      case 'pending_supplement':
        return '待补充';
      case 'pending_confirm':
        return '待确认';
    }
  }, [diff.confidence]);

  const changeTypeLabel: Record<ChangeType, string> = {
    keep: '保留',
    polish: '润色',
    restructure: '重组',
    terminology: '术语',
    strengthen: '强化',
    pending: '待补',
  };

  const changeTypeColor: Record<ChangeType, string> = {
    keep: 'bg-zinc-100 text-zinc-600',
    polish: 'bg-blue-50 text-blue-600',
    restructure: 'bg-violet-50 text-violet-600',
    terminology: 'bg-cyan-50 text-cyan-600',
    strengthen: 'bg-emerald-50 text-emerald-600',
    pending: 'bg-amber-50 text-amber-600',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-3.5 transition-colors',
        diff.hasChanges
          ? 'border-zinc-200 bg-white'
          : 'border-transparent bg-zinc-50/50'
      )}
    >
      {/* Meta header */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-400">#{index + 1}</span>
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
            changeTypeColor[diff.changeType]
          )}
        >
          {changeTypeLabel[diff.changeType]}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {confidenceIcon}
          <span className="text-[10px] text-zinc-400">{confidenceLabel}</span>
        </div>
      </div>

      {/* Original text (optional) */}
      {showOriginal && diff.hasChanges && (
        <div className="mb-2 rounded bg-zinc-50 px-2.5 py-2 text-xs text-zinc-400 line-through">
          {diff.chunks
            .filter((c) => c.type !== 'insert')
            .map((c, i) => (
              <span key={`orig-${i}`}>{c.oldText || c.newText}</span>
            ))}
        </div>
      )}

      {/* Optimized text with diff highlights */}
      <div className="text-sm leading-relaxed text-zinc-800">
        {diff.chunks.map((chunk, i) => (
          <ChunkRenderer
            key={`chunk-${diff.bulletIndex}-${i}`}
            chunk={chunk}
            confidence={diff.confidence}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// 完整 Diff 视图
// ============================================

interface DiffViewProps {
  originalBullets: string[];
  optimizedBullets: Array<{
    original: string;
    optimized: string;
    changeType: ChangeType;
    confidence: ConfidenceLevel;
  }>;
  showOriginal?: boolean;
  className?: string;
}

export function DiffView({
  originalBullets,
  optimizedBullets,
  showOriginal = false,
  className,
}: DiffViewProps) {
  const diffs = useMemo(() => {
    return optimizedBullets.map((opt, i) =>
      diffBullet(
        originalBullets[i] || '',
        opt.optimized,
        i,
        opt.changeType,
        opt.confidence
      )
    );
  }, [originalBullets, optimizedBullets]);

  return (
    <div className={cn('space-y-3', className)}>
      {diffs.map((diff, i) => (
        <BulletDiffView
          key={diff.bulletIndex}
          diff={diff}
          index={i}
          showOriginal={showOriginal}
        />
      ))}
    </div>
  );
}

// ============================================
// 极简对比行（用于列表预览）
// ============================================

interface InlineDiffProps {
  original: string;
  optimized: string;
  className?: string;
}

export function InlineDiff({ original, optimized, className }: InlineDiffProps) {
  const diff = useMemo(() => diffBullet(original, optimized, 0, 'polish', 'verified'), [original, optimized]);

  return (
    <span className={cn('inline', className)}>
      {diff.chunks.map((chunk, i) => (
        <ChunkRenderer key={i} chunk={chunk} confidence="verified" />
      ))}
    </span>
  );
}
