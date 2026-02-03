import { Router } from 'express';
import { ConversationService } from '../services/ConversationService';
import { CognitiveAssessmentService } from '../services/CognitiveAssessmentService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { detectAndTransformConversationData } from '../utils/conversationTransformers';

const router = Router();

/**
 * @route   POST /api/conversations
 * @desc    创建新对话
 * @access  Private
 */
router.post('/', asyncHandler(async (req, res) => {
  const { userId, title, type } = req.body;

  if (!userId || !title) {
    return res.status(400).json({
      success: false,
      error: '用户ID和标题是必填项',
    });
  }

  const conversation = await ConversationService.createConversation(
    userId,
    title,
    type || 'daily'
  );

  res.status(201).json({
    success: true,
    data: conversation,
  });
}));

/**
 * @route   GET /api/conversations/user/:userId
 * @desc    获取用户的所有对话
 * @access  Private
 */
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const result = await ConversationService.getUserConversations(
    userId,
    parseInt(limit as string),
    parseInt(offset as string)
  );

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * @route   GET /api/conversations/:conversationId
 * @desc    获取对话详情
 * @access  Private
 */
router.get('/:conversationId', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  // 这里应该从数据库查询，暂时返回模拟数据
  // 实际实现时会从数据库查询
  res.json({
    success: true,
    data: {
      id: conversationId,
      title: '日常对话',
      type: 'daily',
      duration: 15,
      moodScore: 7,
      engagementScore: 8,
      createdAt: new Date().toISOString(),
    },
  });
}));

/**
 * @route   GET /api/conversations/:conversationId/messages
 * @desc    获取对话消息
 * @access  Private
 */
router.get('/:conversationId/messages', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const history = await ConversationService.getConversationHistory(
    conversationId,
    parseInt(limit as string),
    parseInt(offset as string)
  );

  res.json({
    success: true,
    data: history,
  });
}));

/**
 * @route   POST /api/conversations/:conversationId/messages
 * @desc    发送消息
 * @access  Private
 */
router.post('/:conversationId/messages', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content, responseTime } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: '消息内容不能为空',
    });
  }

  const message = await ConversationService.addUserMessage(
    conversationId,
    content.trim(),
    responseTime
  );

  res.status(201).json({
    success: true,
    data: message,
  });
}));

/**
 * @route   POST /api/conversations/:conversationId/end
 * @desc    结束对话并进行分析
 * @access  Private
 */
router.post('/:conversationId/end', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { moodScore, engagementScore, notes } = req.body;

  if (!moodScore || !engagementScore) {
    return res.status(400).json({
      success: false,
      error: '情绪分数和参与度分数是必填项',
    });
  }

  const result = await ConversationService.endConversation(
    conversationId,
    moodScore,
    engagementScore,
    notes
  );

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * @route   POST /api/conversations/:conversationId/analyze
 * @desc    分析对话认知指标
 * @access  Private
 */
router.post('/:conversationId/analyze', asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const analysis = await CognitiveAssessmentService.analyzeConversation(conversationId);

  res.json({
    success: true,
    data: analysis,
  });
}));

/**
 * @route   GET /api/conversations/user/:userId/stats
 * @desc    获取用户对话统计
 * @access  Private
 */
router.get('/user/:userId/stats', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const stats = await ConversationService.getUserConversationStats(userId);

  res.json({
    success: true,
    data: stats,
  });
}));

/**
 * @route   POST /api/conversations/upload
 * @desc    上传智能音响对话记录并进行分析（支持多种格式）
 * @access  Public/Private
 * @body    标准格式：{
 *   userId: string,
 *   title?: string,
 *   type?: 'daily' | 'assessment' | 'therapeutic',
 *   messages: Array<{
 *     sender: 'user' | 'assistant',
 *     content: string,
 *     timestamp?: string,
 *     responseTime?: number
 *   }>,
 *   metadata?: {
 *     deviceId?: string,
 *     deviceType?: string,
 *     sessionId?: string
 *   }
 * }
 * @body    MoCA格式：{
 *   userId: string,
 *   session_start_time: string,
 *   session_end_time: string,
 *   test_type: string,
 *   conversation_history: Array<{
 *     timestamp: string,
 *     user_query: string,
 *     bot_response: string
 *   }>
 * }
 */
router.post('/upload', asyncHandler(async (req, res) => {
  const bodyData = req.body;
  
  // 检测并转换数据格式
  const { transformed, format, needsUserId } = detectAndTransformConversationData(bodyData);
  
  // 获取userId
  let userId = bodyData.userId;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '用户ID是必填项',
    });
  }

  // 验证UUID格式
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return res.status(400).json({
      success: false,
      error: '用户ID格式不正确，必须是有效的UUID格式（例如：550e8400-e29b-41d4-a716-446655440000）',
    });
  }

  // 确定要使用的数据
  let conversationData;
  
  if (format === 'moca' && transformed) {
    // MoCA格式，使用转换后的数据
    conversationData = transformed;
    logger.info(`Received MoCA format data, transformed to standard format`);
  } else if (format === 'standard') {
    // 标准格式，直接使用
    const { title, type, messages, metadata } = bodyData;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: '对话记录不能为空',
      });
    }

    // 验证消息格式
    const invalidMessages = messages.filter((msg: any) => 
      !msg.sender || !msg.content || 
      !['user', 'assistant'].includes(msg.sender)
    );

    if (invalidMessages.length > 0) {
      return res.status(400).json({
        success: false,
        error: '消息格式不正确，每条消息必须包含sender和content字段，sender必须为user或assistant',
      });
    }
    
    conversationData = {
      title: title || '智能音响对话',
      type: type || 'daily',
      messages,
      metadata,
    };
  } else {
    return res.status(400).json({
      success: false,
      error: '不支持的数据格式。支持的格式：1) 标准格式（包含messages数组）2) MoCA格式（包含conversation_history数组）',
    });
  }

  try {
    // 使用ConversationService处理上传的对话
    const result = await ConversationService.uploadConversation(
      userId,
      conversationData
    );

    res.status(201).json({
      success: true,
      message: '对话记录上传成功并已完成分析',
      data: result,
      format: format, // 返回识别到的格式
    });
  } catch (error: any) {
    logger.error('Error uploading conversation:', error);
    res.status(500).json({
      success: false,
      error: error.message || '上传对话记录时发生错误',
    });
  }
}));

export default router;