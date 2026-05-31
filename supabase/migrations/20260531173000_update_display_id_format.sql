-- 1. Rewrite the display ID generation logic to be structural (Narayana/Allen style)
CREATE OR REPLACE FUNCTION public.generate_unique_display_id(is_admin boolean DEFAULT false)
RETURNS text AS $$
DECLARE
  new_id text;
  done bool;
  attempts integer := 0;
  digit_count integer := 4;
  min_val bigint;
  max_val bigint;
  year_prefix text;
BEGIN
  -- Admin specific logic
  IF is_admin THEN
    done := false;
    WHILE NOT done LOOP
      -- Admins get ADM- followed by random numbers starting at 4 digits, expanding if exhausted
      min_val := power(10, digit_count - 1);
      max_val := power(10, digit_count) - 1;
      new_id := 'ADM-' || floor(random() * (max_val - min_val + 1) + min_val)::text;
      
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE display_id = new_id) THEN
        done := true;
      ELSE
        attempts := attempts + 1;
        IF attempts > 20 THEN
          digit_count := digit_count + 1;
          attempts := 0;
        END IF;
      END IF;
    END LOOP;
    RETURN new_id;
  END IF;

  -- Determine Year Prefix purely from the current date
  year_prefix := right(extract(year from current_date)::text, 2);

  -- Standard student logic: [Current Year] + JS + [Random digits] -> e.g., 26JS1234
  done := false;
  digit_count := 4; -- Reset digit count for student logic
  attempts := 0;
  WHILE NOT done LOOP
    min_val := power(10, digit_count - 1);
    max_val := power(10, digit_count) - 1;
    
    -- Structure: Year + JS + random digits
    new_id := year_prefix || 'JS' || floor(random() * (max_val - min_val + 1) + min_val)::text;
    
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE display_id = new_id) THEN
      done := true;
    ELSE
      attempts := attempts + 1;
      IF attempts > 20 THEN
        digit_count := digit_count + 1; -- Expands to 5 digits if full
        attempts := 0;
      END IF;
    END IF;
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Update the auth trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    display_id,
    phone
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    public.generate_unique_display_id(false),
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill existing users (defaulting to the current date year for all of them during migration)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, is_admin FROM public.profiles LOOP
    UPDATE public.profiles 
    SET display_id = public.generate_unique_display_id(COALESCE(r.is_admin, false))
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- 4. Drop the redundant column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS target_jee_year;

-- 5. Add a trigger to automatically assign a new ID format if a user's admin status changes
CREATE OR REPLACE FUNCTION public.handle_admin_status_change()
RETURNS trigger AS $$
BEGIN
  -- If is_admin was toggled, assign a new display_id corresponding to their new role
  IF old.is_admin IS DISTINCT FROM new.is_admin THEN
    new.display_id := public.generate_unique_display_id(new.is_admin);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_admin_status_change ON public.profiles;

CREATE TRIGGER on_profile_admin_status_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_status_change();
