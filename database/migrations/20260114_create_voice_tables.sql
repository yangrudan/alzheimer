-- 语音/智能音箱集成数据库迁移脚本
-- 创建 voice_devices 和 voice_audit 表

-- 注意：此脚本依赖于 update_updated_at_column() 函数
-- 该函数应该在主数据库初始化脚本 (database/init.sql) 中已经创建
-- 如果运行此脚本时出现 "function update_updated_at_column() does not exist" 错误，
-- 请先运行主数据库初始化脚本

-- 语音设备表
-- 存储注册的语音设备信息（小米音箱、小爱同学等）
CREATE TABLE IF NOT EXISTS voice_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('xiaogpt', 'xiaoai', 'tmall_genie', 'dueros', 'other')),
    owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_active_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 语音审计日志表
-- 记录所有语音请求和响应，用于审计和分析
CREATE TABLE IF NOT EXISTS voice_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_id VARCHAR(255),
    intent VARCHAR(100) NOT NULL,
    slots JSONB DEFAULT '{}',
    raw_payload JSONB,
    reply TEXT,
    action VARCHAR(50),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_voice_devices_device_id ON voice_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_voice_devices_owner_user_id ON voice_devices(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_voice_devices_platform ON voice_devices(platform);
CREATE INDEX IF NOT EXISTS idx_voice_devices_is_active ON voice_devices(is_active);

CREATE INDEX IF NOT EXISTS idx_voice_audit_device_id ON voice_audit(device_id);
CREATE INDEX IF NOT EXISTS idx_voice_audit_user_id ON voice_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_audit_platform ON voice_audit(platform);
CREATE INDEX IF NOT EXISTS idx_voice_audit_intent ON voice_audit(intent);
CREATE INDEX IF NOT EXISTS idx_voice_audit_created_at ON voice_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_audit_success ON voice_audit(success);

-- 为 voice_devices 表创建 updated_at 触发器
CREATE TRIGGER update_voice_devices_updated_at BEFORE UPDATE ON voice_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 注释说明
COMMENT ON TABLE voice_devices IS '语音设备表，存储已注册的语音设备信息';
COMMENT ON TABLE voice_audit IS '语音审计日志表，记录所有语音请求和响应';

COMMENT ON COLUMN voice_devices.device_id IS '设备唯一标识符';
COMMENT ON COLUMN voice_devices.platform IS '设备平台：xiaogpt, xiaoai, tmall_genie, dueros等';
COMMENT ON COLUMN voice_devices.owner_user_id IS '设备所有者用户ID';
COMMENT ON COLUMN voice_devices.metadata IS '设备元数据（JSON格式）';
COMMENT ON COLUMN voice_devices.is_active IS '设备是否激活';
COMMENT ON COLUMN voice_devices.last_active_at IS '最后活跃时间';

COMMENT ON COLUMN voice_audit.device_id IS '发起请求的设备ID';
COMMENT ON COLUMN voice_audit.platform IS '设备平台';
COMMENT ON COLUMN voice_audit.user_id IS '关联的用户ID';
COMMENT ON COLUMN voice_audit.request_id IS '请求唯一标识符';
COMMENT ON COLUMN voice_audit.intent IS '语音意图（confirm_medication, query_reminders等）';
COMMENT ON COLUMN voice_audit.slots IS '意图槽位数据（JSON格式）';
COMMENT ON COLUMN voice_audit.raw_payload IS '原始请求数据（JSON格式）';
COMMENT ON COLUMN voice_audit.reply IS '系统回复内容';
COMMENT ON COLUMN voice_audit.action IS '执行的操作类型';
COMMENT ON COLUMN voice_audit.success IS '请求是否成功处理';
COMMENT ON COLUMN voice_audit.error_message IS '错误信息（如果失败）';
COMMENT ON COLUMN voice_audit.processing_time_ms IS '处理时间（毫秒）';
