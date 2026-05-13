import type { ResumeProfile } from '@/types/resume';

export interface TemplateProps {
  profile: ResumeProfile;
}

export type TemplateId = 'standard-campus' | 'minimal' | 'japanese';

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
}
