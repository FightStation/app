-- Additional tables for referral tracking and event requests
-- Run this SQL in your Supabase SQL Editor after running the main schema

-- Pending referrals (temporary storage before profile is created)
CREATE TABLE IF NOT EXISTS pending_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  referral_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_referrals_user_id ON pending_referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_referrals_code ON pending_referrals(referral_code);

ALTER TABLE pending_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own pending referral"
  ON pending_referrals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own pending referral"
  ON pending_referrals FOR SELECT
  USING (auth.uid() = user_id);

-- Event requests/RSVPs
CREATE TABLE IF NOT EXISTS event_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  fighter_id UUID REFERENCES fighters(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, fighter_id)
);

CREATE INDEX IF NOT EXISTS idx_event_requests_event_id ON event_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_fighter_id ON event_requests(fighter_id);
CREATE INDEX IF NOT EXISTS idx_event_requests_status ON event_requests(status);

ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event requests are viewable by event owner and requester"
  ON event_requests FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM fighters WHERE id = fighter_id
      UNION
      SELECT g.user_id FROM gyms g
      INNER JOIN events e ON e.gym_id = g.id
      WHERE e.id = event_id
    )
  );

CREATE POLICY "Fighters can create event requests"
  ON event_requests FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM fighters WHERE id = fighter_id
    )
  );

CREATE POLICY "Fighters and gym owners can update event requests"
  ON event_requests FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM fighters WHERE id = fighter_id
      UNION
      SELECT g.user_id FROM gyms g
      INNER JOIN events e ON e.gym_id = g.id
      WHERE e.id = event_id
    )
  );

-- Function to process pending referrals when profile is created
CREATE OR REPLACE FUNCTION process_pending_referral()
RETURNS TRIGGER AS $$
DECLARE
  pending_code TEXT;
  referrer_user_id UUID;
BEGIN
  -- Check if there's a pending referral for this user
  SELECT referral_code INTO pending_code
  FROM pending_referrals
  WHERE user_id = NEW.user_id;

  IF pending_code IS NOT NULL THEN
    -- Get the referrer's user_id from the code
    SELECT user_id INTO referrer_user_id
    FROM referral_codes
    WHERE code = pending_code AND is_active = true;

    IF referrer_user_id IS NOT NULL THEN
      -- Create the referral relationship
      INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
      VALUES (referrer_user_id, NEW.user_id, pending_code, 'completed')
      ON CONFLICT (referred_id) DO NOTHING;

      -- Clean up pending referral
      DELETE FROM pending_referrals WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for fighters
DROP TRIGGER IF EXISTS trigger_process_pending_referral_fighter ON fighters;
CREATE TRIGGER trigger_process_pending_referral_fighter
AFTER INSERT ON fighters
FOR EACH ROW
EXECUTE FUNCTION process_pending_referral();

-- Trigger for gyms
DROP TRIGGER IF EXISTS trigger_process_pending_referral_gym ON gyms;
CREATE TRIGGER trigger_process_pending_referral_gym
AFTER INSERT ON gyms
FOR EACH ROW
EXECUTE FUNCTION process_pending_referral();

-- Trigger for coaches
DROP TRIGGER IF EXISTS trigger_process_pending_referral_coach ON coaches;
CREATE TRIGGER trigger_process_pending_referral_coach
AFTER INSERT ON coaches
FOR EACH ROW
EXECUTE FUNCTION process_pending_referral();

-- Add current_participants count to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0;

-- Function to update event participant count
CREATE OR REPLACE FUNCTION update_event_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
    UPDATE events
    SET current_participants = current_participants + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
      UPDATE events
      SET current_participants = current_participants + 1
      WHERE id = NEW.event_id;
    ELSIF OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
      UPDATE events
      SET current_participants = GREATEST(current_participants - 1, 0)
      WHERE id = NEW.event_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
    UPDATE events
    SET current_participants = GREATEST(current_participants - 1, 0)
    WHERE id = OLD.event_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_participants ON event_requests;
CREATE TRIGGER trigger_update_event_participants
AFTER INSERT OR UPDATE OR DELETE ON event_requests
FOR EACH ROW
EXECUTE FUNCTION update_event_participants();
