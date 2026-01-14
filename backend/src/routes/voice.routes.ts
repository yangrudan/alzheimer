import { Router, Request, Response, NextFunction } from 'express';
import { VoiceService } from '../services/VoiceService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Middleware for optional token authentication
 * Checks VOICE_API_TOKEN environment variable if set
 */
const authenticateVoiceToken = (req: Request, res: Response, next: NextFunction) => {
  const apiToken = process.env.VOICE_API_TOKEN;

  // If no token is configured, skip authentication
  if (!apiToken) {
    return next();
  }

  // Check for token in header or query parameter
  const providedToken = req.headers['x-voice-token'] || req.query.token;

  if (!providedToken) {
    return res.status(401).json({
      success: false,
      error: 'Missing authentication token',
    });
  }

  if (providedToken !== apiToken) {
    logger.warn('Invalid voice API token attempt', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(403).json({
      success: false,
      error: 'Invalid authentication token',
    });
  }

  next();
};

/**
 * @route   POST /api/voice/webhook
 * @desc    Receive webhook from voice platforms (xiaogpt, etc.)
 * @access  Public (with optional token auth)
 */
router.post('/webhook', authenticateVoiceToken, asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();

  // Validate required fields
  const { intent, deviceId } = req.body;

  if (!intent) {
    logger.warn('Voice webhook missing intent', { body: req.body });
    return res.status(400).json({
      success: false,
      error: 'Missing required field: intent',
    });
  }

  logger.info('Voice webhook received', { 
    intent, 
    deviceId,
    ip: req.ip 
  });

  try {
    // Handle the intent
    const response = await VoiceService.handleIntent({
      intent,
      deviceId,
      userId: req.body.userId,
      parameters: req.body.parameters,
      ...req.body, // Include all other fields
    });

    const processingTime = Date.now() - startTime;

    logger.info('Voice webhook processed', {
      intent,
      success: response.success,
      processingTime,
    });

    return res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Voice webhook processing failed', {
      error: errorMessage,
      intent,
      deviceId,
      processingTime,
    });

    return res.status(500).json({
      success: false,
      message: '处理语音请求时发生错误',
      error: errorMessage,
    });
  }
}));

/**
 * @route   POST /api/voice/devices/register
 * @desc    Register or update a voice device
 * @access  Public (with optional token auth)
 */
router.post('/devices/register', authenticateVoiceToken, asyncHandler(async (req: Request, res: Response) => {
  const { deviceId, deviceType, deviceName, userId, apiVersion, metadata } = req.body;

  // Validate required fields
  if (!deviceId || !deviceType || !deviceName) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: deviceId, deviceType, deviceName',
    });
  }

  logger.info('Device registration requested', { deviceId, deviceType });

  try {
    const device = await VoiceService.registerDevice({
      deviceId,
      deviceType,
      deviceName,
      userId,
      apiVersion,
      metadata,
    });

    res.status(201).json({
      success: true,
      message: '设备注册成功',
      data: {
        id: device.id,
        deviceId: device.deviceId,
        deviceType: device.deviceType,
        deviceName: device.deviceName,
        status: device.status,
      },
    });
  } catch (error) {
    logger.error('Device registration failed', { error, deviceId });
    throw error;
  }
}));

/**
 * @route   GET /api/voice/devices/:deviceId
 * @desc    Get device information
 * @access  Public (with optional token auth)
 */
router.get('/devices/:deviceId', authenticateVoiceToken, asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.params;

  const device = await VoiceService.getDevice(deviceId);

  if (!device) {
    return res.status(404).json({
      success: false,
      error: 'Device not found',
    });
  }

  res.json({
    success: true,
    data: device,
  });
}));

/**
 * @route   GET /api/voice/devices/:deviceId/audits
 * @desc    Get audit logs for a device
 * @access  Public (with optional token auth)
 */
router.get('/devices/:deviceId/audits', authenticateVoiceToken, asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;

  const audits = await VoiceService.getDeviceAudits(deviceId, Math.min(limit, 100));

  res.json({
    success: true,
    data: {
      audits,
      count: audits.length,
    },
  });
}));

/**
 * @route   GET /api/voice/health
 * @desc    Voice service health check
 * @access  Public
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Voice service is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
