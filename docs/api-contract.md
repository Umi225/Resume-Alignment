# API 契约文档 (API Contract)

> 状态：规划中，MVP 阶段暂无真实后端  
> 最后更新：2026-05-13  
> 当前项目真实状态：仅有前端类型定义，无 API 实现

---

## 说明

MVP 阶段数据存储在 **LocalStorage**，不接入真实后端。本文档记录预期接口契约，供后续接入 AI 服务或后端时参考。

所有接口遵循 RESTful 风格，返回统一包装格式：

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

---

## 前端数据层（MVP 阶段）

### LocalStorage Key

| Key | 存储内容 | 说明 |
|---|---|---|
| `resume-profile` | `ResumeProfile` JSON | 完整的简历档案数据 |
| `resume-preferences` | 用户偏好 JSON | 主题、最近使用的模板等 |

### 数据操作函数（规划中）

```typescript
// lib/storage.ts（规划中）
function loadProfile(): ResumeProfile | null;
function saveProfile(profile: ResumeProfile): void;
function exportBackup(): string; // 返回 JSON 字符串，供用户下载
function importBackup(json: string): ResumeProfile;
```

---

## AI 服务接口（规划中）

### POST /api/ai/analyze-jd

分析 JD 文本，提取结构化要求。

**Request**
```json
{
  "jdText": "string"
}
```

**Response**
```json
{
  "companyName": "string?",
  "position": "string?",
  "requirements": {
    "hard": [{ "id": "string", "text": "string", "priority": "must" }],
    "core": [{ "id": "string", "text": "string", "priority": "preferred" }],
    "bonus": [{ "id": "string", "text": "string", "priority": "bonus" }]
  },
  "keywords": ["string"]
}
```

**状态**：规划中，MVP 阶段可 mock 返回

---

### POST /api/ai/match-experiences

将经历资产与 JD 要求进行匹配。

**Request**
```json
{
  "jdAnalysis": { /* JDAnalysis 对象 */ },
  "experiences": [ /* ExperienceAsset[] */ ]
}
```

**Response**
```json
{
  "matches": [
    {
      "experienceId": "string",
      "requirementIds": ["string"],
      "matchScore": 0-100,
      "matchReason": "string",
      "gapNote": "string?"
    }
  ]
}
```

**状态**：规划中，MVP 阶段可本地关键词匹配实现

---

### POST /api/ai/optimize-star

基于 STAR 法则优化经历描述。

**Request**
```json
{
  "rawDescription": "string",
  "targetKeywords": ["string"],
  "context": {
    "type": "experience" | "project",
    "title": "string"
  }
}
```

**Response**
```json
{
  "originalBullets": ["string"],
  "optimizedBullets": ["string"],
  "explanation": "string",
  "confidence": "high" | "medium" | "low"
}
```

**状态**：规划中，MVP 阶段可 mock 或接入第三方 LLM API

---

## 数据类型约束

所有请求/响应数据类型必须与 `src/types/resume.ts` 保持一致。

关键约束：
- `ID` 使用 `nanoid` 或 `crypto.randomUUID()` 生成
- `DateString` 格式为 `YYYY-MM`
- `createdAt` / `updatedAt` 使用 ISO 8601 格式
- AI 生成的内容不得覆盖用户原始数据，必须通过 `AIOptimization` 结构存储
