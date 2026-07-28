-- Career page fields for company profile (tagline, about section, banner image)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS banner_url text;

-- Storage bucket for company banner uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('company-banners', 'company-banners', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view company banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-banners');

CREATE POLICY "Admin can manage company banners"
ON storage.objects FOR ALL
USING (bucket_id = 'company-banners' AND (SELECT is_admin()));
