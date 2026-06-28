/** @type {import('next').NextConfig} */

// Deployed to GitHub Pages under https://<user>.github.io/t-mining-revamp/, so the
// app is served from a repo subpath. basePath/assetPrefix handle Next's own URLs;
// NEXT_PUBLIC_BASE_PATH exposes the same prefix to runtime code that builds raw
// asset URLs itself (the Three.js scene, <img> logos) since Next only auto-prefixes
// next/link and next/image — not plain strings.
const BASE_PATH = '/t-mining-revamp'

const nextConfig = {
  output: 'export', // fully static HTML export -> out/
  basePath: BASE_PATH,
  trailingSlash: true, // /nl/ -> /nl/index.html, friendlier on static hosts
  images: { unoptimized: true }, // no Image Optimization server on Pages
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
}

export default nextConfig
