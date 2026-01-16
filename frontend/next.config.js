/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    swcMinify: true,
    
    // Enable experimental features for faster builds
    experimental: {
        // Optimize package imports
        optimizePackageImports: [
            '@thesysai/genui-sdk',
            '@crayonai/react-ui',
            '@crayonai/react-core',
            '@radix-ui/react-icons',
            'lucide-react',
        ],
    },
    
    images: {
        unoptimized: true,
    },
    
    // Webpack optimizations
    webpack: (config, { dev, isServer }) => {
        // Enable filesystem caching for faster rebuilds
        if (dev) {
            config.cache = {
                type: 'filesystem',
                buildDependencies: {
                    config: [__filename],
                },
            };
            
            // Faster rebuilds in development
            if (!isServer) {
                config.optimization = {
                    ...config.optimization,
                    removeAvailableModules: false,
                    removeEmptyChunks: false,
                    splitChunks: false,
                };
            }
        }
        return config;
    },
};

module.exports = nextConfig;
