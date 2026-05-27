CREATE TABLE public.announcements (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_read_announcement timestamp with time zone;

-- RLS POLICIES
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Public Read Access for announcements
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admin write announcements" ON public.announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
