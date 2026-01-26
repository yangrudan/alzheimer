# 智能音响对话上传API文档

## 概述

这个API允许智能音响设备上传用户的对话记录到阿兹海默预防系统进行认知分析。系统会自动分析对话内容，计算认知指标，并提供个性化建议。

## 端点信息

**URL**: `POST /api/conversations/upload`

**认证**: 可选（建议使用API密钥或JWT令牌）

**Content-Type**: `application/json`

## 请求格式

### 请求体参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `userId` | string | 是 | 用户唯一标识符 |
| `title` | string | 否 | 对话标题，默认为"智能音响对话" |
| `type` | string | 否 | 对话类型：`daily`（日常）、`assessment`（评估）、`therapeutic`（治疗），默认为`daily` |
| `messages` | array | 是 | 对话消息数组，至少包含一条消息 |
| `metadata` | object | 否 | 元数据信息，如设备ID、设备类型等 |

### 消息对象结构

每条消息应包含以下字段：

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `sender` | string | 是 | 发送者：`user`（用户）或 `assistant`（智能助手） |
| `content` | string | 是 | 消息内容 |
| `timestamp` | string | 否 | ISO 8601格式的时间戳 |
| `responseTime` | number | 否 | 响应时间（秒），用于认知分析 |

### 元数据对象（可选）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `deviceId` | string | 设备唯一标识符 |
| `deviceType` | string | 设备类型/型号 |
| `sessionId` | string | 对话会话ID |
| `location` | string | 地理位置信息 |
| 其他自定义字段 | any | 可添加任意自定义字段 |

## 请求示例

### cURL 示例

```bash
curl -X POST https://your-domain.com/api/conversations/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "早晨对话",
    "type": "daily",
    "messages": [
      {
        "sender": "assistant",
        "content": "早上好！今天感觉怎么样？",
        "timestamp": "2024-01-15T08:00:00Z"
      },
      {
        "sender": "user",
        "content": "早上好，我感觉很好。昨晚睡得不错。",
        "timestamp": "2024-01-15T08:00:05Z",
        "responseTime": 5
      },
      {
        "sender": "assistant",
        "content": "太好了！有什么早餐计划吗？",
        "timestamp": "2024-01-15T08:00:10Z"
      },
      {
        "sender": "user",
        "content": "我想吃点燕麦粥和水果。",
        "timestamp": "2024-01-15T08:00:15Z",
        "responseTime": 5
      }
    ],
    "metadata": {
      "deviceId": "xiaomi-speaker-001",
      "deviceType": "小米小爱音箱",
      "sessionId": "session-20240115-001"
    }
  }'
```

### JavaScript 示例

```javascript
const uploadConversation = async (conversationData) => {
  const response = await fetch('https://your-domain.com/api/conversations/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_TOKEN'
    },
    body: JSON.stringify(conversationData)
  });

  const result = await response.json();
  return result;
};

// 使用示例
const conversationData = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  title: '早晨对话',
  type: 'daily',
  messages: [
    {
      sender: 'assistant',
      content: '早上好！今天感觉怎么样？',
      timestamp: new Date().toISOString()
    },
    {
      sender: 'user',
      content: '早上好，我感觉很好。',
      timestamp: new Date().toISOString(),
      responseTime: 5
    }
  ],
  metadata: {
    deviceId: 'xiaomi-speaker-001',
    deviceType: '小米小爱音箱'
  }
};

uploadConversation(conversationData)
  .then(result => console.log('上传成功:', result))
  .catch(error => console.error('上传失败:', error));
```

### Python 示例

```python
import requests
import json
from datetime import datetime

def upload_conversation(conversation_data, api_token):
    url = 'https://your-domain.com/api/conversations/upload'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_token}'
    }
    
    response = requests.post(url, headers=headers, json=conversation_data)
    return response.json()

# 使用示例
conversation_data = {
    'userId': '550e8400-e29b-41d4-a716-446655440000',
    'title': '早晨对话',
    'type': 'daily',
    'messages': [
        {
            'sender': 'assistant',
            'content': '早上好！今天感觉怎么样？',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        },
        {
            'sender': 'user',
            'content': '早上好，我感觉很好。',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'responseTime': 5
        }
    ],
    'metadata': {
        'deviceId': 'xiaomi-speaker-001',
        'deviceType': '小米小爱音箱'
    }
}

result = upload_conversation(conversation_data, 'YOUR_API_TOKEN')
print('上传结果:', result)
```

## 响应格式

### 成功响应（HTTP 201）

```json
{
  "success": true,
  "message": "对话记录上传成功并已完成分析",
  "data": {
    "conversation": {
      "id": "conv-uuid-123",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "早晨对话",
      "type": "daily",
      "duration": 15,
      "moodScore": 7,
      "engagementScore": 8,
      "cognitiveScore": 75,
      "createdAt": "2024-01-15T08:00:00Z"
    },
    "analysis": {
      "success": true,
      "conversationId": "conv-uuid-123",
      "cognitiveMetrics": {
        "totalMessages": 4,
        "totalWords": 45,
        "avgResponseTime": 5,
        "vocabularyComplexity": 6.5,
        "emotionalTone": {
          "positive": 2,
          "neutral": 2,
          "negative": 0
        },
        "coherenceScores": [7, 8],
        "memoryReferences": 1,
        "overallScore": 75,
        "avgCoherence": 7.5
      },
      "domainScores": {
        "memory": 7,
        "attention": 8,
        "executive": 7,
        "language": 8,
        "orientation": 7,
        "visuospatial": 7
      },
      "recommendations": [
        "认知状态良好，继续保持当前活动水平"
      ]
    },
    "messageCount": 4,
    "metadata": {
      "deviceId": "xiaomi-speaker-001",
      "deviceType": "小米小爱音箱",
      "sessionId": "session-20240115-001"
    }
  }
}
```

### 错误响应

#### 缺少必填字段（HTTP 400）

```json
{
  "success": false,
  "error": "用户ID是必填项"
}
```

#### 消息数组为空（HTTP 400）

```json
{
  "success": false,
  "error": "对话记录不能为空"
}
```

#### 消息格式不正确（HTTP 400）

```json
{
  "success": false,
  "error": "消息格式不正确，每条消息必须包含sender和content字段，sender必须为user或assistant"
}
```

#### 用户不存在（HTTP 500）

```json
{
  "success": false,
  "error": "User not found"
}
```

#### 服务器错误（HTTP 500）

```json
{
  "success": false,
  "error": "上传对话记录时发生错误"
}
```

## 认知分析说明

### 分析指标

系统会自动分析以下认知指标：

1. **词汇复杂度** - 词汇多样性和丰富度（1-10分）
2. **响应时间** - 思考和反应速度（秒）
3. **情感分析** - 情绪状态识别（积极/中性/消极）
4. **连贯性评分** - 逻辑和结构连贯性（1-10分）
5. **记忆引用** - 对过去事件的回忆频率

### 认知领域评分

- **记忆** (Memory) - 记忆力和回忆能力
- **注意力** (Attention) - 专注力和注意力持续时间
- **执行功能** (Executive) - 规划和决策能力
- **语言** (Language) - 语言表达和理解能力
- **定向力** (Orientation) - 时间和空间定向
- **视空间** (Visuospatial) - 空间感知能力

### 整体认知分数

综合评分范围：1-100分

- **优秀** (80-100分) - 认知功能良好
- **良好** (60-79分) - 认知功能正常
- **一般** (40-59分) - 轻度认知下降
- **较差** (0-39分) - 需要关注

## 最佳实践

### 1. 数据质量

- 确保消息内容准确完整
- 提供准确的时间戳以便分析对话节奏
- 包含响应时间信息以提高分析准确性

### 2. 隐私保护

- 不要在对话内容中包含敏感个人信息（如身份证号、银行账号等）
- 使用加密传输（HTTPS）
- 定期更新API令牌

### 3. 错误处理

- 实现重试机制处理网络错误
- 记录上传失败的对话以便后续处理
- 验证响应状态码并适当处理错误

### 4. 性能优化

- 批量上传多个对话时建议使用队列
- 避免上传过长的对话（建议单次对话不超过100条消息）
- 控制上传频率，避免过于频繁的API调用

## 使用限制

- 单次请求最大消息数：100条
- 单条消息最大长度：5000字符
- API调用频率限制：100次/分钟（根据实际配置可能不同）
- 请求体最大大小：1MB

## 技术支持

如有问题或建议，请联系：

- Email: support@alzheimer-prevention.com
- GitHub Issues: https://github.com/your-repo/issues
- 技术文档: https://docs.alzheimer-prevention.com

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 支持智能音响对话上传
- 自动认知分析功能
- 多维度认知评分
