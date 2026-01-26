import { Router } from 'express';
import { ConversationService } from '../services/ConversationService';
import { CognitiveAssessmentService } from '../services/CognitiveAssessmentService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

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

  // 这里应该从数据库查询，暂时返回模拟数据
  // 实际实现时会从数据库查询
  res.json({
    success: true,
    data: {
      conversations: [],
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: 0,
      },
    },
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
 * @desc    上传智能音响对话记录并进行分析
 * @access  Public/Private
 * @body    {
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
 */
router.post('/upload', asyncHandler(async (req, res) => {
  const { userId, title, type, messages, metadata } = req.body;

  // 验证必填字段
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '用户ID是必填项',
    });
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      success: false,
      error: '对话记录不能为空',
    });
  }

  // 验证消息格式
  const invalidMessages = messages.filter(msg => 
    !msg.sender || !msg.content || 
    !['user', 'assistant'].includes(msg.sender)
  );

  if (invalidMessages.length > 0) {
    return res.status(400).json({
      success: false,
      error: '消息格式不正确，每条消息必须包含sender和content字段，sender必须为user或assistant',
    });
  }

  try {
    // 使用ConversationService处理上传的对话
    const result = await ConversationService.uploadConversation(
      userId,
      {
        title: title || '智能音响对话',
        type: type || 'daily',
        messages,
        metadata,
      }
    );

    res.status(201).json({
      success: true,
      message: '对话记录上传成功并已完成分析',
      data: result,
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