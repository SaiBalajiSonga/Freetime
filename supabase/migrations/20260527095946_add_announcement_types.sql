ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'General Info',
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Normal';
