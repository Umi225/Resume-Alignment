/**
 * ============================================
 * 简历核心数据类型 (Resume Core Types)
 * ============================================
 *
 * 设计原则：
 * 1. 资产库与简历版本分离 — ResumeProfile 是素材池，ResumeVersion 是最终产物
 * 2. bullets 使用数组 — 便于 AI 逐条优化，便于模板逐条渲染
 * 3. tags 用于关键词匹配 — 便于 AI 快速关联 JD 要求
 * 4. aiOptimized 不覆盖原文 — 人机协同，用户显式采纳后才生效
 * 5. 日期统一使用 YYYY-MM 格式 — 便于排序和显示
 */

// ============================================
// 基础类型别名
// ============================================

/** 全局唯一标识 */
export type ID = string;

/**
 * 日期字符串，统一格式为 YYYY-MM
 * 示例: "2021-09", "2024-06"
 * 使用 undefined 表示进行中（如未毕业、在职）
 */
export type DateString = string;

// ============================================
// 枚举 / 联合类型
// ============================================

/** 学历等级 */
export type Degree = '博士' | '硕士' | '本科' | '专科' | '高中' | '其他';

/**
 * 项目类型
 * - ai-project:    AI/算法相关项目
 * - competition:   学科竞赛 / 编程比赛
 * - research:      科研 / 实验室项目
 * - startup:       创业 / 创新创业项目
 * - personal:      个人开源 /  side project
 * - course:        课程设计 / 大作业
 * - work:          工作中的项目
 */
export type ProjectType = 'ai-project' | 'competition' | 'research' | 'startup' | 'personal' | 'course' | 'work';

/** 奖项级别 */
export type AwardLevel = '国际' | '国家级' | '省级' | '校级' | '企业级' | '其他';

/** 技能分类 */
export type SkillCategory = '编程语言' | '前端' | '后端' | '数据库' | 'AI/ML' | 'DevOps' | '工具' | '语言' | '软技能' | '其他';

/** 熟练度等级 */
export type ProficiencyLevel = '入门' | '熟悉' | '掌握' | '精通';

/**
 * 简历区块类型
 * custom 用于用户自定义区块（如" publications ", "志愿者经历"）
 */
export type SectionType = 'education' | 'experience' | 'projects' | 'awards' | 'certifications' | 'skills' | 'custom';

// ============================================
// AI 辅助类型
// ============================================

/**
 * AI 优化建议
 * 嵌套在 Experience / Project 中，不覆盖用户原始内容
 */
export interface AIOptimization {
  /** AI 优化后的 bullets */
  bullets: string[];
  /** AI 给出修改说明（如：增加了量化指标，补充了技术栈细节） */
  explanation: string;
  /** 用户是否已采纳此优化 */
  applied: boolean;
}

/**
 * JD 对齐后的 AI 推荐版本
 * 与原始经历完全独立，主展示用
 */
export interface OptimizedVersion {
  /** STAR 优化后的完整文案 */
  content: string;
  /** JD 匹配分数（0-100） */
  jdScore?: number;
  /** 匹配到的亮点关键词 */
  highlights?: string[];
}

// ============================================
// 经历资产类型（Experience Assets）
// ============================================

/**
 * 基本信息
 * 所有简历版本共享同一套基础信息，但 ResumeVersion 中可局部覆盖
 */
export interface BasicInfo {
  /** 姓名 */
  name: string;
  /** 手机号码 */
  phone: string;
  /** 邮箱 */
  email: string;
  /** 所在城市，如"北京"、"上海" */
  location?: string;
  /** 头像 URL 或 Base64 */
  avatar?: string;
  /** 个人总结 / 求职意向，一句话描述 */
  summary?: string;
  /** 个人主页 URL */
  website?: string;
  /** GitHub 主页 */
  github?: string;
}

/**
 * 教育经历
 * 校招场景下的核心模块
 */
export interface Education {
  id: ID;
  /** 学校名称，如"北京大学" */
  school: string;
  /** 学历等级 */
  degree: Degree;
  /** 专业名称，如"计算机科学与技术" */
  major: string;
  /** GPA，如"3.8/4.0" */
  gpa?: string;
  /** 排名，如"前 5%"、"1/120" */
  ranking?: string;
  /** 入学时间，格式 YYYY-MM */
  startDate: DateString;
  /** 毕业时间，格式 YYYY-MM；undefined 表示在读 */
  endDate?: DateString;
  /** 学校所在地 */
  location?: string;
  /** 相关课程，校招简历常用 */
  relatedCourses?: string[];
}

/**
 * 工作经历（实习 / 全职）
 * 核心内容使用 bullets 数组，每条独立，便于 AI 逐条优化
 */
export interface Experience {
  id: ID;
  /** 公司 / 组织名称 */
  company: string;
  /** 职位名称，如"后端开发实习生" */
  role: string;
  /** 部门，如"基础架构部" */
  department?: string;
  /** 开始时间，格式 YYYY-MM */
  startDate: DateString;
  /** 结束时间，格式 YYYY-MM；undefined 表示在职 */
  endDate?: DateString;
  /** 地点 */
  location?: string;
  /**
   * 经历要点列表
   * 每条应是一句完整的成果描述，建议使用"动词 + 量化结果"格式
   * 示例: ["独立负责用户增长系统后端开发，支撑日活 100w+", "优化查询性能，P99 从 2s 降至 200ms"]
   */
  bullets: string[];
  /**
   * 技能标签
   * 用于 AI 匹配 JD 关键词，如["Go", "Redis", "微服务"]
   */
  tags: string[];
  /** AI 优化建议（不覆盖原文） */
  aiOptimized?: AIOptimization;
  /** AI 推荐版本（JD 对齐生成，独立于原始经历） */
  optimizedVersion?: OptimizedVersion;
  /** 是否为重点经历，模板可据此突出展示 */
  featured?: boolean;
}

/**
 * 项目经历
 * 覆盖 AI 项目、竞赛、科研、创业等多种场景
 */
export interface Project {
  id: ID;
  /** 项目名称 */
  name: string;
  /** 项目类型 */
  type: ProjectType;
  /** 担任角色，如"项目负责人"、"核心开发" */
  role: string;
  /** 开始时间 */
  startDate: DateString;
  /** 结束时间，undefined 表示进行中 */
  endDate?: DateString;
  /** 项目链接（GitHub / 演示地址 / 论文链接） */
  link?: string;
  /** 项目描述要点 */
  bullets: string[];
  /** 技术栈 / 关键词标签 */
  tags: string[];
  /** 项目成果，如"获挑战杯国一"、"发表 ACL 2024"、"GitHub 2k+ stars" */
  outcome?: string;
  /** AI 优化建议（不覆盖原文） */
  aiOptimized?: AIOptimization;
  /** AI 推荐版本（JD 对齐生成，独立于原始经历） */
  optimizedVersion?: OptimizedVersion;
  /** 是否为重点项目 */
  featured?: boolean;
}

/**
 * 获奖记录
 */
export interface Award {
  id: ID;
  /** 奖项名称，如"ACM-ICPC 亚洲区域赛金奖" */
  name: string;
  /** 奖项级别 */
  level?: AwardLevel;
  /** 颁奖机构 */
  issuer?: string;
  /** 获奖时间 */
  date?: DateString;
  /** 具体名次，如"一等奖"、"前 10%" */
  ranking?: string;
  /** 补充说明 */
  description?: string;
}

/**
 * 证书 / 认证
 */
export interface Certification {
  id: ID;
  /** 证书名称，如"AWS Solutions Architect" */
  name: string;
  /** 颁发机构 */
  issuer: string;
  /** 获得时间 */
  date: DateString;
  /** 过期时间，undefined 表示永久有效 */
  expiryDate?: DateString;
  /** 证书编号 */
  credentialId?: string;
  /** 补充说明 */
  description?: string;
}

/**
 * 技能
 * 可关联具体经历，便于验证和展示上下文
 */
export interface Skill {
  id: ID;
  /** 技能名称，如"TypeScript"、"React" */
  name: string;
  /** 技能分类 */
  category?: SkillCategory;
  /** 熟练度描述 */
  proficiency?: ProficiencyLevel;
  /** 数字等级 1-5，用于模板可视化（如进度条） */
  level?: 1 | 2 | 3 | 4 | 5;
  /** 关联的工作经历 ID，证明该项技能的实践来源 */
  relatedExperienceIds?: ID[];
  /** 关联的项目 ID */
  relatedProjectIds?: ID[];
  /** 补充说明，如 IELTS 7.5、用于数据清洗与可视化等 */
  description?: string;
}

// ============================================
// 简历版本类型（Resume Version）
// ============================================

/**
 * 简历区块
 * 控制 ResumeVersion 中的内容顺序、显隐、标题
 * itemIds 引用 ResumeProfile 中对应类型的实体
 */
export interface ResumeSection {
  id: ID;
  /** 区块类型 */
  type: SectionType;
  /** 显示标题，如"教育背景"、"实习经历" */
  title: string;
  /** 是否显示该区块 */
  visible: boolean;
  /** 排序权重，数字越小越靠前 */
  order: number;
  /**
   * 包含的实体 ID 列表
   * 根据 type 字段，从 ResumeProfile 的对应数组中查找
   * 如 type='experience'，则在 experience 数组中按 id 匹配
   */
  itemIds: ID[];
}

/**
 * 简历版本
 * 用于管理不同 JD 对齐的多份简历
 *
 * 设计说明：
 * - 每个版本是一份完整的简历快照，包含基础信息和区块配置
 * - 基础信息从资产库拷贝，支持版本级微调（如针对不同岗位调整 summary）
 * - sections 数组定义了渲染顺序和显隐，itemIds 指向资产库中的实体
 * - 删除资产库中的实体时，需同步清理所有版本的 itemIds
 */
export interface ResumeVersion {
  id: ID;
  /** 版本名称，如"字节跳动-后端开发-2025春招" */
  name: string;
  /** 关联的 JD 描述（原始文本或 ID） */
  targetJD?: string;
  /** 基础信息（允许版本级覆盖） */
  basicInfo: BasicInfo;
  /** 简历区块配置（顺序 + 显隐 + 内容） */
  sections: ResumeSection[];
  /** 使用的模板 ID */
  templateId: string;
  /** 创建时间，ISO 8601 */
  createdAt: string;
  /** 最后更新时间，ISO 8601 */
  updatedAt: string;
}

// ============================================
// 顶层聚合类型
// ============================================

/**
 * 简历档案（顶层聚合）
 *
 * 这是整个应用的核心数据根节点：
 * - 包含用户的全部经历资产（素材池）
 * - 包含多个简历版本（针对不同 JD 的产物）
 * - 经历资产可复用，一个实体可出现在多个版本的 sections 中
 */
export interface ResumeProfile {
  id: ID;
  /** 用户基础信息 */
  basicInfo: BasicInfo;
  /** 教育经历资产库 */
  education: Education[];
  /** 工作经历资产库 */
  experience: Experience[];
  /** 项目经历资产库 */
  projects: Project[];
  /** 获奖记录资产库 */
  awards: Award[];
  /** 证书资产库 */
  certifications: Certification[];
  /** 技能资产库 */
  skills: Skill[];
  /** 简历版本列表 */
  versions: ResumeVersion[];
  /** 当前激活的版本 ID */
  currentVersionId?: ID;
  /** 创建时间 */
  createdAt: string;
  /** 最后更新时间 */
  updatedAt: string;
}

// ============================================
// 派生工具类型（用于组件 Props 和函数签名）
// ============================================

/** 经历资产的联合类型 */
export type ExperienceAsset = Education | Experience | Project | Award | Certification | Skill;

/** 可拥有 AI 优化建议的资产类型 */
export type AIOptimizableAsset = Experience | Project;

/** 可拥有 bullets 的资产类型 */
export type BulletAsset = Experience | Project;

/** ResumeSection 中 type 对应的资产数组字段名 */
export type AssetFieldMap = {
  education: 'education';
  experience: 'experience';
  projects: 'projects';
  awards: 'awards';
  certifications: 'certifications';
  skills: 'skills';
  custom: never;
};

/**
 * 根据区块类型获取对应的资产数组
 * 模板渲染和 AI 匹配时使用
 */
export function getAssetFieldBySectionType(type: SectionType): keyof ResumeProfile | null {
  const map: Record<SectionType, keyof ResumeProfile | null> = {
    education: 'education',
    experience: 'experience',
    projects: 'projects',
    awards: 'awards',
    certifications: 'certifications',
    skills: 'skills',
    custom: null,
  };
  return map[type];
}
