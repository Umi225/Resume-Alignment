import type { TemplateProps } from './types';
import { formatDateRangeCompact, sortByDateDesc, groupSkillsByCategory } from './utils';
import type { Education, Experience, Project, Award, Certification, Skill } from '@/types/resume';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 mt-6">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-400">{children}</h2>
      <div className="mt-2 h-px bg-gray-200" />
    </div>
  );
}

function EducationItem({ edu }: { edu: Education }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-900">{edu.school}</span>
        <span className="text-xs text-gray-400">{formatDateRangeCompact(edu.startDate, edu.endDate)}</span>
      </div>
      <p className="mt-0.5 text-xs text-gray-500">
        {edu.degree} · {edu.major}
        {edu.gpa && ` · GPA ${edu.gpa}`}
        {edu.ranking && ` · ${edu.ranking}`}
      </p>
    </div>
  );
}

function ExperienceItem({ exp }: { exp: Experience }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-900">{exp.company}</span>
        <span className="text-xs text-gray-400">{formatDateRangeCompact(exp.startDate, exp.endDate)}</span>
      </div>
      <p className="text-xs text-gray-500">{exp.role}{exp.department && ` · ${exp.department}`}</p>
      <ul className="mt-2 space-y-1.5">
        {exp.bullets.map((b, i) => (
          <li key={i} className="text-xs leading-relaxed text-gray-600">{b}</li>
        ))}
      </ul>
    </div>
  );
}

function ProjectItem({ proj }: { proj: Project }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-900">{proj.name}</span>
        <span className="text-xs text-gray-400">{formatDateRangeCompact(proj.startDate, proj.endDate)}</span>
      </div>
      <p className="text-xs text-gray-500">{proj.role}{proj.outcome && ` · ${proj.outcome}`}</p>
      <ul className="mt-2 space-y-1.5">
        {proj.bullets.map((b, i) => (
          <li key={i} className="text-xs leading-relaxed text-gray-600">{b}</li>
        ))}
      </ul>
    </div>
  );
}

function AwardItem({ award }: { award: Award }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <span className="text-xs text-gray-700">{award.name}{award.level && ` · ${award.level}`}</span>
      <span className="text-xs text-gray-400">{award.date || ''}</span>
    </div>
  );
}

function CertificationItem({ cert }: { cert: Certification }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <span className="text-xs text-gray-700">{cert.name} · {cert.issuer}</span>
      <span className="text-xs text-gray-400">{cert.date}</span>
    </div>
  );
}

function SkillsSection({ skills }: { skills: Skill[] }) {
  const groups = groupSkillsByCategory(skills);
  return (
    <div className="space-y-2">
      {Array.from(groups.entries()).map(([cat, items]) => (
        <div key={cat ?? 'uncategorized'} className="flex items-baseline gap-3">
          {cat && <span className="w-16 shrink-0 text-xs text-gray-400">{cat}</span>}
          <span className="text-xs text-gray-600">
            {items.map((s) => {
              let text = s.name;
              if (s.description) text += ` ${s.description}`;
              if (s.proficiency) text += ` (${s.proficiency})`;
              return text;
            }).join(' · ')}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MinimalTemplate({ profile }: TemplateProps) {
  const { basicInfo, education, experience, projects, awards, certifications, skills } = profile;

  const sortedEducation = sortByDateDesc(education);
  const sortedExperience = sortByDateDesc(experience);
  const sortedProjects = sortByDateDesc(projects);
  const sortedAwards = sortByDateDesc(awards);
  const sortedCertifications = sortByDateDesc(certifications);

  return (
    <div className="text-gray-900">
      {/* Header - Centered */}
      <header className="mb-8 text-center">
        {basicInfo.avatar && (
          <img
            src={basicInfo.avatar}
            alt="avatar"
            className="mx-auto mb-4 h-20 w-20 rounded-full object-cover"
          />
        )}
        <h1 className="text-xl font-light tracking-[0.1em] text-gray-900">{basicInfo.name || '未填写姓名'}</h1>
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-400">
          {basicInfo.phone && <span>{basicInfo.phone}</span>}
          {basicInfo.email && <span>{basicInfo.email}</span>}
          {basicInfo.location && <span>{basicInfo.location}</span>}
        </div>
        {(basicInfo.github || basicInfo.website) && (
          <div className="mt-1 flex flex-wrap justify-center gap-x-4 text-xs text-gray-400">
            {basicInfo.github && <span>{basicInfo.github}</span>}
            {basicInfo.website && <span>{basicInfo.website}</span>}
          </div>
        )}
        {basicInfo.summary && (
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-gray-500">{basicInfo.summary}</p>
        )}
      </header>

      {/* Education */}
      {sortedEducation.length > 0 && (
        <section>
          <SectionTitle>教育背景</SectionTitle>
          {sortedEducation.map((edu) => (
            <EducationItem key={edu.id} edu={edu} />
          ))}
        </section>
      )}

      {/* Experience */}
      {sortedExperience.length > 0 && (
        <section>
          <SectionTitle>工作经历</SectionTitle>
          {sortedExperience.map((exp) => (
            <ExperienceItem key={exp.id} exp={exp} />
          ))}
        </section>
      )}

      {/* Projects */}
      {sortedProjects.length > 0 && (
        <section>
          <SectionTitle>项目经历</SectionTitle>
          {sortedProjects.map((proj) => (
            <ProjectItem key={proj.id} proj={proj} />
          ))}
        </section>
      )}

      {/* Awards */}
      {sortedAwards.length > 0 && (
        <section>
          <SectionTitle>荣誉奖项</SectionTitle>
          {sortedAwards.map((award) => (
            <AwardItem key={award.id} award={award} />
          ))}
        </section>
      )}

      {/* Certifications */}
      {sortedCertifications.length > 0 && (
        <section>
          <SectionTitle>证书认证</SectionTitle>
          {sortedCertifications.map((cert) => (
            <CertificationItem key={cert.id} cert={cert} />
          ))}
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section>
          <SectionTitle>专业技能</SectionTitle>
          <SkillsSection skills={skills} />
        </section>
      )}
    </div>
  );
}
