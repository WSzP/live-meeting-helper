import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://live-meeting-helper.vercel.app'),
  title: 'Live Meeting Helper',
  description: 'Real-time meeting transcription with Google Cloud Speech-to-Text',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'Live Meeting Helper',
  },
  openGraph: {
    title: 'Live Meeting Helper',
    description: 'Real-time meeting transcription with Google Cloud Speech-to-Text',
    type: 'website',
    images: [
      {
        url: '/lmh-open-graph.png',
        width: 1200,
        height: 630,
        alt: 'Live Meeting Helper',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Meeting Helper',
    description: 'Real-time meeting transcription with Google Cloud Speech-to-Text',
    images: ['/lmh-open-graph.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
