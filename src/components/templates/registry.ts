import type { TemplateId, TemplateMeta, TemplateProps } from './types';
import { StandardCampusTemplate } from './StandardCampusTemplate';
import { MinimalTemplate } from './MinimalTemplate';
import { JapaneseTemplate } from './JapaneseTemplate';
import type { ComponentType } from 'react';

export const templateRegistry: Record<TemplateId, ComponentType<TemplateProps>> = {
  'standard-campus': StandardCampusTemplate,
  'minimal': MinimalTemplate,
  'japanese': JapaneseTemplate,
};

export const templateMetaList: TemplateMeta[] = [
  {
    id: 'standard-campus',
    name: '标准互联网校招风',
    description: '类超级简历 / 牛客风格，高信息密度，HR 快速扫描',
  },
  {
    id: 'minimal',
    name: '高级极简风',
    description: '大量留白，优雅排版，适合设计 / 产品岗位',
  },
  {
    id: 'japanese',
    name: '日企履历书风',
    description: '表格形式，规整严谨，适合日企 / 外企申请',
  },
];

export function isValidTemplateId(id: string): id is TemplateId {
  return id in templateRegistry;
}

export function getTemplateComponent(id: TemplateId): ComponentType<TemplateProps> {
  return templateRegistry[id];
}
