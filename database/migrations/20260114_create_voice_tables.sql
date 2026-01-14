-- Voice integration tables for xiaogpt and smart speaker integration
-- Migration: 20260114_create_voice_tables

-- Table for registered voice devices (xiaogpt, smart speakers, etc.)
CREATE TABLE IF NOT EXISTS voice_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) UNIQUE NOT NULL, -- External device identifier
    device_type VARCHAR(50) NOT NULL, -- 'xiaogpt', 'alexa', 'google_home', etc.
    device_name VARCHAR(255) NOT NULL, -- User-friendly name
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Optional: link to user
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    api_version VARCHAR(20), -- API version for compatibility tracking
    last_active_at TIMESTAMP,
    metadata JSONB, -- Additional device-specific data
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for all voice interactions
CREATE TABLE IF NOT EXISTS voice_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255), -- Reference to external device (not FK for flexibility)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional: extracted or linked user
    intent VARCHAR(100) NOT NULL, -- Intent type: 'confirm_medication', 'query_reminders', 'emergency_call', etc.
    raw_payload JSONB NOT NULL, -- Original webhook payload
    processed_payload JSONB, -- Processed/normalized data
    response_data JSONB, -- Response sent back
    status VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
    error_message TEXT, -- Error details if status = 'failed'
    processing_time_ms INTEGER, -- Time taken to process request
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_devices_user_id ON voice_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_devices_device_id ON voice_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_voice_devices_status ON voice_devices(status);

CREATE INDEX IF NOT EXISTS idx_voice_audit_device_id ON voice_audit(device_id);
CREATE INDEX IF NOT EXISTS idx_voice_audit_user_id ON voice_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_audit_intent ON voice_audit(intent);
CREATE INDEX IF NOT EXISTS idx_voice_audit_status ON voice_audit(status);
CREATE INDEX IF NOT EXISTS idx_voice_audit_created_at ON voice_audit(created_at);

-- Comments for documentation
COMMENT ON TABLE voice_devices IS 'Registered voice devices (xiaogpt, smart speakers) for voice integration';
COMMENT ON TABLE voice_audit IS 'Audit log for all voice interactions and webhook calls';
COMMENT ON COLUMN voice_devices.device_id IS 'External unique identifier from the voice platform';
COMMENT ON COLUMN voice_audit.intent IS 'Intent type parsed from voice command (confirm_medication, query_reminders, emergency_call, etc.)';
COMMENT ON COLUMN voice_audit.raw_payload IS 'Original webhook payload as received';
