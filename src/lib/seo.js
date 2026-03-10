/**
 * ARVELA SEO CONFIGURATION
 * Centralized SEO metadata for the entire application.
 */

export const SEO_CONFIG = {
    title: {
        default: 'Arvela: HRIS & Talent Management System Terbaik Indonesia',
        template: '%s | Arvela HR'
    },
    description: 'Platform HRIS Terintegrasi: ATS, Onboarding, Absensi GPS & OKR. Solusi modern untuk rekrutmen dan manajemen performa karyawan Indonesia.',
    keywords: [
        'HRIS Indonesia',
        'Applicant Tracking System Indonesia',
        'Software Rekrutmen',
        'ATS Indonesia',
        'Sistem Absensi Online',
        'Manajemen Performa Karyawan',
        'OKR Software',
        'Onboarding Karyawan',
        'Mekari Talenta Alternative',
        'Talentics Alternative',
        'Software HR Modern',
        'Manajemen Talenta'
    ],
    author: 'Arvela Team',
    url: 'https://arvela.id',
    og: {
        title: 'Arvela — Solusi HR & Talent Management Terintegrasi',
        description: 'Transformasi proses HR Anda dengan Arvela. Satu sistem untuk rekrutmen, absensi, dan pengembangan karyawan.',
        type: 'website',
        locale: 'id_ID',
        siteName: 'Arvela HR',
        images: [
            {
                url: '/og-image.png', // User should replace this with actual image
                width: 1200,
                height: 630,
                alt: 'Arvela HRIS & ATS Indonesia'
            }
        ]
    },
    twitter: {
        handle: '@arvelahr',
        site: '@arvelahr',
        cardType: 'summary_large_image',
    }
};

/**
 * Returns complete metadata object for Next.js
 */
export function getMetadata(overrides = {}) {
    return {
        title: overrides.title || SEO_CONFIG.title.default,
        description: overrides.description || SEO_CONFIG.description,
        keywords: overrides.keywords || SEO_CONFIG.keywords.join(', '),
        authors: [{ name: SEO_CONFIG.author }],
        openGraph: {
            ...SEO_CONFIG.og,
            title: overrides.title || SEO_CONFIG.og.title,
            description: overrides.description || SEO_CONFIG.og.description,
        },
        twitter: {
            ...SEO_CONFIG.twitter,
            title: overrides.title || SEO_CONFIG.title.default,
            description: overrides.description || SEO_CONFIG.description,
        },
        alternates: {
            canonical: SEO_CONFIG.url,
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
