import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  rightPanel?: React.ReactNode;
  contentClassName?: string;
}

export function AppShell({ children, title, action, rightPanel, contentClassName }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* 左导航 —— 固定 */}
      <Sidebar />

      {/* 中间主工作区 */}
      <main className="flex flex-1 flex-col min-w-0 ml-[200px]">
        {/* 顶部标题栏 */}
        {(title || action) && (
          <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-sm">
            <h1 className="text-h3 text-zinc-900">{title}</h1>
            {action && <div className="flex items-center gap-2">{action}</div>}
          </header>
        )}

        {/* 内容区 */}
        <div
          className={
            contentClassName ??
            'flex flex-1 overflow-hidden'
          }
        >
          {children}
        </div>
      </main>

      {/* 右 AI 辅助栏 —— 弱化 */}
      {rightPanel && (
        <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-l border-zinc-200 bg-white">
          {rightPanel}
        </aside>
      )}
    </div>
  );
}
