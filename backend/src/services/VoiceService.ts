import VoiceDevice from '../models/VoiceDevice';
import VoiceAudit from '../models/VoiceAudit';
import User from '../models/User';
import { logger } from '../utils/logger';

// TODO: Import actual Reminder/Medication models when available
// These are placeholder references - adjust based on actual model names and fields
// import Reminder from '../models/Reminder';
// import Medication from '../models/Medication';

interface DeviceInfo {
  deviceId: string;
  deviceType: string;
  deviceName: string;
  userId?: string;
  apiVersion?: string;
  metadata?: Record<string, any>;
}

interface AuditPayload {
  deviceId?: string;
  userId?: string;
  intent: string;
  rawPayload: Record<string, any>;
  processedPayload?: Record<string, any>;
  responseData?: Record<string, any>;
  status?: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  processingTimeMs?: number;
}

interface IntentPayload {
  intent: string;
  deviceId?: string;
  userId?: string;
  parameters?: Record<string, any>;
  [key: string]: any;
}

interface IntentResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class VoiceService {
  /**
   * Record an audit log entry for voice interaction
   */
  static async recordAudit(payload: AuditPayload): Promise<VoiceAudit> {
    try {
      const audit = await VoiceAudit.create({
        deviceId: payload.deviceId,
        userId: payload.userId,
        intent: payload.intent,
        rawPayload: payload.rawPayload,
        processedPayload: payload.processedPayload,
        responseData: payload.responseData,
        status: payload.status || 'success',
        errorMessage: payload.errorMessage,
        processingTimeMs: payload.processingTimeMs,
      });

      logger.info('Voice audit recorded', { 
        auditId: audit.id, 
        intent: payload.intent,
        status: payload.status 
      });

      return audit;
    } catch (error) {
      logger.error('Failed to record voice audit', { error, payload });
      throw error;
    }
  }

  /**
   * Register a new voice device
   */
  static async registerDevice(deviceInfo: DeviceInfo): Promise<VoiceDevice> {
    try {
      // Check if device already exists
      let device = await VoiceDevice.findOne({
        where: { deviceId: deviceInfo.deviceId }
      });

      if (device) {
        // Update existing device
        await device.update({
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          userId: deviceInfo.userId,
          apiVersion: deviceInfo.apiVersion,
          metadata: deviceInfo.metadata,
          status: 'active',
          lastActiveAt: new Date(),
        });

        logger.info('Voice device updated', { deviceId: device.id });
      } else {
        // Create new device
        device = await VoiceDevice.create({
          deviceId: deviceInfo.deviceId,
          deviceType: deviceInfo.deviceType,
          deviceName: deviceInfo.deviceName,
          userId: deviceInfo.userId,
          apiVersion: deviceInfo.apiVersion,
          metadata: deviceInfo.metadata,
          status: 'active',
          lastActiveAt: new Date(),
        });

        logger.info('Voice device registered', { deviceId: device.id });
      }

      return device;
    } catch (error) {
      logger.error('Failed to register voice device', { error, deviceInfo });
      throw error;
    }
  }

  /**
   * Handle voice intent with minimal implementation
   * Supports: confirm_medication, query_reminders, emergency_call
   * 
   * TODO: Adjust based on actual Reminder/Medication model fields
   * - Reminder model may have different field names (e.g., reminderTime vs time, reminderText vs message)
   * - Medication model may have different field names (e.g., medicationName vs name, dosage, schedule)
   * - User associations need to be verified
   */
  static async handleIntent(payload: IntentPayload): Promise<IntentResponse> {
    const startTime = Date.now();
    const { intent, deviceId, userId, parameters } = payload;

    try {
      let response: IntentResponse;

      switch (intent) {
        case 'confirm_medication':
          response = await this.handleConfirmMedication(userId, parameters);
          break;

        case 'query_reminders':
          response = await this.handleQueryReminders(userId, parameters);
          break;

        case 'emergency_call':
          response = await this.handleEmergencyCall(userId, deviceId, parameters);
          break;

        default:
          response = {
            success: false,
            message: `未知的意图类型: ${intent}`,
            error: 'UNKNOWN_INTENT',
          };
      }

      const processingTime = Date.now() - startTime;

      // Record audit log
      await this.recordAudit({
        deviceId,
        userId,
        intent,
        rawPayload: payload,
        processedPayload: { parameters },
        responseData: response,
        status: response.success ? 'success' : 'failed',
        errorMessage: response.error,
        processingTimeMs: processingTime,
      });

      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Failed to handle voice intent', { error, intent, userId });

      // Record failed audit
      await this.recordAudit({
        deviceId,
        userId,
        intent,
        rawPayload: payload,
        status: 'failed',
        errorMessage,
        processingTimeMs: processingTime,
      });

      return {
        success: false,
        message: '处理语音指令时发生错误',
        error: errorMessage,
      };
    }
  }

  /**
   * Handle medication confirmation intent
   * TODO: Adjust based on actual Medication model
   */
  private static async handleConfirmMedication(
    userId?: string,
    parameters?: Record<string, any>
  ): Promise<IntentResponse> {
    if (!userId) {
      return {
        success: false,
        message: '用户信息缺失',
        error: 'MISSING_USER_ID',
      };
    }

    // TODO: Implement actual medication confirmation logic
    // Example implementation (adjust based on actual Medication model):
    // const medication = await Medication.findOne({
    //   where: { userId, status: 'pending', scheduledTime: { [Op.lte]: new Date() } },
    //   order: [['scheduledTime', 'ASC']]
    // });
    // 
    // if (medication) {
    //   await medication.update({ status: 'confirmed', confirmedAt: new Date() });
    //   return { success: true, message: '已确认服药', data: { medication } };
    // }

    logger.info('Medication confirmation requested', { userId, parameters });

    return {
      success: true,
      message: '药物提醒已确认。请确保按时服药。',
      data: {
        confirmed: true,
        timestamp: new Date().toISOString(),
        // TODO: Add actual medication details
      },
    };
  }

  /**
   * Handle query reminders intent
   * TODO: Adjust based on actual Reminder model
   */
  private static async handleQueryReminders(
    userId?: string,
    parameters?: Record<string, any>
  ): Promise<IntentResponse> {
    if (!userId) {
      return {
        success: false,
        message: '用户信息缺失',
        error: 'MISSING_USER_ID',
      };
    }

    // TODO: Implement actual reminder query logic
    // Example implementation (adjust based on actual Reminder model):
    // const reminders = await Reminder.findAll({
    //   where: {
    //     userId,
    //     reminderTime: {
    //       [Op.gte]: new Date(),
    //       [Op.lte]: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
    //     },
    //     status: 'active'
    //   },
    //   order: [['reminderTime', 'ASC']],
    //   limit: 5
    // });

    logger.info('Reminders query requested', { userId, parameters });

    return {
      success: true,
      message: '您今天有以下提醒事项',
      data: {
        reminders: [
          // TODO: Replace with actual reminder data
          // Example format:
          // { time: '10:00', message: '服用晨间药物' },
          // { time: '14:00', message: '午休时间' },
        ],
        count: 0,
      },
    };
  }

  /**
   * Handle emergency call intent
   */
  private static async handleEmergencyCall(
    userId?: string,
    deviceId?: string,
    parameters?: Record<string, any>
  ): Promise<IntentResponse> {
    logger.warn('Emergency call triggered', { userId, deviceId, parameters });

    // TODO: Implement actual emergency call logic
    // - Notify emergency contacts
    // - Send alerts to caregivers
    // - Log emergency event
    // - Potentially integrate with emergency services API

    if (!userId) {
      // Still log emergency even without user
      logger.error('Emergency call without user ID', { deviceId, parameters });
    }

    // Get user information for emergency contact
    let user: User | null = null;
    if (userId) {
      try {
        user = await User.findByPk(userId);
      } catch (error) {
        logger.error('Failed to fetch user for emergency', { error, userId });
      }
    }

    return {
      success: true,
      message: '紧急呼叫已触发。正在通知紧急联系人。',
      data: {
        emergency: true,
        timestamp: new Date().toISOString(),
        userPhone: user?.phoneNumber,
        // TODO: Add emergency contact notification status
      },
    };
  }

  /**
   * Get device by device ID
   */
  static async getDevice(deviceId: string): Promise<VoiceDevice | null> {
    try {
      return await VoiceDevice.findOne({
        where: { deviceId },
        include: [{ model: User, as: 'user' }],
      });
    } catch (error) {
      logger.error('Failed to get voice device', { error, deviceId });
      throw error;
    }
  }

  /**
   * Get audit logs for a device
   */
  static async getDeviceAudits(
    deviceId: string,
    limit: number = 50
  ): Promise<VoiceAudit[]> {
    try {
      return await VoiceAudit.findAll({
        where: { deviceId },
        order: [['createdAt', 'DESC']],
        limit,
        include: [{ model: User, as: 'user' }],
      });
    } catch (error) {
      logger.error('Failed to get device audits', { error, deviceId });
      throw error;
    }
  }
}
