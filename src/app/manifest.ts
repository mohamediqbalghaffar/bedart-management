import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BedArt Management',
    short_name: 'BedArt',
    description: 'Management system for BedArt Group',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2B78C5',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
