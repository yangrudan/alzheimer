import Conversation from '../models/Conversation';
import ConversationMessage from '../models/ConversationMessage';
import User from '../models/User';
import { CognitiveAssessmentService } from './CognitiveAssessmentService';
import { logger } from '../utils/logger';

export class ConversationService {
  /**
   * 创建新的对话
   */
  static async createConversation(
    userId: string,
    title: string,
    type: 'daily' | 'assessment' | 'therapeutic' = 'daily'
  ): Promise<Conversation> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const conversation = await Conversation.create({
        userId,
        title,
        type,
        moodScore: 5, // 默认中等情绪
        engagementScore: 5, // 默认中等参与度
      });

      // 添加欢迎消息
      await this.addSystemMessage(
        conversation.id,
        this.generateWelcomeMessage(user.firstName, type)
      );

      logger.info(`Created new conversation for user ${userId}: ${conversation.id}`);
      return conversation;
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * 生成欢迎消息
   */
  private static generateWelcomeMessage(firstName: string, type: string): string {
    const greetings = [
      `你好${firstName}！今天感觉怎么样？`,
      `${firstName}，很高兴和你聊天！`,
      `欢迎${firstName}！我们来聊聊天吧。`,
    ];

    const typeSpecificMessages: Record<string, string> = {
      daily: '今天有什么想分享的吗？',
      assessment: '我们将进行一些简单的认知活动，准备好了吗？',
      therapeutic: '让我们开始今天的认知训练吧。',
    };

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    const typeMessage = typeSpecificMessages[type] || '今天有什么想聊的吗？';

    return `${randomGreeting} ${typeMessage}`;
  }

  /**
   * 添加用户消息
   */
  static async addUserMessage(
    conversationId: string,
    content: string,
    responseTime?: number
  ): Promise<ConversationMessage> {
    try {
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const message = await ConversationMessage.create({
        conversationId,
        sender: 'user',
        content,
        messageType: 'text',
        cognitiveMetrics: responseTime ? { responseTime } : undefined,
      });

      // 更新对话持续时间
      await this.updateConversationDuration(conversationId);

      // 根据用户消息生成回复
      await this.generateResponse(conversationId, content);

      return message;
    } catch (error) {
      logger.error('Error adding user message:', error);
      throw error;
    }
  }

  /**
   * 添加系统消息
   */
  static async addSystemMessage(
    conversationId: string,
    content: string,
    messageType: 'text' | 'question' | 'assessment' | 'feedback' = 'text'
  ): Promise<ConversationMessage> {
    try {
      const message = await ConversationMessage.create({
        conversationId,
        sender: 'system',
        content,
        messageType,
      });

      return message;
    } catch (error) {
      logger.error('Error adding system message:', error);
      throw error;
    }
  }

  /**
   * 更新对话持续时间
   */
  private static async updateConversationDuration(conversationId: string): Promise<void> {
    try {
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) return;

      const firstMessage = await ConversationMessage.findOne({
        where: { conversationId },
        order: [['createdAt', 'ASC']],
      });

      if (firstMessage) {
        const duration = Math.floor(
          (new Date().getTime() - firstMessage.createdAt.getTime()) / 60000
        );
        await conversation.update({ duration });
      }
    } catch (error) {
      logger.error('Error updating conversation duration:', error);
    }
  }

  /**
   * 生成智能回复
   */
  private static async generateResponse(conversationId: string, userMessage: string): Promise<void> {
    try {
      const conversation = await Conversation.findByPk(conversationId, {
        include: [{ model: User, as: 'user' }],
      });

      if (!conversation || !conversation.user) return;

      const response = await this.analyzeAndGenerateResponse(
        userMessage,
        conversation.type,
        conversation.user
      );

      await this.addSystemMessage(conversationId, response.content, response.type);
    } catch (error) {
      logger.error('Error generating response:', error);
      // 添加默认回复
      await this.addSystemMessage(
        conversationId,
        '我明白了。还有其他想分享的吗？'
      );
    }
  }

  /**
   * 分析消息并生成回复
   */
  private static async analyzeAndGenerateResponse(
    userMessage: string,
    conversationType: string,
    user: User
  ): Promise<{ content: string; type: 'text' | 'question' | 'assessment' | 'feedback' }> {
    const lowerMessage = userMessage.toLowerCase();

    // 情感分析
    const emotionalTone = this.analyzeEmotionalTone(userMessage);

    // 根据对话类型和情感生成回复
    switch (conversationType) {
      case 'assessment':
        return this.generateAssessmentResponse(userMessage, emotionalTone);

      case 'therapeutic':
        return this.generateTherapeuticResponse(userMessage, emotionalTone, user);

      default: // daily
        return this.generateDailyResponse(userMessage, emotionalTone, user);
    }
  }

  /**
   * 分析情感
   */
  private static analyzeEmotionalTone(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['好', '开心', '高兴', '喜欢', '爱', '幸福', '快乐', '满意', '不错'];
    const negativeWords = ['不好', '难过', '伤心', '讨厌', '恨', '痛苦', '生气', '失望', '累'];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (message.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (message.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * 生成日常对话回复
   */
  private static generateDailyResponse(
    message: string,
    emotionalTone: string,
    user: User
  ): { content: string; type: 'text' | 'question' | 'assessment' | 'feedback' } {
    const responses = {
      positive: [
        '听起来你今天心情不错！',
        '太好了！继续保持这种积极的心态。',
        '为你感到高兴！',
      ],
      neutral: [
        '我明白了。',
        '谢谢分享。',
        '原来如此。',
      ],
      negative: [
        '听起来你今天有些困扰，想多聊聊吗？',
        '我理解你的感受，有时候确实不容易。',
        '要不要分享一下具体是什么事情？',
      ],
    };

    // 检查是否需要提问
    const shouldAskQuestion = Math.random() > 0.5;
    const questionTypes = [
      {
        type: 'memory' as const,
        questions: [
          '你还记得昨天做了什么吗？',
          '最近有没有什么特别难忘的事情？',
          '小时候最喜欢做什么？',
        ],
      },
      {
        type: 'attention' as const,
        questions: [
          '你能描述一下刚才我们聊了什么吗？',
          '现在几点了？',
          '今天的天气怎么样？',
        ],
      },
      {
        type: 'executive' as const,
        questions: [
          '如果明天要出门，你需要准备什么？',
          '做一顿饭需要哪些步骤？',
          '怎么从你家去最近的超市？',
        ],
      },
    ];

    if (shouldAskQuestion) {
      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      const question = questionType.questions[Math.floor(Math.random() * questionType.questions.length)];

      return {
        content: `${responses[emotionalTone][Math.floor(Math.random() * responses[emotionalTone].length)]} ${question}`,
        type: 'question',
      };
    }

    return {
      content: responses[emotionalTone][Math.floor(Math.random() * responses[emotionalTone].length)],
      type: 'text',
    };
  }

  /**
   * 生成评估对话回复
   */
  private static generateAssessmentResponse(
    message: string,
    emotionalTone: string
  ): { content: string; type: 'text' | 'question' | 'assessment' | 'feedback' } {
    // 评估对话需要更结构化的回复
    const assessmentQuestions = [
      {
        question: '请重复这三个词：苹果、桌子、红色',
        type: 'memory' as const,
      },
      {
        question: '从100开始，每次减7，告诉我结果：100, 93, 86...',
        type: 'attention' as const,
      },
      {
        question: '请说出一分钟之内你能想到的所有动物',
        type: 'language' as const,
      },
      {
        question: '画一个时钟，指针指向10点10分',
        type: 'visuospatial' as const,
      },
    ];

    // 随机选择一个评估问题
    const assessment = assessmentQuestions[Math.floor(Math.random() * assessmentQuestions.length)];

    return {
      content: assessment.question,
      type: 'assessment',
    };
  }

  /**
   * 生成治疗性对话回复
   */
  private static generateTherapeuticResponse(
    message: string,
    emotionalTone: string,
    user: User
  ): { content: string; type: 'text' | 'question' | 'assessment' | 'feedback' } {
    const age = user.calculateAge();
    const therapeuticResponses = [
      '让我们一起来做一些认知训练吧。',
      '记住，保持大脑活跃很重要。',
      '每天坚持训练，会有改善的。',
    ];

    const ageSpecificAdvice = age >= 65
      ? '对于您这个年龄段，保持社交活动和认知训练特别重要。'
      : '从现在开始关注认知健康，对长期预防很有帮助。';

    return {
      content: `${therapeuticResponses[Math.floor(Math.random() * therapeuticResponses.length)]} ${ageSpecificAdvice}`,
      type: 'feedback',
    };
  }

  /**
   * 获取对话历史
   */
  static async getConversationHistory(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: ConversationMessage[]; total: number }> {
    try {
      const { count, rows } = await ConversationMessage.findAndCountAll({
        where: { conversationId },
        order: [['createdAt', 'ASC']],
        limit,
        offset,
      });

      return {
        messages: rows,
        total: count,
      };
    } catch (error) {
      logger.error('Error getting conversation history:', error);
      throw error;
    }
  }

  /**
   * 结束对话并进行分析
   */
  static async endConversation(
    conversationId: string,
    moodScore: number,
    engagementScore: number,
    notes?: string
  ): Promise<any> {
    try {
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // 更新对话信息
      await conversation.update({
        moodScore,
        engagementScore,
        notes,
      });

      // 分析对话认知指标
      const analysis = await CognitiveAssessmentService.analyzeConversation(conversationId);

      // 添加结束消息
      await this.addSystemMessage(
        conversationId,
        this.generateEndingMessage(analysis.domainScores),
        'feedback'
      );

      return {
        conversation,
        analysis,
      };
    } catch (error) {
      logger.error('Error ending conversation:', error);
      throw error;
    }
  }

  /**
   * 生成结束消息
   */
  private static generateEndingMessage(domainScores: any): string {
    const overallScore = Object.values(domainScores).reduce((sum: number, score: any) => sum + score, 0) / Object.keys(domainScores).length;

    if (overallScore >= 7) {
      return '今天的对话表现很好！继续保持。';
    } else if (overallScore >= 5) {
      return '表现不错，还有提升空间。';
    } else {
      return '建议多进行认知训练，会有帮助的。';
    }
  }

  /**
   * 获取用户的对话统计
   */
  static async getUserConversationStats(userId: string): Promise<any> {
    try {
      const conversations = await Conversation.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
      });

      if (conversations.length === 0) {
        return {
          totalConversations: 0,
          avgMoodScore: 0,
          avgEngagementScore: 0,
          avgCognitiveScore: 0,
          recentTrend: 'no_data',
        };
      }

      const totalConversations = conversations.length;
      const avgMoodScore = conversations.reduce((sum, conv) => sum + conv.moodScore, 0) / totalConversations;
      const avgEngagementScore = conversations.reduce((sum, conv) => sum + conv.engagementScore, 0) / totalConversations;
      const conversationsWithScore = conversations.filter(conv => conv.cognitiveScore);
      const avgCognitiveScore = conversationsWithScore.length > 0
        ? conversationsWithScore.reduce((sum, conv) => sum + (conv.cognitiveScore || 0), 0) / conversationsWithScore.length
        : 0;

      // 计算趋势（最近5次对话）
      const recentConversations = conversations.slice(0, 5).filter(conv => conv.cognitiveScore);
      let trend: 'improving' | 'stable' | 'declining' = 'stable';

      if (recentConversations.length >= 2) {
        const firstScore = recentConversations[recentConversations.length - 1].cognitiveScore || 0;
        const lastScore = recentConversations[0].cognitiveScore || 0;
        trend = lastScore > firstScore + 5 ? 'improving' : lastScore < firstScore - 5 ? 'declining' : 'stable';
      }

      return {
        totalConversations,
        avgMoodScore: Math.round(avgMoodScore * 10) / 10,
        avgEngagementScore: Math.round(avgEngagementScore * 10) / 10,
        avgCognitiveScore: Math.round(avgCognitiveScore * 10) / 10,
        recentTrend: trend,
        lastConversationDate: conversations[0].createdAt,
      };
    } catch (error) {
      logger.error('Error getting user conversation stats:', error);
      throw error;
    }
  }
}