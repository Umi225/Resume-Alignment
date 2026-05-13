/**
 * ============================================
 * AI Provider 配置系统
 * ============================================
 *
 * 设计原则：
 * 1. 不硬编码任何 provider 的 URL / model
 * 2. 全部通过环境变量配置
 * 3. 支持预设 provider（OpenAI、Kimi），也支持任意 OpenAI-compatible API
 * 4. API Key 只在服务端读取，绝不暴露到前端
 *
 * 环境变量：
 * - AI_PROVIDER    : 预设标识或 'custom'
 * - AI_API_KEY     : API 密钥（必配）
 * - AI_API_URL     : API 端点（custom 模式下必配）
 * - AI_MODEL       : 模型名称（必配）
 *
 * 预设 provider：
 * - openai  → https://api.openai.com/v1/chat/completions
 * - kimi    → https://api.moonshot.cn/v1/chat/completions
 * - custom  → 用户自定义 URL
 */

// ============================================
// Provider 预设
// ============================================

export interface ProviderPreset {
  /** provider 标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 默认 API 端点 */
  defaultUrl: string;
  /** 默认模型 */
  defaultModel: string;
  /** 是否需要 Authorization Bearer */
  usesBearerAuth: boolean;
  /** 额外请求头 */
  extraHeaders?: Record<string, string>;
}

const PRESETS: Record<string, ProviderPreset> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    usesBearerAuth: true,
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi (Moonshot)',
    defaultUrl: 'https://api.moonshot.cn/v1/chat/completions',
    defaultModel: 'moonshot-v1-8k',
    usesBearerAuth: true,
  },
  custom: {
    id: 'custom',
    name: '自定义 OpenAI-compatible',
    defaultUrl: '',
    defaultModel: '',
    usesBearerAuth: true,
  },
};

// ============================================
// Provider 配置
// ============================================

export interface ProviderConfig {
  /** provider 标识 */
  provider: string;
  /** API 密钥 */
  apiKey: string;
  /** API 端点 */
  apiUrl: string;
  /** 模型名称 */
  model: string;
  /** 温度 */
  temperature: number;
  /** 最大 token */
  maxTokens: number;
  /** 是否开发模式（无 key 时返回 mock） */
  devMode: boolean;
}

// ============================================
// 从环境变量加载配置
// ============================================

/**
 * 加载 Provider 配置
 *
 * 优先级：
 * 1. AI_PROVIDER 匹配预设 → 使用预设默认值 + 环境变量覆盖
 * 2. AI_PROVIDER = 'custom' 或未设置 → 完全从环境变量读取
 */
export function loadProviderConfig(): ProviderConfig {
  const providerId = (process.env.AI_PROVIDER || 'custom').toLowerCase().trim();
  const preset = PRESETS[providerId];

  const apiKey = process.env.AI_API_KEY?.trim() || '';

  // 开发模式判断：无 API Key 且 NODE_ENV === development
  const devMode = !apiKey && process.env.NODE_ENV === 'development';

  if (preset) {
    // 使用预设 + 环境变量覆盖
    return {
      provider: preset.id,
      apiKey,
      apiUrl: process.env.AI_API_URL?.trim() || preset.defaultUrl,
      model: process.env.AI_MODEL?.trim() || preset.defaultModel,
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
      devMode,
    };
  }

  // 完全自定义模式
  return {
    provider: providerId,
    apiKey,
    apiUrl: process.env.AI_API_URL?.trim() || '',
    model: process.env.AI_MODEL?.trim() || '',
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
    devMode,
  };
}

/**
 * 验证配置是否完整（生产环境）
 */
export function validateProviderConfig(config: ProviderConfig): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!config.apiKey) missing.push('AI_API_KEY');
  if (!config.apiUrl) missing.push('AI_API_URL');
  if (!config.model) missing.push('AI_MODEL');

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * 获取预设列表（用于管理界面展示）
 */
export function getProviderPresets(): ProviderPreset[] {
  return Object.values(PRESETS);
}

/**
 * 获取当前 provider 的显示名称
 */
export function getProviderDisplayName(config: ProviderConfig): string {
  const preset = PRESETS[config.provider];
  return preset?.name || config.provider;
}
