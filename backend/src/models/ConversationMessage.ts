import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Conversation from './Conversation';

interface ConversationMessageAttributes {
  id: string;
  conversationId: string;
  sender: 'user' | 'system' | 'assistant';
  content: string;
  messageType: 'text' | 'question' | 'assessment' | 'feedback';
  cognitiveMetrics?: {
    responseTime?: number; // in seconds
    wordCount?: number;
    vocabularyComplexity?: number; // 1-10
    emotionalTone?: 'positive' | 'neutral' | 'negative';
    coherenceScore?: number; // 1-10
    memoryReferences?: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
}

interface ConversationMessageCreationAttributes extends Optional<ConversationMessageAttributes, 'id' | 'createdAt'> {}

class ConversationMessage extends Model<ConversationMessageAttributes, ConversationMessageCreationAttributes> implements ConversationMessageAttributes {
  public id!: string;
  public conversationId!: string;
  public sender!: 'user' | 'system' | 'assistant';
  public content!: string;
  public messageType!: 'text' | 'question' | 'assessment' | 'feedback';
  public cognitiveMetrics?: {
    responseTime?: number;
    wordCount?: number;
    vocabularyComplexity?: number;
    emotionalTone?: 'positive' | 'neutral' | 'negative';
    coherenceScore?: number;
    memoryReferences?: number;
  };
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;

  // Associations
  public readonly conversation?: Conversation;

  // Instance methods
  public analyzeCognitiveMetrics(): void {
    if (this.sender === 'user') {
      const content = this.content;
      const words = content.split(/\s+/);

      this.cognitiveMetrics = {
        wordCount: words.length,
        responseTime: this.cognitiveMetrics?.responseTime || 0,
        vocabularyComplexity: this.calculateVocabularyComplexity(words),
        emotionalTone: this.analyzeEmotionalTone(content),
        coherenceScore: this.analyzeCoherence(content),
        memoryReferences: this.countMemoryReferences(content),
      };
    }
  }

  private calculateVocabularyComplexity(words: string[]): number {
    // Simple vocabulary complexity calculation
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const complexity = (uniqueWords.size / words.length) * 10;
    return Math.min(Math.max(complexity, 1), 10);
  }

  private analyzeEmotionalTone(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['好', '开心', '高兴', '喜欢', '爱', '幸福', '快乐', '满意'];
    const negativeWords = ['不好', '难过', '伤心', '讨厌', '恨', '痛苦', '生气', '失望'];

    const lowerContent = content.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerContent.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerContent.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private analyzeCoherence(content: string): number {
    // Simple coherence analysis based on sentence structure
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 5;

    let coherenceScore = 5;

    // Check for logical connectors
    const connectors = ['因为', '所以', '但是', '而且', '然后', '接着'];
    const connectorCount = connectors.filter(connector => content.includes(connector)).length;
    coherenceScore += Math.min(connectorCount, 3);

    // Penalize for very short or fragmented sentences
    if (sentences.length > 3 && sentences.every(s => s.length < 10)) {
      coherenceScore -= 2;
    }

    return Math.min(Math.max(coherenceScore, 1), 10);
  }

  private countMemoryReferences(content: string): number {
    const memoryPatterns = [
      /记得/g,
      /回忆/g,
      /以前/g,
      /过去/g,
      /小时候/g,
      /多年前/g,
      /曾经/g,
    ];

    let count = 0;
    memoryPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) count += matches.length;
    });

    return count;
  }
}

ConversationMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id',
      },
    },
    sender: {
      type: DataTypes.ENUM('user', 'system', 'assistant'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    messageType: {
      type: DataTypes.ENUM('text', 'question', 'assessment', 'feedback'),
      allowNull: false,
      defaultValue: 'text',
    },
    cognitiveMetrics: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'conversation_messages',
    indexes: [
      {
        fields: ['conversationId'],
      },
      {
        fields: ['createdAt'],
      },
      {
        fields: ['sender'],
      },
    ],
    hooks: {
      beforeCreate: (message: ConversationMessage) => {
        if (message.sender === 'user') {
          message.analyzeCognitiveMetrics();
        }
      },
    },
  }
);

// Define associations
ConversationMessage.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Conversation.hasMany(ConversationMessage, { foreignKey: 'conversationId', as: 'messages' });

export default ConversationMessage;