-- =====================================================
-- PUSH NOTIFICATIONS SETUP
-- =====================================================
-- Run this in your Supabase SQL Editor to add push notification support
--
-- This adds push_token columns to user profiles so we can send
-- push notifications to users via Expo Push Notification service.
-- =====================================================

-- Add push_token column to fighters table
ALTER TABLE fighters
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add push_token column to gyms table
ALTER TABLE gyms
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add push_token column to coaches table (if exists)
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fighters_push_token ON fighters(push_token);
CREATE INDEX IF NOT EXISTS idx_gyms_push_token ON gyms(push_token);
CREATE INDEX IF NOT EXISTS idx_coaches_push_token ON coaches(push_token);

-- =====================================================
-- NOTIFICATION TRIGGERS (Optional)
-- =====================================================
-- These triggers automatically send push notifications for certain events
-- You can customize or remove these based on your needs

-- Function to send push notification when a new message is received
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_push_token TEXT;
  sender_name TEXT;
  conversation_participant_1 UUID;
  conversation_participant_2 UUID;
  recipient_id UUID;
BEGIN
  -- Get conversation participants
  SELECT participant_1_id, participant_2_id
  INTO conversation_participant_1, conversation_participant_2
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Determine recipient (the one who didn't send the message)
  IF conversation_participant_1 = NEW.sender_id THEN
    recipient_id := conversation_participant_2;
  ELSE
    recipient_id := conversation_participant_1;
  END IF;

  -- Get recipient's push token
  -- Try fighters table first
  SELECT push_token INTO recipient_push_token
  FROM fighters
  WHERE user_id = recipient_id;

  -- If not found, try gyms table
  IF recipient_push_token IS NULL THEN
    SELECT push_token INTO recipient_push_token
    FROM gyms
    WHERE user_id = recipient_id;
  END IF;

  -- If we have a push token, we would send a notification here
  -- In practice, this should be done via a backend service/edge function
  -- For now, we just log it
  IF recipient_push_token IS NOT NULL THEN
    RAISE LOG 'Would send push notification to token: % for message: %',
      recipient_push_token, NEW.message_text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- =====================================================
-- NOTIFICATION PREFERENCES TABLE (Optional)
-- =====================================================
-- Store user preferences for what notifications they want to receive

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  messages_enabled BOOLEAN DEFAULT true,
  events_enabled BOOLEAN DEFAULT true,
  sparring_requests_enabled BOOLEAN DEFAULT true,
  referrals_enabled BOOLEAN DEFAULT true,
  marketing_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- =====================================================
-- NOTIFICATION HISTORY TABLE (Optional)
-- =====================================================
-- Keep track of sent notifications for debugging/analytics

CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'message', 'event', 'sparring_request', 'referral'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  push_token TEXT,
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'delivered'
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Users can view their own notification history
CREATE POLICY "Users can view their own notification history"
  ON notification_history FOR SELECT
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at);

-- =====================================================
-- COMMENTS
-- =====================================================
-- To actually send push notifications, you need to:
-- 1. Set up an Expo account and get your project ID
-- 2. Update the projectId in src/services/notifications.ts
-- 3. Create an Edge Function or backend service to send notifications
--    (don't send from client-side for security)
-- 4. Call the Edge Function from these triggers or your app logic
--
-- Example Edge Function call (pseudo-code):
-- SELECT net.http_post(
--   url := 'https://your-project.supabase.co/functions/v1/send-notification',
--   headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
--   body := jsonb_build_object(
--     'pushToken', recipient_push_token,
--     'title', 'New Message',
--     'body', NEW.message_text
--   )
-- );
-- =====================================================

COMMENT ON TABLE notification_preferences IS 'User preferences for push notifications';
COMMENT ON TABLE notification_history IS 'History of sent push notifications for debugging';
COMMENT ON COLUMN fighters.push_token IS 'Expo push notification token';
COMMENT ON COLUMN gyms.push_token IS 'Expo push notification token';
