/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    transpilePackages: ['@thesysai/genui-sdk', '@crayonai/react-ui', '@crayonai/react-core'],

    // Optimize build performance
    experimental: {
        optimizePackageImports: [
            '@thesysai/genui-sdk',
            '@crayonai/react-ui',
            '@crayonai/react-core',
            '@radix-ui/react-icons',
            'lucide-react'
        ],
    },

    // Webpack optimizations (only used in non-Turbopack mode)
    webpack: (config, { dev, isServer }) => {
        // Enable filesystem caching for faster rebuilds
        config.cache = {
            type: 'filesystem',
            buildDependencies: {
                config: [__filename],
            },
        };

        // Reduce source map generation in development
        if (dev) {
            config.devtool = 'eval-cheap-module-source-map';
        }

        return config;
    },

    // Faster page loading
    poweredByHeader: false,
    compress: true,

    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
