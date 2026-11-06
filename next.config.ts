import path from 'node:path'
import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

const root = path.resolve(process.cwd())

const nextConfig: NextConfig = {
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
