-- 阿兹海默预防对话系统数据库初始化脚本
-- 创建数据库和表结构

-- 创建数据库
CREATE DATABASE alzheimer_prevention;

-- 切换到新数据库
\c alzheimer_prevention;

-- 创建扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    phone_number VARCHAR(20),
    education_level VARCHAR(20) CHECK (education_level IN ('low', 'medium', 'high', 'university')),
    occupation VARCHAR(100),
    family_history BOOLEAN,
    medical_history TEXT,
    risk_level VARCHAR(10) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    last_assessment_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 对话表
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK (type IN ('daily', 'assessment', 'therapeutic')),
    duration INTEGER NOT NULL DEFAULT 0, -- 分钟
    mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
    engagement_score INTEGER NOT NULL CHECK (engagement_score >= 1 AND engagement_score <= 10),
    cognitive_score INTEGER CHECK (cognitive_score >= 1 AND cognitive_score <= 100),
    language_complexity INTEGER CHECK (language_complexity >= 1 AND language_complexity <= 10),
    memory_recall_score INTEGER CHECK (memory_recall_score >= 1 AND memory_recall_score <= 10),
    attention_score INTEGER CHECK (attention_score >= 1 AND attention_score <= 10),
    executive_function_score INTEGER CHECK (executive_function_score >= 1 AND executive_function_score <= 10),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 对话消息表
CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'system', 'assistant')),
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'question', 'assessment', 'feedback')),
    cognitive_metrics JSONB,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 认知评估表
CREATE TABLE cognitive_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(20) NOT NULL CHECK (assessment_type IN ('mmse', 'moca', 'custom', 'daily')),
    total_score INTEGER NOT NULL CHECK (total_score >= 0),
    max_score INTEGER NOT NULL CHECK (max_score >= 1),
    domain_scores JSONB NOT NULL DEFAULT '{}',
    risk_level VARCHAR(10) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    recommendations TEXT[] NOT NULL DEFAULT '{}',
    notes TEXT,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    next_assessment_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_risk_level ON users(risk_level);
CREATE INDEX idx_users_last_assessment_date ON users(last_assessment_date);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_type ON conversations(type);

CREATE INDEX idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_created_at ON conversation_messages(created_at);
CREATE INDEX idx_conversation_messages_sender ON conversation_messages(sender);

CREATE INDEX idx_cognitive_assessments_user_id ON cognitive_assessments(user_id);
CREATE INDEX idx_cognitive_assessments_completed_at ON cognitive_assessments(completed_at);
CREATE INDEX idx_cognitive_assessments_assessment_type ON cognitive_assessments(assessment_type);
CREATE INDEX idx_cognitive_assessments_risk_level ON cognitive_assessments(risk_level);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要updated_at的表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cognitive_assessments_updated_at BEFORE UPDATE ON cognitive_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据（用于测试）
INSERT INTO users (
    email, password, first_name, last_name, date_of_birth, gender,
    phone_number, education_level, occupation, family_history, medical_history, risk_level
) VALUES (
    'zhang@example.com',
    '$2b$10$YourHashedPasswordHere', -- 实际使用时需要bcrypt哈希
    '张',
    '先生',
    '1959-03-15',
    'male',
    '13800138000',
    'university',
    '退休教师',
    true,
    '高血压，控制良好',
    'medium'
);

-- 创建视图用于常用查询
CREATE VIEW user_conversation_stats AS
SELECT
    u.id as user_id,
    u.first_name,
    u.last_name,
    COUNT(c.id) as total_conversations,
    AVG(c.mood_score) as avg_mood_score,
    AVG(c.engagement_score) as avg_engagement_score,
    AVG(c.cognitive_score) as avg_cognitive_score,
    MAX(c.created_at) as last_conversation_date
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id
GROUP BY u.id, u.first_name, u.last_name;

CREATE VIEW user_assessment_trends AS
SELECT
    user_id,
    DATE_TRUNC('month', completed_at) as month,
    assessment_type,
    AVG(total_score::float / max_score * 100) as avg_percentage,
    COUNT(*) as assessment_count
FROM cognitive_assessments
GROUP BY user_id, DATE_TRUNC('month', completed_at), assessment_type;

-- 创建存储过程用于风险评估更新
CREATE OR REPLACE PROCEDURE update_user_risk_level(user_uuid UUID)
LANGUAGE plpgsql
AS $$
DECLARE
    avg_score DECIMAL;
    new_risk_level VARCHAR(10);
BEGIN
    -- 计算最近评估的平均分数
    SELECT AVG(total_score::decimal / max_score * 100)
    INTO avg_score
    FROM cognitive_assessments
    WHERE user_id = user_uuid
    AND completed_at >= CURRENT_DATE - INTERVAL '6 months';

    -- 确定风险等级
    IF avg_score IS NULL THEN
        new_risk_level := 'low';
    ELSIF avg_score < 60 THEN
        new_risk_level := 'high';
    ELSIF avg_score < 80 THEN
        new_risk_level := 'medium';
    ELSE
        new_risk_level := 'low';
    END IF;

    -- 更新用户风险等级
    UPDATE users
    SET risk_level = new_risk_level,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_uuid;

    -- 记录日志（实际应用中可能需要日志表）
    RAISE NOTICE 'Updated risk level for user % to %', user_uuid, new_risk_level;
END;
$$;

-- 创建函数用于获取用户认知健康报告
CREATE OR REPLACE FUNCTION get_user_cognitive_report(user_uuid UUID, months_back INTEGER DEFAULT 6)
RETURNS TABLE (
    period DATE,
    conversation_count BIGINT,
    avg_mood_score DECIMAL,
    avg_engagement_score DECIMAL,
    avg_cognitive_score DECIMAL,
    assessment_count BIGINT,
    avg_assessment_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT
            DATE_TRUNC('month', c.created_at) as period,
            COUNT(DISTINCT c.id) as conversation_count,
            AVG(c.mood_score) as avg_mood_score,
            AVG(c.engagement_score) as avg_engagement_score,
            AVG(c.cognitive_score) as avg_cognitive_score
        FROM conversations c
        WHERE c.user_id = user_uuid
        AND c.created_at >= CURRENT_DATE - (months_back || ' months')::INTERVAL
        GROUP BY DATE_TRUNC('month', c.created_at)
    ),
    monthly_assessments AS (
        SELECT
            DATE_TRUNC('month', ca.completed_at) as period,
            COUNT(*) as assessment_count,
            AVG(ca.total_score::decimal / ca.max_score * 100) as avg_assessment_score
        FROM cognitive_assessments ca
        WHERE ca.user_id = user_uuid
        AND ca.completed_at >= CURRENT_DATE - (months_back || ' months')::INTERVAL
        GROUP BY DATE_TRUNC('month', ca.completed_at)
    )
    SELECT
        COALESCE(md.period, ma.period) as period,
        COALESCE(md.conversation_count, 0) as conversation_count,
        md.avg_mood_score,
        md.avg_engagement_score,
        md.avg_cognitive_score,
        COALESCE(ma.assessment_count, 0) as assessment_count,
        ma.avg_assessment_score
    FROM monthly_data md
    FULL OUTER JOIN monthly_assessments ma ON md.period = ma.period
    ORDER BY period;
END;
$$ LANGUAGE plpgsql;

-- 注释说明
COMMENT ON DATABASE alzheimer_prevention IS '阿兹海默预防对话系统数据库';
COMMENT ON TABLE users IS '系统用户表，存储用户基本信息和健康数据';
COMMENT ON TABLE conversations IS '对话记录表，存储每次对话的基本信息和评估分数';
COMMENT ON TABLE conversation_messages IS '对话消息表，存储具体的对话内容';
COMMENT ON TABLE cognitive_assessments IS '认知评估表，存储正式的认知评估结果';

-- 输出完成信息
SELECT '数据库初始化完成！' as message;