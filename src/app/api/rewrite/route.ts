/**
 * ============================================
 * AI Rewrite API Route
 * ============================================
 *
 * 职责：处理 AI 优化请求
 *
 * 架构：
 * 1. 从环境变量加载 Provider 配置（支持 OpenAI / Kimi / 自定义）
 * 2. 使用统一 AIClient（fetch-based，零 SDK 依赖）调用 API
 * 3. 用 responseParser 解析结构化结果
 * 4. 返回 JSON
 *
 * 环境变量（全部在服务端读取，绝不暴露到前端）：
 * - AI_PROVIDER  : openai | kimi | custom（默认 custom）
 * - AI_API_KEY   : API 密钥
 * - AI_API_URL   : API 端点
 * - AI_MODEL     : 模型名称
 * - AI_TEMPERATURE : 温度（默认 0.3）
 * - AI_MAX_TOKENS  : 最大 token（默认 4096）
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildPrompt } from '@/lib/ai/promptBuilder';
import { parseAIResponse } from '@/lib/ai/responseParser';
import { loadProviderConfig, validateProviderConfig } from '@/lib/ai/provider';
import { AIClient } from '@/lib/ai/aiClient';
import type { RewriteAPIRequest, RewriteAPIResponse } from '@/lib/ai/types';

/**
 * Provider 配置（服务端单例，首次请求时加载）
 */
const providerConfig = loadProviderConfig();

export async function POST(req: NextRequest) {
  try {
    // ====== 1. 解析请求 ======
    const body: RewriteAPIRequest = await req.json();

    if (!body.target || !body.targetType) {
      return NextResponse.json(
        { success: false, error: '缺少 target 或 targetType' } satisfies RewriteAPIResponse,
        { status: 400 }
      );
    }

    const originalBullets =
      'bullets' in body.target ? body.target.bullets : [];

    if (originalBullets.length === 0) {
      return NextResponse.json(
        { success: false, error: '目标经历没有描述内容' } satisfies RewriteAPIResponse,
        { status: 400 }
      );
    }

    // ====== 2. 构建 Prompt ======
    const prompt = buildPrompt({
      targetType: body.targetType,
      targetData: body.target,
      jdText: body.jobDescription,
      mode: body.mode,
      userInstruction: body.userInstruction,
    });

    // ====== 3. 开发模式：无 API Key 返回模拟数据 ======
    if (providerConfig.devMode) {
      const mockResult = generateMockResult(originalBullets, body.mode);
      return NextResponse.json(
        { success: true, result: mockResult } satisfies RewriteAPIResponse,
        { status: 200 }
      );
    }

    // ====== 4. 验证 Provider 配置 ======
    const validation = validateProviderConfig(providerConfig);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: `环境变量未配置: ${validation.missing.join(', ')}`,
        } satisfies RewriteAPIResponse,
        { status: 500 }
      );
    }

    // ====== 5. 调用 AI API（统一客户端） ======
    const client = new AIClient({ config: providerConfig });

    const response = await client.chatCompletion({
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: providerConfig.temperature,
      max_tokens: providerConfig.maxTokens,
    });

    const rawContent = AIClient.extractContent(response);

    if (!rawContent) {
      return NextResponse.json(
        { success: false, error: 'AI 返回内容为空' } satisfies RewriteAPIResponse,
        { status: 502 }
      );
    }

    // ====== 6. 解析响应 ======
    const parseResult = parseAIResponse(rawContent, originalBullets);

    if (!parseResult.success || !parseResult.result) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error || '解析 AI 响应失败',
        } satisfies RewriteAPIResponse,
        { status: 502 }
      );
    }

    // ====== 7. 返回结果 ======
    return NextResponse.json(
      { success: true, result: parseResult.result } satisfies RewriteAPIResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('AI Rewrite API Error:', error);

    // 统一错误响应格式
    const message =
      error instanceof Error ? error.message : '服务器内部错误';

    return NextResponse.json(
      { success: false, error: message } satisfies RewriteAPIResponse,
      { status: 500 }
    );
  }
}

// ============================================
// 开发模式模拟数据
// ============================================

import type { RewriteResult } from '@/lib/ai/types';

function generateMockResult(
  originalBullets: string[],
  mode: string
): RewriteResult {
  const rewrittenBullets = originalBullets.map((original, i) => {
    if (mode === 'polish') {
      return {
        original,
        optimized: original.replace(/负责/g, '承担').replace(/相关/g, ''),
        changeType: 'polish' as const,
        explanation: '润色表达，提升专业度',
        confidence: 'verified' as const,
      };
    }

    if (mode === 'action') {
      return {
        original,
        optimized: original
          .replace(/负责/g, '主导')
          .replace(/参与/g, '独立执行')
          .replace(/做了/g, '完成'),
        changeType: 'strengthen' as const,
        explanation: '强化动词，明确动作主体',
        confidence: 'pending_confirm' as const,
      };
    }

    if (mode === 'result') {
      const hasNumber = /\d/.test(original);
      if (hasNumber) {
        return {
          original,
          optimized: original.replace(/提升/, '提升【待补充：具体百分比】'),
          changeType: 'strengthen' as const,
          explanation: '突出量化成果',
          confidence: 'verified' as const,
        };
      }
      return {
        original,
        optimized: original + '，实现【待补充：具体指标】',
        changeType: 'pending' as const,
        explanation: '建议补充量化指标',
        confidence: 'pending_supplement' as const,
      };
    }

    const isWeak = /参与|负责|相关/.test(original);
    if (isWeak) {
      return {
        original,
        optimized: original
          .replace(/负责相关/g, '主导')
          .replace(/参与/g, '深度参与')
          .replace(/相关/g, '')
          + (i === 0 ? '，支撑日活 100w+' : ''),
        changeType: i === 0 ? ('restructure' as const) : ('terminology' as const),
        explanation: '删除模糊词，应用 STAR 结构',
        confidence: 'pending_confirm' as const,
      };
    }

    return {
      original,
      optimized: original,
      changeType: 'keep' as const,
      explanation: '原文表达已较好',
      confidence: 'verified' as const,
    };
  });

  const hasWeak = originalBullets.some((b) =>
    /参与|负责|相关/.test(b)
  );

  return {
    originalBullets,
    rewrittenBullets,
    suggestions: hasWeak
      ? [
          {
            category: 'structure',
            title: '建议应用 STAR 法则',
            detail:
              '部分描述缺少清晰的 Situation 和 Result，建议补充背景上下文和可量化结果。',
            priority: 'medium' as const,
          },
          {
            category: 'terminology',
            title: '术语密度可以提升',
            detail:
              '建议在描述中更多使用岗位相关的技术术语，提高专业度。',
            priority: 'low' as const,
          },
        ]
      : [],
    warnings: hasWeak
      ? [
          {
            type: 'weak_verb',
            bulletIndex: 0,
            message: '"负责"、"参与"等动词未能体现具体贡献度',
            suggestion: '尝试使用"主导"、"设计"、"实现"等强动词',
          },
          {
            type: 'vague_description',
            bulletIndex: originalBullets.length > 1 ? 1 : 0,
            message: '描述中存在模糊词汇（"相关"、"各种"等）',
            suggestion: '删除模糊词，明确具体事项',
          },
        ]
      : [],
    missingMetrics: hasWeak
      ? [
          {
            bulletIndex: 0,
            description: '缺少团队规模或业务规模数据',
            suggestion: '补充如"带领 X 人团队"、"支撑 X 万日活"等量化信息',
            severity: 'medium' as const,
          },
        ]
      : [],
    fabricationBlocked: false,
    overallConfidence: hasWeak ? 'medium' : 'high',
    summary: hasWeak
      ? '已识别到部分表达可以优化，建议重点关注动词强化和量化补充。所有修改均基于原文事实。'
      : '原文表达已经比较完善，AI 进行了轻度润色。',
  };
}
