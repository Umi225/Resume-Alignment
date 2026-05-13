'use client';

import { cn } from '@/lib/utils';
import { Briefcase, FileText, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/experiences', label: '经历资产', icon: LayoutDashboard },
  { href: '/jd-workbench', label: 'JD 对齐', icon: Briefcase },
  { href: '/resume-editor', label: '简历编辑', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[200px] flex-col border-r border-zinc-200 bg-white">
      {/* Logo */}
      <div className="flex h-[52px] items-center px-5">
        <span className="text-caption font-semibold tracking-tight text-zinc-900">
          简历工作台
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 pt-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-caption transition-colors',
                isActive
                  ? 'bg-zinc-900 font-medium text-white'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
              )}
            >
              <Icon className="h-[15px] w-[15px]" strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="px-5 py-3">
        <p className="text-micro text-zinc-400">
          AI 求职副驾驶
        </p>
      </div>
    </aside>
  );
}
