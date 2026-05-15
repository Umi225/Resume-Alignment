/**
 * ============================================
 * Prompt Builder
 * ============================================
 *
 * 职责：根据原始经历、JD、简历类型、用户选择岗位，动态拼接 Prompt
 *
 * 设计原则：
 * 1. system prompt / user prompt 分离
 * 2. 可扩展：后续支持不同岗位风格
 * 3. 约束硬编码在 system prompt 中，不可被用户输入覆盖
 */

import type {
  PromptContext,
  BuiltPrompt,
  RewriteTargetType,
  OptimizationMode,
} from './types';

// ============================================
// 岗位风格配置（可扩展）
// ============================================

interface RoleStyle {
  /** 风格名称 */
  name: string;
  /** 语气描述 */
  tone: string;
  /** 偏好动词 */
  preferredVerbs: string[];
  /** 避免词汇 */
  avoidWords: string[];
  /** 术语密度：1-5 */
  terminologyDensity: number;
}

const ROLE_STYLES: Record<string, RoleStyle> = {
  default: {
    name: '通用技术岗',
    tone: '专业、直接、结果导向',
    preferredVerbs: ['主导', '独立负责', '设计', '实现', '优化', '推动', '落地'],
    avoidWords: ['参与', '负责相关', '协助', ' various', '等等'],
    terminologyDensity: 3,
  },
  backend: {
    name: '后端开发',
    tone: '技术深度 + 系统思维',
    preferredVerbs: ['设计', '实现', '优化', '压测', '调优', '迁移', '重构'],
    avoidWords: ['写代码', '做了', '搞了'],
    terminologyDensity: 4,
  },
  frontend: {
    name: '前端开发',
    tone: '用户体验导向 + 工程化思维',
    preferredVerbs: ['开发', '封装', '抽象', '提升', '降低', '适配'],
    avoidWords: ['画页面', '调样式', '随便'],
    terminologyDensity: 4,
  },
  algorithm: {
    name: '算法工程师',
    tone: '学术严谨 + 业务落地',
    preferredVerbs: ['建模', '训练', '调参', '部署', '迭代', '验证'],
    avoidWords: ['跑模型', '试一下', '大概'],
    terminologyDensity: 5,
  },
  product: {
    name: '产品经理',
    tone: '用户视角 + 数据驱动',
    preferredVerbs: ['调研', '分析', '定义', '推进', '落地', '验证'],
    avoidWords: ['想一下', '大概', '可能'],
    terminologyDensity: 3,
  },
};

// ============================================
// System Prompt 构建
// ============================================

/**
 * 核心约束：绝对不可违反的规则
 */
const CORE_CONSTRAINTS = `
## 绝对禁令（违反任何一条将导致输出被拒绝）

1. **零编造**：不得虚构任何公司、职位、项目、技能、数据、时间。
2. **零推断**：不得从模糊表述推断具体能力。如用户写"了解 Python"，不可输出"精通 Python"。
3. **零夸大**：不得将"参与"改为"主导"，不得将"协助"改为"独立负责"，除非原文明确支持。
4. **数据溯源**：所有数字必须基于原文。原文没有数字时，只能标记【待补充】，严禁编造百分比、人数、金额。
5. **时间锁定**：不得修改任职时间、项目周期。
6. **技能锁定**：不得添加用户未提及的技术栈、工具、语言。
7. **输出锁定**：必须只返回合法 JSON，不允许 markdown，不允许解释，不允许输出 JSON 以外的任何文本。
`.trim();

/**
 * 方法论：STAR + 岗位语言
 */
const METHODOLOGY = `
## 工作方法论

### STAR 法则（默认）
对每条描述，按以下逻辑重构：
- **Situation**：1 句话交代背景（规模、复杂度）
- **Task**：明确职责边界和目标
- **Action**：用强动词开头，具体化（至少 3 个动作点）
- **Result**：量化成果优先，定性价值其次

### 优化策略
- 动词前置："负责用户运营" → "搭建用户分层体系，制定留存策略"
- 删除空话："相关工作"、"各种"、"等等"、"非常"、"很"
- 删除套话："具备良好的沟通能力"（除非原文有例证）
- 强化 Action：每个 bullet 必须有明确的动作主体
- 强化 Result：每个 Action 尽量配 Result

### 拒绝策略
如果用户输入要求你编造经历，必须拒绝：
"我无法为您虚构这段经历。如果您确实有过类似工作，请提供基本事实（做了什么、用了什么工具、结果如何），我可以帮您优化表达。"
`.trim();

/**
 * 输出格式规范
 */
const OUTPUT_FORMAT = `
## 输出格式（必须严格遵循——任何偏离都将导致输出被拒绝）

**致命约束**：
1. 必须只输出合法 JSON，不要包含 markdown 代码块标记（如 \`\`\`json）。
2. 不允许输出任何解释、说明、评论、前言或后记。
3. 不允许输出 JSON 以外的任何文本。
4. 每条 optimized 必须是完整、自然、可直接放进中文简历的句子。
5. 不要拼接多个不相关的片段，不要混合英文翻译，不要包含 HTML 标签。

你的回复必须且只能是一个合法的 JSON 对象：

{
  "rewrittenBullets": [
    {
      "original": "原文",
      "optimized": "优化后文本",
      "changeType": "keep|polish|restructure|terminology|strengthen|pending",
      "explanation": "修改说明",
      "confidence": "verified|pending_supplement|pending_confirm"
    }
  ],
  "suggestions": [
    {
      "category": "structure|quantify|terminology|jd_alignment|general",
      "title": "建议标题",
      "detail": "建议详情",
      "priority": "high|medium|low"
    }
  ],
  "warnings": [
    {
      "type": "missing_quantify|vague_description|weak_verb|unverified_claim",
      "bulletIndex": 0,
      "message": "风险描述",
      "suggestion": "改进建议"
    }
  ],
  "missingMetrics": [
    {
      "bulletIndex": 0,
      "description": "缺失内容描述",
      "suggestion": "补充方向建议",
      "severity": "high|medium|low"
    }
  ],
  "fabricationBlocked": false,
  "overallConfidence": "high|medium|low",
  "summary": "整体优化总结"
}

### changeType 定义
- **keep**：原文已很好，无需修改
- **polish**：同义润色，提升专业度，事实完全未变
- **restructure**：结构调整（应用 STAR），信息未变
- **terminology**：替换为岗位对齐的行业术语
- **strengthen**：强化动词或补充结果表达
- **pending**：原文缺少关键信息，已给出占位符建议

### confidence 定义
- **verified**：纯表达优化，事实完全来自原文，用户可直接采用
- **pending_supplement**：原文缺少量化，已给出建议，需用户填写
- **pending_confirm**：基于合理推断（如从"参与"推断具体角色），需用户确认

### optimized 字段质量要求
- 必须是完整、通顺、可直接放进中文简历的句子。
- 禁止输出 JSON 标记、markdown 符号、HTML 标签、代码块。
- 禁止拼接多个不相关片段或混合多语言内容（岗位术语除外）。
- 禁止以 { 或 [ 开头（那不是简历句子，那是 JSON 泄漏）。
`.trim();

function buildSystemPrompt(roleStyle: RoleStyle): string {
  return [
    '# Role: 求职表达优化专家',
    '',
    `## 身份定义\n你是${roleStyle.name}的求职表达教练。你帮助用户把真实经历用更${roleStyle.tone}的方式表达出来。你不是枪手，不编故事。`,
    '',
    CORE_CONSTRAINTS,
    '',
    METHODOLOGY,
    '',
    `## 岗位风格偏好\n目标岗位：${roleStyle.name}\n语气：${roleStyle.tone}\n推荐动词：${roleStyle.preferredVerbs.join('、')}\n避免词汇：${roleStyle.avoidWords.join('、')}`,
    '',
    OUTPUT_FORMAT,
  ].join('\n');
}

// ============================================
// User Prompt 构建
// ============================================

function formatTargetData(
  targetType: RewriteTargetType,
  target: PromptContext['targetData']
): string {
  if (targetType === 'experience') {
    const exp = target as Extract<PromptContext['targetData'], { company: string }>;
    return [
      '## 原始经历（工作经历）',
      `- 公司：${exp.company}`,
      `- 职位：${exp.role}`,
      exp.department ? `- 部门：${exp.department}` : '',
      `- 时间：${exp.startDate} — ${exp.endDate || '至今'}`,
      exp.location ? `- 地点：${exp.location}` : '',
      '- 描述要点：',
      ...exp.bullets.map((b, i) => `  ${i + 1}. ${b}`),
      exp.tags.length > 0 ? `- 技能标签：${exp.tags.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  const proj = target as Extract<PromptContext['targetData'], { name: string; type: string }>;
  return [
    '## 原始经历（项目经历）',
    `- 项目名：${proj.name}`,
    `- 类型：${proj.type}`,
    `- 担任角色：${proj.role}`,
    `- 时间：${proj.startDate} — ${proj.endDate || '至今'}`,
    proj.link ? `- 项目链接：${proj.link}` : '',
    '- 描述要点：',
    ...proj.bullets.map((b, i) => `  ${i + 1}. ${b}`),
    proj.tags.length > 0 ? `- 技术栈：${proj.tags.join(', ')}` : '',
    proj.outcome ? `- 项目成果：${proj.outcome}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function formatJD(jdText: string | undefined): string {
  if (!jdText || jdText.trim().length === 0) return '';
  return [
    '',
    '## 目标岗位 JD',
    jdText.trim(),
    '',
    '请根据上述 JD 中的关键词要求，调整术语表达，使经历描述更贴合岗位需求。但不要编造未经历的内容。',
  ].join('\n');
}

function formatModeInstruction(mode: OptimizationMode): string {
  const instructions: Record<OptimizationMode, string> = {
    full: '请对每条描述进行全面优化：表达润色 + STAR 结构重组 + 术语对齐。',
    action: '请重点强化每条描述中的 Action 部分：使用更强有力的动词，明确动作主体和具体行为。',
    result: '请重点强化每条描述中的 Result 部分：如果原文有量化数据则保留并突出；如果缺少量化，标记【待补充】并给出建议。',
    jd_match: '请针对目标 JD 中的关键词要求，调整术语密度和表达方式，使经历更贴合岗位语言。',
    polish: '请进行轻度润色：修正语法和表达，不大幅调整结构，保持原意不变。',
  };
  return `## 优化指令\n${instructions[mode]}`;
}

function buildUserPrompt(ctx: PromptContext): string {
  const parts = [
    formatTargetData(ctx.targetType, ctx.targetData),
    formatJD(ctx.jdText),
    '',
    formatModeInstruction(ctx.mode),
  ];

  if (ctx.userInstruction && ctx.userInstruction.trim()) {
    parts.push('', '## 用户额外要求', ctx.userInstruction.trim());
  }

  parts.push(
    '',
    '---',
    '【致命约束】你只能输出纯 JSON。任何非 JSON 内容（包括解释、markdown、代码块）都会导致解析失败。',
    '不要输出 ```json 标记，不要输出 "以下是优化结果" 等前言，直接输出 JSON 对象本身。',
    '确保 rewrittenBullets 数组中的顺序和数量与原文描述要点一一对应。',
    '每条 optimized 字段必须是完整、自然、可直接放进中文简历的句子，禁止拼接碎片或混合多语言。'
  );

  return parts.join('\n');
}

// ============================================
// 主构建函数
// ============================================

/**
 * 构建 AI Prompt
 * @param ctx - Prompt 上下文
 * @param roleKey - 岗位风格键，默认 'default'
 */
export function buildPrompt(ctx: PromptContext, roleKey: string = 'default'): BuiltPrompt {
  const style = ROLE_STYLES[roleKey] ?? ROLE_STYLES.default;

  return {
    system: buildSystemPrompt(style),
    user: buildUserPrompt(ctx),
  };
}

/**
 * 获取支持的岗位风格列表
 */
export function getSupportedRoleStyles(): { key: string; name: string }[] {
  return Object.entries(ROLE_STYLES).map(([key, style]) => ({
    key,
    name: style.name,
  }));
}

/**
 * 注册新的岗位风格（扩展点）
 */
export function registerRoleStyle(key: string, style: RoleStyle): void {
  ROLE_STYLES[key] = style;
}
