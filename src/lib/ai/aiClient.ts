/**
 * ============================================
 * Unified AI Client
 * ============================================
 *
 * 职责：统一调用任意 OpenAI-compatible API
 *
 * 设计原则：
 * 1. 只用原生 fetch，零 SDK 依赖
 * 2. 请求/响应格式遵循 OpenAI Chat Completions API
 * 3. 兼容 Kimi、OpenAI、以及其他兼容服务
 * 4. 统一的错误处理和重试机制
 */

import type { ProviderConfig } from './provider';

// ============================================
// 请求类型
// ============================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  response_format?: { type: string };
}

// ============================================
// 响应类型（OpenAI-compatible）
// ============================================

export interface ChatCompletionChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string | null;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: ChatCompletionUsage;
}

// ============================================
// 错误类型
// ============================================

export class AIClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly responseBody?: string
  ) {
    super(message);
    this.name = 'AIClientError';
  }
}

// ============================================
// AI Client
// ============================================

export interface AIClientOptions {
  config: ProviderConfig;
  /** 请求超时（毫秒），默认 60000 */
  timeout?: number;
  /** 最大重试次数，默认 0（不重试） */
  maxRetries?: number;
}

export class AIClient {
  private config: ProviderConfig;
  private timeout: number;
  private maxRetries: number;

  constructor(options: AIClientOptions) {
    this.config = options.config;
    this.timeout = options.timeout || 60000;
    this.maxRetries = options.maxRetries || 0;
  }

  /**
   * 发送聊天补全请求
   */
  async chatCompletion(
    request: Omit<ChatCompletionRequest, 'model'>
  ): Promise<ChatCompletionResponse> {
    const body: ChatCompletionRequest = {
      ...request,
      model: this.config.model,
    };

    return this.fetchWithRetry(body);
  }

  /**
   * 带重试的 fetch
   */
  private async fetchWithRetry(
    body: ChatCompletionRequest,
    attempt = 0
  ): Promise<ChatCompletionResponse> {
    try {
      return await this.doFetch(body);
    } catch (error) {
      // 可重试错误：5xx 或网络错误
      const shouldRetry =
        error instanceof AIClientError &&
        error.status !== undefined &&
        error.status >= 500 &&
        attempt < this.maxRetries;

      if (shouldRetry) {
        const delay = Math.pow(2, attempt) * 1000;
        await sleep(delay);
        return this.fetchWithRetry(body, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * 执行 fetch
   */
  private async doFetch(body: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await res.text();

      if (!res.ok) {
        throw new AIClientError(
          `AI API 错误 (${res.status}): ${responseText}`,
          res.status,
          responseText
        );
      }

      let data: unknown;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new AIClientError(
          `AI API 返回非 JSON: ${responseText.slice(0, 200)}`,
          res.status,
          responseText
        );
      }

      // 验证响应结构（OpenAI-compatible）
      const validated = this.validateResponse(data);
      return validated;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AIClientError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIClientError('AI API 请求超时');
      }

      throw new AIClientError(
        error instanceof Error ? error.message : 'AI API 请求失败'
      );
    }
  }

  /**
   * 验证响应结构
   *
   * 兼容不同 provider 的细微差异：
   * - 有些 provider 不返回 usage
   * - 有些 provider 不返回 id/object/created
   */
  private validateResponse(data: unknown): ChatCompletionResponse {
    if (!data || typeof data !== 'object') {
      throw new AIClientError('AI API 返回格式异常：不是对象');
    }

    const obj = data as Record<string, unknown>;

    // 检查 choices（核心字段）
    if (!Array.isArray(obj.choices) || obj.choices.length === 0) {
      // 有些 provider 会在 error 字段返回错误
      if (obj.error && typeof obj.error === 'object') {
        const err = obj.error as Record<string, unknown>;
        const errMsg = typeof err.message === 'string' ? err.message : JSON.stringify(err);
        throw new AIClientError(`AI API 错误: ${errMsg}`);
      }
      throw new AIClientError('AI API 返回格式异常：缺少 choices');
    }

    const firstChoice = obj.choices[0];
    if (
      !firstChoice ||
      typeof firstChoice !== 'object' ||
      !firstChoice.message ||
      typeof firstChoice.message !== 'object' ||
      typeof firstChoice.message.content !== 'string'
    ) {
      throw new AIClientError('AI API 返回格式异常：choice 结构不正确');
    }

    return {
      id: typeof obj.id === 'string' ? obj.id : '',
      object: typeof obj.object === 'string' ? obj.object : 'chat.completion',
      created: typeof obj.created === 'number' ? obj.created : Date.now(),
      model: typeof obj.model === 'string' ? obj.model : this.config.model,
      choices: obj.choices as ChatCompletionChoice[],
      usage: obj.usage as ChatCompletionUsage | undefined,
    };
  }

  /**
   * 提取 choice 中的文本内容
   */
  static extractContent(response: ChatCompletionResponse): string {
    return response.choices[0]?.message?.content?.trim() || '';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
