/**
 * Capability 常量定义
 *
 * 设计原则：
 * 1. capability 是 keyword -> category 的中间层
 * 2. 不同 category 可以共享同一个 capability
 * 3. 工具类优先映射到 capability，不新增 category
 * 4. 不做 hierarchy、不做 ontology、不做推理
 */

export const CAPABILITIES = {
  // 增长
  GROWTH: 'growth',
  GROWTH_ANALYSIS: 'growth_analysis',

  // 内容
  CONTENT_CREATION: 'content_creation',
  CONTENT_OPERATION: 'content_operation',
  CONTENT_STRATEGY: 'content_strategy',

  // 产品
  PRODUCT_DESIGN: 'product_design',
  PRODUCT_ANALYSIS: 'product_analysis',
  USER_RESEARCH: 'user_research',

  // 运营
  USER_OPERATION: 'user_operation',
  ACTIVITY_OPERATION: 'activity_operation',
  PLATFORM_OPERATION: 'platform_operation',

  // 翻译
  TRANSLATION: 'translation',
  INTERPRETATION: 'interpretation',

  // 市场
  MARKETING: 'marketing',
  MARKET_ANALYSIS: 'market_analysis',

  // 数据
  DATA_ANALYSIS: 'data_analysis',
  DATA_ENGINEERING: 'data_engineering',

  // 游戏
  GAME_DESIGN: 'game_design',
  GAME_DEVELOPMENT: 'game_development',

  // 工具（跨 category 复用）
  OFFICE_TOOLS: 'office_tools',
  DESIGN_TOOLS: 'design_tools',
  COLLABORATION_TOOLS: 'collaboration_tools',
  CONTENT_TOOLS: 'content_tools',
  DATA_TOOLS: 'data_tools',

  // 技术类（已有 category 的 capability 映射，保持兼容）
  PROGRAMMING: 'programming',
  FRONTEND_DEV: 'frontend_dev',
  BACKEND_DEV: 'backend_dev',
  DATABASE_DEV: 'database_dev',
  DEVOPS_PRACTICE: 'devops_practice',
  AI_ML: 'ai_ml',
  MOBILE_DEV: 'mobile_dev',

  // 通用
  SOFT_SKILL: 'soft_skill',
  DOMAIN_KNOWLEDGE: 'domain_knowledge',
  LANGUAGE: 'language',
  LANGUAGE_CERT: 'language_cert',
  DEGREE: 'degree',
  GENERAL: 'general',
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

// capability -> 人类可读标签
export const CAPABILITY_LABELS: Record<string, string> = {
  [CAPABILITIES.GROWTH]: '增长',
  [CAPABILITIES.GROWTH_ANALYSIS]: '增长分析',
  [CAPABILITIES.CONTENT_CREATION]: '内容创作',
  [CAPABILITIES.CONTENT_OPERATION]: '内容运营',
  [CAPABILITIES.CONTENT_STRATEGY]: '内容策略',
  [CAPABILITIES.PRODUCT_DESIGN]: '产品设计',
  [CAPABILITIES.PRODUCT_ANALYSIS]: '产品分析',
  [CAPABILITIES.USER_RESEARCH]: '用户研究',
  [CAPABILITIES.USER_OPERATION]: '用户运营',
  [CAPABILITIES.ACTIVITY_OPERATION]: '活动运营',
  [CAPABILITIES.PLATFORM_OPERATION]: '平台运营',
  [CAPABILITIES.TRANSLATION]: '笔译/本地化',
  [CAPABILITIES.INTERPRETATION]: '口译',
  [CAPABILITIES.MARKETING]: '市场营销',
  [CAPABILITIES.MARKET_ANALYSIS]: '市场分析',
  [CAPABILITIES.DATA_ANALYSIS]: '数据分析',
  [CAPABILITIES.DATA_ENGINEERING]: '数据工程',
  [CAPABILITIES.GAME_DESIGN]: '游戏设计',
  [CAPABILITIES.GAME_DEVELOPMENT]: '游戏开发',
  [CAPABILITIES.OFFICE_TOOLS]: '办公软件',
  [CAPABILITIES.DESIGN_TOOLS]: '设计工具',
  [CAPABILITIES.COLLABORATION_TOOLS]: '协作工具',
  [CAPABILITIES.CONTENT_TOOLS]: '内容工具',
  [CAPABILITIES.DATA_TOOLS]: '数据工具',
  [CAPABILITIES.PROGRAMMING]: '编程语言',
  [CAPABILITIES.FRONTEND_DEV]: '前端开发',
  [CAPABILITIES.BACKEND_DEV]: '后端开发',
  [CAPABILITIES.DATABASE_DEV]: '数据库',
  [CAPABILITIES.DEVOPS_PRACTICE]: 'DevOps',
  [CAPABILITIES.AI_ML]: 'AI/ML',
  [CAPABILITIES.MOBILE_DEV]: '移动端开发',
  [CAPABILITIES.SOFT_SKILL]: '软技能',
  [CAPABILITIES.DOMAIN_KNOWLEDGE]: '领域知识',
  [CAPABILITIES.LANGUAGE]: '语言能力',
  [CAPABILITIES.LANGUAGE_CERT]: '语言证书',
  [CAPABILITIES.DEGREE]: '学历',
  [CAPABILITIES.GENERAL]: '通用',
};

// capability -> 关联 category（用于默认回退）
export const CAPABILITY_DEFAULT_CATEGORIES: Partial<Record<string, string>> = {
  [CAPABILITIES.GROWTH]: 'operation',
  [CAPABILITIES.GROWTH_ANALYSIS]: 'data',
  [CAPABILITIES.CONTENT_CREATION]: 'content',
  [CAPABILITIES.CONTENT_OPERATION]: 'operation',
  [CAPABILITIES.CONTENT_STRATEGY]: 'content',
  [CAPABILITIES.PRODUCT_DESIGN]: 'product',
  [CAPABILITIES.PRODUCT_ANALYSIS]: 'product',
  [CAPABILITIES.USER_RESEARCH]: 'product',
  [CAPABILITIES.USER_OPERATION]: 'operation',
  [CAPABILITIES.ACTIVITY_OPERATION]: 'operation',
  [CAPABILITIES.PLATFORM_OPERATION]: 'operation',
  [CAPABILITIES.TRANSLATION]: 'translation',
  [CAPABILITIES.INTERPRETATION]: 'translation',
  [CAPABILITIES.MARKETING]: 'marketing',
  [CAPABILITIES.MARKET_ANALYSIS]: 'marketing',
  [CAPABILITIES.DATA_ANALYSIS]: 'data',
  [CAPABILITIES.DATA_ENGINEERING]: 'data',
  [CAPABILITIES.GAME_DESIGN]: 'game',
  [CAPABILITIES.GAME_DEVELOPMENT]: 'game',
  [CAPABILITIES.OFFICE_TOOLS]: 'general',
  [CAPABILITIES.DESIGN_TOOLS]: 'product',
  [CAPABILITIES.COLLABORATION_TOOLS]: 'general',
  [CAPABILITIES.CONTENT_TOOLS]: 'content',
  [CAPABILITIES.DATA_TOOLS]: 'data',
};
