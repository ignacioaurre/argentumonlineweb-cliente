/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["pixi.js", "@pixi/core", "@pixi/display", "@pixi/ticker", "@pixi/utils"],
    sassOptions: {
        includePaths: ["./styles"]
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false
            };
        }
        return config;
    }
};

module.exports = nextConfig;
