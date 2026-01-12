import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

interface ConversationAttributes {
  id: string;
  userId: string;
  title: string;
  type: 'daily' | 'assessment' | 'therapeutic';
  duration: number; // in minutes
  moodScore: number; // 1-10
  engagementScore: number; // 1-10
  cognitiveScore?: number; // 1-100
  languageComplexity?: number; // 1-10
  memoryRecallScore?: number; // 1-10
  attentionScore?: number; // 1-10
  executiveFunctionScore?: number; // 1-10
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  public id!: string;
  public userId!: string;
  public title!: string;
  public type!: 'daily' | 'assessment' | 'therapeutic';
  public duration!: number;
  public moodScore!: number;
  public engagementScore!: number;
  public cognitiveScore?: number;
  public languageComplexity?: number;
  public memoryRecallScore?: number;
  public attentionScore?: number;
  public executiveFunctionScore?: number;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: User;

  // Instance methods
  public getOverallScore(): number {
    const scores = [
      this.cognitiveScore || 0,
      this.memoryRecallScore || 0,
      this.attentionScore || 0,
      this.executiveFunctionScore || 0,
    ].filter(score => score > 0);

    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  public getCognitiveHealthLevel(): 'excellent' | 'good' | 'fair' | 'poor' {
    const overallScore = this.getOverallScore();
    if (overallScore >= 80) return 'excellent';
    if (overallScore >= 60) return 'good';
    if (overallScore >= 40) return 'fair';
    return 'poor';
  }

  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    const healthLevel = this.getCognitiveHealthLevel();

    if (healthLevel === 'poor' || healthLevel === 'fair') {
      recommendations.push('建议增加社交互动频率');
      recommendations.push('进行记忆训练游戏');
      recommendations.push('保持规律作息');
    }

    if (this.memoryRecallScore && this.memoryRecallScore < 6) {
      recommendations.push('加强短期记忆训练');
    }

    if (this.attentionScore && this.attentionScore < 6) {
      recommendations.push('练习专注力训练');
    }

    if (this.moodScore < 5) {
      recommendations.push('关注情绪健康，建议与家人朋友多交流');
    }

    return recommendations;
  }
}

Conversation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('daily', 'assessment', 'therapeutic'),
      allowNull: false,
      defaultValue: 'daily',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    moodScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10,
      },
    },
    engagementScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10,
      },
    },
    cognitiveScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 100,
      },
    },
    languageComplexity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },
    memoryRecallScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },
    attentionScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },
    executiveFunctionScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'conversations',
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

// Define associations
Conversation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Conversation, { foreignKey: 'userId', as: 'conversations' });

export default Conversation;