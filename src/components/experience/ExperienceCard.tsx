import { cn } from '@/lib/utils';
import type {
  Education,
  Experience,
  Project,
  Award,
  Certification,
  Skill,
} from '@/types/resume';
import {
  Briefcase,
  GraduationCap,
  Trophy,
  Award as AwardIcon,
  FileCheck,
  Code2,
  Pencil,
  Trash2,
  Star,
  Wand2,
} from 'lucide-react';

type ExperienceItem =
  | ({ kind: 'education' } & Education)
  | ({ kind: 'experience' } & Experience)
  | ({ kind: 'project' } & Project)
  | ({ kind: 'award' } & Award)
  | ({ kind: 'certification' } & Certification)
  | ({ kind: 'skill' } & Skill);

const kindConfig = {
  education: { label: '教育', icon: GraduationCap, color: 'bg-slate-50 text-slate-600' },
  experience: { label: '实习', icon: Briefcase, color: 'bg-slate-50 text-slate-600' },
  project: { label: '项目', icon: Code2, color: 'bg-slate-50 text-slate-600' },
  award: { label: '获奖', icon: Trophy, color: 'bg-slate-50 text-slate-600' },
  certification: { label: '证书', icon: FileCheck, color: 'bg-slate-50 text-slate-600' },
  skill: { label: '技能', icon: AwardIcon, color: 'bg-slate-50 text-slate-600' },
};

interface ExperienceCardProps {
  item: ExperienceItem;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExperienceCard({
  item,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: ExperienceCardProps) {
  const config = kindConfig[item.kind];
  const Icon = config.icon;
  const hasOptimized = (item.kind === 'experience' || item.kind === 'project') && (item as Experience | Project).optimizedVersion;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative cursor-pointer rounded-card border bg-white p-4 transition-all',
        'hover:shadow-card-hover',
        isSelected
          ? 'border-zinc-400 shadow-card-hover'
          : 'border-zinc-200 hover:border-zinc-300'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-micro font-medium', config.color)}>
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
          {item.kind === 'experience' && item.featured && (
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          )}
          {item.kind === 'project' && item.featured && (
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          )}
          {hasOptimized && (
            <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0 text-[10px] font-medium text-blue-600">
              <Wand2 className="h-2.5 w-2.5" />
              已生成推荐版
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-2.5 space-y-0.5">
        <CardContent item={item} />
      </div>

      {/* Tags */}
      {(item.kind === 'experience' || item.kind === 'project') && item.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="tag"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CardContent({ item }: { item: ExperienceItem }) {
  switch (item.kind) {
    case 'education':
      return (
        <>
          <h3 className="text-caption font-semibold text-zinc-900">{item.school}</h3>
          <p className="text-small text-zinc-600">
            {item.degree} · {item.major}
          </p>
          {(item.gpa || item.ranking) && (
            <p className="text-micro text-zinc-500">
              {item.gpa && `GPA: ${item.gpa}`}
              {item.gpa && item.ranking && ' · '}
              {item.ranking && `排名: ${item.ranking}`}
            </p>
          )}
          <p className="text-micro text-zinc-400">
            {item.startDate} — {item.endDate || '至今'}
          </p>
        </>
      );

    case 'experience':
      return (
        <>
          <h3 className="text-caption font-semibold text-zinc-900">{item.company}</h3>
          <p className="text-small text-zinc-600">{item.role}</p>
          <p className="text-micro text-zinc-400">
            {item.startDate} — {item.endDate || '至今'}
            {item.location && ` · ${item.location}`}
          </p>
          {item.bullets.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {item.bullets.slice(0, 2).map((b, i) => (
                <li key={i} className="text-micro text-zinc-500 line-clamp-2">
                  · {b}
                </li>
              ))}
              {item.bullets.length > 2 && (
                <li className="text-micro text-zinc-400">...等 {item.bullets.length} 条描述</li>
              )}
            </ul>
          )}
        </>
      );

    case 'project':
      return (
        <>
          <h3 className="text-caption font-semibold text-zinc-900">{item.name}</h3>
          <p className="text-small text-zinc-600">{item.role}</p>
          <p className="text-micro text-zinc-400">
            {item.startDate} — {item.endDate || '至今'}
          </p>
          {item.outcome && (
            <p className="text-micro font-medium text-emerald-600">{item.outcome}</p>
          )}
          {item.bullets.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {item.bullets.slice(0, 2).map((b, i) => (
                <li key={i} className="text-micro text-zinc-500 line-clamp-2">
                  · {b}
                </li>
              ))}
              {item.bullets.length > 2 && (
                <li className="text-micro text-zinc-400">...等 {item.bullets.length} 条描述</li>
              )}
            </ul>
          )}
        </>
      );

    case 'award':
      return (
        <>
          <h3 className="text-caption font-semibold text-zinc-900">{item.name}</h3>
          {item.level && <p className="text-micro text-zinc-500">级别: {item.level}</p>}
          {item.issuer && <p className="text-micro text-zinc-500">颁发: {item.issuer}</p>}
          {item.ranking && <p className="text-micro font-medium text-amber-600">{item.ranking}</p>}
          {item.date && <p className="text-micro text-zinc-400">{item.date}</p>}
        </>
      );

    case 'certification':
      return (
        <>
          <h3 className="text-caption font-semibold text-zinc-900">{item.name}</h3>
          <p className="text-small text-zinc-600">{item.issuer}</p>
          <p className="text-micro text-zinc-400">
            {item.date}
            {item.expiryDate && ` · 有效期至 ${item.expiryDate}`}
          </p>
        </>
      );

    case 'skill':
      return (
        <>
          <h3 className="text-caption font-semibold text-zinc-900">{item.name}</h3>
          <div className="flex items-center gap-2">
            {item.category && (
              <span className="text-micro text-zinc-500">{item.category}</span>
            )}
            {item.proficiency && (
              <span className="tag">
                {item.proficiency}
              </span>
            )}
          </div>
          {item.level && (
            <div className="mt-1.5 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 w-5 rounded-full',
                    i < item.level! ? 'bg-zinc-700' : 'bg-zinc-200'
                  )}
                />
              ))}
            </div>
          )}
        </>
      );
  }
}
