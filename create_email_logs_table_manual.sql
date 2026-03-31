-- Manual SQL to create email_logs table in Supabase
-- Execute this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SENT', 'FAILED')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_id TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- Add comments for documentation
COMMENT ON TABLE email_logs IS 'Logs all email send attempts through the Greetflow system';
COMMENT ON COLUMN email_logs.status IS 'Email delivery status: SENT or FAILED';
COMMENT ON COLUMN email_logs.message_id IS 'SMTP message ID returned by the email service';
COMMENT ON COLUMN email_logs.error_message IS 'Error details if email sending failed';

-- Insert a test record to verify table creation
INSERT INTO email_logs (recipient_email, subject, status, message_id) 
VALUES ('test@example.com', 'Test Email Log Entry', 'SENT', 'test-message-id-123');

-- Verify the table was created successfully
SELECT COUNT(*) as total_logs FROM email_logs;
