-- Editable work culture points and photo gallery for company career page
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS culture_points jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery_urls jsonb DEFAULT '[]'::jsonb;

-- Storage bucket for company gallery uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('company-gallery', 'company-gallery', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view company gallery"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-gallery');

CREATE POLICY "Admin can manage company gallery"
ON storage.objects FOR ALL
USING (bucket_id = 'company-gallery' AND (SELECT is_admin()));
