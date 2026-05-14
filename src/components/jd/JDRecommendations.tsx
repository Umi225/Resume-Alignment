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
  Wand2,
  CheckSquare,
  Square,
  FileText,
} from 'lucide-react';
import type { Experience, Project } from '@/types/resume';

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

function getAssetId(result: AssetMatchResult): string {
  return (result.asset as { id: string }).id;
}

function getAssetBullets(result: AssetMatchResult): string[] {
  if (result.kind === 'experience' || result.kind === 'project') {
    return (result.asset as Experience | Project).bullets;
  }
  return [];
}

interface JDRecommendationsProps {
  matches: AssetMatchResult[];
  optimizedIds?: string[];
  selectedIds?: string[];
  onGenerateOptimize?: (asset: Experience | Project, kind: 'experience' | 'project') => void;
  onToggleSelect?: (id: string) => void;
}

export function JDRecommendations({
  matches,
  optimizedIds = [],
  selectedIds = [],
  onGenerateOptimize,
  onToggleSelect,
}: JDRecommendationsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showOriginalFor, setShowOriginalFor] = useState<Set<string>>(new Set());

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-zinc-300 py-12 text-center">
        <Target className="mx-auto h-7 w-7 text-zinc-300" />
        <p className="mt-2 text-small text-zinc-500">暂无匹配结果</p>
        <p className="mt-1 text-micro text-zinc-400">请先粘贴 JD 并点击分析</p>
      </div>
    );
  }

  const toggleOriginal = (id: string) => {
    setShowOriginalFor((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-small font-medium text-zinc-700">
          共 {matches.length} 条匹配结果
        </span>
      </div>

      <div className="space-y-2">
        {matches.map((result) => {
          const config = kindConfig[result.kind];
          const Icon = config.icon;
          const assetId = getAssetId(result);
          const isExpanded = expandedId === `${result.kind}-${assetId}`;
          const isOptimized = optimizedIds.includes(assetId);
          const isSelected = selectedIds.includes(assetId);
          const canOptimize = result.kind === 'experience' || result.kind === 'project';
          const optimizedVersion =
            canOptimize
              ? (result.asset as Experience | Project).optimizedVersion
              : undefined;
          const showOriginal = showOriginalFor.has(assetId);

          return (
            <div
              key={`${result.kind}-${assetId}`}
              className={cn(
                'rounded-card border bg-white transition-all',
                isSelected ? 'border-zinc-900' : 'border-zinc-200'
              )}
            >
              {/* Header */}
              <div className="flex w-full items-start gap-3 p-3">
                <span
                  className={cn(
                    'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    config.bg
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', config.color)} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-caption font-medium text-zinc-900 truncate">
                      {getAssetTitle(result)}
                    </span>
                    <span className={cn('rounded px-1.5 py-0 text-micro', config.bg, config.color)}>
                      {config.label}
                    </span>
                  </div>
                  {getAssetSubtitle(result) && (
                    <p className="text-micro text-zinc-500 truncate">{getAssetSubtitle(result)}</p>
                  )}

                  {/* Match score + keywords */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <MatchScore score={result.score} size="sm" showLabel={true} />
                    {result.matchedKeywords.slice(0, 3).map((kw) => (
                      <span
                        key={kw}
                        className="rounded bg-emerald-50 px-1.5 py-0 text-[10px] font-medium text-emerald-700"
                      >
                        {kw}
                      </span>
                    ))}
                    {result.matchedKeywords.length > 3 && (
                      <span className="text-micro text-zinc-400">
                        +{result.matchedKeywords.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* 勾选框 */}
                {isOptimized && (
                  <button
                    onClick={() => onToggleSelect?.(assetId)}
                    className="shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-zinc-900" />
                    ) : (
                      <Square className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
                    )}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-zinc-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  {canOptimize && !isOptimized && (
                    <button
                      onClick={() => {
                        const kind = result.kind as 'experience' | 'project';
                        onGenerateOptimize?.(result.asset as Experience | Project, kind);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-micro font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <Sparkles className="h-3 w-3" />
                      生成推荐版本
                    </button>
                  )}
                  {isOptimized && (
                    <span className="inline-flex items-center gap-1 text-micro text-blue-600">
                      <Wand2 className="h-3 w-3" />
                      已生成推荐版
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : `${result.kind}-${assetId}`)
                  }
                  className="flex items-center gap-0.5 text-micro text-zinc-400 hover:text-zinc-600"
                >
                  {isExpanded ? (
                    <>收起 <ChevronUp className="h-3.5 w-3.5" /></>
                  ) : (
                    <>展开 <ChevronDown className="h-3.5 w-3.5" /></>
                  )}
                </button>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-zinc-100 px-3 py-3 space-y-3">
                  {/* AI 推荐版本 — 主展示 */}
                  {optimizedVersion && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-micro font-semibold text-blue-700">
                          AI 推荐版本
                        </p>
                        {optimizedVersion.jdScore !== undefined && (
                          <span className="text-[10px] font-medium text-blue-600">
                            匹配度 {optimizedVersion.jdScore}%
                          </span>
                        )}
                      </div>
                      <div className="text-micro leading-relaxed text-zinc-700 whitespace-pre-line">
                        {optimizedVersion.content}
                      </div>
                      {optimizedVersion.highlights && optimizedVersion.highlights.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {optimizedVersion.highlights.map((h) => (
                            <span
                              key={h}
                              className="rounded bg-white px-1.5 py-0 text-[10px] font-medium text-emerald-700 border border-emerald-200"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 原始经历 — 可折叠 */}
                  {canOptimize && getAssetBullets(result).length > 0 && (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <button
                        onClick={() => toggleOriginal(assetId)}
                        className="flex items-center gap-1.5 text-micro font-medium text-zinc-500 hover:text-zinc-700 mb-2"
                      >
                        <FileText className="h-3 w-3" />
                        原始经历
                        {showOriginal ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                      {showOriginal && (
                        <ul className="space-y-1">
                          {getAssetBullets(result).map((b, i) => (
                            <li
                              key={i}
                              className="text-micro leading-relaxed text-zinc-500"
                            >
                              · {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* 匹配详情 */}
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
    </div>
  );
}
