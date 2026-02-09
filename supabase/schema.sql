-- Fight Station Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse order due to foreign keys)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS event_requests CASCADE;
DROP TABLE IF EXISTS sparring_events CASCADE;
DROP TABLE IF EXISTS coaches CASCADE;
DROP TABLE IF EXISTS fighters CASCADE;
DROP TABLE IF EXISTS gyms CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_participant_count CASCADE;

-- User Roles Table
CREATE TABLE user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('fighter', 'gym', 'coach')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gyms Table
CREATE TABLE gyms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    logo_url TEXT,
    photos TEXT[] DEFAULT '{}',
    facilities TEXT[] DEFAULT '{}',
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fighters Table
CREATE TABLE fighters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    weight_class TEXT NOT NULL,
    experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
    gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
    bio TEXT,
    avatar_url TEXT,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    fights_count INTEGER DEFAULT 0,
    sparring_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaches Table
CREATE TABLE coaches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    specializations TEXT[] DEFAULT '{}',
    years_experience INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sparring Events Table
CREATE TABLE sparring_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    weight_classes TEXT[] NOT NULL,
    max_participants INTEGER NOT NULL DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    experience_levels TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'full', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Requests Table
CREATE TABLE event_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES sparring_events(id) ON DELETE CASCADE NOT NULL,
    fighter_id UUID REFERENCES fighters(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, fighter_id)
);

-- Conversations Table
CREATE TABLE conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    participant_ids UUID[] NOT NULL,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages Table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_fighters_gym_id ON fighters(gym_id);
CREATE INDEX idx_fighters_weight_class ON fighters(weight_class);
CREATE INDEX idx_fighters_country ON fighters(country);
CREATE INDEX idx_coaches_gym_id ON coaches(gym_id);
CREATE INDEX idx_sparring_events_gym_id ON sparring_events(gym_id);
CREATE INDEX idx_sparring_events_event_date ON sparring_events(event_date);
CREATE INDEX idx_sparring_events_status ON sparring_events(status);
CREATE INDEX idx_event_requests_event_id ON event_requests(event_id);
CREATE INDEX idx_event_requests_fighter_id ON event_requests(fighter_id);
CREATE INDEX idx_event_requests_status ON event_requests(status);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_gyms_country ON gyms(country);
CREATE INDEX idx_gyms_city ON gyms(city);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighters ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sparring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- User Roles Policies
CREATE POLICY "Users can view own role" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role" ON user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own role" ON user_roles
    FOR UPDATE USING (auth.uid() = user_id);

-- Gyms Policies
CREATE POLICY "Gyms are viewable by everyone" ON gyms
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own gym" ON gyms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gym" ON gyms
    FOR UPDATE USING (auth.uid() = user_id);

-- Fighters Policies
CREATE POLICY "Fighters are viewable by everyone" ON fighters
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own fighter profile" ON fighters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fighter profile" ON fighters
    FOR UPDATE USING (auth.uid() = user_id);

-- Coaches Policies
CREATE POLICY "Coaches are viewable by everyone" ON coaches
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own coach profile" ON coaches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coach profile" ON coaches
    FOR UPDATE USING (auth.uid() = user_id);

-- Sparring Events Policies
CREATE POLICY "Published events are viewable by everyone" ON sparring_events
    FOR SELECT USING (status = 'published' OR gym_id IN (
        SELECT id FROM gyms WHERE user_id = auth.uid()
    ));

CREATE POLICY "Gym owners can insert events" ON sparring_events
    FOR INSERT WITH CHECK (gym_id IN (
        SELECT id FROM gyms WHERE user_id = auth.uid()
    ));

CREATE POLICY "Gym owners can update their events" ON sparring_events
    FOR UPDATE USING (gym_id IN (
        SELECT id FROM gyms WHERE user_id = auth.uid()
    ));

CREATE POLICY "Gym owners can delete their events" ON sparring_events
    FOR DELETE USING (gym_id IN (
        SELECT id FROM gyms WHERE user_id = auth.uid()
    ));

-- Event Requests Policies
CREATE POLICY "Users can view their own requests" ON event_requests
    FOR SELECT USING (
        fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid())
        OR event_id IN (
            SELECT se.id FROM sparring_events se
            JOIN gyms g ON se.gym_id = g.id
            WHERE g.user_id = auth.uid()
        )
    );

CREATE POLICY "Fighters can insert requests" ON event_requests
    FOR INSERT WITH CHECK (fighter_id IN (
        SELECT id FROM fighters WHERE user_id = auth.uid()
    ));

CREATE POLICY "Fighters can update their own requests" ON event_requests
    FOR UPDATE USING (
        fighter_id IN (SELECT id FROM fighters WHERE user_id = auth.uid())
        OR event_id IN (
            SELECT se.id FROM sparring_events se
            JOIN gyms g ON se.gym_id = g.id
            WHERE g.user_id = auth.uid()
        )
    );

CREATE POLICY "Fighters can delete their own requests" ON event_requests
    FOR DELETE USING (fighter_id IN (
        SELECT id FROM fighters WHERE user_id = auth.uid()
    ));

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_gyms_updated_at
    BEFORE UPDATE ON gyms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_fighters_updated_at
    BEFORE UPDATE ON fighters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_coaches_updated_at
    BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sparring_events_updated_at
    BEFORE UPDATE ON sparring_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_requests_updated_at
    BEFORE UPDATE ON event_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update participant count when request is approved
CREATE OR REPLACE FUNCTION update_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        UPDATE sparring_events
        SET current_participants = current_participants + 1
        WHERE id = NEW.event_id;
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
        UPDATE sparring_events
        SET current_participants = GREATEST(0, current_participants - 1)
        WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_participants
    AFTER INSERT OR UPDATE ON event_requests
    FOR EACH ROW EXECUTE FUNCTION update_participant_count();
