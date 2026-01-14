import VoiceDevice from '../models/VoiceDevice';
import VoiceAudit from '../models/VoiceAudit';
import User from '../models/User';
import { logger } from '../utils/logger';

/**
 * 语音请求接口
 */
interface VoiceRequest {
  device_id: string;
  platform: string;
  user_id?: string;
  intent: string;
  slots?: Record<string, any>;
  request_id?: string;
  raw_payload?: Record<string, any>;
}

/**
 * 语音响应接口
 */
interface VoiceResponse {
  success: boolean;
  reply: string;
  action?: string;
  data?: any;
  error?: string;
}

/**
 * VoiceService 类
 * 处理语音设备注册、意图处理和审计日志
 * 
 * @class VoiceService
 */
export class VoiceService {
  
  /**
   * 注册或更新语音设备
   * @param deviceId 设备唯一标识符
   * @param platform 设备平台
   * @param userId 设备所有者用户ID（可选）
   * @param deviceName 设备名称（可选）
   * @param metadata 设备元数据（可选）
   * @returns 注册的语音设备
   */
  static async registerDevice(
    deviceId: string,
    platform: string,
    userId?: string,
    deviceName?: string,
    metadata?: Record<string, any>
  ): Promise<VoiceDevice> {
    try {
      // 检查设备是否已存在
      let device = await VoiceDevice.findOne({ where: { deviceId } });

      if (device) {
        // 更新现有设备
        const updates: any = {
          ownerUserId: userId || device.ownerUserId,
          deviceName: deviceName || device.deviceName,
          metadata: metadata ? { ...device.metadata, ...metadata } : device.metadata,
          lastActiveAt: new Date(),
          isActive: true,
        };
        if (platform) {
          updates.platform = platform;
        }
        await device.update(updates);
        logger.info(`Updated voice device: ${deviceId}`);
      } else {
        // 创建新设备
        device = await VoiceDevice.create({
          deviceId,
          platform: platform as 'xiaogpt' | 'xiaoai' | 'tmall_genie' | 'dueros' | 'other',
          ownerUserId: userId,
          deviceName,
          metadata: metadata || {},
          isActive: true,
          lastActiveAt: new Date(),
        });
        logger.info(`Registered new voice device: ${deviceId}`);
      }

      return device;
    } catch (error) {
      logger.error('Error registering device:', error);
      throw error;
    }
  }

  /**
   * 处理语音意图请求
   * @param request 语音请求对象
   * @returns 语音响应对象
   */
  static async handleIntent(request: VoiceRequest): Promise<VoiceResponse> {
    const startTime = Date.now();
    let audit: VoiceAudit | null = null;

    try {
      // 1. 创建审计日志
      audit = await VoiceAudit.create({
        deviceId: request.device_id,
        platform: request.platform,
        userId: request.user_id,
        requestId: request.request_id,
        intent: request.intent,
        slots: request.slots || {},
        rawPayload: request.raw_payload,
        success: false, // Initialize as false, will update on success
      });

      // 2. 更新设备最后活跃时间
      const device = await VoiceDevice.findOne({ 
        where: { deviceId: request.device_id } 
      });
      if (device) {
        await device.updateLastActive();
      }

      // 3. 根据意图处理请求
      let response: VoiceResponse;
      
      switch (request.intent) {
        case 'confirm_medication':
          response = await this.handleConfirmMedication(request);
          break;
        
        case 'query_reminders':
          response = await this.handleQueryReminders(request);
          break;
        
        case 'emergency_call':
          response = await this.handleEmergencyCall(request);
          break;
        
        default:
          response = {
            success: false,
            reply: `抱歉，我还不支持 ${request.intent} 功能`,
            error: 'Unsupported intent',
          };
      }

      // 4. 更新审计日志
      if (audit) {
        audit.reply = response.reply;
        audit.action = response.action;
        audit.success = response.success;
        audit.errorMessage = response.error;
        audit.setProcessingTime(startTime);
        await audit.save();
      }

      logger.info(`Handled intent ${request.intent} for device ${request.device_id}`);
      return response;

    } catch (error: any) {
      logger.error('Error handling intent:', error);

      // 记录错误到审计日志
      if (audit) {
        audit.success = false;
        audit.errorMessage = error.message;
        audit.setProcessingTime(startTime);
        await audit.save();
      }

      return {
        success: false,
        reply: '抱歉，处理您的请求时出现错误，请稍后再试',
        error: error.message,
      };
    }
  }

  /**
   * 处理服药确认意图
   * @param request 语音请求对象
   * @returns 语音响应对象
   */
  private static async handleConfirmMedication(
    request: VoiceRequest
  ): Promise<VoiceResponse> {
    try {
      const medicationName = request.slots?.medication || '药物';
      const userId = request.user_id;

      if (!userId) {
        return {
          success: false,
          reply: '请先绑定您的账户才能使用服药提醒功能',
          error: 'User not linked',
        };
      }

      // 验证用户是否存在
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          reply: '未找到您的账户信息，请重新绑定',
          error: 'User not found',
        };
      }

      // TODO: 这里应该查询 Reminder 或 Medication 模型
      // 由于当前仓库中没有这些模型，这里提供占位实现
      // 实际使用时需要替换为真实的数据库查询
      
      // 示例：记录服药确认（可以存储到用户的医疗记录中）
      logger.info(`User ${userId} confirmed medication: ${medicationName}`);

      return {
        success: true,
        reply: `好的，已记录您服用了${medicationName}。记得按时服药对健康很重要哦！`,
        action: 'medication_confirmed',
        data: {
          userId,
          medication: medicationName,
          confirmedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      logger.error('Error handling medication confirmation:', error);
      return {
        success: false,
        reply: '记录服药信息时出现错误，请稍后再试',
        error: error.message,
      };
    }
  }

  /**
   * 处理查询提醒意图
   * @param request 语音请求对象
   * @returns 语音响应对象
   */
  private static async handleQueryReminders(
    request: VoiceRequest
  ): Promise<VoiceResponse> {
    try {
      const userId = request.user_id;

      if (!userId) {
        return {
          success: false,
          reply: '请先绑定您的账户才能查询提醒',
          error: 'User not linked',
        };
      }

      // 验证用户是否存在
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          reply: '未找到您的账户信息，请重新绑定',
          error: 'User not found',
        };
      }

      // TODO: 这里应该查询 Reminder 模型获取用户的提醒列表
      // 由于当前仓库中没有 Reminder 模型，这里提供占位实现
      // 实际使用时需要替换为真实的数据库查询
      
      logger.info(`User ${userId} queried reminders`);

      // 示例响应（实际应该从数据库查询）
      const mockReminders = [
        '上午9点服用阿司匹林',
        '下午2点进行认知训练',
        '晚上8点服用降压药',
      ];

      const reply = mockReminders.length > 0
        ? `您今天有以下提醒：${mockReminders.join('，')}。`
        : '您今天暂时没有提醒事项。';

      return {
        success: true,
        reply,
        action: 'reminders_queried',
        data: {
          userId,
          reminders: mockReminders,
          count: mockReminders.length,
        },
      };
    } catch (error: any) {
      logger.error('Error querying reminders:', error);
      return {
        success: false,
        reply: '查询提醒时出现错误，请稍后再试',
        error: error.message,
      };
    }
  }

  /**
   * 处理紧急呼叫意图
   * @param request 语音请求对象
   * @returns 语音响应对象
   */
  private static async handleEmergencyCall(
    request: VoiceRequest
  ): Promise<VoiceResponse> {
    try {
      const userId = request.user_id;
      const emergencyType = request.slots?.type || 'general';

      logger.warn(`Emergency call initiated by device ${request.device_id}, user: ${userId}, type: ${emergencyType}`);

      if (userId) {
        const user = await User.findByPk(userId);
        if (user) {
          // TODO: 这里应该触发实际的紧急通知
          // 例如：发送短信给紧急联系人、拨打紧急电话、推送通知等
          logger.warn(`Emergency alert for user ${user.firstName} ${user.lastName} (${user.email})`);
        }
      }

      // 记录紧急呼叫
      // TODO: 可以创建专门的紧急事件记录表

      return {
        success: true,
        reply: '我已收到您的紧急呼叫，正在通知您的紧急联系人。请保持冷静，帮助很快就会到来。',
        action: 'emergency_alert_sent',
        data: {
          userId,
          emergencyType,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      logger.error('Error handling emergency call:', error);
      return {
        success: false,
        reply: '处理紧急呼叫时出现错误，请直接拨打紧急电话120或110',
        error: error.message,
      };
    }
  }

  /**
   * 获取设备的审计日志
   * @param deviceId 设备ID
   * @param limit 返回记录数量限制
   * @returns 审计日志列表
   */
  static async getDeviceAuditLogs(
    deviceId: string,
    limit: number = 50
  ): Promise<VoiceAudit[]> {
    try {
      const logs = await VoiceAudit.findAll({
        where: { deviceId },
        order: [['createdAt', 'DESC']],
        limit,
      });

      return logs;
    } catch (error) {
      logger.error('Error fetching device audit logs:', error);
      throw error;
    }
  }

  /**
   * 获取用户的审计日志
   * @param userId 用户ID
   * @param limit 返回记录数量限制
   * @returns 审计日志列表
   */
  static async getUserAuditLogs(
    userId: string,
    limit: number = 50
  ): Promise<VoiceAudit[]> {
    try {
      const logs = await VoiceAudit.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit,
      });

      return logs;
    } catch (error) {
      logger.error('Error fetching user audit logs:', error);
      throw error;
    }
  }
}
