import type { ResumeProfile } from '@/types/resume';

const STORAGE_KEY = 'resume-profile-v1';

export function loadProfile(): ResumeProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ResumeProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: ResumeProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // 存储空间不足时静默失败
  }
}

export function exportBackup(): string {
  const profile = loadProfile();
  if (!profile) return '{}';
  return JSON.stringify(profile, null, 2);
}

export function importBackup(json: string): ResumeProfile | null {
  try {
    return JSON.parse(json) as ResumeProfile;
  } catch {
    return null;
  }
}
