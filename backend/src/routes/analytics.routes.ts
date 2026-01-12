import { Router } from 'express';
import { CognitiveAssessmentService } from '../services/CognitiveAssessmentService';
import Conversation from '../models/Conversation';
import CognitiveAssessment from '../models/CognitiveAssessment';
import User from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route   GET /api/analytics/overview
 * @desc    获取系统概览数据
 * @access  Private
 */
router.get('/overview', asyncHandler(async (req, res) => {
  // 获取统计数据
  const totalUsers = await User.count();
  const totalConversations = await Conversation.count();
  const totalAssessments = await CognitiveAssessment.count();

  // 获取最近活跃用户
  const recentUsers = await User.findAll({
    attributes: ['id', 'firstName', 'lastName', 'email', 'lastAssessmentDate', 'riskLevel'],
    order: [['lastAssessmentDate', 'DESC']],
    limit: 5,
  });

  // 获取风险分布
  const riskDistribution = await User.findAll({
    attributes: ['riskLevel'],
    group: ['riskLevel'],
  });

  // 获取最近对话
  const recentConversations = await Conversation.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: 10,
  });

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalConversations,
        totalAssessments,
        avgConversationsPerUser: totalUsers > 0 ? (totalConversations / totalUsers).toFixed(2) : 0,
        avgAssessmentsPerUser: totalUsers > 0 ? (totalAssessments / totalUsers).toFixed(2) : 0,
      },
      riskDistribution: riskDistribution.map(item => ({
        level: item.riskLevel,
        count: item.get('count'),
      })),
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        lastAssessment: user.lastAssessmentDate,
        riskLevel: user.riskLevel,
      })),
      recentConversations: recentConversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        type: conv.type,
        duration: conv.duration,
        moodScore: conv.moodScore,
        engagementScore: conv.engagementScore,
        cognitiveScore: conv.cognitiveScore,
        user: conv.user ? {
          id: conv.user.id,
          name: `${conv.user.firstName} ${conv.user.lastName}`,
        } : null,
        createdAt: conv.createdAt,
      })),
    },
  });
}));

/**
 * @route   GET /api/analytics/user/:userId/detailed
 * @desc    获取用户详细分析数据
 * @access  Private
 */
router.get('/user/:userId/detailed', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { days = 90 } = req.query;

  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在',
    });
  }

  // 获取认知趋势
  const trendData = await CognitiveAssessmentService.getUserCognitiveTrend(
    userId,
    parseInt(days as string)
  );

  // 获取对话统计
  const conversations = await Conversation.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
  });

  // 获取评估记录
  const assessments = await CognitiveAssessment.findAll({
    where: { userId },
    order: [['completedAt', 'DESC']],
  });

  // 计算各项指标
  const conversationStats = calculateConversationStats(conversations);
  const assessmentStats = calculateAssessmentStats(assessments);
  const riskProgression = calculateRiskProgression(assessments);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        age: user.calculateAge(),
        gender: user.gender,
        riskLevel: user.riskLevel,
        riskFactors: user.getRiskFactors(),
      },
      trendData,
      conversationStats,
      assessmentStats,
      riskProgression,
      recommendations: generateAnalyticsRecommendations(
        conversationStats,
        assessmentStats,
        riskProgression
      ),
    },
  });
}));

/**
 * 计算对话统计
 */
function calculateConversationStats(conversations: Conversation[]): any {
  if (conversations.length === 0) {
    return {
      total: 0,
      avgDuration: 0,
      avgMoodScore: 0,
      avgEngagementScore: 0,
      avgCognitiveScore: 0,
      byType: {},
    };
  }

  const byType: Record<string, any> = {};
  let totalDuration = 0;
  let totalMoodScore = 0;
  let totalEngagementScore = 0;
  let totalCognitiveScore = 0;
  let cognitiveScoreCount = 0;

  conversations.forEach(conv => {
    // 按类型统计
    if (!byType[conv.type]) {
      byType[conv.type] = {
        count: 0,
        totalDuration: 0,
        avgMoodScore: 0,
        avgEngagementScore: 0,
        avgCognitiveScore: 0,
      };
    }

    byType[conv.type].count++;
    byType[conv.type].totalDuration += conv.duration;
    byType[conv.type].avgMoodScore += conv.moodScore;
    byType[conv.type].avgEngagementScore += conv.engagementScore;

    if (conv.cognitiveScore) {
      byType[conv.type].avgCognitiveScore += conv.cognitiveScore;
    }

    // 总体统计
    totalDuration += conv.duration;
    totalMoodScore += conv.moodScore;
    totalEngagementScore += conv.engagementScore;

    if (conv.cognitiveScore) {
      totalCognitiveScore += conv.cognitiveScore;
      cognitiveScoreCount++;
    }
  });

  // 计算平均值
  Object.keys(byType).forEach(type => {
    const stats = byType[type];
    stats.avgDuration = stats.count > 0 ? stats.totalDuration / stats.count : 0;
    stats.avgMoodScore = stats.count > 0 ? stats.avgMoodScore / stats.count : 0;
    stats.avgEngagementScore = stats.count > 0 ? stats.avgEngagementScore / stats.count : 0;
    stats.avgCognitiveScore = stats.count > 0 ? stats.avgCognitiveScore / stats.count : 0;
  });

  return {
    total: conversations.length,
    avgDuration: conversations.length > 0 ? totalDuration / conversations.length : 0,
    avgMoodScore: conversations.length > 0 ? totalMoodScore / conversations.length : 0,
    avgEngagementScore: conversations.length > 0 ? totalEngagementScore / conversations.length : 0,
    avgCognitiveScore: cognitiveScoreCount > 0 ? totalCognitiveScore / cognitiveScoreCount : 0,
    byType,
  };
}

/**
 * 计算评估统计
 */
function calculateAssessmentStats(assessments: CognitiveAssessment[]): any {
  if (assessments.length === 0) {
    return {
      total: 0,
      byType: {},
      scoreTrend: 'no_data',
    };
  }

  const byType: Record<string, any> = {};
  const scores: number[] = [];

  assessments.forEach(assess => {
    // 按类型统计
    if (!byType[assess.assessmentType]) {
      byType[assess.assessmentType] = {
        count: 0,
        avgScore: 0,
        avgPercentage: 0,
        riskLevels: { low: 0, medium: 0, high: 0 },
      };
    }

    const stats = byType[assess.assessmentType];
    stats.count++;
    stats.avgScore += assess.totalScore;
    stats.avgPercentage += assess.getPercentageScore();
    stats.riskLevels[assess.riskLevel]++;

    // 收集分数用于趋势分析
    scores.push(assess.getPercentageScore());
  });

  // 计算平均值
  Object.keys(byType).forEach(type => {
    const stats = byType[type];
    stats.avgScore = stats.count > 0 ? stats.avgScore / stats.count : 0;
    stats.avgPercentage = stats.count > 0 ? stats.avgPercentage / stats.count : 0;
  });

  // 计算分数趋势
  let scoreTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (scores.length >= 3) {
    const recentScores = scores.slice(0, 3);
    const firstAvg = recentScores[0];
    const lastAvg = recentScores[recentScores.length - 1];

    if (lastAvg > firstAvg + 5) {
      scoreTrend = 'improving';
    } else if (lastAvg < firstAvg - 5) {
      scoreTrend = 'declining';
    }
  }

  return {
    total: assessments.length,
    byType,
    scoreTrend,
    latestScore: assessments.length > 0 ? assessments[0].getPercentageScore() : 0,
    latestRiskLevel: assessments.length > 0 ? assessments[0].riskLevel : 'low',
  };
}

/**
 * 计算风险进展
 */
function calculateRiskProgression(assessments: CognitiveAssessment[]): any {
  if (assessments.length === 0) {
    return {
      current: 'low',
      history: [],
      trend: 'stable',
      changes: 0,
    };
  }

  const history = assessments.map(assess => ({
    date: assess.completedAt,
    riskLevel: assess.riskLevel,
    score: assess.getPercentageScore(),
  }));

  const riskLevels = ['low', 'medium', 'high'];
  const currentRisk = assessments[0].riskLevel;
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  let changes = 0;

  // 计算趋势
  if (assessments.length >= 2) {
    const currentIndex = riskLevels.indexOf(currentRisk);
    const previousIndex = riskLevels.indexOf(assessments[1].riskLevel);

    if (currentIndex < previousIndex) {
      trend = 'improving';
    } else if (currentIndex > previousIndex) {
      trend = 'declining';
    }

    // 计算风险等级变化次数
    for (let i = 1; i < assessments.length; i++) {
      if (assessments[i].riskLevel !== assessments[i - 1].riskLevel) {
        changes++;
      }
    }
  }

  return {
    current: currentRisk,
    history,
    trend,
    changes,
    stability: changes === 0 ? 'high' : changes <= 2 ? 'medium' : 'low',
  };
}

/**
 * 生成分析建议
 */
function generateAnalyticsRecommendations(
  conversationStats: any,
  assessmentStats: any,
  riskProgression: any
): string[] {
  const recommendations: string[] = [];

  // 基于对话频率的建议
  if (conversationStats.total < 10) {
    recommendations.push('建议增加对话频率，每周至少进行3次对话');
  }

  // 基于情绪分数的建议
  if (conversationStats.avgMoodScore < 5) {
    recommendations.push('关注情绪健康，建议进行更多积极的活动');
  }

  // 基于参与度的建议
  if (conversationStats.avgEngagementScore < 5) {
    recommendations.push('提高对话参与度，尝试更多互动性话题');
  }

  // 基于认知分数的建议
  if (conversationStats.avgCognitiveScore < 60) {
    recommendations.push('认知分数偏低，建议进行认知训练');
  }

  // 基于评估趋势的建议
  if (assessmentStats.scoreTrend === 'declining') {
    recommendations.push('认知分数呈下降趋势，建议咨询专业医生');
  }

  // 基于风险进展的建议
  if (riskProgression.trend === 'declining') {
    recommendations.push('风险等级上升，需要加强预防措施');
  }

  if (riskProgression.stability === 'low') {
    recommendations.push('风险等级波动较大，建议保持稳定生活方式');
  }

  // 正面反馈
  if (conversationStats.avgCognitiveScore >= 80 && assessmentStats.scoreTrend === 'improving') {
    recommendations.push('认知状态良好且持续改善，继续保持！');
  }

  return recommendations;
}

/**
 * @route   GET /api/analytics/trends/cognitive
 * @desc    获取认知趋势分析
 * @access  Private
 */
router.get('/trends/cognitive', asyncHandler(async (req, res) => {
  const { timeframe = 'month' } = req.query;

  // 根据时间范围获取数据
  const startDate = new Date();
  switch (timeframe) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  // 获取对话数据
  const conversations = await Conversation.findAll({
    where: {
      createdAt: { $gte: startDate },
      cognitiveScore: { $ne: null },
    },
    order: [['createdAt', 'ASC']],
  });

  // 获取评估数据
  const assessments = await CognitiveAssessment.findAll({
    where: {
      completedAt: { $gte: startDate },
    },
    order: [['completedAt', 'ASC']],
  });

  // 按时间分组数据
  const timeGroups: Record<string, any> = {};
  const formatDate = (date: Date) => {
    switch (timeframe) {
      case 'week':
        return date.toISOString().split('T')[0]; // 按天
      case 'month':
        return `${date.getFullYear()}-${date.getMonth() + 1}-${Math.floor(date.getDate() / 7) + 1}`; // 按周
      case 'quarter':
        return `${date.getFullYear()}-${date.getMonth() + 1}`; // 按月
      case 'year':
        return `${date.getFullYear()}-${Math.floor((date.getMonth() + 1) / 3) + 1}`; // 按季度
      default:
        return date.toISOString().split('T')[0];
    }
  };

  // 处理对话数据
  conversations.forEach(conv => {
    const timeKey = formatDate(conv.createdAt);
    if (!timeGroups[timeKey]) {
      timeGroups[timeKey] = {
        date: timeKey,
        conversationCount: 0,
        conversationScores: [],
        assessmentCount: 0,
        assessmentScores: [],
      };
    }
    timeGroups[timeKey].conversationCount++;
    if (conv.cognitiveScore) {
      timeGroups[timeKey].conversationScores.push(conv.cognitiveScore);
    }
  });

  // 处理评估数据
  assessments.forEach(assess => {
    const timeKey = formatDate(assess.completedAt);
    if (!timeGroups[timeKey]) {
      timeGroups[timeKey] = {
        date: timeKey,
        conversationCount: 0,
        conversationScores: [],
        assessmentCount: 0,
        assessmentScores: [],
      };
    }
    timeGroups[timeKey].assessmentCount++;
    timeGroups[timeKey].assessmentScores.push(assess.getPercentageScore());
  });

  // 计算平均值
  const trendData = Object.values(timeGroups).map((group: any) => ({
    date: group.date,
    conversationCount: group.conversationCount,
    avgConversationScore: group.conversationScores.length > 0
      ? group.conversationScores.reduce((a: number, b: number) => a + b, 0) / group.conversationScores.length
      : null,
    assessmentCount: group.assessmentCount,
    avgAssessmentScore: group.assessmentScores.length > 0
      ? group.assessmentScores.reduce((a: number, b: number) => a + b, 0) / group.assessmentScores.length
      : null,
  }));

  // 按日期排序
  trendData.sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    success: true,
    data: {
      timeframe,
      startDate,
      endDate: new Date(),
      trendData,
      summary: {
        totalConversations: conversations.length,
        totalAssessments: assessments.length,
        avgConversationScore: conversations.length > 0
          ? conversations.reduce((sum, conv) => sum + (conv.cognitiveScore || 0), 0) / conversations.length
          : 0,
        avgAssessmentScore: assessments.length > 0
          ? assessments.reduce((sum, assess) => sum + assess.getPercentageScore(), 0) / assessments.length
          : 0,
      },
    },
  });
}));

export default router;