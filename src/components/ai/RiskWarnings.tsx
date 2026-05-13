/**
 * ============================================
 * Risk Warnings 组件
 * ============================================
 *
 * 职责：展示 AI 检测到的风险和待补充项
 *
 * 展示内容：
 * - 缺少量化指标
 * - 描述过于模糊
 * - 动词过弱
 * - 未经验证的声明
 */

'use client';

import { cn } from '@/lib/utils';
import type { RiskWarning, MissingMetric, OptimizationSuggestion } from '@/lib/ai/types';
import {
  AlertTriangle,
  Check,
  HelpCircle,
  Lightbulb,
  TrendingUp,
  AlignLeft,
  Zap,
  Target,
} from 'lucide-react';

// ============================================
// Risk Warning 卡片
// ============================================

interface RiskWarningCardProps {
  warning: RiskWarning;
  index: number;
}

export function RiskWarningCard({ warning, index }: RiskWarningCardProps) {
  const config = {
    missing_quantify: {
      icon: TrendingUp,
      color: 'bg-amber-50 border-amber-200 text-amber-800',
      iconColor: 'text-amber-500',
      label: '缺少量化',
    },
    vague_description: {
      icon: AlignLeft,
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      iconColor: 'text-orange-500',
      label: '描述模糊',
    },
    weak_verb: {
      icon: Zap,
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconColor: 'text-yellow-500',
      label: '动词过弱',
    },
    unverified_claim: {
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200 text-red-800',
      iconColor: 'text-red-500',
      label: '未经验证',
    },
  };

  const c = config[warning.type];
  const Icon = c.icon;

  return (
    <div className={cn('rounded-lg border p-3', c.color)}>
      <div className="flex items-start gap-2.5">
        <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', c.iconColor)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{c.label}</span>
            <span className="text-[10px] text-zinc-400">
              第 {warning.bulletIndex + 1} 条
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed opacity-90">{warning.message}</p>
          {warning.suggestion && (
            <p className="mt-1.5 text-xs opacity-70">
              建议：{warning.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Missing Metric 卡片
// ============================================

interface MissingMetricCardProps {
  metric: MissingMetric;
  index: number;
}

export function MissingMetricCard({ metric, index }: MissingMetricCardProps) {
  const severityConfig = {
    high: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      badge: 'bg-red-100 text-red-700',
      badgeText: '重要',
    },
    medium: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      badge: 'bg-amber-100 text-amber-700',
      badgeText: '建议',
    },
    low: {
      border: 'border-zinc-200',
      bg: 'bg-zinc-50',
      badge: 'bg-zinc-100 text-zinc-600',
      badgeText: '可选',
    },
  };

  const c = severityConfig[metric.severity];

  return (
    <div className={cn('rounded-lg border p-3', c.border, c.bg)}>
      <div className="flex items-start gap-2.5">
        <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-400" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', c.badge)}>
              {c.badgeText}
            </span>
            <span className="text-[10px] text-zinc-400">
              第 {metric.bulletIndex + 1} 条
            </span>
          </div>
          <p className="mt-1.5 text-xs font-medium text-zinc-700">
            {metric.description}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {metric.suggestion}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Optimization Suggestion 卡片
// ============================================

interface SuggestionCardProps {
  suggestion: OptimizationSuggestion;
  index: number;
}

export function SuggestionCard({ suggestion, index }: SuggestionCardProps) {
  const categoryConfig = {
    structure: { icon: AlignLeft, label: '结构', color: 'text-violet-500 bg-violet-50' },
    quantify: { icon: TrendingUp, label: '量化', color: 'text-emerald-500 bg-emerald-50' },
    terminology: { icon: Target, label: '术语', color: 'text-cyan-500 bg-cyan-50' },
    jd_alignment: { icon: Zap, label: 'JD 对齐', color: 'text-amber-500 bg-amber-50' },
    general: { icon: Lightbulb, label: '建议', color: 'text-zinc-500 bg-zinc-50' },
  };

  const c = categoryConfig[suggestion.category];
  const Icon = c.icon;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="flex items-start gap-2.5">
        <div className={cn('rounded-md p-1', c.color)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-700">
              {suggestion.title}
            </span>
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-medium',
                suggestion.priority === 'high'
                  ? 'bg-red-50 text-red-600'
                  : suggestion.priority === 'medium'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-zinc-50 text-zinc-500'
              )}
            >
              {suggestion.priority === 'high' ? '高' : suggestion.priority === 'medium' ? '中' : '低'}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            {suggestion.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 完整风险面板
// ============================================

interface RiskPanelProps {
  warnings: RiskWarning[];
  missingMetrics: MissingMetric[];
  suggestions: OptimizationSuggestion[];
  className?: string;
}

export function RiskPanel({ warnings, missingMetrics, suggestions, className }: RiskPanelProps) {
  const totalIssues = warnings.length + missingMetrics.length;

  return (
    <div className={cn('space-y-5', className)}>
      {/* Warnings */}
      {warnings.length > 0 && (
        <section>
          <h4 className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-zinc-700">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
            风险提示 ({warnings.length})
          </h4>
          <div className="space-y-2">
            {warnings.map((w, i) => (
              <RiskWarningCard key={`risk-${i}`} warning={w} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Missing Metrics */}
      {missingMetrics.length > 0 && (
        <section>
          <h4 className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-zinc-700">
            <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
            待补充 ({missingMetrics.length})
          </h4>
          <div className="space-y-2">
            {missingMetrics.map((m, i) => (
              <MissingMetricCard key={`missing-${i}`} metric={m} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <h4 className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-zinc-700">
            <Lightbulb className="h-3.5 w-3.5 text-zinc-500" />
            优化建议 ({suggestions.length})
          </h4>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <SuggestionCard key={`sugg-${i}`} suggestion={s} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {totalIssues === 0 && suggestions.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-200 py-6 text-center">
          <Check className="mx-auto h-6 w-6 text-emerald-400" />
          <p className="mt-2 text-sm text-zinc-500">未发现明显问题</p>
          <p className="mt-0.5 text-xs text-zinc-400">AI 认为这段经历已经比较完善了</p>
        </div>
      )}
    </div>
  );
}
