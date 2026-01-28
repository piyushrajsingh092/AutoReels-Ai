-- AutoReels AI - User Profile Setup
-- Run this in Supabase SQL Editor

-- STEP 1: Find your user ID
-- First, let's see what users exist:
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- STEP 2: Create your profile manually
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from Step 1
INSERT INTO users_profile (user_id, name, plan, credits_remaining, timezone)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace this with your actual user ID
  'Piyush',             -- Your name
  'free',               -- Plan type
  50,                   -- Starting credits
  'Asia/Kolkata'        -- Your timezone
);

-- STEP 3: Create a trigger for automatic profile creation (RECOMMENDED)
-- This ensures every new signup automatically gets a profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_profile (user_id, name, plan, credits_remaining, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'free',
    50,
    'Asia/Kolkata'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Verify it worked
SELECT * FROM users_profile;
