import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

interface CognitiveAssessmentAttributes {
  id: string;
  userId: string;
  assessmentType: 'mmse' | 'moca' | 'custom' | 'daily';
  totalScore: number;
  maxScore: number;
  domainScores: {
    orientation?: number;
    memory?: number;
    attention?: number;
    language?: number;
    visuospatial?: number;
    executive?: number;
    recall?: number;
  };
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  notes?: string;
  completedAt: Date;
  nextAssessmentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CognitiveAssessmentCreationAttributes extends Optional<CognitiveAssessmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CognitiveAssessment extends Model<CognitiveAssessmentAttributes, CognitiveAssessmentCreationAttributes> implements CognitiveAssessmentAttributes {
  public id!: string;
  public userId!: string;
  public assessmentType!: 'mmse' | 'moca' | 'custom' | 'daily';
  public totalScore!: number;
  public maxScore!: number;
  public domainScores!: {
    orientation?: number;
    memory?: number;
    attention?: number;
    language?: number;
    visuospatial?: number;
    executive?: number;
    recall?: number;
  };
  public riskLevel!: 'low' | 'medium' | 'high';
  public recommendations!: string[];
  public notes?: string;
  public completedAt!: Date;
  public nextAssessmentDate?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public readonly user?: User;

  // Instance methods
  public getPercentageScore(): number {
    return (this.totalScore / this.maxScore) * 100;
  }

  public getCognitiveHealthStatus(): 'normal' | 'mild' | 'moderate' | 'severe' {
    const percentage = this.getPercentageScore();

    switch (this.assessmentType) {
      case 'mmse':
        if (percentage >= 85) return 'normal';
        if (percentage >= 70) return 'mild';
        if (percentage >= 50) return 'moderate';
        return 'severe';

      case 'moca':
        if (percentage >= 85) return 'normal';
        if (percentage >= 70) return 'mild';
        if (percentage >= 50) return 'moderate';
        return 'severe';

      default:
        if (percentage >= 80) return 'normal';
        if (percentage >= 60) return 'mild';
        if (percentage >= 40) return 'moderate';
        return 'severe';
    }
  }

  public generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const healthStatus = this.getCognitiveHealthStatus();
    const domainScores = this.domainScores;

    // General recommendations based on health status
    if (healthStatus === 'mild') {
      recommendations.push('建议进行认知训练游戏');
      recommendations.push('保持社交活动，每周至少3次');
      recommendations.push('进行有氧运动，每周150分钟');
    } else if (healthStatus === 'moderate' || healthStatus === 'severe') {
      recommendations.push('建议咨询专业医生');
      recommendations.push('进行系统的认知康复训练');
      recommendations.push('家人需要加强关注和支持');
    }

    // Domain-specific recommendations
    if (domainScores.memory && domainScores.memory < 6) {
      recommendations.push('加强记忆训练，如记单词、回忆事件');
    }

    if (domainScores.attention && domainScores.attention < 6) {
      recommendations.push('练习专注力训练，如冥想、阅读');
    }

    if (domainScores.language && domainScores.language < 6) {
      recommendations.push('多进行语言交流，如朗读、对话');
    }

    if (domainScores.executive && domainScores.executive < 6) {
      recommendations.push('进行计划和组织能力训练');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  public calculateRiskLevel(): 'low' | 'medium' | 'high' {
    const percentage = this.getPercentageScore();
    const healthStatus = this.getCognitiveHealthStatus();

    if (healthStatus === 'severe') return 'high';
    if (healthStatus === 'moderate') return 'medium';
    if (healthStatus === 'mild') return 'medium';
    return 'low';
  }
}

CognitiveAssessment.init(
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
    assessmentType: {
      type: DataTypes.ENUM('mmse', 'moca', 'custom', 'daily'),
      allowNull: false,
    },
    totalScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    maxScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    domainScores: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'low',
    },
    recommendations: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    nextAssessmentDate: {
      type: DataTypes.DATE,
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
    tableName: 'cognitive_assessments',
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['completedAt'],
      },
      {
        fields: ['assessmentType'],
      },
    ],
    hooks: {
      beforeCreate: (assessment: CognitiveAssessment) => {
        assessment.riskLevel = assessment.calculateRiskLevel();
        assessment.recommendations = assessment.generateRecommendations();

        // Set next assessment date based on risk level
        const nextDate = new Date(assessment.completedAt);
        if (assessment.riskLevel === 'high') {
          nextDate.setMonth(nextDate.getMonth() + 1); // 1 month for high risk
        } else if (assessment.riskLevel === 'medium') {
          nextDate.setMonth(nextDate.getMonth() + 3); // 3 months for medium risk
        } else {
          nextDate.setMonth(nextDate.getMonth() + 6); // 6 months for low risk
        }
        assessment.nextAssessmentDate = nextDate;
      },
    },
  }
);

// Define associations
CognitiveAssessment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(CognitiveAssessment, { foreignKey: 'userId', as: 'assessments' });

export default CognitiveAssessment;