-- Add notification_settings to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{"tests": true, "materials": true, "ranks": true, "general": true}'::jsonb;

-- Create study_materials table
CREATE TABLE IF NOT EXISTS public.study_materials (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for study_materials
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read study_materials" ON public.study_materials 
FOR SELECT USING (true);

CREATE POLICY "Admin write study_materials" ON public.study_materials 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Function to automate test announcement
CREATE OR REPLACE FUNCTION public.handle_new_test_announcement()
RETURNS trigger AS $$
BEGIN
  -- Insert into announcements when a new weekly exam/test is created
  -- (Assuming you insert into some table when a test is released. Since we don't have an exams table,
  -- this function can be used later or called via RPC)
  INSERT INTO public.announcements (title, message, type)
  VALUES ('New Test Available', 'A new test has been released. Good luck!', 'Test');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
