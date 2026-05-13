'use client';

import type { TemplateProps, TemplateId } from './types';
import { getTemplateComponent, isValidTemplateId } from './registry';

interface ResumeTemplateRendererProps extends TemplateProps {
  templateId: string;
}

export function ResumeTemplateRenderer({ profile, templateId }: ResumeTemplateRendererProps) {
  const validId = isValidTemplateId(templateId) ? templateId : 'standard-campus';
  const Component = getTemplateComponent(validId);

  return (
    <div className="flex justify-center overflow-auto bg-zinc-100 py-8">
      <div className="scale-origin-top">
        <Component profile={profile} />
      </div>
    </div>
  );
}

export { StandardCampusTemplate } from './StandardCampusTemplate';
export { MinimalTemplate } from './MinimalTemplate';
export { JapaneseTemplate } from './JapaneseTemplate';
export { templateRegistry, templateMetaList, isValidTemplateId, getTemplateComponent } from './registry';
export type { TemplateProps, TemplateId, TemplateMeta } from './types';
