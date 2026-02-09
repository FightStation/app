-- =====================================================
-- STORAGE BUCKETS SETUP FOR FIGHT STATION
-- =====================================================
-- Run this in your Supabase SQL Editor to create storage buckets
-- and set up access policies

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('event-photos', 'event-photos', true),
  ('gym-photos', 'gym-photos', true),
  ('fighter-photos', 'fighter-photos', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- AVATARS BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- =====================================================
-- EVENT PHOTOS BUCKET POLICIES
-- =====================================================

-- Allow gym owners to upload event photos for their events
CREATE POLICY "Gym owners can upload event photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow gym owners to update their event photos
CREATE POLICY "Gym owners can update event photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow gym owners to delete their event photos
CREATE POLICY "Gym owners can delete event photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to event photos
CREATE POLICY "Anyone can view event photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-photos');

-- =====================================================
-- GYM PHOTOS BUCKET POLICIES
-- =====================================================

-- Allow gyms to upload their photos
CREATE POLICY "Gyms can upload their photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gym-photos' AND
  EXISTS (
    SELECT 1 FROM gyms
    WHERE gyms.user_id = auth.uid()
    AND (storage.foldername(name))[1] = gyms.id::text
  )
);

-- Allow gyms to update their photos
CREATE POLICY "Gyms can update their photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gym-photos' AND
  EXISTS (
    SELECT 1 FROM gyms
    WHERE gyms.user_id = auth.uid()
    AND (storage.foldername(name))[1] = gyms.id::text
  )
);

-- Allow gyms to delete their photos
CREATE POLICY "Gyms can delete their photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gym-photos' AND
  EXISTS (
    SELECT 1 FROM gyms
    WHERE gyms.user_id = auth.uid()
    AND (storage.foldername(name))[1] = gyms.id::text
  )
);

-- Allow public read access to gym photos
CREATE POLICY "Anyone can view gym photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gym-photos');

-- =====================================================
-- FIGHTER PHOTOS BUCKET POLICIES
-- =====================================================

-- Allow fighters to upload their photos
CREATE POLICY "Fighters can upload their photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fighter-photos' AND
  EXISTS (
    SELECT 1 FROM fighters
    WHERE fighters.user_id = auth.uid()
    AND (storage.foldername(name))[1] = fighters.id::text
  )
);

-- Allow fighters to update their photos
CREATE POLICY "Fighters can update their photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'fighter-photos' AND
  EXISTS (
    SELECT 1 FROM fighters
    WHERE fighters.user_id = auth.uid()
    AND (storage.foldername(name))[1] = fighters.id::text
  )
);

-- Allow fighters to delete their photos
CREATE POLICY "Fighters can delete their photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'fighter-photos' AND
  EXISTS (
    SELECT 1 FROM fighters
    WHERE fighters.user_id = auth.uid()
    AND (storage.foldername(name))[1] = fighters.id::text
  )
);

-- Allow public read access to fighter photos
CREATE POLICY "Anyone can view fighter photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fighter-photos');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify buckets were created
SELECT * FROM storage.buckets;

-- Verify policies were created
SELECT * FROM pg_policies WHERE schemaname = 'storage';
