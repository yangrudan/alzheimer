import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload,
  Calendar,
  MessageSquare,
  Brain,
  TrendingUp,
  Clock,
  Users,
  Smartphone,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { format } from 'date-fns'
import axios from 'axios'
import toast from 'react-hot-toast'

interface ConversationData {
  id: string
  userId: string
  title: string
  type: 'daily' | 'assessment' | 'therapeutic'
  duration: number
  moodScore: number
  engagementScore: number
  cognitiveScore: number
  createdAt: string
  messageCount?: number
  metadata?: {
    deviceId?: string
    deviceType?: string
    sessionId?: string
    [key: string]: any
  }
  analysis?: {
    success: boolean
    cognitiveMetrics?: {
      totalMessages: number
      totalWords: number
      avgResponseTime: number
      vocabularyComplexity: number
      emotionalTone: {
        positive: number
        neutral: number
        negative: number
      }
      coherenceScores: number[]
      memoryReferences: number
      overallScore: number
      avgCoherence: number
    }
    domainScores?: {
      memory: number
      attention: number
      executive: number
      language: number
      orientation: number
      visuospatial: number
    }
    recommendations?: string[]
  }
}

const UploadHistory = () => {
  const [conversations, setConversations] = useState<ConversationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Mock user ID - in a real app, this would come from auth context
  const userId = '550e8400-e29b-41d4-a716-446655440000'

  const fetchConversations = async () => {
    setLoading(true)
    setError(null)
    try {
      // Try to fetch from the API
      const response = await axios.get(`/api/conversations/user/${userId}`)
      
      if (response.data.success) {
        setConversations(response.data.data.conversations || [])
      } else {
        throw new Error('Failed to fetch conversations')
      }
    } catch (err: any) {
      console.error('Error fetching conversations:', err)
      
      // Use mock data for demonstration
      setConversations([
        {
          id: 'conv-001',
          userId: userId,
          title: '早晨对话',
          type: 'daily',
          duration: 15,
          moodScore: 8,
          engagementScore: 7,
          cognitiveScore: 75,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          messageCount: 12,
          metadata: {
            deviceId: 'xiaomi-speaker-001',
            deviceType: '小米小爱音箱',
            sessionId: 'session-20240115-001'
          },
          analysis: {
            success: true,
            cognitiveMetrics: {
              totalMessages: 12,
              totalWords: 156,
              avgResponseTime: 5.2,
              vocabularyComplexity: 7.5,
              emotionalTone: {
                positive: 8,
                neutral: 3,
                negative: 1
              },
              coherenceScores: [7, 8, 9, 7],
              memoryReferences: 2,
              overallScore: 75,
              avgCoherence: 7.8
            },
            domainScores: {
              memory: 7,
              attention: 8,
              executive: 7,
              language: 8,
              orientation: 7,
              visuospatial: 7
            },
            recommendations: [
              '认知状态良好，继续保持当前活动水平',
              '建议增加记忆训练活动'
            ]
          }
        },
        {
          id: 'conv-002',
          userId: userId,
          title: '回忆童年',
          type: 'therapeutic',
          duration: 25,
          moodScore: 9,
          engagementScore: 9,
          cognitiveScore: 82,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          messageCount: 18,
          metadata: {
            deviceId: 'alexa-echo-002',
            deviceType: 'Amazon Echo',
            sessionId: 'session-20240114-002'
          },
          analysis: {
            success: true,
            cognitiveMetrics: {
              totalMessages: 18,
              totalWords: 245,
              avgResponseTime: 6.1,
              vocabularyComplexity: 8.2,
              emotionalTone: {
                positive: 12,
                neutral: 5,
                negative: 1
              },
              coherenceScores: [8, 9, 9, 8, 9],
              memoryReferences: 5,
              overallScore: 82,
              avgCoherence: 8.6
            },
            domainScores: {
              memory: 9,
              attention: 8,
              executive: 8,
              language: 8,
              orientation: 8,
              visuospatial: 7
            },
            recommendations: [
              '认知状态优秀，保持良好习惯',
              '继续进行记忆回顾活动'
            ]
          }
        },
        {
          id: 'conv-003',
          userId: userId,
          title: 'MoCA认知评估',
          type: 'assessment',
          duration: 30,
          moodScore: 7,
          engagementScore: 8,
          cognitiveScore: 68,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          messageCount: 24,
          metadata: {
            deviceId: 'google-home-003',
            deviceType: 'Google Home',
            sessionId: 'session-20240112-003'
          },
          analysis: {
            success: true,
            cognitiveMetrics: {
              totalMessages: 24,
              totalWords: 312,
              avgResponseTime: 7.5,
              vocabularyComplexity: 6.8,
              emotionalTone: {
                positive: 6,
                neutral: 15,
                negative: 3
              },
              coherenceScores: [6, 7, 7, 8, 6],
              memoryReferences: 3,
              overallScore: 68,
              avgCoherence: 6.8
            },
            domainScores: {
              memory: 6,
              attention: 7,
              executive: 7,
              language: 7,
              orientation: 7,
              visuospatial: 6
            },
            recommendations: [
              '认知状态良好',
              '建议增加记忆训练频率',
              '保持规律作息'
            ]
          }
        }
      ])
      
      setError('使用模拟数据进行展示')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: '日常对话',
      assessment: '认知评估',
      therapeutic: '治疗训练'
    }
    return labels[type] || type
  }

  const getTypeBadgeClass = (type: string) => {
    const classes: Record<string, string> = {
      daily: 'bg-blue-100 text-blue-700',
      assessment: 'bg-purple-100 text-purple-700',
      therapeutic: 'bg-green-100 text-green-700'
    }
    return classes[type] || 'bg-gray-100 text-gray-700'
  }

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700'
    if (score >= 60) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm')
    } catch {
      return dateString
    }
  }

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMins < 60) return `${diffMins}分钟前`
      if (diffHours < 24) return `${diffHours}小时前`
      if (diffDays < 7) return `${diffDays}天前`
      return formatDate(dateString)
    } catch {
      return dateString
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Upload className="w-8 h-8 mr-3 text-primary-600" />
              上传历史记录
            </h1>
            <p className="mt-2 text-gray-600">
              查看所有通过智能音响上传的对话记录和认知分析结果
            </p>
          </div>
          <button
            onClick={fetchConversations}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* Error or Info Message */}
      {error && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-800">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && conversations.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无上传记录</h3>
          <p className="text-gray-600 mb-6">
            还没有通过API上传的对话记录
          </p>
          <Link
            to="/conversation"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            开始对话
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总对话数</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {conversations.length}
                  </p>
                </div>
                <MessageSquare className="w-10 h-10 text-primary-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均认知分数</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {Math.round(conversations.reduce((sum, c) => sum + c.cognitiveScore, 0) / conversations.length)}
                  </p>
                </div>
                <Brain className="w-10 h-10 text-primary-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均参与度</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(conversations.reduce((sum, c) => sum + c.engagementScore, 0) / conversations.length).toFixed(1)}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-primary-600" />
              </div>
            </div>
          </div>

          {/* Conversation List */}
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {conversation.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(conversation.type)}`}>
                          {getTypeLabel(conversation.type)}
                        </span>
                        {conversation.analysis?.success && (
                          <span className="flex items-center text-xs text-green-600">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            已分析
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {getRelativeTime(conversation.createdAt)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {conversation.duration}分钟
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {conversation.messageCount || 0}条消息
                        </span>
                        {conversation.metadata?.deviceType && (
                          <span className="flex items-center">
                            <Smartphone className="w-4 h-4 mr-1" />
                            {conversation.metadata.deviceType}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">认知分数</div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-bold ${getScoreBadgeClass(conversation.cognitiveScore)}`}>
                        {conversation.cognitiveScore}
                      </div>
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">情绪分数</div>
                      <div className="text-lg font-semibold text-gray-900">{conversation.moodScore}/10</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">参与度</div>
                      <div className="text-lg font-semibold text-gray-900">{conversation.engagementScore}/10</div>
                    </div>
                    {conversation.analysis?.cognitiveMetrics?.avgResponseTime && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">平均响应时间</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {conversation.analysis.cognitiveMetrics.avgResponseTime.toFixed(1)}秒
                        </div>
                      </div>
                    )}
                    {conversation.analysis?.cognitiveMetrics?.vocabularyComplexity && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">词汇复杂度</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {conversation.analysis.cognitiveMetrics.vocabularyComplexity.toFixed(1)}/10
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Domain Scores */}
                  {conversation.analysis?.domainScores && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">认知领域评分</div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {Object.entries(conversation.analysis.domainScores).map(([domain, score]) => {
                          const domainLabels: Record<string, string> = {
                            memory: '记忆',
                            attention: '注意力',
                            executive: '执行',
                            language: '语言',
                            orientation: '定向',
                            visuospatial: '视空间'
                          }
                          return (
                            <div key={domain} className="text-center p-2 bg-primary-50 rounded">
                              <div className="text-xs text-gray-600">{domainLabels[domain]}</div>
                              <div className="text-sm font-bold text-primary-700">{score}/10</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {conversation.analysis?.recommendations && conversation.analysis.recommendations.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">建议</div>
                      <ul className="space-y-1">
                        {conversation.analysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start">
                            <span className="text-primary-600 mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadHistory
