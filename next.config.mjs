/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Turbopack configuration
  turbopack: {
    root: process.cwd(),
  },
  
  // Experimental performance features optimized for Turbopack
  experimental: {
    optimizePackageImports: [
      'react-icons',
      'framer-motion',
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },
  
  // Disable typed routes
  typedRoutes: false,

  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;

