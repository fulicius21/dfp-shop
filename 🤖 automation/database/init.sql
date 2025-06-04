-- ================================================
-- DressForPleasure n8n Database Initialization
-- ================================================

-- Create n8n database and user (handled by Docker)
-- This script runs after the basic n8n setup

-- ================================================
-- Performance Optimizations for n8n
-- ================================================

-- Indexes for better n8n performance
CREATE INDEX IF NOT EXISTS idx_execution_entity_workflowid 
ON execution_entity (workflowid);

CREATE INDEX IF NOT EXISTS idx_execution_entity_startedAt 
ON execution_entity (startedat);

CREATE INDEX IF NOT EXISTS idx_execution_entity_finished 
ON execution_entity (finished);

CREATE INDEX IF NOT EXISTS idx_execution_entity_mode 
ON execution_entity (mode);

-- Index for workflow executions by status
CREATE INDEX IF NOT EXISTS idx_execution_entity_status 
ON execution_entity ((data->>'finished'), (data->>'success'));

-- ================================================
-- Custom Tables for DressForPleasure Analytics
-- ================================================

-- Table for storing automation logs
CREATE TABLE IF NOT EXISTS automation_logs (
    id SERIAL PRIMARY KEY,
    workflow_name VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for automation logs
CREATE INDEX IF NOT EXISTS idx_automation_logs_workflow_name 
ON automation_logs (workflow_name);

CREATE INDEX IF NOT EXISTS idx_automation_logs_event_type 
ON automation_logs (event_type);

CREATE INDEX IF NOT EXISTS idx_automation_logs_status 
ON automation_logs (status);

CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at 
ON automation_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_automation_logs_data_gin 
ON automation_logs USING GIN (data);

-- ================================================
-- Workflow Performance Tracking
-- ================================================

-- Table for tracking workflow performance metrics
CREATE TABLE IF NOT EXISTS workflow_performance (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(255) NOT NULL,
    workflow_name VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    node_count INTEGER,
    data_processed_mb DECIMAL(10,2),
    triggered_by VARCHAR(100),
    webhook_path VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance tracking
CREATE INDEX IF NOT EXISTS idx_workflow_performance_workflow_id 
ON workflow_performance (workflow_id);

CREATE INDEX IF NOT EXISTS idx_workflow_performance_start_time 
ON workflow_performance (start_time);

CREATE INDEX IF NOT EXISTS idx_workflow_performance_status 
ON workflow_performance (status);

CREATE INDEX IF NOT EXISTS idx_workflow_performance_duration 
ON workflow_performance (duration_ms);

-- ================================================
-- Business Metrics Tables
-- ================================================

-- Table for storing daily business metrics
CREATE TABLE IF NOT EXISTS daily_business_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    new_customers INTEGER DEFAULT 0,
    cart_recoveries INTEGER DEFAULT 0,
    cart_recovery_revenue DECIMAL(12,2) DEFAULT 0.00,
    newsletter_signups INTEGER DEFAULT 0,
    support_tickets INTEGER DEFAULT 0,
    system_uptime_percent DECIMAL(5,2) DEFAULT 0.00,
    avg_response_time_ms INTEGER DEFAULT 0,
    data_processed_gb DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(metric_date)
);

-- Index for daily metrics
CREATE INDEX IF NOT EXISTS idx_daily_business_metrics_date 
ON daily_business_metrics (metric_date);

-- ================================================
-- DSGVO Compliance Tracking
-- ================================================

-- Table for DSGVO compliance audit trail
CREATE TABLE IF NOT EXISTS dsgvo_audit_log (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL, -- 'data_deletion', 'consent_renewal', 'data_access', etc.
    affected_entity VARCHAR(100) NOT NULL, -- 'customer', 'order', 'marketing_data', etc.
    entity_id VARCHAR(255), -- customer_id, order_id, etc.
    data_before JSONB,
    data_after JSONB,
    legal_basis VARCHAR(255),
    retention_period INTEGER, -- in days
    scheduled_deletion_date DATE,
    performed_by VARCHAR(255) DEFAULT 'automation',
    automated BOOLEAN DEFAULT true,
    compliance_score INTEGER, -- 0-100
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for DSGVO audit
CREATE INDEX IF NOT EXISTS idx_dsgvo_audit_action_type 
ON dsgvo_audit_log (action_type);

CREATE INDEX IF NOT EXISTS idx_dsgvo_audit_entity 
ON dsgvo_audit_log (affected_entity, entity_id);

CREATE INDEX IF NOT EXISTS idx_dsgvo_audit_deletion_date 
ON dsgvo_audit_log (scheduled_deletion_date);

CREATE INDEX IF NOT EXISTS idx_dsgvo_audit_created_at 
ON dsgvo_audit_log (created_at);

-- ================================================
-- Backup & Recovery Tracking
-- ================================================

-- Table for backup history
CREATE TABLE IF NOT EXISTS backup_history (
    id SERIAL PRIMARY KEY,
    backup_timestamp VARCHAR(50) NOT NULL,
    backup_type VARCHAR(100) NOT NULL, -- 'full', 'incremental', 'database', 'files'
    status VARCHAR(50) NOT NULL, -- 'success', 'partial', 'failed'
    total_size_bytes BIGINT DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    files_count INTEGER DEFAULT 0,
    compressed BOOLEAN DEFAULT false,
    encrypted BOOLEAN DEFAULT false,
    storage_location VARCHAR(255), -- 'local', 'aws_s3', 'google_drive'
    backup_path TEXT,
    verification_status VARCHAR(50), -- 'verified', 'failed', 'pending'
    retention_until DATE,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for backup history
CREATE INDEX IF NOT EXISTS idx_backup_history_timestamp 
ON backup_history (backup_timestamp);

CREATE INDEX IF NOT EXISTS idx_backup_history_type_status 
ON backup_history (backup_type, status);

CREATE INDEX IF NOT EXISTS idx_backup_history_retention 
ON backup_history (retention_until);

-- ================================================
-- System Health Monitoring
-- ================================================

-- Table for system health checks
CREATE TABLE IF NOT EXISTS system_health_log (
    id SERIAL PRIMARY KEY,
    check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    service_name VARCHAR(100) NOT NULL, -- 'backend_api', 'frontend', 'database', 'email'
    status VARCHAR(50) NOT NULL, -- 'healthy', 'degraded', 'down'
    response_time_ms INTEGER,
    uptime_percent DECIMAL(5,2),
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    details JSONB,
    alert_sent BOOLEAN DEFAULT false,
    recovery_time TIMESTAMP WITH TIME ZONE
);

-- Indexes for health monitoring
CREATE INDEX IF NOT EXISTS idx_system_health_timestamp 
ON system_health_log (check_timestamp);

CREATE INDEX IF NOT EXISTS idx_system_health_service 
ON system_health_log (service_name, status);

CREATE INDEX IF NOT EXISTS idx_system_health_response_time 
ON system_health_log (response_time_ms);

-- ================================================
-- Analytics Views for Reporting
-- ================================================

-- View for workflow success rates
CREATE OR REPLACE VIEW workflow_success_rates AS
SELECT 
    workflow_name,
    COUNT(*) as total_executions,
    COUNT(*) FILTER (WHERE status = 'success') as successful_executions,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'success')::decimal / COUNT(*) * 100, 2
    ) as success_rate_percent,
    AVG(duration_ms) as avg_duration_ms,
    MIN(start_time) as first_execution,
    MAX(start_time) as last_execution
FROM workflow_performance 
WHERE start_time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY workflow_name
ORDER BY success_rate_percent DESC;

-- View for daily automation summary
CREATE OR REPLACE VIEW daily_automation_summary AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE status = 'success') as successful_events,
    COUNT(*) FILTER (WHERE status = 'error') as failed_events,
    COUNT(DISTINCT workflow_name) as active_workflows,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'success')::decimal / COUNT(*) * 100, 2
    ) as success_rate
FROM automation_logs 
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ================================================
-- Maintenance Functions
-- ================================================

-- Function to clean up old execution data
CREATE OR REPLACE FUNCTION cleanup_old_executions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete executions older than 30 days
    DELETE FROM execution_entity 
    WHERE startedat < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup
    INSERT INTO automation_logs (
        workflow_name, 
        event_type, 
        status, 
        message, 
        data
    ) VALUES (
        'system_maintenance', 
        'execution_cleanup', 
        'success', 
        'Cleaned up old executions',
        jsonb_build_object('deleted_count', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate workflow statistics
CREATE OR REPLACE FUNCTION calculate_workflow_stats(workflow_name_param VARCHAR)
RETURNS TABLE(
    avg_duration DECIMAL,
    success_rate DECIMAL,
    total_executions INTEGER,
    last_execution TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        AVG(wp.duration_ms)::DECIMAL as avg_duration,
        (COUNT(*) FILTER (WHERE wp.status = 'success')::DECIMAL / COUNT(*) * 100) as success_rate,
        COUNT(*)::INTEGER as total_executions,
        MAX(wp.start_time) as last_execution
    FROM workflow_performance wp
    WHERE wp.workflow_name = workflow_name_param
    AND wp.start_time >= CURRENT_DATE - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- Triggers for Automatic Updates
-- ================================================

-- Trigger to update automation_logs updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_logs_updated_at
    BEFORE UPDATE ON automation_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_business_metrics_updated_at
    BEFORE UPDATE ON daily_business_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- Sample Data for Testing (Optional)
-- ================================================

-- Insert some sample automation logs for testing
-- INSERT INTO automation_logs (workflow_name, event_type, status, message, data) VALUES
-- ('test_workflow', 'workflow_start', 'success', 'Test workflow started', '{"test": true}'),
-- ('test_workflow', 'workflow_complete', 'success', 'Test workflow completed', '{"duration": 1500}');

-- ================================================
-- Database Maintenance Scheduled Jobs
-- ================================================

-- Note: The following would typically be set up as cron jobs or n8n workflows

-- Daily cleanup job (to be implemented in n8n workflow)
-- SELECT cleanup_old_executions();

-- Weekly statistics update (to be implemented in n8n workflow)
-- REFRESH MATERIALIZED VIEW IF EXISTS workflow_statistics;

-- ================================================
-- Comments and Documentation
-- ================================================

COMMENT ON TABLE automation_logs IS 'Stores logs from n8n workflows for audit and debugging';
COMMENT ON TABLE workflow_performance IS 'Tracks performance metrics for workflow optimization';
COMMENT ON TABLE daily_business_metrics IS 'Aggregated daily business metrics for reporting';
COMMENT ON TABLE dsgvo_audit_log IS 'DSGVO compliance audit trail for data protection';
COMMENT ON TABLE backup_history IS 'History of all backup operations for disaster recovery';
COMMENT ON TABLE system_health_log IS 'System health monitoring data for alerting';

-- ================================================
-- Grant Permissions
-- ================================================

-- Grant permissions to n8n user (adjust as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO n8n_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO n8n_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO n8n_user;

-- ================================================
-- Final Setup Complete
-- ================================================

-- Log successful database initialization
INSERT INTO automation_logs (
    workflow_name, 
    event_type, 
    status, 
    message, 
    data
) VALUES (
    'database_setup', 
    'initialization', 
    'success', 
    'Database successfully initialized for DressForPleasure n8n automation',
    jsonb_build_object(
        'timestamp', CURRENT_TIMESTAMP,
        'version', '1.0',
        'tables_created', 6,
        'views_created', 2,
        'functions_created', 2
    )
);

-- Display setup completion message
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'DressForPleasure n8n Database Setup Complete!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Tables created: %, %, %, %, %, %', 
        'automation_logs', 'workflow_performance', 'daily_business_metrics',
        'dsgvo_audit_log', 'backup_history', 'system_health_log';
    RAISE NOTICE 'Views created: %, %', 
        'workflow_success_rates', 'daily_automation_summary';
    RAISE NOTICE 'Functions created: %, %', 
        'cleanup_old_executions', 'calculate_workflow_stats';
    RAISE NOTICE '================================================';
END $$;