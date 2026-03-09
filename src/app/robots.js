export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/admin/', '/dashboard/', '/staff/', '/assessment/'],
            },
        ],
        sitemap: 'https://arvela.id/sitemap.xml',
    };
}
