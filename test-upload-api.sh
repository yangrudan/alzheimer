#!/bin/bash

# 智能音响对话上传API测试脚本
# 用于手动测试API端点是否正常工作

echo "======================================"
echo "智能音响对话上传API测试"
echo "======================================"
echo ""

# API配置
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
API_ENDPOINT="$API_BASE_URL/api/conversations/upload"

echo "API端点: $API_ENDPOINT"
echo ""

# 测试数据
TEST_DATA='{
  "userId": "test-user-manual-001",
  "title": "手动测试对话",
  "type": "daily",
  "messages": [
    {
      "sender": "assistant",
      "content": "你好！今天感觉怎么样？",
      "timestamp": "2024-01-15T10:00:00Z"
    },
    {
      "sender": "user",
      "content": "我今天感觉很好，天气不错。",
      "timestamp": "2024-01-15T10:00:05Z",
      "responseTime": 5
    },
    {
      "sender": "assistant",
      "content": "太好了！有什么计划吗？",
      "timestamp": "2024-01-15T10:00:10Z"
    },
    {
      "sender": "user",
      "content": "我打算去公园散步，然后回来看看书。",
      "timestamp": "2024-01-15T10:00:18Z",
      "responseTime": 8
    }
  ],
  "metadata": {
    "deviceId": "test-device-001",
    "deviceType": "测试音箱",
    "sessionId": "test-session-001"
  }
}'

echo "测试1: 上传有效的对话记录"
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP状态码: $HTTP_CODE"
echo "响应内容:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ 测试通过 - 成功上传对话记录"
else
  echo "❌ 测试失败 - HTTP状态码应为201，实际为$HTTP_CODE"
fi
echo ""

# 测试2: 缺少必填字段
echo "测试2: 缺少必填字段（userId）"
echo "--------------------------------------"
INVALID_DATA='{
  "title": "测试对话",
  "messages": [
    {
      "sender": "user",
      "content": "测试消息"
    }
  ]
}'

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$INVALID_DATA")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP状态码: $HTTP_CODE"
echo "响应内容:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ 测试通过 - 正确拒绝缺少必填字段的请求"
else
  echo "❌ 测试失败 - HTTP状态码应为400，实际为$HTTP_CODE"
fi
echo ""

# 测试3: 空消息数组
echo "测试3: 空消息数组"
echo "--------------------------------------"
EMPTY_MESSAGES='{
  "userId": "test-user-001",
  "messages": []
}'

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$EMPTY_MESSAGES")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP状态码: $HTTP_CODE"
echo "响应内容:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ 测试通过 - 正确拒绝空消息数组"
else
  echo "❌ 测试失败 - HTTP状态码应为400，实际为$HTTP_CODE"
fi
echo ""

# 测试4: 健康检查
echo "测试4: API健康检查"
echo "--------------------------------------"
HEALTH_RESPONSE=$(curl -s "$API_BASE_URL/health")
echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
echo ""

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
  echo "✅ API服务正常运行"
else
  echo "⚠️  API服务可能未运行"
fi
echo ""

echo "======================================"
echo "测试完成"
echo "======================================"
