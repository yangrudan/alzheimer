/**
 * 对话数据格式转换工具
 * 用于将不同格式的对话数据转换为标准格式
 */

interface MoCAConversationHistory {
  timestamp: string;
  user_query: string;
  bot_response: string;
}

interface MoCASessionData {
  session_start_time: string;
  session_end_time: string;
  test_type: string;
  trigger_keyword?: string;
  conversation_history: MoCAConversationHistory[];
  total_exchanges: number;
  assessment_note?: string;
}

interface StandardMessage {
  sender: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  responseTime?: number;
}

interface StandardConversationData {
  title: string;
  type: 'daily' | 'assessment' | 'therapeutic';
  messages: StandardMessage[];
  metadata?: Record<string, any>;
}

/**
 * 将MoCA评估格式转换为标准对话格式
 */
export function transformMoCAToStandard(mocaData: MoCASessionData): StandardConversationData {
  const messages: StandardMessage[] = [];

  // 将对话历史转换为消息数组
  mocaData.conversation_history.forEach((exchange, index) => {
    // 添加用户查询
    messages.push({
      sender: 'user',
      content: exchange.user_query,
      timestamp: exchange.timestamp,
    });

    // 添加机器人回复
    messages.push({
      sender: 'assistant',
      content: exchange.bot_response,
      timestamp: exchange.timestamp,
    });
  });

  // 构建元数据
  const metadata: Record<string, any> = {
    sessionStartTime: mocaData.session_start_time,
    sessionEndTime: mocaData.session_end_time,
    testType: mocaData.test_type,
    totalExchanges: mocaData.total_exchanges,
  };

  if (mocaData.trigger_keyword) {
    metadata.triggerKeyword = mocaData.trigger_keyword;
  }

  if (mocaData.assessment_note) {
    metadata.assessmentNote = mocaData.assessment_note;
  }

  return {
    title: mocaData.test_type || 'MoCA认知评估',
    type: 'assessment',
    messages,
    metadata,
  };
}

/**
 * 检测数据格式并自动转换
 */
export function detectAndTransformConversationData(data: any): {
  transformed: StandardConversationData | null;
  format: 'standard' | 'moca' | 'unknown';
  needsUserId: boolean;
} {
  // 检查是否为标准格式
  if (data.messages && Array.isArray(data.messages)) {
    return {
      transformed: null,
      format: 'standard',
      needsUserId: !data.userId,
    };
  }

  // 检查是否为MoCA格式
  if (data.conversation_history && Array.isArray(data.conversation_history)) {
    return {
      transformed: transformMoCAToStandard(data),
      format: 'moca',
      needsUserId: true,
    };
  }

  return {
    transformed: null,
    format: 'unknown',
    needsUserId: true,
  };
}
