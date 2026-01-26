# MoCA格式对话上传示例

## 格式说明

API现在支持两种格式的对话上传：

### 1. 标准格式（原有格式）
```json
{
  "userId": "user-123",
  "title": "对话标题",
  "type": "daily",
  "messages": [
    {
      "sender": "user",
      "content": "用户消息",
      "timestamp": "2026-01-23T19:12:33Z"
    },
    {
      "sender": "assistant",
      "content": "助手回复",
      "timestamp": "2026-01-23T19:12:35Z"
    }
  ]
}
```

### 2. MoCA认知评估格式（新增支持）
```json
{
  "userId": "user-123",
  "session_start_time": "2026-01-23 19:12:13",
  "session_end_time": "2026-01-23 19:15:31",
  "test_type": "MoCA阿兹海默症认知评估",
  "trigger_keyword": "健康每一天",
  "conversation_history": [
    {
      "timestamp": "2026-01-23 19:12:33",
      "user_query": "开始MoCA认知测试，请简短介绍并开始第一个问题。",
      "bot_response": "好的，MoCA（蒙特利尔认知评估）是一个快速筛查轻度认知障碍的工具..."
    }
  ],
  "total_exchanges": 4,
  "assessment_note": "专业评估结果和得分应由医疗专业人员根据对话内容进行评定。"
}
```

## 使用示例

### 上传MoCA格式的对话

```bash
curl -X POST http://localhost:3001/api/conversations/upload \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "session_start_time": "2026-01-23 19:12:13",
    "session_end_time": "2026-01-23 19:15:31",
    "test_type": "MoCA阿兹海默症认知评估",
    "trigger_keyword": "健康每一天",
    "conversation_history": [
      {
        "timestamp": "2026-01-23 19:12:33",
        "user_query": "开始MoCA认知测试，请简短介绍并开始第一个问题。",
        "bot_response": "好的，MoCA（蒙特利尔认知评估）是一个快速筛查轻度认知障碍的工具，包含多个认知领域测试。现在开始第一个问题：请重复以下三个词："苹果、书、椅子"。记住它们，稍后会问你。"
      },
      {
        "timestamp": "2026-01-23 19:13:26",
        "user_query": "苹果书椅子",
        "bot_response": "很好，您正确重复了"苹果、书、椅子"。这是MoCA认知测试的第一个环节，用于评估短期记忆能力。接下来我们将进行第二个问题：请说出今天是几月几日、星期几和年份。"
      },
      {
        "timestamp": "2026-01-23 19:13:47",
        "user_query": "今天是一月二十三号星期五",
        "bot_response": "您说的"今天是一月二十三号星期五"是正确的。接下来是第三个问题：请记住以下三个词，并在稍后重复："红色、椅子、书"。现在继续下一个测试环节。"
      },
      {
        "timestamp": "2026-01-23 19:14:18",
        "user_query": "结束本人测试",
        "bot_response": "感谢您的参与。如果您需要进一步的帮助或有其他问题，请随时告诉我。祝您生活愉快！"
      }
    ],
    "total_exchanges": 4,
    "assessment_note": "专业评估结果和得分应由医疗专业人员根据对话内容进行评定。此记录仅供参考，不作为诊断依据。"
  }'
```

### Python示例

```python
import requests
import json

# 读取本地MoCA格式的JSON文件
with open('moca_assessment.json', 'r', encoding='utf-8') as f:
    moca_data = json.load(f)

# 添加userId（必填）
moca_data['userId'] = 'user-123'

# 上传到API
response = requests.post(
    'http://localhost:3001/api/conversations/upload',
    json=moca_data,
    headers={'Content-Type': 'application/json'}
)

result = response.json()
print(json.dumps(result, indent=2, ensure_ascii=False))
```

### JavaScript示例

```javascript
const fs = require('fs');
const axios = require('axios');

// 读取本地MoCA格式的JSON文件
const mocaData = JSON.parse(
  fs.readFileSync('moca_assessment.json', 'utf-8')
);

// 添加userId（必填）
mocaData.userId = 'user-123';

// 上传到API
axios.post('http://localhost:3001/api/conversations/upload', mocaData)
  .then(response => {
    console.log('上传成功:', JSON.stringify(response.data, null, 2));
  })
  .catch(error => {
    console.error('上传失败:', error.response?.data || error.message);
  });
```

## 响应格式

无论使用哪种输入格式，API都会返回统一的响应格式：

```json
{
  "success": true,
  "message": "对话记录上传成功并已完成分析",
  "format": "moca",
  "data": {
    "conversation": {
      "id": "conv-uuid-123",
      "userId": "user-123",
      "title": "MoCA阿兹海默症认知评估",
      "type": "assessment",
      "duration": 3,
      "moodScore": 7,
      "engagementScore": 8,
      "cognitiveScore": 75,
      "createdAt": "2026-01-23T19:15:31Z"
    },
    "analysis": {
      "success": true,
      "conversationId": "conv-uuid-123",
      "cognitiveMetrics": {
        "totalMessages": 8,
        "totalWords": 150,
        "avgResponseTime": 0,
        "vocabularyComplexity": 7.2,
        "emotionalTone": {
          "positive": 3,
          "neutral": 4,
          "negative": 1
        },
        "overallScore": 75
      },
      "domainScores": {
        "memory": 8,
        "attention": 7,
        "executive": 7,
        "language": 8,
        "orientation": 8,
        "visuospatial": 6
      },
      "recommendations": [
        "认知状态良好，继续保持当前活动水平"
      ]
    },
    "messageCount": 8,
    "metadata": {
      "sessionStartTime": "2026-01-23 19:12:13",
      "sessionEndTime": "2026-01-23 19:15:31",
      "testType": "MoCA阿兹海默症认知评估",
      "totalExchanges": 4,
      "triggerKeyword": "健康每一天",
      "assessmentNote": "专业评估结果和得分应由医疗专业人员根据对话内容进行评定。此记录仅供参考，不作为诊断依据。"
    }
  }
}
```

## 格式转换说明

当上传MoCA格式时，系统会自动进行以下转换：

1. **conversation_history** → **messages**
   - `user_query` → `sender: "user"`, `content: user_query`
   - `bot_response` → `sender: "assistant"`, `content: bot_response`

2. **元数据保留**
   - `session_start_time`, `session_end_time`, `test_type`等字段会保存在`metadata`中

3. **类型自动设置**
   - `type`自动设置为`"assessment"`（认知评估类型）

4. **标题生成**
   - 使用`test_type`作为对话标题

## 注意事项

1. **userId必填**：无论使用哪种格式，都必须提供`userId`字段
2. **时间戳格式**：支持多种时间格式，系统会自动解析
3. **保留原始数据**：原始的MoCA格式数据会完整保存在`metadata`中，便于后续追溯
4. **自动分析**：上传后会自动触发认知分析，生成各项评分和建议

## 错误处理

如果上传的数据格式不正确，API会返回相应的错误信息：

```json
{
  "success": false,
  "error": "不支持的数据格式。支持的格式：1) 标准格式（包含messages数组）2) MoCA格式（包含conversation_history数组）"
}
```

确保JSON文件符合以上两种格式之一即可成功上传。
