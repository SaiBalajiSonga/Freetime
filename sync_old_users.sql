-- This script finds any users in the Supabase 'auth.users' table 
-- that do NOT have a corresponding row in your 'public.profiles' table,
-- and inserts them so they have a proper profile, name, and display_id.

INSERT INTO public.profiles (id, name, display_id, phone, target_jee_year, is_admin)
SELECT 
  id, 
  -- Fallback to the first part of their email if they don't have a name in metadata
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
  -- Generate their new Roll Number / Display ID
  public.generate_unique_display_id(),
  raw_user_meta_data->>'phone',
  (raw_user_meta_data->>'target_jee_year')::integer,
  false -- default to student
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
