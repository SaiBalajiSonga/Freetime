-- 1. Add new columns to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_id text UNIQUE,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS target_jee_year integer;

-- 2. Create a function to generate a random 6-character alphanumeric ID
CREATE OR REPLACE FUNCTION public.generate_unique_display_id()
RETURNS text AS $$
DECLARE
  new_id text;
  done bool;
BEGIN
  done := false;
  WHILE NOT done LOOP
    -- Generate a format like FT-A1B2C3
    -- using md5 of random value, taking first 6 chars and making it uppercase
    new_id := 'FT-' || upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if it exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE display_id = new_id) THEN
      done := true;
    END IF;
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Update the handle_new_user function to include display_id, phone, and target_jee_year
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    display_id,
    phone,
    target_jee_year
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    public.generate_unique_display_id(),
    new.raw_user_meta_data->>'phone',
    (new.raw_user_meta_data->>'target_jee_year')::integer
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Backfill existing users with a display_id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE display_id IS NULL LOOP
    UPDATE public.profiles 
    SET display_id = public.generate_unique_display_id() 
    WHERE id = r.id;
  END LOOP;
END;
$$;
