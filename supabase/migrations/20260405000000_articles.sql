CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT,
    author_name TEXT,
    content TEXT NOT NULL,
    meta_title TEXT,
    meta_description TEXT,
    keywords TEXT[],
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- In case table already existed before, ensure new columns are added
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS author_name TEXT;

-- For auto-updating updated_at
DROP TRIGGER IF EXISTS handle_updated_at_articles ON public.articles;
CREATE TRIGGER handle_updated_at_articles
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- SUPER ADMIN has full access
DROP POLICY IF EXISTS "Super admin has full access to articles" ON public.articles;
CREATE POLICY "Super admin has full access to articles"
    ON public.articles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- PUBLIC can read published articles
DROP POLICY IF EXISTS "Public can view published articles" ON public.articles;
CREATE POLICY "Public can view published articles"
    ON public.articles
    FOR SELECT
    USING (status = 'published');
