'use client';

import { useState, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  templateMetaList,
  getTemplateComponent,
  isValidTemplateId,
} from '@/components/templates/registry';
import { PdfExportModal } from '@/components/pdf/PdfExportModal';
import { useResumeStore } from '@/stores/resumeStore';
import { cn } from '@/lib/utils';
import { FileDown, FileText, ZoomIn, ChevronRight } from 'lucide-react';

export default function ResumeEditorPage() {
  const { profile, updateBasicInfo } = useResumeStore();
  const [activeTemplate, setActiveTemplate] = useState('standard-campus');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  const activeMeta = templateMetaList.find((t) => t.id === activeTemplate);
  const TemplateComponent = getTemplateComponent(
    isValidTemplateId(activeTemplate) ? activeTemplate : 'standard-campus'
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
                <TemplateComponent profile={profile} />
              </div>
            </div>
          </div>

          {/* 右侧：辅助栏 */}
          <aside className="flex w-[240px] flex-shrink-0 flex-col border-l border-zinc-200 bg-white">
            {/* 基础信息编辑 */}
            <div className="border-b border-zinc-100 px-5 py-4">
              <h3 className="mb-3 text-micro font-semibold uppercase tracking-wider text-zinc-400">
                基础信息
              </h3>
              <div className="space-y-2.5">
                <Field
                  label="姓名"
                  value={profile.basicInfo.name}
                  onChange={(v) => updateBasicInfo({ name: v })}
                />
                <Field
                  label="电话"
                  value={profile.basicInfo.phone}
                  onChange={(v) => updateBasicInfo({ phone: v })}
                />
                <Field
                  label="邮箱"
                  value={profile.basicInfo.email}
                  onChange={(v) => updateBasicInfo({ email: v })}
                />
                <Field
                  label="所在地"
                  value={profile.basicInfo.location || ''}
                  onChange={(v) => updateBasicInfo({ location: v })}
                />
                <Field
                  label="GitHub"
                  value={profile.basicInfo.github || ''}
                  onChange={(v) => updateBasicInfo({ github: v })}
                />
                <Field
                  label="个人主页"
                  value={profile.basicInfo.website || ''}
                  onChange={(v) => updateBasicInfo({ website: v })}
                />
                <div>
                  <label className="mb-1 block text-micro text-zinc-400">
                    个人总结
                  </label>
                  <textarea
                    value={profile.basicInfo.summary || ''}
                    onChange={(e) =>
                      updateBasicInfo({ summary: e.target.value })
                    }
                    rows={3}
                    className="w-full resize-none rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-caption text-zinc-900 outline-none transition-colors focus:border-zinc-400"
                  />
                </div>
              </div>
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

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-micro text-zinc-400">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-caption text-zinc-900 outline-none transition-colors focus:border-zinc-400"
      />
    </div>
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
