# Voice Integration for Alzheimer Prevention System

## 概述 (Overview)

本文档描述如何为阿兹海默预防系统集成语音/智能音箱功能，支持 xiaogpt、Amazon Alexa、Google Home 等语音平台。

This document describes how to integrate voice/smart speaker capabilities into the Alzheimer Prevention System, supporting platforms like xiaogpt, Amazon Alexa, and Google Home.

## 功能特性 (Features)

- **设备注册**: 注册和管理语音设备（xiaogpt、智能音箱等）
- **语音意图处理**: 处理用户语音指令
- **审计日志**: 记录所有语音交互
- **可选鉴权**: 通过 API Token 保护 webhook 端点

Supported intents (最小实现):
- `confirm_medication`: 确认服药
- `query_reminders`: 查询提醒事项
- `emergency_call`: 紧急呼叫

## 环境配置 (Configuration)

### 1. 环境变量 (Environment Variables)

在 `.env` 文件中添加以下配置:

```bash
# Voice Integration
VOICE_API_TOKEN=your_secure_token_here
ALZ_BASE_URL=http://localhost:3001
```

**说明:**
- `VOICE_API_TOKEN`: (可选) API 鉴权令牌，用于保护 webhook 端点。如未设置，则不进行鉴权。
- `ALZ_BASE_URL`: 系统基础 URL，用于外部服务回调

### 2. 数据库迁移 (Database Migration)

运行迁移脚本创建所需的表:

```bash
# 方式 1: 使用 psql 直接运行
psql -U postgres -d alzheimer_prevention -f database/migrations/20260114_create_voice_tables.sql

# 方式 2: 使用 docker-compose (如果使用容器)
docker-compose exec postgres psql -U postgres -d alzheimer_prevention -f /migrations/20260114_create_voice_tables.sql
```

**创建的表:**
- `voice_devices`: 存储注册的语音设备信息
- `voice_audit`: 记录所有语音交互的审计日志

## API 端点 (API Endpoints)

### 1. Webhook 接收端点

**POST** `/api/voice/webhook`

接收来自语音平台的 webhook 调用。

**Headers:**
```
Content-Type: application/json
X-Voice-Token: your_voice_api_token_here  (可选，如果配置了 VOICE_API_TOKEN)
```

**Request Body:**
```json
{
  "intent": "confirm_medication",
  "deviceId": "xiaogpt-device-001",
  "userId": "user-uuid-here",
  "parameters": {
    "medicationName": "阿司匹林"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "药物提醒已确认。请确保按时服药。",
  "data": {
    "confirmed": true,
    "timestamp": "2026-01-14T06:00:00.000Z"
  }
}
```

### 2. 设备注册端点

**POST** `/api/voice/devices/register`

注册或更新语音设备。

**Request Body:**
```json
{
  "deviceId": "xiaogpt-device-001",
  "deviceType": "xiaogpt",
  "deviceName": "客厅小爱音箱",
  "userId": "user-uuid-here",
  "apiVersion": "1.0",
  "metadata": {
    "location": "living_room"
  }
}
```

### 3. 查询设备信息

**GET** `/api/voice/devices/:deviceId`

### 4. 查询审计日志

**GET** `/api/voice/devices/:deviceId/audits?limit=50`

### 5. 健康检查

**GET** `/api/voice/health`

## 测试示例 (Testing Examples)

### 1. 测试 Webhook (无鉴权)

如果未配置 `VOICE_API_TOKEN`:

```bash
curl -X POST http://localhost:3001/api/voice/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "query_reminders",
    "deviceId": "test-device-001",
    "userId": "test-user-uuid"
  }'
```

### 2. 测试 Webhook (带鉴权)

如果配置了 `VOICE_API_TOKEN`:

```bash
curl -X POST http://localhost:3001/api/voice/webhook \
  -H "Content-Type: application/json" \
  -H "X-Voice-Token: your_voice_api_token_here" \
  -d '{
    "intent": "confirm_medication",
    "deviceId": "xiaogpt-001",
    "userId": "user-uuid-here",
    "parameters": {
      "medicationName": "阿司匹林"
    }
  }'
```

### 3. 注册设备

```bash
curl -X POST http://localhost:3001/api/voice/devices/register \
  -H "Content-Type: application/json" \
  -H "X-Voice-Token: your_voice_api_token_here" \
  -d '{
    "deviceId": "xiaogpt-001",
    "deviceType": "xiaogpt",
    "deviceName": "客厅小爱音箱",
    "userId": "user-uuid-here"
  }'
```

### 4. 查询设备信息

```bash
curl http://localhost:3001/api/voice/devices/xiaogpt-001 \
  -H "X-Voice-Token: your_voice_api_token_here"
```

### 5. 查询审计日志

```bash
curl http://localhost:3001/api/voice/devices/xiaogpt-001/audits?limit=10 \
  -H "X-Voice-Token: your_voice_api_token_here"
```

### 6. 健康检查

```bash
curl http://localhost:3001/api/voice/health
```

## 支持的意图 (Supported Intents)

### 1. confirm_medication (确认服药)

```json
{
  "intent": "confirm_medication",
  "deviceId": "xiaogpt-001",
  "userId": "user-uuid",
  "parameters": {
    "medicationName": "阿司匹林"
  }
}
```

### 2. query_reminders (查询提醒)

```json
{
  "intent": "query_reminders",
  "deviceId": "xiaogpt-001",
  "userId": "user-uuid",
  "parameters": {
    "timeRange": "today"
  }
}
```

### 3. emergency_call (紧急呼叫)

```json
{
  "intent": "emergency_call",
  "deviceId": "xiaogpt-001",
  "userId": "user-uuid",
  "parameters": {
    "urgency": "high"
  }
}
```

## 与 xiaogpt 集成 (Integration with xiaogpt)

### 1. 配置 xiaogpt

在 xiaogpt 配置中添加 webhook URL:

```yaml
webhook_url: "http://your-server:3001/api/voice/webhook"
webhook_token: "your_voice_api_token_here"
```

### 2. 设置语音指令

配置 xiaogpt 识别以下指令:
- "我已经吃药了" → `confirm_medication`
- "今天有什么提醒" → `query_reminders`
- "帮我呼叫紧急联系人" → `emergency_call`

## 注意事项 (Important Notes)

### TODO: 模型字段映射

当前实现中，以下模型的字段映射需要根据实际情况调整:

1. **Reminder 模型** (在 `VoiceService.ts` 中):
   - 字段名称可能不同 (如 `reminderTime` vs `time`, `reminderText` vs `message`)
   - 需要确认实际的 Reminder 模型定义

2. **Medication 模型** (在 `VoiceService.ts` 中):
   - 字段名称可能不同 (如 `medicationName` vs `name`, `dosage`, `schedule`)
   - 需要确认实际的 Medication 模型定义

3. **User 关联**:
   - 需要确认 User 模型与 Reminder/Medication 的关联关系

请查看 `backend/src/services/VoiceService.ts` 中的 TODO 注释，根据实际模型调整实现。

### 安全建议

1. **生产环境必须配置 `VOICE_API_TOKEN`**
2. 使用 HTTPS 传输数据
3. 定期轮换 API Token
4. 监控审计日志，检测异常访问

### 扩展性

当前为 MVP (最小可用产品) 实现，后续可扩展:
- 添加更多意图类型
- 支持多语言
- 添加语音识别准确度跟踪
- 集成更多语音平台 (Alexa, Google Home)
- 实现用户偏好设置

## 故障排查 (Troubleshooting)

### 1. Webhook 返回 401 Unauthorized

检查 `X-Voice-Token` header 是否正确设置，或在开发环境中暂时移除 `VOICE_API_TOKEN` 配置。

### 2. Webhook 返回 400 Bad Request

检查请求 body 是否包含必需的 `intent` 字段。

### 3. 数据库连接错误

确保已运行数据库迁移脚本，创建了 `voice_devices` 和 `voice_audit` 表。

### 4. 设备注册失败

检查数据库连接，确保 `users` 表存在（如果提供了 `userId`）。

## 许可证 (License)

本功能遵循项目主许可证 MIT。
