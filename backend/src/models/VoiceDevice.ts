import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * VoiceDevice 属性接口
 * 定义语音设备的所有字段
 */
interface VoiceDeviceAttributes {
  id: string;
  deviceId: string;
  platform: 'xiaogpt' | 'xiaoai' | 'tmall_genie' | 'dueros' | 'other';
  ownerUserId?: string;
  deviceName?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * VoiceDevice 创建属性接口
 * 创建时可选的字段
 */
interface VoiceDeviceCreationAttributes 
  extends Optional<VoiceDeviceAttributes, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> {}

/**
 * VoiceDevice 模型类
 * 表示一个已注册的语音设备（如小米音箱、小爱同学等）
 * 
 * @class VoiceDevice
 * @extends {Model<VoiceDeviceAttributes, VoiceDeviceCreationAttributes>}
 */
class VoiceDevice extends Model<VoiceDeviceAttributes, VoiceDeviceCreationAttributes> 
  implements VoiceDeviceAttributes {
  
  public id!: string;
  public deviceId!: string;
  public platform!: 'xiaogpt' | 'xiaoai' | 'tmall_genie' | 'dueros' | 'other';
  public ownerUserId?: string;
  public deviceName?: string;
  public metadata?: Record<string, any>;
  public isActive!: boolean;
  public lastActiveAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * 更新设备的最后活跃时间
   */
  public async updateLastActive(): Promise<void> {
    this.lastActiveAt = new Date();
    await this.save();
  }

  /**
   * 激活设备
   */
  public async activate(): Promise<void> {
    this.isActive = true;
    await this.save();
  }

  /**
   * 停用设备
   */
  public async deactivate(): Promise<void> {
    this.isActive = false;
    await this.save();
  }
}

/**
 * 初始化 VoiceDevice 模型
 */
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
    platform: {
      type: DataTypes.ENUM('xiaogpt', 'xiaoai', 'tmall_genie', 'dueros', 'other'),
      allowNull: false,
    },
    ownerUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'owner_user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    deviceName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'device_name',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_active_at',
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
    timestamps: true,
    underscored: true,
  }
);

export default VoiceDevice;
