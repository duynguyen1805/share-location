/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['172.16.130.0'],
  images: {
    domains: ['lh3.googleusercontent.com', 'www.google.com'], // Cho phép tải ảnh từ Google
  },
}

module.exports = nextConfig 