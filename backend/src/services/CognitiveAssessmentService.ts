import ConversationMessage from '../models/ConversationMessage';
import Conversation from '../models/Conversation';
import CognitiveAssessment from '../models/CognitiveAssessment';
import User from '../models/User';
import { logger } from '../utils/logger';

export class CognitiveAssessmentService {
  /**
   * 分析对话并生成认知评估
   */
  static async analyzeConversation(conversationId: string): Promise<any> {
    try {
      const conversation = await Conversation.findByPk(conversationId, {
        include: [
          {
            model: ConversationMessage,
            as: 'messages',
            where: { sender: 'user' },
            required: false,
          },
        ],
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const messages = conversation.messages || [];
      if (messages.length === 0) {
        return {
          success: false,
          message: 'No user messages found in conversation',
        };
      }

      // 分析认知指标
      const cognitiveMetrics = this.analyzeCognitiveMetrics(messages);
      const domainScores = this.calculateDomainScores(messages, cognitiveMetrics);

      // 更新对话的认知分数
      await conversation.update({
        cognitiveScore: cognitiveMetrics.overallScore,
        memoryRecallScore: domainScores.memory,
        attentionScore: domainScores.attention,
        executiveFunctionScore: domainScores.executive,
        languageComplexity: domainScores.language,
      });

      return {
        success: true,
        conversationId,
        cognitiveMetrics,
        domainScores,
        recommendations: this.generateRecommendations(domainScores),
      };
    } catch (error) {
      logger.error('Error analyzing conversation:', error);
      throw error;
    }
  }

  /**
   * 从消息中分析认知指标
   */
  private static analyzeCognitiveMetrics(messages: ConversationMessage[]): any {
    const metrics = {
      totalMessages: messages.length,
      totalWords: 0,
      avgResponseTime: 0,
      vocabularyComplexity: 0,
      emotionalTone: {
        positive: 0,
        neutral: 0,
        negative: 0,
      },
      coherenceScores: [] as number[],
      memoryReferences: 0,
    };

    let totalResponseTime = 0;
    let responseTimeCount = 0;

    messages.forEach((message, index) => {
      const cognitiveMetrics = message.cognitiveMetrics || {};

      // 词汇统计
      metrics.totalWords += cognitiveMetrics.wordCount || 0;

      // 响应时间
      if (cognitiveMetrics.responseTime) {
        totalResponseTime += cognitiveMetrics.responseTime;
        responseTimeCount++;
      }

      // 词汇复杂度
      if (cognitiveMetrics.vocabularyComplexity) {
        metrics.vocabularyComplexity += cognitiveMetrics.vocabularyComplexity;
      }

      // 情感分析
      if (cognitiveMetrics.emotionalTone) {
        metrics.emotionalTone[cognitiveMetrics.emotionalTone]++;
      }

      // 连贯性
      if (cognitiveMetrics.coherenceScore) {
        metrics.coherenceScores.push(cognitiveMetrics.coherenceScore);
      }

      // 记忆引用
      metrics.memoryReferences += cognitiveMetrics.memoryReferences || 0;
    });

    // 计算平均值
    metrics.avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    metrics.vocabularyComplexity = messages.length > 0 ? metrics.vocabularyComplexity / messages.length : 0;

    // 计算整体分数 (1-100)
    const overallScore = this.calculateOverallScore(metrics);

    return {
      ...metrics,
      overallScore,
      avgCoherence: metrics.coherenceScores.length > 0
        ? metrics.coherenceScores.reduce((a, b) => a + b, 0) / metrics.coherenceScores.length
        : 0,
    };
  }

  /**
   * 计算整体认知分数
   */
  private static calculateOverallScore(metrics: any): number {
    const weights = {
      vocabularyComplexity: 0.2,
      avgCoherence: 0.3,
      memoryReferences: 0.25,
      emotionalBalance: 0.15,
      responseTime: 0.1,
    };

    // 词汇复杂度分数 (0-10 to 0-100)
    const vocabScore = (metrics.vocabularyComplexity / 10) * 100;

    // 连贯性分数 (0-10 to 0-100)
    const coherenceScore = metrics.avgCoherence ? (metrics.avgCoherence / 10) * 100 : 50;

    // 记忆引用分数 (基于引用次数)
    const memoryScore = Math.min(metrics.memoryReferences * 5, 100);

    // 情感平衡分数 (正向情感比例)
    const totalTones = metrics.emotionalTone.positive + metrics.emotionalTone.neutral + metrics.emotionalTone.negative;
    const emotionalScore = totalTones > 0
      ? (metrics.emotionalTone.positive / totalTones) * 100
      : 50;

    // 响应时间分数 (越快越好)
    const responseTimeScore = metrics.avgResponseTime > 0
      ? Math.max(0, 100 - (metrics.avgResponseTime * 10))
      : 50;

    // 加权平均
    const overallScore = (
      vocabScore * weights.vocabularyComplexity +
      coherenceScore * weights.avgCoherence +
      memoryScore * weights.memoryReferences +
      emotionalScore * weights.emotionalBalance +
      responseTimeScore * weights.responseTime
    );

    return Math.round(Math.min(Math.max(overallScore, 0), 100));
  }

  /**
   * 计算各认知领域分数
   */
  private static calculateDomainScores(messages: ConversationMessage[], metrics: any): any {
    const domainScores = {
      memory: 0,
      attention: 0,
      executive: 0,
      language: 0,
      orientation: 0,
      visuospatial: 0,
    };

    // 记忆分数 (基于记忆引用和词汇复杂度)
    domainScores.memory = Math.round(
      (metrics.memoryReferences / messages.length) * 10 +
      (metrics.vocabularyComplexity / 10) * 5
    );

    // 注意力分数 (基于响应时间和连贯性)
    domainScores.attention = Math.round(
      (metrics.avgResponseTime > 0 ? Math.max(0, 10 - metrics.avgResponseTime) : 5) +
      (metrics.avgCoherence / 10) * 5
    );

    // 执行功能分数 (基于连贯性和词汇复杂度)
    domainScores.executive = Math.round(
      (metrics.avgCoherence / 10) * 7 +
      (metrics.vocabularyComplexity / 10) * 3
    );

    // 语言分数 (基于词汇复杂度和情感表达)
    domainScores.language = Math.round(
      (metrics.vocabularyComplexity / 10) * 8 +
      (metrics.emotionalTone.positive > 0 ? 2 : 0)
    );

    // 限制在1-10范围内
    Object.keys(domainScores).forEach(key => {
      domainScores[key] = Math.min(Math.max(domainScores[key], 1), 10);
    });

    return domainScores;
  }

  /**
   * 生成个性化建议
   */
  private static generateRecommendations(domainScores: any): string[] {
    const recommendations: string[] = [];

    // 记忆相关建议
    if (domainScores.memory < 6) {
      recommendations.push('建议进行记忆训练，如每天回忆3件当天发生的事情');
      recommendations.push('尝试记忆新的词汇或电话号码');
      recommendations.push('玩一些记忆类游戏，如配对游戏');
    }

    // 注意力相关建议
    if (domainScores.attention < 6) {
      recommendations.push('练习专注力，如每天冥想10分钟');
      recommendations.push('减少多任务处理，专注于单一任务');
      recommendations.push('进行阅读训练，逐渐增加阅读时长');
    }

    // 执行功能相关建议
    if (domainScores.executive < 6) {
      recommendations.push('制定每日计划并严格执行');
      recommendations.push('练习解决问题和决策制定');
      recommendations.push('进行组织能力训练，如整理物品');
    }

    // 语言相关建议
    if (domainScores.language < 6) {
      recommendations.push('多进行对话交流，每天至少30分钟');
      recommendations.push('朗读报纸或书籍，每天15分钟');
      recommendations.push('学习新的词汇和表达方式');
    }

    // 通用建议
    if (domainScores.memory >= 7 && domainScores.attention >= 7) {
      recommendations.push('认知状态良好，继续保持当前活动水平');
    }

    return recommendations;
  }

  /**
   * 创建正式的认知评估
   */
  static async createFormalAssessment(
    userId: string,
    assessmentType: 'mmse' | 'moca' | 'custom',
    scores: any
  ): Promise<CognitiveAssessment> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 计算总分和领域分数
      const totalScore = this.calculateTotalScore(assessmentType, scores);
      const maxScore = this.getMaxScore(assessmentType);
      const domainScores = this.extractDomainScores(assessmentType, scores);

      // 创建评估记录
      const assessment = await CognitiveAssessment.create({
        userId,
        assessmentType,
        totalScore,
        maxScore,
        domainScores,
        completedAt: new Date(),
      });

      // 更新用户的风险等级
      await user.update({
        riskLevel: assessment.riskLevel,
        lastAssessmentDate: new Date(),
      });

      return assessment;
    } catch (error) {
      logger.error('Error creating formal assessment:', error);
      throw error;
    }
  }

  /**
   * 计算总分
   */
  private static calculateTotalScore(assessmentType: string, scores: any): number {
    switch (assessmentType) {
      case 'mmse':
        // MMSE评分逻辑
        return Object.values(scores).reduce((sum: number, score: any) => sum + (score || 0), 0);
      case 'moca':
        // MoCA评分逻辑
        return Object.values(scores).reduce((sum: number, score: any) => sum + (score || 0), 0);
      default:
        return scores.totalScore || 0;
    }
  }

  /**
   * 获取最大分数
   */
  private static getMaxScore(assessmentType: string): number {
    switch (assessmentType) {
      case 'mmse':
        return 30;
      case 'moca':
        return 30;
      default:
        return 100;
    }
  }

  /**
   * 提取领域分数
   */
  private static extractDomainScores(assessmentType: string, scores: any): any {
    switch (assessmentType) {
      case 'mmse':
        return {
          orientation: scores.orientation || 0,
          memory: scores.memory || 0,
          attention: scores.attention || 0,
          language: scores.language || 0,
          visuospatial: scores.visuospatial || 0,
        };
      case 'moca':
        return {
          visuospatial: scores.visuospatial || 0,
          executive: scores.executive || 0,
          attention: scores.attention || 0,
          language: scores.language || 0,
          orientation: scores.orientation || 0,
          recall: scores.recall || 0,
        };
      default:
        return scores.domainScores || {};
    }
  }

  /**
   * 获取用户认知趋势
   */
  static async getUserCognitiveTrend(userId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 获取对话记录
      const conversations = await Conversation.findAll({
        where: {
          userId,
          createdAt: { $gte: startDate },
        },
        order: [['createdAt', 'ASC']],
      });

      // 获取正式评估
      const assessments = await CognitiveAssessment.findAll({
        where: {
          userId,
          completedAt: { $gte: startDate },
        },
        order: [['completedAt', 'ASC']],
      });

      // 准备趋势数据
      const trendData = {
        dailyScores: conversations.map(conv => ({
          date: conv.createdAt,
          score: conv.cognitiveScore || 0,
          type: 'conversation',
        })),
        assessmentScores: assessments.map(assess => ({
          date: assess.completedAt,
          score: assess.getPercentageScore(),
          type: 'assessment',
        })),
        domainTrends: this.calculateDomainTrends(conversations),
        riskLevelChanges: this.calculateRiskLevelChanges(assessments),
      };

      return trendData;
    } catch (error) {
      logger.error('Error getting user cognitive trend:', error);
      throw error;
    }
  }

  /**
   * 计算领域趋势
   */
  private static calculateDomainTrends(conversations: Conversation[]): any {
    const domains = ['memory', 'attention', 'executive', 'language'];
    const trends: any = {};

    domains.forEach(domain => {
      const scores = conversations
        .filter(conv => conv[`${domain}Score`])
        .map(conv => ({
          date: conv.createdAt,
          score: conv[`${domain}Score`],
        }));

      if (scores.length > 0) {
        trends[domain] = {
          current: scores[scores.length - 1].score,
          average: scores.reduce((sum, item) => sum + item.score, 0) / scores.length,
          trend: this.calculateTrend(scores.map(s => s.score)),
          dataPoints: scores,
        };
      }
    });

    return trends;
  }

  /**
   * 计算风险等级变化
   */
  private static calculateRiskLevelChanges(assessments: CognitiveAssessment[]): any {
    if (assessments.length === 0) return {};

    const riskLevels = ['low', 'medium', 'high'];
    const changes = {
      current: assessments[assessments.length - 1].riskLevel,
      previous: assessments.length > 1 ? assessments[assessments.length - 2].riskLevel : null,
      trend: 'stable' as 'improving' | 'stable' | 'declining',
      history: assessments.map(a => ({
        date: a.completedAt,
        level: a.riskLevel,
        score: a.getPercentageScore(),
      })),
    };

    if (changes.previous) {
      const currentIndex = riskLevels.indexOf(changes.current);
      const previousIndex = riskLevels.indexOf(changes.previous);

      if (currentIndex < previousIndex) {
        changes.trend = 'improving';
      } else if (currentIndex > previousIndex) {
        changes.trend = 'declining';
      }
    }

    return changes;
  }

  /**
   * 计算趋势 (改善、稳定、下降)
   */
  private static calculateTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
    if (scores.length < 2) return 'stable';

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const difference = avgSecond - avgFirst;

    if (difference > 1) return 'improving';
    if (difference < -1) return 'declining';
    return 'stable';
  }
}