'use client';

import { useState } from 'react';
import type { AssetMatchResult, AssetKind } from '@/lib/jdMatcher';
import { MatchScore } from './MatchScore';
import { cn } from '@/lib/utils';
import {
  GraduationCap,
  Briefcase,
  Code2,
  Trophy,
  FileCheck,
  Award,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
} from 'lucide-react';

const kindConfig: Record<
  AssetKind,
  { label: string; icon: typeof Briefcase; color: string; bg: string }
> = {
  education: {
    label: '教育',
    icon: GraduationCap,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
  },
  experience: {
    label: '实习',
    icon: Briefcase,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
  },
  project: {
    label: '项目',
    icon: Code2,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
  },
  award: {
    label: '获奖',
    icon: Trophy,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
  },
  certification: {
    label: '证书',
    icon: FileCheck,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
  },
  skill: {
    label: '技能',
    icon: Award,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
  },
};

function getAssetTitle(result: AssetMatchResult): string {
  switch (result.kind) {
    case 'education':
      return (result.asset as { school: string }).school;
    case 'experience':
      return (result.asset as { company: string }).company;
    case 'project':
      return (result.asset as { name: string }).name;
    case 'award':
      return (result.asset as { name: string }).name;
    case 'certification':
      return (result.asset as { name: string }).name;
    case 'skill':
      return (result.asset as { name: string }).name;
  }
}

function getAssetSubtitle(result: AssetMatchResult): string {
  switch (result.kind) {
    case 'education':
      return `${(result.asset as { degree: string }).degree} · ${(result.asset as { major: string }).major}`;
    case 'experience':
      return (result.asset as { role: string }).role;
    case 'project':
      return (result.asset as { role: string }).role;
    case 'award':
      return (result.asset as { level?: string }).level || '';
    case 'certification':
      return (result.asset as { issuer: string }).issuer;
    case 'skill':
      return (result.asset as { category?: string }).category || '';
  }
}

interface JDRecommendationsProps {
  matches: AssetMatchResult[];
}

export function JDRecommendations({ matches }: JDRecommendationsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-zinc-300 py-12 text-center">
        <Target className="mx-auto h-7 w-7 text-zinc-300" />
        <p className="mt-2 text-small text-zinc-500">暂无匹配结果</p>
        <p className="mt-1 text-micro text-zinc-400">请先粘贴 JD 并点击分析</p>
      </div>
    );
  }

  const highMatches = matches.filter((m) => m.score >= 40);
  const lowMatches = matches.filter((m) => m.score < 40);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between px-1">
        <span className="text-small font-medium text-zinc-700">
          共 {matches.length} 条 · 高匹配 {highMatches.length} 条
        </span>
      </div>

      {/* Match list */}
      <div className="space-y-2">
        {matches.map((result) => {
          const config = kindConfig[result.kind];
          const Icon = config.icon;
          const isExpanded = expandedId === `${result.kind}-${getAssetTitle(result)}`;

          return (
            <div
              key={`${result.kind}-${getAssetTitle(result)}`}
              className={cn(
                'rounded-card border bg-white transition-all',
                result.score >= 60
                  ? 'border-zinc-300'
                  : 'border-zinc-200'
              )}
            >
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : `${result.kind}-${getAssetTitle(result)}`)
                }
                className="flex w-full items-start gap-3 p-3 text-left"
              >
                {/* Kind badge */}
                <span
                  className={cn(
                    'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    config.bg
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', config.color)} />
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-caption font-medium text-zinc-900 truncate">{getAssetTitle(result)}</span>
                    <span className={cn('rounded px-1.5 py-0 text-micro', config.bg, config.color)}>
                      {config.label}
                    </span>
                  </div>
                  {getAssetSubtitle(result) && (
                    <p className="text-micro text-zinc-500 truncate">{getAssetSubtitle(result)}</p>
                  )}

                  {/* Matched keywords */}
                  {result.matchedKeywords.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {result.matchedKeywords.slice(0, 4).map((kw) => (
                        <span
                          key={kw}
                          className="rounded bg-emerald-50 px-1.5 py-0 text-[10px] font-medium text-emerald-700"
                        >
                          {kw}
                        </span>
                      ))}
                      {result.matchedKeywords.length > 4 && (
                        <span className="text-micro text-zinc-400">+{result.matchedKeywords.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Score + expand */}
                <div className="flex shrink-0 items-center gap-1">
                  <MatchScore score={result.score} size="sm" showLabel={false} />
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-zinc-100 px-3 py-3">
                  {/* Reason */}
                  <div className="mb-3 flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                    <p className="text-micro leading-relaxed text-zinc-600">{result.reason}</p>
                  </div>

                  {/* Match details */}
                  {result.details.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-micro font-semibold uppercase tracking-wider text-zinc-400">
                        匹配详情
                      </p>
                      {result.details.slice(0, 6).map((detail, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-lg bg-zinc-50 px-2.5 py-1.5"
                        >
                          <span className="rounded bg-white px-1.5 py-0 text-micro font-medium text-zinc-700 border border-zinc-200">
                            {detail.keyword}
                          </span>
                          <span className="text-micro text-zinc-400">命中于</span>
                          <span className="text-micro font-medium text-zinc-600">
                            {detail.matchedField}
                          </span>
                        </div>
                      ))}
                      {result.details.length > 6 && (
                        <p className="text-micro text-zinc-400">
                          还有 {result.details.length - 6} 条...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Low match hint */}
      {lowMatches.length > 0 && highMatches.length === 0 && (
        <div className="rounded-card border border-amber-200 bg-amber-50 p-3">
          <p className="text-micro text-amber-700">
            当前经历与 JD 的匹配度较低。建议补充相关经历或优化现有描述中的关键词。
          </p>
        </div>
      )}
    </div>
  );
}
