import { Router } from 'express';
import { CognitiveAssessmentService } from '../services/CognitiveAssessmentService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @route   POST /api/assessments
 * @desc    创建认知评估
 * @access  Private
 */
router.post('/', asyncHandler(async (req, res) => {
  const { userId, assessmentType, scores } = req.body;

  if (!userId || !assessmentType || !scores) {
    return res.status(400).json({
      success: false,
      error: '用户ID、评估类型和分数是必填项',
    });
  }

  const assessment = await CognitiveAssessmentService.createFormalAssessment(
    userId,
    assessmentType,
    scores
  );

  res.status(201).json({
    success: true,
    data: assessment,
  });
}));

/**
 * @route   GET /api/assessments/user/:userId
 * @desc    获取用户的所有评估
 * @access  Private
 */
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  // 这里应该从数据库查询，暂时返回模拟数据
  // 实际实现时会从数据库查询
  res.json({
    success: true,
    data: {
      assessments: [],
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: 0,
      },
    },
  });
}));

/**
 * @route   GET /api/assessments/:assessmentId
 * @desc    获取评估详情
 * @access  Private
 */
router.get('/:assessmentId', asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;

  // 这里应该从数据库查询，暂时返回模拟数据
  // 实际实现时会从数据库查询
  res.json({
    success: true,
    data: {
      id: assessmentId,
      assessmentType: 'mmse',
      totalScore: 28,
      maxScore: 30,
      percentage: 93.3,
      riskLevel: 'low',
      recommendations: [
        '认知状态良好，继续保持',
        '建议定期进行社交活动',
      ],
      completedAt: new Date().toISOString(),
    },
  });
}));

/**
 * @route   GET /api/assessments/user/:userId/trend
 * @desc    获取用户认知趋势
 * @access  Private
 */
router.get('/user/:userId/trend', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { days = 30 } = req.query;

  const trendData = await CognitiveAssessmentService.getUserCognitiveTrend(
    userId,
    parseInt(days as string)
  );

  res.json({
    success: true,
    data: trendData,
  });
}));

/**
 * @route   POST /api/assessments/quick
 * @desc    快速认知评估
 * @access  Private
 */
router.post('/quick', asyncHandler(async (req, res) => {
  const { userId, answers } = req.body;

  if (!userId || !answers) {
    return res.status(400).json({
      success: false,
      error: '用户ID和答案是必填项',
    });
  }

  // 快速评估问题
  const questions = [
    {
      id: 'orientation_time',
      question: '今天是几月几日？星期几？',
      maxScore: 5,
    },
    {
      id: 'orientation_place',
      question: '我们现在在哪里？',
      maxScore: 5,
    },
    {
      id: 'memory_immediate',
      question: '请记住这三个词：苹果、桌子、红色',
      maxScore: 3,
    },
    {
      id: 'attention',
      question: '从100开始，每次减7，连续减5次',
      maxScore: 5,
    },
    {
      id: 'memory_delayed',
      question: '刚才让你记住的三个词是什么？',
      maxScore: 3,
    },
    {
      id: 'language',
      question: '请说出一分钟之内你能想到的所有动物',
      maxScore: 5,
    },
    {
      id: 'visuospatial',
      question: '请画一个时钟，指针指向10点10分',
      maxScore: 4,
    },
  ];

  // 计算分数
  let totalScore = 0;
  const domainScores = {
    orientation: 0,
    memory: 0,
    attention: 0,
    language: 0,
    visuospatial: 0,
  };

  questions.forEach((q, index) => {
    const userAnswer = answers[q.id];
    const score = userAnswer?.score || 0;

    totalScore += score;

    // 分配到对应领域
    if (q.id.includes('orientation')) {
      domainScores.orientation += score;
    } else if (q.id.includes('memory')) {
      domainScores.memory += score;
    } else if (q.id.includes('attention')) {
      domainScores.attention += score;
    } else if (q.id.includes('language')) {
      domainScores.language += score;
    } else if (q.id.includes('visuospatial')) {
      domainScores.visuospatial += score;
    }
  });

  const maxScore = questions.reduce((sum, q) => sum + q.maxScore, 0);

  // 创建评估记录
  const assessment = await CognitiveAssessmentService.createFormalAssessment(
    userId,
    'custom',
    {
      totalScore,
      maxScore,
      domainScores,
    }
  );

  res.json({
    success: true,
    data: {
      assessment,
      questions,
      userAnswers: answers,
    },
  });
}));

/**
 * @route   GET /api/assessments/templates/:type
 * @desc    获取评估模板
 * @access  Private
 */
router.get('/templates/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;

  const templates: Record<string, any> = {
    mmse: {
      name: '简易精神状态检查 (MMSE)',
      description: '用于筛查认知功能障碍的标准化评估工具',
      maxScore: 30,
      domains: [
        {
          name: '定向力',
          questions: [
            { id: 'time_1', question: '今年是哪一年？', maxScore: 1 },
            { id: 'time_2', question: '现在是什么季节？', maxScore: 1 },
            { id: 'time_3', question: '今天是几月？', maxScore: 1 },
            { id: 'time_4', question: '今天是几号？', maxScore: 1 },
            { id: 'time_5', question: '今天是星期几？', maxScore: 1 },
            { id: 'place_1', question: '我们在哪个省/市？', maxScore: 1 },
            { id: 'place_2', question: '我们在哪个区？', maxScore: 1 },
            { id: 'place_3', question: '我们在几楼？', maxScore: 1 },
            { id: 'place_4', question: '这里是什么地方？', maxScore: 1 },
          ],
        },
        {
          name: '记忆力',
          questions: [
            { id: 'memory_1', question: '请记住：皮球、国旗、树木', maxScore: 3 },
          ],
        },
        {
          name: '注意力和计算力',
          questions: [
            { id: 'attention_1', question: '100减7等于多少？', maxScore: 1 },
            { id: 'attention_2', question: '再减7等于多少？', maxScore: 1 },
            { id: 'attention_3', question: '再减7等于多少？', maxScore: 1 },
            { id: 'attention_4', question: '再减7等于多少？', maxScore: 1 },
            { id: 'attention_5', question: '再减7等于多少？', maxScore: 1 },
          ],
        },
        {
          name: '回忆能力',
          questions: [
            { id: 'recall_1', question: '请说出刚才记住的三个词', maxScore: 3 },
          ],
        },
        {
          name: '语言能力',
          questions: [
            { id: 'language_1', question: '这是什么？（展示手表）', maxScore: 1 },
            { id: 'language_2', question: '这是什么？（展示铅笔）', maxScore: 1 },
            { id: 'language_3', question: '请重复：四十四只石狮子', maxScore: 1 },
            { id: 'language_4', question: '请按我说的做：用右手拿纸，对折，放在地上', maxScore: 3 },
            { id: 'language_5', question: '请念出这句话并按照意思去做：闭上你的眼睛', maxScore: 1 },
            { id: 'language_6', question: '请写一个完整的句子', maxScore: 1 },
            { id: 'language_7', question: '请照着画这个图形（交错五边形）', maxScore: 1 },
          ],
        },
      ],
    },
    moca: {
      name: '蒙特利尔认知评估 (MoCA)',
      description: '用于检测轻度认知功能障碍的评估工具',
      maxScore: 30,
      domains: [
        {
          name: '视空间与执行功能',
          questions: [
            { id: 'visuospatial_1', question: '画立方体', maxScore: 1 },
            { id: 'visuospatial_2', question: '画钟表（11点10分）', maxScore: 3 },
          ],
        },
        {
          name: '命名',
          questions: [
            { id: 'naming_1', question: '命名动物图片', maxScore: 3 },
          ],
        },
        {
          name: '记忆',
          questions: [
            { id: 'memory_1', question: '记忆词语：面孔、天鹅绒、教堂、雏菊、红色', maxScore: 0 },
            { id: 'memory_2', question: '延迟回忆', maxScore: 5 },
          ],
        },
        {
          name: '注意力',
          questions: [
            { id: 'attention_1', question: '数字广度：顺背、倒背', maxScore: 2 },
            { id: 'attention_2', question: '警觉性：听到字母A时拍手', maxScore: 1 },
            { id: 'attention_3', question: '连续减7', maxScore: 3 },
          ],
        },
        {
          name: '语言',
          questions: [
            { id: 'language_1', question: '重复句子', maxScore: 2 },
            { id: 'language_2', question: '词语流畅性：动物名称', maxScore: 1 },
          ],
        },
        {
          name: '抽象思维',
          questions: [
            { id: 'abstract_1', question: '相似性：香蕉-橘子，火车-自行车', maxScore: 2 },
          ],
        },
        {
          name: '定向',
          questions: [
            { id: 'orientation_1', question: '日期、月份、年份、星期、地点、城市', maxScore: 6 },
          ],
        },
      ],
    },
  };

  const template = templates[type];

  if (!template) {
    return res.status(404).json({
      success: false,
      error: '评估模板不存在',
    });
  }

  res.json({
    success: true,
    data: template,
  });
}));

export default router;