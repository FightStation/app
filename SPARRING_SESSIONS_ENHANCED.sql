-- =====================================================
-- ENHANCED SPARRING SESSIONS SYSTEM
-- =====================================================
-- This adds gym affiliation, location-based discovery,
-- coach event management, and event reviews
-- =====================================================

-- =====================================================
-- 1. GYM AFFILIATION FOR FIGHTERS
-- =====================================================

-- Add gym affiliation to fighters table
ALTER TABLE fighters
ADD COLUMN IF NOT EXISTS home_gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS affiliated_since DATE;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_fighters_home_gym ON fighters(home_gym_id);

-- =====================================================
-- 2. LOCATION DATA FOR GYMS
-- =====================================================

-- Add latitude/longitude for location-based search
ALTER TABLE gyms
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Index for location queries
CREATE INDEX IF NOT EXISTS idx_gyms_location ON gyms(latitude, longitude);

COMMENT ON COLUMN gyms.latitude IS 'Gym latitude for location-based search';
COMMENT ON COLUMN gyms.longitude IS 'Gym longitude for location-based search';

-- =====================================================
-- 3. ENHANCED EVENT FIELDS
-- =====================================================

-- Add fields to sparring_events table
ALTER TABLE sparring_events
ADD COLUMN IF NOT EXISTS created_by_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT, -- 'weekly', 'biweekly', 'monthly'
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sparring_events_coach ON sparring_events(created_by_coach_id);
CREATE INDEX IF NOT EXISTS idx_sparring_events_date_status ON sparring_events(event_date, status);

COMMENT ON COLUMN sparring_events.created_by_coach_id IS 'Coach who created the event (if created by coach)';
CREATE COMMENT ON COLUMN sparring_events.current_participants IS 'Number of approved participants';

-- =====================================================
-- 4. EVENT REVIEWS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES sparring_events(id) ON DELETE CASCADE,
  fighter_id UUID REFERENCES fighters(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
  facility_rating INTEGER CHECK (facility_rating >= 1 AND facility_rating <= 5),
  coaching_rating INTEGER CHECK (coaching_rating >= 1 AND coaching_rating <= 5),
  would_recommend BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, fighter_id) -- One review per fighter per event
);

-- Enable RLS
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view event reviews"
  ON event_reviews FOR SELECT
  USING (true);

CREATE POLICY "Fighters can create their own reviews"
  ON event_reviews FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM fighters WHERE id = fighter_id
    )
  );

CREATE POLICY "Fighters can update their own reviews"
  ON event_reviews FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM fighters WHERE id = fighter_id
    )
  );

CREATE POLICY "Fighters can delete their own reviews"
  ON event_reviews FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM fighters WHERE id = fighter_id
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_reviews_event ON event_reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_fighter ON event_reviews(fighter_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_rating ON event_reviews(rating);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_event_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_reviews_updated_at
  BEFORE UPDATE ON event_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_event_reviews_updated_at();

-- =====================================================
-- 5. EVENT ATTENDANCE TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES sparring_events(id) ON DELETE CASCADE,
  fighter_id UUID REFERENCES fighters(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  no_show BOOLEAN DEFAULT false,
  no_show_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, fighter_id)
);

-- Enable RLS
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Gym owners can manage attendance for their events"
  ON event_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sparring_events se
      JOIN gyms g ON se.gym_id = g.id
      WHERE se.id = event_id AND g.user_id = auth.uid()
    )
  );

CREATE POLICY "Fighters can view their own attendance"
  ON event_attendance FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM fighters WHERE id = fighter_id
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_attendance_event ON event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_fighter ON event_attendance(fighter_id);

-- =====================================================
-- 6. NOTIFICATION TRIGGERS FOR EVENTS
-- =====================================================

-- Function to notify fighters about new events at their home gym
CREATE OR REPLACE FUNCTION notify_home_gym_fighters_new_event()
RETURNS TRIGGER AS $$
BEGIN
  -- This would send notifications to fighters affiliated with the gym
  -- In practice, this should call an Edge Function to send push notifications

  INSERT INTO notification_history (user_id, notification_type, title, body, data)
  SELECT
    f.user_id,
    'event',
    'New Event at Your Gym',
    'A new ' || NEW.event_type || ' event has been scheduled: ' || NEW.title,
    jsonb_build_object('eventId', NEW.id, 'type', 'event')
  FROM fighters f
  WHERE f.home_gym_id = NEW.gym_id
    AND f.user_id IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new events
DROP TRIGGER IF EXISTS trigger_notify_home_gym_fighters ON sparring_events;
CREATE TRIGGER trigger_notify_home_gym_fighters
  AFTER INSERT ON sparring_events
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION notify_home_gym_fighters_new_event();

-- Function to update participant count
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE sparring_events
    SET current_participants = current_participants + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
    UPDATE sparring_events
    SET current_participants = current_participants + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE sparring_events
    SET current_participants = GREATEST(current_participants - 1, 0)
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE sparring_events
    SET current_participants = GREATEST(current_participants - 1, 0)
    WHERE id = OLD.event_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update participant count
DROP TRIGGER IF EXISTS trigger_update_event_participant_count ON event_requests;
CREATE TRIGGER trigger_update_event_participant_count
  AFTER INSERT OR UPDATE OR DELETE ON event_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_event_participant_count();

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to get average rating for an event
CREATE OR REPLACE FUNCTION get_event_average_rating(event_uuid UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(AVG(rating), 0)
  FROM event_reviews
  WHERE event_id = event_uuid;
$$ LANGUAGE SQL;

-- Function to get review count for an event
CREATE OR REPLACE FUNCTION get_event_review_count(event_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM event_reviews
  WHERE event_id = event_uuid;
$$ LANGUAGE SQL;

-- Function to check if fighter can review event (must have attended)
CREATE OR REPLACE FUNCTION can_review_event(
  p_event_id UUID,
  p_fighter_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM event_requests er
    JOIN sparring_events se ON er.event_id = se.id
    WHERE er.event_id = p_event_id
      AND er.fighter_id = p_fighter_id
      AND er.status = 'approved'
      AND se.event_date < CURRENT_DATE -- Event must have passed
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for events with ratings and participant counts
CREATE OR REPLACE VIEW events_with_ratings AS
SELECT
  se.*,
  g.name as gym_name,
  g.city as gym_city,
  g.country as gym_country,
  g.latitude as gym_latitude,
  g.longitude as gym_longitude,
  COALESCE(AVG(er.rating), 0) as average_rating,
  COUNT(DISTINCT er.id) as review_count,
  se.current_participants
FROM sparring_events se
JOIN gyms g ON se.gym_id = g.id
LEFT JOIN event_reviews er ON se.id = er.event_id
GROUP BY se.id, g.name, g.city, g.country, g.latitude, g.longitude;

COMMENT ON VIEW events_with_ratings IS 'Events with gym details, ratings, and participant counts';

-- =====================================================
-- 9. COACH PERMISSIONS
-- =====================================================

-- Allow coaches to create events for their gym
CREATE POLICY "Coaches can create events for their gym"
  ON sparring_events FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM coaches WHERE gym_id = sparring_events.gym_id
    )
  );

-- Allow coaches to update events they created
CREATE POLICY "Coaches can update their own events"
  ON sparring_events FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM coaches WHERE id = created_by_coach_id
    )
    OR
    auth.uid() IN (
      SELECT user_id FROM gyms WHERE id = gym_id
    )
  );

-- Allow coaches to view event requests for their gym
CREATE POLICY "Coaches can view event requests for their gym"
  ON event_requests FOR SELECT
  USING (
    auth.uid() IN (
      SELECT c.user_id
      FROM coaches c
      JOIN sparring_events se ON c.gym_id = se.gym_id
      WHERE se.id = event_id
    )
  );

-- Allow coaches to approve/reject requests
CREATE POLICY "Coaches can manage event requests for their gym"
  ON event_requests FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT c.user_id
      FROM coaches c
      JOIN sparring_events se ON c.gym_id = se.gym_id
      WHERE se.id = event_id
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE event_reviews IS 'Fighter reviews for sparring events';
COMMENT ON TABLE event_attendance IS 'Track fighter attendance at events';
COMMENT ON COLUMN fighters.home_gym_id IS 'Fighter primary/home gym for notifications';
COMMENT ON COLUMN sparring_events.created_by_coach_id IS 'Coach who created this event (if applicable)';

-- =====================================================
-- DONE
-- =====================================================
-- To use this system:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Update gym locations (latitude/longitude) via geocoding
-- 3. Fighters can set their home gym in profile
-- 4. Coaches can create events for their gym
-- 5. Fighters get notified about events at their home gym
-- 6. After events, fighters can leave reviews
-- =====================================================
