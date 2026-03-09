import { createClient } from '@/lib/supabase/server'

export default async function sitemap() {
    const baseUrl = 'https://arvela.id';
    const supabase = await createClient();

    // 1. Fetch Dynamic Jobs (Published only)
    const { data: jobs } = await supabase
        .from('jobs')
        .select(`
            slug, 
            updated_at,
            companies ( slug )
        `)
        .eq('status', 'published');

    const jobRoutes = (jobs || []).map((job) => ({
        url: `${baseUrl}/${job.companies?.slug}/${job.slug}`,
        lastModified: new Date(job.updated_at || new Date()).toISOString().split('T')[0],
        changeFrequency: 'daily',
        priority: 0.7,
    }));

    // 2. Fetch Unique Companies
    const { data: companies } = await supabase
        .from('companies')
        .select('slug, created_at');

    const companyRoutes = (companies || []).map((company) => ({
        url: `${baseUrl}/${company.slug}`,
        lastModified: new Date(company.created_at).toISOString().split('T')[0],
        changeFrequency: 'weekly',
        priority: 0.6,
    }));

    // 3. Static Routes
    const staticRoutes = [
        '',
        '/login',
        '/register',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString().split('T')[0],
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.5,
    }));

    return [...staticRoutes, ...companyRoutes, ...jobRoutes];
}
