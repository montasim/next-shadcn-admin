import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
        localPatterns: [
            {
                pathname: '/api/proxy/image',
                search: '**', // ✅ allow any query string
            },
        ],
    },
    // Reduce memory usage during builds
    experimental: {
        // Optimize package imports to reduce bundle size
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-icons',
            '@tabler/icons-react',
            '@tanstack/react-table',
            'recharts',
        ],
        // Configure server actions for large file uploads (PDFs up to 30MB)
        serverActions: {
            bodySizeLimit: '30mb', // Increase from default 1mb to 30mb for pdf uploads
        },
    },

    middlewareClientMaxBodySize: "30mb", // ✅ THIS is the key fix

    // Optimize webpack configuration
    webpack: (config, { isServer }) => {
        // Reduce memory usage by splitting chunks more aggressively
        config.optimization = {
            ...config.optimization,
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    default: false,
                    vendors: false,
                    // Separate vendor chunks to reduce memory pressure
                    vendor: {
                        name: 'vendor',
                        chunks: 'all',
                        test: /node_modules/,
                        priority: 20,
                    },
                    // Separate React and related libraries
                    react: {
                        name: 'react',
                        chunks: 'all',
                        test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                        priority: 30,
                    },
                },
            },
            // Reduce memory usage during build
            minimize: !isServer,
        };

        // Limit parallel processing to reduce memory usage
        config.parallelism = 1;

        return config;
    },
    // Disable source maps in production to reduce memory usage
    productionBrowserSourceMaps: false,
};

export default nextConfig;
