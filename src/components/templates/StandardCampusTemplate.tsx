import type { TemplateProps } from './types';
import { formatDateRangeCompact, sortByDateDesc, groupSkillsByCategory } from './utils';
import type { Education, Experience, Project, Award, Certification, Skill } from '@/types/resume';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 border-b-2 border-gray-800 pb-1">
      <h2 className="text-sm font-bold tracking-wider text-gray-900">{children}</h2>
    </div>
  );
}

function EducationItem({ edu }: { edu: Education }) {
  return (
    <div className="mb-2">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-900">{edu.school}</span>
          <span className="text-xs text-gray-600">{edu.degree} · {edu.major}</span>
        </div>
        <span className="text-xs text-gray-500">{formatDateRangeCompact(edu.startDate, edu.endDate)}</span>
      </div>
      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-500">
        {edu.gpa && <span>GPA: {edu.gpa}</span>}
        {edu.ranking && <span>排名: {edu.ranking}</span>}
        {edu.location && <span>{edu.location}</span>}
      </div>
      {edu.courses && edu.courses.length > 0 && (
        <p className="mt-0.5 text-xs text-gray-400">
          主修课程: {edu.courses.join('、')}
        </p>
      )}
    </div>
  );
}

function ExperienceItem({ exp }: { exp: Experience }) {
  return (
    <div className="mb-2.5">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-900">{exp.company}</span>
          <span className="text-xs text-gray-600">{exp.role}</span>
          {exp.department && <span className="text-xs text-gray-400">({exp.department})</span>}
        </div>
        <span className="text-xs text-gray-500">{formatDateRangeCompact(exp.startDate, exp.endDate)}</span>
      </div>
      {exp.location && <p className="text-xs text-gray-400">{exp.location}</p>}
      <ul className="mt-1 space-y-0.5">
        {exp.bullets.map((b, i) => (
          <li key={i} className="text-xs leading-relaxed text-gray-700">
            · {b}
          </li>
        ))}
      </ul>
      {exp.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {exp.tags.map((tag) => (
            <span key={tag} className="rounded bg-gray-100 px-1.5 py-0 text-[10px] text-gray-500">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectItem({ proj }: { proj: Project }) {
  return (
    <div className="mb-2.5">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-900">{proj.name}</span>
          <span className="text-xs text-gray-600">{proj.role}</span>
        </div>
        <span className="text-xs text-gray-500">{formatDateRangeCompact(proj.startDate, proj.endDate)}</span>
      </div>
      {proj.outcome && (
        <p className="text-xs font-medium text-gray-700">{proj.outcome}</p>
      )}
      <ul className="mt-1 space-y-0.5">
        {proj.bullets.map((b, i) => (
          <li key={i} className="text-xs leading-relaxed text-gray-700">
            · {b}
          </li>
        ))}
      </ul>
      {proj.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {proj.tags.map((tag) => (
            <span key={tag} className="rounded bg-gray-100 px-1.5 py-0 text-[10px] text-gray-500">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AwardItem({ award }: { award: Award }) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-gray-900">{award.name}</span>
        {award.level && <span className="text-xs text-gray-500">[{award.level}]</span>}
        {award.ranking && <span className="text-xs text-gray-600">{award.ranking}</span>}
      </div>
      <span className="text-xs text-gray-400">{award.date || ''}</span>
    </div>
  );
}

function CertificationItem({ cert }: { cert: Certification }) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-gray-900">{cert.name}</span>
        <span className="text-xs text-gray-500">{cert.issuer}</span>
      </div>
      <span className="text-xs text-gray-400">{cert.date}{cert.expiryDate ? ` (有效期至 ${cert.expiryDate})` : ''}</span>
    </div>
  );
}

function SkillsSection({ skills }: { skills: Skill[] }) {
  const groups = groupSkillsByCategory(skills);
  return (
    <div className="space-y-1.5">
      {Array.from(groups.entries()).map(([cat, items]) => (
        <div key={cat ?? 'uncategorized'} className="flex items-baseline gap-2">
          {cat && <span className="text-xs font-medium text-gray-700 shrink-0">{cat}:</span>}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {items.map((s) => (
              <span key={s.id} className="text-xs text-gray-600">
                {s.name}
                {s.description && ` ${s.description}`}
                {s.proficiency && <span className="text-gray-400">({s.proficiency})</span>}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StandardCampusTemplate({ profile }: TemplateProps) {
  const { basicInfo, education, experience, projects, awards, certifications, skills } = profile;

  const sortedEducation = sortByDateDesc(education);
  const sortedExperience = sortByDateDesc(experience);
  const sortedProjects = sortByDateDesc(projects);
  const sortedAwards = sortByDateDesc(awards);
  const sortedCertifications = sortByDateDesc(certifications);

  return (
    <div className="text-gray-900">
      {/* Header */}
      <header className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-wide text-gray-900">{basicInfo.name || '未填写姓名'}</h1>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600">
            {basicInfo.phone && <span>{basicInfo.phone}</span>}
            {basicInfo.email && <span>{basicInfo.email}</span>}
            {basicInfo.location && <span>{basicInfo.location}</span>}
            {basicInfo.github && <span>GitHub: {basicInfo.github}</span>}
            {basicInfo.website && <span>主页: {basicInfo.website}</span>}
          </div>
          {basicInfo.summary && (
            <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{basicInfo.summary}</p>
          )}
        </div>
        {basicInfo.avatar && (
          <img
            src={basicInfo.avatar}
            alt="avatar"
            className="ml-4 h-20 w-16 rounded object-cover border border-gray-200"
          />
        )}
      </header>

      {/* Education */}
      {sortedEducation.length > 0 && (
        <section className="mb-3">
          <SectionTitle>教育背景</SectionTitle>
          {sortedEducation.map((edu) => (
            <EducationItem key={edu.id} edu={edu} />
          ))}
        </section>
      )}

      {/* Experience */}
      {sortedExperience.length > 0 && (
        <section className="mb-3">
          <SectionTitle>实习/工作经历</SectionTitle>
          {sortedExperience.map((exp) => (
            <ExperienceItem key={exp.id} exp={exp} />
          ))}
        </section>
      )}

      {/* Projects */}
      {sortedProjects.length > 0 && (
        <section className="mb-3">
          <SectionTitle>项目经历</SectionTitle>
          {sortedProjects.map((proj) => (
            <ProjectItem key={proj.id} proj={proj} />
          ))}
        </section>
      )}

      {/* Awards */}
      {sortedAwards.length > 0 && (
        <section className="mb-3">
          <SectionTitle>荣誉奖项</SectionTitle>
          {sortedAwards.map((award) => (
            <AwardItem key={award.id} award={award} />
          ))}
        </section>
      )}

      {/* Certifications */}
      {sortedCertifications.length > 0 && (
        <section className="mb-3">
          <SectionTitle>证书认证</SectionTitle>
          {sortedCertifications.map((cert) => (
            <CertificationItem key={cert.id} cert={cert} />
          ))}
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-3">
          <SectionTitle>专业技能</SectionTitle>
          <SkillsSection skills={skills} />
        </section>
      )}
    </div>
  );
}
