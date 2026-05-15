/**
 * ============================================
 * AI Response Parser
 * ============================================
 *
 * 职责：将 AI 返回的 JSON 字符串解析为结构化的 RewriteResult
 *
 * 安全原则：
 * 1. 任何字段缺失时提供安全默认值
 * 2. 检测到编造嫌疑时设置 fabricationBlocked
 * 3. 对异常输入友好降级，不抛错阻断流程
 */

import type {
  RewriteResult,
  BulletRewrite,
  OptimizationSuggestion,
  RiskWarning,
  MissingMetric,
  ChangeType,
  ConfidenceLevel,
} from './types';

// ============================================
// 编造检测规则
// ============================================

const FABRICATION_PATTERNS = [
  // 中文编造提示
  /编(一个|段|份|些|造)/i,
  /造(一个|段|份|些)/i,
  /没有.*但.*写/i,
  /美化成/i,
  /包装成/i,
  /帮忙虚构/i,
  /扩写成/i,
  /凭空/i,
  /假(装|的|造)/i,
  // 数字异常
  /\d{5,}%/, // 超过 1000% 的增长率通常可疑
  /\d{3,}\+?人/, // 超过 999 人的团队需要核实
  /\d{8,}/, // 超过千万的金额需要核实
];

/**
 * 检测回复中是否包含编造内容
 */
function detectFabrication(rawText: string, parsed: unknown): boolean {
  const text = rawText.toLowerCase();

  // 规则 1：匹配编造关键词
  for (const pattern of FABRICATION_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // 规则 2：检测异常数字
  const suspiciousNumbers = text.match(/(\d+(?:\.\d+)?)\s*(?:%|倍|x)/g);
  if (suspiciousNumbers) {
    for (const num of suspiciousNumbers) {
      const value = parseFloat(num);
      if (value > 10000 || (value > 1000 && num.includes('%'))) {
        return true;
      }
    }
  }

  // 规则 3：检测 confidence 全为 verified 但内容明显新增信息
  const result = parsed as Partial<RewriteResult>;
  if (result.rewrittenBullets) {
    for (const bullet of result.rewrittenBullets) {
      if (
        bullet.confidence === 'verified' &&
        bullet.changeType !== 'keep' &&
        bullet.changeType !== 'polish'
      ) {
        // 检查 optimized 是否包含原文没有的新实体
        const originalWords = new Set(
          (bullet.original || '').split(/\s+/).map((w) => w.toLowerCase())
        );
        const optimizedWords = (bullet.optimized || '').split(/\s+/);
        const newWords = optimizedWords.filter(
          (w) => w.length > 3 && !originalWords.has(w.toLowerCase())
        );
        if (newWords.length > optimizedWords.length * 0.4) {
          // 超过 40% 的新词，标记为可疑
          return true;
        }
      }
    }
  }

  return false;
}

// ============================================
// 安全解析辅助函数
// ============================================

function safeString(value: unknown, fallback: string = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function safeNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function safeArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value as T[];
  return fallback;
}

const VALID_CHANGE_TYPES: ChangeType[] = [
  'keep',
  'polish',
  'restructure',
  'terminology',
  'strengthen',
  'pending',
];

const VALID_CONFIDENCES: ConfidenceLevel[] = [
  'verified',
  'pending_supplement',
  'pending_confirm',
];

function safeChangeType(value: unknown): ChangeType {
  const str = safeString(value);
  return VALID_CHANGE_TYPES.includes(str as ChangeType)
    ? (str as ChangeType)
    : 'pending';
}

function safeConfidence(value: unknown): ConfidenceLevel {
  const str = safeString(value);
  return VALID_CONFIDENCES.includes(str as ConfidenceLevel)
    ? (str as ConfidenceLevel)
    : 'pending_confirm';
}

// ============================================
// 解析主函数
// ============================================

export interface ParseResult {
  success: boolean;
  result?: RewriteResult;
  error?: string;
}

/**
 * 解析 AI 返回的原始文本
 */
export function parseAIResponse(rawText: string, originalBullets: string[]): ParseResult {
  // Step 1: 清洗输入（移除 markdown 代码块标记）
  const cleaned = cleanRawResponse(rawText);

  // Step 2: 尝试解析 JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // JSON 解析失败，尝试提取 JSON 子串
    const extracted = extractJSON(cleaned);
    if (!extracted) {
      return {
        success: false,
        error: 'AI 输出格式异常，请重新优化',
      };
    }
    try {
      parsed = JSON.parse(extracted);
    } catch {
      return {
        success: false,
        error: 'AI 输出格式异常，请重新优化',
      };
    }
  }

  // Step 3: 编造检测
  const fabricationDetected = detectFabrication(rawText, parsed);

  // Step 4: 结构化为 RewriteResult
  const result = normalizeResult(parsed, originalBullets, fabricationDetected);

  // Step 5: 严格验证结果质量（不通过则拒绝，不降级）
  const validation = validateResult(result, originalBullets);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'AI 输出格式异常，请重新优化',
    };
  }

  return { success: true, result };
}

/**
 * 清洗原始响应文本
 * 优先提取 markdown 代码块内的内容，避免前后说明文字污染 JSON
 */
function cleanRawResponse(raw: string): string {
  // 尝试提取 ```json ... ``` 或 ``` ... ``` 代码块内的内容
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // Fallback：逐行清理标记
  return raw
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .replace(/^\s*json\s*/i, '')
    .trim();
}

/**
 * 从文本中提取第一个完整的顶层 JSON 对象
 * 使用括号深度追踪，避免匹配到字符串值内部的 { 或 }
 */
function extractJSON(text: string): string | null {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (ch === '\\') {
        escapeNext = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

/**
 * 将解析后的对象规范化为 RewriteResult
 */
function normalizeResult(
  parsed: unknown,
  originalBullets: string[],
  fabricationDetected: boolean
): RewriteResult {
  const obj = parsed as Record<string, unknown>;

  // 解析 rewrittenBullets
  const rawBullets = safeArray<Record<string, unknown>>(obj.rewrittenBullets);
  const rewrittenBullets: BulletRewrite[] = rawBullets.map((b, index) => {
    const original = safeString(b.original, originalBullets[index] || '');
    const optimized = safeString(b.optimized, original);

    return {
      original,
      optimized,
      changeType: safeChangeType(b.changeType),
      explanation: safeString(b.explanation),
      confidence: fabricationDetected ? 'pending_confirm' : safeConfidence(b.confidence),
    };
  });

  // 如果 bullet 数量不匹配，补齐或截断
  while (rewrittenBullets.length < originalBullets.length) {
    const idx = rewrittenBullets.length;
    rewrittenBullets.push({
      original: originalBullets[idx] || '',
      optimized: originalBullets[idx] || '',
      changeType: 'keep',
      explanation: 'AI 未返回此条优化结果，保留原文',
      confidence: 'verified',
    });
  }

  // 解析 suggestions
  const suggestions: OptimizationSuggestion[] = safeArray<Record<string, unknown>>(
    obj.suggestions
  ).map((s) => ({
    category: safeSuggestionCategory(s.category),
    title: safeString(s.title),
    detail: safeString(s.detail),
    priority: safePriority(s.priority),
  }));

  // 解析 warnings
  const warnings: RiskWarning[] = safeArray<Record<string, unknown>>(obj.warnings).map(
    (w) => ({
      type: safeWarningType(w.type),
      bulletIndex: Math.min(
        safeNumber(w.bulletIndex, 0),
        originalBullets.length - 1
      ),
      message: safeString(w.message),
      suggestion: safeString(w.suggestion),
    })
  );

  // 解析 missingMetrics
  const missingMetrics: MissingMetric[] = safeArray<Record<string, unknown>>(
    obj.missingMetrics
  ).map((m) => ({
    bulletIndex: Math.min(
      safeNumber(m.bulletIndex, 0),
      originalBullets.length - 1
    ),
    description: safeString(m.description),
    suggestion: safeString(m.suggestion),
    severity: safeSeverity(m.severity),
  }));

  // 计算 overallConfidence
  const overallConfidence = fabricationDetected
    ? 'low'
    : safeOverallConfidence(obj.overallConfidence);

  return {
    originalBullets,
    rewrittenBullets,
    suggestions,
    warnings,
    missingMetrics,
    fabricationBlocked: fabricationDetected,
    overallConfidence,
    summary: fabricationDetected
      ? '检测到 AI 输出可能存在编造内容，已标记所有项为待确认。请仔细核对每一条修改。'
      : safeString(obj.summary),
  };
}

// ============================================
// 结果质量验证（拒绝垃圾输出，不降级）
// ============================================

function validateResult(
  result: RewriteResult,
  originalBullets: string[]
): { valid: boolean; error?: string } {
  // 1. bullet 数量必须匹配
  if (result.rewrittenBullets.length !== originalBullets.length) {
    return {
      valid: false,
      error: `AI 输出格式异常：bullet 数量不匹配（期望 ${originalBullets.length} 条，实际 ${result.rewrittenBullets.length} 条）`,
    };
  }

  // 2. 每条 optimized 必须是非空、合理的字符串
  for (let i = 0; i < result.rewrittenBullets.length; i++) {
    const b = result.rewrittenBullets[i];
    const opt = b.optimized?.trim() || '';

    if (!opt) {
      return {
        valid: false,
        error: `AI 输出格式异常：第 ${i + 1} 条优化结果为空`,
      };
    }

    // 检测到 JSON / markdown 泄漏
    if (opt.includes('```') || opt.includes('```json')) {
      return {
        valid: false,
        error: `AI 输出格式异常：第 ${i + 1} 条包含 markdown 代码块标记`,
      };
    }

    // 检测到 JSON 对象/数组泄漏（整条 optimized 就是一个可解析的 JSON 结构）
    if (/^\s*[\{\[]/.test(opt) && /[\}\]]\s*$/.test(opt)) {
      try {
        JSON.parse(opt);
        return {
          valid: false,
          error: `AI 输出格式异常：第 ${i + 1} 条整体为 JSON 结构，不是自然语言`,
        };
      } catch {
        // 不是有效 JSON（如 {待补充} 占位符），允许通过
      }
    }

    // 检测到嵌套 JSON 字段名泄漏
    if (opt.includes('"original":') || opt.includes('"optimized":') || opt.includes('"rewrittenBullets":')) {
      return {
        valid: false,
        error: `AI 输出格式异常：第 ${i + 1} 条包含 JSON 字段名泄漏`,
      };
    }

    // 检测到混乱拼接：同时包含多个 JSON 字段名和代码块标记
    const jsonFieldLeakCount = (opt.match(/"[a-zA-Z_]+":/g) || []).length;
    if (opt.length > 500 && jsonFieldLeakCount >= 3 && opt.includes('}') && opt.includes('{')) {
      return {
        valid: false,
        error: `AI 输出格式异常：第 ${i + 1} 条疑似拼接文本`,
      };
    }
  }

  return { valid: true };
}

// ============================================
// 安全转换辅助
// ============================================

function safeSuggestionCategory(value: unknown): OptimizationSuggestion['category'] {
  const str = safeString(value);
  const valid: OptimizationSuggestion['category'][] = [
    'structure',
    'quantify',
    'terminology',
    'jd_alignment',
    'general',
  ];
  return valid.includes(str as OptimizationSuggestion['category'])
    ? (str as OptimizationSuggestion['category'])
    : 'general';
}

function safePriority(value: unknown): OptimizationSuggestion['priority'] {
  const str = safeString(value);
  const valid: OptimizationSuggestion['priority'][] = ['high', 'medium', 'low'];
  return valid.includes(str as OptimizationSuggestion['priority'])
    ? (str as OptimizationSuggestion['priority'])
    : 'medium';
}

function safeWarningType(value: unknown): RiskWarning['type'] {
  const str = safeString(value);
  const valid: RiskWarning['type'][] = [
    'missing_quantify',
    'vague_description',
    'weak_verb',
    'unverified_claim',
  ];
  return valid.includes(str as RiskWarning['type'])
    ? (str as RiskWarning['type'])
    : 'vague_description';
}

function safeSeverity(value: unknown): MissingMetric['severity'] {
  const str = safeString(value);
  const valid: MissingMetric['severity'][] = ['high', 'medium', 'low'];
  return valid.includes(str as MissingMetric['severity'])
    ? (str as MissingMetric['severity'])
    : 'medium';
}

function safeOverallConfidence(value: unknown): RewriteResult['overallConfidence'] {
  const str = safeString(value);
  const valid: RewriteResult['overallConfidence'][] = ['high', 'medium', 'low'];
  return valid.includes(str as RewriteResult['overallConfidence'])
    ? (str as RewriteResult['overallConfidence'])
    : 'medium';
}
