/**
 * ============================================
 * JD 分析与经历匹配引擎
 * ============================================
 *
 * 设计原则：
 * 1. 纯前端规则匹配，不依赖外部 AI API
 * 2. 匹配过程必须可解释 — 每个分数都有明确的计算逻辑
 * 3. 推荐理由基于实际匹配到的关键词生成
 */

import type {
  ResumeProfile,
  Education,
  Experience,
  Project,
  Award,
  Certification,
  Skill,
  ExperienceAsset,
} from '@/types/resume';

// ============================================
// 技术关键词词典
// ============================================

export type KeywordCategory =
  | 'programming'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'ai'
  | 'mobile'
  | 'softskill'
  | 'domain'
  | 'degree'
  | 'general';

export interface KeywordDef {
  word: string;
  aliases?: string[];
  category: KeywordCategory;
  weight: number; // 1-5, 越高代表在 JD 中越核心
}

const KEYWORD_DICTIONARY: KeywordDef[] = [
  // 编程语言
  { word: 'JavaScript', category: 'programming', weight: 4 },
  { word: 'TypeScript', category: 'programming', weight: 4 },
  { word: 'Python', category: 'programming', weight: 4 },
  { word: 'Java', category: 'programming', weight: 4 },
  { word: 'Go', aliases: ['Golang'], category: 'programming', weight: 4 },
  { word: 'Rust', category: 'programming', weight: 4 },
  { word: 'C++', aliases: ['CPP'], category: 'programming', weight: 3 },
  { word: 'C#', aliases: ['CSharp'], category: 'programming', weight: 3 },
  { word: 'PHP', category: 'programming', weight: 3 },
  { word: 'Ruby', category: 'programming', weight: 3 },
  { word: 'Swift', category: 'programming', weight: 3 },
  { word: 'Kotlin', category: 'programming', weight: 3 },
  { word: 'Scala', category: 'programming', weight: 3 },
  { word: 'Dart', category: 'programming', weight: 2 },
  { word: 'Shell', aliases: ['Bash'], category: 'programming', weight: 2 },
  { word: 'SQL', category: 'programming', weight: 3 },
  { word: 'HTML', category: 'programming', weight: 2 },
  { word: 'CSS', category: 'programming', weight: 2 },

  // 前端框架
  { word: 'React', aliases: ['ReactJS', 'React.js'], category: 'frontend', weight: 5 },
  { word: 'Vue', aliases: ['Vue.js', 'VueJS'], category: 'frontend', weight: 5 },
  { word: 'Angular', category: 'frontend', weight: 4 },
  { word: 'Next.js', aliases: ['NextJS'], category: 'frontend', weight: 4 },
  { word: 'Nuxt', aliases: ['Nuxt.js', 'NuxtJS'], category: 'frontend', weight: 3 },
  { word: 'Svelte', category: 'frontend', weight: 3 },
  { word: 'jQuery', category: 'frontend', weight: 2 },
  { word: 'Electron', category: 'frontend', weight: 3 },
  { word: 'Webpack', category: 'frontend', weight: 3 },
  { word: 'Vite', category: 'frontend', weight: 3 },
  { word: 'Tailwind', aliases: ['TailwindCSS'], category: 'frontend', weight: 3 },
  { word: 'Sass', aliases: ['SCSS', 'Less'], category: 'frontend', weight: 2 },
  { word: 'Ant Design', aliases: ['AntD'], category: 'frontend', weight: 3 },
  { word: 'Element UI', category: 'frontend', weight: 2 },

  // 后端框架
  { word: 'Node.js', aliases: ['NodeJS', 'Node'], category: 'backend', weight: 4 },
  { word: 'Express', aliases: ['Express.js'], category: 'backend', weight: 3 },
  { word: 'Koa', category: 'backend', weight: 3 },
  { word: 'Django', category: 'backend', weight: 4 },
  { word: 'Flask', category: 'backend', weight: 3 },
  { word: 'Spring', aliases: ['Spring Boot', 'SpringBoot'], category: 'backend', weight: 5 },
  { word: 'FastAPI', category: 'backend', weight: 3 },
  { word: 'Gin', category: 'backend', weight: 3 },
  { word: 'Echo', category: 'backend', weight: 2 },
  { word: 'gRPC', category: 'backend', weight: 4 },
  { word: 'GraphQL', category: 'backend', weight: 4 },
  { word: 'RESTful', aliases: ['REST API', 'REST'], category: 'backend', weight: 4 },

  // 数据库
  { word: 'MySQL', category: 'database', weight: 4 },
  { word: 'PostgreSQL', aliases: ['Postgres'], category: 'database', weight: 4 },
  { word: 'MongoDB', category: 'database', weight: 4 },
  { word: 'Redis', category: 'database', weight: 4 },
  { word: 'Elasticsearch', aliases: ['ES'], category: 'database', weight: 4 },
  { word: 'SQLite', category: 'database', weight: 3 },
  { word: 'Oracle', category: 'database', weight: 3 },
  { word: 'SQL Server', category: 'database', weight: 3 },
  { word: 'ClickHouse', category: 'database', weight: 3 },
  { word: 'TiDB', category: 'database', weight: 3 },

  // DevOps / 云
  { word: 'Docker', category: 'devops', weight: 4 },
  { word: 'Kubernetes', aliases: ['K8s'], category: 'devops', weight: 4 },
  { word: 'AWS', category: 'devops', weight: 4 },
  { word: '阿里云', aliases: ['Aliyun'], category: 'devops', weight: 3 },
  { word: '腾讯云', category: 'devops', weight: 3 },
  { word: 'CI/CD', aliases: ['CICD', '持续集成'], category: 'devops', weight: 4 },
  { word: 'Jenkins', category: 'devops', weight: 3 },
  { word: 'GitHub Actions', category: 'devops', weight: 3 },
  { word: 'GitLab CI', category: 'devops', weight: 3 },
  { word: 'Terraform', category: 'devops', weight: 3 },
  { word: 'Nginx', category: 'devops', weight: 3 },
  { word: 'Linux', category: 'devops', weight: 3 },
  { word: 'Git', category: 'devops', weight: 3 },
  { word: 'Prometheus', category: 'devops', weight: 3 },
  { word: 'Grafana', category: 'devops', weight: 3 },

  // AI / ML
  { word: 'TensorFlow', category: 'ai', weight: 4 },
  { word: 'PyTorch', category: 'ai', weight: 4 },
  { word: 'LLM', aliases: ['大模型', '大语言模型'], category: 'ai', weight: 5 },
  { word: 'NLP', aliases: ['自然语言处理'], category: 'ai', weight: 5 },
  { word: 'CV', aliases: ['计算机视觉', '图像识别'], category: 'ai', weight: 5 },
  { word: '机器学习', aliases: ['Machine Learning'], category: 'ai', weight: 5 },
  { word: '深度学习', aliases: ['Deep Learning'], category: 'ai', weight: 5 },
  { word: 'Transformer', category: 'ai', weight: 4 },
  { word: 'BERT', category: 'ai', weight: 4 },
  { word: 'GPT', aliases: ['ChatGPT', 'GPT-4'], category: 'ai', weight: 4 },
  { word: 'OpenCV', category: 'ai', weight: 3 },
  { word: 'Scikit-learn', category: 'ai', weight: 3 },
  { word: 'Pandas', category: 'ai', weight: 3 },
  { word: 'NumPy', category: 'ai', weight: 3 },
  { word: 'OpenAI', category: 'ai', weight: 4 },
  { word: 'LangChain', category: 'ai', weight: 4 },
  { word: 'RAG', category: 'ai', weight: 4 },
  { word: 'Agent', aliases: ['智能体'], category: 'ai', weight: 4 },
  { word: 'Prompt Engineering', aliases: ['Prompt', '提示工程'], category: 'ai', weight: 4 },
  { word: 'Fine-tuning', aliases: ['微调'], category: 'ai', weight: 4 },
  { word: '向量数据库', aliases: ['Vector DB'], category: 'ai', weight: 4 },

  // 移动端
  { word: 'iOS', category: 'mobile', weight: 4 },
  { word: 'Android', category: 'mobile', weight: 4 },
  { word: 'Flutter', category: 'mobile', weight: 4 },
  { word: 'React Native', category: 'mobile', weight: 4 },
  { word: 'UniApp', category: 'mobile', weight: 3 },
  { word: '微信小程序', aliases: ['小程序'], category: 'mobile', weight: 3 },

  // 软技能 / 通用
  { word: '沟通', aliases: ['沟通能力', '沟通技巧'], category: 'softskill', weight: 3 },
  { word: '团队协作', aliases: ['团队合作', 'Teamwork'], category: 'softskill', weight: 3 },
  { word: '项目管理', aliases: ['PM', 'Project Management'], category: 'softskill', weight: 3 },
  { word: '领导力', aliases: ['Leadership', '带领团队'], category: 'softskill', weight: 3 },
  { word: '解决问题', aliases: ['Problem Solving'], category: 'softskill', weight: 3 },
  { word: '自驱', aliases: ['自驱力', '主动性', '积极主动'], category: 'softskill', weight: 3 },
  { word: '学习能力', category: 'softskill', weight: 3 },
  { word: '抗压能力', category: 'softskill', weight: 2 },
  { word: '英语', aliases: ['English', 'CET-6', 'CET-4', '六级', '四级'], category: 'softskill', weight: 2 },

  // 领域知识
  { word: '微服务', aliases: ['Microservices'], category: 'domain', weight: 4 },
  { word: '分布式', aliases: ['分布式系统', 'Distributed'], category: 'domain', weight: 4 },
  { word: '高并发', aliases: ['高可用', '并发'], category: 'domain', weight: 4 },
  { word: '性能优化', aliases: ['Optimization', '调优'], category: 'domain', weight: 4 },
  { word: '数据结构', category: 'domain', weight: 3 },
  { word: '算法', category: 'domain', weight: 3 },
  { word: '设计模式', category: 'domain', weight: 3 },
  { word: '网络安全', category: 'domain', weight: 3 },
  { word: '测试', aliases: ['单元测试', '自动化测试', 'TDD'], category: 'domain', weight: 3 },
  { word: '监控', aliases: ['日志', '链路追踪'], category: 'domain', weight: 3 },
  { word: '消息队列', aliases: ['MQ', 'Kafka', 'RabbitMQ', 'RocketMQ'], category: 'domain', weight: 4 },
  { word: '缓存', aliases: ['Cache', 'CDN'], category: 'domain', weight: 3 },
  { word: '大数据', aliases: ['Big Data', 'Hadoop', 'Spark', 'Flink'], category: 'domain', weight: 4 },
  { word: '区块链', aliases: ['Blockchain', 'Web3'], category: 'domain', weight: 3 },
  { word: '音视频', category: 'domain', weight: 3 },
  { word: '推荐系统', category: 'domain', weight: 4 },
  { word: '搜索', aliases: ['搜索引擎', '检索'], category: 'domain', weight: 3 },
  { word: '支付', category: 'domain', weight: 3 },
  { word: '电商', category: 'domain', weight: 3 },
  { word: 'SaaS', category: 'domain', weight: 3 },
  { word: 'B端', aliases: ['To B'], category: 'domain', weight: 3 },
  { word: 'C端', aliases: ['To C'], category: 'domain', weight: 3 },
  { word: '低代码', category: 'domain', weight: 3 },

  // 学历
  { word: '本科', category: 'degree', weight: 2 },
  { word: '硕士', aliases: ['研究生'], category: 'degree', weight: 2 },
  { word: '博士', category: 'degree', weight: 2 },
  { word: '985', category: 'degree', weight: 1 },
  { word: '211', category: 'degree', weight: 1 },
  { word: '双一流', category: 'degree', weight: 1 },
  { word: 'QS', category: 'degree', weight: 1 },

  // 岗位级别
  { word: '校招', aliases: ['应届生', '校园招聘'], category: 'general', weight: 2 },
  { word: '实习', category: 'general', weight: 2 },
  { word: '社招', category: 'general', weight: 2 },
  { word: '全职', category: 'general', weight: 2 },
  { word: '远程', aliases: ['Remote'], category: 'general', weight: 1 },
];

// 构建快速查找表
const allKeywordForms = new Map<string, KeywordDef>();
for (const def of KEYWORD_DICTIONARY) {
  allKeywordForms.set(def.word.toLowerCase(), def);
  if (def.aliases) {
    for (const alias of def.aliases) {
      allKeywordForms.set(alias.toLowerCase(), def);
    }
  }
}

// ============================================
// JD 分析
// ============================================

export interface ExtractedKeyword {
  word: string;
  category: KeywordCategory;
  weight: number;
  // 在 JD 原文中的位置
  positions: number[];
}

export interface HardRequirement {
  type: 'education' | 'experience_years' | 'age' | 'other';
  rawText: string;
  value?: string;
}

export interface JDAnalysisResult {
  keywords: ExtractedKeyword[];
  requirements: HardRequirement[];
  totalKeywordWeight: number;
}

function normalizeText(text: string): string {
  return text
    .replace(/[，。！？、；：""''（）【】《》\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function analyzeJD(jdText: string): JDAnalysisResult {
  const normalized = normalizeText(jdText);
  const lower = normalized.toLowerCase();

  const keywords: ExtractedKeyword[] = [];
  const seenWords = new Set<string>();

  Array.from(allKeywordForms.entries()).forEach(([form, def]) => {
    const regex = new RegExp(`\\b${escapeRegex(form)}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      const baseWord = def.word;
      if (!seenWords.has(baseWord)) {
        seenWords.add(baseWord);
        keywords.push({
          word: baseWord,
          category: def.category,
          weight: def.weight,
          positions: matches.map((_, i) => lower.indexOf(form, i)),
        });
      }
    }
  });

  // 按权重降序排列
  keywords.sort((a, b) => b.weight - a.weight);

  // 提取硬性要求
  const requirements: HardRequirement[] = [];

  // 学历要求
  const eduPatterns = [
    { regex: /(?:本科|大专|硕士|博士|研究生)(?:及以上|以上|毕业)?/g, type: 'education' as const },
    { regex: /(?:985|211|双一流)(?:院校|高校|大学)?/g, type: 'education' as const },
    { regex: /QS\s*(?:前?\d+|[Tt]op\s*\d+)/g, type: 'education' as const },
  ];
  for (const p of eduPatterns) {
    const matches = jdText.match(p.regex);
    if (matches) {
      for (const m of matches) {
        requirements.push({ type: p.type, rawText: m });
      }
    }
  }

  // 年限要求
  const yearPatterns = [
    { regex: /(\d+)\s*年(?:及?以上)?(?:工作|开发|相关)?经验/g, type: 'experience_years' as const },
    { regex: /经验\s*(\d+)\s*年(?:及?以上)?/g, type: 'experience_years' as const },
  ];
  for (const p of yearPatterns) {
    let match;
    const regex = new RegExp(p.regex.source, 'g');
    while ((match = regex.exec(jdText)) !== null) {
      requirements.push({
        type: p.type,
        rawText: match[0],
        value: match[1] + '年',
      });
    }
  }

  const totalKeywordWeight = keywords.reduce((sum, k) => sum + k.weight, 0);

  return { keywords, requirements, totalKeywordWeight };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// 经历匹配
// ============================================

export type AssetKind = 'education' | 'experience' | 'project' | 'award' | 'certification' | 'skill';

export interface MatchDetail {
  keyword: string;
  weight: number;
  matchedField: string;
  matchedText: string;
}

export interface AssetMatchResult {
  asset: ExperienceAsset;
  kind: AssetKind;
  score: number; // 0-100
  matchedKeywords: string[];
  details: MatchDetail[];
  reason: string;
}

// 字段匹配权重配置
const FIELD_WEIGHTS: Record<AssetKind, Record<string, number>> = {
  education: {
    school: 1.5,
    major: 2.0,
    degree: 1.0,
    location: 0.5,
    courses: 1.0,
  },
  experience: {
    company: 1.5,
    role: 2.0,
    department: 1.0,
    location: 0.5,
    tags: 3.0,
    bullets: 1.5,
  },
  project: {
    name: 1.5,
    role: 2.0,
    tags: 3.0,
    bullets: 1.5,
    outcome: 1.5,
  },
  award: {
    name: 1.5,
    level: 1.0,
    issuer: 1.0,
    description: 1.0,
  },
  certification: {
    name: 2.0,
    issuer: 1.0,
  },
  skill: {
    name: 2.5,
    category: 0.5,
  },
};

function matchText(text: string, keywords: ExtractedKeyword[]): { matched: ExtractedKeyword[]; details: MatchDetail[] } {
  const matched: ExtractedKeyword[] = [];
  const details: MatchDetail[] = [];
  const lower = text.toLowerCase();

  for (const kw of keywords) {
    const forms = [kw.word.toLowerCase()];
    const def = allKeywordForms.get(kw.word.toLowerCase());
    if (def?.aliases) {
      for (const alias of def.aliases) {
        forms.push(alias.toLowerCase());
      }
    }

    for (const form of forms) {
      if (lower.includes(form)) {
        if (!matched.find((m) => m.word === kw.word)) {
          matched.push(kw);
        }
        details.push({
          keyword: kw.word,
          weight: kw.weight,
          matchedField: 'text',
          matchedText: text.slice(Math.max(0, lower.indexOf(form) - 5), lower.indexOf(form) + form.length + 5),
        });
        break;
      }
    }
  }

  return { matched, details };
}

function matchEducation(edu: Education, keywords: ExtractedKeyword[]): AssetMatchResult {
  const details: MatchDetail[] = [];
  const allMatched = new Map<string, ExtractedKeyword>();
  const weights = FIELD_WEIGHTS.education;

  const fields: { key: string; text: string }[] = [
    { key: 'school', text: edu.school },
    { key: 'major', text: edu.major },
    { key: 'degree', text: edu.degree },
    { key: 'location', text: edu.location || '' },
    { key: 'courses', text: (edu.courses || []).join(' ') },
  ];

  let totalScore = 0;

  for (const f of fields) {
    const { matched, details: fieldDetails } = matchText(f.text, keywords);
    for (const d of fieldDetails) {
      d.matchedField = f.key;
      details.push(d);
    }
    for (const m of matched) {
      if (!allMatched.has(m.word)) {
        allMatched.set(m.word, m);
        totalScore += m.weight * (weights[f.key] || 1);
      }
    }
  }

  const score = Math.min(100, Math.round((totalScore / Math.max(1, keywords.reduce((s, k) => s + k.weight, 0))) * 100));
  const matchedKeywords = Array.from(allMatched.keys());

  return {
    asset: edu,
    kind: 'education',
    score,
    matchedKeywords,
    details,
    reason: generateReason('教育背景', edu.school, matchedKeywords, details),
  };
}

function matchExperience(exp: Experience, keywords: ExtractedKeyword[]): AssetMatchResult {
  const details: MatchDetail[] = [];
  const allMatched = new Map<string, ExtractedKeyword>();
  const weights = FIELD_WEIGHTS.experience;

  const fields: { key: string; text: string }[] = [
    { key: 'company', text: exp.company },
    { key: 'role', text: exp.role },
    { key: 'department', text: exp.department || '' },
    { key: 'location', text: exp.location || '' },
    { key: 'tags', text: exp.tags.join(' ') },
    { key: 'bullets', text: exp.bullets.join(' ') },
  ];

  let totalScore = 0;

  for (const f of fields) {
    const { matched, details: fieldDetails } = matchText(f.text, keywords);
    for (const d of fieldDetails) {
      d.matchedField = f.key;
      details.push(d);
    }
    for (const m of matched) {
      if (!allMatched.has(m.word)) {
        allMatched.set(m.word, m);
        totalScore += m.weight * (weights[f.key] || 1);
      }
    }
  }

  const totalWeight = keywords.reduce((s, k) => s + k.weight, 0);
  const score = Math.min(100, Math.round((totalScore / Math.max(1, totalWeight)) * 100));
  const matchedKeywords = Array.from(allMatched.keys());

  return {
    asset: exp,
    kind: 'experience',
    score,
    matchedKeywords,
    details,
    reason: generateReason('实习/工作经历', exp.company, matchedKeywords, details),
  };
}

function matchProject(proj: Project, keywords: ExtractedKeyword[]): AssetMatchResult {
  const details: MatchDetail[] = [];
  const allMatched = new Map<string, ExtractedKeyword>();
  const weights = FIELD_WEIGHTS.project;

  const fields: { key: string; text: string }[] = [
    { key: 'name', text: proj.name },
    { key: 'role', text: proj.role },
    { key: 'tags', text: proj.tags.join(' ') },
    { key: 'bullets', text: proj.bullets.join(' ') },
    { key: 'outcome', text: proj.outcome || '' },
  ];

  let totalScore = 0;

  for (const f of fields) {
    const { matched, details: fieldDetails } = matchText(f.text, keywords);
    for (const d of fieldDetails) {
      d.matchedField = f.key;
      details.push(d);
    }
    for (const m of matched) {
      if (!allMatched.has(m.word)) {
        allMatched.set(m.word, m);
        totalScore += m.weight * (weights[f.key] || 1);
      }
    }
  }

  const totalWeight = keywords.reduce((s, k) => s + k.weight, 0);
  const score = Math.min(100, Math.round((totalScore / Math.max(1, totalWeight)) * 100));
  const matchedKeywords = Array.from(allMatched.keys());

  return {
    asset: proj,
    kind: 'project',
    score,
    matchedKeywords,
    details,
    reason: generateReason('项目经历', proj.name, matchedKeywords, details),
  };
}

function matchAward(award: Award, keywords: ExtractedKeyword[]): AssetMatchResult {
  const details: MatchDetail[] = [];
  const allMatched = new Map<string, ExtractedKeyword>();
  const weights = FIELD_WEIGHTS.award;

  const fields: { key: string; text: string }[] = [
    { key: 'name', text: award.name },
    { key: 'level', text: award.level || '' },
    { key: 'issuer', text: award.issuer || '' },
    { key: 'description', text: award.description || '' },
  ];

  let totalScore = 0;

  for (const f of fields) {
    const { matched, details: fieldDetails } = matchText(f.text, keywords);
    for (const d of fieldDetails) {
      d.matchedField = f.key;
      details.push(d);
    }
    for (const m of matched) {
      if (!allMatched.has(m.word)) {
        allMatched.set(m.word, m);
        totalScore += m.weight * (weights[f.key] || 1);
      }
    }
  }

  const totalWeight = keywords.reduce((s, k) => s + k.weight, 0);
  const score = Math.min(100, Math.round((totalScore / Math.max(1, totalWeight)) * 100));
  const matchedKeywords = Array.from(allMatched.keys());

  return {
    asset: award,
    kind: 'award',
    score,
    matchedKeywords,
    details,
    reason: generateReason('荣誉奖项', award.name, matchedKeywords, details),
  };
}

function matchCertification(cert: Certification, keywords: ExtractedKeyword[]): AssetMatchResult {
  const details: MatchDetail[] = [];
  const allMatched = new Map<string, ExtractedKeyword>();
  const weights = FIELD_WEIGHTS.certification;

  const fields: { key: string; text: string }[] = [
    { key: 'name', text: cert.name },
    { key: 'issuer', text: cert.issuer },
    { key: 'description', text: (cert as { description?: string }).description || '' },
  ];

  let totalScore = 0;

  for (const f of fields) {
    const { matched, details: fieldDetails } = matchText(f.text, keywords);
    for (const d of fieldDetails) {
      d.matchedField = f.key;
      details.push(d);
    }
    for (const m of matched) {
      if (!allMatched.has(m.word)) {
        allMatched.set(m.word, m);
        totalScore += m.weight * (weights[f.key] || 1);
      }
    }
  }

  const totalWeight = keywords.reduce((s, k) => s + k.weight, 0);
  const score = Math.min(100, Math.round((totalScore / Math.max(1, totalWeight)) * 100));
  const matchedKeywords = Array.from(allMatched.keys());

  return {
    asset: cert,
    kind: 'certification',
    score,
    matchedKeywords,
    details,
    reason: generateReason('证书认证', cert.name, matchedKeywords, details),
  };
}

function matchSkill(skill: Skill, keywords: ExtractedKeyword[]): AssetMatchResult {
  const details: MatchDetail[] = [];
  const allMatched = new Map<string, ExtractedKeyword>();
  const weights = FIELD_WEIGHTS.skill;

  const fields: { key: string; text: string }[] = [
    { key: 'name', text: skill.name },
    { key: 'category', text: skill.category || '' },
    { key: 'proficiency', text: skill.proficiency || '' },
    { key: 'description', text: skill.description || '' },
    { key: 'level', text: skill.level ? String(skill.level) : '' },
  ];

  let totalScore = 0;

  for (const f of fields) {
    const { matched, details: fieldDetails } = matchText(f.text, keywords);
    for (const d of fieldDetails) {
      d.matchedField = f.key;
      details.push(d);
    }
    for (const m of matched) {
      if (!allMatched.has(m.word)) {
        allMatched.set(m.word, m);
        totalScore += m.weight * (weights[f.key] || 1);
      }
    }
  }

  const totalWeight = keywords.reduce((s, k) => s + k.weight, 0);
  const score = Math.min(100, Math.round((totalScore / Math.max(1, totalWeight)) * 100));
  const matchedKeywords = Array.from(allMatched.keys());

  return {
    asset: skill,
    kind: 'skill',
    score,
    matchedKeywords,
    details,
    reason: generateReason('技能', skill.name, matchedKeywords, details),
  };
}

function generateReason(
  kindLabel: string,
  title: string,
  matchedKeywords: string[],
  details: MatchDetail[]
): string {
  if (matchedKeywords.length === 0) {
    return `${kindLabel}「${title}」未直接匹配到 JD 关键词。`;
  }

  const techKeywords = details.filter((d) => d.weight >= 3).map((d) => d.keyword);
  const uniqueTech = Array.from(new Set(techKeywords));

  const fieldHits = new Map<string, string[]>();
  for (const d of details) {
    if (!fieldHits.has(d.matchedField)) fieldHits.set(d.matchedField, []);
    if (!fieldHits.get(d.matchedField)!.includes(d.keyword)) {
      fieldHits.get(d.matchedField)!.push(d.keyword);
    }
  }

  let reason = `${kindLabel}「${title}」`;

  if (uniqueTech.length > 0) {
    reason += `包含 ${uniqueTech.slice(0, 3).join('、')}`;
    if (uniqueTech.length > 3) reason += `等 ${uniqueTech.length} 项`;
    reason += '核心技术要求';
  } else {
    reason += `匹配到 ${matchedKeywords.slice(0, 3).join('、')}`;
    if (matchedKeywords.length > 3) reason += `等 ${matchedKeywords.length} 项`;
    reason += '要求';
  }

  // 说明在哪个字段匹配到的
  const fieldLabels: Record<string, string> = {
    tags: '技术标签',
    bullets: '项目描述',
    name: '名称',
    role: '担任角色',
    company: '公司',
    school: '学校',
    major: '专业',
  };

  const primaryField = Array.from(fieldHits.entries())
    .sort((a, b) => b[1].length - a[1].length)[0];

  if (primaryField && fieldLabels[primaryField[0]]) {
    reason += `，主要体现在${fieldLabels[primaryField[0]]}中`;
  }

  reason += '。';
  return reason;
}

// ============================================
// 主匹配入口
// ============================================

export interface FullMatchResult {
  jdAnalysis: JDAnalysisResult;
  matches: AssetMatchResult[];
}

const kindPriority: Record<AssetKind, number> = {
  experience: 0,
  project: 0,
  skill: 1,
  certification: 1,
  award: 2,
  education: 3,
};

export function matchProfileToJD(profile: ResumeProfile, jdText: string): FullMatchResult {
  const jdAnalysis = analyzeJD(jdText);
  const matches: AssetMatchResult[] = [];

  // 教育背景不参与 JD 匹配
  for (const exp of profile.experience) {
    matches.push(matchExperience(exp, jdAnalysis.keywords));
  }
  for (const proj of profile.projects) {
    matches.push(matchProject(proj, jdAnalysis.keywords));
  }
  for (const award of profile.awards) {
    matches.push(matchAward(award, jdAnalysis.keywords));
  }
  for (const cert of profile.certifications) {
    matches.push(matchCertification(cert, jdAnalysis.keywords));
  }
  for (const skill of profile.skills) {
    matches.push(matchSkill(skill, jdAnalysis.keywords));
  }

  // 按分数降序排列，同分时按类型优先级
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return kindPriority[a.kind] - kindPriority[b.kind];
  });

  return { jdAnalysis, matches };
}

// ============================================
// 分类颜色工具
// ============================================

export function getCategoryColor(category: KeywordCategory): string {
  const map: Record<KeywordCategory, string> = {
    programming: 'bg-blue-50 text-blue-700 border-blue-200',
    frontend: 'bg-sky-50 text-sky-700 border-sky-200',
    backend: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    database: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    devops: 'bg-orange-50 text-orange-700 border-orange-200',
    ai: 'bg-violet-50 text-violet-700 border-violet-200',
    mobile: 'bg-pink-50 text-pink-700 border-pink-200',
    softskill: 'bg-amber-50 text-amber-700 border-amber-200',
    domain: 'bg-teal-50 text-teal-700 border-teal-200',
    degree: 'bg-gray-50 text-gray-700 border-gray-200',
    general: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  return map[category] || map.general;
}

export function getCategoryLabel(category: KeywordCategory): string {
  const map: Record<KeywordCategory, string> = {
    programming: '编程语言',
    frontend: '前端',
    backend: '后端',
    database: '数据库',
    devops: 'DevOps',
    ai: 'AI/ML',
    mobile: '移动端',
    softskill: '软技能',
    domain: '领域知识',
    degree: '学历',
    general: '通用',
  };
  return map[category] || '其他';
}
