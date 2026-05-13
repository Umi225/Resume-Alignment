'use client';

import { useState, useEffect, useCallback } from 'react';
import { useResumeStore } from '@/stores/resumeStore';
import { cn } from '@/lib/utils';
import { X, Plus, Trash2 } from 'lucide-react';
import type {
  Education,
  Experience,
  Project,
  Award,
  Certification,
  Skill,
  Degree,
  ProjectType,
  AwardLevel,
  SkillCategory,
  ProficiencyLevel,
} from '@/types/resume';

type EditorKind =
  | 'basicInfo'
  | 'education'
  | 'experience'
  | 'project'
  | 'award'
  | 'certification'
  | 'skill';

const kindLabels: Record<EditorKind, string> = {
  basicInfo: '个人信息',
  education: '教育经历',
  experience: '实习/工作经历',
  project: '项目经历',
  award: '荣誉奖项',
  certification: '证书认证',
  skill: '技能',
};

interface ExperienceEditorProps {
  isOpen: boolean;
  kind: EditorKind | null;
  itemId: string | null;
  onClose: () => void;
}

export function ExperienceEditor({ isOpen, kind, itemId, onClose }: ExperienceEditorProps) {
  const store = useResumeStore();
  const [tab, setTab] = useState<EditorKind>('basicInfo');

  useEffect(() => {
    if (kind) setTab(kind);
  }, [kind]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  const isEdit = !!itemId;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={handleBackdropClick}
    >
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              {isEdit ? '编辑' : '添加'}{kindLabels[tab]}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs (only when creating new) */}
        {!isEdit && (
          <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 px-6 py-2"
          >
            {(Object.keys(kindLabels) as EditorKind[]).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  tab === k
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                )}
              >
                {kindLabels[k]}
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5"
        >
          <FormByKind
            kind={tab}
            itemId={itemId}
            onSaved={() => {
              onClose();
              store.selectExperience(null, null);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Form by Kind
// ============================================

function FormByKind({
  kind,
  itemId,
  onSaved,
}: {
  kind: EditorKind;
  itemId: string | null;
  onSaved: () => void;
}) {
  const store = useResumeStore();

  switch (kind) {
    case 'basicInfo':
      return <BasicInfoForm onSaved={onSaved} />;
    case 'education':
      return (
        <EducationForm
          initial={store.profile.education.find((d) => d.id === itemId)}
          onSaved={onSaved}
        />
      );
    case 'experience':
      return (
        <ExperienceForm
          initial={store.profile.experience.find((d) => d.id === itemId)}
          onSaved={onSaved}
        />
      );
    case 'project':
      return (
        <ProjectForm
          initial={store.profile.projects.find((d) => d.id === itemId)}
          onSaved={onSaved}
        />
      );
    case 'award':
      return (
        <AwardForm
          initial={store.profile.awards.find((d) => d.id === itemId)}
          onSaved={onSaved}
        />
      );
    case 'certification':
      return (
        <CertificationForm
          initial={store.profile.certifications.find((d) => d.id === itemId)}
          onSaved={onSaved}
        />
      );
    case 'skill':
      return (
        <SkillForm
          initial={store.profile.skills.find((d) => d.id === itemId)}
          onSaved={onSaved}
        />
      );
  }
}

// ============================================
// Form Components
// ============================================

function BasicInfoForm({ onSaved }: { onSaved: () => void }) {
  const { profile, updateBasicInfo } = useResumeStore();
  const [info, setInfo] = useState(profile.basicInfo);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setInfo((prev) => ({ ...prev, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateBasicInfo(info);
    onSaved();
  };

  return (
    <div className="space-y-4"
    >
      {/* Avatar */}
      <div className="flex items-center gap-4"
      >
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-zinc-200"
        >
          {info.avatar ? (
            <img src={info.avatar} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500"
            >
              头像
            </div>
          )}
        </div>
        <label className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          上传头像
        </label>
      </div>

      <TextField label="姓名" value={info.name} onChange={(v) => setInfo({ ...info, name: v })} />
      <TextField label="电话" value={info.phone} onChange={(v) => setInfo({ ...info, phone: v })} />
      <TextField label="邮箱" value={info.email} onChange={(v) => setInfo({ ...info, email: v })} />
      <TextField
        label="所在城市"
        value={info.location || ''}
        onChange={(v) => setInfo({ ...info, location: v })}
        placeholder="如：北京"
      />
      <TextField
        label="个人总结"
        value={info.summary || ''}
        onChange={(v) => setInfo({ ...info, summary: v })}
        placeholder="一句话描述你的优势或求职意向"
      />
      <TextField
        label="GitHub"
        value={info.github || ''}
        onChange={(v) => setInfo({ ...info, github: v })}
        placeholder="https://github.com/username"
      />

      <div className="pt-4"
      >
        <button
          onClick={handleSave}
          className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          保存
        </button>
      </div>
    </div>
  );
}

function EducationForm({
  initial,
  onSaved,
}: {
  initial?: Education;
  onSaved: () => void;
}) {
  const { addEducation, updateEducation } = useResumeStore();
  const [data, setData] = useState<Partial<Education>>({
    school: initial?.school || '',
    degree: initial?.degree || '本科',
    major: initial?.major || '',
    gpa: initial?.gpa || '',
    ranking: initial?.ranking || '',
    startDate: initial?.startDate || '',
    endDate: initial?.endDate || '',
    location: initial?.location || '',
    courses: initial?.courses ? [...initial.courses] : [],
  });

  const handleSave = () => {
    if (!data.school || !data.degree || !data.major || !data.startDate) return;
    const payload = data as Omit<Education, 'id'>;
    if (initial) {
      updateEducation(initial.id, payload);
    } else {
      addEducation(payload);
    }
    onSaved();
  };

  return (
    <div className="space-y-4"
    >
      <TextField label="学校 *" value={data.school || ''} onChange={(v) => setData({ ...data, school: v })} />
      <SelectField
        label="学历 *"
        value={data.degree || '本科'}
        options={['博士', '硕士', '本科', '专科', '高中', '其他']}
        onChange={(v) => setData({ ...data, degree: v as Degree })}
      />
      <TextField label="专业 *" value={data.major || ''} onChange={(v) => setData({ ...data, major: v })} />
      <div className="grid grid-cols-2 gap-3"
      >
        <TextField label="GPA" value={data.gpa || ''} onChange={(v) => setData({ ...data, gpa: v })} placeholder="3.8/4.0" />
        <TextField label="排名" value={data.ranking || ''} onChange={(v) => setData({ ...data, ranking: v })} placeholder="前 5%" />
      </div>
      <div className="grid grid-cols-2 gap-3"
      >
        <TextField label="开始时间 *" value={data.startDate || ''} onChange={(v) => setData({ ...data, startDate: v })} placeholder="YYYY-MM" />
        <TextField label="结束时间" value={data.endDate || ''} onChange={(v) => setData({ ...data, endDate: v })} placeholder="YYYY-MM 或留空" />
      </div>
      <TextField label="所在地" value={data.location || ''} onChange={(v) => setData({ ...data, location: v })} />
      <TagInput
        label="相关课程"
        tags={data.courses || []}
        onChange={(tags) => setData({ ...data, courses: tags })}
        placeholder="输入课程名按回车"
      />
      <SaveButton onClick={handleSave} disabled={!data.school || !data.major || !data.startDate} />
    </div>
  );
}

function ExperienceForm({
  initial,
  onSaved,
}: {
  initial?: Experience;
  onSaved: () => void;
}) {
  const { addExperience, updateExperience } = useResumeStore();
  const [data, setData] = useState<Partial<Experience>>({
    company: initial?.company || '',
    role: initial?.role || '',
    department: initial?.department || '',
    startDate: initial?.startDate || '',
    endDate: initial?.endDate || '',
    location: initial?.location || '',
    bullets: initial?.bullets ? [...initial.bullets] : [''],
    tags: initial?.tags ? [...initial.tags] : [],
    featured: initial?.featured || false,
  });

  const handleSave = () => {
    if (!data.company || !data.role || !data.startDate) return;
    const bullets = (data.bullets || []).filter((b) => b.trim());
    const payload = { ...data, bullets } as Omit<Experience, 'id'>;
    if (initial) {
      updateExperience(initial.id, payload);
    } else {
      addExperience(payload);
    }
    onSaved();
  };

  return (
    <div className="space-y-4"
    >
      <TextField label="公司/组织 *" value={data.company || ''} onChange={(v) => setData({ ...data, company: v })} />
      <TextField label="职位 *" value={data.role || ''} onChange={(v) => setData({ ...data, role: v })} />
      <TextField label="部门" value={data.department || ''} onChange={(v) => setData({ ...data, department: v })} />
      <div className="grid grid-cols-2 gap-3"
      >
        <TextField label="开始时间 *" value={data.startDate || ''} onChange={(v) => setData({ ...data, startDate: v })} placeholder="YYYY-MM" />
        <TextField label="结束时间" value={data.endDate || ''} onChange={(v) => setData({ ...data, endDate: v })} placeholder="YYYY-MM 或留空" />
      </div>
      <TextField label="地点" value={data.location || ''} onChange={(v) => setData({ ...data, location: v })} />

      <div className="space-y-2"
      >
        <label className="text-xs font-medium text-zinc-700"
        >工作描述</label>
        {(data.bullets || ['']).map((bullet, i) => (
          <div key={i} className="flex gap-2"
          >
            <textarea
              value={bullet}
              onChange={(e) => {
                const arr = [...(data.bullets || [])];
                arr[i] = e.target.value;
                setData({ ...data, bullets: arr });
              }}
              rows={2}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
              placeholder="描述你的职责和成果（建议使用动词 + 量化结果）"
            />
            <button
              onClick={() => {
                const arr = [...(data.bullets || [])];
                arr.splice(i, 1);
                setData({ ...data, bullets: arr.length ? arr : [''] });
              }}
              className="self-start rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setData({ ...data, bullets: [...(data.bullets || []), ''] })}
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          <Plus className="h-3.5 w-3.5" />
          添加描述
        </button>
      </div>

      <TagInput
        label="技能标签"
        tags={data.tags || []}
        onChange={(tags) => setData({ ...data, tags })}
        placeholder="如 Go, Redis, 微服务"
      />

      <label className="flex items-center gap-2"
      >
        <input
          type="checkbox"
          checked={data.featured}
          onChange={(e) => setData({ ...data, featured: e.target.checked })}
          className="h-4 w-4 rounded border-zinc-300"
        />
        <span className="text-sm text-zinc-700"
        >标记为重点经历</span>
      </label>

      <SaveButton onClick={handleSave} disabled={!data.company || !data.role || !data.startDate} />
    </div>
  );
}

function ProjectForm({
  initial,
  onSaved,
}: {
  initial?: Project;
  onSaved: () => void;
}) {
  const { addProject, updateProject } = useResumeStore();
  const [data, setData] = useState<Partial<Project>>({
    name: initial?.name || '',
    type: initial?.type || 'personal',
    role: initial?.role || '',
    startDate: initial?.startDate || '',
    endDate: initial?.endDate || '',
    link: initial?.link || '',
    bullets: initial?.bullets ? [...initial.bullets] : [''],
    tags: initial?.tags ? [...initial.tags] : [],
    outcome: initial?.outcome || '',
    featured: initial?.featured || false,
  });

  const handleSave = () => {
    if (!data.name || !data.type || !data.startDate) return;
    const bullets = (data.bullets || []).filter((b) => b.trim());
    const payload = { ...data, bullets } as Omit<Project, 'id'>;
    if (initial) {
      updateProject(initial.id, payload);
    } else {
      addProject(payload);
    }
    onSaved();
  };

  return (
    <div className="space-y-4"
    >
      <TextField label="项目名称 *" value={data.name || ''} onChange={(v) => setData({ ...data, name: v })} />
      <SelectField
        label="项目类型 *"
        value={data.type || 'personal'}
        options={[
          { label: 'AI/算法项目', value: 'ai-project' },
          { label: '竞赛项目', value: 'competition' },
          { label: '科研项目', value: 'research' },
          { label: '创业项目', value: 'startup' },
          { label: '个人项目', value: 'personal' },
          { label: '课程设计', value: 'course' },
          { label: '工作项目', value: 'work' },
        ]}
        onChange={(v) => setData({ ...data, type: v as ProjectType })}
      />
      <TextField label="担任角色 *" value={data.role || ''} onChange={(v) => setData({ ...data, role: v })} placeholder="如：项目负责人、核心开发" />
      <div className="grid grid-cols-2 gap-3"
      >
        <TextField label="开始时间 *" value={data.startDate || ''} onChange={(v) => setData({ ...data, startDate: v })} placeholder="YYYY-MM" />
        <TextField label="结束时间" value={data.endDate || ''} onChange={(v) => setData({ ...data, endDate: v })} placeholder="YYYY-MM 或留空" />
      </div>
      <TextField label="项目链接" value={data.link || ''} onChange={(v) => setData({ ...data, link: v })} placeholder="GitHub / 演示地址" />

      <div className="space-y-2"
      >
        <label className="text-xs font-medium text-zinc-700"
        >项目描述</label>
        {(data.bullets || ['']).map((bullet, i) => (
          <div key={i} className="flex gap-2"
          >
            <textarea
              value={bullet}
              onChange={(e) => {
                const arr = [...(data.bullets || [])];
                arr[i] = e.target.value;
                setData({ ...data, bullets: arr });
              }}
              rows={2}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
              placeholder="描述项目背景、你的职责、技术方案和成果"
            />
            <button
              onClick={() => {
                const arr = [...(data.bullets || [])];
                arr.splice(i, 1);
                setData({ ...data, bullets: arr.length ? arr : [''] });
              }}
              className="self-start rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setData({ ...data, bullets: [...(data.bullets || []), ''] })}
          className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          <Plus className="h-3.5 w-3.5" />
          添加描述
        </button>
      </div>

      <TextField
        label="项目成果"
        value={data.outcome || ''}
        onChange={(v) => setData({ ...data, outcome: v })}
        placeholder="如：获挑战杯国一、发表 ACL 2024、GitHub 2k+ stars"
      />

      <TagInput
        label="技术栈标签"
        tags={data.tags || []}
        onChange={(tags) => setData({ ...data, tags })}
        placeholder="如 React, TypeScript, Node.js"
      />

      <label className="flex items-center gap-2"
      >
        <input
          type="checkbox"
          checked={data.featured}
          onChange={(e) => setData({ ...data, featured: e.target.checked })}
          className="h-4 w-4 rounded border-zinc-300"
        />
        <span className="text-sm text-zinc-700"
        >标记为重点项目</span>
      </label>

      <SaveButton onClick={handleSave} disabled={!data.name || !data.role || !data.startDate} />
    </div>
  );
}

function AwardForm({
  initial,
  onSaved,
}: {
  initial?: Award;
  onSaved: () => void;
}) {
  const { addAward, updateAward } = useResumeStore();
  const [data, setData] = useState<Partial<Award>>({
    name: initial?.name || '',
    level: initial?.level || '其他',
    issuer: initial?.issuer || '',
    date: initial?.date || '',
    ranking: initial?.ranking || '',
    description: initial?.description || '',
  });

  const handleSave = () => {
    if (!data.name) return;
    const payload = data as Omit<Award, 'id'>;
    if (initial) {
      updateAward(initial.id, payload);
    } else {
      addAward(payload);
    }
    onSaved();
  };

  return (
    <div className="space-y-4"
    >
      <TextField label="奖项名称 *" value={data.name || ''} onChange={(v) => setData({ ...data, name: v })} />
      <SelectField
        label="级别"
        value={data.level || '其他'}
        options={['国际', '国家级', '省级', '校级', '企业级', '其他']}
        onChange={(v) => setData({ ...data, level: v as AwardLevel })}
      />
      <TextField label="颁发机构" value={data.issuer || ''} onChange={(v) => setData({ ...data, issuer: v })} />
      <div className="grid grid-cols-2 gap-3"
      >
        <TextField label="获奖时间" value={data.date || ''} onChange={(v) => setData({ ...data, date: v })} placeholder="YYYY-MM" />
        <TextField label="名次/等级" value={data.ranking || ''} onChange={(v) => setData({ ...data, ranking: v })} placeholder="如：一等奖、前 5%" />
      </div>
      <TextField label="补充说明" value={data.description || ''} onChange={(v) => setData({ ...data, description: v })} />
      <SaveButton onClick={handleSave} disabled={!data.name} />
    </div>
  );
}

function CertificationForm({
  initial,
  onSaved,
}: {
  initial?: Certification;
  onSaved: () => void;
}) {
  const { addCertification, updateCertification } = useResumeStore();
  const [data, setData] = useState<Partial<Certification>>({
    name: initial?.name || '',
    issuer: initial?.issuer || '',
    date: initial?.date || '',
    expiryDate: initial?.expiryDate || '',
    credentialId: initial?.credentialId || '',
  });

  const handleSave = () => {
    if (!data.name || !data.issuer || !data.date) return;
    const payload = data as Omit<Certification, 'id'>;
    if (initial) {
      updateCertification(initial.id, payload);
    } else {
      addCertification(payload);
    }
    onSaved();
  };

  return (
    <div className="space-y-4"
    >
      <TextField label="证书名称 *" value={data.name || ''} onChange={(v) => setData({ ...data, name: v })} />
      <TextField label="颁发机构 *" value={data.issuer || ''} onChange={(v) => setData({ ...data, issuer: v })} />
      <div className="grid grid-cols-2 gap-3"
      >
        <TextField label="获得时间 *" value={data.date || ''} onChange={(v) => setData({ ...data, date: v })} placeholder="YYYY-MM" />
        <TextField label="过期时间" value={data.expiryDate || ''} onChange={(v) => setData({ ...data, expiryDate: v })} placeholder="YYYY-MM 或留空" />
      </div>
      <TextField label="证书编号" value={data.credentialId || ''} onChange={(v) => setData({ ...data, credentialId: v })} />
      <SaveButton onClick={handleSave} disabled={!data.name || !data.issuer || !data.date} />
    </div>
  );
}

function SkillForm({
  initial,
  onSaved,
}: {
  initial?: Skill;
  onSaved: () => void;
}) {
  const { addSkill, updateSkill } = useResumeStore();
  const [data, setData] = useState<Partial<Skill>>({
    name: initial?.name || '',
    category: initial?.category || '其他',
    proficiency: initial?.proficiency || '熟悉',
    level: initial?.level || 3,
  });

  const handleSave = () => {
    if (!data.name) return;
    const payload = data as Omit<Skill, 'id'>;
    if (initial) {
      updateSkill(initial.id, payload);
    } else {
      addSkill(payload);
    }
    onSaved();
  };

  return (
    <div className="space-y-4"
    >
      <TextField label="技能名称 *" value={data.name || ''} onChange={(v) => setData({ ...data, name: v })} />
      <SelectField
        label="分类"
        value={data.category || '其他'}
        options={['编程语言', '前端', '后端', '数据库', 'AI/ML', 'DevOps', '工具', '语言', '软技能', '其他']}
        onChange={(v) => setData({ ...data, category: v as SkillCategory })}
      />
      <SelectField
        label="熟练度"
        value={data.proficiency || '熟悉'}
        options={['入门', '熟悉', '掌握', '精通']}
        onChange={(v) => setData({ ...data, proficiency: v as ProficiencyLevel })}
      />
      <div className="space-y-2"
      >
        <label className="text-xs font-medium text-zinc-700"
        >等级 (1-5)</label>
        <div className="flex gap-2"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setData({ ...data, level: n as 1 | 2 | 3 | 4 | 5 })}
              className={cn(
                'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                data.level === n
                  ? 'bg-zinc-900 text-white'
                  : 'border border-zinc-300 text-zinc-600 hover:border-zinc-500'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <SaveButton onClick={handleSave} disabled={!data.name} />
    </div>
  );
}

// ============================================
// Reusable Form Fields
// ============================================

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5"
    >
      <label className="text-xs font-medium text-zinc-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[] | { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  const normalized = options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o));

  return (
    <div className="space-y-1.5"
    >
      <label className="text-xs font-medium text-zinc-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900"
      >
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()]);
      }
      setInput('');
    }
  };

  return (
    <div className="space-y-1.5"
    >
      <label className="text-xs font-medium text-zinc-700">{label}</label>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-zinc-300 px-3 py-2"
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
          >
            {tag}
            <button
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="text-zinc-400 hover:text-zinc-700"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="min-w-[80px] flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
        />
      </div>
      <p className="text-xs text-zinc-400">按回车添加标签</p>
    </div>
  );
}

function SaveButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="pt-4"
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg py-2.5 text-sm font-medium transition-colors',
          disabled
            ? 'cursor-not-allowed bg-zinc-300 text-white'
            : 'bg-zinc-900 text-white hover:bg-zinc-800'
        )}
      >
        保存
      </button>
    </div>
  );
}
