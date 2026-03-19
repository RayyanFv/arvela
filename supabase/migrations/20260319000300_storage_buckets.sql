-- Create Storage Buckets for Recruitment Documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recruitment-docs', 'recruitment-docs', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for Buckets
CREATE POLICY "Public can view recruitment documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'recruitment-docs');

CREATE POLICY "Admin can manage recruitment documents"
ON storage.objects FOR ALL
USING (bucket_id = 'recruitment-docs' AND (SELECT is_admin()));
