import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ResumeProfile,
  BasicInfo,
  Education,
  Experience,
  Project,
  Award,
  Certification,
  Skill,
  ID,
} from '@/types/resume';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function createEmptyProfile(): ResumeProfile {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    basicInfo: {
      name: '',
      phone: '',
      email: '',
    },
    education: [],
    experience: [],
    projects: [],
    awards: [],
    certifications: [],
    skills: [],
    versions: [],
    createdAt: now,
    updatedAt: now,
  };
}

interface ResumeState {
  profile: ResumeProfile;
  // 当前选中的经历（用于编辑面板）
  selectedId: ID | null;
  selectedType: string | null;
  // 筛选
  filterType: string | null;
  // 当前 JD（用于 AI 优化和 JD 对齐）
  currentJD: string;
  // Actions
  setFilterType: (type: string | null) => void;
  setCurrentJD: (jd: string) => void;
  selectExperience: (id: ID | null, type: string | null) => void;
  // BasicInfo
  updateBasicInfo: (info: Partial<BasicInfo>) => void;
  // Education
  addEducation: (edu: Omit<Education, 'id'>) => void;
  updateEducation: (id: ID, edu: Partial<Education>) => void;
  removeEducation: (id: ID) => void;
  // Experience
  addExperience: (exp: Omit<Experience, 'id'>) => void;
  updateExperience: (id: ID, exp: Partial<Experience>) => void;
  removeExperience: (id: ID) => void;
  // Project
  addProject: (proj: Omit<Project, 'id'>) => void;
  updateProject: (id: ID, proj: Partial<Project>) => void;
  removeProject: (id: ID) => void;
  // Award
  addAward: (award: Omit<Award, 'id'>) => void;
  updateAward: (id: ID, award: Partial<Award>) => void;
  removeAward: (id: ID) => void;
  // Certification
  addCertification: (cert: Omit<Certification, 'id'>) => void;
  updateCertification: (id: ID, cert: Partial<Certification>) => void;
  removeCertification: (id: ID) => void;
  // Skill
  addSkill: (skill: Omit<Skill, 'id'>) => void;
  updateSkill: (id: ID, skill: Partial<Skill>) => void;
  removeSkill: (id: ID) => void;
  // AI Optimization
  applyAIOptimization: (
    id: ID,
    type: 'experience' | 'project',
    optimizedBullets: string[]
  ) => void;
  discardAIOptimization: (id: ID, type: 'experience' | 'project') => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      profile: createEmptyProfile(),
      selectedId: null,
      selectedType: null,
      filterType: null,
      currentJD: '',

      setFilterType: (type) => set({ filterType: type }),
      setCurrentJD: (jd) => set({ currentJD: jd }),

      selectExperience: (id, type) => set({ selectedId: id, selectedType: type }),

      updateBasicInfo: (info) =>
        set((state) => ({
          profile: {
            ...state.profile,
            basicInfo: { ...state.profile.basicInfo, ...info },
            updatedAt: new Date().toISOString(),
          },
        })),

      // Education
      addEducation: (edu) =>
        set((state) => ({
          profile: {
            ...state.profile,
            education: [
              ...state.profile.education,
              { ...edu, id: generateId() },
            ],
            updatedAt: new Date().toISOString(),
          },
        })),
      updateEducation: (id, edu) =>
        set((state) => ({
          profile: {
            ...state.profile,
            education: state.profile.education.map((item) =>
              item.id === id ? { ...item, ...edu } : item
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
      removeEducation: (id) =>
        set((state) => ({
          profile: {
            ...state.profile,
            education: state.profile.education.filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
          selectedId: state.selectedId === id ? null : state.selectedId,
        })),

      // Experience
      addExperience: (exp) =>
        set((state) => ({
          profile: {
            ...state.profile,
            experience: [
              ...state.profile.experience,
              { ...exp, id: generateId() },
            ],
            updatedAt: new Date().toISOString(),
          },
        })),
      updateExperience: (id, exp) =>
        set((state) => ({
          profile: {
            ...state.profile,
            experience: state.profile.experience.map((item) =>
              item.id === id ? { ...item, ...exp } : item
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
      removeExperience: (id) =>
        set((state) => ({
          profile: {
            ...state.profile,
            experience: state.profile.experience.filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
          selectedId: state.selectedId === id ? null : state.selectedId,
        })),

      // Project
      addProject: (proj) =>
        set((state) => ({
          profile: {
            ...state.profile,
            projects: [
              ...state.profile.projects,
              { ...proj, id: generateId() },
            ],
            updatedAt: new Date().toISOString(),
          },
        })),
      updateProject: (id, proj) =>
        set((state) => ({
          profile: {
            ...state.profile,
            projects: state.profile.projects.map((item) =>
              item.id === id ? { ...item, ...proj } : item
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
      removeProject: (id) =>
        set((state) => ({
          profile: {
            ...state.profile,
            projects: state.profile.projects.filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
          selectedId: state.selectedId === id ? null : state.selectedId,
        })),

      // Award
      addAward: (award) =>
        set((state) => ({
          profile: {
            ...state.profile,
            awards: [
              ...state.profile.awards,
              { ...award, id: generateId() },
            ],
            updatedAt: new Date().toISOString(),
          },
        })),
      updateAward: (id, award) =>
        set((state) => ({
          profile: {
            ...state.profile,
            awards: state.profile.awards.map((item) =>
              item.id === id ? { ...item, ...award } : item
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
      removeAward: (id) =>
        set((state) => ({
          profile: {
            ...state.profile,
            awards: state.profile.awards.filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
          selectedId: state.selectedId === id ? null : state.selectedId,
        })),

      // Certification
      addCertification: (cert) =>
        set((state) => ({
          profile: {
            ...state.profile,
            certifications: [
              ...state.profile.certifications,
              { ...cert, id: generateId() },
            ],
            updatedAt: new Date().toISOString(),
          },
        })),
      updateCertification: (id, cert) =>
        set((state) => ({
          profile: {
            ...state.profile,
            certifications: state.profile.certifications.map((item) =>
              item.id === id ? { ...item, ...cert } : item
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
      removeCertification: (id) =>
        set((state) => ({
          profile: {
            ...state.profile,
            certifications: state.profile.certifications.filter(
              (item) => item.id !== id
            ),
            updatedAt: new Date().toISOString(),
          },
          selectedId: state.selectedId === id ? null : state.selectedId,
        })),

      // Skill
      addSkill: (skill) =>
        set((state) => ({
          profile: {
            ...state.profile,
            skills: [
              ...state.profile.skills,
              { ...skill, id: generateId() },
            ],
            updatedAt: new Date().toISOString(),
          },
        })),
      updateSkill: (id, skill) =>
        set((state) => ({
          profile: {
            ...state.profile,
            skills: state.profile.skills.map((item) =>
              item.id === id ? { ...item, ...skill } : item
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
      removeSkill: (id) =>
        set((state) => ({
          profile: {
            ...state.profile,
            skills: state.profile.skills.filter((item) => item.id !== id),
            updatedAt: new Date().toISOString(),
          },
          selectedId: state.selectedId === id ? null : state.selectedId,
        })),

      // AI Optimization
      applyAIOptimization: (id, type, optimizedBullets) =>
        set((state) => {
          const now = new Date().toISOString();
          if (type === 'experience') {
            return {
              profile: {
                ...state.profile,
                experience: state.profile.experience.map((item) =>
                  item.id === id
                    ? {
                        ...item,
                        bullets: optimizedBullets,
                        aiOptimized: {
                          bullets: optimizedBullets,
                          explanation: 'AI 优化已应用',
                          applied: true,
                        },
                      }
                    : item
                ),
                updatedAt: now,
              },
            };
          }
          return {
            profile: {
              ...state.profile,
              projects: state.profile.projects.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      bullets: optimizedBullets,
                      aiOptimized: {
                        bullets: optimizedBullets,
                        explanation: 'AI 优化已应用',
                        applied: true,
                      },
                    }
                  : item
              ),
              updatedAt: now,
            },
          };
        }),

      discardAIOptimization: (id, type) =>
        set((state) => {
          const now = new Date().toISOString();
          if (type === 'experience') {
            return {
              profile: {
                ...state.profile,
                experience: state.profile.experience.map((item) =>
                  item.id === id
                    ? { ...item, aiOptimized: undefined }
                    : item
                ),
                updatedAt: now,
              },
            };
          }
          return {
            profile: {
              ...state.profile,
              projects: state.profile.projects.map((item) =>
                item.id === id
                  ? { ...item, aiOptimized: undefined }
                  : item
              ),
              updatedAt: now,
            },
          };
        }),
    }),
    {
      name: 'resume-store-v1',
      version: 1,
      partialize: (state) => ({
        profile: state.profile,
        currentJD: state.currentJD,
      }),
    }
  )
);
