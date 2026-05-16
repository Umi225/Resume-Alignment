'use client';

import { useState } from 'react';
import type { AssetMatchResult, AssetKind } from '@/lib/jdMatcher';
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
    case 'skill': {
      const s = result.asset as { category?: string; proficiency?: string; description?: string };
      return s.description || s.proficiency || s.category || '';
    }
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

// 基于经历已有内容推断可迁移能力，不虚构
function getTransferableSkills(result: AssetMatchResult): string[] {
  const skills: string[] = [];
  const text = [
    getAssetTitle(result),
    getAssetSubtitle(result),
    ...getAssetBullets(result),
    ...(result.asset as { tags?: string[] }).tags || [],
  ]
    .join(' ')
    .toLowerCase();

  const hints: { keywords: string[]; skill: string }[] = [
    { keywords: ['沟通', '协调', '协作', '合作', '对接', '联系'], skill: '沟通协调' },
    { keywords: ['内容', '文案', '写作', '编辑', '撰写', '文章'], skill: '内容表达' },
    { keywords: ['项目', '推进', '推动', '落地', '执行', '管理'], skill: '项目推进' },
    { keywords: ['用户', '客户', '需求', '体验', '调研'], skill: '用户理解' },
    { keywords: ['组织', '统筹', '安排', '规划', '策划'], skill: '组织协作' },
    { keywords: ['数据', '分析', '指标', '统计', '报表'], skill: '数据意识' },
    { keywords: ['策划', '方案', '活动', '创意', '运营'], skill: '内容策划' },
    { keywords: ['跨文化', '国际', '英文', '英语', '外语', '海外'], skill: '跨文化沟通' },
    { keywords: ['研究', '调研', '分析', '报告', '论文'], skill: '研究分析' },
  ];

  for (const hint of hints) {
    if (hint.keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      if (!skills.includes(hint.skill)) skills.push(hint.skill);
    }
  }

  return skills;
}

// 推荐等级徽章配置
const levelConfig: Record<
  'highly' | 'recommended' | 'optional',
  { label: string; className: string }
> = {
  highly: {
    label: '高度推荐',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  recommended: {
    label: '推荐',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  optional: {
    label: '可选',
    className: 'bg-zinc-50 text-zinc-600 border-zinc-200',
  },
};

// 字段标签映射
const fieldLabels: Record<string, string> = {
  tags: '技术标签',
  bullets: '项目描述',
  name: '名称',
  role: '担任角色',
  company: '公司',
  school: '学校',
  major: '专业',
  department: '部门',
  location: '地点',
  outcome: '项目成果',
  description: '描述',
  level: '级别',
  issuer: '颁发机构',
  courses: '相关课程',
  category: '分类',
  proficiency: '熟练度',
  text: '文本',
};

// 技能/证书类型标签映射
const skillCategoryLabels: Record<string, string> = {
  language: '语言能力',
  tool: '工具能力',
  technical: '岗位相关能力',
  certificate: '专业证书',
  exam: '考试成绩',
};

function getSkillCategoryLabel(result: AssetMatchResult): string {
  if (result.kind === 'skill') {
    const category = (result.asset as { category?: string }).category;
    return skillCategoryLabels[category || ''] || '技能';
  }
  if (result.kind === 'certification') return '专业证书';
  if (result.kind === 'award') return '荣誉奖项';
  if (result.kind === 'education') return '教育背景';
  return kindConfig[result.kind]?.label || '';
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

  const isExperienceLike = (kind: AssetKind) =>
    kind === 'experience' || kind === 'project';

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {matches.map((result) => {
          const config = kindConfig[result.kind];
          const Icon = config.icon;
          const assetId = getAssetId(result);
          const isExpanded = expandedId === `${result.kind}-${assetId}`;
          const isOptimized = optimizedIds.includes(assetId);
          const isSelected = selectedIds.includes(assetId);
          const canSelect = result.kind !== 'education';
          const canOptimize = isExperienceLike(result.kind);
          const optimizedVersion = canOptimize
            ? (result.asset as Experience | Project).optimizedVersion
            : undefined;
          const showOriginal = showOriginalFor.has(assetId);
          const isExp = isExperienceLike(result.kind);
          const level = result.recommendationLevel;
          const advice = result.advice || '';

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
                    {isExp && level && (
                      <span
                        className={cn(
                          'rounded border px-1.5 py-0 text-[10px] font-medium',
                          levelConfig[level].className
                        )}
                      >
                        {levelConfig[level].label}
                      </span>
                    )}
                    {!isExp && (
                      <span
                        className={cn(
                          'rounded border px-1.5 py-0 text-[10px] font-medium bg-slate-50 text-slate-600 border-slate-200'
                        )}
                      >
                        {getSkillCategoryLabel(result)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-micro text-zinc-400">{config.label}</span>
                    {getAssetSubtitle(result) && (
                      <>
                        <span className="text-micro text-zinc-300">|</span>
                        <span className="text-micro text-zinc-500 truncate">
                          {getAssetSubtitle(result)}
                        </span>
                      </>
                    )}
                  </div>
                  {/* 命中关键词 */}
                  {result.matchedKeywords.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <span className="text-micro text-zinc-400">命中 JD：</span>
                      {result.matchedKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded bg-emerald-50 px-1.5 py-0 text-[10px] font-medium text-emerald-700 border border-emerald-200"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-micro text-zinc-400">
                      暂无明显关键词命中
                    </p>
                  )}
                  {advice && (
                    <p className="mt-1 text-micro text-zinc-600 leading-relaxed">
                      {advice}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-zinc-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  {canSelect && (
                    <button
                      onClick={() => onToggleSelect?.(assetId)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-micro font-medium transition-colors',
                        isSelected
                          ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      )}
                    >
                      {isSelected ? (
                        <>取消选择</>
                      ) : (
                        <>选择</>
                      )}
                    </button>
                  )}
                  {canOptimize && (
                    <button
                      onClick={() => {
                        const kind = result.kind as 'experience' | 'project';
                        onGenerateOptimize?.(
                          result.asset as Experience | Project,
                          kind
                        );
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-micro font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <Sparkles className="h-3 w-3" />
                      {isOptimized ? '重新优化' : 'AI 优化'}
                    </button>
                  )}
                  {isOptimized && (
                    <span className="inline-flex items-center gap-1 text-micro text-blue-600">
                      <Wand2 className="h-3 w-3" />
                      已优化
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    setExpandedId(
                      isExpanded ? null : `${result.kind}-${assetId}`
                    )
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
                  {/* 命中详情 */}
                  {result.details.length > 0 && (
                    <div className="rounded-lg border border-zinc-200 bg-white p-3">
                      <p className="text-micro font-medium text-zinc-700 mb-2">
                        关键词命中详情
                      </p>
                      <div className="space-y-1.5">
                        {Object.entries(
                          result.details.reduce((acc, d) => {
                            if (!acc[d.matchedField]) acc[d.matchedField] = new Set();
                            acc[d.matchedField].add(d.keyword);
                            return acc;
                          }, {} as Record<string, Set<string>>)
                        ).map(([field, keywords]) => (
                          <div key={field} className="flex items-start gap-2">
                            <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0 text-[10px] text-zinc-500">
                              {fieldLabels[field] || field}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(keywords).map((k) => (
                                <span key={k} className="text-[11px] text-zinc-600">
                                  {k}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 转行包装建议 */}
                  {isExp && result.score < 40 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                      <p className="text-micro font-semibold text-amber-700 mb-2">
                        转行包装建议
                      </p>
                      {result.matchedKeywords.length === 0 ? (
                        <p className="text-micro text-zinc-600 leading-relaxed">
                          当前与 JD 的直接关联较弱，建议作为补充经历使用，并重点强化可迁移能力。
                        </p>
                      ) : (
                        <>
                          <p className="text-micro text-zinc-600 leading-relaxed mb-2">
                            虽然直接匹配度有限，但该经历仍可从以下方向与目标岗位建立关联：
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {result.matchedKeywords.map((kw) => (
                              <span
                                key={kw}
                                className="rounded bg-white px-1.5 py-0 text-[10px] font-medium text-emerald-700 border border-emerald-200"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                      {(() => {
                        const skills = getTransferableSkills(result);
                        return skills.length > 0 ? (
                          <div className="mt-1">
                            <p className="text-micro text-zinc-500 mb-1">
                              可迁移能力方向：
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {skills.map((s) => (
                                <span
                                  key={s}
                                  className="rounded bg-amber-100 px-1.5 py-0 text-[10px] font-medium text-amber-700 border border-amber-200"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* AI 推荐版本 — 主展示 */}
                  {optimizedVersion && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-micro font-semibold text-blue-700">
                          AI 推荐版本
                        </p>
                      </div>
                      <div className="text-micro leading-relaxed text-zinc-700 whitespace-pre-line">
                        {optimizedVersion.content}
                      </div>
                      {optimizedVersion.highlights &&
                        optimizedVersion.highlights.length > 0 && (
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
