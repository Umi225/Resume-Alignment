import type { Education, Experience, Project, Award, Certification, Skill, DateString } from '@/types/resume';

export function formatDateRange(start: DateString, end?: DateString): string {
  const e = end ?? '至今';
  return `${start} — ${e}`;
}

export function formatDateRangeShort(start: DateString, end?: DateString): string {
  const e = end ?? '至今';
  return `${start} ~ ${e}`;
}

export function formatDateRangeCompact(start: DateString, end?: DateString): string {
  const s = start.replace('-', '.');
  const e = end ? end.replace('-', '.') : '至今';
  return `${s} - ${e}`;
}

export function sortByDateDesc<T extends { startDate?: string; date?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const da = a.startDate || a.date || '';
    const db = b.startDate || b.date || '';
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return db.localeCompare(da);
  });
}

export function getAvatarSrc(avatar?: string): string | undefined {
  if (!avatar) return undefined;
  return avatar;
}

export function groupSkillsByCategory(skills: Skill[]): Map<string, Skill[]> {
  const map = new Map<string, Skill[]>();
  for (const skill of skills) {
    const cat = skill.category || '其他';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(skill);
  }
  return map;
}

export function renderBullets(bullets: string[], className?: string) {
  if (!bullets.length) return null;
  return (
    <ul className={className}>
      {bullets.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  );
}
