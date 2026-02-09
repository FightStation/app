-- =====================================================
-- MESSAGING SYSTEM TABLES FOR FIGHT STATION
-- =====================================================
-- Run this in your Supabase SQL Editor after running the main schema

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================
-- Represents 1-on-1 conversations between users

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Participants (always 2 for 1-on-1 chat)
  participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Last message preview
  last_message_text TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Unread counts (denormalized for performance)
  participant_1_unread_count INT DEFAULT 0,
  participant_2_unread_count INT DEFAULT 0,

  -- Constraints
  CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id),
  CONSTRAINT unique_conversation UNIQUE (participant_1_id, participant_2_id)
);

-- Index for finding conversations by participant
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1
  ON conversations(participant_1_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2
  ON conversations(participant_2_id, updated_at DESC);

-- Function to ensure participant_1_id < participant_2_id (canonical ordering)
CREATE OR REPLACE FUNCTION ensure_conversation_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.participant_1_id > NEW.participant_2_id THEN
    -- Swap participants to maintain canonical order
    DECLARE
      temp UUID;
      temp_count INT;
    BEGIN
      temp := NEW.participant_1_id;
      NEW.participant_1_id := NEW.participant_2_id;
      NEW.participant_2_id := temp;

      -- Swap unread counts too
      temp_count := NEW.participant_1_unread_count;
      NEW.participant_1_unread_count := NEW.participant_2_unread_count;
      NEW.participant_2_unread_count := temp_count;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce canonical ordering
CREATE TRIGGER conversation_order_trigger
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_conversation_order();

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
-- Individual messages within conversations

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Relationships
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message content
  message_text TEXT NOT NULL,

  -- Message metadata
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Optional: Message type (text, image, etc.)
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),

  -- Optional: Image URL if message_type = 'image'
  image_url TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages(conversation_id, is_read) WHERE is_read = false;

-- =====================================================
-- TRIGGERS FOR UPDATING CONVERSATION METADATA
-- =====================================================

-- Function to update conversation after new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
  other_participant_id UUID;
BEGIN
  -- Update conversation's last message info
  UPDATE conversations
  SET
    last_message_text = NEW.message_text,
    last_message_at = NEW.created_at,
    last_message_sender_id = NEW.sender_id,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  -- Increment unread count for the recipient
  SELECT CASE
    WHEN participant_1_id = NEW.sender_id THEN participant_2_id
    ELSE participant_1_id
  END INTO other_participant_id
  FROM conversations
  WHERE id = NEW.conversation_id;

  IF other_participant_id IS NOT NULL THEN
    UPDATE conversations
    SET
      participant_1_unread_count = CASE
        WHEN participant_1_id = other_participant_id
        THEN participant_1_unread_count + 1
        ELSE participant_1_unread_count
      END,
      participant_2_unread_count = CASE
        WHEN participant_2_id = other_participant_id
        THEN participant_2_unread_count + 1
        ELSE participant_2_unread_count
      END
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when message is inserted
CREATE TRIGGER message_insert_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Function to reset unread count when messages are marked as read
CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    UPDATE conversations
    SET
      participant_1_unread_count = CASE
        WHEN participant_1_id != NEW.sender_id THEN 0
        ELSE participant_1_unread_count
      END,
      participant_2_unread_count = CASE
        WHEN participant_2_id != NEW.sender_id THEN 0
        ELSE participant_2_unread_count
      END
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reset unread count
CREATE TRIGGER message_read_trigger
  AFTER UPDATE ON messages
  FOR EACH ROW
  WHEN (NEW.is_read = true AND OLD.is_read = false)
  EXECUTE FUNCTION reset_unread_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can only see conversations they're part of
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = participant_1_id OR
    auth.uid() = participant_2_id
  );

-- Conversations: Users can create conversations they're part of
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = participant_1_id OR
    auth.uid() = participant_2_id
  );

-- Conversations: Users can update conversations they're part of
CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = participant_1_id OR
    auth.uid() = participant_2_id
  );

-- Messages: Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.participant_1_id = auth.uid() OR
        conversations.participant_2_id = auth.uid()
      )
    )
  );

-- Messages: Users can send messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.participant_1_id = auth.uid() OR
        conversations.participant_2_id = auth.uid()
      )
    )
  );

-- Messages: Users can update their own messages (for read receipts)
CREATE POLICY "Users can update messages in their conversations"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.participant_1_id = auth.uid() OR
        conversations.participant_2_id = auth.uid()
      )
    )
  );

-- Messages: Users can soft-delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get or create a conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  p1_id UUID;
  p2_id UUID;
BEGIN
  -- Ensure canonical ordering
  IF user1_id < user2_id THEN
    p1_id := user1_id;
    p2_id := user2_id;
  ELSE
    p1_id := user2_id;
    p2_id := user1_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE participant_1_id = p1_id AND participant_2_id = p2_id;

  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant_1_id, participant_2_id)
    VALUES (p1_id, p2_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all messages in a conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  conv_id UUID,
  reader_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET is_read = true, read_at = now()
  WHERE conversation_id = conv_id
    AND sender_id != reader_id
    AND is_read = false;

  -- Reset unread count
  UPDATE conversations
  SET
    participant_1_unread_count = CASE
      WHEN participant_1_id = reader_id THEN 0
      ELSE participant_1_unread_count
    END,
    participant_2_unread_count = CASE
      WHEN participant_2_id = reader_id THEN 0
      ELSE participant_2_unread_count
    END
  WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable Realtime for messages and conversations
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('conversations', 'messages');

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages');

-- Verify policies were created
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages');
