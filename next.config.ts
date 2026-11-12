import path from 'node:path'
import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

const root = path.resolve(process.cwd())

export const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self), payment=(), usb=()' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
  staticPageGenerationTimeout: 300,
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  experimental: {
    globalNotFound: true,
  },
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  images: {
    formats: ['image/avif', 'image/webp'],
    localPatterns: [{ pathname: '/assets/**' }, { pathname: '/capsule/**' }],
  },
  sassOptions: {
    loadPaths: [path.join(root, 'styles')],
  },
  turbopack: {
    root,
  },
  outputFileTracingRoot: root,
}

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
})

export default withMDX(nextConfig)
