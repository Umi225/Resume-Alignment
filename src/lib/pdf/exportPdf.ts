/**
 * ============================================
 * PDF 简历导出引擎
 * ============================================
 *
 * 技术方案：HTML → Canvas → Image → PDF (jspdf)
 *
 * 核心优势：
 * - 100% 保持 CSS 样式（因为是像素级截图）
 * - 中文完美支持（无需嵌入字体）
 * - 头像/图片自动包含
 * - A4 尺寸精确控制
 *
 * 导出模式：
 * - single-page: 强制缩放至单页 A4（适合投递）
 * - multi-page:  原始尺寸，自动分页（适合内容多的简历）
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// ============================================
// 常量
// ============================================

/** A4 尺寸（毫米） */
const A4_W = 210;
const A4_H = 297;

/** PDF 边距（毫米） */
const MARGIN = 0;

/** 可用内容区域 */
const CONTENT_W = A4_W - MARGIN * 2;
const CONTENT_H = A4_H - MARGIN * 2;

/** html2canvas 渲染精度倍率 */
const DEFAULT_SCALE = 2;

/** 单页模式最大缩放（防止文字过小） */
const MIN_SINGLE_PAGE_SCALE = 0.65;

// ============================================
// 类型
// ============================================

export type PdfExportMode = 'single-page' | 'multi-page';

export interface PdfExportOptions {
  /** 导出文件名（不含 .pdf） */
  filename?: string;
  /** 导出模式 */
  mode: PdfExportMode;
  /** html2canvas 渲染精度（默认 2，越高越清晰但越慢） */
  scale?: number;
  /** 导出进度回调 */
  onProgress?: (stage: PdfExportStage, progress: number) => void;
}

export type PdfExportStage =
  | 'preparing'   // 准备 DOM
  | 'rendering'   // html2canvas 渲染中
  | 'generating'  // jspdf 生成中
  | 'done';       // 完成

// ============================================
// 核心导出函数
// ============================================

/**
 * 将简历 DOM 导出为 PDF
 */
export async function exportResumeToPdf(
  element: HTMLElement,
  options: PdfExportOptions
): Promise<void> {
  const { filename, mode, scale = DEFAULT_SCALE, onProgress } = options;

  // --- Stage 1: 准备 DOM ---
  onProgress?.('preparing', 0.1);

  // 等待字体加载完成，避免预览和导出字体 fallback 不一致
  if (document.fonts) {
    await document.fonts.ready;
  }

  onProgress?.('preparing', 0.2);

  // 确保所有图片已加载（特别是头像）
  await preloadImages(element);

  onProgress?.('preparing', 0.3);

  // --- Stage 2: html2canvas 渲染 ---
  onProgress?.('rendering', 0.35);

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    // 修复某些情况下文字渲染模糊
    imageTimeout: 15000,
    // 确保截图时视口宽度与 DOM 宽度一致，避免布局漂移
    windowWidth: element.scrollWidth,
    // 忽略外部滚动条等
    ignoreElements: (el) => el.tagName === 'SCRIPT' || el.tagName === 'NOSCRIPT',
  });

  onProgress?.('rendering', 0.7);

  // --- Stage 3: 生成 PDF ---
  onProgress?.('generating', 0.75);

  const pdf = mode === 'single-page'
    ? await generateSinglePagePdf(canvas)
    : await generateMultiPagePdf(canvas);

  onProgress?.('generating', 0.95);

  // --- Stage 4: 下载 ---
  const safeName = (filename || '简历').replace(/[\\/:*?"<>|]/g, '_');
  pdf.save(`${safeName}.pdf`);

  onProgress?.('done', 1);
}

// ============================================
// 单页模式：强制缩放至 A4 单页
// ============================================

async function generateSinglePagePdf(canvas: HTMLCanvasElement): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const imgData = canvas.toDataURL('image/png');

  // 基于实际 canvas 像素与 PDF 内容宽度的比例映射
  // canvas.width 对应 CONTENT_W (210mm)，高度按比例
  const mmPerPx = CONTENT_W / canvas.width;
  const imgW_mm = CONTENT_W;
  const imgH_mm = canvas.height * mmPerPx;

  // 单页模式：计算缩放比例
  let drawW = imgW_mm;
  let drawH = imgH_mm;

  // 如果高度超出 A4，按高度缩放
  if (drawH > CONTENT_H) {
    const ratio = CONTENT_H / drawH;
    drawH = CONTENT_H;
    drawW *= ratio;
  }

  // 如果缩放后文字过小，限制最小缩放
  const minRatio = MIN_SINGLE_PAGE_SCALE;
  const actualRatio = drawW / imgW_mm;
  if (actualRatio < minRatio) {
    const clampRatio = minRatio / actualRatio;
    drawW *= clampRatio;
    drawH *= clampRatio;
    // 如果超出了，居中裁剪显示
    if (drawW > CONTENT_W || drawH > CONTENT_H) {
      // 继续缩放到适配
      const fitRatio = Math.min(CONTENT_W / drawW, CONTENT_H / drawH);
      drawW *= fitRatio;
      drawH *= fitRatio;
    }
  }

  // 居中放置
  const x = MARGIN + (CONTENT_W - drawW) / 2;
  const y = MARGIN + (CONTENT_H - drawH) / 2;

  pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);

  return pdf;
}

// ============================================
// 多页模式：自动分页
// ============================================

async function generateMultiPagePdf(canvas: HTMLCanvasElement): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // 基于实际 canvas 像素与 PDF 内容宽度的比例映射
  const mmPerPx = CONTENT_W / canvas.width;

  const imgW_mm = CONTENT_W;
  const imgH_mm = canvas.height * mmPerPx;

  // 如果内容高度 <= A4，直接单页
  if (imgH_mm <= CONTENT_H) {
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, imgW_mm, imgH_mm);
    return pdf;
  }

  // 需要分页：逐页裁剪 canvas
  const pageHeightPx = CONTENT_H / mmPerPx;
  const totalPages = Math.ceil(canvas.height / pageHeightPx);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage('a4', 'portrait');
    }

    // 计算当前页裁剪区域
    const sy = page * pageHeightPx;
    const sh = Math.min(pageHeightPx, canvas.height - sy);

    // 创建当前页的临时 canvas
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sh;

    const ctx = pageCanvas.getContext('2d');
    if (!ctx) continue;

    // 白色背景（防止透明）
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    // 绘制裁剪区域
    ctx.drawImage(
      canvas,
      0, sy, canvas.width, sh,
      0, 0, pageCanvas.width, sh
    );

    const pageImgData = pageCanvas.toDataURL('image/png');
    const pageH_mm = sh * mmPerPx;

    pdf.addImage(pageImgData, 'PNG', MARGIN, MARGIN, imgW_mm, pageH_mm);
  }

  return pdf;
}

// ============================================
// 图片预加载（避免头像缺失）
// ============================================

function preloadImages(container: HTMLElement): Promise<void> {
  const images = container.querySelectorAll('img');
  const promises = Array.from(images).map((img) => {
    // 已经是 data URL 的图片无需处理
    if (img.src.startsWith('data:')) return Promise.resolve();

    return new Promise<void>((resolve) => {
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      tempImg.onload = () => {
        // 将跨域图片转为 data URL，避免 canvas taint
        try {
          const canvas = document.createElement('canvas');
          canvas.width = tempImg.naturalWidth;
          canvas.height = tempImg.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(tempImg, 0, 0);
            img.src = canvas.toDataURL('image/png');
          }
        } catch {
          // 如果转换失败，保留原 src
        }
        resolve();
      };
      tempImg.onerror = () => resolve();
      tempImg.src = img.src;
    });
  });

  return Promise.all(promises).then(() => undefined);
}

// ============================================
// 辅助：估算 DOM 渲染后高度（用于 UI 提示）
// ============================================

/**
 * 估算简历内容需要多少页 A4
 */
export function estimatePageCount(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  // 基于实际 DOM 宽度与 A4 宽度的比例，计算高度对应的毫米值
  const mmPerPx = CONTENT_W / rect.width;
  const heightMm = rect.height * mmPerPx;
  return Math.max(1, Math.ceil(heightMm / A4_H));
}

/**
 * 估算单页模式下的缩放比例
 */
export function estimateSinglePageScale(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  const mmPerPx = CONTENT_W / rect.width;
  const widthMm = rect.width * mmPerPx;
  const heightMm = rect.height * mmPerPx;

  const widthScale = CONTENT_W / widthMm;
  const heightScale = CONTENT_H / heightMm;

  return Math.min(widthScale, heightScale, 1);
}
