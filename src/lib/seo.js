/**
 * ARVELA SEO CONFIGURATION
 * Centralized SEO metadata for the entire application.
 */

export const SEO_CONFIG = {
    themeColor: '#FC7E12', // Arvela Orange (Primary)
    colorScheme: 'light',
    title: {
        default: 'Arvela: #1 Platform HRIS & Manajemen Rekrutmen Terintegrasi',
        template: '%s | Arvela HR'
    },
    description: 'Arvela adalah #1 Platform Manajemen HR Terintegrasi di Indonesia. Solusi lengkap HRIS, sistem rekrutmen cerdas, asesmen kandidat, ATS, dan absensi dalam satu ekosistem.',
    keywords: [
        'HRIS',
        'HRIS Indonesia',
        'Sistem Rekrutmen Terintegrasi',
        'Platform Asesmen Kandidat',
        'Manajemen HR Terintegrasi',
        'Sistem HRIS Terbaik',
        'Software Rekrutmen',
        'Applicant Tracking System Indonesia',
        'Manajemen Talenta Terintegrasi',
        'Sistem Absensi Online',
        'Manajemen Performa Karyawan',
        'Aplikasi HRD Indonesia'
    ],
    author: 'Arvela Team',
    url: 'https://arvela.id',
    og: {
        title: 'Arvela — #1 Platform HRIS & Rekrutmen Terintegrasi',
        description: 'Transformasi proses HR Anda dengan Arvela. Satu sistem manajemen talenta terintegrasi untuk rekrutmen, asesmen, absensi, hingga pengembangan karyawan.',
        type: 'website',
        locale: 'id_ID',
        siteName: 'Arvela HR',
        images: [
            {
                url: '/og-image.png', // User should replace this with actual image
                width: 1200,
                height: 630,
                alt: 'Arvela HRIS & Rekrutmen Terintegrasi'
            }
        ]
    },
    twitter: {
        handle: '@arvelahr',
        site: '@arvelahr',
        cardType: 'summary_large_image',
    },
    icons: {
        icon: '/icon.svg',
        apple: '/icon.svg',
    }
};

/**
 * Returns complete metadata object for Next.js
 */
export function getMetadata(overrides = {}) {
    const canonicalUrl = overrides.url || SEO_CONFIG.url;
    
    return {
        title: overrides.title || SEO_CONFIG.title.default,
        description: overrides.description || SEO_CONFIG.description,
        keywords: overrides.keywords || SEO_CONFIG.keywords.join(', '),
        authors: [{ name: SEO_CONFIG.author }],
        icons: SEO_CONFIG.icons,
        openGraph: {
            ...SEO_CONFIG.og,
            title: overrides.title || SEO_CONFIG.og.title,
            description: overrides.description || SEO_CONFIG.og.description,
            url: canonicalUrl,
            type: overrides.type || SEO_CONFIG.og.type,
            ...(overrides.openGraph || {})
        },
        twitter: {
            ...SEO_CONFIG.twitter,
            title: overrides.title || SEO_CONFIG.title.default,
            description: overrides.description || SEO_CONFIG.description,
        },
        alternates: {
            canonical: canonicalUrl,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}
