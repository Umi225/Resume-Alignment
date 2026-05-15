'use client';

import { useState, useRef, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  templateMetaList,
  getTemplateComponent,
  isValidTemplateId,
} from '@/components/templates/registry';
import { PdfExportModal } from '@/components/pdf/PdfExportModal';
import { useResumeStore } from '@/stores/resumeStore';
import { cn } from '@/lib/utils';
import {
  FileDown,
  FileText,
  ZoomIn,
  ChevronRight,
  Wand2,
  CheckSquare,
  Square,
  Briefcase,
  Code2,
} from 'lucide-react';
import type { ResumeProfile } from '@/types/resume';

export default function ResumeEditorPage() {
  const {
    profile,
    selectedOptimizedIds,
    toggleOptimizedSelection,
    clearOptimizedSelection,
  } = useResumeStore();
  const [activeTemplate, setActiveTemplate] = useState('standard-campus');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  const activeMeta = templateMetaList.find((t) => t.id === activeTemplate);
  const TemplateComponent = getTemplateComponent(
    isValidTemplateId(activeTemplate) ? activeTemplate : 'standard-campus'
  );

  // 合成预览用的 profile：
  // - 固定信息全部保留（basicInfo, education, skills, certifications, awards）
  // - 动态经历只保留用户勾选的（experience, projects）
  // - 勾选的动态经历优先使用 optimizedVersion.content，否则用原始 bullets
  const previewProfile = useMemo<ResumeProfile>(() => {
    return {
      ...profile,
      experience: profile.experience
        .filter((exp) => selectedOptimizedIds.includes(exp.id))
        .map((exp) => {
          if (exp.optimizedVersion) {
            return {
              ...exp,
              bullets: exp.optimizedVersion.content
                .split('\n')
                .map((line) => line.replace(/^·\s*/, '').trim())
                .filter(Boolean),
            };
          }
          return exp;
        }),
      projects: profile.projects
        .filter((proj) => selectedOptimizedIds.includes(proj.id))
        .map((proj) => {
          if (proj.optimizedVersion) {
            return {
              ...proj,
              bullets: proj.optimizedVersion.content
                .split('\n')
                .map((line) => line.replace(/^·\s*/, '').trim())
                .filter(Boolean),
            };
          }
          return proj;
        }),
    };
  }, [profile, selectedOptimizedIds]);

  // 右侧面板显示：已勾选的 + 有 optimizedVersion 的（作为 AI 推荐）
  const selectableExperiences = profile.experience.filter(
    (e) => selectedOptimizedIds.includes(e.id) || e.optimizedVersion
  );
  const selectableProjects = profile.projects.filter(
    (p) => selectedOptimizedIds.includes(p.id) || p.optimizedVersion
  );

  return (
    <>
      <AppShell contentClassName="flex flex-1 overflow-hidden">
        <div className="flex h-full w-full">
          {/* 中间：简历预览（视觉中心） */}
          <div className="flex flex-1 flex-col overflow-auto bg-zinc-100">
            {/* 顶部工具栏 */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-5 py-2.5 backdrop-blur-sm">
              {/* 模板选择 Segmented Control */}
              <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1">
                {templateMetaList.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setActiveTemplate(tmpl.id)}
                    className={cn(
                      'rounded-md px-3 py-[5px] text-[13px] transition-all',
                      activeTemplate === tmpl.id
                        ? 'bg-white font-medium text-zinc-900 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700'
                    )}
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>

              <span className="text-micro text-zinc-400">A4 预览</span>
            </div>

            {/* 简历预览区 */}
            <div className="flex flex-1 justify-center py-8">
              <div ref={resumeRef} className="shadow-floating">
                <TemplateComponent profile={previewProfile} />
              </div>
            </div>
          </div>

          {/* 右侧：辅助栏 */}
          <aside className="flex w-[260px] flex-shrink-0 flex-col border-l border-zinc-200 bg-white">
            {/* 推荐经历区域 */}
            <div className="border-b border-zinc-100 px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-micro font-semibold uppercase tracking-wider text-zinc-400">
                  推荐经历
                </h3>
                {selectedOptimizedIds.length > 0 && (
                  <button
                    onClick={clearOptimizedSelection}
                    className="text-[10px] text-zinc-400 hover:text-zinc-600"
                  >
                    全部取消
                  </button>
                )}
              </div>

              {selectableExperiences.length === 0 && selectableProjects.length === 0 && (
                <div className="rounded-card border border-dashed border-zinc-200 bg-zinc-50 p-3 text-center">
                  <Wand2 className="mx-auto h-4 w-4 text-zinc-300" />
                  <p className="mt-1 text-micro text-zinc-500">暂无推荐版本</p>
                  <p className="text-[10px] text-zinc-400">
                    前往 JD 对齐页面生成
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {selectableExperiences.map((exp) => (
                  <OptimizedItemRow
                    key={exp.id}
                    id={exp.id}
                    title={exp.company}
                    subtitle={exp.role}
                    icon={Briefcase}
                    isSelected={selectedOptimizedIds.includes(exp.id)}
                    hasOptimized={!!exp.optimizedVersion}
                    onToggle={() => toggleOptimizedSelection(exp.id)}
                  />
                ))}
                {selectableProjects.map((proj) => (
                  <OptimizedItemRow
                    key={proj.id}
                    id={proj.id}
                    title={proj.name}
                    subtitle={proj.role}
                    icon={Code2}
                    isSelected={selectedOptimizedIds.includes(proj.id)}
                    hasOptimized={!!proj.optimizedVersion}
                    onToggle={() => toggleOptimizedSelection(proj.id)}
                  />
                ))}
              </div>

              {selectedOptimizedIds.length > 0 && (
                <p className="mt-2 text-[10px] text-zinc-400">
                  已勾选 {selectedOptimizedIds.length} 条，预览中显示为推荐版本文案
                </p>
              )}
            </div>

            {/* 导出区域 */}
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="mb-3 text-micro font-semibold uppercase tracking-wider text-zinc-400">
                导出
              </h3>
              <button
                onClick={() => setExportModalOpen(true)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                导出 PDF
              </button>
              <p className="mt-2 text-micro leading-relaxed text-zinc-400">
                A4 尺寸，支持单页压缩与多页分页
              </p>
            </div>

            {/* 当前模板 */}
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="mb-2 text-micro font-semibold uppercase tracking-wider text-zinc-400">
                当前模板
              </h3>
              <p className="text-caption font-medium text-zinc-800">
                {activeMeta?.name}
              </p>
              <p className="mt-1 text-small leading-relaxed text-zinc-400">
                {activeMeta?.description}
              </p>
            </div>

            {/* 快捷跳转 */}
            <div className="px-5 py-4">
              <h3 className="mb-2 text-micro font-semibold uppercase tracking-wider text-zinc-400">
                快捷操作
              </h3>
              <div className="space-y-0.5">
                <QuickLink href="/experiences" icon={FileText}>
                  编辑经历内容
                </QuickLink>
                <QuickLink href="/jd-workbench" icon={ZoomIn}>
                  JD 对齐分析
                </QuickLink>
              </div>
            </div>
          </aside>
        </div>
      </AppShell>

      <PdfExportModal
        isOpen={exportModalOpen}
        targetRef={resumeRef as React.RefObject<HTMLElement>}
        filename={profile.basicInfo.name || '简历'}
        onClose={() => setExportModalOpen(false)}
      />
    </>
  );
}

function QuickLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-lg px-2.5 py-2 text-caption text-zinc-600 transition-colors hover:bg-zinc-50"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-zinc-400" />
        {children}
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
    </a>
  );
}

function OptimizedItemRow({
  title,
  subtitle,
  icon: Icon,
  isSelected,
  hasOptimized,
  onToggle,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  isSelected: boolean;
  hasOptimized: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all',
        isSelected
          ? 'border-zinc-900 bg-zinc-900 text-white'
          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
      )}
    >
      {isSelected ? (
        <CheckSquare className="h-4 w-4 shrink-0" />
      ) : (
        <Square className="h-4 w-4 shrink-0 text-zinc-400" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={cn('text-caption truncate', isSelected ? 'text-white' : 'text-zinc-900')}>
            {title}
          </p>
          {hasOptimized && (
            <span
              className={cn(
                'shrink-0 rounded px-1 py-0 text-[10px] font-medium',
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-50 text-blue-600'
              )}
            >
              AI推荐
            </span>
          )}
        </div>
        <p className={cn('text-micro truncate', isSelected ? 'text-zinc-300' : 'text-zinc-500')}>
          {subtitle}
        </p>
      </div>
    </button>
  );
}
