export default function robots() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://arvela.id';
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/admin/', '/dashboard/', '/staff/', '/assessment/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
