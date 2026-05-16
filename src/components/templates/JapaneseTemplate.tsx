import type { TemplateProps } from './types';
import { sortByDateDesc, groupSkillsByCategory } from './utils';
import type { Education, Experience, Project, Award, Certification, Skill } from '@/types/resume';

function formatJapaneseDate(dateStr: string): string {
  const [y, m] = dateStr.split('-');
  return `${y}年${m}月`;
}

function formatPeriod(start: string, end?: string): string {
  const e = end ? formatJapaneseDate(end) : '現在';
  return `${formatJapaneseDate(start)} ～ ${e}`;
}

function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 border border-gray-800">
      <div className="border-b border-gray-800 bg-gray-50 px-3 py-1.5">
        <h2 className="text-xs font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex border-b border-gray-300 last:border-b-0">
      <div className="w-24 shrink-0 border-r border-gray-300 bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-700">
        {label}
      </div>
      <div className="flex-1 px-2 py-1.5 text-xs text-gray-900">{children}</div>
    </div>
  );
}

function EducationTable({ education }: { education: Education[] }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-gray-800 bg-gray-50">
          <th className="px-2 py-1 text-left font-medium text-gray-700">在学期間</th>
          <th className="px-2 py-1 text-left font-medium text-gray-700">学校名</th>
          <th className="px-2 py-1 text-left font-medium text-gray-700">学部・学科</th>
          <th className="px-2 py-1 text-left font-medium text-gray-700">学位</th>
          <th className="px-2 py-1 text-left font-medium text-gray-700">主修课程</th>
        </tr>
      </thead>
      <tbody>
        {education.map((edu) => (
          <tr key={edu.id} className="border-b border-gray-200">
            <td className="px-2 py-1.5 text-gray-700">{formatPeriod(edu.startDate, edu.endDate)}</td>
            <td className="px-2 py-1.5 font-medium text-gray-900">{edu.school}</td>
            <td className="px-2 py-1.5 text-gray-700">{edu.major}</td>
            <td className="px-2 py-1.5 text-gray-700">{edu.degree}</td>
            <td className="px-2 py-1.5 text-gray-700">{(edu.relatedCourses || []).join('、')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExperienceTable({ experience }: { experience: Experience[] }) {
  return (
    <div className="space-y-3">
      {experience.map((exp) => (
        <div key={exp.id} className="border-b border-gray-200 pb-2 last:border-b-0">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-xs font-bold text-gray-900">{exp.company}</span>
            <span className="text-xs text-gray-500">{formatPeriod(exp.startDate, exp.endDate)}</span>
          </div>
          <div className="mb-1 text-xs text-gray-600">
            職種：{exp.role}
            {exp.department && `（${exp.department}）`}
            {exp.location && ` · ${exp.location}`}
          </div>
          <ul className="space-y-0.5">
            {exp.bullets.map((b, i) => (
              <li key={i} className="text-xs leading-relaxed text-gray-700">
                ・{b}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <div className="space-y-3">
      {projects.map((proj) => (
        <div key={proj.id} className="border-b border-gray-200 pb-2 last:border-b-0">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-xs font-bold text-gray-900">{proj.name}</span>
            <span className="text-xs text-gray-500">{formatPeriod(proj.startDate, proj.endDate)}</span>
          </div>
          <div className="mb-1 text-xs text-gray-600">
            担当：{proj.role}
            {proj.outcome && ` · 成果：${proj.outcome}`}
          </div>
          <ul className="space-y-0.5">
            {proj.bullets.map((b, i) => (
              <li key={i} className="text-xs leading-relaxed text-gray-700">
                ・{b}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function AwardTable({ awards }: { awards: Award[] }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-gray-800 bg-gray-50">
          <th className="px-2 py-1 text-left font-medium text-gray-700">年月</th>
          <th className="px-2 py-1 text-left font-medium text-gray-700">賞名</th>
          <th className="px-2 py-1 text-left font-medium text-gray-700">発行元</th>
          <th className="px-2 py-1 text-left font-medium text-gray-700">備考</th>
        </tr>
      </thead>
      <tbody>
        {awards.map((award) => (
          <tr key={award.id} className="border-b border-gray-200">
            <td className="px-2 py-1.5 text-gray-700">{award.date ? formatJapaneseDate(award.date) : '-'}</td>
            <td className="px-2 py-1.5 font-medium text-gray-900">{award.name}</td>
            <td className="px-2 py-1.5 text-gray-700">{award.issuer || '-'}</td>
            <td className="px-2 py-1.5 text-gray-700">{award.ranking || award.description || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CertificationTable({ certifications }: { certifications: Certification[] }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-gray-800 bg-gray-50">
          <th className="px-2 py-1 text-left font-medium text-gray-700">取得年月</th>
          <th className="px-2 py-1 text-left font-medium text-gray-700">資格名</th>
          <th className="px-2 py-1 text-left font-medium text-gray-700">発行元</th>
        </tr>
      </thead>
      <tbody>
        {certifications.map((cert) => (
          <tr key={cert.id} className="border-b border-gray-200">
            <td className="px-2 py-1.5 text-gray-700">{formatJapaneseDate(cert.date)}</td>
            <td className="px-2 py-1.5 font-medium text-gray-900">{cert.name}</td>
            <td className="px-2 py-1.5 text-gray-700">{cert.issuer}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SkillsTable({ skills }: { skills: Skill[] }) {
  const groups = groupSkillsByCategory(skills);
  return (
    <div className="space-y-1">
      {Array.from(groups.entries()).map(([cat, items]) => (
        <div key={cat ?? 'uncategorized'} className="flex items-baseline gap-2">
          {cat && <span className="w-20 shrink-0 text-xs font-medium text-gray-700">{cat}</span>}
          <span className="text-xs text-gray-900">
            {items.map((s) => {
              let text = s.name;
              if (s.description) text += ` ${s.description}`;
              if (s.proficiency) text += `（${s.proficiency}）`;
              return text;
            }).join('、')}
          </span>
        </div>
      ))}
    </div>
  );
}

export function JapaneseTemplate({ profile }: TemplateProps) {
  const { basicInfo, education, experience, projects, awards, certifications, skills } = profile;

  const sortedEducation = sortByDateDesc(education);
  const sortedExperience = sortByDateDesc(experience);
  const sortedProjects = sortByDateDesc(projects);
  const sortedAwards = sortByDateDesc(awards);
  const sortedCertifications = sortByDateDesc(certifications);

  return (
    <div className="text-gray-900">
      {/* Header */}
      <header className="mb-4 border border-gray-800">
        <div className="border-b border-gray-800 bg-gray-50 px-3 py-1.5">
          <h1 className="text-xs font-bold text-gray-900">基本情報</h1>
        </div>
        <div className="flex">
          <div className="flex-1">
            <InfoRow label="氏名">{basicInfo.name || '未入力'}</InfoRow>
            <InfoRow label="電話">{basicInfo.phone || '-'}</InfoRow>
            <InfoRow label="メール">{basicInfo.email || '-'}</InfoRow>
            <InfoRow label="所在地">{basicInfo.location || '-'}</InfoRow>
            {(basicInfo.github || basicInfo.website) && (
              <InfoRow label="リンク">
                <div className="space-y-0.5">
                  {basicInfo.github && <div>{basicInfo.github}</div>}
                  {basicInfo.website && <div>{basicInfo.website}</div>}
                </div>
              </InfoRow>
            )}
          </div>
          {basicInfo.avatar && (
            <div className="w-24 border-l border-gray-300 p-2">
              <img src={basicInfo.avatar} alt="顔写真" className="h-28 w-20 object-cover border border-gray-300" />
            </div>
          )}
        </div>
        {basicInfo.summary && (
          <div className="border-t border-gray-300 px-3 py-2 text-xs text-gray-700">{basicInfo.summary}</div>
        )}
      </header>

      {/* Education */}
      {sortedEducation.length > 0 && (
        <SectionBox title="学歴">
          <EducationTable education={sortedEducation} />
        </SectionBox>
      )}

      {/* Experience */}
      {sortedExperience.length > 0 && (
        <SectionBox title="職務経歴">
          <ExperienceTable experience={sortedExperience} />
        </SectionBox>
      )}

      {/* Projects */}
      {sortedProjects.length > 0 && (
        <SectionBox title="プロジェクト経歴">
          <ProjectTable projects={sortedProjects} />
        </SectionBox>
      )}

      {/* Awards */}
      {sortedAwards.length > 0 && (
        <SectionBox title="受賞歴">
          <AwardTable awards={sortedAwards} />
        </SectionBox>
      )}

      {/* Certifications */}
      {sortedCertifications.length > 0 && (
        <SectionBox title="資格・認証">
          <CertificationTable certifications={sortedCertifications} />
        </SectionBox>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <SectionBox title="スキル">
          <SkillsTable skills={skills} />
        </SectionBox>
      )}
    </div>
  );
}
