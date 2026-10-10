/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '4mb',
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: '*.public.blob.vercel-storage.com',
            },
        ],
    },
    poweredByHeader: false,
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(self), browsing-topics=()',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data: https://va.vercel-scripts.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; worker-src 'self' blob: data: https://cdn.jsdelivr.net; media-src 'self' blob: data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://vitals.vercel-insights.com wss://api.elevenlabs.io https://api.elevenlabs.io wss://generativelanguage.googleapis.com https://generativelanguage.googleapis.com https://cdn.jsdelivr.net; frame-src 'self' https://www.youtube.com; frame-ancestors 'self';",
                    }
                ],
            },
        ];
    },
};

export default nextConfig;
