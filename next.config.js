/** @type {import('next').NextConfig} */

const path = require('path')

module.exports = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(__dirname, 'sass')],
  },
  compress: true,
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.VERCEL_URL
  },
}

