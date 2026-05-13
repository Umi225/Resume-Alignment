'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { exportResumeToPdf, estimatePageCount, estimateSinglePageScale } from '@/lib/pdf/exportPdf';
import type { PdfExportMode, PdfExportStage } from '@/lib/pdf/exportPdf';
import {
  FileDown,
  X,
  Loader2,
  FileText,
  Check,
  AlertTriangle,
  ZoomOut,
  ZoomIn,
} from 'lucide-react';

interface PdfExportModalProps {
  isOpen: boolean;
  targetRef: React.RefObject<HTMLElement>;
  filename?: string;
  onClose: () => void;
}

export function PdfExportModal({ isOpen, targetRef, filename, onClose }: PdfExportModalProps) {
  const [mode, setMode] = useState<PdfExportMode>('single-page');
  const [scale, setScale] = useState(2);
  const [exporting, setExporting] = useState(false);
  const [stage, setStage] = useState<PdfExportStage>('preparing');
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  // 估算信息
  const [pageEstimate, setPageEstimate] = useState(1);
  const [singlePageScale, setSinglePageScale] = useState(1);

  // 打开时估算
  useEffect(() => {
    if (isOpen) {
      const el = targetRef.current;
      if (el) {
        setPageEstimate(estimatePageCount(el));
        setSinglePageScale(estimateSinglePageScale(el));
      }
      setDone(false);
    }
  }, [isOpen, targetRef]);

  const handleExport = useCallback(async () => {
    const el = targetRef.current;
    if (!el) return;

    setExporting(true);
    setDone(false);
    setStage('preparing');
    setProgress(0);

    try {
      await exportResumeToPdf(el, {
        filename,
        mode,
        scale,
        onProgress: (s, p) => {
          setStage(s);
          setProgress(p);
        },
      });
      setDone(true);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('导出失败：' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setExporting(false);
    }
  }, [targetRef, filename, mode, scale]);

  if (!isOpen) return null;

  const stageLabels: Record<PdfExportStage, string> = {
    preparing: '准备中...',
    rendering: '渲染中...',
    generating: '生成 PDF...',
    done: '完成',
  };

  const isScaleWarning = mode === 'single-page' && singlePageScale < 0.75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4"
        >
          <div className="flex items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900"
            >
              <FileDown className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">导出 PDF</h2>
              <p className="text-xs text-zinc-500">A4 尺寸 · 高清渲染</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={exporting}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 px-6 py-5"
        >
          {/* Mode Selection */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              导出模式
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('single-page')}
                className={cn(
                  'flex flex-col items-center rounded-xl border p-4 text-center transition-all',
                  mode === 'single-page'
                    ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                )}
              >
                <ZoomOut className={cn('h-5 w-5', mode === 'single-page' ? 'text-zinc-900' : 'text-zinc-400')} />
                <span className={cn('mt-2 text-sm font-medium', mode === 'single-page' ? 'text-zinc-900' : 'text-zinc-600')}>
                  单页优先
                </span>
                <span className="mt-0.5 text-[11px] text-zinc-400">
                  适合投递
                </span>
              </button>

              <button
                onClick={() => setMode('multi-page')}
                className={cn(
                  'flex flex-col items-center rounded-xl border p-4 text-center transition-all',
                  mode === 'multi-page'
                    ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                )}
              >
                <FileText className={cn('h-5 w-5', mode === 'multi-page' ? 'text-zinc-900' : 'text-zinc-400')} />
                <span className={cn('mt-2 text-sm font-medium', mode === 'multi-page' ? 'text-zinc-900' : 'text-zinc-600')}>
                  自动分页
                </span>
                <span className="mt-0.5 text-[11px] text-zinc-400">
                  适合内容多
                </span>
              </button>
            </div>
          </section>

          {/* Scale Setting */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                渲染精度
              </h3>
              <span className="text-xs text-zinc-400">{scale}x</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScale((s) => Math.max(1, s - 0.5))}
                className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <div className="relative flex-1">
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.5}
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
                />
              </div>
              <button
                onClick={() => setScale((s) => Math.min(4, s + 0.5))}
                className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-50"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-400">
              精度越高 PDF 越清晰，但导出时间更长。推荐 2x。
            </p>
          </section>

          {/* Estimate Info */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">当前内容预估：</span>
              <span className="font-medium text-zinc-700">
                {pageEstimate} 页 A4
              </span>
            </div>
            {mode === 'single-page' && (
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-zinc-500">单页缩放比例：</span>
                <span className="font-medium text-zinc-700">
                  {Math.round(singlePageScale * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Scale Warning */}
          {isScaleWarning && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-700">
                内容较多，单页模式下文字会被压缩到 {Math.round(singlePageScale * 100)}%。
                建议精简内容或选择「自动分页」模式。
              </p>
            </div>
          )}

          {/* Progress */}
          {exporting && (
            <div className="space-y-2"
            >
              <div className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-1.5 text-zinc-600"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {stageLabels[stage]}
                </span>
                <span className="text-zinc-400">{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100"
              >
                <div
                  className="h-full rounded-full bg-zinc-900 transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Success */}
          {done && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5"
            >
              <Check className="h-4 w-4 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-700">PDF 已下载</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4"
        >
          <p className="text-[11px] text-zinc-400"
          >
            A4 · 210 × 297 mm
          </p>
          <div className="flex items-center gap-2"
          >
            <button
              onClick={onClose}
              disabled={exporting}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || done}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors',
                exporting || done
                  ? 'bg-zinc-400 cursor-not-allowed'
                  : 'bg-zinc-900 hover:bg-zinc-800'
              )}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  导出中...
                </>
              ) : done ? (
                <>
                  <Check className="h-4 w-4" />
                  已完成
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  导出 PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
