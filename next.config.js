/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    unoptimized: false,
  },
  webpack: (config, { isServer }) => {
    // Exclure les fichiers problématiques de TensorFlow.js Node.js côté client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
      
      // Exclure complètement @tensorflow/tfjs-node côté client
      config.externals = config.externals || []
      config.externals.push({
        '@tensorflow/tfjs-node': 'commonjs @tensorflow/tfjs-node',
      })
      
      // Ignorer les modules problématiques
      config.resolve.alias = {
        ...config.resolve.alias,
        '@tensorflow/tfjs-node': false,
      }
    }
    
    // Ignorer les fichiers HTML dans node_modules (comme ceux de @mapbox/node-pre-gyp)
    config.module.rules.push({
      test: /\.html$/,
      include: /node_modules/,
      use: 'ignore-loader',
    })
    
    // Ignorer les modules optionnels de node-pre-gyp
    config.module.rules.push({
      test: /node-pre-gyp/,
      use: 'ignore-loader',
    })
    
    return config
  },
}

module.exports = nextConfig
