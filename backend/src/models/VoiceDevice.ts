import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

interface VoiceDeviceAttributes {
  id: string;
  deviceId: string;
  deviceType: string;
  deviceName: string;
  userId?: string;
  status: 'active' | 'inactive' | 'suspended';
  apiVersion?: string;
  lastActiveAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface VoiceDeviceCreationAttributes extends Optional<VoiceDeviceAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class VoiceDevice extends Model<VoiceDeviceAttributes, VoiceDeviceCreationAttributes> implements VoiceDeviceAttributes {
  public id!: string;
  public deviceId!: string;
  public deviceType!: string;
  public deviceName!: string;
  public userId?: string;
  public status!: 'active' | 'inactive' | 'suspended';
  public apiVersion?: string;
  public lastActiveAt?: Date;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: User;

  // Instance methods
  public updateLastActive(): void {
    this.lastActiveAt = new Date();
  }

  public isActive(): boolean {
    return this.status === 'active';
  }
}

VoiceDevice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deviceId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'device_id',
    },
    deviceType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'device_type',
    },
    deviceName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'device_name',
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
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    },
    apiVersion: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'api_version',
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_active_at',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'voice_devices',
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['device_id'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

// Define associations
VoiceDevice.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(VoiceDevice, { foreignKey: 'userId', as: 'voiceDevices' });

export default VoiceDevice;
