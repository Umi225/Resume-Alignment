'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ExperienceList } from '@/components/experience/ExperienceList';
import { ExperienceEditor } from '@/components/experience/ExperienceEditor';
import { useResumeStore } from '@/stores/resumeStore';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  GraduationCap,
  Briefcase,
  Code2,
  Trophy,
  FileCheck,
  Award,
  User,
  Pencil,
  Trash2,
} from 'lucide-react';

const filters = [
  { key: null, label: '全部', icon: null as null },
  { key: 'education', label: '教育', icon: GraduationCap },
  { key: 'experience', label: '实习', icon: Briefcase },
  { key: 'project', label: '项目', icon: Code2 },
  { key: 'award', label: '获奖', icon: Trophy },
  { key: 'certification', label: '证书', icon: FileCheck },
  { key: 'skill', label: '技能', icon: Award },
] as const;

type EditorKind = 'basicInfo' | 'education' | 'experience' | 'project' | 'award' | 'certification' | 'skill';

export default function ExperiencesPage() {
  const { profile, filterType, setFilterType, selectedId, selectedType, selectExperience } = useResumeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKind, setEditorKind] = useState<EditorKind | null>(null);

  const handleAdd = (kind: EditorKind) => {
    setEditorKind(kind);
    selectExperience(null, null);
    setEditorOpen(true);
  };

  const handleEdit = () => {
    if (!selectedId || !selectedType) return;
    setEditorKind(selectedType as EditorKind);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditorKind(null);
  };

  const getCount = (key: string | null) => {
    const safeLen = (arr: unknown[] | undefined) => arr?.length ?? 0;
    if (!key) {
      return (
        safeLen(profile.education) +
        safeLen(profile.experience) +
        safeLen(profile.projects) +
        safeLen(profile.awards) +
        safeLen(profile.certifications) +
        safeLen(profile.skills)
      );
    }
    const map: Record<string, keyof typeof profile> = {
      education: 'education',
      experience: 'experience',
      project: 'projects',
      award: 'awards',
      certification: 'certifications',
      skill: 'skills',
    };
    const field = map[key];
    if (!field) return 0;
    return safeLen(profile[field] as unknown[]);
  };

  const selectedItem = selectedId && selectedType
    ? (selectedType === 'experience'
      ? profile.experience.find(e => e.id === selectedId)
      : selectedType === 'project'
        ? profile.projects.find(p => p.id === selectedId)
        : null)
    : null;

  return (
    <>
      <AppShell
        title="经历资产库"
        rightPanel={
          <RightPanel
            profile={profile}
            selectedItem={selectedItem}
            selectedType={selectedType}
            onEdit={handleEdit}
          />
        }
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-3">
            {/* 搜索 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索经历..."
                className="w-full rounded-button border border-zinc-200 bg-zinc-50 py-[7px] pl-9 pr-3 text-caption text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
              />
            </div>

            {/* 添加按钮 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAdd('experience')}
                className="btn-primary flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                添加经历
              </button>
            </div>
          </div>

          {/* Tabs + 内容 */}
          <div className="flex-1 overflow-auto">
            {/* Tabs */}
            <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-zinc-200 bg-zinc-50/95 px-6 py-2 backdrop-blur-sm">
              {filters.map((f) => {
                const isActive = filterType === f.key;
                const Icon = f.icon;
                const count = getCount(f.key);
                return (
                  <button
                    key={f.label}
                    onClick={() => setFilterType(f.key)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-3 py-[5px] text-caption transition-colors',
                      isActive
                        ? 'bg-zinc-900 font-medium text-white'
                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                    )}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {f.label}
                    <span
                      className={cn(
                        'rounded px-1.5 py-0 text-micro',
                        isActive ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 主内容 */}
            <div className="px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-h3 text-zinc-900">
                    {filters.find((f) => f.key === filterType)?.label || '全部经历'}
                  </h2>
                  <p className="mt-0.5 text-small text-zinc-500">
                    共 {getCount(filterType)} 条原始经历资产
                  </p>
                  <p className="mt-1 text-micro text-zinc-400">
                    此页面仅用于保存和编辑原始经历，AI 不会直接修改任何内容
                  </p>
                </div>
              </div>
              <ExperienceList searchQuery={searchQuery} />
            </div>
          </div>
        </div>
      </AppShell>

      <ExperienceEditor
        isOpen={editorOpen}
        kind={editorKind}
        itemId={selectedId}
        onClose={handleCloseEditor}
      />
    </>
  );
}

// ============================================
// 右侧信息栏
// ============================================

function RightPanel({
  profile,
  selectedItem,
  selectedType,
  onEdit,
}: {
  profile: any;
  selectedItem: any;
  selectedType: string | null;
  onEdit: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* 个人信息摘要 */}
      <div className="border-b border-zinc-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
            {profile.basicInfo.avatar ? (
              <img
                src={profile.basicInfo.avatar}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-zinc-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-caption font-medium text-zinc-900">
              {profile.basicInfo.name || '未填写姓名'}
            </p>
            <p className="truncate text-micro text-zinc-500">
              {profile.basicInfo.email || '未填写邮箱'}
            </p>
          </div>
        </div>
      </div>

      {/* 选中项操作 */}
      {selectedItem ? (
        <div className="flex-1 overflow-auto">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h3 className="text-micro font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              选中经历
            </h3>
            <div className="space-y-2">
              <button
                onClick={onEdit}
                className="btn-ghost w-full flex items-center justify-center gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                编辑
              </button>
            </div>
          </div>

          {/* 选中项预览 */}
          <div className="px-5 py-4">
            <h3 className="text-micro font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              预览
            </h3>
            <div className="rounded-card border border-zinc-200 bg-zinc-50 p-3">
              <SelectedItemPreview item={selectedItem} type={selectedType} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 px-5 py-4">
          <div className="rounded-card border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center">
            <p className="text-small text-zinc-500">选择一条经历以查看详情</p>
            <p className="mt-1 text-micro text-zinc-400">原始经历仅用于保存和编辑</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SelectedItemPreview({ item, type }: { item: any; type: string | null }) {
  if (!item) return null;

  const title = type === 'experience' ? item.company : type === 'project' ? item.name : item.school || item.name || '';
  const subtitle = type === 'experience' ? item.role : type === 'project' ? item.role : item.degree || '';

  return (
    <div className="space-y-1">
      <p className="text-caption font-medium text-zinc-900 truncate">{title}</p>
      {subtitle && <p className="text-micro text-zinc-500 truncate">{subtitle}</p>}
      {item.bullets && item.bullets.length > 0 && (
        <ul className="mt-2 space-y-1">
          {item.bullets.slice(0, 2).map((b: string, i: number) => (
            <li key={i} className="text-micro text-zinc-500 line-clamp-2">
              &middot; {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
