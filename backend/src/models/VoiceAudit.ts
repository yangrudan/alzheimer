import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * VoiceAudit 属性接口
 * 定义语音审计日志的所有字段
 */
interface VoiceAuditAttributes {
  id: string;
  deviceId: string;
  platform: string;
  userId?: string;
  requestId?: string;
  intent: string;
  slots?: Record<string, any>;
  rawPayload?: Record<string, any>;
  reply?: string;
  action?: string;
  success: boolean;
  errorMessage?: string;
  processingTimeMs?: number;
  createdAt: Date;
}

/**
 * VoiceAudit 创建属性接口
 * 创建时可选的字段
 */
interface VoiceAuditCreationAttributes 
  extends Optional<VoiceAuditAttributes, 'id' | 'createdAt' | 'success'> {}

/**
 * VoiceAudit 模型类
 * 记录所有语音请求和响应，用于审计和分析
 * 
 * @class VoiceAudit
 * @extends {Model<VoiceAuditAttributes, VoiceAuditCreationAttributes>}
 */
class VoiceAudit extends Model<VoiceAuditAttributes, VoiceAuditCreationAttributes> 
  implements VoiceAuditAttributes {
  
  public id!: string;
  public deviceId!: string;
  public platform!: string;
  public userId?: string;
  public requestId?: string;
  public intent!: string;
  public slots?: Record<string, any>;
  public rawPayload?: Record<string, any>;
  public reply?: string;
  public action?: string;
  public success!: boolean;
  public errorMessage?: string;
  public processingTimeMs?: number;
  public readonly createdAt!: Date;

  /**
   * 更新审计日志的回复内容
   * @param reply 回复文本
   */
  public async updateReply(reply: string): Promise<void> {
    this.reply = reply;
    await this.save();
  }

  /**
   * 标记审计日志为失败
   * @param errorMessage 错误信息
   */
  public async markAsFailed(errorMessage: string): Promise<void> {
    this.success = false;
    this.errorMessage = errorMessage;
    await this.save();
  }

  /**
   * 设置处理时间
   * @param startTime 开始时间（毫秒时间戳）
   */
  public setProcessingTime(startTime: number): void {
    this.processingTimeMs = Date.now() - startTime;
  }
}

/**
 * 初始化 VoiceAudit 模型
 */
VoiceAudit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deviceId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'device_id',
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    requestId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'request_id',
    },
    intent: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    slots: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    rawPayload: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'raw_payload',
    },
    reply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
    },
    processingTimeMs: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'processing_time_ms',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'voice_audit',
    timestamps: false,
    underscored: true,
  }
);

export default VoiceAudit;
