'use client';

import { useMemo } from 'react';
import { useResumeStore } from '@/stores/resumeStore';
import { ExperienceCard } from './ExperienceCard';
import type {
  Education,
  Experience,
  Project,
  Award,
  Certification,
  Skill,
} from '@/types/resume';

interface FlatItem {
  id: string;
  kind: string;
  data: Education | Experience | Project | Award | Certification | Skill;
  sortDate: string;
}

interface ExperienceListProps {
  searchQuery?: string;
}

export function ExperienceList({ searchQuery = '' }: ExperienceListProps) {
  const {
    profile,
    filterType,
    selectedId,
    selectExperience,
    removeEducation,
    removeExperience,
    removeProject,
    removeAward,
    removeCertification,
    removeSkill,
  } = useResumeStore();

  const items = useMemo(() => {
    const flat: FlatItem[] = [];

    const shouldInclude = (kind: string) => !filterType || filterType === kind;

    if (shouldInclude('education')) {
      profile.education.forEach((d) =>
        flat.push({ id: d.id, kind: 'education', data: d, sortDate: d.startDate })
      );
    }
    if (shouldInclude('experience')) {
      profile.experience.forEach((d) =>
        flat.push({ id: d.id, kind: 'experience', data: d, sortDate: d.startDate })
      );
    }
    if (shouldInclude('project')) {
      profile.projects.forEach((d) =>
        flat.push({ id: d.id, kind: 'project', data: d, sortDate: d.startDate })
      );
    }
    if (shouldInclude('award')) {
      profile.awards.forEach((d) =>
        flat.push({ id: d.id, kind: 'award', data: d, sortDate: d.date || '' })
      );
    }
    if (shouldInclude('certification')) {
      profile.certifications.forEach((d) =>
        flat.push({ id: d.id, kind: 'certification', data: d, sortDate: d.date })
      );
    }
    if (shouldInclude('skill')) {
      profile.skills.forEach((d) =>
        flat.push({ id: d.id, kind: 'skill', data: d, sortDate: '' })
      );
    }

    // 搜索过滤
    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? flat.filter((item) => {
          const data = item.data as any;
          const fields = ['name', 'company', 'school', 'role', 'major', 'degree', 'issuer'];
          return fields.some((f) => data[f]?.toLowerCase?.().includes(query));
        })
      : flat;

    // 按时间倒序，无时间的放最后
    return filtered.sort((a, b) => {
      if (!a.sortDate && !b.sortDate) return 0;
      if (!a.sortDate) return 1;
      if (!b.sortDate) return -1;
      return b.sortDate.localeCompare(a.sortDate);
    });
  }, [profile, filterType, searchQuery]);

  const handleDelete = (kind: string, id: string) => {
    if (!confirm('确定要删除这条经历吗？')) return;
    switch (kind) {
      case 'education':
        removeEducation(id);
        break;
      case 'experience':
        removeExperience(id);
        break;
      case 'project':
        removeProject(id);
        break;
      case 'award':
        removeAward(id);
        break;
      case 'certification':
        removeCertification(id);
        break;
      case 'skill':
        removeSkill(id);
        break;
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-zinc-300 py-20 text-center">
        <p className="text-body text-zinc-500">暂无经历</p>
        <p className="mt-1 text-small text-zinc-400">点击右上角按钮添加第一条经历</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {items.map((item) => (
        <ExperienceCard
          key={`${item.kind}-${item.id}`}
          item={{ kind: item.kind, ...item.data } as never}
          isSelected={selectedId === item.id}
          onClick={() => selectExperience(item.id, item.kind)}
          onEdit={() => selectExperience(item.id, item.kind)}
          onDelete={() => handleDelete(item.kind, item.id)}
        />
      ))}
    </div>
  );
}
