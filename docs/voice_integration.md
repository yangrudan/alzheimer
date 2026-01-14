# 语音/智能音箱集成指南

## 概述

本文档描述了 Alzheimer 预防系统的语音/智能音箱集成功能。该功能允许外部语音前端（如 xiaogpt 或智能音箱 Skill）通过统一 webhook 调用后端，执行提醒/服药确认/紧急告警等业务逻辑，并记录审计信息。

## 架构概览

```
┌─────────────────┐
│  语音前端设备    │
│ (小米音箱/xiaogpt)│
└────────┬────────┘
         │ HTTP POST
         ▼
┌─────────────────┐
│  Webhook 端点   │
│ /api/voice/webhook│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  VoiceService   │
│  意图处理器      │
└────────┬────────┘
         │
    ┌────┴────┬─────────┐
    ▼         ▼         ▼
┌────────┐┌────────┐┌────────┐
│服药确认││查询提醒││紧急呼叫│
└────────┘└────────┘└────────┘
         │
         ▼
┌─────────────────┐
│  审计日志记录    │
│  voice_audit    │
└─────────────────┘
```

## 数据库模型

### 1. voice_devices 表

存储已注册的语音设备信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| device_id | VARCHAR(255) | 设备唯一标识符（唯一） |
| platform | VARCHAR(50) | 设备平台（xiaogpt, xiaoai 等） |
| owner_user_id | UUID | 设备所有者用户ID（外键） |
| device_name | VARCHAR(255) | 设备名称 |
| metadata | JSONB | 设备元数据 |
| is_active | BOOLEAN | 设备是否激活 |
| last_active_at | TIMESTAMP | 最后活跃时间 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 2. voice_audit 表

记录所有语音请求和响应，用于审计和分析。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| device_id | VARCHAR(255) | 发起请求的设备ID |
| platform | VARCHAR(50) | 设备平台 |
| user_id | UUID | 关联的用户ID（外键） |
| request_id | VARCHAR(255) | 请求唯一标识符 |
| intent | VARCHAR(100) | 语音意图 |
| slots | JSONB | 意图槽位数据 |
| raw_payload | JSONB | 原始请求数据 |
| reply | TEXT | 系统回复内容 |
| action | VARCHAR(50) | 执行的操作类型 |
| success | BOOLEAN | 请求是否成功处理 |
| error_message | TEXT | 错误信息（如果失败） |
| processing_time_ms | INTEGER | 处理时间（毫秒） |
| created_at | TIMESTAMP | 创建时间 |

## 环境变量配置

在 `.env` 文件中添加以下配置：

```bash
# 语音集成配置
# VOICE_API_TOKEN: 可选的 Bearer Token，用于验证 webhook 请求
# 如果不设置，webhook 端点将是开放的（生产环境不推荐）
VOICE_API_TOKEN=your_voice_api_token_here

# ALZ_BASE_URL: 后端 API 的基础 URL（用于语音适配器配置）
# 本地开发示例: http://localhost:3001
# 生产环境示例: https://api.yourdomain.com
ALZ_BASE_URL=http://localhost:3001
```

## 安装和启动

### 1. 运行数据库迁移

执行以下 SQL 脚本创建语音相关表：

```bash
psql -d alzheimer_prevention -f database/migrations/20260114_create_voice_tables.sql
```

或者，如果使用开发环境的自动同步功能：

```bash
# 在开发环境中，模型会自动同步到数据库
NODE_ENV=development npm run dev
```

### 2. 启动后端服务

```bash
cd backend
npm install
npm run dev
```

服务将在 `http://localhost:3001` 启动。

### 3. 验证服务状态

```bash
curl http://localhost:3001/api/voice/health
```

预期响应：
```json
{
  "success": true,
  "service": "Voice Integration Service",
  "status": "healthy",
  "timestamp": "2026-01-14T06:00:00.000Z"
}
```

## API 端点

### 1. Webhook 端点

**POST /api/voice/webhook**

接收外部语音 webhook 请求。

**请求头：**
```
Content-Type: application/json
Authorization: Bearer YOUR_VOICE_API_TOKEN  (如果配置了 VOICE_API_TOKEN)
```

**请求体：**
```json
{
  "device_id": "test-device-001",
  "platform": "xiaogpt",
  "user_id": "用户UUID（可选）",
  "intent": "confirm_medication",
  "slots": {
    "medication": "阿司匹林"
  },
  "request_id": "req-12345（可选）",
  "raw_payload": {}
}
```

**响应示例（成功）：**
```json
{
  "success": true,
  "reply": "好的，已记录您服用了阿司匹林。记得按时服药对健康很重要哦！",
  "action": "medication_confirmed",
  "data": {
    "userId": "user-uuid",
    "medication": "阿司匹林",
    "confirmedAt": "2026-01-14T06:00:00.000Z"
  }
}
```

**响应示例（失败）：**
```json
{
  "success": false,
  "reply": "抱歉，我还不支持该功能",
  "error": "Unsupported intent"
}
```

### 2. 设备注册端点

**POST /api/voice/devices/register**

注册或更新语音设备。

**请求体：**
```json
{
  "device_id": "test-device-001",
  "platform": "xiaogpt",
  "user_id": "用户UUID（可选）",
  "device_name": "我的小米音箱（可选）",
  "metadata": {
    "model": "xiaomi-speaker-v2"
  }
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "device-uuid",
    "deviceId": "test-device-001",
    "platform": "xiaogpt",
    "ownerUserId": "user-uuid",
    "deviceName": "我的小米音箱",
    "isActive": true,
    "createdAt": "2026-01-14T06:00:00.000Z",
    "updatedAt": "2026-01-14T06:00:00.000Z"
  },
  "message": "设备注册成功"
}
```

### 3. 审计日志查询

**GET /api/voice/devices/:deviceId/audit**

获取设备的审计日志。

**查询参数：**
- `limit`: 返回记录数量（默认：50）

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "audit-uuid",
      "deviceId": "test-device-001",
      "platform": "xiaogpt",
      "intent": "confirm_medication",
      "slots": { "medication": "阿司匹林" },
      "reply": "好的，已记录您服用了阿司匹林...",
      "success": true,
      "processingTimeMs": 45,
      "createdAt": "2026-01-14T06:00:00.000Z"
    }
  ],
  "count": 1
}
```

## 支持的意图（Intents）

### 1. confirm_medication - 服药确认

**用途：** 用户通过语音确认已服药

**必需槽位：**
- `medication`: 药物名称

**示例：**
```json
{
  "intent": "confirm_medication",
  "slots": {
    "medication": "阿司匹林"
  }
}
```

**回复示例：**
"好的，已记录您服用了阿司匹林。记得按时服药对健康很重要哦！"

### 2. query_reminders - 查询提醒

**用途：** 查询今天的提醒事项

**槽位：** 无必需槽位

**示例：**
```json
{
  "intent": "query_reminders",
  "slots": {}
}
```

**回复示例：**
"您今天有以下提醒：上午9点服用阿司匹林，下午2点进行认知训练，晚上8点服用降压药。"

### 3. emergency_call - 紧急呼叫

**用途：** 触发紧急告警

**可选槽位：**
- `type`: 紧急类型（general, medical, fall 等）

**示例：**
```json
{
  "intent": "emergency_call",
  "slots": {
    "type": "medical"
  }
}
```

**回复示例：**
"我已收到您的紧急呼叫，正在通知您的紧急联系人。请保持冷静，帮助很快就会到来。"

## 测试示例

### 使用 curl 测试

#### 1. 测试健康检查

```bash
curl -X GET http://localhost:3001/api/voice/health
```

#### 2. 注册设备

```bash
curl -X POST http://localhost:3001/api/voice/devices/register \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your_voice_api_token_here' \
  -d '{
    "device_id": "test-device-001",
    "platform": "xiaogpt",
    "device_name": "测试音箱"
  }'
```

#### 3. 测试服药确认（不需要用户ID的基础测试）

```bash
curl -X POST http://localhost:3001/api/voice/webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "device_id": "test-device-001",
    "platform": "xiaogpt",
    "intent": "confirm_medication",
    "slots": {
      "medication": "阿司匹林"
    }
  }'
```

#### 4. 测试查询提醒（需要用户ID）

首先，获取一个有效的用户ID（从数据库或注册接口）：

```bash
# 示例：使用现有用户ID
USER_ID="your-user-uuid-here"

curl -X POST http://localhost:3001/api/voice/webhook \
  -H 'Content-Type: application/json' \
  -d "{
    \"device_id\": \"test-device-001\",
    \"platform\": \"xiaogpt\",
    \"user_id\": \"$USER_ID\",
    \"intent\": \"query_reminders\"
  }"
```

#### 5. 测试紧急呼叫

```bash
curl -X POST http://localhost:3001/api/voice/webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "device_id": "test-device-001",
    "platform": "xiaogpt",
    "intent": "emergency_call",
    "slots": {
      "type": "medical"
    }
  }'
```

#### 6. 查询审计日志

```bash
curl -X GET "http://localhost:3001/api/voice/devices/test-device-001/audit?limit=10"
```

## 安全考虑

### 1. API Token 验证

- **生产环境务必配置 `VOICE_API_TOKEN`**
- 使用强随机字符串作为 token（建议 32 字符以上）
- 定期轮换 API token
- 不要在代码中硬编码 token

生成安全的 token：
```bash
# 使用 openssl 生成随机 token
openssl rand -base64 32
```

### 2. HTTPS 配置

生产环境中，必须使用 HTTPS：
- 配置 SSL 证书
- 强制重定向 HTTP 到 HTTPS
- 使用 HSTS 头

### 3. 速率限制

建议添加速率限制中间件（未在 MVP 中实现）：
```javascript
// 示例：使用 express-rate-limit
const rateLimit = require('express-rate-limit');

const voiceApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制 100 个请求
  message: '请求过于频繁，请稍后再试'
});

app.use('/api/voice/webhook', voiceApiLimiter);
```

### 4. 输入验证

- 所有输入都会进行基本验证
- 防止 SQL 注入（使用 Sequelize ORM）
- 防止 XSS 攻击（输入清理）

## 故障排查

### 问题 1: Webhook 返回 401 Unauthorized

**原因：** API Token 不匹配或缺失

**解决方案：**
1. 检查环境变量 `VOICE_API_TOKEN` 是否正确设置
2. 确认请求头包含正确的 `Authorization: Bearer <token>`
3. 如果测试环境不需要验证，可以临时不设置 `VOICE_API_TOKEN`

### 问题 2: 数据库表不存在

**原因：** 未运行数据库迁移

**解决方案：**
```bash
psql -d alzheimer_prevention -f database/migrations/20260114_create_voice_tables.sql
```

### 问题 3: 找不到用户

**原因：** 提供的 `user_id` 在数据库中不存在

**解决方案：**
1. 先创建测试用户或使用现有用户 ID
2. 某些意图（如 confirm_medication）需要有效的用户 ID

### 问题 4: 意图不支持

**原因：** 使用了未实现的意图

**解决方案：**
当前仅支持：
- `confirm_medication`
- `query_reminders`
- `emergency_call`

## 扩展功能（后续版本）

当前实现的是最小可用 MVP，以下功能可在后续版本中添加：

### 1. 设备账号绑定流程
- OAuth 2.0 认证流程
- 账号关联界面
- 设备授权管理

### 2. 更复杂的 NLU 处理
- 多轮对话支持
- 上下文管理
- 槽位填充策略

### 3. 通知适配器
- 短信通知
- 电话通知
- Push 通知
- 微信通知

### 4. 多语言 TTS 支持
- 语音合成
- 多语言支持
- 语音个性化

### 5. Reminder/Medication 模型
- 创建专门的提醒模型
- 服药记录模型
- 提醒调度系统

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../LICENSE) 文件了解详情
