# 变更日志 (Changelog)

> 格式遵循 [Keep a Changelog](https://keepachangelog.com/)  
> 版本号遵循 [SemVer](https://semver.org/)

---

## [Unreleased]

### Added
- 建立项目目录结构 `/docs`
- 工程化文档初始化：
  - `requirements.md` — MVP 需求范围
  - `ui-plan.md` — 三页面 UI 规划
  - `api-contract.md` — 接口契约（规划中）
  - `task-list.md` — P0/P1/P2 任务拆分
  - `coding-rules.md` — 编码规范与协作约束
  - `changelog.md` — 变更记录

---

## [0.0.1] — 2026-05-13

### Added
- **数据类型层** (`src/types/resume.ts`)
  - `ResumeProfile` — 顶层聚合类型，包含资产库与版本管理
  - `BasicInfo` — 用户基础信息
  - `Education` — 教育经历（含课程、GPA、排名）
  - `Experience` — 工作经历/实习（bullets[]、tags[]、AI 优化）
  - `Project` — 项目经历（7 种类型：AI/竞赛/科研/创业/个人/课程/工作）
  - `Award` — 获奖记录
  - `Certification` — 证书/认证
  - `Skill` — 技能（含分类、熟练度、关联经历）
  - `ResumeVersion` — 简历版本（多版本管理）
  - `ResumeSection` — 简历区块（顺序、显隐、内容引用）
  - `AIOptimization` — AI 优化建议结构（不覆盖原文）
  - 工具函数 `getAssetFieldBySectionType()` — 区块类型到资产字段的映射

### Design Decisions
- 资产库与简历版本分离：经历资产存储在 `ResumeProfile`，版本通过 `itemIds` 引用
- bullets 数组设计：便于 AI 逐条优化，便于模板逐条渲染
- AI 优化隔离：`aiOptimized` 字段存储建议，需用户显式 `applied: true` 才生效
- 日期格式 `YYYY-MM`：统一排序与显示逻辑
