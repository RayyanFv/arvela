export default function sitemap() {
    const baseUrl = 'https://arvela.id';

    // In a real app, you might fetch dynamic routes (jobs, blog posts) here
    const routes = [
        '',
        '/login',
        '/register',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString().split('T')[0],
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
    }));

    return routes;
}
