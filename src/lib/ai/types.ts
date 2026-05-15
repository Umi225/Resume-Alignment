/**
 * ============================================
 * AI Rewrite Pipeline 类型定义
 * ============================================
 *
 * 设计原则：
 * 1. 所有 AI 输出必须结构化，禁止纯字符串黑盒
 * 2. 每个修改点必须可追踪、可解释、可用户确认
 * 3. 风险分层：verified / pending / warning / rejected
 */

import type { Experience, Project } from '@/types/resume';

// ============================================
// 改写请求类型
// ============================================

export type RewriteTargetType = 'experience' | 'project';

export type OptimizationMode =
  | 'full'        // 全面优化：表达 + 结构 + 术语
  | 'action'      // 仅强化 Action 动词
  | 'result'      // 仅强化 Result 量化
  | 'jd_match'    // 针对 JD 对齐关键词
  | 'polish';     // 轻度润色，保守策略

export interface RewriteRequest {
  /** 目标经历或项目 */
  target: Experience | Project;
  targetType: RewriteTargetType;
  /** 目标 JD（可选） */
  jobDescription?: string;
  /** 优化模式 */
  mode: OptimizationMode;
  /** 用户指定的优化方向 */
  userInstruction?: string;
}

// ============================================
// 结构化改写结果
// ============================================

/**
 * 单条 bullet 的改写结果
 */
export interface BulletRewrite {
  /** 原文 */
  original: string;
  /** 优化后文本 */
  optimized: string;
  /** 此 bullet 的修改类型 */
  changeType: ChangeType;
  /** 修改说明 */
  explanation: string;
  /** 置信度 */
  confidence: ConfidenceLevel;
}

/** 修改类型 */
export type ChangeType =
  | 'keep'         // 保留原文，无需修改
  | 'polish'       // 同义润色，事实未变
  | 'restructure'  // 结构调整（如应用 STAR）
  | 'terminology'  // 术语替换，对齐岗位语言
  | 'strengthen'   // 强化表达（动词/量化）
  | 'pending';     // 需用户补充信息

/** 置信度等级 */
export type ConfidenceLevel = 'verified' | 'pending_supplement' | 'pending_confirm';

/**
 * 待补充项
 */
export interface MissingMetric {
  /** 关联的 bullet 索引 */
  bulletIndex: number;
  /** 待补充的内容描述 */
  description: string;
  /** 补充方向建议 */
  suggestion: string;
  /** 重要性 */
  severity: 'high' | 'medium' | 'low';
}

/**
 * 风险提示
 */
export interface RiskWarning {
  /** 风险类型 */
  type: 'missing_quantify' | 'vague_description' | 'weak_verb' | 'unverified_claim';
  /** 关联的 bullet 索引 */
  bulletIndex: number;
  /** 风险描述 */
  message: string;
  /** 改进建议 */
  suggestion: string;
}

/**
 * 优化建议（给用户的 actionable 建议）
 */
export interface OptimizationSuggestion {
  /** 建议类别 */
  category: 'structure' | 'quantify' | 'terminology' | 'jd_alignment' | 'general';
  /** 建议标题 */
  title: string;
  /** 建议详情 */
  detail: string;
  /** 优先级 */
  priority: 'high' | 'medium' | 'low';
}

/**
 * AI 改写完整结果
 */
export interface RewriteResult {
  /** 原文 bullets */
  originalBullets: string[];
  /** 优化后的 bullets（逐条对应） */
  rewrittenBullets: BulletRewrite[];
  /** 全局优化建议 */
  suggestions: OptimizationSuggestion[];
  /** 风险提示 */
  warnings: RiskWarning[];
  /** 待补充项 */
  missingMetrics: MissingMetric[];
  /** 是否被篡改检测拦截 */
  fabricationBlocked: boolean;
  /** 整体置信度评估 */
  overallConfidence: 'high' | 'medium' | 'low';
  /** AI 总结说明 */
  summary: string;
}

// ============================================
// Diff 引擎类型
// ============================================

/** 文本差异单元 */
export interface DiffChunk {
  /** 差异类型 */
  type: 'equal' | 'insert' | 'delete' | 'replace';
  /** 原文片段 */
  oldText: string;
  /** 新文片段 */
  newText: string;
  /** 在原文中的起始位置 */
  oldStart: number;
  /** 在新文中的起始位置 */
  newStart: number;
}

/** 单条 bullet 的 Diff 结果 */
export interface BulletDiff {
  bulletIndex: number;
  chunks: DiffChunk[];
  hasChanges: boolean;
  changeType: ChangeType;
  confidence: ConfidenceLevel;
}

// ============================================
// Prompt 构建器类型
// ============================================

export interface PromptContext {
  targetType: RewriteTargetType;
  targetData: Experience | Project;
  jdText?: string;
  mode: OptimizationMode;
  userInstruction?: string;
}

export interface BuiltPrompt {
  system: string;
  user: string;
}

// ============================================
// API 类型
// ============================================

export interface RewriteAPIRequest {
  target: Experience | Project;
  targetType: RewriteTargetType;
  jobDescription?: string;
  mode: OptimizationMode;
  userInstruction?: string;
}

export interface RewriteAPIResponse {
  success: boolean;
  result?: RewriteResult;
  error?: string;
  meta?: {
    mode: 'mock' | 'live';
  };
}
