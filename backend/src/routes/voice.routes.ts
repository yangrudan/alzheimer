import { Router, Request, Response, NextFunction } from 'express';
import { VoiceService } from '../services/VoiceService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * 验证 API Token（如果配置了的话）
 */
const validateApiToken = (req: Request, res: Response, next: NextFunction) => {
  const apiToken = process.env.VOICE_API_TOKEN;
  
  // 如果没有配置 API Token，则跳过验证
  if (!apiToken) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Missing authorization header',
    });
  }

  const token = authHeader.replace('Bearer ', '');
  if (token !== apiToken) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API token',
    });
  }

  next();
};

/**
 * @route   POST /api/voice/webhook
 * @desc    接收外部语音webhook请求
 * @access  Public (with optional API token)
 * 
 * 请求体格式：
 * {
 *   "device_id": "设备唯一标识",
 *   "platform": "xiaogpt | xiaoai | tmall_genie | dueros | other",
 *   "user_id": "用户ID（可选）",
 *   "intent": "意图名称",
 *   "slots": { "槽位数据": "值" },
 *   "request_id": "请求ID（可选）",
 *   "raw_payload": { "原始数据": "..." }
 * }
 */
router.post('/webhook', validateApiToken, asyncHandler(async (req, res) => {
  const { device_id, platform, user_id, intent, slots, request_id, raw_payload } = req.body;

  // 验证必填字段
  if (!device_id || !platform || !intent) {
    return res.status(400).json({
      success: false,
      error: '缺少必填字段: device_id, platform, intent',
    });
  }

  logger.info(`Received voice webhook: device=${device_id}, intent=${intent}`);

  // 处理意图
  const response = await VoiceService.handleIntent({
    device_id,
    platform,
    user_id,
    intent,
    slots,
    request_id,
    raw_payload,
  });

  // 返回响应
  return res.status(response.success ? 200 : 400).json(response);
}));

/**
 * @route   POST /api/voice/devices/register
 * @desc    注册或更新语音设备
 * @access  Public (with optional API token)
 * 
 * 请求体格式：
 * {
 *   "device_id": "设备唯一标识",
 *   "platform": "xiaogpt | xiaoai | tmall_genie | dueros | other",
 *   "user_id": "用户ID（可选）",
 *   "device_name": "设备名称（可选）",
 *   "metadata": { "元数据": "..." }
 * }
 */
router.post('/devices/register', validateApiToken, asyncHandler(async (req, res) => {
  const { device_id, platform, user_id, device_name, metadata } = req.body;

  // 验证必填字段
  if (!device_id || !platform) {
    return res.status(400).json({
      success: false,
      error: '缺少必填字段: device_id, platform',
    });
  }

  logger.info(`Registering voice device: ${device_id}`);

  // 注册设备
  const device = await VoiceService.registerDevice(
    device_id,
    platform,
    user_id,
    device_name,
    metadata
  );

  return res.status(201).json({
    success: true,
    data: device,
    message: '设备注册成功',
  });
}));

/**
 * @route   GET /api/voice/devices/:deviceId/audit
 * @desc    获取设备的审计日志
 * @access  Private
 */
router.get('/devices/:deviceId/audit', validateApiToken, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;

  logger.info(`Fetching audit logs for device: ${deviceId}`);

  const logs = await VoiceService.getDeviceAuditLogs(deviceId, limit);

  return res.json({
    success: true,
    data: logs,
    count: logs.length,
  });
}));

/**
 * @route   GET /api/voice/users/:userId/audit
 * @desc    获取用户的审计日志
 * @access  Private
 */
router.get('/users/:userId/audit', validateApiToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;

  logger.info(`Fetching audit logs for user: ${userId}`);

  const logs = await VoiceService.getUserAuditLogs(userId, limit);

  return res.json({
    success: true,
    data: logs,
    count: logs.length,
  });
}));

/**
 * @route   GET /api/voice/health
 * @desc    语音服务健康检查
 * @access  Public
 */
router.get('/health', asyncHandler(async (req, res) => {
  return res.json({
    success: true,
    service: 'Voice Integration Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}));

export default router;
