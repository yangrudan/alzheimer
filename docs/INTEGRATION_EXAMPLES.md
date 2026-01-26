# 智能音响集成示例

本文档提供了如何从不同智能音响平台集成对话上传API的示例代码。

## 目录

1. [小米小爱音箱](#小米小爱音箱)
2. [天猫精灵](#天猫精灵)
3. [小度音箱](#小度音箱)
4. [通用集成方案](#通用集成方案)

---

## 小米小爱音箱

### Node.js示例

```javascript
// xiaomi-speaker-integration.js
const axios = require('axios');

class XiaomiSpeakerIntegration {
  constructor(apiBaseUrl, userId) {
    this.apiBaseUrl = apiBaseUrl;
    this.userId = userId;
    this.currentConversation = {
      messages: [],
      startTime: null
    };
  }

  // 开始新对话
  startConversation() {
    this.currentConversation = {
      messages: [],
      startTime: new Date()
    };
  }

  // 添加消息到当前对话
  addMessage(sender, content, responseTime = null) {
    const message = {
      sender: sender, // 'user' or 'assistant'
      content: content,
      timestamp: new Date().toISOString()
    };

    if (responseTime !== null) {
      message.responseTime = responseTime;
    }

    this.currentConversation.messages.push(message);
  }

  // 上传对话到API
  async uploadConversation(title = null) {
    if (this.currentConversation.messages.length === 0) {
      console.log('没有消息可上传');
      return null;
    }

    const conversationData = {
      userId: this.userId,
      title: title || `小爱对话 - ${new Date().toLocaleDateString()}`,
      type: 'daily',
      messages: this.currentConversation.messages,
      metadata: {
        deviceId: this.getDeviceId(),
        deviceType: '小米小爱音箱',
        sessionId: this.generateSessionId(),
        conversationDuration: this.getConversationDuration()
      }
    };

    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/api/conversations/upload`,
        conversationData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('对话上传成功:', response.data);
      
      // 重置当前对话
      this.startConversation();
      
      return response.data;
    } catch (error) {
      console.error('对话上传失败:', error.response?.data || error.message);
      throw error;
    }
  }

  // 获取设备ID（实际应从设备获取）
  getDeviceId() {
    return 'xiaomi-speaker-' + Math.random().toString(36).substr(2, 9);
  }

  // 生成会话ID
  generateSessionId() {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // 计算对话时长（秒）
  getConversationDuration() {
    if (!this.currentConversation.startTime) return 0;
    return Math.floor((new Date() - this.currentConversation.startTime) / 1000);
  }
}

// 使用示例
const integration = new XiaomiSpeakerIntegration('http://localhost:3001', '550e8400-e29b-41d4-a716-446655440000');

// 模拟对话
integration.startConversation();
integration.addMessage('assistant', '早上好！今天感觉怎么样？');
setTimeout(() => {
  integration.addMessage('user', '早上好，我感觉很好。', 5);
}, 1000);

setTimeout(() => {
  integration.addMessage('assistant', '太好了！有什么计划吗？');
}, 2000);

setTimeout(() => {
  integration.addMessage('user', '我打算去公园散步。', 6);
}, 3000);

// 5秒后上传对话
setTimeout(async () => {
  await integration.uploadConversation('早晨问候');
}, 5000);

module.exports = XiaomiSpeakerIntegration;
```

---

## 天猫精灵

### Python示例

```python
# tmall_genie_integration.py
import requests
import json
from datetime import datetime
import time
import uuid

class TmallGenieIntegration:
    def __init__(self, api_base_url, user_id):
        self.api_base_url = api_base_url
        self.user_id = user_id
        self.current_conversation = {
            'messages': [],
            'start_time': None
        }
    
    def start_conversation(self):
        """开始新对话"""
        self.current_conversation = {
            'messages': [],
            'start_time': datetime.utcnow()
        }
    
    def add_message(self, sender, content, response_time=None):
        """添加消息到当前对话"""
        message = {
            'sender': sender,  # 'user' or 'assistant'
            'content': content,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        if response_time is not None:
            message['responseTime'] = response_time
        
        self.current_conversation['messages'].append(message)
    
    def upload_conversation(self, title=None):
        """上传对话到API"""
        if not self.current_conversation['messages']:
            print('没有消息可上传')
            return None
        
        conversation_data = {
            'userId': self.user_id,
            'title': title or f'天猫精灵对话 - {datetime.now().strftime("%Y-%m-%d")}',
            'type': 'daily',
            'messages': self.current_conversation['messages'],
            'metadata': {
                'deviceId': self._get_device_id(),
                'deviceType': '天猫精灵',
                'sessionId': self._generate_session_id(),
                'conversationDuration': self._get_conversation_duration()
            }
        }
        
        try:
            response = requests.post(
                f'{self.api_base_url}/api/conversations/upload',
                json=conversation_data,
                headers={'Content-Type': 'application/json'}
            )
            response.raise_for_status()
            
            result = response.json()
            print('对话上传成功:', json.dumps(result, indent=2, ensure_ascii=False))
            
            # 重置当前对话
            self.start_conversation()
            
            return result
        except requests.exceptions.RequestException as e:
            print(f'对话上传失败: {e}')
            if hasattr(e.response, 'text'):
                print(f'错误详情: {e.response.text}')
            raise
    
    def _get_device_id(self):
        """获取设备ID"""
        return f'tmall-genie-{uuid.uuid4().hex[:8]}'
    
    def _generate_session_id(self):
        """生成会话ID"""
        return f'session-{int(time.time())}-{uuid.uuid4().hex[:8]}'
    
    def _get_conversation_duration(self):
        """计算对话时长（秒）"""
        if not self.current_conversation['start_time']:
            return 0
        delta = datetime.utcnow() - self.current_conversation['start_time']
        return int(delta.total_seconds())

# 使用示例
if __name__ == '__main__':
    integration = TmallGenieIntegration('http://localhost:3001', '550e8400-e29b-41d4-a716-446655440000')
    
    # 模拟对话
    integration.start_conversation()
    integration.add_message('assistant', '下午好！今天做了什么有趣的事吗？')
    time.sleep(1)
    integration.add_message('user', '下午好！我上午去了公园散步。', 8)
    time.sleep(1)
    integration.add_message('assistant', '公园散步是个很好的习惯。')
    time.sleep(1)
    integration.add_message('user', '是的，我每周去三次左右。', 6)
    
    # 上传对话
    integration.upload_conversation('下午聊天')
```

---

## 小度音箱

### Java示例

```java
// BaiduSpeakerIntegration.java
import com.google.gson.Gson;
import okhttp3.*;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class BaiduSpeakerIntegration {
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    
    private String apiBaseUrl;
    private String userId;
    private OkHttpClient client;
    private Gson gson;
    
    private List<Message> currentMessages;
    private Instant conversationStartTime;
    
    public BaiduSpeakerIntegration(String apiBaseUrl, String userId) {
        this.apiBaseUrl = apiBaseUrl;
        this.userId = userId;
        this.client = new OkHttpClient();
        this.gson = new Gson();
        this.currentMessages = new ArrayList<>();
    }
    
    public void startConversation() {
        this.currentMessages = new ArrayList<>();
        this.conversationStartTime = Instant.now();
    }
    
    public void addMessage(String sender, String content, Integer responseTime) {
        Message message = new Message();
        message.sender = sender;
        message.content = content;
        message.timestamp = Instant.now().toString();
        message.responseTime = responseTime;
        
        currentMessages.add(message);
    }
    
    public String uploadConversation(String title) throws IOException {
        if (currentMessages.isEmpty()) {
            System.out.println("没有消息可上传");
            return null;
        }
        
        ConversationUpload upload = new ConversationUpload();
        upload.userId = this.userId;
        upload.title = title != null ? title : "小度对话 - " + Instant.now().toString();
        upload.type = "daily";
        upload.messages = this.currentMessages;
        
        // 设置元数据
        upload.metadata = new HashMap<>();
        upload.metadata.put("deviceId", getDeviceId());
        upload.metadata.put("deviceType", "小度音箱");
        upload.metadata.put("sessionId", generateSessionId());
        upload.metadata.put("conversationDuration", getConversationDuration());
        
        String json = gson.toJson(upload);
        
        RequestBody body = RequestBody.create(json, JSON);
        Request request = new Request.Builder()
                .url(apiBaseUrl + "/api/conversations/upload")
                .post(body)
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            
            if (response.isSuccessful()) {
                System.out.println("对话上传成功: " + responseBody);
                startConversation(); // 重置对话
                return responseBody;
            } else {
                System.err.println("对话上传失败: " + responseBody);
                throw new IOException("上传失败: HTTP " + response.code());
            }
        }
    }
    
    private String getDeviceId() {
        return "baidu-speaker-" + UUID.randomUUID().toString().substring(0, 8);
    }
    
    private String generateSessionId() {
        return "session-" + System.currentTimeMillis() + "-" + 
               UUID.randomUUID().toString().substring(0, 8);
    }
    
    private long getConversationDuration() {
        if (conversationStartTime == null) return 0;
        return Instant.now().getEpochSecond() - conversationStartTime.getEpochSecond();
    }
    
    // 内部类
    static class Message {
        String sender;
        String content;
        String timestamp;
        Integer responseTime;
    }
    
    static class ConversationUpload {
        String userId;
        String title;
        String type;
        List<Message> messages;
        Map<String, Object> metadata;
    }
    
    // 使用示例
    public static void main(String[] args) {
        try {
            BaiduSpeakerIntegration integration = 
                new BaiduSpeakerIntegration("http://localhost:3001", "550e8400-e29b-41d4-a716-446655440000");
            
            integration.startConversation();
            integration.addMessage("assistant", "你好！今天感觉怎么样？", null);
            Thread.sleep(1000);
            integration.addMessage("user", "你好，我感觉很好。", 5);
            Thread.sleep(1000);
            integration.addMessage("assistant", "太好了！", null);
            Thread.sleep(1000);
            integration.addMessage("user", "谢谢关心。", 4);
            
            integration.uploadConversation("测试对话");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

---

## 通用集成方案

### WebSocket实时上传

```javascript
// realtime-upload.js
const WebSocket = require('ws');
const axios = require('axios');

class RealtimeConversationUploader {
  constructor(apiBaseUrl, userId, uploadInterval = 60000) {
    this.apiBaseUrl = apiBaseUrl;
    this.userId = userId;
    this.uploadInterval = uploadInterval; // 默认每60秒上传一次
    this.buffer = [];
    this.uploadTimer = null;
  }

  start() {
    // 启动定时上传
    this.uploadTimer = setInterval(() => {
      this.flushBuffer();
    }, this.uploadInterval);
  }

  stop() {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
      this.uploadTimer = null;
    }
    // 上传剩余消息
    this.flushBuffer();
  }

  addMessage(sender, content, responseTime = null) {
    const message = {
      sender,
      content,
      timestamp: new Date().toISOString(),
      ...(responseTime && { responseTime })
    };
    
    this.buffer.push(message);

    // 如果缓冲区太大，立即上传
    if (this.buffer.length >= 20) {
      this.flushBuffer();
    }
  }

  async flushBuffer() {
    if (this.buffer.length === 0) return;

    const messagesToUpload = [...this.buffer];
    this.buffer = [];

    const conversationData = {
      userId: this.userId,
      title: `实时对话 - ${new Date().toLocaleString()}`,
      type: 'daily',
      messages: messagesToUpload,
      metadata: {
        uploadType: 'realtime',
        bufferSize: messagesToUpload.length
      }
    };

    try {
      await axios.post(
        `${this.apiBaseUrl}/api/conversations/upload`,
        conversationData
      );
      console.log(`成功上传 ${messagesToUpload.length} 条消息`);
    } catch (error) {
      console.error('上传失败，消息已保存到缓冲区:', error.message);
      // 失败时重新加入缓冲区
      this.buffer = [...messagesToUpload, ...this.buffer];
    }
  }
}

module.exports = RealtimeConversationUploader;
```

### 批量上传方案

```python
# batch_upload.py
import requests
import json
from typing import List, Dict
import time

class BatchConversationUploader:
    def __init__(self, api_base_url: str, batch_size: int = 5):
        self.api_base_url = api_base_url
        self.batch_size = batch_size
    
    def upload_batch(self, conversations: List[Dict]) -> List[Dict]:
        """批量上传多个对话"""
        results = []
        
        for i in range(0, len(conversations), self.batch_size):
            batch = conversations[i:i + self.batch_size]
            
            print(f'上传批次 {i//self.batch_size + 1}/{(len(conversations)-1)//self.batch_size + 1}...')
            
            for conversation in batch:
                try:
                    response = requests.post(
                        f'{self.api_base_url}/api/conversations/upload',
                        json=conversation,
                        timeout=30
                    )
                    response.raise_for_status()
                    results.append({
                        'success': True,
                        'data': response.json(),
                        'conversation': conversation
                    })
                    print(f'✓ 成功上传对话: {conversation.get("title", "未命名")}')
                except Exception as e:
                    results.append({
                        'success': False,
                        'error': str(e),
                        'conversation': conversation
                    })
                    print(f'✗ 上传失败: {conversation.get("title", "未命名")} - {str(e)}')
                
                # 避免请求过快
                time.sleep(0.5)
        
        return results

# 使用示例
if __name__ == '__main__':
    uploader = BatchConversationUploader('http://localhost:3001', batch_size=3)
    
    conversations = [
        {
            'userId': 'user-001',
            'title': f'对话{i+1}',
            'messages': [
                {'sender': 'assistant', 'content': '你好！'},
                {'sender': 'user', 'content': '你好，很高兴见到你。'}
            ]
        }
        for i in range(10)
    ]
    
    results = uploader.upload_batch(conversations)
    
    success_count = sum(1 for r in results if r['success'])
    print(f'\n总计: {len(results)} 个对话')
    print(f'成功: {success_count}')
    print(f'失败: {len(results) - success_count}')
```

---

## 最佳实践建议

1. **错误重试机制**：实现指数退避重试策略
2. **数据持久化**：在上传失败时将数据保存到本地
3. **隐私保护**：在上传前对敏感信息进行脱敏
4. **性能优化**：使用批量上传和缓冲机制
5. **日志记录**：记录所有上传操作以便追踪和调试

## 技术支持

如需更多帮助，请参考：
- [完整API文档](API_CONVERSATION_UPLOAD.md)
- [测试数据示例](sample-upload-data.json)
