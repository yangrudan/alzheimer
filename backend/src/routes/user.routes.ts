import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    获取所有用户列表
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: ['id', 'firstName', 'lastName', 'email'],
    order: [['createdAt', 'DESC']],
  });

  res.json({
    success: true,
    data: users,
  });
}));

/**
 * @route   POST /api/users/register
 * @desc    注册新用户
 * @access  Public
 */
router.post('/register', asyncHandler(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    phoneNumber,
    educationLevel,
    occupation,
    familyHistory,
    medicalHistory,
  } = req.body;

  // 验证必填字段
  if (!email || !password || !firstName || !lastName || !dateOfBirth || !gender) {
    return res.status(400).json({
      success: false,
      error: '请填写所有必填字段',
    });
  }

  // 检查邮箱是否已存在
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    // 用户已存在，返回现有用户信息（便于客户端继续操作）
    const token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userResponse = existingUser.toJSON();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: '用户已存在，返回现有用户信息',
      data: {
        user: userResponse,
        token,
      },
    });
  }

  // 创建用户
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    dateOfBirth: new Date(dateOfBirth),
    gender,
    phoneNumber,
    educationLevel,
    occupation,
    familyHistory,
    medicalHistory,
    riskLevel: 'low',
  });

  // 生成JWT令牌
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // 移除密码字段
  const userResponse = user.toJSON();
  delete userResponse.password;

  res.status(201).json({
    success: true,
    data: {
      user: userResponse,
      token,
    },
  });
}));

/**
 * @route   POST /api/users/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: '邮箱和密码是必填项',
    });
  }

  // 查找用户
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({
      success: false,
      error: '邮箱或密码错误',
    });
  }

  // 验证密码
  const isValidPassword = await user.validatePassword(password);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: '邮箱或密码错误',
    });
  }

  // 生成JWT令牌
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // 移除密码字段
  const userResponse = user.toJSON();
  delete userResponse.password;

  res.json({
    success: true,
    data: {
      user: userResponse,
      token,
    },
  });
}));

/**
 * @route   GET /api/users/profile
 * @desc    获取用户个人信息
 * @access  Private
 */
router.get('/profile', asyncHandler(async (req, res) => {
  // 这里应该从JWT令牌中获取用户ID
  // 暂时使用模拟数据
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: '未授权访问',
    });
  }

  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在',
    });
  }

  res.json({
    success: true,
    data: user,
  });
}));

/**
 * @route   PUT /api/users/profile
 * @desc    更新用户个人信息
 * @access  Private
 */
router.put('/profile', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const updateData = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: '未授权访问',
    });
  }

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在',
    });
  }

  // 不允许更新邮箱和密码（有单独的接口）
  delete updateData.email;
  delete updateData.password;

  // 更新用户信息
  await user.update(updateData);

  // 获取更新后的用户信息（排除密码）
  const updatedUser = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });

  res.json({
    success: true,
    data: updatedUser,
  });
}));

/**
 * @route   PUT /api/users/password
 * @desc    修改密码
 * @access  Private
 */
router.put('/password', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: '未授权访问',
    });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: '当前密码和新密码是必填项',
    });
  }

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在',
    });
  }

  // 验证当前密码
  const isValidPassword = await user.validatePassword(currentPassword);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: '当前密码错误',
    });
  }

  // 更新密码
  await user.update({ password: newPassword });

  res.json({
    success: true,
    message: '密码修改成功',
  });
}));

/**
 * @route   GET /api/users/:userId/risk-assessment
 * @desc    获取用户风险评估
 * @access  Private
 */
router.get('/:userId/risk-assessment', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在',
    });
  }

  const age = user.calculateAge();
  const riskFactors = user.getRiskFactors();

  // 计算风险分数
  let riskScore = 0;
  const factorWeights: Record<string, number> = {
    age: age >= 75 ? 3 : age >= 65 ? 2 : age >= 55 ? 1 : 0,
    family_history: user.familyHistory ? 2 : 0,
    gender: user.gender === 'female' ? 1 : 0,
    education: user.educationLevel === 'low' ? 1 : 0,
  };

  riskFactors.forEach(factor => {
    riskScore += factorWeights[factor] || 0;
  });

  // 确定风险等级
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (riskScore >= 5) {
    riskLevel = 'high';
  } else if (riskScore >= 3) {
    riskLevel = 'medium';
  }

  // 生成预防建议
  const recommendations = generatePreventionRecommendations(riskLevel, riskFactors, age);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        age,
        gender: user.gender,
        educationLevel: user.educationLevel,
        familyHistory: user.familyHistory,
      },
      riskAssessment: {
        riskScore,
        riskLevel,
        riskFactors,
        factorWeights,
        recommendations,
      },
    },
  });
}));

/**
 * 生成预防建议
 */
function generatePreventionRecommendations(
  riskLevel: string,
  riskFactors: string[],
  age: number
): string[] {
  const recommendations: string[] = [];

  // 通用建议
  recommendations.push('保持健康饮食，多吃蔬菜水果');
  recommendations.push('每周进行至少150分钟的中等强度有氧运动');
  recommendations.push('保持社交活动，与家人朋友定期交流');

  // 基于风险等级的建议
  if (riskLevel === 'high') {
    recommendations.push('建议定期进行专业认知评估（每3-6个月）');
    recommendations.push('考虑进行认知训练和大脑锻炼');
    recommendations.push('管理慢性疾病，如高血压、糖尿病');
  } else if (riskLevel === 'medium') {
    recommendations.push('建议每年进行一次认知评估');
    recommendations.push('保持学习新技能，如学习语言、乐器');
  }

  // 基于风险因素的建议
  if (riskFactors.includes('age') && age >= 65) {
    recommendations.push('定期检查视力和听力');
    recommendations.push('预防跌倒，保持家居安全');
  }

  if (riskFactors.includes('family_history')) {
    recommendations.push('关注早期症状，及时就医');
    recommendations.push('考虑基因咨询（如有需要）');
  }

  if (riskFactors.includes('education')) {
    recommendations.push('多进行阅读和写作活动');
    recommendations.push('参加社区教育课程');
  }

  return recommendations;
}

/**
 * @route   GET /api/users/:userId/summary
 * @desc    获取用户摘要信息
 * @access  Private
 */
router.get('/:userId/summary', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在',
    });
  }

  const age = user.calculateAge();
  const riskFactors = user.getRiskFactors();

  res.json({
    success: true,
    data: {
      id: user.id,
      fullName: `${user.firstName} ${user.lastName}`,
      age,
      gender: user.gender,
      riskLevel: user.riskLevel,
      riskFactors,
      lastAssessmentDate: user.lastAssessmentDate,
      daysSinceLastAssessment: user.lastAssessmentDate
        ? Math.floor((new Date().getTime() - user.lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    },
  });
}));

export default router;