/**
 * ============================================
 * Diff Engine
 * ============================================
 *
 * 职责：对比原文和 AI 优化版，生成高亮差异
 *
 * 算法：基于 LCS（最长公共子序列）的文本差异分析
 * 输出：逐字符/逐词级别的差异块
 */

import type { BulletDiff, DiffChunk, ChangeType, ConfidenceLevel } from './types';

// ============================================
// LCS 差异算法
// ============================================

interface LCSResult {
  /** 差异序列 */
  sequence: Array<{
    type: 'equal' | 'delete' | 'insert';
    oldText: string;
    newText: string;
  }>;
}

/**
 * 基于字符的最长公共子序列（LCS）
 */
function computeLCS(oldStr: string, newStr: string): LCSResult {
  const oldChars = Array.from(oldStr);
  const newChars = Array.from(newStr);
  const m = oldChars.length;
  const n = newChars.length;

  // 动态规划表
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldChars[i - 1] === newChars[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯生成差异
  const sequence: LCSResult['sequence'] = [];
  let i = m;
  let j = n;

  // 临时缓冲区，用于合并连续的同类型操作
  let buffer: { type: 'equal' | 'delete' | 'insert'; oldChars: string[]; newChars: string[] } | null = null;

  function flushBuffer() {
    if (!buffer) return;
    sequence.unshift({
      type: buffer.type,
      oldText: buffer.oldChars.reverse().join(''),
      newText: buffer.newChars.reverse().join(''),
    });
    buffer = null;
  }

  function pushChar(type: 'equal' | 'delete' | 'insert', oldC: string, newC: string) {
    if (!buffer || buffer.type !== type) {
      flushBuffer();
      buffer = { type, oldChars: [], newChars: [] };
    }
    buffer.oldChars.push(oldC);
    buffer.newChars.push(newC);
  }

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldChars[i - 1] === newChars[j - 1]) {
      pushChar('equal', oldChars[i - 1], newChars[j - 1]);
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      pushChar('insert', '', newChars[j - 1]);
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      pushChar('delete', oldChars[i - 1], '');
      i--;
    } else {
      break;
    }
  }

  flushBuffer();
  return { sequence };
}

/**
 * 将 LCS 结果合并为更简洁的 DiffChunk
 * 合并相邻的 equal 段，优化小片段
 */
function consolidateChunks(sequence: LCSResult['sequence']): DiffChunk[] {
  const chunks: DiffChunk[] = [];
  let oldPos = 0;
  let newPos = 0;

  for (const item of sequence) {
    const oldLen = Array.from(item.oldText).length;
    const newLen = Array.from(item.newText).length;

    if (item.type === 'equal') {
      // 合并连续的 equal
      const last = chunks[chunks.length - 1];
      if (last && last.type === 'equal') {
        last.oldText += item.oldText;
        last.newText += item.newText;
      } else {
        chunks.push({
          type: 'equal',
          oldText: item.oldText,
          newText: item.newText,
          oldStart: oldPos,
          newStart: newPos,
        });
      }
      oldPos += oldLen;
      newPos += newLen;
    } else if (item.type === 'delete') {
      // 检查是否与下一个 insert 组成 replace
      chunks.push({
        type: 'delete',
        oldText: item.oldText,
        newText: '',
        oldStart: oldPos,
        newStart: newPos,
      });
      oldPos += oldLen;
    } else {
      // insert
      chunks.push({
        type: 'insert',
        oldText: '',
        newText: item.newText,
        oldStart: oldPos,
        newStart: newPos,
      });
      newPos += newLen;
    }
  }

  // 第二轮：将相邻的 delete + insert 合并为 replace
  const merged: DiffChunk[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const curr = chunks[i];
    const next = chunks[i + 1];

    if (
      curr.type === 'delete' &&
      next &&
      next.type === 'insert' &&
      // 避免跨太大距离合并
      Math.abs(curr.oldStart - next.oldStart) <= 1
    ) {
      merged.push({
        type: 'replace',
        oldText: curr.oldText,
        newText: next.newText,
        oldStart: curr.oldStart,
        newStart: next.newStart,
      });
      i++; // 跳过 next
    } else {
      merged.push(curr);
    }
  }

  return merged;
}

// ============================================
// 主 Diff 计算
// ============================================

/**
 * 计算单条 bullet 的差异
 */
export function diffBullet(
  original: string,
  optimized: string,
  bulletIndex: number,
  changeType: ChangeType,
  confidence: ConfidenceLevel
): BulletDiff {
  // 如果文本完全相同，直接返回无变化
  if (original === optimized) {
    return {
      bulletIndex,
      chunks: [
        {
          type: 'equal',
          oldText: original,
          newText: optimized,
          oldStart: 0,
          newStart: 0,
        },
      ],
      hasChanges: false,
      changeType,
      confidence,
    };
  }

  const lcs = computeLCS(original, optimized);
  const chunks = consolidateChunks(lcs.sequence);

  return {
    bulletIndex,
    chunks,
    hasChanges: true,
    changeType,
    confidence,
  };
}

/**
 * 批量计算多条 bullet 的差异
 */
export function diffAllBullets(
  originals: string[],
  optimized: { text: string; changeType: ChangeType; confidence: ConfidenceLevel }[]
): BulletDiff[] {
  const diffs: BulletDiff[] = [];
  const maxLen = Math.max(originals.length, optimized.length);

  for (let i = 0; i < maxLen; i++) {
    const original = originals[i] || '';
    const opt = optimized[i];

    if (opt) {
      diffs.push(diffBullet(original, opt.text, i, opt.changeType, opt.confidence));
    } else {
      // 缺少优化结果，视为 keep
      diffs.push({
        bulletIndex: i,
        chunks: [
          {
            type: 'equal',
            oldText: original,
            newText: original,
            oldStart: 0,
            newStart: 0,
          },
        ],
        hasChanges: false,
        changeType: 'keep',
        confidence: 'verified',
      });
    }
  }

  return diffs;
}

// ============================================
// Diff 统计工具
// ============================================

export interface DiffStats {
  totalBullets: number;
  changedBullets: number;
  unchangedBullets: number;
  insertions: number;
  deletions: number;
  replacements: number;
  pendingConfirmations: number;
  pendingSupplements: number;
}

export function computeDiffStats(diffs: BulletDiff[]): DiffStats {
  let insertions = 0;
  let deletions = 0;
  let replacements = 0;
  let changedBullets = 0;
  let pendingConfirmations = 0;
  let pendingSupplements = 0;

  for (const diff of diffs) {
    if (diff.hasChanges) changedBullets++;
    if (diff.confidence === 'pending_confirm') pendingConfirmations++;
    if (diff.confidence === 'pending_supplement') pendingSupplements++;

    for (const chunk of diff.chunks) {
      if (chunk.type === 'insert') {
        insertions += Array.from(chunk.newText).length;
      } else if (chunk.type === 'delete') {
        deletions += Array.from(chunk.oldText).length;
      } else if (chunk.type === 'replace') {
        replacements++;
        deletions += Array.from(chunk.oldText).length;
        insertions += Array.from(chunk.newText).length;
      }
    }
  }

  return {
    totalBullets: diffs.length,
    changedBullets,
    unchangedBullets: diffs.length - changedBullets,
    insertions,
    deletions,
    replacements,
    pendingConfirmations,
    pendingSupplements,
  };
}

// ============================================
// 简单文本 Diff（用于快速预览）
// ============================================

/**
 * 快速计算两段文本的差异（词级别）
 * 适用于较长文本的粗略对比
 */
export function diffWords(oldText: string, newText: string): DiffChunk[] {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  const m = oldWords.length;
  const n = newWords.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const chunks: DiffChunk[] = [];
  let i = m;
  let j = n;
  let oldPos = 0;
  let newPos = 0;

  let oldBuffer = '';
  let newBuffer = '';
  let currType: 'equal' | 'delete' | 'insert' = 'equal';

  function flush() {
    if (oldBuffer || newBuffer) {
      let type: DiffChunk['type'] = currType;
      if (currType === 'delete' && newBuffer) type = 'replace';
      if (currType === 'insert' && oldBuffer) type = 'replace';
      chunks.unshift({
        type,
        oldText: oldBuffer,
        newText: newBuffer,
        oldStart: 0,
        newStart: 0,
      });
      oldBuffer = '';
      newBuffer = '';
    }
  }

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      if (currType !== 'equal') {
        flush();
        currType = 'equal';
      }
      oldBuffer = oldWords[i - 1] + oldBuffer;
      newBuffer = newWords[j - 1] + newBuffer;
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      if (currType !== 'insert') {
        flush();
        currType = 'insert';
      }
      newBuffer = newWords[j - 1] + newBuffer;
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      if (currType !== 'delete') {
        flush();
        currType = 'delete';
      }
      oldBuffer = oldWords[i - 1] + oldBuffer;
      i--;
    } else {
      break;
    }
  }

  flush();

  // 设置正确的位置
  let oldAcc = 0;
  let newAcc = 0;
  for (const chunk of chunks) {
    chunk.oldStart = oldAcc;
    chunk.newStart = newAcc;
    oldAcc += chunk.oldText.length;
    newAcc += chunk.newText.length;
  }

  return chunks;
}
