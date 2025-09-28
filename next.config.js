/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.apitcg.com', 'optcg-api.ryanmichaelhirst.us', 'onepiece-tcg-api.herokuapp.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig
