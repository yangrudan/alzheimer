import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

interface VoiceAuditAttributes {
  id: string;
  deviceId?: string;
  userId?: string;
  intent: string;
  rawPayload: Record<string, any>;
  processedPayload?: Record<string, any>;
  responseData?: Record<string, any>;
  status: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  processingTimeMs?: number;
  createdAt: Date;
}

interface VoiceAuditCreationAttributes extends Optional<VoiceAuditAttributes, 'id' | 'createdAt'> {}

class VoiceAudit extends Model<VoiceAuditAttributes, VoiceAuditCreationAttributes> implements VoiceAuditAttributes {
  public id!: string;
  public deviceId?: string;
  public userId?: string;
  public intent!: string;
  public rawPayload!: Record<string, any>;
  public processedPayload?: Record<string, any>;
  public responseData?: Record<string, any>;
  public status!: 'success' | 'failed' | 'pending';
  public errorMessage?: string;
  public processingTimeMs?: number;
  public readonly createdAt!: Date;

  // Associations
  public readonly user?: User;

  // Instance methods
  public markAsSuccess(responseData: Record<string, any>, processingTimeMs: number): void {
    this.status = 'success';
    this.responseData = responseData;
    this.processingTimeMs = processingTimeMs;
  }

  public markAsFailed(errorMessage: string, processingTimeMs: number): void {
    this.status = 'failed';
    this.errorMessage = errorMessage;
    this.processingTimeMs = processingTimeMs;
  }
}

VoiceAudit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deviceId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'device_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    intent: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    rawPayload: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'raw_payload',
    },
    processedPayload: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'processed_payload',
    },
    responseData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'response_data',
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'pending'),
      allowNull: false,
      defaultValue: 'success',
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
    underscored: true,
    timestamps: false, // Only createdAt, no updatedAt
    indexes: [
      {
        fields: ['device_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['intent'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

// Define associations
VoiceAudit.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(VoiceAudit, { foreignKey: 'userId', as: 'voiceAudits' });

export default VoiceAudit;
