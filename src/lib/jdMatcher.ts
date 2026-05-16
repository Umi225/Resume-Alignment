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
import { CAPABILITIES } from '@/lib/jd/capabilities';

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
  | 'soft_skill'
  | 'domain'
  | 'degree'
  | 'general'
  | 'language'
  | 'language_cert'
  | 'translation'
  | 'content'
  | 'product'
  | 'operation'
  | 'marketing'
  | 'data'
  | 'business'
  | 'hr'
  | 'education'
  | 'game'
  | 'technical';

export interface KeywordDef {
  word: string;
  aliases?: string[];
  category: KeywordCategory;
  weight: number; // 1-5, 越高代表在 JD 中越核心
  capability?: string; // 新增：能力维度，keyword -> capability -> category
}

const KEYWORD_DICTIONARY: KeywordDef[] = [
  // ========== 编程语言（技术类：不扩词，只加 capability） ==========
  { word: 'JavaScript', category: 'programming', weight: 4, capability: CAPABILITIES.PROGRAMMING },
  { word: 'TypeScript', category: 'programming', weight: 4, capability: CAPABILITIES.PROGRAMMING },
  { word: 'Python', category: 'programming', weight: 4, capability: CAPABILITIES.PROGRAMMING },
  { word: 'Java', category: 'programming', weight: 4, capability: CAPABILITIES.PROGRAMMING },
  { word: 'Go', aliases: ['Golang'], category: 'programming', weight: 4, capability: CAPABILITIES.PROGRAMMING },
  { word: 'Rust', category: 'programming', weight: 4, capability: CAPABILITIES.PROGRAMMING },
  { word: 'C++', aliases: ['CPP'], category: 'programming', weight: 3, capability: CAPABILITIES.PROGRAMMING },
  { word: 'C#', aliases: ['CSharp'], category: 'programming', weight: 3, capability: CAPABILITIES.PROGRAMMING },
  { word: 'PHP', category: 'programming', weight: 3, capability: CAPABILITIES.PROGRAMMING },
  { word: 'Ruby', category: 'programming', weight: 3, capability: CAPABILITIES.PROGRAMMING },
  { word: 'Swift', category: 'programming', weight: 3, capability: CAPABILITIES.PROGRAMMING },
  { word: 'Kotlin', category: 'programming', weight: 3, capability: CAPABILITIES.PROGRAMMING },
  { word: 'Scala', category: 'programming', weight: 3, capability: CAPABILITIES.PROGRAMMING },
  { word: 'Dart', category: 'programming', weight: 2, capability: CAPABILITIES.PROGRAMMING },
  { word: 'Shell', aliases: ['Bash'], category: 'programming', weight: 2, capability: CAPABILITIES.PROGRAMMING },
  { word: 'SQL', category: 'programming', weight: 3, capability: CAPABILITIES.PROGRAMMING },
  { word: 'HTML', category: 'programming', weight: 2, capability: CAPABILITIES.PROGRAMMING },
  { word: 'CSS', category: 'programming', weight: 2, capability: CAPABILITIES.PROGRAMMING },

  // ========== 前端框架（不扩词） ==========
  { word: 'React', aliases: ['ReactJS', 'React.js'], category: 'frontend', weight: 5, capability: CAPABILITIES.FRONTEND_DEV },
  { word: 'Vue', aliases: ['Vue.js', 'VueJS'], category: 'frontend', weight: 5, capability: CAPABILITIES.FRONTEND_DEV },
  { word: 'Angular', category: 'frontend', weight: 4, capability: CAPABILITIES.FRONTEND_DEV },
  { word: 'Next.js', aliases: ['NextJS'], category: 'frontend', weight: 4, capability: CAPABILITIES.FRONTEND_DEV },
  { word: 'Nuxt', aliases: ['Nuxt.js', 'NuxtJS'], category: 'frontend', weight: 3, capability: CAPABILITIES.FRONTEND_DEV },
  { word: 'Svelte', category: 'frontend', weight: 3, capability: CAPABILITIES.FRONTEND_DEV },
  { word: 'jQuery', category: 'frontend', weight: 2, capability: CAPABILITIES.FRONTEND_DEV },
  { word: 'Electron', category: 'frontend', weight: 3, capability: CAPABILITIES.FRONTEND_DEV },
  { word: 'Webpack', category: 'frontend', weight: 3, capability: CAPABILITIES.FRONTEND_DEV },
  { word: 'Vite', category: 'frontend', weight: 3, capability: CAPABILITIES.FRONTEND_DEV },
  { word: 'Tailwind', aliases: ['TailwindCSS'], category: 'frontend', weight: 3, capability: CAPABILITIES.FRONTEND_DEV },
  { word: 'Sass', aliases: ['SCSS', 'Less'], category: 'frontend', weight: 2, capability: CAPABILITIES.FRONTEND_DEV },
  { word: 'Ant Design', aliases: ['AntD'], category: 'frontend', weight: 3, capability: CAPABILITIES.FRONTEND_DEV },
  { word: 'Element UI', category: 'frontend', weight: 2, capability: CAPABILITIES.FRONTEND_DEV },

  // ========== 后端框架（不扩词） ==========
  { word: 'Node.js', aliases: ['NodeJS', 'Node'], category: 'backend', weight: 4, capability: CAPABILITIES.BACKEND_DEV },
  { word: 'Express', aliases: ['Express.js'], category: 'backend', weight: 3, capability: CAPABILITIES.BACKEND_DEV },
  { word: 'Koa', category: 'backend', weight: 3, capability: CAPABILITIES.BACKEND_DEV },
  { word: 'Django', category: 'backend', weight: 4, capability: CAPABILITIES.BACKEND_DEV },
  { word: 'Flask', category: 'backend', weight: 3, capability: CAPABILITIES.BACKEND_DEV },
  { word: 'Spring', aliases: ['Spring Boot', 'SpringBoot'], category: 'backend', weight: 5, capability: CAPABILITIES.BACKEND_DEV },
  { word: 'FastAPI', category: 'backend', weight: 3, capability: CAPABILITIES.BACKEND_DEV },
  { word: 'Gin', category: 'backend', weight: 3, capability: CAPABILITIES.BACKEND_DEV },
  { word: 'Echo', category: 'backend', weight: 2, capability: CAPABILITIES.BACKEND_DEV },
  { word: 'gRPC', category: 'backend', weight: 4, capability: CAPABILITIES.BACKEND_DEV },
  { word: 'GraphQL', category: 'backend', weight: 4, capability: CAPABILITIES.BACKEND_DEV },
  { word: 'RESTful', aliases: ['REST API', 'REST'], category: 'backend', weight: 4, capability: CAPABILITIES.BACKEND_DEV },

  // ========== 数据库（不扩词） ==========
  { word: 'MySQL', category: 'database', weight: 4, capability: CAPABILITIES.DATABASE_DEV },
  { word: 'PostgreSQL', aliases: ['Postgres'], category: 'database', weight: 4, capability: CAPABILITIES.DATABASE_DEV },
  { word: 'MongoDB', category: 'database', weight: 4, capability: CAPABILITIES.DATABASE_DEV },
  { word: 'Redis', category: 'database', weight: 4, capability: CAPABILITIES.DATABASE_DEV },
  { word: 'Elasticsearch', aliases: ['ES'], category: 'database', weight: 4, capability: CAPABILITIES.DATABASE_DEV },
  { word: 'SQLite', category: 'database', weight: 3, capability: CAPABILITIES.DATABASE_DEV },
  { word: 'Oracle', category: 'database', weight: 3, capability: CAPABILITIES.DATABASE_DEV },
  { word: 'SQL Server', category: 'database', weight: 3, capability: CAPABILITIES.DATABASE_DEV },
  { word: 'ClickHouse', category: 'database', weight: 3, capability: CAPABILITIES.DATABASE_DEV },
  { word: 'TiDB', category: 'database', weight: 3, capability: CAPABILITIES.DATABASE_DEV },

  // ========== DevOps / 云（不扩词） ==========
  { word: 'Docker', category: 'devops', weight: 4, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: 'Kubernetes', aliases: ['K8s'], category: 'devops', weight: 4, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: 'AWS', category: 'devops', weight: 4, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: '阿里云', aliases: ['Aliyun'], category: 'devops', weight: 3, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: '腾讯云', category: 'devops', weight: 3, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: 'CI/CD', aliases: ['CICD', '持续集成'], category: 'devops', weight: 4, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: 'Jenkins', category: 'devops', weight: 3, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: 'GitHub Actions', category: 'devops', weight: 3, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: 'GitLab CI', category: 'devops', weight: 3, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: 'Terraform', category: 'devops', weight: 3, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: 'Nginx', category: 'devops', weight: 3, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: 'Linux', category: 'devops', weight: 3, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: 'Git', category: 'devops', weight: 3, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: 'Prometheus', category: 'devops', weight: 3, capability: CAPABILITIES.DEVOPS_PRACTICE },
  { word: 'Grafana', category: 'devops', weight: 3, capability: CAPABILITIES.DEVOPS_PRACTICE },

  // ========== AI / ML（不扩词） ==========
  { word: 'TensorFlow', category: 'ai', weight: 4, capability: CAPABILITIES.AI_ML },
  { word: 'PyTorch', category: 'ai', weight: 4, capability: CAPABILITIES.AI_ML },
  { word: 'LLM', aliases: ['大模型', '大语言模型'], category: 'ai', weight: 5, capability: CAPABILITIES.AI_ML },
  { word: 'NLP', aliases: ['自然语言处理'], category: 'ai', weight: 5, capability: CAPABILITIES.AI_ML },
  { word: 'CV', aliases: ['计算机视觉', '图像识别'], category: 'ai', weight: 5, capability: CAPABILITIES.AI_ML },
  { word: '机器学习', aliases: ['Machine Learning'], category: 'ai', weight: 5, capability: CAPABILITIES.AI_ML },
  { word: '深度学习', aliases: ['Deep Learning'], category: 'ai', weight: 5, capability: CAPABILITIES.AI_ML },
  { word: 'Transformer', category: 'ai', weight: 4, capability: CAPABILITIES.AI_ML },
  { word: 'BERT', category: 'ai', weight: 4, capability: CAPABILITIES.AI_ML },
  { word: 'GPT', aliases: ['ChatGPT', 'GPT-4'], category: 'ai', weight: 4, capability: CAPABILITIES.AI_ML },
  { word: 'OpenCV', category: 'ai', weight: 3, capability: CAPABILITIES.AI_ML },
  { word: 'Scikit-learn', category: 'ai', weight: 3, capability: CAPABILITIES.AI_ML },
  { word: 'Pandas', category: 'ai', weight: 3, capability: CAPABILITIES.AI_ML },
  { word: 'NumPy', category: 'ai', weight: 3, capability: CAPABILITIES.AI_ML },
  { word: 'OpenAI', category: 'ai', weight: 4, capability: CAPABILITIES.AI_ML },
  { word: 'LangChain', category: 'ai', weight: 4, capability: CAPABILITIES.AI_ML },
  { word: 'RAG', category: 'ai', weight: 4, capability: CAPABILITIES.AI_ML },
  { word: 'Agent', aliases: ['智能体'], category: 'ai', weight: 4, capability: CAPABILITIES.AI_ML },
  { word: 'Prompt Engineering', aliases: ['Prompt', '提示工程'], category: 'ai', weight: 4, capability: CAPABILITIES.AI_ML },
  { word: 'Fine-tuning', aliases: ['微调'], category: 'ai', weight: 4, capability: CAPABILITIES.AI_ML },
  { word: '向量数据库', aliases: ['Vector DB'], category: 'ai', weight: 4, capability: CAPABILITIES.AI_ML },

  // ========== 移动端（不扩词） ==========
  { word: 'iOS', category: 'mobile', weight: 4, capability: CAPABILITIES.MOBILE_DEV },
  { word: 'Android', category: 'mobile', weight: 4, capability: CAPABILITIES.MOBILE_DEV },
  { word: 'Flutter', category: 'mobile', weight: 4, capability: CAPABILITIES.MOBILE_DEV },
  { word: 'React Native', category: 'mobile', weight: 4, capability: CAPABILITIES.MOBILE_DEV },
  { word: 'UniApp', category: 'mobile', weight: 3, capability: CAPABILITIES.MOBILE_DEV },
  { word: '微信小程序', aliases: ['小程序'], category: 'mobile', weight: 3, capability: CAPABILITIES.MOBILE_DEV },

  // ========== 软技能 / 通用 ==========
  { word: '沟通', aliases: ['沟通能力', '沟通技巧'], category: 'soft_skill', weight: 3, capability: CAPABILITIES.SOFT_SKILL },
  { word: '团队协作', aliases: ['团队合作', 'Teamwork'], category: 'soft_skill', weight: 3, capability: CAPABILITIES.SOFT_SKILL },
  { word: '项目管理', aliases: ['PM', 'Project Management'], category: 'soft_skill', weight: 3, capability: CAPABILITIES.SOFT_SKILL },
  { word: '领导力', aliases: ['Leadership', '带领团队'], category: 'soft_skill', weight: 3, capability: CAPABILITIES.SOFT_SKILL },
  { word: '解决问题', aliases: ['Problem Solving'], category: 'soft_skill', weight: 3, capability: CAPABILITIES.SOFT_SKILL },
  { word: '自驱', aliases: ['自驱力', '主动性', '积极主动'], category: 'soft_skill', weight: 3, capability: CAPABILITIES.SOFT_SKILL },
  { word: '学习能力', category: 'soft_skill', weight: 3, capability: CAPABILITIES.SOFT_SKILL },
  { word: '抗压能力', category: 'soft_skill', weight: 2, capability: CAPABILITIES.SOFT_SKILL },
  { word: '执行力', category: 'soft_skill', weight: 3, capability: CAPABILITIES.SOFT_SKILL },
  { word: '时间管理', category: 'soft_skill', weight: 2, capability: CAPABILITIES.SOFT_SKILL },
  { word: '复盘', aliases: ['总结复盘'], category: 'soft_skill', weight: 2, capability: CAPABILITIES.SOFT_SKILL },
  { word: '组织能力', category: 'soft_skill', weight: 3, capability: CAPABILITIES.SOFT_SKILL },

  // ========== 基础语言能力 ==========
  { word: '英语', aliases: ['English'], category: 'language', weight: 3, capability: CAPABILITIES.LANGUAGE },
  { word: '日语', aliases: ['Japanese'], category: 'language', weight: 3, capability: CAPABILITIES.LANGUAGE },
  { word: '韩语', aliases: ['Korean'], category: 'language', weight: 3, capability: CAPABILITIES.LANGUAGE },
  { word: '法语', aliases: ['French'], category: 'language', weight: 3, capability: CAPABILITIES.LANGUAGE },
  { word: '德语', aliases: ['German'], category: 'language', weight: 3, capability: CAPABILITIES.LANGUAGE },
  { word: '商务英语', category: 'language', weight: 3, capability: CAPABILITIES.LANGUAGE },
  { word: '英文阅读', aliases: ['英语阅读'], category: 'language', weight: 2, capability: CAPABILITIES.LANGUAGE },
  { word: '英语沟通', aliases: ['英语交流', '英语口语'], category: 'language', weight: 3, capability: CAPABILITIES.LANGUAGE },

  // ========== 语言证书 ==========
  { word: '雅思', aliases: ['IELTS'], category: 'language_cert', weight: 4, capability: CAPABILITIES.LANGUAGE_CERT },
  { word: '托福', aliases: ['TOEFL'], category: 'language_cert', weight: 4, capability: CAPABILITIES.LANGUAGE_CERT },
  { word: 'CET-4', aliases: ['四级', '大学英语四级'], category: 'language_cert', weight: 2, capability: CAPABILITIES.LANGUAGE_CERT },
  { word: 'CET-6', aliases: ['六级', '大学英语六级'], category: 'language_cert', weight: 3, capability: CAPABILITIES.LANGUAGE_CERT },
  { word: 'TEM4', aliases: ['英语专业四级'], category: 'language_cert', weight: 3, capability: CAPABILITIES.LANGUAGE_CERT },
  { word: 'TEM8', aliases: ['英语专业八级'], category: 'language_cert', weight: 4, capability: CAPABILITIES.LANGUAGE_CERT },
  { word: 'CATTI', aliases: ['全国翻译专业资格'], category: 'language_cert', weight: 4, capability: CAPABILITIES.LANGUAGE_CERT },

  // ========== P0: product（产品）— 补充高频核心词 ==========
  { word: '产品设计', category: 'product', weight: 4, capability: CAPABILITIES.PRODUCT_DESIGN },
  { word: '用户研究', aliases: ['用户调研'], category: 'product', weight: 3, capability: CAPABILITIES.USER_RESEARCH },
  { word: '产品经理', aliases: ['PM'], category: 'product', weight: 4, capability: CAPABILITIES.PRODUCT_DESIGN },
  { word: '需求分析', category: 'product', weight: 4, capability: CAPABILITIES.PRODUCT_ANALYSIS },
  { word: '竞品分析', category: 'product', weight: 3, capability: CAPABILITIES.PRODUCT_ANALYSIS },
  { word: '产品规划', category: 'product', weight: 4, capability: CAPABILITIES.PRODUCT_ANALYSIS },
  { word: '原型设计', category: 'product', weight: 3, capability: CAPABILITIES.PRODUCT_DESIGN },
  { word: '用户体验', aliases: ['UX'], category: 'product', weight: 4, capability: CAPABILITIES.USER_RESEARCH },
  { word: '用户画像', category: 'product', weight: 3, capability: CAPABILITIES.USER_RESEARCH },
  { word: '功能设计', category: 'product', weight: 3, capability: CAPABILITIES.PRODUCT_DESIGN },
  { word: '产品迭代', category: 'product', weight: 3, capability: CAPABILITIES.PRODUCT_DESIGN },
  { word: 'PRD', aliases: ['产品需求文档'], category: 'product', weight: 3, capability: CAPABILITIES.PRODUCT_DESIGN },
  { word: '敏捷开发', aliases: ['Scrum'], category: 'product', weight: 3, capability: CAPABILITIES.PRODUCT_DESIGN },
  { word: 'MVP', category: 'product', weight: 3, capability: CAPABILITIES.PRODUCT_DESIGN },
  { word: '商业化', category: 'product', weight: 3, capability: CAPABILITIES.PRODUCT_ANALYSIS },
  { word: 'A/B测试', aliases: ['AB测试'], category: 'product', weight: 4, capability: CAPABILITIES.GROWTH_ANALYSIS },

  // ========== P0: operation（运营）— 补充高频核心词 ==========
  { word: '内容运营', category: 'operation', weight: 4, capability: CAPABILITIES.CONTENT_OPERATION },
  { word: '用户运营', category: 'operation', weight: 4, capability: CAPABILITIES.USER_OPERATION },
  { word: '社群运营', category: 'operation', weight: 4, capability: CAPABILITIES.USER_OPERATION },
  { word: '活动运营', category: 'operation', weight: 4, capability: CAPABILITIES.ACTIVITY_OPERATION },
  { word: '新媒体运营', category: 'operation', weight: 4, capability: CAPABILITIES.CONTENT_OPERATION },
  { word: '短视频运营', category: 'operation', weight: 4, capability: CAPABILITIES.CONTENT_OPERATION },
  { word: '直播运营', category: 'operation', weight: 4, capability: CAPABILITIES.PLATFORM_OPERATION },
  { word: '电商运营', category: 'operation', weight: 4, capability: CAPABILITIES.PLATFORM_OPERATION },
  { word: '增长运营', category: 'operation', weight: 4, capability: CAPABILITIES.GROWTH },
  { word: '数据运营', category: 'operation', weight: 3, capability: CAPABILITIES.DATA_ANALYSIS },
  { word: '渠道运营', category: 'operation', weight: 3, capability: CAPABILITIES.PLATFORM_OPERATION },
  { word: '品牌运营', category: 'operation', weight: 3, capability: CAPABILITIES.MARKETING },
  { word: '社区运营', category: 'operation', weight: 3, capability: CAPABILITIES.USER_OPERATION },
  { word: '私域流量', aliases: ['私域'], category: 'operation', weight: 4, capability: CAPABILITIES.GROWTH },
  { word: '流量运营', category: 'operation', weight: 3, capability: CAPABILITIES.GROWTH },
  { word: '平台运营', category: 'operation', weight: 3, capability: CAPABILITIES.PLATFORM_OPERATION },
  { word: '用户增长', category: 'operation', weight: 5, capability: CAPABILITIES.GROWTH },
  { word: '留存分析', category: 'operation', weight: 3, capability: CAPABILITIES.GROWTH_ANALYSIS },
  { word: '活动策划', category: 'operation', weight: 3, capability: CAPABILITIES.ACTIVITY_OPERATION },

  // ========== P0: content（内容）— 补充高频核心词 ==========
  { word: '跨文化传播', aliases: ['跨文化沟通', '国际传播'], category: 'content', weight: 4, capability: CAPABILITIES.CONTENT_STRATEGY },
  { word: '双语内容', aliases: ['双语'], category: 'content', weight: 3, capability: CAPABILITIES.CONTENT_CREATION },
  { word: '文案撰写', aliases: ['文案写作', '文案策划'], category: 'content', weight: 4, capability: CAPABILITIES.CONTENT_CREATION },
  { word: '内容策划', category: 'content', weight: 4, capability: CAPABILITIES.CONTENT_STRATEGY },
  { word: '创意策划', category: 'content', weight: 3, capability: CAPABILITIES.CONTENT_STRATEGY },
  { word: '新媒体', category: 'content', weight: 3, capability: CAPABILITIES.CONTENT_OPERATION },
  { word: '公众号', aliases: ['微信公众号'], category: 'content', weight: 3, capability: CAPABILITIES.CONTENT_OPERATION },
  { word: '短视频', category: 'content', weight: 4, capability: CAPABILITIES.CONTENT_CREATION },
  { word: '视频剪辑', category: 'content', weight: 3, capability: CAPABILITIES.CONTENT_TOOLS },
  { word: '自媒体', category: 'content', weight: 3, capability: CAPABILITIES.CONTENT_CREATION },
  { word: '内容创作', category: 'content', weight: 4, capability: CAPABILITIES.CONTENT_CREATION },
  { word: '品牌文案', category: 'content', weight: 3, capability: CAPABILITIES.CONTENT_CREATION },
  { word: '营销文案', category: 'content', weight: 3, capability: CAPABILITIES.MARKETING },
  { word: '脚本撰写', aliases: ['剧本'], category: 'content', weight: 3, capability: CAPABILITIES.CONTENT_CREATION },
  { word: '标题优化', category: 'content', weight: 2, capability: CAPABILITIES.CONTENT_STRATEGY },
  { word: '热点追踪', category: 'content', weight: 3, capability: CAPABILITIES.CONTENT_OPERATION },
  { word: '舆情监测', category: 'content', weight: 3, capability: CAPABILITIES.CONTENT_STRATEGY },

  // ========== P0: translation（翻译）— 补充高频核心词 ==========
  { word: '英文写作', aliases: ['英语写作'], category: 'translation', weight: 4, capability: CAPABILITIES.TRANSLATION },
  { word: '同声传译', aliases: ['同传'], category: 'translation', weight: 5, capability: CAPABILITIES.INTERPRETATION },
  { word: '交替传译', aliases: ['交传'], category: 'translation', weight: 5, capability: CAPABILITIES.INTERPRETATION },
  { word: '本地化翻译', aliases: ['游戏本地化', '软件本地化'], category: 'translation', weight: 4, capability: CAPABILITIES.TRANSLATION },
  { word: '笔译', category: 'translation', weight: 4, capability: CAPABILITIES.TRANSLATION },
  { word: '口译', category: 'translation', weight: 4, capability: CAPABILITIES.INTERPRETATION },
  { word: '翻译校对', aliases: ['审校'], category: 'translation', weight: 3, capability: CAPABILITIES.TRANSLATION },
  { word: '术语管理', category: 'translation', weight: 3, capability: CAPABILITIES.TRANSLATION },
  { word: '字幕翻译', category: 'translation', weight: 3, capability: CAPABILITIES.TRANSLATION },
  { word: '文学翻译', category: 'translation', weight: 3, capability: CAPABILITIES.TRANSLATION },
  { word: '商务翻译', category: 'translation', weight: 3, capability: CAPABILITIES.TRANSLATION },
  { word: '技术翻译', category: 'translation', weight: 3, capability: CAPABILITIES.TRANSLATION },
  { word: '医学翻译', category: 'translation', weight: 3, capability: CAPABILITIES.TRANSLATION },
  { word: '法律翻译', category: 'translation', weight: 3, capability: CAPABILITIES.TRANSLATION },
  { word: '机器翻译', aliases: ['MT'], category: 'translation', weight: 3, capability: CAPABILITIES.TRANSLATION },
  { word: '译后编辑', aliases: ['PE'], category: 'translation', weight: 3, capability: CAPABILITIES.TRANSLATION },
  { word: '多语言本地化', category: 'translation', weight: 4, capability: CAPABILITIES.TRANSLATION },
  { word: '翻译质量管理', category: 'translation', weight: 3, capability: CAPABILITIES.TRANSLATION },
  { word: '语言测试', category: 'translation', weight: 3, capability: CAPABILITIES.TRANSLATION },

  // ========== P0: game（游戏）— 补充高频核心词 ==========
  { word: '游戏设计', category: 'game', weight: 4, capability: CAPABILITIES.GAME_DESIGN },
  { word: 'Unity', category: 'game', weight: 4, capability: CAPABILITIES.GAME_DEVELOPMENT },
  { word: '关卡设计', category: 'game', weight: 4, capability: CAPABILITIES.GAME_DESIGN },
  { word: '系统策划', category: 'game', weight: 4, capability: CAPABILITIES.GAME_DESIGN },
  { word: '数值策划', category: 'game', weight: 4, capability: CAPABILITIES.GAME_DESIGN },
  { word: '剧情策划', aliases: ['文案策划'], category: 'game', weight: 3, capability: CAPABILITIES.GAME_DESIGN },
  { word: '战斗策划', category: 'game', weight: 3, capability: CAPABILITIES.GAME_DESIGN },
  { word: '游戏运营', category: 'game', weight: 3, capability: CAPABILITIES.USER_OPERATION },
  { word: '游戏测试', category: 'game', weight: 3, capability: CAPABILITIES.GAME_DEVELOPMENT },
  { word: 'Unreal', aliases: ['UE4', 'UE5', '虚幻引擎'], category: 'game', weight: 4, capability: CAPABILITIES.GAME_DEVELOPMENT },
  { word: '游戏引擎', category: 'game', weight: 3, capability: CAPABILITIES.GAME_DEVELOPMENT },
  { word: '原画', category: 'game', weight: 3, capability: CAPABILITIES.DESIGN_TOOLS },
  { word: '3D建模', aliases: ['建模'], category: 'game', weight: 3, capability: CAPABILITIES.DESIGN_TOOLS },
  { word: '游戏UI', category: 'game', weight: 3, capability: CAPABILITIES.DESIGN_TOOLS },
  { word: '版本运营', category: 'game', weight: 3, capability: CAPABILITIES.PLATFORM_OPERATION },

  // ========== P1: marketing（市场）— 补充高频核心词 ==========
  { word: '品牌营销', category: 'marketing', weight: 4, capability: CAPABILITIES.MARKETING },
  { word: '市场推广', category: 'marketing', weight: 3, capability: CAPABILITIES.MARKETING },
  { word: '市场营销', category: 'marketing', weight: 4, capability: CAPABILITIES.MARKETING },
  { word: '品牌策划', category: 'marketing', weight: 3, capability: CAPABILITIES.MARKETING },
  { word: '广告投放', aliases: ['买量', '效果广告'], category: 'marketing', weight: 4, capability: CAPABILITIES.MARKETING },
  { word: '渠道拓展', category: 'marketing', weight: 3, capability: CAPABILITIES.MARKET_ANALYSIS },
  { word: '商务拓展', aliases: ['BD', 'Business Development'], category: 'marketing', weight: 3, capability: CAPABILITIES.MARKET_ANALYSIS },
  { word: '公关传播', aliases: ['PR'], category: 'marketing', weight: 3, capability: CAPABILITIES.MARKETING },
  { word: '社媒运营', aliases: ['社交媒体运营'], category: 'marketing', weight: 3, capability: CAPABILITIES.CONTENT_OPERATION },
  { word: 'KOL合作', aliases: ['KOL', '达人合作'], category: 'marketing', weight: 3, capability: CAPABILITIES.MARKETING },
  { word: '市场调研', category: 'marketing', weight: 3, capability: CAPABILITIES.MARKET_ANALYSIS },
  { word: '用户洞察', category: 'marketing', weight: 3, capability: CAPABILITIES.USER_RESEARCH },
  { word: '品牌定位', category: 'marketing', weight: 3, capability: CAPABILITIES.MARKETING },
  { word: '整合营销', category: 'marketing', weight: 3, capability: CAPABILITIES.MARKETING },

  // ========== P1: data（数据）— 补充高频核心词 ==========
  { word: '数据分析', category: 'data', weight: 4, capability: CAPABILITIES.DATA_ANALYSIS },
  { word: '数据可视化', category: 'data', weight: 3, capability: CAPABILITIES.DATA_ANALYSIS },
  { word: '数据挖掘', category: 'data', weight: 4, capability: CAPABILITIES.DATA_ANALYSIS },
  { word: '数据建模', category: 'data', weight: 4, capability: CAPABILITIES.DATA_ENGINEERING },
  { word: '数据清洗', category: 'data', weight: 3, capability: CAPABILITIES.DATA_ENGINEERING },
  { word: '数据治理', category: 'data', weight: 3, capability: CAPABILITIES.DATA_ENGINEERING },
  { word: '数据仓库', aliases: ['Data Warehouse', '数仓'], category: 'data', weight: 3, capability: CAPABILITIES.DATA_ENGINEERING },
  { word: '数据产品', category: 'data', weight: 3, capability: CAPABILITIES.DATA_ANALYSIS },
  { word: '商业智能', aliases: ['BI'], category: 'data', weight: 3, capability: CAPABILITIES.DATA_ANALYSIS },
  { word: '数据报表', category: 'data', weight: 2, capability: CAPABILITIES.DATA_ANALYSIS },
  { word: '指标体系', category: 'data', weight: 3, capability: CAPABILITIES.DATA_ANALYSIS },
  { word: '用户行为分析', category: 'data', weight: 3, capability: CAPABILITIES.DATA_ANALYSIS },
  { word: '漏斗分析', category: 'data', weight: 3, capability: CAPABILITIES.GROWTH_ANALYSIS },
  { word: '归因分析', category: 'data', weight: 3, capability: CAPABILITIES.GROWTH_ANALYSIS },
  { word: 'SQL查询', aliases: ['SQL分析'], category: 'data', weight: 3, capability: CAPABILITIES.DATA_ANALYSIS },

  // ========== 工具类 capability（不新增 category） ==========
  { word: 'Excel', category: 'general', weight: 2, capability: CAPABILITIES.OFFICE_TOOLS },
  { word: 'PowerPoint', aliases: ['PPT'], category: 'general', weight: 2, capability: CAPABILITIES.OFFICE_TOOLS },
  { word: 'Word', category: 'general', weight: 1, capability: CAPABILITIES.OFFICE_TOOLS },
  { word: 'Figma', category: 'product', weight: 3, capability: CAPABILITIES.DESIGN_TOOLS },
  { word: 'Sketch', category: 'product', weight: 3, capability: CAPABILITIES.DESIGN_TOOLS },
  { word: 'Axure', category: 'product', weight: 3, capability: CAPABILITIES.DESIGN_TOOLS },
  { word: 'Photoshop', aliases: ['PS'], category: 'content', weight: 2, capability: CAPABILITIES.DESIGN_TOOLS },
  { word: 'Premiere', aliases: ['PR'], category: 'content', weight: 2, capability: CAPABILITIES.CONTENT_TOOLS },
  { word: '剪映', category: 'content', weight: 2, capability: CAPABILITIES.CONTENT_TOOLS },
  { word: 'Jira', category: 'general', weight: 2, capability: CAPABILITIES.COLLABORATION_TOOLS },
  { word: 'Confluence', category: 'general', weight: 2, capability: CAPABILITIES.COLLABORATION_TOOLS },
  { word: 'Notion', category: 'general', weight: 2, capability: CAPABILITIES.COLLABORATION_TOOLS },
  { word: 'Visio', category: 'general', weight: 2, capability: CAPABILITIES.DESIGN_TOOLS },
  { word: 'XMind', category: 'general', weight: 2, capability: CAPABILITIES.COLLABORATION_TOOLS },
  { word: 'Tableau', category: 'data', weight: 3, capability: CAPABILITIES.DATA_TOOLS },
  { word: 'PowerBI', category: 'data', weight: 3, capability: CAPABILITIES.DATA_TOOLS },

  // ========== 商业 / HR / 教育 / 通用技术 / 领域知识（保持原有，加 capability） ==========
  { word: '商业分析', category: 'business', weight: 4, capability: CAPABILITIES.MARKET_ANALYSIS },
  { word: '招聘', category: 'hr', weight: 3, capability: CAPABILITIES.SOFT_SKILL },
  { word: '课程设计', category: 'education', weight: 3, capability: CAPABILITIES.CONTENT_STRATEGY },
  { word: '技术架构', aliases: ['系统架构'], category: 'technical', weight: 4, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },

  // 领域知识
  { word: '微服务', aliases: ['Microservices'], category: 'domain', weight: 4, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '分布式', aliases: ['分布式系统', 'Distributed'], category: 'domain', weight: 4, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '高并发', aliases: ['高可用', '并发'], category: 'domain', weight: 4, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '性能优化', aliases: ['Optimization', '调优'], category: 'domain', weight: 4, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '数据结构', category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '算法', category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '设计模式', category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '网络安全', category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '测试', aliases: ['单元测试', '自动化测试', 'TDD'], category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '监控', aliases: ['日志', '链路追踪'], category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '消息队列', aliases: ['MQ', 'Kafka', 'RabbitMQ', 'RocketMQ'], category: 'domain', weight: 4, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '缓存', aliases: ['Cache', 'CDN'], category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '大数据', aliases: ['Big Data', 'Hadoop', 'Spark', 'Flink'], category: 'domain', weight: 4, capability: CAPABILITIES.DATA_ENGINEERING },
  { word: '区块链', aliases: ['Blockchain', 'Web3'], category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '音视频', category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '推荐系统', category: 'domain', weight: 4, capability: CAPABILITIES.DATA_ANALYSIS },
  { word: '搜索', aliases: ['搜索引擎', '检索'], category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '支付', category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '电商', category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: 'SaaS', category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: 'B端', aliases: ['To B'], category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: 'C端', aliases: ['To C'], category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },
  { word: '低代码', category: 'domain', weight: 3, capability: CAPABILITIES.DOMAIN_KNOWLEDGE },

  // ========== 学历 / 岗位级别 ==========
  { word: '本科', category: 'degree', weight: 2, capability: CAPABILITIES.DEGREE },
  { word: '硕士', aliases: ['研究生'], category: 'degree', weight: 2, capability: CAPABILITIES.DEGREE },
  { word: '博士', category: 'degree', weight: 2, capability: CAPABILITIES.DEGREE },
  { word: '985', category: 'degree', weight: 1, capability: CAPABILITIES.DEGREE },
  { word: '211', category: 'degree', weight: 1, capability: CAPABILITIES.DEGREE },
  { word: '双一流', category: 'degree', weight: 1, capability: CAPABILITIES.DEGREE },
  { word: 'QS', category: 'degree', weight: 1, capability: CAPABILITIES.DEGREE },

  { word: '校招', aliases: ['应届生', '校园招聘'], category: 'general', weight: 2, capability: CAPABILITIES.GENERAL },
  { word: '实习', category: 'general', weight: 2, capability: CAPABILITIES.GENERAL },
  { word: '社招', category: 'general', weight: 2, capability: CAPABILITIES.GENERAL },
  { word: '全职', category: 'general', weight: 2, capability: CAPABILITIES.GENERAL },
  { word: '远程', aliases: ['Remote'], category: 'general', weight: 1, capability: CAPABILITIES.GENERAL },
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
  capability?: string; // 新增
  // 在 JD 原文中的位置
  positions: number[];
}

export interface CapabilitySummary {
  capability: string;
  keywords: string[];
  totalWeight: number;
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
  // 新增：capability 聚合层（keyword → capability → category）
  capabilitySummary: CapabilitySummary[];
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
    // 中文关键词不使用 \b 词边界（JavaScript \b 仅对 ASCII 生效）
    const isChinese = /[一-龥]/.test(form);
    const hasMatch = isChinese
      ? lower.includes(form)
      : new RegExp(`\\b${escapeRegex(form)}\\b`, 'gi').test(lower);
    if (hasMatch) {
      const baseWord = def.word;
      if (!seenWords.has(baseWord)) {
        seenWords.add(baseWord);
        keywords.push({
          word: baseWord,
          category: def.category,
          weight: def.weight,
          capability: def.capability,
          positions: [],
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

  // capability 聚合：keyword -> capability -> category
  // 展示层权重校准：降低 soft_skill / degree / general 对 capabilitySummary 排序的污染
  const CATEGORY_MULTIPLIER: Record<string, number> = {
    soft_skill: 0.5,
    degree: 0.3,
    general: 0.3,
  };

  const capabilityMap = new Map<string, { keywords: string[]; totalWeight: number }>();
  for (const kw of keywords) {
    const cap = kw.capability || kw.category; // 回退到 category
    const multiplier = CATEGORY_MULTIPLIER[kw.category] ?? 1.0;
    const existing = capabilityMap.get(cap);
    if (existing) {
      existing.keywords.push(kw.word);
      existing.totalWeight += kw.weight * multiplier;
    } else {
      capabilityMap.set(cap, { keywords: [kw.word], totalWeight: kw.weight * multiplier });
    }
  }
  const capabilitySummary: CapabilitySummary[] = Array.from(capabilityMap.entries())
    .map(([capability, { keywords, totalWeight }]) => ({
      capability,
      keywords,
      totalWeight,
    }))
    .sort((a, b) => b.totalWeight - a.totalWeight);

  return { keywords, requirements, totalKeywordWeight, capabilitySummary };
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
  recommendationLevel?: 'highly' | 'recommended' | 'optional';
  advice?: string;
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
// 建议文案生成（中性表述，规则模板）
// ============================================

const languageKeywords = ['英语', '日语', '韩语', '法语', '德语', '商务英语', '英文阅读', '英语沟通', '雅思', '托福', 'ielts', 'toefl', 'catti', 'CET-4', 'CET-6', 'TEM4', 'TEM8', '日语能力', '同声传译', '交替传译', '本地化翻译', '英文写作'];
const toolKeywords = ['git', 'docker', 'jenkins', 'figma', 'sketch', 'vscode', 'webpack', 'vite'];

function generateAdvice(result: AssetMatchResult): string {
  const { kind, score, recommendationLevel, details } = result;

  // 经历类：experience / project
  if (kind === 'experience' || kind === 'project') {
    if (recommendationLevel === 'highly') {
      return '建议放在简历靠前位置，并强化结果表达。';
    }
    if (recommendationLevel === 'recommended') {
      const hasTech = details.some((d) => d.weight >= 3);
      return hasTech
        ? '适合体现技术深度与项目落地能力。'
        : '适合体现产品判断与跨团队协作能力。';
    }
    return '可作为补充经历，视简历篇幅决定是否放入。';
  }

  // 技能类
  if (kind === 'skill') {
    const s = result.asset as Skill;
    const text = `${s.name} ${s.category || ''} ${s.description || ''}`.toLowerCase();
    const isLanguage = languageKeywords.some((kw) => text.includes(kw.toLowerCase()));
    const isTool = toolKeywords.some((kw) => text.includes(kw.toLowerCase())) || s.category === '工具';
    if (isLanguage) return '适合放入语言能力模块。';
    if (isTool) return '建议与项目经历形成呼应。';
    return '建议在技能与证书栏展示。';
  }

  // 证书类
  if (kind === 'certification') {
    return '可作为岗位相关能力展示。';
  }

  // 奖项类
  if (kind === 'award') {
    return '适合在荣誉奖项模块简要展示。';
  }

  // 教育类
  if (kind === 'education') {
    return '教育背景为简历基础模块，默认展示。';
  }

  return '';
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

  // 对经历类资产设置绝对阈值推荐等级
  const experienceMatches = matches.filter(
    (m) => m.kind === 'experience' || m.kind === 'project'
  );
  for (const m of experienceMatches) {
    if (m.score >= 70) m.recommendationLevel = 'highly';
    else if (m.score >= 40) m.recommendationLevel = 'recommended';
    else m.recommendationLevel = 'optional';
  }

  // 为所有匹配结果生成建议文案
  for (const m of matches) {
    m.advice = generateAdvice(m);
  }

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
    soft_skill: 'bg-amber-50 text-amber-700 border-amber-200',
    domain: 'bg-teal-50 text-teal-700 border-teal-200',
    degree: 'bg-gray-50 text-gray-700 border-gray-200',
    general: 'bg-gray-50 text-gray-600 border-gray-200',
    language: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    language_cert: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    translation: 'bg-teal-50 text-teal-700 border-teal-200',
    content: 'bg-rose-50 text-rose-700 border-rose-200',
    product: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    operation: 'bg-lime-50 text-lime-700 border-lime-200',
    marketing: 'bg-red-50 text-red-700 border-red-200',
    data: 'bg-green-50 text-green-700 border-green-200',
    business: 'bg-slate-50 text-slate-700 border-slate-200',
    hr: 'bg-orange-50 text-orange-700 border-orange-200',
    education: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    game: 'bg-purple-50 text-purple-700 border-purple-200',
    technical: 'bg-blue-50 text-blue-700 border-blue-200',
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
    soft_skill: '软技能',
    domain: '领域知识',
    degree: '学历',
    general: '通用',
    language: '语言能力',
    language_cert: '语言证书',
    translation: '翻译/语言',
    content: '内容传播',
    product: '产品',
    operation: '运营',
    marketing: '市场',
    data: '数据',
    business: '商业',
    hr: '人力资源',
    education: '教育',
    game: '游戏',
    technical: '技术',
  };
  return map[category] || '其他';
}
